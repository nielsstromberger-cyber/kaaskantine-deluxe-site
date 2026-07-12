
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own profile select" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "own profile insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "own profile update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "admin profile select" ON public.profiles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''), COALESCE(NEW.raw_user_meta_data->>'phone', ''))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

ALTER TABLE public.orders ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
CREATE INDEX orders_user_id_idx ON public.orders(user_id);
CREATE POLICY "users see own orders" ON public.orders FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  pickup_at TIMESTAMPTZ NOT NULL,
  party_size INT NOT NULL DEFAULT 1,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reservations TO authenticated;
GRANT INSERT ON public.reservations TO anon;
GRANT ALL ON public.reservations TO service_role;
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone can reserve" ON public.reservations FOR INSERT TO anon, authenticated WITH CHECK (
  length(customer_name) BETWEEN 2 AND 100
  AND length(customer_email) BETWEEN 5 AND 255
  AND length(customer_phone) BETWEEN 6 AND 30
  AND party_size BETWEEN 1 AND 20
);
CREATE POLICY "users see own reservations" ON public.reservations FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "admins manage reservations" ON public.reservations FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER reservations_updated_at BEFORE UPDATE ON public.reservations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE POLICY "admins manage products" ON public.products FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admins manage categories" ON public.categories FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admins manage discount_codes" ON public.discount_codes FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admins manage opening_hours" ON public.opening_hours FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admins manage user_roles" ON public.user_roles FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
