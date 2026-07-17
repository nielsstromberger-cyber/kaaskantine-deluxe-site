import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
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
  Archive,
  Send,
  CheckCircle2,
  Settings,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatEUR } from "@/lib/cart-store";
import { toast } from "sonner";
import { useRoles, type AppRole } from "@/hooks/use-roles";
import { dayName } from "@/lib/opening-hours";

export const Route = createFileRoute("/_authenticated/admin")({
  component: AdminDashboard,
});

const STATUSES = [
  { key: "nieuw", label: "Nieuwe bestelling", color: "bg-[var(--brand-gold)]/20 text-[var(--brand-gold)]" },
  { key: "bereiding", label: "In behandeling", color: "bg-blue-100 text-blue-700" },
  { key: "gereed", label: "Gereed om af te halen", color: "bg-green-100 text-green-700" },
  { key: "voltooid", label: "Voltooid", color: "bg-muted text-muted-foreground" },
  { key: "geannuleerd", label: "Geannuleerd", color: "bg-destructive/10 text-destructive" },
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
  archived_at: string | null;
};

type TabKey = "orders" | "archive" | "reservations" | "messages" | "products" | "hours" | "users";

function AdminDashboard() {
  const { roles, isAdmin, isManager, isEmployee, isStaff, loading } = useRoles();
  const [tab, setTab] = useState<TabKey>("orders");

  const signOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  if (loading) {
    return <div className="mx-auto max-w-4xl px-4 py-20 text-center text-muted-foreground">Laden…</div>;
  }

  if (!isStaff) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20">
        <div className="rounded-3xl border border-destructive/30 bg-destructive/5 p-8 text-center">
          <ShieldAlert className="mx-auto h-10 w-10 text-destructive" />
          <h1 className="mt-4 font-display text-2xl font-semibold text-primary">Geen toegang</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Je account heeft nog geen personeelsrol. Vraag een admin om je een rol toe te wijzen.
          </p>
          <button onClick={signOut} className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90">
            <LogOut className="h-4 w-4" /> Uitloggen
          </button>
        </div>
      </div>
    );
  }

  const tabs: { key: TabKey; label: string; icon: typeof Package; visible: boolean }[] = [
    { key: "orders", label: "Actieve bestellingen", icon: Package, visible: true },
    { key: "archive", label: "Archief", icon: Archive, visible: true },
    { key: "reservations", label: "Reserveringen", icon: CalendarDays, visible: isAdmin || isManager },
    { key: "messages", label: "Berichten", icon: MessageSquare, visible: isAdmin || isManager },
    { key: "products", label: "Producten & voorraad", icon: Utensils, visible: isAdmin },
    { key: "hours", label: "Openingstijden", icon: Settings, visible: isAdmin },
    { key: "users", label: "Gebruikers", icon: UsersIcon, visible: isAdmin },
  ];

  const visibleTabs = tabs.filter((t) => t.visible);
  const activeTab = visibleTabs.find((t) => t.key === tab) ? tab : "orders";
  const canEditOrders = isAdmin || isManager;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold text-primary">Beheerdersdashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Ingelogd als {roles.length ? roles.join(", ") : "gebruiker"}.
          </p>
        </div>
        <div className="flex gap-2">
          <Link to="/" className="rounded-full border border-input bg-background px-4 py-2 text-sm hover:bg-accent">Naar website</Link>
          <button onClick={signOut} className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90">
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
                active ? "bg-primary text-primary-foreground" : "border border-border bg-background text-foreground hover:bg-secondary"
              }`}
            >
              <Icon className="h-4 w-4" /> {t.label}
            </button>
          );
        })}
      </div>

      <div className="mt-6">
        {activeTab === "orders" && <OrdersView archive={false} canEdit={canEditOrders} readonly={isEmployee && !canEditOrders} />}
        {activeTab === "archive" && <OrdersView archive={true} canEdit={canEditOrders} readonly={isEmployee && !canEditOrders} />}
        {activeTab === "reservations" && <ReservationsView />}
        {activeTab === "messages" && <MessagesView canDelete={isAdmin} />}
        {activeTab === "products" && <ProductsView />}
        {activeTab === "hours" && <OpeningHoursView />}
        {activeTab === "users" && <UsersView />}
      </div>
    </div>
  );
}

/* ---------------- Orders ---------------- */

async function fetchOrders(archive: boolean): Promise<OrderRow[]> {
  let q = supabase
    .from("orders")
    .select("id, order_number, customer_name, customer_email, customer_phone, pickup_time, status, total_cents, notes, created_at, archived_at")
    .order("created_at", { ascending: false })
    .limit(200);
  q = archive ? q.eq("status", "voltooid") : q.neq("status", "voltooid");
  const { data, error } = await q;
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

function OrdersView({ archive, canEdit, readonly }: { archive: boolean; canEdit: boolean; readonly: boolean }) {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<string>("all");
  const qk = ["admin", "orders", archive ? "archive" : "active"];

  const { data: orders = [], isLoading, refetch } = useQuery({
    queryKey: qk,
    queryFn: () => fetchOrders(archive),
    refetchInterval: 15000,
  });

  useEffect(() => {
    const channel = supabase
      .channel(`orders-admin-${archive ? "arch" : "act"}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => {
        qc.invalidateQueries({ queryKey: qk });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [qc, archive]);

  const updateStatus = useMutation({
    mutationFn: async (vars: { id: string; status: OrderStatus }) => {
      const { error } = await supabase.from("orders").update({ status: vars.status }).eq("id", vars.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "orders"] });
      toast.success("Status bijgewerkt");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const statusesForFilter = archive
    ? STATUSES.filter((s) => s.key === "voltooid")
    : STATUSES.filter((s) => s.key !== "voltooid");
  const filtered = filter === "all" ? orders : orders.filter((o) => o.status === filter);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setFilter("all")} className={pillCls(filter === "all")}>
            Alle ({orders.length})
          </button>
          {statusesForFilter.map((s) => {
            const count = orders.filter((o) => o.status === s.key).length;
            return (
              <button key={s.key} onClick={() => setFilter(s.key)} className={pillCls(filter === s.key)}>
                {s.label} ({count})
              </button>
            );
          })}
        </div>
        <button onClick={() => refetch()} className="inline-flex items-center gap-2 rounded-full border border-input bg-background px-4 py-2 text-sm hover:bg-accent">
          <RefreshCcw className="h-4 w-4" /> Vernieuwen
        </button>
      </div>

      {readonly && (
        <p className="mt-3 text-xs text-muted-foreground">Alleen-lezen: je kunt geen status wijzigen.</p>
      )}

      <div className="mt-6 grid gap-4">
        {isLoading && <p className="text-muted-foreground">Laden…</p>}
        {!isLoading && filtered.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border p-12 text-center">
            <Package className="mx-auto h-10 w-10 text-muted-foreground/50" />
            <p className="mt-3 text-muted-foreground">
              {archive ? "Nog geen voltooide bestellingen." : "Geen actieve bestellingen."}
            </p>
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

function OrderCard({ order, canEdit, onStatusChange }: { order: OrderRow; canEdit: boolean; onStatusChange: (s: OrderStatus) => void }) {
  const [expanded, setExpanded] = useState(false);
  const { data: items } = useQuery({
    queryKey: ["admin", "order-items", order.id],
    queryFn: () => fetchOrderItems(order.id),
    enabled: expanded,
  });
  const statusDef = STATUSES.find((s) => s.key === order.status);

  return (
    <article className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <button type="button" onClick={() => setExpanded((v) => !v)} className="w-full p-5 text-left transition-colors hover:bg-secondary/30">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <span className="font-display text-xl font-bold text-primary">#{order.order_number}</span>
              <span className={`rounded-full px-3 py-0.5 text-xs font-semibold ${statusDef?.color ?? "bg-muted"}`}>
                {statusDef?.label ?? order.status}
              </span>
            </div>
            <div className="mt-2 grid gap-1 text-sm text-muted-foreground sm:grid-cols-2">
              <span className="flex items-center gap-1.5"><User className="h-3.5 w-3.5" /> {order.customer_name}</span>
              <span className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                {new Date(order.pickup_time).toLocaleString("nl-NL", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
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
          {order.notes && <p className="mb-4 rounded-xl bg-background p-3 text-sm"><strong>Opmerking:</strong> {order.notes}</p>}
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
                      order.status === s.key ? "bg-primary text-primary-foreground" : "border border-border bg-background hover:bg-secondary"
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
                  {new Date(r.pickup_at).toLocaleString("nl-NL", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}
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
                    r.status === s ? "bg-primary text-primary-foreground" : "border border-border bg-background hover:bg-secondary"
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

const MSG_STATUSES = [
  { key: "nieuw", label: "Nieuw", color: "bg-[var(--brand-gold)]/20 text-[var(--brand-gold)]" },
  { key: "beantwoord", label: "Beantwoord", color: "bg-green-100 text-green-700" },
  { key: "gesloten", label: "Gesloten", color: "bg-muted text-muted-foreground" },
] as const;

type MessageRow = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string | null;
  message: string;
  status: string;
  is_read: boolean;
  created_at: string;
};

type Reply = {
  id: string;
  body: string;
  author_name: string | null;
  email_sent: boolean;
  created_at: string;
};

function MessagesView({ canDelete }: { canDelete: boolean }) {
  const qc = useQueryClient();
  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["admin", "messages"],
    queryFn: async (): Promise<MessageRow[]> => {
      const { data, error } = await supabase
        .from("contact_messages")
        .select("id, name, email, phone, subject, message, status, is_read, created_at")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data ?? [];
    },
  });

  const updateStatus = useMutation({
    mutationFn: async (v: { id: string; status: string }) => {
      const { error } = await supabase.from("contact_messages").update({ status: v.status, is_read: true }).eq("id", v.id);
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
    <div className="grid gap-4">
      {rows.map((m) => (
        <MessageCard
          key={m.id}
          message={m}
          canDelete={canDelete}
          onStatusChange={(s) => updateStatus.mutate({ id: m.id, status: s })}
          onDelete={() => { if (confirm("Bericht verwijderen?")) remove.mutate(m.id); }}
        />
      ))}
    </div>
  );
}

function MessageCard({
  message: m,
  canDelete,
  onStatusChange,
  onDelete,
}: {
  message: MessageRow;
  canDelete: boolean;
  onStatusChange: (s: string) => void;
  onDelete: () => void;
}) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);

  const { data: replies = [] } = useQuery({
    queryKey: ["admin", "replies", m.id],
    queryFn: async (): Promise<Reply[]> => {
      const { data, error } = await supabase
        .from("contact_replies")
        .select("id, body, author_name, email_sent, created_at")
        .eq("message_id", m.id)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
    enabled: open,
  });

  const statusDef = MSG_STATUSES.find((s) => s.key === m.status) ?? MSG_STATUSES[0];

  const sendReply = async () => {
    if (!reply.trim()) return;
    setSending(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const author = userData.user?.email ?? null;
      const { error } = await supabase.from("contact_replies").insert({
        message_id: m.id,
        body: reply.trim(),
        author_name: author,
        author_id: userData.user?.id ?? null,
        email_sent: false, // wordt op true gezet zodra e-mail infrastructuur actief is
      });
      if (error) throw error;
      await supabase.from("contact_messages").update({ status: "beantwoord", is_read: true }).eq("id", m.id);
      setReply("");
      toast.success("Antwoord opgeslagen in de conversatie");
      qc.invalidateQueries({ queryKey: ["admin", "replies", m.id] });
      qc.invalidateQueries({ queryKey: ["admin", "messages"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Kon antwoord niet opslaan");
    } finally {
      setSending(false);
    }
  };

  return (
    <article className={`rounded-2xl border shadow-sm ${m.status === "nieuw" ? "border-[var(--brand-gold)]/40 bg-[var(--brand-gold)]/5" : "border-border bg-card"}`}>
      <div className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-display text-lg font-semibold text-primary">{m.name}</p>
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusDef.color}`}>{statusDef.label}</span>
            </div>
            <p className="text-sm text-muted-foreground">
              {m.email}{m.phone ? ` · ${m.phone}` : ""} · {new Date(m.created_at).toLocaleString("nl-NL")}
            </p>
            {m.subject && <p className="mt-2 text-sm font-medium">{m.subject}</p>}
            <p className="mt-2 whitespace-pre-wrap text-sm">{m.message}</p>
          </div>
          <div className="flex flex-col gap-2">
            <button onClick={() => setOpen((v) => !v)} className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90">
              <Send className="h-3.5 w-3.5" /> {open ? "Sluiten" : "Beantwoorden"}
            </button>
            {MSG_STATUSES.filter((s) => s.key !== m.status).map((s) => (
              <button key={s.key} onClick={() => onStatusChange(s.key)} className="rounded-full border border-input bg-background px-3 py-1.5 text-xs hover:bg-accent">
                Markeer als {s.label.toLowerCase()}
              </button>
            ))}
            {canDelete && (
              <button onClick={onDelete} className="rounded-full border border-destructive/40 bg-destructive/5 px-3 py-1.5 text-xs text-destructive hover:bg-destructive/10">
                Verwijderen
              </button>
            )}
          </div>
        </div>
      </div>

      {open && (
        <div className="border-t border-border/60 bg-secondary/20 p-5">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Conversatie</p>
          <div className="space-y-3">
            {replies.length === 0 && (
              <p className="text-sm text-muted-foreground">Nog geen antwoorden.</p>
            )}
            {replies.map((r) => (
              <div key={r.id} className="rounded-xl bg-background p-3 text-sm">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{r.author_name ?? "Medewerker"}</span>
                  <span className="flex items-center gap-1.5">
                    {r.email_sent ? (<><CheckCircle2 className="h-3 w-3 text-green-600" /> Verzonden</>) : "Opgeslagen (e-mail infra nodig)"}
                    <span>· {new Date(r.created_at).toLocaleString("nl-NL")}</span>
                  </span>
                </div>
                <p className="mt-2 whitespace-pre-wrap">{r.body}</p>
              </div>
            ))}
          </div>

          <div className="mt-4">
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Antwoord aan {m.email}
            </label>
            <textarea
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              className="input min-h-28 w-full"
              placeholder="Schrijf een vriendelijk antwoord…"
            />
            <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs text-muted-foreground">
                Antwoorden worden bewaard in de conversatie. Automatische e-mail wordt actief zodra het e-maildomein is ingesteld.
              </p>
              <button
                onClick={sendReply}
                disabled={sending || !reply.trim()}
                className="inline-flex items-center gap-2 rounded-full bg-[var(--brand-gold)] px-4 py-2 text-sm font-semibold text-primary shadow-sm disabled:opacity-60"
              >
                <Send className="h-4 w-4" /> {sending ? "Bezig…" : "Antwoord opslaan"}
              </button>
            </div>
          </div>
        </div>
      )}
    </article>
  );
}

/* ---------------- Products (with stock) ---------------- */

type ProductRow = {
  id: string;
  name: string;
  price_cents: number;
  is_available: boolean;
  stock_quantity: number | null;
  low_stock_threshold: number;
};

function ProductsView() {
  const qc = useQueryClient();
  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["admin", "products"],
    queryFn: async (): Promise<ProductRow[]> => {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, price_cents, is_available, stock_quantity, low_stock_threshold, sort_order")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

  const update = useMutation({
    mutationFn: async (v: { id: string; patch: Partial<ProductRow> }) => {
      const { error } = await supabase.from("products").update(v.patch).eq("id", v.id);
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
    <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-sm">
      <table className="w-full text-sm">
        <thead className="bg-secondary/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
          <tr>
            <th className="px-4 py-3">Naam</th>
            <th className="px-4 py-3">Prijs (€)</th>
            <th className="px-4 py-3">Voorraad</th>
            <th className="px-4 py-3">Waarschuwing bij</th>
            <th className="px-4 py-3">Beschikbaar</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((p) => {
            const soldOut = p.stock_quantity !== null && p.stock_quantity <= 0;
            const low = p.stock_quantity !== null && p.stock_quantity > 0 && p.stock_quantity <= p.low_stock_threshold;
            return (
              <tr key={p.id} className="border-t border-border">
                <td className="px-4 py-3">
                  <div className="font-medium">{p.name}</div>
                  {soldOut && <span className="text-xs font-medium text-destructive">Uitverkocht</span>}
                  {low && <span className="text-xs font-medium text-[var(--brand-gold)]">Lage voorraad</span>}
                </td>
                <td className="px-4 py-3">
                  <input
                    type="number"
                    step="0.01"
                    defaultValue={(p.price_cents / 100).toFixed(2)}
                    onBlur={(e) => {
                      const cents = Math.round(parseFloat(e.target.value) * 100);
                      if (!Number.isFinite(cents) || cents === p.price_cents) return;
                      update.mutate({ id: p.id, patch: { price_cents: cents } });
                    }}
                    className="w-24 rounded-lg border border-input bg-background px-2 py-1"
                  />
                </td>
                <td className="px-4 py-3">
                  <input
                    type="number"
                    min="0"
                    placeholder="onbeperkt"
                    defaultValue={p.stock_quantity ?? ""}
                    onBlur={(e) => {
                      const raw = e.target.value.trim();
                      const val = raw === "" ? null : Math.max(0, parseInt(raw, 10));
                      if (val === p.stock_quantity) return;
                      update.mutate({ id: p.id, patch: { stock_quantity: val as number | null } });
                    }}
                    className="w-24 rounded-lg border border-input bg-background px-2 py-1"
                  />
                  <div className="text-[10px] text-muted-foreground">Leeg = onbeperkt</div>
                </td>
                <td className="px-4 py-3">
                  <input
                    type="number"
                    min="0"
                    defaultValue={p.low_stock_threshold}
                    onBlur={(e) => {
                      const v = Math.max(0, parseInt(e.target.value, 10) || 0);
                      if (v === p.low_stock_threshold) return;
                      update.mutate({ id: p.id, patch: { low_stock_threshold: v } });
                    }}
                    className="w-20 rounded-lg border border-input bg-background px-2 py-1"
                  />
                </td>
                <td className="px-4 py-3">
                  <label className="inline-flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={p.is_available}
                      onChange={(e) => update.mutate({ id: p.id, patch: { is_available: e.target.checked } })}
                    />
                    <span>{p.is_available ? "Ja" : "Nee"}</span>
                  </label>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/* ---------------- Opening hours ---------------- */

type HourRow = {
  day_of_week: number;
  open_time: string | null;
  close_time: string | null;
  is_closed: boolean;
};

function OpeningHoursView() {
  const qc = useQueryClient();
  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["admin", "hours"],
    queryFn: async (): Promise<HourRow[]> => {
      const { data, error } = await supabase
        .from("opening_hours")
        .select("day_of_week, open_time, close_time, is_closed")
        .order("day_of_week");
      if (error) throw error;
      return data ?? [];
    },
  });

  const update = useMutation({
    mutationFn: async (v: { day_of_week: number; patch: Partial<HourRow> }) => {
      const { error } = await supabase.from("opening_hours").update(v.patch).eq("day_of_week", v.day_of_week);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "hours"] });
      qc.invalidateQueries({ queryKey: ["opening-hours"] });
      toast.success("Openingstijden bijgewerkt");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const ordered = useMemo(() => {
    const order = [1, 2, 3, 4, 5, 6, 0];
    return order.map((d) => rows.find((r) => r.day_of_week === d)).filter(Boolean) as HourRow[];
  }, [rows]);

  if (isLoading) return <p className="text-muted-foreground">Laden…</p>;


  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <table className="w-full text-sm">
        <thead className="bg-secondary/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
          <tr>
            <th className="px-4 py-3">Dag</th>
            <th className="px-4 py-3">Open</th>
            <th className="px-4 py-3">Sluit</th>
            <th className="px-4 py-3">Gesloten</th>
          </tr>
        </thead>
        <tbody>
          {ordered.map((h) => (
            <tr key={h.day_of_week} className="border-t border-border">
              <td className="px-4 py-3 font-medium">{dayName(h.day_of_week)}</td>
              <td className="px-4 py-3">
                <input
                  type="time"
                  defaultValue={h.open_time ?? ""}
                  disabled={h.is_closed}
                  onBlur={(e) => {
                    if (e.target.value === (h.open_time ?? "")) return;
                    update.mutate({ day_of_week: h.day_of_week, patch: { open_time: e.target.value || null } });
                  }}
                  className="rounded-lg border border-input bg-background px-2 py-1 disabled:opacity-50"
                />
              </td>
              <td className="px-4 py-3">
                <input
                  type="time"
                  defaultValue={h.close_time ?? ""}
                  disabled={h.is_closed}
                  onBlur={(e) => {
                    if (e.target.value === (h.close_time ?? "")) return;
                    update.mutate({ day_of_week: h.day_of_week, patch: { close_time: e.target.value || null } });
                  }}
                  className="rounded-lg border border-input bg-background px-2 py-1 disabled:opacity-50"
                />
              </td>
              <td className="px-4 py-3">
                <input
                  type="checkbox"
                  checked={h.is_closed}
                  onChange={(e) => update.mutate({ day_of_week: h.day_of_week, patch: { is_closed: e.target.checked } })}
                />
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
                <p className="font-display text-lg font-semibold text-primary">{u.full_name || "(geen naam)"}</p>
                <p className="text-xs text-muted-foreground">{u.id}</p>
                {u.phone && <p className="mt-1 text-sm text-muted-foreground">{u.phone}</p>}
                <div className="mt-3 flex flex-wrap gap-2">
                  {u.roles.length === 0 && <span className="text-xs text-muted-foreground">Geen rollen</span>}
                  {u.roles.map((r) => (
                    <span key={r.id} className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                      {r.role}
                      <button onClick={() => removeRole.mutate(r.id)} className="text-primary/60 hover:text-destructive" aria-label={`Verwijder ${r.role}`}>×</button>
                    </span>
                  ))}
                </div>
              </div>
              {available.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {available.map((r) => (
                    <button key={r} onClick={() => addRole.mutate({ user_id: u.id, role: r })} className="rounded-full border border-input bg-background px-3 py-1.5 text-xs hover:bg-accent">
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
    active ? "bg-primary text-primary-foreground" : "border border-border bg-background text-foreground hover:bg-secondary"
  }`;
}
