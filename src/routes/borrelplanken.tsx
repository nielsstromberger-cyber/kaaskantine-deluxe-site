import { createFileRoute, Link } from "@tanstack/react-router";
import board from "../assets/charcuterie-board.jpg";
import g1 from "../assets/gallery-1.jpg";

export const Route = createFileRoute("/borrelplanken")({
  head: () => ({
    meta: [
      { title: "Borrelplanken — De Kaaskantine Alkmaar" },
      {
        name: "description",
        content:
          "Luxe samengestelde borrelplanken met kaas, charcuterie en delicatessen — voor iedere gelegenheid.",
      },
      { property: "og:title", content: "Borrelplanken — De Kaaskantine" },
      { property: "og:description", content: "Luxe borrelplanken op maat in Alkmaar." },
      { property: "og:url", content: "/borrelplanken" },
    ],
    links: [{ rel: "canonical", href: "/borrelplanken" }],
  }),
  component: Page,
});

const PLATTERS = [
  { name: "De Kleine", persons: "2 personen", text: "Selectie van 3 kazen, charcuterie, olijven en noten." },
  { name: "De Klassieker", persons: "4 personen", text: "5 kazen, charcuterie, tapenade, vijgen en crackers." },
  { name: "De Feestplank", persons: "6–8 personen", text: "Uitgebreide luxe selectie met bijzondere specialiteiten." },
];

function Page() {
  return (
    <>
      <section className="mx-auto max-w-4xl px-4 pt-20 pb-12 text-center sm:px-6 sm:pt-28 lg:px-8">
        <span className="text-xs font-semibold uppercase tracking-[0.25em] text-[var(--brand-brown)]">
          Voor iedere gelegenheid
        </span>
        <h1 className="mt-4 font-display text-5xl font-semibold leading-tight text-primary sm:text-6xl md:text-7xl">
          Borrelplanken
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-foreground/80">
          Luxe samengestelde borrelplanken met kaas, charcuterie en delicatessen. Op maat
          gemaakt voor een verjaardag, borrel of gezellige avond thuis.
        </p>
      </section>

      <section className="mx-auto grid max-w-7xl gap-5 px-4 pb-16 sm:px-6 md:grid-cols-2 lg:px-8">
        <img src={board} alt="Borrelplank" loading="lazy" className="aspect-[4/3] w-full rounded-3xl object-cover shadow-md" />
        <img src={g1} alt="Kaas met vijgen" loading="lazy" className="aspect-[4/3] w-full rounded-3xl object-cover shadow-md" />
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-24 sm:px-6 lg:px-8">
        <div className="grid gap-5 lg:grid-cols-3">
          {PLATTERS.map((p) => (
            <div
              key={p.name}
              className="flex h-full flex-col rounded-3xl border border-border bg-card p-8 shadow-sm transition-all hover:-translate-y-1 hover:border-[var(--brand-gold)]/60 hover:shadow-lg"
            >
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--brand-gold)]">
                {p.persons}
              </span>
              <h3 className="mt-3 font-display text-2xl font-semibold text-primary">
                {p.name}
              </h3>
              <p className="mt-3 flex-1 text-sm leading-relaxed text-foreground/70">
                {p.text}
              </p>
              <Link
                to="/contact"
                className="mt-6 inline-flex items-center justify-center rounded-full border border-primary bg-transparent px-5 py-2.5 text-sm font-semibold text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
              >
                Reserveer
              </Link>
            </div>
          ))}
        </div>

        <p className="mt-10 text-center text-sm text-muted-foreground">
          Plank op maat? Bel of stuur een bericht — we denken graag mee.
        </p>
      </section>
    </>
  );
}
