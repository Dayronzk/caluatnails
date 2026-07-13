--
-- PostgreSQL database dump
--

\restrict beIqM5NHtx8VTgCgdmk2l2GyFNoKQQvUNuiZ9Ba1gW0ab6dZ4BhpYOgochKaBWu

-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.6

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA public;


--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON SCHEMA public IS 'standard public schema';


--
-- Name: handle_new_user(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, created_at, last_sign_in_at)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    now(),
    now()
  )
  ON CONFLICT (id) DO UPDATE SET last_sign_in_at = now();
  RETURN new;
END;
$$;


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: booking_services; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.booking_services (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    booking_id uuid,
    service_id uuid,
    service_name text NOT NULL,
    price_at_booking numeric(10,2) NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: bookings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.bookings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    client_name text NOT NULL,
    client_email text NOT NULL,
    client_phone text NOT NULL,
    booking_date date NOT NULL,
    booking_time text NOT NULL,
    total_duration_minutes integer DEFAULT 30 NOT NULL,
    total_price numeric(10,2) DEFAULT 0 NOT NULL,
    deposit_amount numeric(10,2) DEFAULT 0 NOT NULL,
    deposit_paid boolean DEFAULT false NOT NULL,
    stripe_session_id text,
    status text DEFAULT 'pending'::text NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    professional_id uuid,
    google_event_id text,
    payment_method text DEFAULT 'stripe'::text
);


--
-- Name: center_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.center_settings (
    id text DEFAULT 'main'::text NOT NULL,
    center_name text DEFAULT 'NAILOX Centro'::text NOT NULL,
    address text DEFAULT 'Calle Ejemplo 123, Madrid, España'::text NOT NULL,
    city text DEFAULT 'Madrid'::text NOT NULL,
    postal_code text DEFAULT '28001'::text NOT NULL,
    phone text,
    email text,
    schedule text,
    updated_at timestamp with time zone DEFAULT now(),
    academy_name text DEFAULT 'Academia NailPro'::text,
    instructor_name text DEFAULT 'María González'::text,
    instructor_title text DEFAULT 'Instructora Principal'::text,
    course_title text DEFAULT 'Manicura y Nail Art Profesional'::text,
    email_brand_name text DEFAULT 'NAILOX'::text,
    site_url text DEFAULT 'https://nailox.com'::text,
    contact_email text DEFAULT 'hola@nailox.com'::text,
    sender_email text DEFAULT 'noreply@nailox.com'::text,
    email_footer_text text DEFAULT 'Curso Profesional de Manicura y Pedicura'::text,
    email_header_color text DEFAULT '#f43f5e'::text,
    email_header_color2 text DEFAULT '#fb7185'::text,
    email_logo_text text DEFAULT 'NAILOX'::text,
    email_accent_color text DEFAULT '#f43f5e'::text,
    email_bg_color text DEFAULT '#fdf2f4'::text,
    email_card_bg text DEFAULT '#fff1f2'::text,
    notification_email text,
    total_hours_override text,
    hero_countdown_hours integer DEFAULT 72,
    hero_countdown_label text DEFAULT 'Oferta termina en'::text,
    hero_countdown_enabled boolean DEFAULT true,
    bizum_whatsapp text,
    stripe_disabled boolean DEFAULT false,
    presale_mode boolean DEFAULT false,
    presale_badge_text text DEFAULT '¡Preventa especial!'::text,
    presale_hero_title text DEFAULT 'Únete a la Preventa'::text,
    presale_hero_subtitle text DEFAULT 'Sé de las primeras en acceder al curso completo con precio especial de lanzamiento.'::text,
    presale_cta_text text DEFAULT 'Reservar mi plaza'::text,
    presale_buy_btn_text text DEFAULT 'Unirme a la preventa'::text,
    stripe_disabled_message text DEFAULT 'Los pagos online están temporalmente desactivados. Contacta con nosotros para completar tu compra.'::text
);


