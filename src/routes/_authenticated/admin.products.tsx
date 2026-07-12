import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Trash2, Package } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/products")({
  component: ProductsPage,
});

type Category = { id: string; name: string; slug: string; is_active: boolean; sort_order: number };
type Product = {
  id: string;
  name: string;
  description: string | null;
  allergens: string | null;
  price_cents: number;
  category_id: string;
  is_available: boolean;
  sort_order: number;
  image_url: string | null;
};

function ProductsPage() {
  const qc = useQueryClient();

  const { data: cats = [] } = useQuery({
    queryKey: ["admin-cats"],
    queryFn: async () => {
      const { data, error } = await supabase.from("categories").select("*").order("sort_order");
      if (error) throw error;
      return (data ?? []) as Category[];
    },
  });

  const { data: products = [] } = useQuery({
    queryKey: ["admin-products"],
    queryFn: async () => {
      const { data, error } = await supabase.from("products").select("*").order("sort_order");
      if (error) throw error;
      return (data ?? []) as Product[];
    },
  });

  const upsert = useMutation({
    mutationFn: async (p: Partial<Product> & { id?: string }) => {
      if (!p.name || !p.category_id) throw new Error("Naam en categorie zijn verplicht");
      const payload = {
        name: p.name,
        description: p.description ?? null,
        allergens: p.allergens ?? null,
        price_cents: p.price_cents ?? 0,
        category_id: p.category_id,
        is_available: p.is_available ?? true,
        sort_order: p.sort_order ?? 0,
        image_url: p.image_url ?? null,
      };
      if (p.id) {
        const { error } = await supabase.from("products").update(payload).eq("id", p.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("products").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-products"] });
      toast.success("Opgeslagen");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-products"] });
      toast.success("Verwijderd");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const [creating, setCreating] = useState(false);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold text-primary">Producten</h1>
          <p className="mt-1 text-sm text-muted-foreground">Beheer het menu: prijzen, beschrijvingen en beschikbaarheid.</p>
        </div>
        <button
          onClick={() => setCreating(true)}
          className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" /> Nieuw product
        </button>
      </div>

      {creating && (
        <div className="mt-6">
          <ProductEditor
            categories={cats}
            initial={null}
            onSave={(p) => {
              upsert.mutate(p, { onSuccess: () => setCreating(false) });
            }}
            onCancel={() => setCreating(false)}
          />
        </div>
      )}

      <div className="mt-6 space-y-8">
        {cats.map((c) => {
          const items = products.filter((p) => p.category_id === c.id);
          return (
            <section key={c.id}>
              <h2 className="font-display text-xl font-semibold text-primary">{c.name}</h2>
              <div className="mt-3 space-y-3">
                {items.length === 0 && (
                  <p className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
                    Geen producten in deze categorie.
                  </p>
                )}
                {items.map((p) => (
                  <ProductRow
                    key={p.id}
                    product={p}
                    categories={cats}
                    onSave={(v) => upsert.mutate({ ...v, id: p.id })}
                    onDelete={() => {
                      if (confirm(`Verwijder "${p.name}"?`)) del.mutate(p.id);
                    }}
                  />
                ))}
              </div>
            </section>
          );
        })}
        {cats.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border p-12 text-center">
            <Package className="mx-auto h-10 w-10 text-muted-foreground/50" />
            <p className="mt-3 text-muted-foreground">Geen categorieën.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function ProductRow({
  product,
  categories,
  onSave,
  onDelete,
}: {
  product: Product;
  categories: Category[];
  onSave: (p: Partial<Product>) => void;
  onDelete: () => void;
}) {
  const [editing, setEditing] = useState(false);
  if (editing) {
    return (
      <ProductEditor
        categories={categories}
        initial={product}
        onSave={(p) => {
          onSave(p);
          setEditing(false);
        }}
        onCancel={() => setEditing(false)}
      />
    );
  }
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="flex-1">
        <p className="font-semibold text-primary">
          {product.name}{" "}
          {!product.is_available && (
            <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
              inactief
            </span>
          )}
        </p>
        {product.description && (
          <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">{product.description}</p>
        )}
      </div>
      <div className="flex items-center gap-3">
        <span className="font-display text-lg font-bold text-[var(--brand-gold)]">
          €{(product.price_cents / 100).toFixed(2)}
        </span>
        <button
          onClick={() => setEditing(true)}
          className="rounded-full border border-border bg-background px-3 py-1.5 text-sm hover:bg-secondary"
        >
          Bewerk
        </button>
        <button
          onClick={onDelete}
          className="rounded-full border border-destructive/30 bg-destructive/5 p-1.5 text-destructive hover:bg-destructive/10"
          aria-label="Verwijder"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function ProductEditor({
  categories,
  initial,
  onSave,
  onCancel,
}: {
  categories: Category[];
  initial: Product | null;
  onSave: (p: Partial<Product>) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState({
    name: initial?.name ?? "",
    description: initial?.description ?? "",
    allergens: initial?.allergens ?? "",
    price_euros: initial ? (initial.price_cents / 100).toFixed(2) : "",
    category_id: initial?.category_id ?? categories[0]?.id ?? "",
    is_available: initial?.is_available ?? true,
    sort_order: initial?.sort_order ?? 0,
    image_url: initial?.image_url ?? "",
  });

  const save = () => {
    if (!form.name.trim() || !form.category_id) {
      toast.error("Naam en categorie zijn verplicht");
      return;
    }
    const cents = Math.round(Number(form.price_euros.replace(",", ".")) * 100);
    if (!Number.isFinite(cents) || cents < 0) {
      toast.error("Ongeldige prijs");
      return;
    }
    onSave({
      name: form.name.trim(),
      description: form.description.trim() || null,
      allergens: form.allergens.trim() || null,
      price_cents: cents,
      category_id: form.category_id,
      is_available: form.is_available,
      sort_order: Number(form.sort_order) || 0,
      image_url: form.image_url.trim() || null,
    });
  };

  return (
    <div className="rounded-xl border border-primary/30 bg-card p-5 shadow-sm">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block sm:col-span-2">
          <span className="mb-1 block text-xs font-medium">Naam</span>
          <input
            className="input"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          />
        </label>
        <label className="block sm:col-span-2">
          <span className="mb-1 block text-xs font-medium">Beschrijving</span>
          <textarea
            className="input min-h-20"
            rows={2}
            value={form.description ?? ""}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium">Allergenen</span>
          <input
            className="input"
            value={form.allergens ?? ""}
            onChange={(e) => setForm((f) => ({ ...f, allergens: e.target.value }))}
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium">Prijs (€)</span>
          <input
            className="input"
            inputMode="decimal"
            value={form.price_euros}
            onChange={(e) => setForm((f) => ({ ...f, price_euros: e.target.value }))}
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium">Categorie</span>
          <select
            className="input"
            value={form.category_id}
            onChange={(e) => setForm((f) => ({ ...f, category_id: e.target.value }))}
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium">Sortering</span>
          <input
            className="input"
            type="number"
            value={form.sort_order}
            onChange={(e) => setForm((f) => ({ ...f, sort_order: Number(e.target.value) }))}
          />
        </label>
        <label className="block sm:col-span-2">
          <span className="mb-1 block text-xs font-medium">Afbeelding URL (optioneel)</span>
          <input
            className="input"
            value={form.image_url ?? ""}
            onChange={(e) => setForm((f) => ({ ...f, image_url: e.target.value }))}
          />
        </label>
        <label className="flex items-center gap-2 sm:col-span-2">
          <input
            type="checkbox"
            checked={form.is_available}
            onChange={(e) => setForm((f) => ({ ...f, is_available: e.target.checked }))}
          />
          <span className="text-sm">Beschikbaar in het menu</span>
        </label>
      </div>
      <div className="mt-4 flex gap-2">
        <button
          onClick={save}
          className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
        >
          Opslaan
        </button>
        <button
          onClick={onCancel}
          className="rounded-full border border-border bg-background px-5 py-2 text-sm hover:bg-secondary"
        >
          Annuleren
        </button>
      </div>
    </div>
  );
}
