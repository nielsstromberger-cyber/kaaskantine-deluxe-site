import { auth, defineMcp } from "@lovable.dev/mcp-js";
import listCategoriesTool from "./tools/list-categories";
import listProductsTool from "./tools/list-products";
import listMyOrdersTool from "./tools/list-my-orders";
import getOrderTool from "./tools/get-order";

// The OAuth issuer MUST be the direct Supabase host — the .lovable.cloud proxy
// publishes a different issuer in its discovery document and mcp-js will reject
// tokens whose configured issuer doesn't match (RFC 8414 §3.3). The project ref
// is the only Supabase value that survives publish unchanged.
const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "kaaskantine-mcp",
  title: "De Kaaskantine",
  version: "0.1.0",
  instructions:
    "Tools voor De Kaaskantine, een delicatessen- en kaaswinkel in Alkmaar. Gebruik `list_categories` en `list_products` om het menu te bekijken. Gebruik `list_my_orders` en `get_order` om de eigen bestellingen van de ingelogde gebruiker te bekijken.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [listCategoriesTool, listProductsTool, listMyOrdersTool, getOrderTool],
});