--
-- Name: certificates; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.certificates (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    student_name text NOT NULL,
    course_title text NOT NULL,
    academy_name text NOT NULL,
    completed_lessons integer DEFAULT 0 NOT NULL,
    total_modules integer DEFAULT 0 NOT NULL,
    total_hours text DEFAULT ''::text NOT NULL,
    issued_at timestamp with time zone DEFAULT now() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: client_accounts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.client_accounts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    phone text NOT NULL,
    name text,
    email text,
    points integer DEFAULT 0,
    referral_code text,
    auth_user_id uuid,
    phone_login_enabled boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: client_points_transactions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.client_points_transactions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    client_account_id uuid NOT NULL,
    points integer NOT NULL,
    type text DEFAULT 'earned'::text NOT NULL,
    description text NOT NULL,
    reference_id text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: client_referrals; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.client_referrals (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    referrer_account_id uuid NOT NULL,
    referred_phone text,
    event_type text DEFAULT 'booking'::text NOT NULL,
    points_awarded integer DEFAULT 0,
    status text DEFAULT 'pending'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    completed_at timestamp with time zone
);


--
-- Name: coupon_uses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.coupon_uses (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    coupon_id uuid NOT NULL,
    user_id uuid,
    used_at timestamp with time zone DEFAULT now()
);


--
-- Name: coupons; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.coupons (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    code text NOT NULL,
    type text NOT NULL,
    value numeric NOT NULL,
    min_purchase numeric DEFAULT 0,
    max_uses integer,
    uses_count integer DEFAULT 0,
    active boolean DEFAULT true,
    expires_at timestamp with time zone,
    description text,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT coupons_type_check CHECK ((type = ANY (ARRAY['percentage'::text, 'fixed'::text, 'points'::text])))
);


--
-- Name: forum_questions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.forum_questions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    student_id uuid,
    student_name text,
    student_email text NOT NULL,
    category text NOT NULL,
    title text NOT NULL,
    message text NOT NULL,
    admin_reply text,
    replied_at timestamp with time zone,
    resolved boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: google_calendar_tokens; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.google_calendar_tokens (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    profile_id uuid NOT NULL,
    access_token text,
    refresh_token text NOT NULL,
    token_expiry timestamp with time zone,
    calendar_id text DEFAULT 'primary'::text,
    connected_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: lesson_tags; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.lesson_tags (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    color text DEFAULT 'rose'::text NOT NULL,
    icon text DEFAULT 'ri-price-tag-3-line'::text NOT NULL,
    description text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: lessons; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.lessons (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    module_id uuid NOT NULL,
    title text NOT NULL,
    type text NOT NULL,
    duration text,
    video_url text,
    content text,
    description text,
    order_index integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    is_free boolean DEFAULT false,
    tag_id uuid,
    questions jsonb,
    file_url text,
    CONSTRAINT lessons_type_check CHECK ((type = ANY (ARRAY['video'::text, 'lectura'::text, 'practica'::text, 'evaluacion'::text, 'material'::text])))
);


--
-- Name: modules; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.modules (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title text NOT NULL,
    description text,
    duration text,
    order_index integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    level text DEFAULT 'Principiante'::text,
    color text DEFAULT 'rose'::text,
    icon text DEFAULT 'ri-book-line'::text,
    tag_id uuid,
    price numeric(10,2) DEFAULT NULL::numeric,
    stripe_product_id text,
    stripe_price_id text
);


--
-- Name: points_transactions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.points_transactions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    points integer NOT NULL,
    type text NOT NULL,
    description text NOT NULL,
    reference_id text,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT points_transactions_type_check CHECK ((type = ANY (ARRAY['earned'::text, 'redeemed'::text, 'bonus'::text, 'referral'::text])))
);


--
-- Name: professional_blocked_times; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.professional_blocked_times (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    profile_id uuid NOT NULL,
    blocked_date date NOT NULL,
    start_time text NOT NULL,
    end_time text NOT NULL,
    reason text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: professional_profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.professional_profiles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    bio text,
    specialties text[],
    instagram text,
    portfolio_images text[],
    rating numeric DEFAULT 0,
    review_count integer DEFAULT 0,
    active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    address text
);


--
-- Name: professional_reviews; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.professional_reviews (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    professional_id uuid NOT NULL,
    reviewer_id uuid,
    reviewer_name text NOT NULL,
    rating integer NOT NULL,
    comment text,
    created_at timestamp with time zone DEFAULT now(),
    pro_reply text,
    pro_reply_at timestamp with time zone,
    reviewer_phone text,
    CONSTRAINT professional_reviews_rating_check CHECK (((rating >= 1) AND (rating <= 5)))
);


--
-- Name: professional_schedules; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.professional_schedules (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    profile_id uuid NOT NULL,
    day_of_week integer NOT NULL,
    is_working boolean DEFAULT false NOT NULL,
    start_time time without time zone,
    end_time time without time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT professional_schedules_day_of_week_check CHECK (((day_of_week >= 0) AND (day_of_week <= 6)))
);


--
-- Name: professional_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.professional_settings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    profile_id uuid NOT NULL,
    display_name text,
    bio text,
    photo_url text,
    slot_duration_minutes integer DEFAULT 30 NOT NULL,
    buffer_minutes integer DEFAULT 10 NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    google_calendar_connected boolean DEFAULT false
);


--
-- Name: profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profiles (
    id uuid NOT NULL,
    email text,
    name text,
    avatar_url text,
    created_at timestamp with time zone DEFAULT now(),
    last_sign_in_at timestamp with time zone DEFAULT now(),
    role text DEFAULT 'student'::text NOT NULL,
    points integer DEFAULT 0,
    course_completed boolean DEFAULT false,
    is_professional boolean DEFAULT false,
    referral_code text,
    course_access boolean DEFAULT false,
    signup_source text DEFAULT 'manual'::text,
    CONSTRAINT profiles_signup_source_check CHECK ((signup_source = ANY (ARRAY['manual'::text, 'booking'::text, 'google'::text, 'purchase'::text])))
);


--
-- Name: purchases; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.purchases (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    email text NOT NULL,
    product_id text NOT NULL,
    session_id text NOT NULL,
    amount_total integer,
    currency text DEFAULT 'eur'::text,
    status text DEFAULT 'completed'::text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: referrals; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.referrals (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    referrer_id uuid NOT NULL,
    referred_user_id uuid,
    referred_email text,
    referral_code text NOT NULL,
    event_type text DEFAULT 'booking'::text NOT NULL,
    reference_id text,
    points_awarded integer DEFAULT 0 NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    completed_at timestamp with time zone
);


--
-- Name: services; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.services (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    description text,
    duration_minutes integer DEFAULT 30 NOT NULL,
    price numeric(10,2) DEFAULT 0 NOT NULL,
    service_type text DEFAULT 'General'::text NOT NULL,
    active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    reward_points integer DEFAULT 0,
    order_index integer DEFAULT 0
);


--
-- Name: shop_orders; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.shop_orders (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    client_name text NOT NULL,
    client_email text NOT NULL,
    client_phone text,
    delivery_type text DEFAULT 'pickup'::text NOT NULL,
    delivery_address text,
    items jsonb DEFAULT '[]'::jsonb NOT NULL,
    total_price numeric DEFAULT 0 NOT NULL,
    points_earned integer DEFAULT 0 NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    payment_method text DEFAULT 'stripe'::text
);


--
-- Name: shop_products; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.shop_products (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    description text,
    price numeric DEFAULT 0 NOT NULL,
    stock integer DEFAULT 0 NOT NULL,
    image_url text,
    category text DEFAULT 'General'::text NOT NULL,
    reward_points integer DEFAULT 0 NOT NULL,
    active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: student_progress; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.student_progress (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    student_id text NOT NULL,
    lesson_id uuid NOT NULL,
    module_id uuid NOT NULL,
    completed boolean DEFAULT false,
    completed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: booking_services booking_services_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.booking_services
    ADD CONSTRAINT booking_services_pkey PRIMARY KEY (id);


--
-- Name: bookings bookings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_pkey PRIMARY KEY (id);


--
-- Name: center_settings center_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.center_settings
    ADD CONSTRAINT center_settings_pkey PRIMARY KEY (id);


--
-- Name: certificates certificates_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.certificates
    ADD CONSTRAINT certificates_pkey PRIMARY KEY (id);


--
-- Name: client_accounts client_accounts_auth_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_accounts
    ADD CONSTRAINT client_accounts_auth_user_id_key UNIQUE (auth_user_id);


--
-- Name: client_accounts client_accounts_phone_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_accounts
    ADD CONSTRAINT client_accounts_phone_key UNIQUE (phone);


--
-- Name: client_accounts client_accounts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_accounts
    ADD CONSTRAINT client_accounts_pkey PRIMARY KEY (id);


--
-- Name: client_accounts client_accounts_referral_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_accounts
    ADD CONSTRAINT client_accounts_referral_code_key UNIQUE (referral_code);


--
-- Name: client_points_transactions client_points_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_points_transactions
    ADD CONSTRAINT client_points_transactions_pkey PRIMARY KEY (id);


--
-- Name: client_referrals client_referrals_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_referrals
    ADD CONSTRAINT client_referrals_pkey PRIMARY KEY (id);


--
-- Name: coupon_uses coupon_uses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.coupon_uses
    ADD CONSTRAINT coupon_uses_pkey PRIMARY KEY (id);


--
-- Name: coupons coupons_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.coupons
    ADD CONSTRAINT coupons_code_key UNIQUE (code);


--
-- Name: coupons coupons_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.coupons
    ADD CONSTRAINT coupons_pkey PRIMARY KEY (id);


--
-- Name: forum_questions forum_questions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.forum_questions
    ADD CONSTRAINT forum_questions_pkey PRIMARY KEY (id);


--
-- Name: google_calendar_tokens google_calendar_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.google_calendar_tokens
    ADD CONSTRAINT google_calendar_tokens_pkey PRIMARY KEY (id);


--
-- Name: google_calendar_tokens google_calendar_tokens_profile_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.google_calendar_tokens
    ADD CONSTRAINT google_calendar_tokens_profile_id_key UNIQUE (profile_id);


--
-- Name: lesson_tags lesson_tags_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lesson_tags
    ADD CONSTRAINT lesson_tags_pkey PRIMARY KEY (id);


--
-- Name: lessons lessons_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lessons
    ADD CONSTRAINT lessons_pkey PRIMARY KEY (id);


--
-- Name: modules modules_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.modules
    ADD CONSTRAINT modules_pkey PRIMARY KEY (id);


--
-- Name: points_transactions points_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.points_transactions
    ADD CONSTRAINT points_transactions_pkey PRIMARY KEY (id);


--
-- Name: professional_blocked_times professional_blocked_times_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.professional_blocked_times
    ADD CONSTRAINT professional_blocked_times_pkey PRIMARY KEY (id);


--
-- Name: professional_profiles professional_profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.professional_profiles
    ADD CONSTRAINT professional_profiles_pkey PRIMARY KEY (id);


--
-- Name: professional_profiles professional_profiles_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.professional_profiles
    ADD CONSTRAINT professional_profiles_user_id_key UNIQUE (user_id);


--
-- Name: professional_reviews professional_reviews_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.professional_reviews
    ADD CONSTRAINT professional_reviews_pkey PRIMARY KEY (id);


--
-- Name: professional_schedules professional_schedules_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.professional_schedules
    ADD CONSTRAINT professional_schedules_pkey PRIMARY KEY (id);


--
-- Name: professional_schedules professional_schedules_profile_id_day_of_week_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.professional_schedules
    ADD CONSTRAINT professional_schedules_profile_id_day_of_week_key UNIQUE (profile_id, day_of_week);


--
-- Name: professional_settings professional_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.professional_settings
    ADD CONSTRAINT professional_settings_pkey PRIMARY KEY (id);


--
-- Name: professional_settings professional_settings_profile_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.professional_settings
    ADD CONSTRAINT professional_settings_profile_id_key UNIQUE (profile_id);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_referral_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_referral_code_key UNIQUE (referral_code);


--
-- Name: purchases purchases_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.purchases
    ADD CONSTRAINT purchases_pkey PRIMARY KEY (id);


--
-- Name: purchases purchases_session_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.purchases
    ADD CONSTRAINT purchases_session_id_key UNIQUE (session_id);


--
-- Name: referrals referrals_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.referrals
    ADD CONSTRAINT referrals_pkey PRIMARY KEY (id);


--
-- Name: services services_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.services
    ADD CONSTRAINT services_pkey PRIMARY KEY (id);


--
-- Name: shop_orders shop_orders_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shop_orders
    ADD CONSTRAINT shop_orders_pkey PRIMARY KEY (id);


--
-- Name: shop_products shop_products_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shop_products
    ADD CONSTRAINT shop_products_pkey PRIMARY KEY (id);


--
-- Name: student_progress student_progress_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_progress
    ADD CONSTRAINT student_progress_pkey PRIMARY KEY (id);


--
-- Name: student_progress student_progress_student_id_lesson_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_progress
    ADD CONSTRAINT student_progress_student_id_lesson_id_key UNIQUE (student_id, lesson_id);


--
-- Name: student_progress student_progress_student_lesson_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_progress
    ADD CONSTRAINT student_progress_student_lesson_unique UNIQUE (student_id, lesson_id);


--
-- Name: idx_blocked_times_profile_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_blocked_times_profile_date ON public.professional_blocked_times USING btree (profile_id, blocked_date);


--
-- Name: idx_client_accounts_auth_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_client_accounts_auth_user ON public.client_accounts USING btree (auth_user_id);


--
-- Name: idx_client_accounts_phone; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_client_accounts_phone ON public.client_accounts USING btree (phone);


--
-- Name: idx_client_pts_tx_account; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_client_pts_tx_account ON public.client_points_transactions USING btree (client_account_id);


--
-- Name: idx_client_referrals_referrer; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_client_referrals_referrer ON public.client_referrals USING btree (referrer_account_id);


--
-- Name: idx_pro_reviews_phone; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pro_reviews_phone ON public.professional_reviews USING btree (reviewer_phone);


--
-- Name: idx_student_progress_lesson; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_student_progress_lesson ON public.student_progress USING btree (lesson_id);


--
-- Name: idx_student_progress_student; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_student_progress_student ON public.student_progress USING btree (student_id);


--
-- Name: lessons update_lessons_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_lessons_updated_at BEFORE UPDATE ON public.lessons FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: modules update_modules_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_modules_updated_at BEFORE UPDATE ON public.modules FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: booking_services booking_services_booking_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.booking_services
    ADD CONSTRAINT booking_services_booking_id_fkey FOREIGN KEY (booking_id) REFERENCES public.bookings(id) ON DELETE CASCADE;


--
-- Name: booking_services booking_services_service_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.booking_services
    ADD CONSTRAINT booking_services_service_id_fkey FOREIGN KEY (service_id) REFERENCES public.services(id) ON DELETE RESTRICT;


--
-- Name: bookings bookings_professional_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_professional_id_fkey FOREIGN KEY (professional_id) REFERENCES public.profiles(id) ON DELETE SET NULL;


--
-- Name: bookings bookings_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: certificates certificates_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.certificates
    ADD CONSTRAINT certificates_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: client_points_transactions client_points_transactions_client_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_points_transactions
    ADD CONSTRAINT client_points_transactions_client_account_id_fkey FOREIGN KEY (client_account_id) REFERENCES public.client_accounts(id) ON DELETE CASCADE;


--
-- Name: client_referrals client_referrals_referrer_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_referrals
    ADD CONSTRAINT client_referrals_referrer_account_id_fkey FOREIGN KEY (referrer_account_id) REFERENCES public.client_accounts(id) ON DELETE CASCADE;


--
-- Name: coupon_uses coupon_uses_coupon_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.coupon_uses
    ADD CONSTRAINT coupon_uses_coupon_id_fkey FOREIGN KEY (coupon_id) REFERENCES public.coupons(id) ON DELETE CASCADE;


--
-- Name: coupon_uses coupon_uses_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.coupon_uses
    ADD CONSTRAINT coupon_uses_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE SET NULL;


--
-- Name: forum_questions forum_questions_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.forum_questions
    ADD CONSTRAINT forum_questions_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.profiles(id) ON DELETE SET NULL;


--
-- Name: google_calendar_tokens google_calendar_tokens_profile_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.google_calendar_tokens
    ADD CONSTRAINT google_calendar_tokens_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: lessons lessons_module_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lessons
    ADD CONSTRAINT lessons_module_id_fkey FOREIGN KEY (module_id) REFERENCES public.modules(id) ON DELETE CASCADE;


--
-- Name: lessons lessons_tag_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lessons
    ADD CONSTRAINT lessons_tag_id_fkey FOREIGN KEY (tag_id) REFERENCES public.lesson_tags(id) ON DELETE SET NULL;


--
-- Name: modules modules_tag_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.modules
    ADD CONSTRAINT modules_tag_id_fkey FOREIGN KEY (tag_id) REFERENCES public.lesson_tags(id) ON DELETE SET NULL;


--
-- Name: points_transactions points_transactions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.points_transactions
    ADD CONSTRAINT points_transactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: professional_blocked_times professional_blocked_times_profile_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.professional_blocked_times
    ADD CONSTRAINT professional_blocked_times_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: professional_profiles professional_profiles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.professional_profiles
    ADD CONSTRAINT professional_profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: professional_reviews professional_reviews_professional_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.professional_reviews
    ADD CONSTRAINT professional_reviews_professional_id_fkey FOREIGN KEY (professional_id) REFERENCES public.professional_profiles(id) ON DELETE CASCADE;


--
-- Name: professional_reviews professional_reviews_reviewer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.professional_reviews
    ADD CONSTRAINT professional_reviews_reviewer_id_fkey FOREIGN KEY (reviewer_id) REFERENCES public.profiles(id) ON DELETE SET NULL;


--
-- Name: professional_schedules professional_schedules_profile_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.professional_schedules
    ADD CONSTRAINT professional_schedules_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: professional_settings professional_settings_profile_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.professional_settings
    ADD CONSTRAINT professional_settings_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: profiles profiles_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: referrals referrals_referred_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.referrals
    ADD CONSTRAINT referrals_referred_user_id_fkey FOREIGN KEY (referred_user_id) REFERENCES public.profiles(id) ON DELETE SET NULL;


--
-- Name: referrals referrals_referrer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.referrals
    ADD CONSTRAINT referrals_referrer_id_fkey FOREIGN KEY (referrer_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: shop_orders shop_orders_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shop_orders
    ADD CONSTRAINT shop_orders_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE SET NULL;


--
-- Name: student_progress student_progress_lesson_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_progress
    ADD CONSTRAINT student_progress_lesson_id_fkey FOREIGN KEY (lesson_id) REFERENCES public.lessons(id) ON DELETE CASCADE;


--
-- Name: student_progress student_progress_module_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_progress
    ADD CONSTRAINT student_progress_module_id_fkey FOREIGN KEY (module_id) REFERENCES public.modules(id) ON DELETE CASCADE;


--
-- Name: forum_questions Admin can update (reply); Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin can update (reply)" ON public.forum_questions FOR UPDATE USING (true);


--
-- Name: lesson_tags Admin manage tags; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin manage tags" ON public.lesson_tags USING (true) WITH CHECK (true);


--
-- Name: professional_profiles Admins insert professional profiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins insert professional profiles" ON public.professional_profiles FOR INSERT WITH CHECK ((( SELECT profiles.role
   FROM public.profiles
  WHERE (profiles.id = auth.uid())) = 'admin'::text));


--
-- Name: shop_orders Admins manage all orders; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins manage all orders" ON public.shop_orders USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::text)))));


--
-- Name: professional_profiles Admins manage all professional profiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins manage all professional profiles" ON public.professional_profiles USING ((( SELECT profiles.role
   FROM public.profiles
  WHERE (profiles.id = auth.uid())) = 'admin'::text));


