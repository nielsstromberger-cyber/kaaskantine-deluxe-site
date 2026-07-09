import { createFileRoute } from "@tanstack/react-router";
import { Hero } from "../components/home/Hero";
import { About } from "../components/home/About";
import { Categories } from "../components/home/Categories";
import { Features } from "../components/home/Features";
import { Reviews } from "../components/home/Reviews";
import { Gallery } from "../components/home/Gallery";
import { Contact } from "../components/home/Contact";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  return (
    <>
      <Hero />
      <About />
      <Categories />
      <Features />
      <Reviews />
      <Gallery />
      <Contact />
    </>
  );
}
