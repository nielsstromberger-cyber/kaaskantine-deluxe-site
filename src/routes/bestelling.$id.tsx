import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, Clock, MapPin, Mail, Phone } from "lucide-react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { formatEUR } from "@/lib/cart-store";

const searchSchema = z.object({ t: z.string().optional() });

export const Route = createFileRoute("/bestelling/$id")({
  validateSearch: (s) => searchSchema.parse(s),
  head: () => ({
    meta: [
      { title: "Bestelling bevestigd — De Kaaskantine" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: OrderConfirmation,
});

type OrderData = {
  id: string;
  order_number: number;
  customer_name: string;
  customer_email: string;
  pickup_time: string;
  subtotal_cents: number;
  discount_cents: number;
  total_cents: number;
  discount_code: string | null;
  status: string;
};

async function fetchOrder(id: string, token: string | undefined): Promise<OrderData | null> {
  if (!token) return null;
  const { data, error } = await supabase.rpc("get_order_by_token", {
    _id: id,
    _token: token,
  });
  if (error || !data) return null;
  return data as unknown as OrderData;
}

function OrderConfirmation() {
  const { id } = Route.useParams();
  const { t } = Route.useSearch();
  const { data } = useQuery({
    queryKey: ["order", id, t],
    queryFn: () => fetchOrder(id, t),
  });

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 lg:py-24">
      <div className="rounded-3xl border border-border bg-card p-8 text-center shadow-md sm:p-12">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-[var(--brand-gold)]/20">
          <CheckCircle2 className="h-9 w-9 text-[var(--brand-gold)]" strokeWidth={2.5} />
        </div>
        <h1 className="mt-6 font-display text-3xl font-semibold text-primary sm:text-4xl">
          Bedankt voor je bestelling!
        </h1>
        <p className="mt-3 text-muted-foreground">
          Je bestelling is ontvangen. We beginnen met de bereiding en zorgen dat het op de gekozen tijd voor je klaarligt.
        </p>

        {data && (
          <div className="mx-auto mt-8 max-w-md rounded-2xl bg-secondary/40 p-6 text-left">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <span className="text-sm text-muted-foreground">Bestelnummer</span>
              <span className="font-display text-lg font-bold text-primary">
                #{data.order_number}
              </span>
            </div>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex items-start gap-3">
                <Clock className="mt-0.5 h-4 w-4 shrink-0 text-[var(--brand-gold)]" />
                <div>
                  <dt className="text-muted-foreground">Afhaaltijd</dt>
                  <dd className="font-medium">
                    {new Date(data.pickup_time).toLocaleString("nl-NL", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </dd>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[var(--brand-gold)]" />
                <div>
                  <dt className="text-muted-foreground">Afhalen bij</dt>
                  <dd className="font-medium">De Kaaskantine, Alkmaar</dd>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-[var(--brand-gold)]" />
                <div>
                  <dt className="text-muted-foreground">Bevestiging naar</dt>
                  <dd className="font-medium">{data.customer_email}</dd>
                </div>
              </div>
            </dl>
            <div className="mt-5 border-t border-border/60 pt-4">
              <div className="flex items-center justify-between">
                <span className="font-semibold">Totaal</span>
                <span className="font-display text-xl font-bold text-primary">
                  {formatEUR(data.total_cents)}
                </span>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Te voldoen bij afhalen (contant of pin).
              </p>
            </div>
          </div>
        )}

        {!data && (
          <p className="mt-6 text-sm text-muted-foreground">
            We kunnen de details van deze bestelling niet meer tonen. Je ontvangt een bevestiging per e-mail zodra dit is ingesteld.
          </p>
        )}

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-full border border-input bg-background px-6 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Terug naar home
          </Link>
          <Link
            to="/menu"
            className="inline-flex items-center justify-center rounded-full bg-[var(--brand-gold)] px-6 py-2.5 text-sm font-semibold text-primary shadow-sm hover:shadow-md"
          >
            Nog iets bestellen
          </Link>
        </div>

        <p className="mt-8 flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <Phone className="h-3.5 w-3.5" />
          Vragen? Bel ons direct via de contactpagina.
        </p>
      </div>
    </div>
  );
}