--
-- Name: professional_schedules Admins manage own schedules; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins manage own schedules" ON public.professional_schedules USING ((profile_id = auth.uid()));


--
-- Name: professional_settings Admins manage own settings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins manage own settings" ON public.professional_settings USING ((profile_id = auth.uid()));


--
-- Name: google_calendar_tokens Admins manage own tokens; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins manage own tokens" ON public.google_calendar_tokens USING ((profile_id = auth.uid()));


--
-- Name: shop_products Admins manage products; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins manage products" ON public.shop_products USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::text)))));


--
-- Name: referrals Admins manage referrals; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins manage referrals" ON public.referrals USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::text)))));


--
-- Name: professional_profiles Admins read all professional profiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins read all professional profiles" ON public.professional_profiles FOR SELECT USING ((( SELECT profiles.role
   FROM public.profiles
  WHERE (profiles.id = auth.uid())) = 'admin'::text));


--
-- Name: professional_profiles Admins update professional profiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins update professional profiles" ON public.professional_profiles FOR UPDATE USING ((( SELECT profiles.role
   FROM public.profiles
  WHERE (profiles.id = auth.uid())) = 'admin'::text));


--
-- Name: shop_orders Anyone can insert orders; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can insert orders" ON public.shop_orders FOR INSERT WITH CHECK (true);


