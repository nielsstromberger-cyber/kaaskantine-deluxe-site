import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ShieldCheck, ShieldOff, Users as UsersIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/users")({
  component: UsersPage,
});

type Row = {
  id: string;
  full_name: string | null;
  phone: string | null;
  created_at: string;
  is_admin: boolean;
};

function UsersPage() {
  const qc = useQueryClient();

  const { data = [], isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const [{ data: profiles, error: pErr }, { data: roles, error: rErr }] = await Promise.all([
        supabase.from("profiles").select("id, full_name, phone, created_at").order("created_at", { ascending: false }),
        supabase.from("user_roles").select("user_id, role").eq("role", "admin"),
      ]);
      if (pErr) throw pErr;
      if (rErr) throw rErr;
      const adminSet = new Set((roles ?? []).map((r) => r.user_id));
      return (profiles ?? []).map((p) => ({ ...p, is_admin: adminSet.has(p.id) })) as Row[];
    },
  });

  const toggle = useMutation({
    mutationFn: async ({ userId, makeAdmin }: { userId: string; makeAdmin: boolean }) => {
      if (makeAdmin) {
        const { error } = await supabase.from("user_roles").insert({ user_id: userId, role: "admin" });
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("user_roles")
          .delete()
          .eq("user_id", userId)
          .eq("role", "admin");
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success("Rol bijgewerkt");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold text-primary">Gebruikers</h1>
      <p className="mt-1 text-sm text-muted-foreground">Beheer accounts en admin-rechten.</p>

      <div className="mt-6 overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        {isLoading && <p className="p-6 text-muted-foreground">Laden…</p>}
        {!isLoading && data.length === 0 && (
          <div className="p-12 text-center">
            <UsersIcon className="mx-auto h-10 w-10 text-muted-foreground/50" />
            <p className="mt-3 text-muted-foreground">Nog geen gebruikers.</p>
          </div>
        )}
        <ul className="divide-y divide-border">
          {data.map((u) => (
            <li key={u.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div>
                <p className="font-semibold text-primary">{u.full_name || "(geen naam)"}</p>
                <p className="text-xs text-muted-foreground">
                  {u.phone || "—"} · sinds{" "}
                  {new Date(u.created_at).toLocaleDateString("nl-NL")}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {u.is_admin ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-[var(--brand-gold)]/20 px-3 py-1 text-xs font-semibold text-[var(--brand-gold)]">
                    <ShieldCheck className="h-3.5 w-3.5" /> Admin
                  </span>
                ) : (
                  <span className="rounded-full bg-secondary px-3 py-1 text-xs">Klant</span>
                )}
                <button
                  onClick={() => toggle.mutate({ userId: u.id, makeAdmin: !u.is_admin })}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium hover:bg-secondary"
                >
                  {u.is_admin ? <ShieldOff className="h-3.5 w-3.5" /> : <ShieldCheck className="h-3.5 w-3.5" />}
                  {u.is_admin ? "Admin verwijderen" : "Admin maken"}
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
