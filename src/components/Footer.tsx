import { Link } from "@tanstack/react-router";
import { Instagram, MapPin, Phone } from "lucide-react";

const NAV = [
  { to: "/", label: "Home" },
  { to: "/over-ons", label: "Over ons" },
  { to: "/kaas", label: "Kaas" },
  { to: "/delicatessen", label: "Delicatessen" },
  { to: "/broodjes", label: "Broodjes" },
  { to: "/borrelplanken", label: "Borrelplanken" },
  { to: "/contact", label: "Contact" },
] as const;

export function Footer() {
  return (
    <footer className="mt-24 bg-primary text-primary-foreground">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 md:grid-cols-4 lg:px-8">
        <div className="md:col-span-1">
          <div className="flex items-center gap-2">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-[var(--brand-gold)] font-display text-lg font-semibold text-primary">
              K
            </span>
            <span className="font-display text-xl font-semibold">De Kaaskantine</span>
          </div>
          <p className="mt-4 text-sm leading-relaxed text-primary-foreground/80">
            Ambachtelijke kazen, delicatessen en vers belegde broodjes in hartje Alkmaar.
          </p>
        </div>

        <div>
          <h3 className="font-display text-base font-semibold text-[var(--brand-gold)]">
            Navigatie
          </h3>
          <ul className="mt-4 space-y-2 text-sm">
            {NAV.map((item) => (
              <li key={item.to}>
                <Link
                  to={item.to}
                  className="text-primary-foreground/80 transition-colors hover:text-[var(--brand-gold)]"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="font-display text-base font-semibold text-[var(--brand-gold)]">
            Contact
          </h3>
          <ul className="mt-4 space-y-3 text-sm text-primary-foreground/80">
            <li className="flex items-start gap-2">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[var(--brand-gold)]" aria-hidden="true" />
              <span>
                Hofstraat 4
                <br />
                1811 EV Alkmaar
              </span>
            </li>
            <li>
              <a
                href="tel:+31613448377"
                className="flex items-center gap-2 hover:text-[var(--brand-gold)]"
              >
                <Phone className="h-4 w-4 shrink-0 text-[var(--brand-gold)]" aria-hidden="true" />
                06 13448377
              </a>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="font-display text-base font-semibold text-[var(--brand-gold)]">
            Volg ons
          </h3>
          <a
            href="https://www.instagram.com/dekaaskantine?igsh=MWZvNGlta29ucWhjbg=="
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Instagram"
            className="mt-4 inline-flex h-11 w-11 items-center justify-center rounded-full border border-primary-foreground/20 transition-colors hover:border-[var(--brand-gold)] hover:text-[var(--brand-gold)]"
          >
            <Instagram className="h-5 w-5" />
          </a>
        </div>
      </div>

      <div className="border-t border-primary-foreground/10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 py-6 text-xs text-primary-foreground/60 sm:flex-row sm:px-6 lg:px-8">
          <p>© 2026 De Kaaskantine. Alle rechten voorbehouden.</p>
          <p>Hofstraat 4, 1811 EV Alkmaar</p>
        </div>
      </div>
    </footer>
  );
}
