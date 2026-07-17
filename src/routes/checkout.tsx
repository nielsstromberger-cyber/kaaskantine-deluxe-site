import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, AlertCircle, ArrowLeft, CalendarClock } from "lucide-react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useCart, formatEUR } from "@/lib/cart-store";
import { toast } from "sonner";
import { buildSlots, fetchOpeningHours, dayName } from "@/lib/opening-hours";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: "Afrekenen — De Kaaskantine" },
      { name: "description", content: "Rond je bestelling af bij De Kaaskantine." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CheckoutPage,
});

const schema = z.object({
  name: z.string().trim().min(2, "Vul je naam in").max(100),
  email: z.string().trim().email("Ongeldig e-mailadres").max(255),
  phone: z
    .string()
    .trim()
    .min(6, "Vul een telefoonnummer in")
    .max(30)
    .regex(/^[+\d\s\-()]+$/, "Alleen cijfers en +-()"),
  pickup_date: z.string().min(1, "Kies een dag"),
  pickup_slot: z.string().min(1, "Kies een tijd"),
  notes: z.string().trim().max(500).optional(),
  discount_code: z.string().trim().max(50).optional(),
});

type FormValues = z.infer<typeof schema>;

function CheckoutPage() {
  const navigate = useNavigate();
  const items = useCart((s) => s.items);
  const subtotal = useCart((s) => s.subtotalCents());
  const clear = useCart((s) => s.clear);
  const [submitting, setSubmitting] = useState(false);

  const { data: hours = [], isLoading: hoursLoading } = useQuery({
    queryKey: ["opening-hours"],
    queryFn: fetchOpeningHours,
    staleTime: 60_000,
  });

  const availableDays = useMemo(() => buildSlots(hours, 7), [hours]);

  const [form, setForm] = useState<FormValues>({
    name: "",
    email: "",
    phone: "",
    pickup_date: "",
    pickup_slot: "",
    notes: "",
    discount_code: "",
  });
  const [errors, setErrors] = useState<Partial<Record<keyof FormValues, string>>>({});
  const [discount, setDiscount] = useState<{ code: string; cents: number } | null>(null);
  const [validatingCode, setValidatingCode] = useState(false);

  // Initialize first day/slot when data arrives
  const firstDay = availableDays[0];
  if (firstDay && !form.pickup_date) {
    setForm((f) => ({ ...f, pickup_date: firstDay.date, pickup_slot: firstDay.slots[0]?.value ?? "" }));
  }

  const currentDay = availableDays.find((d) => d.date === form.pickup_date);
  const total = useMemo(
    () => Math.max(0, subtotal - (discount?.cents ?? 0)),
    [subtotal, discount],
  );

  const update = (k: keyof FormValues, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const applyDiscount = async () => {
    const code = form.discount_code?.trim();
    if (!code) return;
    setValidatingCode(true);
    setDiscount(null);
    try {
      const { data, error } = await supabase
        .from("discount_codes")
        .select("code, discount_type, discount_value, min_order_cents, valid_from, valid_until, max_uses, used_count")
        .eq("code", code.toUpperCase())
        .eq("is_active", true)
        .maybeSingle();
      if (error) throw error;
      if (!data) return toast.error("Kortingscode niet gevonden");
      const now = new Date();
      if (data.valid_from && new Date(data.valid_from) > now) return toast.error("Deze code is nog niet geldig");
      if (data.valid_until && new Date(data.valid_until) < now) return toast.error("Deze code is verlopen");
      if (data.max_uses != null && data.used_count >= data.max_uses) return toast.error("Deze code is niet meer beschikbaar");
      if (subtotal < data.min_order_cents) return toast.error(`Minimale bestelwaarde: ${formatEUR(data.min_order_cents)}`);
      const cents = data.discount_type === "percent"
        ? Math.round((subtotal * data.discount_value) / 100)
        : data.discount_value;
      setDiscount({ code: data.code, cents: Math.min(cents, subtotal) });
      toast.success(`Kortingscode ${data.code} toegepast`);
    } catch {
      toast.error("Kon kortingscode niet valideren");
    } finally {
      setValidatingCode(false);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return;
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      const fieldErrors: Partial<Record<keyof FormValues, string>> = {};
      for (const issue of parsed.error.issues) {
        const k = issue.path[0] as keyof FormValues;
        if (!fieldErrors[k]) fieldErrors[k] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    setSubmitting(true);
    try {
      // pickup_slot is "YYYY-MM-DDTHH:mm" in Amsterdam local time. Interpret as local and convert to ISO.
      const pickupISO = new Date(parsed.data.pickup_slot).toISOString();
      const { data, error } = await supabase.rpc("place_order", {
        _customer_name: parsed.data.name,
        _customer_email: parsed.data.email,
        _customer_phone: parsed.data.phone,
        _pickup_time: pickupISO,
        _notes: parsed.data.notes || "",
        _discount_code: discount?.code ?? "",
        _items: items.map((i) => ({
          product_id: i.productId,
          quantity: i.quantity,
          notes: i.notes ?? null,
        })),
      });
      if (error) throw error;
      const order = data as { id: string; access_token: string };
      clear();
      navigate({
        to: "/bestelling/$id",
        params: { id: order.id },
        search: { t: order.access_token },
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "";
      if (msg.includes("outside_opening_hours") || msg.includes("closed_on_day")) {
        toast.error("De gekozen tijd valt buiten onze openingstijden.");
      } else if (msg.includes("insufficient_stock")) {
        toast.error("Een van de producten is niet meer op voorraad. Vernieuw je winkelwagen.");
      } else if (msg.includes("product_unavailable")) {
        toast.error("Een product uit je winkelwagen is niet meer beschikbaar.");
      } else {
        toast.error("Er ging iets mis bij het plaatsen van je bestelling. Probeer opnieuw.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <h1 className="font-display text-3xl font-semibold text-primary">Je winkelwagen is leeg</h1>
        <p className="mt-3 text-muted-foreground">Voeg eerst een broodje toe voordat je afrekent.</p>
        <Link to="/menu" className="mt-6 inline-flex items-center gap-2 rounded-full bg-[var(--brand-gold)] px-6 py-3 text-sm font-semibold text-primary shadow-sm">
          <ArrowLeft className="h-4 w-4" /> Naar het menu
        </Link>
      </div>
    );
  }

  const noSlots = !hoursLoading && availableDays.length === 0;

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <Link to="/menu" className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-primary">
        <ArrowLeft className="h-4 w-4" /> Terug naar het menu
      </Link>
      <h1 className="font-display text-3xl font-semibold text-primary sm:text-4xl">Afrekenen</h1>
      <p className="mt-2 text-muted-foreground">
        Vul je gegevens in en kies een afhaaltijd. Bestellingen worden opgehaald bij De Kaaskantine in Alkmaar.
      </p>

      {noSlots && (
        <div className="mt-6 flex items-start gap-3 rounded-2xl border border-destructive/30 bg-destructive/5 p-5 text-destructive">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <p className="font-semibold">Afhalen is momenteel niet mogelijk</p>
            <p className="mt-1 text-sm">
              Er zijn geen openingstijden ingesteld voor de komende dagen. Neem contact met ons op of probeer het later opnieuw.
            </p>
          </div>
        </div>
      )}

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_400px]">
        <form onSubmit={submit} className="space-y-5" noValidate>
          <Field label="Naam" error={errors.name}>
            <input type="text" value={form.name} onChange={(e) => update("name", e.target.value)} className="input" autoComplete="name" required />
          </Field>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="E-mailadres" error={errors.email}>
              <input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} className="input" autoComplete="email" required />
            </Field>
            <Field label="Telefoon" error={errors.phone}>
              <input type="tel" value={form.phone} onChange={(e) => update("phone", e.target.value)} className="input" autoComplete="tel" required />
            </Field>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">
              <CalendarClock className="mr-1 inline h-4 w-4 text-[var(--brand-gold)]" />
              Afhaaldag en -tijd
            </label>
            {hoursLoading && <p className="text-sm text-muted-foreground">Openingstijden laden…</p>}
            {!hoursLoading && availableDays.length > 0 && (
              <div className="grid gap-3 sm:grid-cols-2">
                <select
                  value={form.pickup_date}
                  onChange={(e) => {
                    const d = availableDays.find((x) => x.date === e.target.value);
                    setForm((f) => ({ ...f, pickup_date: e.target.value, pickup_slot: d?.slots[0]?.value ?? "" }));
                  }}
                  className="input"
                  required
                >
                  {availableDays.map((d) => (
                    <option key={d.date} value={d.date}>{d.label}</option>
                  ))}
                </select>
                <select
                  value={form.pickup_slot}
                  onChange={(e) => update("pickup_slot", e.target.value)}
                  className="input"
                  required
                  disabled={!currentDay}
                >
                  {currentDay?.slots.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>
            )}
            {(errors.pickup_date || errors.pickup_slot) && (
              <span className="mt-1 block text-xs text-destructive">{errors.pickup_date || errors.pickup_slot}</span>
            )}
            <span className="mt-1 block text-xs text-muted-foreground">
              Alleen tijden binnen onze openingstijden zijn beschikbaar.
            </span>
          </div>

          <Field label="Opmerking (optioneel)" error={errors.notes}>
            <textarea value={form.notes} onChange={(e) => update("notes", e.target.value)} className="input min-h-24" rows={3} placeholder="Allergieën of andere wensen" />
          </Field>

          <button
            type="submit"
            disabled={submitting || noSlots}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[var(--brand-gold)] px-6 py-3.5 text-base font-semibold text-primary shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5 disabled:opacity-60 disabled:hover:translate-y-0"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Bestelling plaatsen — {formatEUR(total)}
          </button>
          <p className="flex items-start gap-2 text-xs text-muted-foreground">
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            Betalen bij afhalen (contant of pin). Online betalen via Stripe volgt binnenkort.
          </p>
        </form>

        <aside className="h-fit rounded-2xl border border-border bg-card p-6 shadow-sm lg:sticky lg:top-24">
          <h2 className="font-display text-xl font-semibold text-primary">Overzicht</h2>
          <ul className="mt-4 divide-y divide-border/50">
            {items.map((i) => (
              <li key={i.productId} className="flex items-center justify-between gap-3 py-3">
                <div>
                  <p className="text-sm font-medium">{i.name}</p>
                  <p className="text-xs text-muted-foreground">{i.quantity} × {formatEUR(i.priceCents)}</p>
                </div>
                <span className="text-sm font-semibold">{formatEUR(i.priceCents * i.quantity)}</span>
              </li>
            ))}
          </ul>

          <div className="mt-5 space-y-2 border-t border-border/60 pt-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Subtotaal</span>
              <span>{formatEUR(subtotal)}</span>
            </div>
            {discount && (
              <div className="flex items-center justify-between text-sm text-[var(--brand-gold)]">
                <span>Korting ({discount.code})</span>
                <span>−{formatEUR(discount.cents)}</span>
              </div>
            )}
            <div className="flex items-center justify-between border-t border-border/60 pt-2 text-base font-semibold">
              <span>Totaal</span>
              <span className="font-display text-lg text-primary">{formatEUR(total)}</span>
            </div>
          </div>

          <div className="mt-5">
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Kortingscode</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={form.discount_code}
                onChange={(e) => update("discount_code", e.target.value.toUpperCase())}
                className="input flex-1"
                placeholder="Bijv. WELKOM10"
              />
              <button
                type="button"
                onClick={applyDiscount}
                disabled={!form.discount_code || validatingCode}
                className="rounded-full border border-border bg-secondary px-4 text-sm font-medium text-primary transition-colors hover:bg-secondary/80 disabled:opacity-50"
              >
                {validatingCode ? <Loader2 className="h-4 w-4 animate-spin" /> : "Toepassen"}
              </button>
            </div>
          </div>

          <div className="mt-6 rounded-xl bg-secondary/40 p-4 text-xs text-muted-foreground">
            <p className="font-semibold text-foreground">Openingstijden</p>
            <ul className="mt-1 space-y-0.5">
              {hours.map((h) => (
                <li key={h.day_of_week} className="flex justify-between">
                  <span>{dayName(h.day_of_week)}</span>
                  <span>{h.is_closed || !h.open_time ? "Gesloten" : `${h.open_time.slice(0,5)}–${h.close_time?.slice(0,5)}`}</span>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Field({ label, hint, error, children }: { label: string; hint?: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-foreground">{label}</span>
      {children}
      {hint && !error && <span className="mt-1 block text-xs text-muted-foreground">{hint}</span>}
      {error && <span className="mt-1 block text-xs text-destructive">{error}</span>}
    </label>
  );
}
