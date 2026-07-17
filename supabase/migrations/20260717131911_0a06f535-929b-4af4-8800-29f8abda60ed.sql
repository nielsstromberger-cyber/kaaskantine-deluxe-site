
-- 1) Stock management
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS stock_quantity integer,
  ADD COLUMN IF NOT EXISTS low_stock_threshold integer NOT NULL DEFAULT 5;

-- 2) Order status: add 'voltooid' + archived flag
ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'voltooid';

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS archived_at timestamptz;

CREATE OR REPLACE FUNCTION public.set_order_archived()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.status = 'voltooid' AND OLD.status <> 'voltooid' THEN
    NEW.archived_at = now();
  ELSIF NEW.status <> 'voltooid' THEN
    NEW.archived_at = NULL;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_orders_archive ON public.orders;
CREATE TRIGGER trg_orders_archive
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.set_order_archived();

-- 3) Contact messages: status field
ALTER TABLE public.contact_messages
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'nieuw';

-- 4) Contact replies (staff -> customer)
CREATE TABLE IF NOT EXISTS public.contact_replies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL REFERENCES public.contact_messages(id) ON DELETE CASCADE,
  author_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  author_name text,
  body text NOT NULL,
  email_sent boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.contact_replies TO authenticated;
GRANT ALL ON public.contact_replies TO service_role;

ALTER TABLE public.contact_replies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view replies" ON public.contact_replies FOR SELECT TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::app_role) OR private.has_role(auth.uid(), 'manager'::app_role));
CREATE POLICY "Staff can add replies" ON public.contact_replies FOR INSERT TO authenticated
  WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role) OR private.has_role(auth.uid(), 'manager'::app_role));

-- 5) Update place_order to enforce stock and decrement
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
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
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
  v_dow int;
  v_oh record;
  v_pickup_local time;
  v_pickup_date date;
BEGIN
  IF _customer_name IS NULL OR length(btrim(_customer_name)) < 1 OR length(_customer_name) > 100 THEN
    RAISE EXCEPTION 'invalid_name';
  END IF;
  IF _customer_email IS NULL OR length(_customer_email) < 3 OR length(_customer_email) > 255 THEN
    RAISE EXCEPTION 'invalid_email';
  END IF;
  IF _customer_phone IS NULL OR length(_customer_phone) < 3 OR length(_customer_phone) > 30 THEN
    RAISE EXCEPTION 'invalid_phone';
  END IF;
  IF _pickup_time IS NULL OR _pickup_time < v_now THEN
    RAISE EXCEPTION 'invalid_pickup_time';
  END IF;
  IF _items IS NULL OR jsonb_typeof(_items) <> 'array' OR jsonb_array_length(_items) = 0 THEN
    RAISE EXCEPTION 'no_items';
  END IF;
  IF _notes IS NOT NULL AND length(_notes) > 500 THEN
    RAISE EXCEPTION 'notes_too_long';
  END IF;

  -- Enforce opening hours (Europe/Amsterdam local time)
  v_pickup_date := (_pickup_time AT TIME ZONE 'Europe/Amsterdam')::date;
  v_pickup_local := (_pickup_time AT TIME ZONE 'Europe/Amsterdam')::time;
  v_dow := EXTRACT(DOW FROM (_pickup_time AT TIME ZONE 'Europe/Amsterdam'))::int;
  SELECT * INTO v_oh FROM public.opening_hours WHERE day_of_week = v_dow;
  IF NOT FOUND OR v_oh.is_closed OR v_oh.open_time IS NULL OR v_oh.close_time IS NULL THEN
    RAISE EXCEPTION 'closed_on_day';
  END IF;
  IF v_pickup_local < v_oh.open_time OR v_pickup_local > v_oh.close_time THEN
    RAISE EXCEPTION 'outside_opening_hours';
  END IF;

  INSERT INTO public.orders (
    customer_name, customer_email, customer_phone, pickup_time, notes,
    subtotal_cents, discount_cents, total_cents, status, payment_status, user_id
  ) VALUES (
    btrim(_customer_name), btrim(_customer_email), btrim(_customer_phone),
    _pickup_time, NULLIF(btrim(coalesce(_notes,'')), ''),
    0, 0, 0, 'nieuw', 'pending', auth.uid()
  ) RETURNING id, order_number, access_token INTO v_order_id, v_order_number, v_access_token;

  FOR v_item IN SELECT * FROM jsonb_array_elements(_items) LOOP
    v_qty := coalesce((v_item->>'quantity')::int, 0);
    v_notes := NULLIF(btrim(coalesce(v_item->>'notes','')), '');
    IF v_qty < 1 OR v_qty > 50 THEN
      RAISE EXCEPTION 'invalid_quantity';
    END IF;
    SELECT id, name, price_cents, stock_quantity INTO v_product
    FROM public.products
    WHERE id = (v_item->>'product_id')::uuid AND is_available = true
    FOR UPDATE;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'product_unavailable';
    END IF;
    IF v_product.stock_quantity IS NOT NULL AND v_product.stock_quantity < v_qty THEN
      RAISE EXCEPTION 'insufficient_stock:%', v_product.name;
    END IF;
    IF v_product.stock_quantity IS NOT NULL THEN
      UPDATE public.products SET stock_quantity = stock_quantity - v_qty WHERE id = v_product.id;
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

REVOKE ALL ON FUNCTION public.place_order(text,text,text,timestamptz,text,text,jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.place_order(text,text,text,timestamptz,text,text,jsonb) TO anon, authenticated;
