import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { ShoppingBag, Minus, Plus, Trash2 } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "./ui/sheet";
import { useCart, formatEUR } from "@/lib/cart-store";

export function CartDrawer() {
  const [open, setOpen] = useState(false);
  const items = useCart((s) => s.items);
  const count = useCart((s) => s.count());
  const subtotal = useCart((s) => s.subtotalCents());
  const setQuantity = useCart((s) => s.setQuantity);
  const remove = useCart((s) => s.remove);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        className="relative grid h-11 w-11 place-items-center rounded-full border border-border bg-background text-primary transition-colors hover:bg-secondary"
        aria-label={`Winkelwagen (${count})`}
      >
        <ShoppingBag className="h-5 w-5" />
        {count > 0 && (
          <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-[var(--brand-gold)] px-1 text-xs font-bold text-primary">
            {count}
          </span>
        )}
      </SheetTrigger>
      <SheetContent side="right" className="flex w-full max-w-md flex-col bg-background p-0">
        <SheetHeader className="border-b border-border/60 px-6 py-4">
          <SheetTitle className="font-display text-2xl text-primary">Jouw bestelling</SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
            <ShoppingBag className="h-12 w-12 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">Je winkelwagen is nog leeg.</p>
            <Link
              to="/menu"
              onClick={() => setOpen(false)}
              className="inline-flex items-center justify-center rounded-full bg-[var(--brand-gold)] px-6 py-2.5 text-sm font-semibold text-primary shadow-sm transition-all hover:shadow-md"
            >
              Bekijk het menu
            </Link>
          </div>
        ) : (
          <>
            <ul className="flex-1 overflow-y-auto px-6 py-4">
              {items.map((item) => (
                <li
                  key={item.productId}
                  className="flex items-start justify-between gap-3 border-b border-border/40 py-4 last:border-0"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-foreground">{item.name}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {formatEUR(item.priceCents)}
                    </p>
                    <div className="mt-2 inline-flex items-center rounded-full border border-border">
                      <button
                        type="button"
                        onClick={() => setQuantity(item.productId, item.quantity - 1)}
                        aria-label="Minder"
                        className="grid h-8 w-8 place-items-center text-foreground/70 hover:text-primary"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                      <button
                        type="button"
                        onClick={() => setQuantity(item.productId, item.quantity + 1)}
                        aria-label="Meer"
                        className="grid h-8 w-8 place-items-center text-foreground/70 hover:text-primary"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className="font-semibold text-primary">
                      {formatEUR(item.priceCents * item.quantity)}
                    </span>
                    <button
                      type="button"
                      onClick={() => remove(item.productId)}
                      aria-label="Verwijder"
                      className="text-muted-foreground transition-colors hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
            <div className="border-t border-border/60 bg-secondary/30 px-6 py-5">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Subtotaal</span>
                <span className="font-display text-xl font-semibold text-primary">
                  {formatEUR(subtotal)}
                </span>
              </div>
              <Link
                to="/checkout"
                onClick={() => setOpen(false)}
                className="inline-flex w-full items-center justify-center rounded-full bg-[var(--brand-gold)] px-6 py-3 text-base font-semibold text-primary shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5"
              >
                Afrekenen
              </Link>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
