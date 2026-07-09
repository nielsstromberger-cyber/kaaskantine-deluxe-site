import { Award, Sprout, Sun, Handshake, MapPin, GlassWater } from "lucide-react";
import { SectionReveal } from "../SectionReveal";

const FEATURES = [
  { icon: Award, title: "Ambachtelijke kwaliteit", text: "Zorgvuldig geselecteerd en met vakmanschap bereid." },
  { icon: Sprout, title: "Lokale producten", text: "Waar mogelijk kiezen we voor lokale makers en boeren." },
  { icon: Sun, title: "Dagelijks vers", text: "Elke ochtend nieuwe broodjes en verse aanvoer." },
  { icon: Handshake, title: "Persoonlijk advies", text: "We denken graag met je mee — vraag ons alles." },
  { icon: MapPin, title: "Centrale locatie", text: "Hofstraat 4 — midden in hartje Alkmaar." },
  { icon: GlassWater, title: "Lunch én borrel", text: "Perfect voor tussen de middag of een avondje thuis." },
] as const;

export function Features() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-32 lg:px-8">
      <SectionReveal className="mx-auto max-w-2xl text-center">
        <span className="text-xs font-semibold uppercase tracking-[0.25em] text-[var(--brand-brown)]">
          Waarom De Kaaskantine
        </span>
        <h2 className="mt-4 font-display text-4xl font-semibold leading-tight text-primary sm:text-5xl">
          Zes redenen om langs te komen
        </h2>
      </SectionReveal>

      <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((f, i) => (
          <SectionReveal key={f.title} delay={i * 60}>
            <div className="group h-full rounded-3xl border border-border bg-card p-8 shadow-sm transition-all hover:-translate-y-1 hover:border-[var(--brand-gold)]/60 hover:shadow-lg">
              <div className="grid h-14 w-14 place-items-center rounded-2xl bg-[var(--brand-gold)]/15 text-[var(--brand-gold)] transition-colors group-hover:bg-[var(--brand-gold)] group-hover:text-primary">
                <f.icon className="h-6 w-6" aria-hidden="true" />
              </div>
              <h3 className="mt-6 font-display text-xl font-semibold text-primary">
                {f.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-foreground/70">{f.text}</p>
            </div>
          </SectionReveal>
        ))}
      </div>
    </section>
  );
}
