
-- 1. Access token on orders for post-checkout confirmation lookups
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS access_token uuid NOT NULL DEFAULT gen_random_uuid();

-- 2. Remove public read/insert on orders and order_items
DROP POLICY IF EXISTS "Public can view order by id" ON public.orders;
DROP POLICY IF EXISTS "Public can view order items" ON public.order_items;
DROP POLICY IF EXISTS "Anyone can place an order" ON public.orders;
DROP POLICY IF EXISTS "Anyone can insert order items" ON public.order_items;

REVOKE INSERT ON public.orders FROM anon, authenticated;
REVOKE INSERT ON public.order_items FROM anon, authenticated;

-- 3. Private schema for SECURITY DEFINER helpers so they aren't API-exposed
CREATE SCHEMA IF NOT EXISTS private;
GRANT USAGE ON SCHEMA private TO authenticated, service_role;

ALTER FUNCTION public.has_role(uuid, public.app_role) SET SCHEMA private;
ALTER FUNCTION public.is_staff(uuid) SET SCHEMA private;
ALTER FUNCTION public.handle_new_user() SET SCHEMA private;

REVOKE ALL ON FUNCTION private.has_role(uuid, public.app_role) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION private.is_staff(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION private.handle_new_user() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION private.has_role(uuid, public.app_role) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.is_staff(uuid) TO authenticated, service_role;

-- 4. Server-side order placement (validates prices + discount)
CREATE OR REPLACE FUNCTION public.place_order(
  _customer_name text,
  _customer_email text,
  _customer_phone text,
  _pickup_time timestamptz,
  _notes text,
  _discount_code text,
  _items jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order_id uuid;
  v_order_number int;
  v_access_token uuid;
  v_subtotal int := 0;
  v_discount int := 0;
  v_total int;
  v_item jsonb;
  v_product record;
  v_qty int;
  v_notes text;
  v_line_total int;
  v_dc record;
  v_now timestamptz := now();
  v_final_code text := null;
BEGIN
  -- basic input validation
  IF _customer_name IS NULL OR length(btrim(_customer_name)) < 1 OR length(_customer_name) > 100 THEN
    RAISE EXCEPTION 'invalid_name';
  END IF;
  IF _customer_email IS NULL OR length(_customer_email) < 3 OR length(_customer_email) > 255 THEN
    RAISE EXCEPTION 'invalid_email';
  END IF;
  IF _customer_phone IS NULL OR length(_customer_phone) < 3 OR length(_customer_phone) > 30 THEN
    RAISE EXCEPTION 'invalid_phone';
  END IF;
  IF _pickup_time IS NULL THEN
    RAISE EXCEPTION 'invalid_pickup_time';
  END IF;
  IF _items IS NULL OR jsonb_typeof(_items) <> 'array' OR jsonb_array_length(_items) = 0 THEN
    RAISE EXCEPTION 'no_items';
  END IF;
  IF _notes IS NOT NULL AND length(_notes) > 500 THEN
    RAISE EXCEPTION 'notes_too_long';
  END IF;

  -- create order shell
  INSERT INTO public.orders (
    customer_name, customer_email, customer_phone, pickup_time, notes,
    subtotal_cents, discount_cents, total_cents, status, payment_status,
    user_id
  )
  VALUES (
    btrim(_customer_name), btrim(_customer_email), btrim(_customer_phone),
    _pickup_time, NULLIF(btrim(coalesce(_notes,'')), ''),
    0, 0, 0, 'nieuw', 'pending', auth.uid()
  )
  RETURNING id, order_number, access_token INTO v_order_id, v_order_number, v_access_token;

  -- items: look up authoritative price per product
  FOR v_item IN SELECT * FROM jsonb_array_elements(_items) LOOP
    v_qty := coalesce((v_item->>'quantity')::int, 0);
    v_notes := NULLIF(btrim(coalesce(v_item->>'notes','')), '');
    IF v_qty < 1 OR v_qty > 50 THEN
      RAISE EXCEPTION 'invalid_quantity';
    END IF;
    SELECT id, name, price_cents INTO v_product
    FROM public.products
    WHERE id = (v_item->>'product_id')::uuid AND is_available = true;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'product_unavailable';
    END IF;
    v_line_total := v_product.price_cents * v_qty;
    v_subtotal := v_subtotal + v_line_total;
    INSERT INTO public.order_items (
      order_id, product_id, product_name, quantity,
      unit_price_cents, line_total_cents, notes
    ) VALUES (
      v_order_id, v_product.id, v_product.name, v_qty,
      v_product.price_cents, v_line_total, v_notes
    );
  END LOOP;

  -- discount
  IF _discount_code IS NOT NULL AND length(btrim(_discount_code)) > 0 THEN
    SELECT * INTO v_dc FROM public.discount_codes
    WHERE code = upper(btrim(_discount_code)) AND is_active = true;
    IF FOUND
      AND (v_dc.valid_from IS NULL OR v_dc.valid_from <= v_now)
      AND (v_dc.valid_until IS NULL OR v_dc.valid_until >= v_now)
      AND (v_dc.max_uses IS NULL OR v_dc.used_count < v_dc.max_uses)
      AND v_subtotal >= v_dc.min_order_cents
    THEN
      IF v_dc.discount_type = 'percent' THEN
        v_discount := round(v_subtotal * v_dc.discount_value / 100.0);
      ELSE
        v_discount := v_dc.discount_value;
      END IF;
      v_discount := LEAST(v_discount, v_subtotal);
      v_final_code := v_dc.code;
      UPDATE public.discount_codes SET used_count = used_count + 1 WHERE id = v_dc.id;
    END IF;
  END IF;

  v_total := GREATEST(v_subtotal - v_discount, 0);

  UPDATE public.orders SET
    subtotal_cents = v_subtotal,
    discount_cents = v_discount,
    total_cents = v_total,
    discount_code = v_final_code
  WHERE id = v_order_id;

  RETURN jsonb_build_object(
    'id', v_order_id,
    'order_number', v_order_number,
    'access_token', v_access_token,
    'subtotal_cents', v_subtotal,
    'discount_cents', v_discount,
    'total_cents', v_total
  );
END;
$$;

REVOKE ALL ON FUNCTION public.place_order(text, text, text, timestamptz, text, text, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.place_order(text, text, text, timestamptz, text, text, jsonb) TO anon, authenticated;

-- 5. Token-scoped order lookup for the confirmation page
CREATE OR REPLACE FUNCTION public.get_order_by_token(_id uuid, _token uuid)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'id', o.id,
    'order_number', o.order_number,
    'customer_name', o.customer_name,
    'customer_email', o.customer_email,
    'pickup_time', o.pickup_time,
    'subtotal_cents', o.subtotal_cents,
    'discount_cents', o.discount_cents,
    'total_cents', o.total_cents,
    'discount_code', o.discount_code,
    'status', o.status
  )
  FROM public.orders o
  WHERE o.id = _id AND o.access_token = _token
$$;

REVOKE ALL ON FUNCTION public.get_order_by_token(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_order_by_token(uuid, uuid) TO anon, authenticated;
