import { supabase } from "@/integrations/supabase/client";

export type OpeningHour = {
  day_of_week: number;
  open_time: string | null;
  close_time: string | null;
  is_closed: boolean;
};

export async function fetchOpeningHours(): Promise<OpeningHour[]> {
  const { data, error } = await supabase
    .from("opening_hours")
    .select("day_of_week, open_time, close_time, is_closed")
    .order("day_of_week");
  if (error) throw error;
  return data ?? [];
}

const DAY_NAMES_NL = ["Zondag", "Maandag", "Dinsdag", "Woensdag", "Donderdag", "Vrijdag", "Zaterdag"];
export const dayName = (dow: number) => DAY_NAMES_NL[dow] ?? "";

// Return Amsterdam-local ISO-like { date, dow } for a given JS Date.
function amsterdamParts(d: Date) {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Amsterdam",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
  });
  const parts = fmt.formatToParts(d);
  const y = parts.find((p) => p.type === "year")!.value;
  const m = parts.find((p) => p.type === "month")!.value;
  const day = parts.find((p) => p.type === "day")!.value;
  const wd = parts.find((p) => p.type === "weekday")!.value;
  const map: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  return { date: `${y}-${m}-${day}`, dow: map[wd] ?? 0 };
}

// Build 15-minute pickup slots for the next `days` days, starting at least 30 min from now,
// only within opening hours. Returns strings suitable for datetime-local (yyyy-MM-ddThh:mm).
export function buildSlots(hours: OpeningHour[], days = 7, stepMin = 15) {
  const byDow = new Map<number, OpeningHour>();
  hours.forEach((h) => byDow.set(h.day_of_week, h));
  const minPickup = new Date(Date.now() + 30 * 60 * 1000);

  const slotsByDate: {
    date: string;
    label: string;
    dow: number;
    slots: { value: string; label: string }[];
  }[] = [];

  for (let i = 0; i < days; i++) {
    const day = new Date();
    day.setHours(0, 0, 0, 0);
    day.setDate(day.getDate() + i);
    const { date, dow } = amsterdamParts(day);
    const oh = byDow.get(dow);
    if (!oh || oh.is_closed || !oh.open_time || !oh.close_time) continue;
    const [oh1, om1] = oh.open_time.split(":").map(Number);
    const [oh2, om2] = oh.close_time.split(":").map(Number);
    const slots: { value: string; label: string }[] = [];
    // Build slots in local wall-clock for that Amsterdam date. We construct dates by
    // building an ISO with +01/+02 offset — simpler: use string comparisons for filtering,
    // and use "YYYY-MM-DDTHH:mm" values (interpreted as local by <input type=datetime-local>).
    for (let mins = oh1 * 60 + om1; mins <= oh2 * 60 + om2; mins += stepMin) {
      const hh = String(Math.floor(mins / 60)).padStart(2, "0");
      const mm = String(mins % 60).padStart(2, "0");
      const value = `${date}T${hh}:${mm}`;
      // Filter past slots based on the browser clock (best-effort; server also validates).
      const asDate = new Date(value);
      if (asDate < minPickup) continue;
      slots.push({ value, label: `${hh}:${mm}` });
    }
    if (slots.length === 0) continue;
    const label = new Date(`${date}T12:00`).toLocaleDateString("nl-NL", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
    slotsByDate.push({ date, label, dow, slots });
  }
  return slotsByDate;
}
