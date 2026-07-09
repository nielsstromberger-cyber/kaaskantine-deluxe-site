import { Star } from "lucide-react";
import { SectionReveal } from "../SectionReveal";

const REVIEWS = [
  {
    stars: 5,
    text: "De Kaaskantine is veel meer dan alleen een lunchplek. Je kunt hier terecht voor heerlijke broodjes, prachtige kazen, vleeswaren en smaakvolle borrelplanken.",
    name: "Jonathan",
  },
  {
    stars: 5,
    text: "Super aardig personeel & lekkere broodjes.",
    name: "Jil",
  },
  {
    stars: 4,
    text: "Winkel net een paar dagen open. De broodjes zijn goed en royaal belegd.",
    name: "Niels",
  },
] as const;

export function Reviews() {
  return (
    <section className="bg-primary py-24 text-primary-foreground sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionReveal className="mx-auto max-w-2xl text-center">
          <span className="text-xs font-semibold uppercase tracking-[0.25em] text-[var(--brand-gold)]">
            Reviews
          </span>
          <h2 className="mt-4 font-display text-4xl font-semibold leading-tight sm:text-5xl">
            Wat onze klanten zeggen
          </h2>
        </SectionReveal>

        <div className="mt-16 grid gap-6 md:grid-cols-3">
          {REVIEWS.map((r, i) => (
            <SectionReveal key={r.name} delay={i * 80}>
              <figure className="flex h-full flex-col rounded-3xl border border-primary-foreground/10 bg-primary-foreground/5 p-8 backdrop-blur">
                <div className="flex gap-1" aria-label={`${r.stars} van 5 sterren`}>
                  {Array.from({ length: 5 }).map((_, idx) => (
                    <Star
                      key={idx}
                      className={`h-4 w-4 ${
                        idx < r.stars
                          ? "fill-[var(--brand-gold)] text-[var(--brand-gold)]"
                          : "text-primary-foreground/30"
                      }`}
                      aria-hidden="true"
                    />
                  ))}
                </div>
                <blockquote className="mt-6 flex-1 font-display text-lg italic leading-relaxed text-primary-foreground/95">
                  “{r.text}”
                </blockquote>
                <figcaption className="mt-6 text-sm font-medium text-[var(--brand-gold)]">
                  — {r.name}
                </figcaption>
              </figure>
            </SectionReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
