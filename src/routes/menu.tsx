import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Plus, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useCart, formatEUR } from "@/lib/cart-store";
import { toast } from "sonner";

type Product = {
  id: string;
  name: string;
  description: string | null;
  allergens: string | null;
  price_cents: number;
  image_url: string | null;
  category_id: string;
  stock_quantity: number | null;
  low_stock_threshold: number;
};

type Category = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  sort_order: number;
  products: Product[];
};

async function fetchMenu(): Promise<Category[]> {
  const { data: cats, error: catErr } = await supabase
    .from("categories")
    .select("id, name, slug, description, sort_order")
    .eq("is_active", true)
    .order("sort_order");
  if (catErr) throw catErr;

  const { data: prods, error: prodErr } = await supabase
    .from("products")
    .select("id, name, description, allergens, price_cents, image_url, category_id, sort_order, stock_quantity, low_stock_threshold")
    .eq("is_available", true)
    .order("sort_order");
  if (prodErr) throw prodErr;


  return (cats ?? []).map((c) => ({
    ...c,
    products: (prods ?? []).filter((p) => p.category_id === c.id),
  }));
}

export const Route = createFileRoute("/menu")({
  head: () => ({
    meta: [
      { title: "Bestellen — De Kaaskantine Alkmaar" },
      {
        name: "description",
        content:
          "Bestel online bij De Kaaskantine in Alkmaar. Vers belegde broodjes, klassiekers en dagelijkse specials. Eenvoudig afhalen op jouw gewenste tijd.",
      },
      { property: "og:title", content: "Bestellen — De Kaaskantine Alkmaar" },
      { property: "og:description", content: "Bestel online: vers belegde broodjes uit Alkmaar." },
    ],
  }),
  component: MenuPage,
});

function MenuPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["menu"],
    queryFn: fetchMenu,
  });
  const add = useCart((s) => s.add);

  const onAdd = (p: Product) => {
    add({ productId: p.id, name: p.name, priceCents: p.price_cents });
    toast.success(`${p.name} toegevoegd`, { duration: 1600 });
  };

  return (
    <div className="bg-background">
      <section className="border-b border-border/60 bg-secondary/30">
        <div className="mx-auto max-w-6xl px-4 py-16 text-center sm:px-6 lg:px-8 lg:py-20">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--brand-gold)]">
            Online bestellen
          </p>
          <h1 className="font-display text-4xl font-semibold text-primary sm:text-5xl">
            Ons menu
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground">
            Kies je favoriete broodje, voeg het toe aan de winkelwagen en haal het op wanneer het jou uitkomt.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        {isLoading && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-48 animate-pulse rounded-2xl bg-muted" />
            ))}
          </div>
        )}
        {error && (
          <div className="flex items-center gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-destructive">
            <AlertCircle className="h-5 w-5" />
            <p className="text-sm">Het menu kon niet geladen worden. Probeer het opnieuw.</p>
          </div>
        )}

        {data?.map((cat) => (
          <div key={cat.id} className="mb-16 last:mb-0">
            <div className="mb-8 flex items-baseline justify-between border-b border-border/50 pb-3">
              <h2 className="font-display text-3xl font-semibold text-primary">{cat.name}</h2>
              {cat.description && (
                <p className="hidden text-sm text-muted-foreground sm:block">{cat.description}</p>
              )}
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {cat.products.map((p) => (
                <article
                  key={p.id}
                  className="group flex flex-col rounded-2xl border border-border bg-card p-5 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md"
                >
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <h3 className="font-display text-lg font-semibold text-primary">{p.name}</h3>
                    <span className="shrink-0 font-display text-lg font-bold text-[var(--brand-gold)]">
                      {formatEUR(p.price_cents)}
                    </span>
                  </div>
                  {p.description && (
                    <p className="mb-3 flex-1 text-sm leading-relaxed text-muted-foreground">
                      {p.description}
                    </p>
                  )}
                  {p.allergens && (
                    <p className="mb-4 text-xs italic text-muted-foreground/80">
                      Allergenen: {p.allergens}
                    </p>
                  )}
                  <button
                    type="button"
                    onClick={() => onAdd(p)}
                    className="mt-auto inline-flex items-center justify-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90 hover:shadow-md"
                  >
                    <Plus className="h-4 w-4" />
                    Toevoegen
                  </button>
                </article>
              ))}
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