--
-- Name: forum_questions Anyone can read forum questions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can read forum questions" ON public.forum_questions FOR SELECT USING (true);


--
-- Name: certificates Anyone can view certificate by id; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view certificate by id" ON public.certificates FOR SELECT USING (true);


--
-- Name: coupons Anyone reads active coupons; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone reads active coupons" ON public.coupons FOR SELECT USING ((active = true));


--
-- Name: professional_profiles Anyone reads active professionals; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone reads active professionals" ON public.professional_profiles FOR SELECT USING ((active = true));


--
-- Name: forum_questions Authenticated users can insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can insert" ON public.forum_questions FOR INSERT WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: professional_blocked_times Professionals manage own blocked times; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Professionals manage own blocked times" ON public.professional_blocked_times USING ((profile_id = auth.uid()));


--
-- Name: shop_products Public read active products; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public read active products" ON public.shop_products FOR SELECT USING ((active = true));


--
-- Name: professional_settings Public read active professionals; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public read active professionals" ON public.professional_settings FOR SELECT USING ((is_active = true));


--
-- Name: professional_blocked_times Public read blocked times; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public read blocked times" ON public.professional_blocked_times FOR SELECT USING (true);


--
-- Name: student_progress Public read progress for admin; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public read progress for admin" ON public.student_progress FOR SELECT USING (true);


