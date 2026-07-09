import { SectionReveal } from "../SectionReveal";
import sandwich from "../../assets/fresh-sandwich.jpg";
import cheese from "../../assets/cheese-wheels.jpg";
import board from "../../assets/charcuterie-board.jpg";
import shop from "../../assets/shop-interior.jpg";
import deli from "../../assets/delicatessen.jpg";
import customers from "../../assets/gallery-3.jpg";
import g1 from "../../assets/gallery-1.jpg";
import g2 from "../../assets/gallery-2.jpg";
import alkmaar from "../../assets/alkmaar-street.jpg";

const IMAGES = [
  { src: sandwich, alt: "Vers belegd broodje" },
  { src: cheese, alt: "Hollandse kaaswielen" },
  { src: board, alt: "Borrelplank met kaas en charcuterie" },
  { src: shop, alt: "De winkel van De Kaaskantine" },
  { src: g1, alt: "Kaas met vijgen en druiven" },
  { src: deli, alt: "Delicatessen op een plank" },
  { src: g2, alt: "Broodje van bovenaf" },
  { src: customers, alt: "Klanten in de winkel" },
  { src: alkmaar, alt: "Hartje Alkmaar" },
];

export function Gallery() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-32 lg:px-8">
      <SectionReveal className="mx-auto max-w-2xl text-center">
        <span className="text-xs font-semibold uppercase tracking-[0.25em] text-[var(--brand-brown)]">
          Galerij
        </span>
        <h2 className="mt-4 font-display text-4xl font-semibold leading-tight text-primary sm:text-5xl">
          Een kijkje bij ons
        </h2>
      </SectionReveal>

      <SectionReveal className="mt-14">
        <div className="columns-1 gap-5 sm:columns-2 lg:columns-3 [&>*]:mb-5 [&>*]:break-inside-avoid">
          {IMAGES.map((img, i) => (
            <div
              key={i}
              className="group overflow-hidden rounded-2xl bg-muted shadow-sm transition-shadow hover:shadow-xl"
            >
              <img
                src={img.src}
                alt={img.alt}
                loading="lazy"
                className="w-full transition-transform duration-[900ms] ease-out group-hover:scale-105"
              />
            </div>
          ))}
        </div>
      </SectionReveal>
    </section>
  );
}
