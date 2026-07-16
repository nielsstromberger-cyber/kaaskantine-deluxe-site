import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

function supabaseForUser(ctx: ToolContext) {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    global: { headers: { Authorization: `Bearer ${ctx.getToken()}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export default defineTool({
  name: "get_order",
  title: "Bestelling details",
  description:
    "Haal een enkele bestelling op inclusief regels. Alleen bestellingen van de ingelogde gebruiker zijn zichtbaar.",
  inputSchema: {
    order_id: z.string().uuid().describe("De bestelling-ID (UUID)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ order_id }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Niet ingelogd" }], isError: true };
    }
    const sb = supabaseForUser(ctx);
    const { data: order, error } = await sb
      .from("orders")
      .select(
        "id, order_number, customer_name, customer_email, customer_phone, pickup_time, notes, subtotal_cents, discount_cents, total_cents, discount_code, status, payment_status, created_at, user_id",
      )
      .eq("id", order_id)
      .maybeSingle();
    if (error) {
      return { content: [{ type: "text", text: error.message }], isError: true };
    }
    if (!order) {
      return { content: [{ type: "text", text: "Bestelling niet gevonden" }], isError: true };
    }
    const { data: items, error: itemsErr } = await sb
      .from("order_items")
      .select("product_name, quantity, unit_price_cents, line_total_cents, notes")
      .eq("order_id", order_id);
    if (itemsErr) {
      return { content: [{ type: "text", text: itemsErr.message }], isError: true };
    }
    const result = { ...order, items: items ?? [] };
    return {
      content: [{ type: "text", text: JSON.stringify(result) }],
      structuredContent: result,
    };
  },
});