--
-- Name: professional_schedules Public read schedules; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public read schedules" ON public.professional_schedules FOR SELECT USING (true);


--
-- Name: lesson_tags Public read tags; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public read tags" ON public.lesson_tags FOR SELECT USING (true);


--
-- Name: certificates Users can manage own certificate; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can manage own certificate" ON public.certificates USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));


--
-- Name: purchases Users can read own purchases; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can read own purchases" ON public.purchases FOR SELECT TO authenticated USING ((email = auth.email()));


--
-- Name: coupon_uses Users insert own coupon uses; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users insert own coupon uses" ON public.coupon_uses FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: points_transactions Users insert own points; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users insert own points" ON public.points_transactions FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: professional_profiles Users insert own professional profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users insert own professional profile" ON public.professional_profiles FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: referrals Users insert referrals; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users insert referrals" ON public.referrals FOR INSERT WITH CHECK (true);


--
-- Name: student_progress Users manage own progress; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users manage own progress" ON public.student_progress USING ((student_id = (auth.uid())::text)) WITH CHECK ((student_id = (auth.uid())::text));


--
-- Name: coupon_uses Users see own coupon uses; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users see own coupon uses" ON public.coupon_uses FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: shop_orders Users see own orders; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users see own orders" ON public.shop_orders FOR SELECT USING (((user_id = auth.uid()) OR (client_email = ( SELECT profiles.email
   FROM public.profiles
  WHERE (profiles.id = auth.uid())))));


