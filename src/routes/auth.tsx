import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Inloggen — De Kaaskantine" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

type Mode = "signin" | "signup" | "forgot";

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Welkom terug");
        navigate({ to: "/account" });
      } else if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/account`,
            data: { full_name: fullName, phone },
          },
        });
        if (error) throw error;
        toast.success("Account aangemaakt");
        navigate({ to: "/account" });
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        toast.success("Reset-link is verzonden naar je e-mail");
        setMode("signin");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Er ging iets mis");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md items-center px-4 py-16">
      <div className="w-full rounded-3xl border border-border bg-card p-8 shadow-md">
        <h1 className="font-display text-3xl font-semibold text-primary">
          {mode === "signin" && "Inloggen"}
          {mode === "signup" && "Account aanmaken"}
          {mode === "forgot" && "Wachtwoord vergeten"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {mode === "signin" && "Log in om je bestellingen en reserveringen te bekijken."}
          {mode === "signup" && "Maak een account aan bij De Kaaskantine."}
          {mode === "forgot" && "We sturen je een link om je wachtwoord te resetten."}
        </p>

        <form onSubmit={submit} className="mt-6 space-y-4">
          {mode === "signup" && (
            <>
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium">Naam</span>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="input"
                  autoComplete="name"
                  required
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium">Telefoon</span>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="input"
                  autoComplete="tel"
                  required
                />
              </label>
            </>
          )}
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium">E-mailadres</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input"
              autoComplete="email"
              required
            />
          </label>
          {mode !== "forgot" && (
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium">Wachtwoord</span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input"
                autoComplete={mode === "signup" ? "new-password" : "current-password"}
                required
                minLength={6}
              />
            </label>
          )}

          <button
            type="submit"
            disabled={loading}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {mode === "signin" && "Inloggen"}
            {mode === "signup" && "Registreren"}
            {mode === "forgot" && "Reset-link versturen"}
          </button>
        </form>

        <div className="mt-6 space-y-2 text-center text-sm text-muted-foreground">
          {mode === "signin" && (
            <>
              <p>
                Nog geen account?{" "}
                <button className="font-semibold text-primary hover:underline" onClick={() => setMode("signup")}>
                  Registreer
                </button>
              </p>
              <p>
                <button className="hover:underline" onClick={() => setMode("forgot")}>
                  Wachtwoord vergeten?
                </button>
              </p>
            </>
          )}
          {mode === "signup" && (
            <p>
              Heb je al een account?{" "}
              <button className="font-semibold text-primary hover:underline" onClick={() => setMode("signin")}>
                Log in
              </button>
            </p>
          )}
          {mode === "forgot" && (
            <p>
              <button className="hover:underline" onClick={() => setMode("signin")}>
                Terug naar inloggen
              </button>
            </p>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          <Link to="/" className="hover:underline">
            Terug naar de website
          </Link>
        </p>
      </div>
    </div>
  );
}
