import { createFileRoute, Outlet, Link, useRouterState, redirect } from "@tanstack/react-router";
import {
  LayoutDashboard,
  ShoppingBag,
  CalendarClock,
  Package,
  Users,
  Settings,
  LogOut,
  Home,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/admin")({
  beforeLoad: async ({ context }) => {
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.user.id)
      .eq("role", "admin")
      .maybeSingle();
    if (!data) {
      throw redirect({ to: "/account" });
    }
  },
  component: AdminLayout,
});

type NavItem = { to: string; label: string; icon: typeof LayoutDashboard; exact?: boolean };
const NAV: NavItem[] = [
  { to: "/admin", label: "Overzicht", icon: LayoutDashboard, exact: true },
  { to: "/admin/orders", label: "Bestellingen", icon: ShoppingBag },
  { to: "/admin/reservations", label: "Reserveringen", icon: CalendarClock },
  { to: "/admin/products", label: "Producten", icon: Package },
  { to: "/admin/users", label: "Gebruikers", icon: Users },
  { to: "/admin/settings", label: "Instellingen", icon: Settings },
];

function AdminLayout() {
  const pathname = useRouterState({ select: (r) => r.location.pathname });

  const signOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  return (
    <div className="mx-auto flex min-h-[calc(100dvh-4rem)] max-w-[1600px]">
      <aside className="hidden w-60 shrink-0 border-r border-border bg-card/50 px-3 py-6 md:block">
        <p className="mb-4 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Beheer
        </p>
        <nav className="space-y-1">
          {NAV.map((item) => {
            const active = item.exact ? pathname === item.to : pathname.startsWith(item.to);
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground/80 hover:bg-secondary"
                }`}
              >
                <Icon className="h-4 w-4" /> {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-8 space-y-1 border-t border-border pt-4">
          <Link
            to="/"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-secondary"
          >
            <Home className="h-4 w-4" /> Naar website
          </Link>
          <button
            onClick={signOut}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-secondary"
          >
            <LogOut className="h-4 w-4" /> Uitloggen
          </button>
        </div>
      </aside>

      {/* Mobile tab bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around border-t border-border bg-background/95 px-2 py-2 backdrop-blur md:hidden">
        {NAV.map((item) => {
          const active = item.exact ? pathname === item.to : pathname.startsWith(item.to);
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`flex flex-col items-center gap-0.5 rounded-lg px-2 py-1 text-[10px] font-medium ${
                active ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <Icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </div>

      <main className="flex-1 px-4 py-8 pb-24 md:px-8 md:pb-8">
        <Outlet />
      </main>
    </div>
  );
}
