import { createFileRoute, Link } from "@tanstack/react-router";
import staffAsset from "../assets/kaaskantine-sign.jpg.asset.json";
import shopAsset from "../assets/kaaskantine-storefront.jpg.asset.json";
const staff = staffAsset.url;
const shop = shopAsset.url;
import alkmaar from "../assets/alkmaar-street.jpg";

export const Route = createFileRoute("/over-ons")({
  head: () => ({
    meta: [
      { title: "Over ons — De Kaaskantine Alkmaar" },
      {
        name: "description",
        content:
          "Ontdek het verhaal van De Kaaskantine: ambachtelijke kaas, delicatessen en vers belegde broodjes in het centrum van Alkmaar.",
      },
      { property: "og:title", content: "Over ons — De Kaaskantine" },
      { property: "og:description", content: "Ambachtelijk vakmanschap in hartje Alkmaar." },
      { property: "og:url", content: "/over-ons" },
    ],
    links: [{ rel: "canonical", href: "/over-ons" }],
  }),
  component: Page,
});

function Page() {
  return (
    <>
      <section className="mx-auto max-w-4xl px-4 pt-20 pb-12 text-center sm:px-6 sm:pt-28 lg:px-8">
        <span className="text-xs font-semibold uppercase tracking-[0.25em] text-[var(--brand-brown)]">
          Over ons
        </span>
        <h1 className="mt-4 font-display text-5xl font-semibold leading-tight text-primary sm:text-6xl md:text-7xl">
          Vakmanschap proef je.
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-foreground/80">
          De Kaaskantine is een ambachtelijke kaas- en delicatessenwinkel in het centrum
          van Alkmaar. Wij bieden een uitgebreid assortiment Hollandse kazen, heerlijke
          vleeswaren, delicatessen en vers belegde broodjes. Kwaliteit, lokale producten
          en persoonlijke service staan bij ons centraal.
        </p>
      </section>

      <section className="mx-auto grid max-w-7xl gap-5 px-4 pb-20 sm:px-6 md:grid-cols-3 lg:px-8">
        {[staff, shop, alkmaar].map((src, i) => (
          <img
            key={i}
            src={src}
            alt="De Kaaskantine"
            loading="lazy"
            className="aspect-[4/5] w-full rounded-3xl object-cover shadow-md"
          />
        ))}
      </section>

      <div className="mx-auto max-w-4xl px-4 pb-24 text-center sm:px-6 lg:px-8">
        <Link
          to="/contact"
          className="inline-flex items-center justify-center rounded-full bg-[var(--brand-gold)] px-7 py-3.5 text-base font-semibold text-primary shadow-md transition-all hover:-translate-y-0.5"
        >
          Kom langs
        </Link>
      </div>
    </>
  );
}
