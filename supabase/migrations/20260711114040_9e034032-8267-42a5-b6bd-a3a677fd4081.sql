
-- Tighten orders INSERT policy: require basic customer fields
DROP POLICY IF EXISTS "Anyone can place an order" ON public.orders;
CREATE POLICY "Anyone can place an order" ON public.orders
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    length(customer_name) BETWEEN 1 AND 100
    AND length(customer_email) BETWEEN 3 AND 255
    AND length(customer_phone) BETWEEN 3 AND 30
    AND total_cents >= 0
    AND status = 'nieuw'
    AND payment_status = 'pending'
  );

-- Tighten order_items INSERT: require valid quantity and prices
DROP POLICY IF EXISTS "Anyone can insert order items" ON public.order_items;
CREATE POLICY "Anyone can insert order items" ON public.order_items
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    quantity > 0 AND quantity <= 50
    AND unit_price_cents >= 0
    AND line_total_cents >= 0
    AND length(product_name) BETWEEN 1 AND 200
  );

-- Restrict has_role execution
REVOKE EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) TO authenticated, service_role;
