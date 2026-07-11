import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { LogOut, Package, Clock, User, Phone, Mail, RefreshCcw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatEUR } from "@/lib/cart-store";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin")({
  component: AdminDashboard,
});

const STATUSES = [
  { key: "nieuw", label: "Nieuw" },
  { key: "in_bereiding", label: "In bereiding" },
  { key: "gereed", label: "Gereed" },
  { key: "afgehaald", label: "Afgehaald" },
  { key: "geannuleerd", label: "Geannuleerd" },
] as const;

type OrderRow = {
  id: string;
  order_number: number;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  pickup_time: string;
  status: string;
  total_cents: number;
  notes: string | null;
  created_at: string;
};

async function fetchOrders(): Promise<OrderRow[]> {
  const { data, error } = await supabase
    .from("orders")
    .select("id, order_number, customer_name, customer_email, customer_phone, pickup_time, status, total_cents, notes, created_at")
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw error;
  return data ?? [];
}

async function fetchOrderItems(orderId: string) {
  const { data, error } = await supabase
    .from("order_items")
    .select("id, product_name, quantity, unit_price_cents, line_total_cents, notes")
    .eq("order_id", orderId);
  if (error) throw error;
  return data ?? [];
}

function AdminDashboard() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<string>("all");

  const { data: orders = [], isLoading, refetch } = useQuery({
    queryKey: ["admin", "orders"],
    queryFn: fetchOrders,
    refetchInterval: 15000,
  });

  // Realtime updates
  useEffect(() => {
    const channel = supabase
      .channel("orders-admin")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => {
        qc.invalidateQueries({ queryKey: ["admin", "orders"] });
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [qc]);

  const updateStatus = useMutation({
    mutationFn: async (vars: { id: string; status: string }) => {
      const { error } = await supabase
        .from("orders")
        .update({ status: vars.status })
        .eq("id", vars.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "orders"] });
      toast.success("Status bijgewerkt");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const signOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  const filtered = filter === "all" ? orders : orders.filter((o) => o.status === filter);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold text-primary">
            Bestellingen dashboard
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Live overzicht van inkomende bestellingen. Ververst automatisch.
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            to="/"
            className="rounded-full border border-input bg-background px-4 py-2 text-sm hover:bg-accent"
          >
            Naar website
          </Link>
          <button
            onClick={() => refetch()}
            className="inline-flex items-center gap-2 rounded-full border border-input bg-background px-4 py-2 text-sm hover:bg-accent"
          >
            <RefreshCcw className="h-4 w-4" /> Vernieuwen
          </button>
          <button
            onClick={signOut}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90"
          >
            <LogOut className="h-4 w-4" /> Uitloggen
          </button>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        <button
          onClick={() => setFilter("all")}
          className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
            filter === "all"
              ? "bg-primary text-primary-foreground"
              : "border border-border bg-background text-foreground hover:bg-secondary"
          }`}
        >
          Alle ({orders.length})
        </button>
        {STATUSES.map((s) => {
          const count = orders.filter((o) => o.status === s.key).length;
          return (
            <button
              key={s.key}
              onClick={() => setFilter(s.key)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                filter === s.key
                  ? "bg-primary text-primary-foreground"
                  : "border border-border bg-background text-foreground hover:bg-secondary"
              }`}
            >
              {s.label} ({count})
            </button>
          );
        })}
      </div>

      <div className="mt-6 grid gap-4">
        {isLoading && <p className="text-muted-foreground">Laden…</p>}
        {!isLoading && filtered.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border p-12 text-center">
            <Package className="mx-auto h-10 w-10 text-muted-foreground/50" />
            <p className="mt-3 text-muted-foreground">Geen bestellingen in deze filter.</p>
          </div>
        )}
        {filtered.map((o) => (
          <OrderCard key={o.id} order={o} onStatusChange={(status) => updateStatus.mutate({ id: o.id, status })} />
        ))}
      </div>
    </div>
  );
}

function OrderCard({
  order,
  onStatusChange,
}: {
  order: OrderRow;
  onStatusChange: (status: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const { data: items } = useQuery({
    queryKey: ["admin", "order-items", order.id],
    queryFn: () => fetchOrderItems(order.id),
    enabled: expanded,
  });

  const badgeClass =
    order.status === "nieuw"
      ? "bg-[var(--brand-gold)]/20 text-[var(--brand-gold)]"
      : order.status === "in_bereiding"
        ? "bg-blue-100 text-blue-700"
        : order.status === "gereed"
          ? "bg-green-100 text-green-700"
          : order.status === "afgehaald"
            ? "bg-muted text-muted-foreground"
            : "bg-destructive/10 text-destructive";

  return (
    <article className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full p-5 text-left transition-colors hover:bg-secondary/30"
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <span className="font-display text-xl font-bold text-primary">
                #{order.order_number}
              </span>
              <span className={`rounded-full px-3 py-0.5 text-xs font-semibold ${badgeClass}`}>
                {STATUSES.find((s) => s.key === order.status)?.label ?? order.status}
              </span>
            </div>
            <div className="mt-2 grid gap-1 text-sm text-muted-foreground sm:grid-cols-2">
              <span className="flex items-center gap-1.5">
                <User className="h-3.5 w-3.5" /> {order.customer_name}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                {new Date(order.pickup_time).toLocaleString("nl-NL", {
                  day: "2-digit",
                  month: "2-digit",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
              <span className="flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5" /> {order.customer_phone}
              </span>
              <span className="flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5" /> {order.customer_email}
              </span>
            </div>
          </div>
          <span className="font-display text-2xl font-bold text-primary">
            {formatEUR(order.total_cents)}
          </span>
        </div>
      </button>

      {expanded && (
        <div className="border-t border-border/60 bg-secondary/20 p-5">
          <div className="mb-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Items
            </p>
            <ul className="space-y-1 text-sm">
              {items?.map((i) => (
                <li key={i.id} className="flex justify-between">
                  <span>
                    {i.quantity}× {i.product_name}
                  </span>
                  <span>{formatEUR(i.line_total_cents)}</span>
                </li>
              ))}
            </ul>
          </div>
          {order.notes && (
            <p className="mb-4 rounded-xl bg-background p-3 text-sm">
              <strong>Opmerking:</strong> {order.notes}
            </p>
          )}
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Status wijzigen
            </p>
            <div className="flex flex-wrap gap-2">
              {STATUSES.map((s) => (
                <button
                  key={s.key}
                  onClick={() => onStatusChange(s.key)}
                  disabled={order.status === s.key}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                    order.status === s.key
                      ? "bg-primary text-primary-foreground"
                      : "border border-border bg-background hover:bg-secondary"
                  } disabled:cursor-not-allowed`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </article>
  );
}
