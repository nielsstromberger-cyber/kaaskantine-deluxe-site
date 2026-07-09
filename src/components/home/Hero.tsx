import { Link } from "@tanstack/react-router";
import { Star } from "lucide-react";
import heroImg from "../../assets/hero-shop.jpg";

export function Hero() {
  return (
    <section className="relative isolate overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <img
          src={heroImg}
          alt="Warme sfeer in De Kaaskantine in Alkmaar"
          className="h-full w-full object-cover"
          width={1920}
          height={1280}
          fetchPriority="high"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-primary/70 via-primary/50 to-primary/85" />
      </div>

      <div className="mx-auto flex min-h-[92vh] max-w-7xl flex-col items-center justify-center px-4 py-24 text-center text-primary-foreground sm:px-6 lg:px-8">
        <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-[var(--brand-gold)]/50 bg-primary/30 px-4 py-1.5 text-xs font-medium uppercase tracking-[0.2em] text-[var(--brand-gold)] backdrop-blur">
          Ambachtelijk sinds dag één
        </span>

        <h1 className="font-display text-5xl font-semibold leading-[1.05] tracking-tight sm:text-6xl md:text-7xl lg:text-8xl">
          De Kaaskantine
        </h1>

        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-primary-foreground/90 sm:text-xl">
          Ambachtelijke kazen, delicatessen &amp; vers belegde broodjes in hartje Alkmaar.
        </p>

        <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:gap-4">
          <Link
            to="/kaas"
            className="inline-flex items-center justify-center rounded-full bg-[var(--brand-gold)] px-7 py-3.5 text-base font-semibold text-primary shadow-lg transition-all hover:-translate-y-0.5 hover:bg-[var(--brand-gold-soft)] hover:shadow-xl"
          >
            Bekijk assortiment
          </Link>
          <Link
            to="/broodjes"
            className="inline-flex items-center justify-center rounded-full border border-primary-foreground/40 bg-primary-foreground/5 px-7 py-3.5 text-base font-semibold text-primary-foreground backdrop-blur transition-all hover:-translate-y-0.5 hover:bg-primary-foreground/15"
          >
            Bestel een broodje
          </Link>
        </div>

        <div className="mt-14 flex items-center gap-3 rounded-full border border-primary-foreground/20 bg-primary/30 px-5 py-2.5 backdrop-blur">
          <div className="flex" aria-label="4,9 uit 5 sterren">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className="h-4 w-4 fill-[var(--brand-gold)] text-[var(--brand-gold)]"
                aria-hidden="true"
              />
            ))}
          </div>
          <span className="text-sm font-medium text-primary-foreground">
            4,9/5 · Google Reviews
          </span>
        </div>
      </div>

      <div
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-b from-transparent to-background"
      />
    </section>
  );
}
