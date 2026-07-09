import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { MapPin, Phone, Clock } from "lucide-react";
import { SectionReveal } from "../SectionReveal";

const schema = z.object({
  name: z.string().trim().min(1, "Vul je naam in").max(100),
  email: z.string().trim().email("Ongeldig e-mailadres").max(255),
  message: z.string().trim().min(1, "Bericht mag niet leeg zijn").max(1000),
});

const HOURS = [
  { day: "Maandag t/m donderdag", time: "08:00 – 18:00" },
  { day: "Vrijdag", time: "08:00 – 18:00" },
  { day: "Zaterdag", time: "08:00 – 17:00" },
  { day: "Zondag", time: "Gesloten" },
];

export function Contact() {
  const [submitting, setSubmitting] = useState(false);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const result = schema.safeParse({
      name: fd.get("name"),
      email: fd.get("email"),
      message: fd.get("message"),
    });
    if (!result.success) {
      toast.error(result.error.issues[0]?.message ?? "Controleer de velden");
      return;
    }
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      toast.success("Bedankt! We nemen zo snel mogelijk contact op.");
      e.currentTarget?.reset();
    }, 700);
  }

  return (
    <section id="contact" className="bg-[var(--brand-cream)] py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionReveal className="mx-auto max-w-2xl text-center">
          <span className="text-xs font-semibold uppercase tracking-[0.25em] text-[var(--brand-brown)]">
            Contact
          </span>
          <h2 className="mt-4 font-display text-4xl font-semibold leading-tight text-primary sm:text-5xl md:text-6xl">
            Kom langs
          </h2>
          <p className="mt-5 text-lg text-foreground/70">
            We zien je graag in de winkel — of stuur ons een bericht.
          </p>
        </SectionReveal>

        <div className="mt-16 grid gap-8 lg:grid-cols-2">
          <SectionReveal>
            <div className="h-full rounded-3xl bg-card p-8 shadow-sm sm:p-10">
              <div className="space-y-8">
                <div className="flex gap-4">
                  <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[var(--brand-gold)]/15 text-[var(--brand-gold)]">
                    <MapPin className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="font-display text-lg font-semibold text-primary">Adres</p>
                    <p className="mt-1 text-foreground/80">
                      Hofstraat 4<br />
                      1811 EV Alkmaar
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[var(--brand-gold)]/15 text-[var(--brand-gold)]">
                    <Phone className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="font-display text-lg font-semibold text-primary">Telefoon</p>
                    <a
                      href="tel:+31613448377"
                      className="mt-1 inline-block text-foreground/80 underline-offset-4 hover:text-primary hover:underline"
                    >
                      06 13448377
                    </a>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[var(--brand-gold)]/15 text-[var(--brand-gold)]">
                    <Clock className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <div className="flex-1">
                    <p className="font-display text-lg font-semibold text-primary">
                      Openingstijden
                    </p>
                    <dl className="mt-2 divide-y divide-border text-sm">
                      {HOURS.map((h) => (
                        <div key={h.day} className="flex justify-between gap-4 py-2">
                          <dt className="text-foreground/80">{h.day}</dt>
                          <dd className="font-medium text-primary">{h.time}</dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                </div>
              </div>

              <form onSubmit={onSubmit} className="mt-10 space-y-4 border-t border-border pt-8">
                <p className="font-display text-lg font-semibold text-primary">
                  Stuur ons een bericht
                </p>
                <div>
                  <label htmlFor="contact-name" className="sr-only">
                    Naam
                  </label>
                  <input
                    id="contact-name"
                    name="name"
                    type="text"
                    required
                    maxLength={100}
                    placeholder="Naam"
                    className="w-full rounded-2xl border border-input bg-background px-4 py-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-[var(--brand-gold)] focus:ring-2 focus:ring-[var(--brand-gold)]/30"
                  />
                </div>
                <div>
                  <label htmlFor="contact-email" className="sr-only">
                    E-mail
                  </label>
                  <input
                    id="contact-email"
                    name="email"
                    type="email"
                    required
                    maxLength={255}
                    placeholder="E-mailadres"
                    className="w-full rounded-2xl border border-input bg-background px-4 py-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-[var(--brand-gold)] focus:ring-2 focus:ring-[var(--brand-gold)]/30"
                  />
                </div>
                <div>
                  <label htmlFor="contact-message" className="sr-only">
                    Bericht
                  </label>
                  <textarea
                    id="contact-message"
                    name="message"
                    required
                    maxLength={1000}
                    rows={4}
                    placeholder="Je bericht"
                    className="w-full resize-none rounded-2xl border border-input bg-background px-4 py-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-[var(--brand-gold)] focus:ring-2 focus:ring-[var(--brand-gold)]/30"
                  />
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex w-full items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:-translate-y-0.5 hover:bg-primary/90 disabled:opacity-60"
                >
                  {submitting ? "Versturen..." : "Verstuur bericht"}
                </button>
              </form>
            </div>
          </SectionReveal>

          <SectionReveal delay={120}>
            <div className="h-full min-h-[500px] overflow-hidden rounded-3xl shadow-sm">
              <iframe
                title="De Kaaskantine — Hofstraat 4, Alkmaar"
                src="https://www.google.com/maps?q=Hofstraat+4,+1811+EV+Alkmaar&output=embed"
                className="h-full w-full border-0"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
              />
            </div>
          </SectionReveal>
        </div>
      </div>
    </section>
  );
}
