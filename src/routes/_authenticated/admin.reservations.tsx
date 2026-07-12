import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { CalendarClock, RefreshCcw, User, Phone, Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/reservations")({
  component: ReservationsPage,
});

const STATUSES = [
  { key: "pending", label: "Nieuw" },
  { key: "confirmed", label: "Bevestigd" },
  { key: "completed", label: "Afgerond" },
  { key: "cancelled", label: "Geannuleerd" },
] as const;

type Res = {
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

function ReservationsPage() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState("all");

  const { data = [], refetch } = useQuery({
    queryKey: ["admin", "reservations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reservations")
        .select("*")
        .order("pickup_at", { ascending: true })
        .limit(200);
      if (error) throw error;
      return (data ?? []) as Res[];
    },
    refetchInterval: 20000,
  });

  useEffect(() => {
    const ch = supabase
      .channel("res-admin")
      .on("postgres_changes", { event: "*", schema: "public", table: "reservations" }, () => {
        qc.invalidateQueries({ queryKey: ["admin", "reservations"] });
      })
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [qc]);

  const update = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("reservations").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "reservations"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const filtered = filter === "all" ? data : data.filter((r) => r.status === filter);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold text-primary">Reserveringen</h1>
          <p className="mt-1 text-sm text-muted-foreground">Afhaal-tijdslot boekingen.</p>
        </div>
        <button
          onClick={() => refetch()}
          className="inline-flex items-center gap-2 rounded-full border border-input bg-background px-4 py-2 text-sm hover:bg-accent"
        >
          <RefreshCcw className="h-4 w-4" /> Vernieuwen
        </button>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        <button
          onClick={() => setFilter("all")}
          className={`rounded-full px-4 py-1.5 text-sm font-medium ${filter === "all" ? "bg-primary text-primary-foreground" : "border border-border bg-background hover:bg-secondary"}`}
        >
          Alle ({data.length})
        </button>
        {STATUSES.map((s) => (
          <button
            key={s.key}
            onClick={() => setFilter(s.key)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium ${filter === s.key ? "bg-primary text-primary-foreground" : "border border-border bg-background hover:bg-secondary"}`}
          >
            {s.label} ({data.filter((r) => r.status === s.key).length})
          </button>
        ))}
      </div>

      <div className="mt-6 grid gap-4">
        {filtered.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border p-12 text-center">
            <CalendarClock className="mx-auto h-10 w-10 text-muted-foreground/50" />
            <p className="mt-3 text-muted-foreground">Geen reserveringen.</p>
          </div>
        )}
        {filtered.map((r) => (
          <article key={r.id} className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="font-display text-lg font-semibold text-primary">
                  {new Date(r.pickup_at).toLocaleString("nl-NL", {
                    weekday: "short",
                    day: "2-digit",
                    month: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}{" "}
                  · {r.party_size}p
                </p>
                <div className="mt-2 grid gap-1 text-sm text-muted-foreground sm:grid-cols-2">
                  <span className="flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5" /> {r.customer_name}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5" /> {r.customer_phone}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5" /> {r.customer_email}
                  </span>
                </div>
                {r.notes && <p className="mt-2 rounded-lg bg-secondary/40 p-2 text-sm">{r.notes}</p>}
              </div>
              <div className="flex flex-wrap gap-2">
                {STATUSES.map((s) => (
                  <button
                    key={s.key}
                    onClick={() => update.mutate({ id: r.id, status: s.key })}
                    disabled={r.status === s.key}
                    className={`rounded-full px-3 py-1.5 text-xs font-medium ${r.status === s.key ? "bg-primary text-primary-foreground" : "border border-border bg-background hover:bg-secondary"} disabled:cursor-not-allowed`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