--
-- Name: points_transactions Users see own points; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users see own points" ON public.points_transactions FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: professional_profiles Users see own professional profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users see own professional profile" ON public.professional_profiles FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: referrals Users see own referrals; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users see own referrals" ON public.referrals FOR SELECT USING ((referrer_id = auth.uid()));


--
-- Name: professional_profiles Users update own professional profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users update own professional profile" ON public.professional_profiles FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: profiles admins_delete_any_profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY admins_delete_any_profile ON public.profiles FOR DELETE USING ((( SELECT profiles_1.role
   FROM public.profiles profiles_1
  WHERE (profiles_1.id = auth.uid())) = 'admin'::text));


--
-- Name: purchases admins_read_all_purchases; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY admins_read_all_purchases ON public.purchases FOR SELECT TO authenticated USING ((( SELECT profiles.role
   FROM public.profiles
  WHERE (profiles.id = auth.uid())) = 'admin'::text));


--
-- Name: profiles admins_update_any_profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY admins_update_any_profile ON public.profiles FOR UPDATE TO authenticated USING ((( SELECT profiles_1.role
   FROM public.profiles profiles_1
  WHERE (profiles_1.id = auth.uid())) = 'admin'::text)) WITH CHECK ((( SELECT profiles_1.role
   FROM public.profiles profiles_1
  WHERE (profiles_1.id = auth.uid())) = 'admin'::text));


