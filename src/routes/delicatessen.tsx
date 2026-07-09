import { createFileRoute, Link } from "@tanstack/react-router";
import deli from "../assets/delicatessen.jpg";
import meat from "../assets/vleeswaren.jpg";

export const Route = createFileRoute("/delicatessen")({
  head: () => ({
    meta: [
      { title: "Delicatessen — De Kaaskantine Alkmaar" },
      {
        name: "description",
        content:
          "Olijven, tapenades, noten, sauzen, crackers en verse vleeswaren — de fijnste delicatessen bij De Kaaskantine in Alkmaar.",
      },
      { property: "og:title", content: "Delicatessen — De Kaaskantine" },
      { property: "og:description", content: "Fijne delicatessen en vleeswaren." },
      { property: "og:url", content: "/delicatessen" },
    ],
    links: [{ rel: "canonical", href: "/delicatessen" }],
  }),
  component: Page,
});

const ITEMS = [
  "Olijven & tapenades",
  "Noten & gedroogd fruit",
  "Chutneys & sauzen",
  "Crackers & broodjes",
  "Truffelproducten",
  "Ingelegde groenten",
  "Vers gesneden vleeswaren",
  "Paté & rillettes",
];

function Page() {
  return (
    <>
      <section className="mx-auto max-w-4xl px-4 pt-20 pb-12 text-center sm:px-6 sm:pt-28 lg:px-8">
        <span className="text-xs font-semibold uppercase tracking-[0.25em] text-[var(--brand-brown)]">
          Assortiment
        </span>
        <h1 className="mt-4 font-display text-5xl font-semibold leading-tight text-primary sm:text-6xl md:text-7xl">
          Delicatessen
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-foreground/80">
          De perfecte begeleiders bij een goede kaas: olijven, tapenades, noten, sauzen,
          crackers en meer. Plus vers gesneden vleeswaren van hoge kwaliteit.
        </p>
      </section>

      <section className="mx-auto grid max-w-7xl gap-5 px-4 pb-16 sm:px-6 md:grid-cols-2 lg:px-8">
        <img src={deli} alt="Delicatessen" loading="lazy" className="aspect-[4/3] w-full rounded-3xl object-cover shadow-md" />
        <img src={meat} alt="Vleeswaren" loading="lazy" className="aspect-[4/3] w-full rounded-3xl object-cover shadow-md" />
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-24 sm:px-6 lg:px-8">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {ITEMS.map((i) => (
            <div
              key={i}
              className="rounded-2xl border border-border bg-card px-5 py-4 text-sm font-medium text-primary shadow-sm transition-all hover:-translate-y-0.5 hover:border-[var(--brand-gold)]/60"
            >
              {i}
            </div>
          ))}
        </div>
        <div className="mt-14 text-center">
          <Link
            to="/contact"
            className="inline-flex items-center justify-center rounded-full bg-[var(--brand-gold)] px-7 py-3.5 text-base font-semibold text-primary shadow-md transition-all hover:-translate-y-0.5"
          >
            Reserveer je selectie
          </Link>
        </div>
      </section>
    </>
  );
}
