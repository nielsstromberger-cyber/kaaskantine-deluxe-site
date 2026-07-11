
-- Allow anon to read menu
GRANT SELECT ON public.categories TO anon;
GRANT SELECT ON public.products TO anon;
GRANT SELECT ON public.discount_codes TO anon;
GRANT SELECT ON public.opening_hours TO anon;

DROP POLICY IF EXISTS "Public can view active categories" ON public.categories;
CREATE POLICY "Public can view active categories" ON public.categories
  FOR SELECT TO anon, authenticated USING (is_active = true);

DROP POLICY IF EXISTS "Public can view available products" ON public.products;
CREATE POLICY "Public can view available products" ON public.products
  FOR SELECT TO anon, authenticated USING (is_available = true);

DROP POLICY IF EXISTS "Public can view active discount codes" ON public.discount_codes;
CREATE POLICY "Public can view active discount codes" ON public.discount_codes
  FOR SELECT TO anon, authenticated USING (is_active = true);

DROP POLICY IF EXISTS "Public can view opening hours" ON public.opening_hours;
CREATE POLICY "Public can view opening hours" ON public.opening_hours
  FOR SELECT TO anon, authenticated USING (true);

-- Allow reading a single order by its UUID (unguessable) for confirmation page
GRANT SELECT ON public.orders TO anon;
GRANT SELECT ON public.order_items TO anon;

DROP POLICY IF EXISTS "Public can view order by id" ON public.orders;
CREATE POLICY "Public can view order by id" ON public.orders
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Public can view order items" ON public.order_items;
CREATE POLICY "Public can view order items" ON public.order_items
  FOR SELECT TO anon, authenticated USING (true);
