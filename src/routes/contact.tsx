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
  component: () => <Contact />,
});
