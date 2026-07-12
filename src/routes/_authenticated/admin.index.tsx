import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
} from "recharts";
import { ShoppingBag, TrendingUp, Users, CalendarClock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatEUR } from "@/lib/cart-store";

export const Route = createFileRoute("/_authenticated/admin/")({
  component: AdminHome,
});

type Stats = {
  totalOrders: number;
  totalRevenueCents: number;
  newToday: number;
  reservationsUpcoming: number;
  perDay: { day: string; revenue: number; orders: number }[];
  topProducts: { name: string; quantity: number }[];
};

async function fetchStats(): Promise<Stats> {
  const since = new Date();
  since.setDate(since.getDate() - 30);

  const [ordersRes, itemsRes, todayRes, resRes] = await Promise.all([
    supabase
      .from("orders")
      .select("total_cents, created_at, status")
      .gte("created_at", since.toISOString()),
    supabase
      .from("order_items")
      .select("product_name, quantity, created_at")
      .gte("created_at", since.toISOString()),
    supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .gte("created_at", new Date(new Date().setHours(0, 0, 0, 0)).toISOString()),
    supabase
      .from("reservations")
      .select("id", { count: "exact", head: true })
      .gte("pickup_at", new Date().toISOString()),
  ]);

  const orders = ordersRes.data ?? [];
  const items = itemsRes.data ?? [];

  const byDay = new Map<string, { revenue: number; orders: number }>();
  for (const o of orders) {
    const d = new Date(o.created_at).toISOString().slice(0, 10);
    const entry = byDay.get(d) ?? { revenue: 0, orders: 0 };
    entry.revenue += o.total_cents;
    entry.orders += 1;
    byDay.set(d, entry);
  }
  const perDay = Array.from(byDay.entries())
    .map(([day, v]) => ({ day: day.slice(5), revenue: v.revenue / 100, orders: v.orders }))
    .sort((a, b) => a.day.localeCompare(b.day));

  const productMap = new Map<string, number>();
  for (const it of items) {
    productMap.set(it.product_name, (productMap.get(it.product_name) ?? 0) + it.quantity);
  }
  const topProducts = Array.from(productMap.entries())
    .map(([name, quantity]) => ({ name, quantity }))
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5);

  return {
    totalOrders: orders.length,
    totalRevenueCents: orders.reduce((s, o) => s + o.total_cents, 0),
    newToday: todayRes.count ?? 0,
    reservationsUpcoming: resRes.count ?? 0,
    perDay,
    topProducts,
  };
}

function AdminHome() {
  const { data, isLoading } = useQuery({ queryKey: ["admin-stats"], queryFn: fetchStats });

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold text-primary">Overzicht</h1>
      <p className="mt-1 text-sm text-muted-foreground">Statistieken van de afgelopen 30 dagen.</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi icon={TrendingUp} label="Omzet 30d" value={data ? formatEUR(data.totalRevenueCents) : "…"} />
        <Kpi icon={ShoppingBag} label="Bestellingen 30d" value={data?.totalOrders ?? "…"} />
        <Kpi icon={Users} label="Vandaag" value={data?.newToday ?? "…"} />
        <Kpi icon={CalendarClock} label="Reserveringen komend" value={data?.reservationsUpcoming ?? "…"} />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <h2 className="mb-4 font-display text-lg font-semibold text-primary">Omzet per dag (€)</h2>
          {isLoading || !data ? (
            <p className="text-sm text-muted-foreground">Laden…</p>
          ) : data.perDay.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nog geen data.</p>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.perDay}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="day" fontSize={11} />
                  <YAxis fontSize={11} />
                  <Tooltip
                    formatter={(v) => `€${Number(v).toFixed(2)}`}
                    contentStyle={{ borderRadius: 8, fontSize: 12 }}
                  />
                  <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <h2 className="mb-4 font-display text-lg font-semibold text-primary">Top producten</h2>
          {isLoading || !data ? (
            <p className="text-sm text-muted-foreground">Laden…</p>
          ) : data.topProducts.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nog geen data.</p>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.topProducts} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" fontSize={11} />
                  <YAxis type="category" dataKey="name" fontSize={11} width={130} />
                  <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                  <Bar dataKey="quantity" radius={[0, 6, 6, 0]}>
                    {data.topProducts.map((_, i) => (
                      <Cell key={i} fill="var(--brand-gold)" />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Kpi({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        <Icon className="h-4 w-4" /> {label}
      </div>
      <p className="mt-2 font-display text-2xl font-semibold text-primary">{value}</p>
    </div>
  );
}
