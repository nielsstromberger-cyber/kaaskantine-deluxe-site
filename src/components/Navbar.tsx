import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "./ui/sheet";
import { CartDrawer } from "./CartDrawer";
import logo from "../assets/logo.jpg";

const NAV = [
  { to: "/", label: "Home" },
  { to: "/over-ons", label: "Over ons" },
  { to: "/menu", label: "Menu" },
  { to: "/kaas", label: "Kaas" },
  { to: "/delicatessen", label: "Delicatessen" },
  { to: "/broodjes", label: "Broodjes" },
  { to: "/borrelplanken", label: "Borrelplanken" },
  { to: "/contact", label: "Contact" },
] as const;

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-all duration-300 ${
        scrolled
          ? "border-b border-border/60 bg-background/85 backdrop-blur-xl shadow-sm"
          : "bg-background/40 backdrop-blur-sm"
      }`}
    >
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2 group" aria-label="De Kaaskantine home">
          <img
            src={logo}
            alt="De Kaaskantine logo"
            className="h-10 w-10 shrink-0 rounded-full object-cover shadow-sm ring-1 ring-border transition-transform group-hover:scale-105"
          />
          <span className="font-display text-lg font-semibold tracking-tight text-primary sm:text-xl">
            De Kaaskantine
          </span>
        </Link>

        <ul className="hidden items-center gap-1 lg:flex">
          {NAV.map((item) => (
            <li key={item.to}>
              <Link
                to={item.to}
                className="rounded-full px-3 py-2 text-sm font-medium text-foreground/80 transition-colors hover:text-primary"
                activeProps={{ className: "text-primary" }}
                activeOptions={{ exact: item.to === "/" }}
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-2">
          <Link
            to="/contact"
            className="hidden rounded-full bg-[var(--brand-gold)] px-5 py-2.5 text-sm font-semibold text-primary shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5 hover:bg-[var(--brand-gold-soft)] sm:inline-flex"
          >
            Bestellen
          </Link>

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger
              className="grid h-11 w-11 place-items-center rounded-full border border-border bg-background text-primary lg:hidden"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </SheetTrigger>
            <SheetContent side="right" className="w-full max-w-sm bg-background p-6">
              <SheetTitle className="font-display text-2xl text-primary">Menu</SheetTitle>
              <ul className="mt-8 flex flex-col gap-1">
                {NAV.map((item) => (
                  <li key={item.to}>
                    <Link
                      to={item.to}
                      onClick={() => setOpen(false)}
                      className="block rounded-xl px-4 py-3 text-lg font-medium text-foreground/90 transition-colors hover:bg-secondary hover:text-primary"
                      activeProps={{ className: "bg-secondary text-primary" }}
                      activeOptions={{ exact: item.to === "/" }}
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
              <Link
                to="/contact"
                onClick={() => setOpen(false)}
                className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-[var(--brand-gold)] px-5 py-3 text-base font-semibold text-primary shadow-sm"
              >
                Bestellen
              </Link>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </header>
  );
}
