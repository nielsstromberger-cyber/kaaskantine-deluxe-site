import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { LogOut, Package, Calendar as CalIcon, User as UserIcon, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatEUR } from "@/lib/cart-store";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/account")({
  head: () => ({
    meta: [
      { title: "Mijn account — De Kaaskantine" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AccountPage,
});

function AccountPage() {
  const { user } = Route.useRouteContext();
  const qc = useQueryClient();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");

  const { data: profile } = useQuery({
    queryKey: ["profile", user.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("full_name, phone")
        .eq("id", user.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: isAdmin } = useQuery({
    queryKey: ["is-admin", user.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();
      return !!data;
    },
  });

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name ?? "");
      setPhone(profile.phone ?? "");
    }
  }, [profile]);

  const { data: orders = [] } = useQuery({
    queryKey: ["my-orders", user.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("id, order_number, pickup_time, total_cents, status, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: reservations = [] } = useQuery({
    queryKey: ["my-reservations", user.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reservations")
        .select("id, pickup_at, party_size, status, notes")
        .eq("user_id", user.id)
        .order("pickup_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const save = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("profiles")
        .upsert({ id: user.id, full_name: fullName, phone });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Profiel opgeslagen");
      qc.invalidateQueries({ queryKey: ["profile", user.id] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const signOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold text-primary sm:text-4xl">Mijn account</h1>
          <p className="mt-1 text-sm text-muted-foreground">{user.email}</p>
        </div>
        <div className="flex gap-2">
          {isAdmin && (
            <Link
              to="/admin"
              className="inline-flex items-center gap-2 rounded-full bg-[var(--brand-gold)] px-4 py-2 text-sm font-semibold text-primary shadow-sm"
            >
              <ShieldCheck className="h-4 w-4" /> Admin
            </Link>
          )}
          <button
            onClick={signOut}
            className="inline-flex items-center gap-2 rounded-full border border-input bg-background px-4 py-2 text-sm hover:bg-accent"
          >
            <LogOut className="h-4 w-4" /> Uitloggen
          </button>
        </div>
      </div>

      <section className="mt-8 rounded-2xl border border-border bg-card p-6 shadow-sm">
        <h2 className="mb-4 flex items-center gap-2 font-display text-xl font-semibold text-primary">
          <UserIcon className="h-5 w-5" /> Profiel
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium">Naam</span>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="input"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium">Telefoon</span>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="input"
            />
          </label>
        </div>
        <button
          onClick={() => save.mutate()}
          disabled={save.isPending}
          className="mt-4 rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
        >
          Opslaan
        </button>
      </section>

      <section className="mt-8 rounded-2xl border border-border bg-card p-6 shadow-sm">
        <h2 className="mb-4 flex items-center gap-2 font-display text-xl font-semibold text-primary">
          <Package className="h-5 w-5" /> Mijn bestellingen
        </h2>
        {orders.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nog geen bestellingen.</p>
        ) : (
          <ul className="divide-y divide-border/60">
            {orders.map((o) => (
              <li key={o.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div>
                  <Link
                    to="/bestelling/$id"
                    params={{ id: o.id }}
                    className="font-semibold text-primary hover:underline"
                  >
                    #{o.order_number}
                  </Link>
                  <p className="text-xs text-muted-foreground">
                    {new Date(o.pickup_time).toLocaleString("nl-NL", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="rounded-full bg-secondary px-3 py-0.5 text-xs">{o.status}</span>
                  <span className="font-semibold">{formatEUR(o.total_cents)}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-8 rounded-2xl border border-border bg-card p-6 shadow-sm">
        <h2 className="mb-4 flex items-center gap-2 font-display text-xl font-semibold text-primary">
          <CalIcon className="h-5 w-5" /> Mijn reserveringen
        </h2>
        {reservations.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nog geen reserveringen.{" "}
            <Link to="/reserveren" className="text-primary hover:underline">
              Reserveer een afhaal-tijdslot
            </Link>
            .
          </p>
        ) : (
          <ul className="divide-y divide-border/60">
            {reservations.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div>
                  <p className="font-semibold">
                    {new Date(r.pickup_at).toLocaleString("nl-NL", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                  <p className="text-xs text-muted-foreground">{r.party_size} personen</p>
                </div>
                <span className="rounded-full bg-secondary px-3 py-0.5 text-xs">{r.status}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
