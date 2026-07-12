import { Link, useLocation } from "@tanstack/react-router";
import { Menu, User as UserIcon, X } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "./ui/sheet";
import { CartDrawer } from "./CartDrawer";
import { useAuthUser } from "@/lib/use-auth";
import { MAIN_NAVIGATION, QUICK_LINKS, isRouteActive } from "@/config/navigation";
import { useScroll, useToggle } from "@/hooks/custom-hooks";
import logo from "../assets/logo.jpg";

/**
 * Logo component extracted for reusability
 */
const NavLogo = () => (
  <Link
    to="/"
    className="flex items-center gap-2 group"
    aria-label="De Kaaskantine home"
  >
    <img
      src={logo}
      alt="De Kaaskantine logo"
      className="h-10 w-10 shrink-0 rounded-full object-cover shadow-sm ring-1 ring-border transition-transform group-hover:scale-105"
      loading="lazy"
      width={40}
      height={40}
    />
    <span className="font-display text-lg font-semibold tracking-tight text-primary sm:text-xl">
      De Kaaskantine
    </span>
  </Link>
);

/**
 * Desktop navigation component
 */
const DesktopNav = ({ currentLocation }: { currentLocation: string }) => (
  <ul className="hidden items-center gap-1 lg:flex" role="menubar">
    {MAIN_NAVIGATION.map((item) => (
      <li key={item.to} role="none">
        <Link
          to={item.to}
          className="rounded-full px-3 py-2 text-sm font-medium text-foreground/80 transition-colors hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          activeProps={{ className: "text-primary font-semibold" }}
          activeOptions={{ exact: item.to === "/" }}
          title={item.description}
          role="menuitem"
        >
          {item.label}
        </Link>
      </li>
    ))}
  </ul>
);

/**
 * Navigation actions component
 */
const NavActions = ({ user }: { user: any }) => (
  <div className="flex items-center gap-2">
    <Link
      to="/menu"
      className="hidden rounded-full bg-[var(--brand-gold)] px-5 py-2.5 text-sm font-semibold text-primary shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5 hover:bg-[var(--brand-gold-soft)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-gold)] focus:ring-offset-2 sm:inline-flex"
      aria-label="Ga naar menu om te bestellen"
    >
      Bestellen
    </Link>

    <Link
      to={user ? "/account" : "/auth"}
      className="grid h-11 w-11 place-items-center rounded-full border border-border bg-background text-primary hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-colors"
      aria-label={user ? "Mijn account" : "Inloggen"}
    >
      <UserIcon className="h-5 w-5" />
    </Link>

    <CartDrawer />
  </div>
);

/**
 * Mobile menu content
 */
const MobileMenuContent = ({
  onClose,
  currentLocation,
}: {
  onClose: () => void;
  currentLocation: string;
}) => (
  <SheetContent side="right" className="w-full max-w-sm bg-background p-6">
    <div className="flex items-center justify-between mb-6">
      <SheetTitle className="font-display text-2xl text-primary">Menu</SheetTitle>
    </div>

    {/* Main navigation for mobile */}
    <ul className="flex flex-col gap-1" role="navigation">
      {MAIN_NAVIGATION.map((item) => (
        <li key={item.to}>
          <Link
            to={item.to}
            onClick={onClose}
            className="block rounded-xl px-4 py-3 text-lg font-medium text-foreground/90 transition-colors hover:bg-secondary hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            activeProps={{ className: "bg-secondary text-primary font-semibold" }}
            activeOptions={{ exact: item.to === "/" }}
            title={item.description}
          >
            {item.label}
          </Link>
        </li>
      ))}
    </ul>

    {/* Quick actions */}
    <div className="mt-8 pt-6 border-t border-border">
      <p className="text-sm font-medium text-foreground/60 mb-4">Snelle acties</p>
      <Link
        to="/menu"
        onClick={onClose}
        className="mb-2 inline-flex w-full items-center justify-center rounded-full bg-[var(--brand-gold)] px-5 py-3 text-base font-semibold text-primary shadow-sm hover:shadow-md hover:bg-[var(--brand-gold-soft)] transition-all"
      >
        Bestellen
      </Link>

      <Link
        to="/reserveren"
        onClick={onClose}
        className="inline-flex w-full items-center justify-center rounded-full border border-primary px-5 py-3 text-base font-semibold text-primary hover:bg-secondary transition-colors"
      >
        Reserveren
      </Link>
    </div>
  </SheetContent>
);

/**
 * Main Navbar component
 */
export function Navbar() {
  const scrolled = useScroll(12);
  const { user } = useAuthUser();
  const location = useLocation();
  const [mobileMenuOpen, , openMobileMenu, closeMobileMenu] = useToggle(false);

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-all duration-300 ${
        scrolled
          ? "border-b border-border/60 bg-background/85 backdrop-blur-xl shadow-sm"
          : "bg-background/40 backdrop-blur-sm"
      }`}
      role="banner"
    >
      <nav
        className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8"
        role="navigation"
        aria-label="Hoofdnavigatie"
      >
        {/* Logo */}
        <NavLogo />

        {/* Desktop Navigation */}
        <DesktopNav currentLocation={location.pathname} />

        {/* Actions + Mobile Menu */}
        <div className="flex items-center gap-2">
          <NavActions user={user} />

          {/* Mobile Menu Trigger */}
          <Sheet open={mobileMenuOpen} onOpenChange={(open) => {
            if (open) openMobileMenu();
            else closeMobileMenu();
          }}>
            <SheetTrigger
              className="grid h-11 w-11 place-items-center rounded-full border border-border bg-background text-primary hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-colors lg:hidden"
              aria-label="Open navigatiemenu"
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-menu"
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </SheetTrigger>
            <MobileMenuContent
              onClose={closeMobileMenu}
              currentLocation={location.pathname}
            />
          </Sheet>
        </div>
      </nav>
    </header>
  );
}

export default Navbar;
