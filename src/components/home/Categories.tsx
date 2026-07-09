import { Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import cheeseImg from "../../assets/cheese-wheels.jpg";
import deliImg from "../../assets/delicatessen.jpg";
import meatImg from "../../assets/vleeswaren.jpg";
import sandwichImg from "../../assets/fresh-sandwich.jpg";
import boardImg from "../../assets/charcuterie-board.jpg";
import { SectionReveal } from "../SectionReveal";

const CATS = [
  {
    to: "/kaas",
    title: "Hollandse Kaas",
    text: "Van jonge tot oude kaas, boerenkaas en bijzondere specialiteiten.",
    img: cheeseImg,
    span: "lg:col-span-2 lg:row-span-2",
  },
  {
    to: "/delicatessen",
    title: "Delicatessen",
    text: "Olijven, tapenades, noten, sauzen, crackers en meer.",
    img: deliImg,
    span: "",
  },
  {
    to: "/kaas",
    title: "Vleeswaren",
    text: "Vers gesneden vleeswaren van hoge kwaliteit.",
    img: meatImg,
    span: "",
  },
  {
    to: "/broodjes",
    title: "Verse Broodjes",
    text: "Rijk belegde broodjes met verse ingrediënten.",
    img: sandwichImg,
    span: "",
  },
  {
    to: "/borrelplanken",
    title: "Borrelplanken",
    text: "Luxe samengestelde borrelplanken voor iedere gelegenheid.",
    img: boardImg,
    span: "",
  },
] as const;

export function Categories() {
  return (
    <section className="bg-[var(--brand-cream)] py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionReveal className="mx-auto max-w-2xl text-center">
          <span className="text-xs font-semibold uppercase tracking-[0.25em] text-[var(--brand-brown)]">
            Assortiment
          </span>
          <h2 className="mt-4 font-display text-4xl font-semibold leading-tight text-primary sm:text-5xl md:text-6xl">
            Wat we voor je in huis hebben
          </h2>
          <p className="mt-5 text-lg text-foreground/70">
            Zorgvuldig geselecteerd, dagelijks vers en met liefde gepresenteerd.
          </p>
        </SectionReveal>

        <div className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-4 lg:grid-rows-2">
          {CATS.map((cat, i) => (
            <SectionReveal key={cat.title} delay={i * 60} className={cat.span}>
              <Link
                to={cat.to}
                className="group relative flex h-full min-h-[280px] flex-col justify-end overflow-hidden rounded-[1.75rem] bg-primary shadow-md transition-all hover:-translate-y-1 hover:shadow-2xl"
              >
                <img
                  src={cat.img}
                  alt={cat.title}
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-[900ms] ease-out group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-primary/95 via-primary/40 to-transparent" />
                <div className="relative p-6 text-primary-foreground">
                  <h3 className="font-display text-2xl font-semibold sm:text-3xl">
                    {cat.title}
                  </h3>
                  <p className="mt-2 max-w-xs text-sm leading-relaxed text-primary-foreground/85">
                    {cat.text}
                  </p>
                  <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-[var(--brand-gold)]">
                    Bekijk
                    <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </span>
                </div>
              </Link>
            </SectionReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