--
-- Name: booking_services; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.booking_services ENABLE ROW LEVEL SECURITY;

--
-- Name: booking_services booking_services_admin; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY booking_services_admin ON public.booking_services USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::text)))));


--
-- Name: booking_services booking_services_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY booking_services_insert ON public.booking_services FOR INSERT WITH CHECK (true);


--
-- Name: bookings; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

--
-- Name: bookings bookings_admin_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY bookings_admin_all ON public.bookings USING (((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::text)))) OR (user_id = auth.uid())));


--
-- Name: bookings bookings_insert_anon; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY bookings_insert_anon ON public.bookings FOR INSERT WITH CHECK (true);


--
-- Name: bookings bookings_public_date_check; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY bookings_public_date_check ON public.bookings FOR SELECT USING ((status <> 'cancelled'::text));


--
-- Name: center_settings; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.center_settings ENABLE ROW LEVEL SECURITY;

--
-- Name: center_settings center_settings_admin_write; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY center_settings_admin_write ON public.center_settings USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::text)))));


--
-- Name: center_settings center_settings_public_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY center_settings_public_read ON public.center_settings FOR SELECT USING (true);


--
-- Name: certificates; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;

--
-- Name: client_accounts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.client_accounts ENABLE ROW LEVEL SECURITY;

