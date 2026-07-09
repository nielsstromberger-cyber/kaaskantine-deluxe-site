import { createFileRoute, Link } from "@tanstack/react-router";
import sandwich from "../assets/fresh-sandwich.jpg";
import g2 from "../assets/gallery-2.jpg";

export const Route = createFileRoute("/broodjes")({
  head: () => ({
    meta: [
      { title: "Verse Broodjes — De Kaaskantine Alkmaar" },
      {
        name: "description",
        content:
          "Rijk belegde broodjes met verse ingrediënten. Dagelijks vers gemaakt in het centrum van Alkmaar.",
      },
      { property: "og:title", content: "Verse Broodjes — De Kaaskantine" },
      { property: "og:description", content: "Royaal belegde verse broodjes in Alkmaar." },
      { property: "og:url", content: "/broodjes" },
    ],
    links: [{ rel: "canonical", href: "/broodjes" }],
  }),
  component: Page,
});

const SANDWICHES = [
  { name: "Oude kaas & vijgenchutney", text: "Rijke belegen kaas met zoete vijg en rucola." },
  { name: "Brie & honing", text: "Romige brie met walnoten en honing op desem." },
  { name: "Serranoham & mozzarella", text: "Klassieke Italiaanse smaken op krokant brood." },
  { name: "Truffelkaas special", text: "Truffelkaas met paddenstoelentapenade — een favoriet." },
  { name: "Gerookte kip pesto", text: "Malse kip, verse pesto en zongedroogde tomaat." },
  { name: "Vegetarische luxe", text: "Geitenkaas, bietjes en honing-mosterd dressing." },
];

function Page() {
  return (
    <>
      <section className="mx-auto max-w-4xl px-4 pt-20 pb-12 text-center sm:px-6 sm:pt-28 lg:px-8">
        <span className="text-xs font-semibold uppercase tracking-[0.25em] text-[var(--brand-brown)]">
          Vers gemaakt
        </span>
        <h1 className="mt-4 font-display text-5xl font-semibold leading-tight text-primary sm:text-6xl md:text-7xl">
          Verse Broodjes
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-foreground/80">
          Rijk belegde broodjes met verse ingrediënten — perfect voor onderweg, op kantoor
          of een lunch in het park.
        </p>
      </section>

      <section className="mx-auto grid max-w-7xl gap-5 px-4 pb-16 sm:px-6 md:grid-cols-2 lg:px-8">
        <img src={sandwich} alt="Vers broodje" loading="lazy" className="aspect-[4/3] w-full rounded-3xl object-cover shadow-md" />
        <img src={g2} alt="Broodje van bovenaf" loading="lazy" className="aspect-[4/3] w-full rounded-3xl object-cover shadow-md" />
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-24 sm:px-6 lg:px-8">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {SANDWICHES.map((s) => (
            <div
              key={s.name}
              className="rounded-3xl border border-border bg-card p-8 shadow-sm transition-all hover:-translate-y-1 hover:border-[var(--brand-gold)]/60 hover:shadow-lg"
            >
              <h3 className="font-display text-xl font-semibold text-primary">{s.name}</h3>
              <p className="mt-2 text-sm leading-relaxed text-foreground/70">{s.text}</p>
            </div>
          ))}
        </div>

        <div className="mt-14 text-center">
          <Link
            to="/contact"
            className="inline-flex items-center justify-center rounded-full bg-[var(--brand-gold)] px-7 py-3.5 text-base font-semibold text-primary shadow-md transition-all hover:-translate-y-0.5"
          >
            Bestel een broodje
          </Link>
        </div>
      </section>
    </>
  );
}
