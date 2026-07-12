import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Trash2, Clock, Tag } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/settings")({
  component: SettingsPage,
});

const DAYS = ["Zondag", "Maandag", "Dinsdag", "Woensdag", "Donderdag", "Vrijdag", "Zaterdag"];

function SettingsPage() {
  const qc = useQueryClient();

  const { data: hours = [] } = useQuery({
    queryKey: ["opening-hours"],
    queryFn: async () => {
      const { data, error } = await supabase.from("opening_hours").select("*").order("day_of_week");
      if (error) throw error;
      return data ?? [];
    },
  });

  const updateHour = useMutation({
    mutationFn: async (v: { id: string; open_time: string | null; close_time: string | null; is_closed: boolean }) => {
      const { error } = await supabase
        .from("opening_hours")
        .update({ open_time: v.open_time, close_time: v.close_time, is_closed: v.is_closed })
        .eq("id", v.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["opening-hours"] });
      toast.success("Opgeslagen");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const { data: codes = [] } = useQuery({
    queryKey: ["discount-codes"],
    queryFn: async () => {
      const { data, error } = await supabase.from("discount_codes").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const [newCode, setNewCode] = useState({
    code: "",
    discount_type: "percent",
    discount_value: 10,
    min_order_cents: 0,
    is_active: true,
  });

  const createCode = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("discount_codes").insert({
        code: newCode.code.toUpperCase().trim(),
        discount_type: newCode.discount_type,
        discount_value: newCode.discount_value,
        min_order_cents: newCode.min_order_cents,
        is_active: newCode.is_active,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["discount-codes"] });
      setNewCode({ code: "", discount_type: "percent", discount_value: 10, min_order_cents: 0, is_active: true });
      toast.success("Code aangemaakt");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const delCode = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("discount_codes").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["discount-codes"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-10">
      <div>
        <h1 className="font-display text-3xl font-semibold text-primary">Instellingen</h1>
        <p className="mt-1 text-sm text-muted-foreground">Openingstijden en kortingscodes.</p>
      </div>

      <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <h2 className="mb-4 flex items-center gap-2 font-display text-xl font-semibold text-primary">
          <Clock className="h-5 w-5" /> Openingstijden
        </h2>
        <div className="space-y-2">
          {hours.map((h) => (
            <div
              key={h.id}
              className="flex flex-wrap items-center gap-3 rounded-xl border border-border/60 bg-background p-3"
            >
              <span className="w-24 font-medium">{DAYS[h.day_of_week]}</span>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={h.is_closed}
                  onChange={(e) =>
                    updateHour.mutate({
                      id: h.id,
                      open_time: h.open_time,
                      close_time: h.close_time,
                      is_closed: e.target.checked,
                    })
                  }
                />
                Gesloten
              </label>
              {!h.is_closed && (
                <>
                  <input
                    type="time"
                    className="input w-32"
                    defaultValue={h.open_time?.slice(0, 5) ?? ""}
                    onBlur={(e) =>
                      updateHour.mutate({
                        id: h.id,
                        open_time: e.target.value || null,
                        close_time: h.close_time,
                        is_closed: false,
                      })
                    }
                  />
                  <span>–</span>
                  <input
                    type="time"
                    className="input w-32"
                    defaultValue={h.close_time?.slice(0, 5) ?? ""}
                    onBlur={(e) =>
                      updateHour.mutate({
                        id: h.id,
                        open_time: h.open_time,
                        close_time: e.target.value || null,
                        is_closed: false,
                      })
                    }
                  />
                </>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <h2 className="mb-4 flex items-center gap-2 font-display text-xl font-semibold text-primary">
          <Tag className="h-5 w-5" /> Kortingscodes
        </h2>

        <div className="mb-4 grid gap-2 rounded-xl border border-primary/30 bg-secondary/30 p-4 sm:grid-cols-[1fr_130px_130px_130px_auto]">
          <input
            className="input"
            placeholder="Code (bv. WELKOM10)"
            value={newCode.code}
            onChange={(e) => setNewCode((c) => ({ ...c, code: e.target.value.toUpperCase() }))}
          />
          <select
            className="input"
            value={newCode.discount_type}
            onChange={(e) => setNewCode((c) => ({ ...c, discount_type: e.target.value }))}
          >
            <option value="percent">Percentage</option>
            <option value="fixed">Bedrag (cent)</option>
          </select>
          <input
            className="input"
            type="number"
            placeholder="Waarde"
            value={newCode.discount_value}
            onChange={(e) => setNewCode((c) => ({ ...c, discount_value: Number(e.target.value) }))}
          />
          <input
            className="input"
            type="number"
            placeholder="Min. order (cent)"
            value={newCode.min_order_cents}
            onChange={(e) => setNewCode((c) => ({ ...c, min_order_cents: Number(e.target.value) }))}
          />
          <button
            onClick={() => createCode.mutate()}
            disabled={!newCode.code}
            className="inline-flex items-center gap-1 rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
          >
            <Plus className="h-4 w-4" /> Toevoegen
          </button>
        </div>

        <ul className="divide-y divide-border/60">
          {codes.map((c) => (
            <li key={c.id} className="flex items-center justify-between py-2">
              <div>
                <span className="font-mono font-semibold text-primary">{c.code}</span>
                <span className="ml-2 text-sm text-muted-foreground">
                  {c.discount_type === "percent" ? `${c.discount_value}%` : `€${(c.discount_value / 100).toFixed(2)}`}
                  {c.min_order_cents > 0 && ` · min. €${(c.min_order_cents / 100).toFixed(2)}`}
                  {!c.is_active && " · inactief"}
                </span>
              </div>
              <button
                onClick={() => delCode.mutate(c.id)}
                className="rounded-full border border-destructive/30 bg-destructive/5 p-1.5 text-destructive hover:bg-destructive/10"
                aria-label="Verwijder"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
          {codes.length === 0 && <li className="py-3 text-sm text-muted-foreground">Nog geen codes.</li>}
        </ul>
      </section>
    </div>
  );
}