--
-- Name: client_points_transactions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.client_points_transactions ENABLE ROW LEVEL SECURITY;

--
-- Name: client_referrals; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.client_referrals ENABLE ROW LEVEL SECURITY;

--
-- Name: coupon_uses; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.coupon_uses ENABLE ROW LEVEL SECURITY;

--
-- Name: coupons; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

--
-- Name: forum_questions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.forum_questions ENABLE ROW LEVEL SECURITY;

--
-- Name: google_calendar_tokens; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.google_calendar_tokens ENABLE ROW LEVEL SECURITY;

--
-- Name: lesson_tags; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.lesson_tags ENABLE ROW LEVEL SECURITY;

--
-- Name: lessons; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;

--
-- Name: modules; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;

--
-- Name: points_transactions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.points_transactions ENABLE ROW LEVEL SECURITY;

--
-- Name: professional_blocked_times; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.professional_blocked_times ENABLE ROW LEVEL SECURITY;

--
-- Name: professional_profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.professional_profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: professional_reviews; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.professional_reviews ENABLE ROW LEVEL SECURITY;

--
-- Name: professional_schedules; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.professional_schedules ENABLE ROW LEVEL SECURITY;

--
-- Name: professional_settings; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.professional_settings ENABLE ROW LEVEL SECURITY;

--
-- Name: profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: profiles profiles_public_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY profiles_public_read ON public.profiles FOR SELECT USING (true);


--
-- Name: profiles profiles_self_write; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY profiles_self_write ON public.profiles USING ((auth.uid() = id)) WITH CHECK ((auth.uid() = id));


--
-- Name: student_progress public_all_progress; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY public_all_progress ON public.student_progress USING (true) WITH CHECK (true);


--
-- Name: client_accounts public_insert_client_accounts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY public_insert_client_accounts ON public.client_accounts FOR INSERT WITH CHECK (true);


--
-- Name: client_points_transactions public_insert_client_pts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY public_insert_client_pts ON public.client_points_transactions FOR INSERT WITH CHECK (true);


--
-- Name: client_referrals public_insert_client_refs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY public_insert_client_refs ON public.client_referrals FOR INSERT WITH CHECK (true);


--
-- Name: lessons public_read_lessons; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY public_read_lessons ON public.lessons FOR SELECT USING (true);


--
-- Name: modules public_read_modules; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY public_read_modules ON public.modules FOR SELECT USING (true);


--
-- Name: client_accounts public_select_client_accounts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY public_select_client_accounts ON public.client_accounts FOR SELECT USING (true);


--
-- Name: client_points_transactions public_select_client_pts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY public_select_client_pts ON public.client_points_transactions FOR SELECT USING (true);


--
-- Name: client_referrals public_select_client_refs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY public_select_client_refs ON public.client_referrals FOR SELECT USING (true);


--
-- Name: client_accounts public_update_client_accounts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY public_update_client_accounts ON public.client_accounts FOR UPDATE USING (true);


--
-- Name: client_referrals public_update_client_refs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY public_update_client_refs ON public.client_referrals FOR UPDATE USING (true);


--
-- Name: lessons public_write_lessons; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY public_write_lessons ON public.lessons USING (true) WITH CHECK (true);


--
-- Name: modules public_write_modules; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY public_write_modules ON public.modules USING (true) WITH CHECK (true);


--
-- Name: purchases; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;

--
-- Name: referrals; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

--
-- Name: services; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

--
-- Name: services services_admin_write; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY services_admin_write ON public.services USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::text)))));


--
-- Name: services services_public_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY services_public_read ON public.services FOR SELECT USING (true);


--
-- Name: shop_orders; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.shop_orders ENABLE ROW LEVEL SECURITY;

--
-- Name: shop_products; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.shop_products ENABLE ROW LEVEL SECURITY;

--
-- Name: student_progress; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.student_progress ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--

\unrestrict beIqM5NHtx8VTgCgdmk2l2GyFNoKQQvUNuiZ9Ba1gW0ab6dZ4BhpYOgochKaBWu

