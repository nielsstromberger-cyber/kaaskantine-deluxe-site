import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import {
  LogOut,
  Package,
  Clock,
  User,
  Phone,
  Mail,
  RefreshCcw,
  CalendarDays,
  MessageSquare,
  Utensils,
  Users as UsersIcon,
  ShieldAlert,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatEUR } from "@/lib/cart-store";
import { toast } from "sonner";
import { useRoles, type AppRole } from "@/hooks/use-roles";

export const Route = createFileRoute("/_authenticated/admin")({
  component: AdminDashboard,
});

const STATUSES = [
  { key: "nieuw", label: "Nieuw" },
  { key: "bereiding", label: "In bereiding" },
  { key: "gereed", label: "Gereed" },
  { key: "afgeleverd", label: "Afgehaald" },
  { key: "geannuleerd", label: "Geannuleerd" },
] as const;
type OrderStatus = (typeof STATUSES)[number]["key"];

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

type TabKey = "orders" | "reservations" | "messages" | "products" | "users";

function AdminDashboard() {
  const { roles, isAdmin, isManager, isEmployee, isStaff, loading } = useRoles();
  const [tab, setTab] = useState<TabKey>("orders");

  const signOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-20 text-center text-muted-foreground">
        Laden…
      </div>
    );
  }

  if (!isStaff) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20">
        <div className="rounded-3xl border border-destructive/30 bg-destructive/5 p-8 text-center">
          <ShieldAlert className="mx-auto h-10 w-10 text-destructive" />
          <h1 className="mt-4 font-display text-2xl font-semibold text-primary">
            Geen toegang
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Je account heeft nog geen personeelsrol. Vraag een admin om je een rol
            toe te wijzen (admin, manager of employee).
          </p>
          <button
            onClick={signOut}
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90"
          >
            <LogOut className="h-4 w-4" /> Uitloggen
          </button>
        </div>
      </div>
    );
  }

  const tabs: { key: TabKey; label: string; icon: typeof Package; visible: boolean }[] = [
    { key: "orders", label: "Bestellingen", icon: Package, visible: true },
    { key: "reservations", label: "Reserveringen", icon: CalendarDays, visible: isAdmin || isManager },
    { key: "messages", label: "Berichten", icon: MessageSquare, visible: isAdmin || isManager },
    { key: "products", label: "Producten", icon: Utensils, visible: isAdmin },
    { key: "users", label: "Gebruikers", icon: UsersIcon, visible: isAdmin },
  ];

  const visibleTabs = tabs.filter((t) => t.visible);
  const activeTab = visibleTabs.find((t) => t.key === tab) ? tab : "orders";
  const canEditOrders = isAdmin || isManager;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold text-primary">
            Beheerdersdashboard
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Ingelogd als {roles.length ? roles.join(", ") : "gebruiker"}.
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
            onClick={signOut}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90"
          >
            <LogOut className="h-4 w-4" /> Uitloggen
          </button>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-2 border-b border-border pb-3">
        {visibleTabs.map((t) => {
          const Icon = t.icon;
          const active = activeTab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                active
                  ? "bg-primary text-primary-foreground"
                  : "border border-border bg-background text-foreground hover:bg-secondary"
              }`}
            >
              <Icon className="h-4 w-4" /> {t.label}
            </button>
          );
        })}
      </div>

      <div className="mt-6">
        {activeTab === "orders" && <OrdersView canEdit={canEditOrders} readonly={isEmployee && !canEditOrders} />}
        {activeTab === "reservations" && <ReservationsView />}
        {activeTab === "messages" && <MessagesView canDelete={isAdmin} />}
        {activeTab === "products" && <ProductsView />}
        {activeTab === "users" && <UsersView />}
      </div>
    </div>
  );
}

/* ---------------- Orders ---------------- */

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

function OrdersView({ canEdit, readonly }: { canEdit: boolean; readonly: boolean }) {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<string>("all");

  const { data: orders = [], isLoading, refetch } = useQuery({
    queryKey: ["admin", "orders"],
    queryFn: fetchOrders,
    refetchInterval: 15000,
  });

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
    mutationFn: async (vars: { id: string; status: OrderStatus }) => {
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

  const filtered = filter === "all" ? orders : orders.filter((o) => o.status === filter);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilter("all")}
            className={pillCls(filter === "all")}
          >
            Alle ({orders.length})
          </button>
          {STATUSES.map((s) => {
            const count = orders.filter((o) => o.status === s.key).length;
            return (
              <button key={s.key} onClick={() => setFilter(s.key)} className={pillCls(filter === s.key)}>
                {s.label} ({count})
              </button>
            );
          })}
        </div>
        <button
          onClick={() => refetch()}
          className="inline-flex items-center gap-2 rounded-full border border-input bg-background px-4 py-2 text-sm hover:bg-accent"
        >
          <RefreshCcw className="h-4 w-4" /> Vernieuwen
        </button>
      </div>

      {readonly && (
        <p className="mt-3 text-xs text-muted-foreground">
          Alleen-lezen: je hebt inzage in bestellingen maar kan geen status wijzigen.
        </p>
      )}

      <div className="mt-6 grid gap-4">
        {isLoading && <p className="text-muted-foreground">Laden…</p>}
        {!isLoading && filtered.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border p-12 text-center">
            <Package className="mx-auto h-10 w-10 text-muted-foreground/50" />
            <p className="mt-3 text-muted-foreground">Geen bestellingen in deze filter.</p>
          </div>
        )}
        {filtered.map((o) => (
          <OrderCard
            key={o.id}
            order={o}
            canEdit={canEdit}
            onStatusChange={(status) => updateStatus.mutate({ id: o.id, status })}
          />
        ))}
      </div>
    </div>
  );
}

function OrderCard({
  order,
  canEdit,
  onStatusChange,
}: {
  order: OrderRow;
  canEdit: boolean;
  onStatusChange: (status: OrderStatus) => void;
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
      : order.status === "bereiding"
        ? "bg-blue-100 text-blue-700"
        : order.status === "gereed"
          ? "bg-green-100 text-green-700"
          : order.status === "afgeleverd"
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
              <span className="font-display text-xl font-bold text-primary">#{order.order_number}</span>
              <span className={`rounded-full px-3 py-0.5 text-xs font-semibold ${badgeClass}`}>
                {STATUSES.find((s) => s.key === order.status)?.label ?? order.status}
              </span>
            </div>
            <div className="mt-2 grid gap-1 text-sm text-muted-foreground sm:grid-cols-2">
              <span className="flex items-center gap-1.5"><User className="h-3.5 w-3.5" /> {order.customer_name}</span>
              <span className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                {new Date(order.pickup_time).toLocaleString("nl-NL", {
                  day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit",
                })}
              </span>
              <span className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" /> {order.customer_phone}</span>
              <span className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" /> {order.customer_email}</span>
            </div>
          </div>
          <span className="font-display text-2xl font-bold text-primary">{formatEUR(order.total_cents)}</span>
        </div>
      </button>

      {expanded && (
        <div className="border-t border-border/60 bg-secondary/20 p-5">
          <div className="mb-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Items</p>
            <ul className="space-y-1 text-sm">
              {items?.map((i) => (
                <li key={i.id} className="flex justify-between">
                  <span>{i.quantity}× {i.product_name}</span>
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
          {canEdit && (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Status wijzigen</p>
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
          )}
        </div>
      )}
    </article>
  );
}

/* ---------------- Reservations ---------------- */

type ReservationRow = {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  pickup_at: string;
  party_size: number;
  notes: string | null;
  status: string;
  created_at: string;
};

const RES_STATUSES = ["nieuw", "bevestigd", "geannuleerd"] as const;

function ReservationsView() {
  const qc = useQueryClient();
  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["admin", "reservations"],
    queryFn: async (): Promise<ReservationRow[]> => {
      const { data, error } = await supabase
        .from("reservations")
        .select("id, customer_name, customer_email, customer_phone, pickup_at, party_size, notes, status, created_at")
        .order("pickup_at", { ascending: true })
        .limit(200);
      if (error) throw error;
      return data ?? [];
    },
  });

  const update = useMutation({
    mutationFn: async (v: { id: string; status: string }) => {
      const { error } = await supabase.from("reservations").update({ status: v.status }).eq("id", v.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "reservations"] });
      toast.success("Reservering bijgewerkt");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) return <p className="text-muted-foreground">Laden…</p>;
  if (!rows.length) {
    return (
      <div className="rounded-2xl border border-dashed border-border p-12 text-center">
        <CalendarDays className="mx-auto h-10 w-10 text-muted-foreground/50" />
        <p className="mt-3 text-muted-foreground">Nog geen reserveringen.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      {rows.map((r) => (
        <article key={r.id} className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <span className="font-display text-lg font-semibold text-primary">{r.customer_name}</span>
                <span className="rounded-full bg-secondary px-3 py-0.5 text-xs font-semibold">{r.status}</span>
              </div>
              <div className="mt-2 grid gap-1 text-sm text-muted-foreground sm:grid-cols-2">
                <span className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" />
                  {new Date(r.pickup_at).toLocaleString("nl-NL", {
                    day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit",
                  })}
                </span>
                <span className="flex items-center gap-1.5"><UsersIcon className="h-3.5 w-3.5" /> {r.party_size} personen</span>
                <span className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" /> {r.customer_phone}</span>
                <span className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" /> {r.customer_email}</span>
              </div>
              {r.notes && <p className="mt-2 text-sm">{r.notes}</p>}
            </div>
            <div className="flex flex-wrap gap-2">
              {RES_STATUSES.map((s) => (
                <button
                  key={s}
                  onClick={() => update.mutate({ id: r.id, status: s })}
                  disabled={r.status === s}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                    r.status === s
                      ? "bg-primary text-primary-foreground"
                      : "border border-border bg-background hover:bg-secondary"
                  } disabled:cursor-not-allowed`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}

/* ---------------- Messages ---------------- */

function MessagesView({ canDelete }: { canDelete: boolean }) {
  const qc = useQueryClient();
  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["admin", "messages"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contact_messages")
        .select("id, name, email, phone, subject, message, is_read, created_at")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data ?? [];
    },
  });

  const toggleRead = useMutation({
    mutationFn: async (v: { id: string; is_read: boolean }) => {
      const { error } = await supabase.from("contact_messages").update({ is_read: v.is_read }).eq("id", v.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "messages"] }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("contact_messages").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "messages"] });
      toast.success("Bericht verwijderd");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) return <p className="text-muted-foreground">Laden…</p>;
  if (!rows.length) {
    return (
      <div className="rounded-2xl border border-dashed border-border p-12 text-center">
        <MessageSquare className="mx-auto h-10 w-10 text-muted-foreground/50" />
        <p className="mt-3 text-muted-foreground">Nog geen berichten.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      {rows.map((m) => (
        <article
          key={m.id}
          className={`rounded-2xl border p-5 shadow-sm ${
            m.is_read ? "border-border bg-card" : "border-[var(--brand-gold)]/40 bg-[var(--brand-gold)]/5"
          }`}
        >
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="font-display text-lg font-semibold text-primary">{m.name}</p>
              <p className="text-sm text-muted-foreground">
                {m.email}{m.phone ? ` · ${m.phone}` : ""} ·{" "}
                {new Date(m.created_at).toLocaleString("nl-NL")}
              </p>
              {m.subject && <p className="mt-2 text-sm font-medium">{m.subject}</p>}
              <p className="mt-2 whitespace-pre-wrap text-sm">{m.message}</p>
            </div>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => toggleRead.mutate({ id: m.id, is_read: !m.is_read })}
                className="rounded-full border border-input bg-background px-3 py-1.5 text-xs hover:bg-accent"
              >
                Markeer als {m.is_read ? "ongelezen" : "gelezen"}
              </button>
              {canDelete && (
                <button
                  onClick={() => {
                    if (confirm("Bericht verwijderen?")) remove.mutate(m.id);
                  }}
                  className="rounded-full border border-destructive/40 bg-destructive/5 px-3 py-1.5 text-xs text-destructive hover:bg-destructive/10"
                >
                  Verwijderen
                </button>
              )}
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}

/* ---------------- Products ---------------- */

function ProductsView() {
  const qc = useQueryClient();
  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["admin", "products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, price_cents, is_available, category_id, sort_order")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

  const update = useMutation({
    mutationFn: async (v: { id: string; is_available?: boolean; price_cents?: number }) => {
      const patch: Record<string, unknown> = {};
      if (v.is_available !== undefined) patch.is_available = v.is_available;
      if (v.price_cents !== undefined) patch.price_cents = v.price_cents;
      const { error } = await supabase.from("products").update(patch).eq("id", v.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "products"] });
      toast.success("Product bijgewerkt");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) return <p className="text-muted-foreground">Laden…</p>;

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <table className="w-full text-sm">
        <thead className="bg-secondary/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
          <tr>
            <th className="px-4 py-3">Naam</th>
            <th className="px-4 py-3">Prijs (€)</th>
            <th className="px-4 py-3">Beschikbaar</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((p) => (
            <tr key={p.id} className="border-t border-border">
              <td className="px-4 py-3">{p.name}</td>
              <td className="px-4 py-3">
                <input
                  type="number"
                  step="0.01"
                  defaultValue={(p.price_cents / 100).toFixed(2)}
                  onBlur={(e) => {
                    const cents = Math.round(parseFloat(e.target.value) * 100);
                    if (!Number.isFinite(cents) || cents === p.price_cents) return;
                    update.mutate({ id: p.id, price_cents: cents });
                  }}
                  className="w-24 rounded-lg border border-input bg-background px-2 py-1"
                />
              </td>
              <td className="px-4 py-3">
                <label className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={p.is_available}
                    onChange={(e) => update.mutate({ id: p.id, is_available: e.target.checked })}
                  />
                  <span>{p.is_available ? "Ja" : "Nee"}</span>
                </label>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ---------------- Users & Roles ---------------- */

const ROLE_OPTIONS: AppRole[] = ["admin", "manager", "employee"];

function UsersView() {
  const qc = useQueryClient();
  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["admin", "user-roles"],
    queryFn: async () => {
      const [{ data: profiles, error: pErr }, { data: userRoles, error: rErr }] = await Promise.all([
        supabase.from("profiles").select("id, full_name, phone"),
        supabase.from("user_roles").select("id, user_id, role"),
      ]);
      if (pErr) throw pErr;
      if (rErr) throw rErr;
      const byUser = new Map<string, { role: AppRole; id: string }[]>();
      (userRoles ?? []).forEach((r) => {
        const arr = byUser.get(r.user_id) ?? [];
        arr.push({ role: r.role as AppRole, id: r.id });
        byUser.set(r.user_id, arr);
      });
      return (profiles ?? []).map((p) => ({
        id: p.id,
        full_name: p.full_name ?? "",
        phone: p.phone ?? "",
        roles: byUser.get(p.id) ?? [],
      }));
    },
  });

  const addRole = useMutation({
    mutationFn: async (v: { user_id: string; role: AppRole }) => {
      const { error } = await supabase.from("user_roles").insert({ user_id: v.user_id, role: v.role });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "user-roles"] });
      toast.success("Rol toegewezen");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const removeRole = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("user_roles").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "user-roles"] });
      toast.success("Rol verwijderd");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) return <p className="text-muted-foreground">Laden…</p>;

  return (
    <div className="grid gap-3">
      {rows.map((u) => {
        const currentRoles = u.roles.map((r) => r.role);
        const available = ROLE_OPTIONS.filter((r) => !currentRoles.includes(r));
        return (
          <article key={u.id} className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="font-display text-lg font-semibold text-primary">
                  {u.full_name || "(geen naam)"}
                </p>
                <p className="text-xs text-muted-foreground">{u.id}</p>
                {u.phone && <p className="mt-1 text-sm text-muted-foreground">{u.phone}</p>}
                <div className="mt-3 flex flex-wrap gap-2">
                  {u.roles.length === 0 && (
                    <span className="text-xs text-muted-foreground">Geen rollen</span>
                  )}
                  {u.roles.map((r) => (
                    <span
                      key={r.id}
                      className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
                    >
                      {r.role}
                      <button
                        onClick={() => removeRole.mutate(r.id)}
                        className="text-primary/60 hover:text-destructive"
                        aria-label={`Verwijder ${r.role}`}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
              {available.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {available.map((r) => (
                    <button
                      key={r}
                      onClick={() => addRole.mutate({ user_id: u.id, role: r })}
                      className="rounded-full border border-input bg-background px-3 py-1.5 text-xs hover:bg-accent"
                    >
                      + {r}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </article>
        );
      })}
    </div>
  );
}

function pillCls(active: boolean) {
  return `rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
    active
      ? "bg-primary text-primary-foreground"
      : "border border-border bg-background text-foreground hover:bg-secondary"
  }`;
}
