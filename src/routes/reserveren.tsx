import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Loader2, Calendar } from "lucide-react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/reserveren")({
  head: () => ({
    meta: [
      { title: "Reserveer een afhaal-tijdslot — De Kaaskantine Alkmaar" },
      {
        name: "description",
        content:
          "Reserveer eenvoudig een afhaal-tijdslot bij De Kaaskantine in Alkmaar. Kies je datum en tijd en we zetten je bestelling klaar.",
      },
      { property: "og:title", content: "Reserveren — De Kaaskantine Alkmaar" },
      { property: "og:description", content: "Reserveer een afhaal-tijdslot bij De Kaaskantine." },
    ],
  }),
  component: ReservePage,
});

const schema = z.object({
  customer_name: z.string().trim().min(2).max(100),
  customer_email: z.string().trim().email().max(255),
  customer_phone: z.string().trim().min(6).max(30),
  pickup_at: z.string().min(1),
  party_size: z.coerce.number().int().min(1).max(20),
  notes: z.string().trim().max(500).optional(),
});

function defaultPickup(): string {
  const d = new Date(Date.now() + 60 * 60 * 1000);
  d.setMinutes(Math.ceil(d.getMinutes() / 15) * 15, 0, 0);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function ReservePage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    customer_name: "",
    customer_email: "",
    customer_phone: "",
    pickup_at: defaultPickup(),
    party_size: 1,
    notes: "",
  });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from("reservations").insert({
      user_id: user?.id ?? null,
      customer_name: parsed.data.customer_name,
      customer_email: parsed.data.customer_email,
      customer_phone: parsed.data.customer_phone,
      pickup_at: new Date(parsed.data.pickup_at).toISOString(),
      party_size: parsed.data.party_size,
      notes: parsed.data.notes || null,
    });
    setLoading(false);
    if (error) {
      toast.error("Kon reservering niet plaatsen");
      return;
    }
    toast.success("Reservering ontvangen");
    navigate({ to: user ? "/account" : "/" });
  };

  return (
    <div className="bg-background">
      <section className="border-b border-border/60 bg-secondary/30">
        <div className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6 lg:py-20">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--brand-gold)]">
            Reserveer je moment
          </p>
          <h1 className="font-display text-4xl font-semibold text-primary sm:text-5xl">
            Afhaal-tijdslot reserveren
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground">
            Kies wanneer je langskomt en we zetten je bestelling op tijd klaar.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
        <form
          onSubmit={submit}
          className="space-y-5 rounded-3xl border border-border bg-card p-8 shadow-sm"
        >
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium">Naam</span>
            <input
              type="text"
              value={form.customer_name}
              onChange={(e) => setForm((f) => ({ ...f, customer_name: e.target.value }))}
              className="input"
              autoComplete="name"
              required
            />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium">E-mail</span>
              <input
                type="email"
                value={form.customer_email}
                onChange={(e) => setForm((f) => ({ ...f, customer_email: e.target.value }))}
                className="input"
                autoComplete="email"
                required
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium">Telefoon</span>
              <input
                type="tel"
                value={form.customer_phone}
                onChange={(e) => setForm((f) => ({ ...f, customer_phone: e.target.value }))}
                className="input"
                autoComplete="tel"
                required
              />
            </label>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium">Afhaal-tijdstip</span>
              <input
                type="datetime-local"
                value={form.pickup_at}
                onChange={(e) => setForm((f) => ({ ...f, pickup_at: e.target.value }))}
                className="input"
                required
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium">Aantal personen</span>
              <input
                type="number"
                min={1}
                max={20}
                value={form.party_size}
                onChange={(e) => setForm((f) => ({ ...f, party_size: Number(e.target.value) }))}
                className="input"
                required
              />
            </label>
          </div>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium">Opmerking (optioneel)</span>
            <textarea
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              className="input min-h-24"
              rows={3}
              placeholder="Bijzondere wensen?"
            />
          </label>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[var(--brand-gold)] px-6 py-3.5 text-base font-semibold text-primary shadow-sm hover:shadow-md disabled:opacity-60"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Calendar className="h-4 w-4" />}
            Reservering bevestigen
          </button>
        </form>
      </section>
    </div>
  );
}
