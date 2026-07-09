# Plan: De Kaaskantine website

Een complete, luxe one-page website (met aparte routes voor SEO) voor de ambachtelijke kaas- en delicatessenwinkel in Alkmaar.

## Design systeem

Tokens in `src/styles.css` (oklch equivalenten van de gevraagde hex):
- `--brand-green` #23432A (primary)
- `--brand-cream` #F8F4EC (background)
- `--brand-brown` #5A3E2B (secondary)
- `--brand-gold` #C7A55B (accent)
- Wit voor kaarten
- Fonts via `<link>` in `__root.tsx`: Playfair Display (koppen) + Inter (body), geregistreerd als `--font-display` en `--font-sans`
- Ruime radius (`rounded-2xl`), zachte schaduwen, veel witruimte
- Scroll animaties via bestaande `animate-fade-in` / IntersectionObserver hook

## Routes

Aparte routes voor SEO (elk met eigen `head()` title/description/og):
- `/` — home met hero + alle sectie-samenvattingen
- `/over-ons`
- `/kaas`
- `/delicatessen`
- `/broodjes`
- `/borrelplanken`
- `/contact`

Sticky navbar component gedeeld via `__root.tsx` layout, met "Bestellen" CTA-knop (goud) rechts. Actieve link-styling via `activeProps`.

## Home pagina secties

1. **Hero** — fullscreen achtergrondfoto van kaaswinkel, donkergroene overlay, Playfair titel "De Kaaskantine", subtekst, twee knoppen (goud primair "Bekijk assortiment", outline "Bestel een broodje"), onder de hero 5-sterren badge "4,9/5 Google Reviews".
2. **Over ons** — twee-koloms: foto van winkel/personeel + tekst "Vakmanschap proef je."
3. **Productcategorieën** — 5 kaarten (Kaas, Delicatessen, Vleeswaren, Broodjes, Borrelplanken) met foto, titel, korte tekst, hover-lift effect, elk linkt naar de sub-route.
4. **Waarom De Kaaskantine** — 6 feature items met lucide iconen in gouden cirkel (Ambachtelijk, Lokaal, Dagelijks vers, Persoonlijk advies, Centrale locatie, Lunch & borrel).
5. **Reviews** — 3 kaarten met sterren, quote, naam.
6. **Galerij** — masonry grid met CSS columns (broodjes, kazen, borrelplanken, winkel, delicatessen, klanten). Lazy loading via `loading="lazy"`.
7. **Contact** — twee-koloms: links adres/telefoon (klikbare `tel:`)/openingstijden + contactformulier (Zod validatie, naam/email/bericht, alleen client-side toast — geen backend); rechts embedded Google Maps iframe voor Hofstraat 4, Alkmaar (geen API key nodig, gewone embed).
8. **Footer** — logo woordmerk, nav links, adres, telefoon, Instagram icoon, copyright.

## Sub-pagina's

Elke categorie-pagina (kaas/delicatessen/broodjes/borrelplanken/over-ons/contact) krijgt: hero-strip met sectietitel, uitgebreide beschrijving, foto grid, en CTA terug naar contact/bestellen. Minimale content maar SEO-metadata volledig ingevuld per pagina.

## Afbeeldingen

Genereer via `imagegen` en sla op onder `src/assets/`:
- `hero-shop.jpg` — sfeervolle kaaswinkel interieur
- `cheese-wheels.jpg` — Hollandse kazen op plank
- `charcuterie-board.jpg` — borrelplank
- `fresh-sandwich.jpg` — belegd broodje
- `delicatessen.jpg` — olijven/tapenades
- `vleeswaren.jpg` — gesneden vleeswaren
- `shop-interior.jpg` — winkel binnen
- `staff.jpg` — personeel achter toonbank
- `alkmaar-street.jpg` — Alkmaar centrum sfeerfoto
- 4-6 extra gallery shots

Alle met beschrijvende `alt` teksten voor toegankelijkheid.

## Technische details

- Fonts geladen via `<link>` in root head (niet via CSS `@import`)
- `head()` per route met `title`, `description`, `og:title`, `og:description`, `og:type`, relative canonical + og:url
- Root `og:image` weggelaten (leaf routes zonder betekenisvolle image → hosting injecteert screenshot)
- WCAG: semantische HTML (`<header>`, `<main>`, `<nav>`, `<footer>`), aria-labels op icon-only buttons, focus-visible states, kleurcontrast met donkergroen op crème
- Responsive: mobile-first, hamburger menu op mobiel (shadcn Sheet), grid → 1 kolom mobiel
- Scroll animaties: kleine `useInView` hook met `animate-fade-in` op secties
- Google Maps via standaard `<iframe src="https://www.google.com/maps/embed?...">` — geen connector nodig
- Sticky nav met backdrop-blur na scroll

## Bestanden

Nieuw:
- `src/components/Navbar.tsx`, `Footer.tsx`, `SectionReveal.tsx` (scroll-animatie wrapper)
- `src/components/home/Hero.tsx`, `About.tsx`, `Categories.tsx`, `Features.tsx`, `Reviews.tsx`, `Gallery.tsx`, `Contact.tsx`
- `src/routes/over-ons.tsx`, `kaas.tsx`, `delicatessen.tsx`, `broodjes.tsx`, `borrelplanken.tsx`, `contact.tsx`
- `src/assets/*.jpg` (via imagegen)

Aangepast:
- `src/routes/__root.tsx` — fonts, meta, Navbar+Footer wrapper
- `src/routes/index.tsx` — home compositie
- `src/styles.css` — brand tokens + font families
