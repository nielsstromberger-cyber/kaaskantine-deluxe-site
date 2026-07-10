import staffAsset from "../../assets/kaaskantine-storefront.jpg.asset.json";
const staffImg = staffAsset.url;
import { SectionReveal } from "../SectionReveal";

export function About() {
  return (
    <section id="over-ons" className="mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-32 lg:px-8">
      <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
        <SectionReveal>
          <div className="relative">
            <div className="absolute -inset-4 -z-10 rounded-[2rem] bg-[var(--brand-gold)]/25 blur-2xl" />
            <img
              src={staffImg}
              alt="Vakman achter de toonbank van De Kaaskantine"
              className="aspect-[4/5] w-full rounded-[2rem] object-cover shadow-xl"
              loading="lazy"
              width={1200}
              height={1400}
            />
          </div>
        </SectionReveal>

        <SectionReveal delay={120}>
          <span className="text-xs font-semibold uppercase tracking-[0.25em] text-[var(--brand-brown)]">
            Over ons
          </span>
          <h2 className="mt-4 font-display text-4xl font-semibold leading-tight text-primary sm:text-5xl md:text-6xl">
            Vakmanschap <em className="text-[var(--brand-gold)] not-italic">proef</em> je.
          </h2>
          <p className="mt-6 text-lg leading-relaxed text-foreground/80">
            De Kaaskantine is een ambachtelijke kaas- en delicatessenwinkel in het centrum
            van Alkmaar. Wij bieden een uitgebreid assortiment Hollandse kazen, heerlijke
            vleeswaren, delicatessen en vers belegde broodjes.
          </p>
          <p className="mt-4 text-lg leading-relaxed text-foreground/80">
            Kwaliteit, lokale producten en persoonlijke service staan bij ons centraal —
            elke dag opnieuw.
          </p>

          <div className="mt-10 grid grid-cols-3 gap-6 border-t border-border pt-8">
            <div>
              <p className="font-display text-3xl font-semibold text-primary">50+</p>
              <p className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">
                Kazen
              </p>
            </div>
            <div>
              <p className="font-display text-3xl font-semibold text-primary">4,9★</p>
              <p className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">
                Google
              </p>
            </div>
            <div>
              <p className="font-display text-3xl font-semibold text-primary">100%</p>
              <p className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">
                Ambachtelijk
              </p>
            </div>
          </div>
        </SectionReveal>
      </div>
    </section>
  );
}
