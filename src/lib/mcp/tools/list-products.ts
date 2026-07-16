import { defineTool } from "@lovable.dev/mcp-js";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

export default defineTool({
  name: "list_products",
  title: "Lijst producten",
  description:
    "Lijst beschikbare menu-items van De Kaaskantine, optioneel gefilterd op categorie-slug (bijv. 'klassiekers', 'specials').",
  inputSchema: {
    category_slug: z
      .string()
      .optional()
      .describe("Optionele categorie-slug om op te filteren."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ category_slug }) => {
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_PUBLISHABLE_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false } },
    );
    let categoryId: string | undefined;
    if (category_slug) {
      const { data: cat, error: catErr } = await supabase
        .from("categories")
        .select("id")
        .eq("slug", category_slug)
        .maybeSingle();
      if (catErr) {
        return { content: [{ type: "text", text: catErr.message }], isError: true };
      }
      if (!cat) {
        return {
          content: [{ type: "text", text: `Onbekende categorie: ${category_slug}` }],
          isError: true,
        };
      }
      categoryId = cat.id;
    }
    let query = supabase
      .from("products")
      .select("id, name, description, allergens, price_cents, category_id, is_available, sort_order")
      .eq("is_available", true)
      .order("sort_order");
    if (categoryId) query = query.eq("category_id", categoryId);
    const { data, error } = await query;
    if (error) {
      return { content: [{ type: "text", text: error.message }], isError: true };
    }
    return {
      content: [{ type: "text", text: JSON.stringify(data) }],
      structuredContent: { products: data ?? [] },
    };
  },
});
