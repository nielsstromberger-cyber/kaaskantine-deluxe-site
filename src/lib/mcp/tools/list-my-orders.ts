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
  name: "list_my_orders",
  title: "Mijn bestellingen",
  description: "Lijst de bestellingen van de ingelogde gebruiker, meest recente eerst.",
  inputSchema: {
    limit: z.number().int().min(1).max(50).optional().describe("Maximum aantal bestellingen (standaard 10)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ limit }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Niet ingelogd" }], isError: true };
    }
    const { data, error } = await supabaseForUser(ctx)
      .from("orders")
      .select(
        "id, order_number, customer_name, customer_email, pickup_time, subtotal_cents, discount_cents, total_cents, status, payment_status, created_at",
      )
      .eq("user_id", ctx.getUserId())
      .order("created_at", { ascending: false })
      .limit(limit ?? 10);
    if (error) {
      return { content: [{ type: "text", text: error.message }], isError: true };
    }
    return {
      content: [{ type: "text", text: JSON.stringify(data) }],
      structuredContent: { orders: data ?? [] },
    };
  },
});
