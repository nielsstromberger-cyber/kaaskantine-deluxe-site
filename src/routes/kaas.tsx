import { createFileRoute, Link } from "@tanstack/react-router";
import cheese from "../assets/cheese-wheels.jpg";
import g1 from "../assets/gallery-1.jpg";
import shop from "../assets/shop-interior.jpg";

export const Route = createFileRoute("/kaas")({
  head: () => ({
    meta: [
      { title: "Hollandse Kaas — De Kaaskantine Alkmaar" },
      {
        name: "description",
        content:
          "Van jonge tot oude kaas, boerenkaas en bijzondere specialiteiten — zorgvuldig geselecteerd bij De Kaaskantine in Alkmaar.",
      },
      { property: "og:title", content: "Hollandse Kaas — De Kaaskantine" },
      { property: "og:description", content: "Ambachtelijke Hollandse kazen uit Alkmaar." },
      { property: "og:url", content: "/kaas" },
    ],
    links: [{ rel: "canonical", href: "/kaas" }],
  }),
  component: Page,
});

const TYPES = [
  { title: "Jong & Jong belegen", text: "Zacht, romig en mild — een klassieke keuze." },
  { title: "Belegen & Oud", text: "Vol, pittig karakter voor de echte kaasliefhebber." },
  { title: "Boerenkaas", text: "Rauwmelks, met een authentieke smaak van het land." },
  { title: "Specialiteiten", text: "Truffelkaas, kruidenkazen en seizoensgebonden pareltjes." },
  { title: "Geiten- en schapenkaas", text: "Fijne alternatieven met een eigen karakter." },
  { title: "Buitenlandse selecties", text: "Zorgvuldig gekozen aanvullingen op ons Hollandse hart." },
];

function Page() {
  return (
    <>
      <section className="mx-auto max-w-4xl px-4 pt-20 pb-12 text-center sm:px-6 sm:pt-28 lg:px-8">
        <span className="text-xs font-semibold uppercase tracking-[0.25em] text-[var(--brand-brown)]">
          Assortiment
        </span>
        <h1 className="mt-4 font-display text-5xl font-semibold leading-tight text-primary sm:text-6xl md:text-7xl">
          Hollandse Kaas
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-foreground/80">
          Van jonge tot oude kaas, boerenkaas en bijzondere specialiteiten. Ons assortiment
          verandert met de seizoenen — vraag ons gerust naar de nieuwste aanwinsten.
        </p>
      </section>

      <section className="mx-auto grid max-w-7xl gap-5 px-4 pb-16 sm:px-6 md:grid-cols-3 lg:px-8">
        <img src={cheese} alt="Hollandse kaaswielen" loading="lazy" className="aspect-square w-full rounded-3xl object-cover shadow-md md:col-span-2 md:aspect-[2/1]" />
        <img src={g1} alt="Kaas met vijgen" loading="lazy" className="aspect-square w-full rounded-3xl object-cover shadow-md" />
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-24 sm:px-6 lg:px-8">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {TYPES.map((t) => (
            <div
              key={t.title}
              className="rounded-3xl border border-border bg-card p-8 shadow-sm transition-all hover:-translate-y-1 hover:border-[var(--brand-gold)]/60 hover:shadow-lg"
            >
              <h3 className="font-display text-xl font-semibold text-primary">{t.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-foreground/70">{t.text}</p>
            </div>
          ))}
        </div>

        <div className="mt-16 flex flex-col items-center gap-6 rounded-3xl bg-primary p-10 text-center text-primary-foreground sm:p-14">
          <img src={shop} alt="Winkel interieur" loading="lazy" className="h-48 w-full rounded-2xl object-cover shadow-md sm:h-64" />
          <h2 className="font-display text-3xl font-semibold sm:text-4xl">Persoonlijk advies</h2>
          <p className="max-w-xl text-primary-foreground/85">
            Niet zeker wat je zoekt? Kom langs en laat je verrassen door een proefje aan de toonbank.
          </p>
          <Link
            to="/contact"
            className="inline-flex items-center justify-center rounded-full bg-[var(--brand-gold)] px-6 py-3 text-sm font-semibold text-primary shadow-md transition-all hover:-translate-y-0.5"
          >
            Kom proeven
          </Link>
        </div>
      </section>
    </>
  );
}
