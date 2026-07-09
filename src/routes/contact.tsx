import { createFileRoute } from "@tanstack/react-router";
import { Contact } from "../components/home/Contact";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — De Kaaskantine Alkmaar" },
      {
        name: "description",
        content:
          "Kom langs bij De Kaaskantine aan de Hofstraat 4 in Alkmaar. Openingstijden, adres en contactformulier.",
      },
      { property: "og:title", content: "Contact — De Kaaskantine" },
      { property: "og:description", content: "Hofstraat 4, 1811 EV Alkmaar." },
      { property: "og:url", content: "/contact" },
    ],
    links: [{ rel: "canonical", href: "/contact" }],
  }),
  component: Page,
});

function Page() {
  return (
    <>
      <section className="mx-auto max-w-4xl px-4 pt-20 pb-4 text-center sm:px-6 sm:pt-28 lg:px-8">
        <span className="text-xs font-semibold uppercase tracking-[0.25em] text-[var(--brand-brown)]">
          Contact
        </span>
        <h1 className="mt-4 font-display text-5xl font-semibold leading-tight text-primary sm:text-6xl md:text-7xl">
          Kom langs
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-foreground/80">
          We zien je graag in de winkel — of stuur ons een bericht.
        </p>
      </section>
      <Contact />
    </>
  );
}
