


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE EXTENSION IF NOT EXISTS "pg_cron" WITH SCHEMA "pg_catalog";






COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_net" WITH SCHEMA "public";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."award_profile_points"("p_user_id" "uuid", "p_client_id" "uuid", "p_points" integer, "p_reason" "text") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    IF p_user_id IS NOT NULL THEN
        -- Usuarios Auth (Email)
        UPDATE public.profiles SET points = COALESCE(points, 0) + p_points WHERE id = p_user_id;
        INSERT INTO public.points_transactions (user_id, points, type, description)
        VALUES (p_user_id, p_points, 'earned', p_reason);
    ELSIF p_client_id IS NOT NULL THEN
        -- Usuarios Teléfono
        UPDATE public.client_accounts SET points = COALESCE(points, 0) + p_points WHERE id = p_client_id;
        INSERT INTO public.client_points_transactions (client_account_id, points, type, description)
        VALUES (p_client_id, p_points, 'earned', p_reason);
    END IF;
END;
$$;


ALTER FUNCTION "public"."award_profile_points"("p_user_id" "uuid", "p_client_id" "uuid", "p_points" integer, "p_reason" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."call_notify_booking_client"("p_booking_id" "uuid", "p_type" "text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  PERFORM net.http_post(
    url := 'https://expbduyqklpnnkyoapvi.supabase.co/functions/v1/notify-booking-client',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV4cGJkdXlxa2xwbm5reW9hcHZpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzYzMjU5MywiZXhwIjoyMDkzMjA4NTkzfQ.NFdxHHQPWMvTexwBZRMizSsXfWzBYrcMQCQQFuNrNeE'
    ),
    body := jsonb_build_object('booking_id', p_booking_id::text, 'type', p_type)
  );
EXCEPTION WHEN OTHERS THEN
  RAISE LOG '[notify_booking_client] Error: %', SQLERRM;
END;
$$;


ALTER FUNCTION "public"."call_notify_booking_client"("p_booking_id" "uuid", "p_type" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."call_notify_booking_staff"("p_booking_id" "uuid", "p_event" "text") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  PERFORM net.http_post(
    url := 'https://expbduyqklpnnkyoapvi.supabase.co/functions/v1/notify-booking-staff',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV4cGJkdXlxa2xwbm5reW9hcHZpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzYzMjU5MywiZXhwIjoyMDkzMjA4NTkzfQ.NFdxHHQPWMvTexwBZRMizSsXfWzBYrcMQCQQFuNrNeE'
    ),
    body := jsonb_build_object(
      'booking_id', p_booking_id::text,
      'type', p_event
    )
  );
END;
$$;


ALTER FUNCTION "public"."call_notify_booking_staff"("p_booking_id" "uuid", "p_event" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."call_whatsapp_followup"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$ BEGIN PERFORM net.http_post(url := 'https://expbduyqklpnnkyoapvi.supabase.co/functions/v1/whatsapp-followup', headers := jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV4cGJkdXlxa2xwbm5reW9hcHZpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzYzMjU5MywiZXhwIjoyMDkzMjA4NTkzfQ.NFdxHHQPWMvTexwBZRMizSsXfWzBYrcMQCQQFuNrNeE'), body := '{}'::jsonb); EXCEPTION WHEN OTHERS THEN RAISE LOG '[whatsapp_followup] Error: %', SQLERRM; END; $$;


ALTER FUNCTION "public"."call_whatsapp_followup"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."call_whatsapp_reminders"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  PERFORM net.http_post(
    url := 'https://expbduyqklpnnkyoapvi.supabase.co/functions/v1/cron-whatsapp-reminders',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV4cGJkdXlxa2xwbm5reW9hcHZpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzYzMjU5MywiZXhwIjoyMDkzMjA4NTkzfQ.NFdxHHQPWMvTexwBZRMizSsXfWzBYrcMQCQQFuNrNeE'
    ),
    body := '{}'::jsonb
  );
EXCEPTION WHEN OTHERS THEN
  RAISE LOG '[whatsapp_reminders] Error: %', SQLERRM;
END;
$$;


ALTER FUNCTION "public"."call_whatsapp_reminders"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."check_whatsapp_conversation_stuck"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$ DECLARE v_user_msg_count integer; v_recent_booking_count integer; v_phone text; BEGIN IF NEW.role <> 'user' OR NEW.direction <> 'inbound' THEN RETURN NEW; END IF; SELECT count(*) INTO v_user_msg_count FROM whatsapp_messages WHERE conversation_id = NEW.conversation_id AND role = 'user' AND direction = 'inbound'; IF v_user_msg_count <> 15 THEN RETURN NEW; END IF; SELECT phone INTO v_phone FROM whatsapp_conversations WHERE id = NEW.conversation_id; SELECT count(*) INTO v_recent_booking_count FROM bookings WHERE client_phone ILIKE '%' || RIGHT(REGEXP_REPLACE(v_phone, '[^0-9]', '', 'g'), 9) AND created_at > NOW() - INTERVAL '24 hours' AND status <> 'cancelled'; IF v_recent_booking_count > 0 THEN RETURN NEW; END IF; UPDATE whatsapp_conversations SET needs_human = true, human_note = 'Conversación atascada: 15+ mensajes sin reserva creada en 24h. Revisar.' WHERE id = NEW.conversation_id AND needs_human = false; INSERT INTO notification_logs (channel, notification_type, title, body, recipient_name, recipient_email, status, sent_at) VALUES ('whatsapp', 'bot_conversation_stuck', 'Bot atascado: revisa esta conversación', 'El chat con ' || v_phone || ' lleva ' || v_user_msg_count || ' mensajes sin reserva creada. Probablemente el bot está dando vueltas.', v_phone, NULL, 'failed', NOW()); RETURN NEW; END; $$;


ALTER FUNCTION "public"."check_whatsapp_conversation_stuck"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."client_is_new_for_referral"("p_phone" "text") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
      DECLARE
        last9 text;
        prior_count int;
      BEGIN
        IF p_phone IS NULL OR length(p_phone) < 6 THEN RETURN false; END IF;
        last9 := right(regexp_replace(p_phone, '\D', '', 'g'), 9);
        IF length(last9) < 9 THEN RETURN false; END IF;
        -- STRICTER: count ALL prior bookings, including cancelled ones.
        -- Otherwise a client can cancel-and-rebook to keep claiming the discount.
        SELECT count(*) INTO prior_count FROM public.bookings
          WHERE client_phone ILIKE '%' || last9;
        RETURN prior_count = 0;
      END;
      $$;


ALTER FUNCTION "public"."client_is_new_for_referral"("p_phone" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."find_client_account_by_phone"("p_phone" "text") RETURNS TABLE("id" "uuid", "phone" "text", "name" "text", "email" "text", "points" integer, "referral_code" "text", "auth_user_id" "uuid", "phone_login_enabled" boolean, "created_at" timestamp with time zone, "updated_at" timestamp with time zone)
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT ca.id, ca.phone, ca.name, ca.email, ca.points, ca.referral_code,
         ca.auth_user_id, ca.phone_login_enabled, ca.created_at, ca.updated_at
  FROM public.client_accounts ca
  WHERE
    -- Match by digits-only comparison (last 9 digits)
    right(regexp_replace(ca.phone, '\D', '', 'g'), 9) =
    right(regexp_replace(coalesce(p_phone, ''), '\D', '', 'g'), 9)
    AND length(regexp_replace(coalesce(p_phone, ''), '\D', '', 'g')) >= 9
  -- Pick the row with most points if there are duplicates
  ORDER BY ca.points DESC NULLS LAST, ca.created_at ASC
  LIMIT 1;
$$;


ALTER FUNCTION "public"."find_client_account_by_phone"("p_phone" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_potentially_silenced_clients"("days_back" integer DEFAULT 60, "migration_date" timestamp with time zone DEFAULT '2026-05-18 00:00:00+00'::timestamp with time zone) RETURNS TABLE("client_phone" "text", "client_name" "text", "last_booking_date" "date", "total_bookings" bigint)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$ BEGIN RETURN QUERY WITH recent AS (SELECT b.client_phone AS phone, MAX(b.client_name) AS name, MAX(b.created_at) AS last_booking_created, count(*) AS total FROM bookings b WHERE b.created_at > NOW() - (days_back || ' days')::interval AND b.client_phone IS NOT NULL AND b.client_phone <> '' GROUP BY b.client_phone) SELECT r.phone, COALESCE(NULLIF(TRIM(r.name), ''), '(sin nombre)'), r.last_booking_created::date, r.total FROM recent r WHERE NOT EXISTS (SELECT 1 FROM whatsapp_messages m JOIN whatsapp_conversations c ON c.id = m.conversation_id WHERE c.phone ILIKE '%' || RIGHT(REGEXP_REPLACE(r.phone, '[^0-9]', '', 'g'), 9) AND m.direction = 'inbound' AND m.created_at >= migration_date) ORDER BY r.last_booking_created DESC; END; $$;


ALTER FUNCTION "public"."get_potentially_silenced_clients"("days_back" integer, "migration_date" timestamp with time zone) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_stalled_whatsapp_convs"() RETURNS TABLE("id" "uuid", "phone" "text", "client_name" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$ BEGIN RETURN QUERY SELECT c.id, c.phone, c.client_name FROM whatsapp_conversations c WHERE c.needs_human = false AND (c.last_followup_at IS NULL OR c.last_followup_at < NOW() - INTERVAL '6 hours') AND EXISTS (SELECT 1 FROM whatsapp_messages m WHERE m.conversation_id = c.id AND m.id = (SELECT id FROM whatsapp_messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) AND m.direction = 'outbound' AND m.role IN ('assistant','system') AND m.created_at BETWEEN NOW() - INTERVAL '45 minutes' AND NOW() - INTERVAL '15 minutes') AND NOT EXISTS (SELECT 1 FROM bookings b WHERE b.client_phone ILIKE '%' || RIGHT(REGEXP_REPLACE(c.phone, '[^0-9]', '', 'g'), 9) AND b.created_at > NOW() - INTERVAL '2 hours'); END; $$;


ALTER FUNCTION "public"."get_stalled_whatsapp_convs"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_wa_reminder_candidates"() RETURNS TABLE("id" "uuid", "client_name" "text", "client_phone" "text", "booking_date" "date", "booking_time" "text", "professional_name" "text", "services" "text", "reminder_type" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN QUERY

  -- ── 24-hour reminders ──
  SELECT
    b.id,
    b.client_name,
    b.client_phone,
    b.booking_date,
    b.booking_time,
    p.name AS professional_name,
    (
      SELECT string_agg(bs.service_name, ', ')
      FROM booking_services bs WHERE bs.booking_id = b.id
    ) AS services,
    'wa_reminder_24h'::TEXT AS reminder_type
  FROM bookings b
  LEFT JOIN profiles p ON p.id = b.professional_id
  WHERE b.status IN ('confirmed', 'pending')
    AND b.client_phone IS NOT NULL
    AND b.client_phone <> ''
    -- Booking datetime is between 23h55m and 24h05m from now
    AND (b.booking_date + b.booking_time::TIME)
        BETWEEN ((NOW() AT TIME ZONE 'Europe/Madrid') + INTERVAL '23 hours 55 minutes')
            AND ((NOW() AT TIME ZONE 'Europe/Madrid') + INTERVAL '24 hours 5 minutes')
    -- Not already sent
    AND NOT EXISTS (
      SELECT 1 FROM notification_logs nl
      WHERE nl.booking_id = b.id
        AND nl.notification_type = 'wa_reminder_24h'
    )

  UNION ALL

  -- ── 30-minute reminders ──
  SELECT
    b.id,
    b.client_name,
    b.client_phone,
    b.booking_date,
    b.booking_time,
    p.name AS professional_name,
    (
      SELECT string_agg(bs.service_name, ', ')
      FROM booking_services bs WHERE bs.booking_id = b.id
    ) AS services,
    'wa_reminder_30min'::TEXT AS reminder_type
  FROM bookings b
  LEFT JOIN profiles p ON p.id = b.professional_id
  WHERE b.status IN ('confirmed', 'pending')
    AND b.client_phone IS NOT NULL
    AND b.client_phone <> ''
    -- Booking datetime is between 25m and 35m from now
    AND (b.booking_date + b.booking_time::TIME)
        BETWEEN ((NOW() AT TIME ZONE 'Europe/Madrid') + INTERVAL '25 minutes')
            AND ((NOW() AT TIME ZONE 'Europe/Madrid') + INTERVAL '35 minutes')
    -- Not already sent
    AND NOT EXISTS (
      SELECT 1 FROM notification_logs nl
      WHERE nl.booking_id = b.id
        AND nl.notification_type = 'wa_reminder_30min'
    );
END;
$$;


ALTER FUNCTION "public"."get_wa_reminder_candidates"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_booking_completed_points"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_points INTEGER;
  v_service_names TEXT;
  v_clean_phone TEXT;
  v_last_9 TEXT;
  v_client_id UUID;
  v_ref_code TEXT;
  v_insert_phone TEXT;
  v_ref_id TEXT;
  v_user_id UUID;
  v_client_phone TEXT;
  v_booking_source TEXT;
  v_linked_profile_id UUID;
BEGIN
  -- Determine reference ID, client info and booking source based on operation
  IF TG_OP = 'DELETE' THEN
    v_ref_id        := OLD.id::text;
    v_user_id       := OLD.user_id;
    v_client_phone  := OLD.client_phone;
    v_booking_source := OLD.booking_source;
  ELSE
    v_ref_id        := NEW.id::text;
    v_user_id       := NEW.user_id;
    v_client_phone  := NEW.client_phone;
    v_booking_source := NEW.booking_source;
  END IF;

  -- ⚠️ Points are ONLY awarded/deducted for web bookings.
  -- Admin and WhatsApp bot bookings are excluded entirely.
  IF COALESCE(v_booking_source, 'web') NOT IN ('web') THEN
    IF TG_OP = 'DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
  END IF;

  -- Calculate total reward points for services in this booking
  SELECT COALESCE(SUM(s.reward_points), 0)
  INTO v_points
  FROM public.booking_services bs
  LEFT JOIN public.services s ON bs.service_id = s.id
  WHERE bs.booking_id = COALESCE(NEW.id, OLD.id);

  IF v_points > 0 THEN
    -- Get comma-separated list of service names for descriptions
    SELECT string_agg(bs.service_name, ', ')
    INTO v_service_names
    FROM public.booking_services bs
    WHERE bs.booking_id = COALESCE(NEW.id, OLD.id);

    -- CASE 1: Transitioning to 'completed' (Insert or Update)
    IF TG_OP != 'DELETE' AND NEW.status = 'completed' AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM 'completed') THEN

      -- CASE A: Registered user (user_id is not null)
      IF v_user_id IS NOT NULL THEN
        IF NOT EXISTS (
          SELECT 1 FROM public.points_transactions WHERE reference_id = v_ref_id
        ) THEN
          UPDATE public.profiles SET points = COALESCE(points, 0) + v_points WHERE id = v_user_id;
          INSERT INTO public.points_transactions (user_id, points, type, description, reference_id)
          VALUES (v_user_id, v_points, 'earned', 'Puntos ganados por servicio: ' || COALESCE(v_service_names, ''), v_ref_id);
        END IF;

      -- CASE B: Guest client (user_id is null)
      ELSE
        IF NOT EXISTS (
          SELECT 1 FROM public.client_points_transactions WHERE reference_id = v_ref_id
        ) THEN
          v_clean_phone := regexp_replace(v_client_phone, '\D', '', 'g');
          IF length(v_clean_phone) >= 6 THEN
            v_last_9 := right(v_clean_phone, 9);

            SELECT id INTO v_client_id
            FROM public.client_accounts
            WHERE regexp_replace(COALESCE(phone, ''), '\D', '', 'g') LIKE '%' || v_last_9
            LIMIT 1;

            IF v_client_id IS NULL THEN
              v_client_id := gen_random_uuid();
              v_ref_code := 'NAILOX-' || upper(replace(substring(v_client_id::text, 1, 8), '-', ''));
              IF NEW.client_phone LIKE '+%' THEN
                v_insert_phone := NEW.client_phone;
              ELSIF length(v_clean_phone) = 9 THEN
                v_insert_phone := '+34' || v_clean_phone;
              ELSE
                v_insert_phone := NEW.client_phone;
              END IF;
              INSERT INTO public.client_accounts (id, phone, name, email, points, referral_code)
              VALUES (v_client_id, v_insert_phone, NEW.client_name, NEW.client_email, 0, v_ref_code);
            END IF;

            -- Check if this client_account is linked to a registered profile
            SELECT auth_user_id INTO v_linked_profile_id
            FROM public.client_accounts WHERE id = v_client_id;

            IF v_linked_profile_id IS NOT NULL THEN
              -- Award to the registered profile (unified account)
              IF NOT EXISTS (
                SELECT 1 FROM public.points_transactions WHERE reference_id = v_ref_id
              ) THEN
                UPDATE public.profiles SET points = COALESCE(points, 0) + v_points WHERE id = v_linked_profile_id;
                INSERT INTO public.points_transactions (user_id, points, type, description, reference_id)
                VALUES (v_linked_profile_id, v_points, 'earned', 'Puntos ganados por servicio: ' || COALESCE(v_service_names, ''), v_ref_id);
              END IF;
            ELSE
              -- No linked profile — award to client_account
              INSERT INTO public.client_points_transactions (client_account_id, points, type, description, reference_id)
              VALUES (v_client_id, v_points, 'earned', 'Puntos ganados por servicio: ' || COALESCE(v_service_names, ''), v_ref_id);
              UPDATE public.client_accounts SET points = COALESCE(points, 0) + v_points WHERE id = v_client_id;
            END IF;

          END IF;
        END IF;
      END IF;

    -- CASE 2: Transitioning AWAY from 'completed' or DELETING a completed booking
    ELSIF (TG_OP = 'DELETE' AND OLD.status = 'completed') OR (TG_OP = 'UPDATE' AND OLD.status = 'completed' AND NEW.status IS DISTINCT FROM 'completed') THEN

      -- CASE A: Registered user
      IF v_user_id IS NOT NULL THEN
        IF EXISTS (
          SELECT 1 FROM public.points_transactions WHERE reference_id = v_ref_id AND points > 0 AND type = 'earned'
        ) AND NOT EXISTS (
          SELECT 1 FROM public.points_transactions WHERE reference_id = v_ref_id AND points < 0
        ) THEN
          UPDATE public.profiles SET points = GREATEST(0, COALESCE(points, 0) - v_points) WHERE id = v_user_id;
          INSERT INTO public.points_transactions (user_id, points, type, description, reference_id)
          VALUES (v_user_id, -v_points, 'earned', 'Deducción por cita cancelada/modificada: ' || COALESCE(v_service_names, ''), v_ref_id);
        END IF;

      -- CASE B: Guest client
      ELSE
        v_clean_phone := regexp_replace(v_client_phone, '\D', '', 'g');
        IF length(v_clean_phone) >= 6 THEN
          v_last_9 := right(v_clean_phone, 9);
          SELECT id INTO v_client_id
          FROM public.client_accounts
          WHERE regexp_replace(COALESCE(phone, ''), '\D', '', 'g') LIKE '%' || v_last_9
          LIMIT 1;

          IF v_client_id IS NOT NULL THEN
            SELECT auth_user_id INTO v_linked_profile_id FROM public.client_accounts WHERE id = v_client_id;

            IF v_linked_profile_id IS NOT NULL THEN
              IF EXISTS (
                SELECT 1 FROM public.points_transactions WHERE reference_id = v_ref_id AND points > 0
              ) AND NOT EXISTS (
                SELECT 1 FROM public.points_transactions WHERE reference_id = v_ref_id AND points < 0
              ) THEN
                UPDATE public.profiles SET points = GREATEST(0, COALESCE(points, 0) - v_points) WHERE id = v_linked_profile_id;
                INSERT INTO public.points_transactions (user_id, points, type, description, reference_id)
                VALUES (v_linked_profile_id, -v_points, 'earned', 'Deducción por cita cancelada/modificada: ' || COALESCE(v_service_names, ''), v_ref_id);
              END IF;
            ELSE
              IF EXISTS (
                SELECT 1 FROM public.client_points_transactions WHERE reference_id = v_ref_id AND points > 0
              ) AND NOT EXISTS (
                SELECT 1 FROM public.client_points_transactions WHERE reference_id = v_ref_id AND points < 0
              ) THEN
                UPDATE public.client_accounts SET points = GREATEST(0, COALESCE(points, 0) - v_points) WHERE id = v_client_id;
                INSERT INTO public.client_points_transactions (client_account_id, points, type, description, reference_id)
                VALUES (v_client_id, -v_points, 'earned', 'Deducción por cita cancelada/modificada: ' || COALESCE(v_service_names, ''), v_ref_id);
              END IF;
            END IF;
          END IF;
        END IF;
      END IF;

    END IF;
  END IF;

  IF TG_OP = 'DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
END;
$$;


ALTER FUNCTION "public"."handle_booking_completed_points"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  insert into public.profiles (id, email, name, role)
  values (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'name', ''),
    'student' -- Rol por defecto
  )
  on conflict (id) do update 
  set email = excluded.email;
  
  return new;
end;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."import_whatsapp_contacts"("p_contacts" "jsonb", "p_source" "text") RETURNS TABLE("out_action" "text", "out_phone" "text", "out_name" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$ DECLARE r record; v_last9 text; v_existing_id uuid; v_existing_name text; v_id uuid; v_ref text; BEGIN FOR r IN SELECT * FROM jsonb_to_recordset(p_contacts) AS x(phone text, name text) LOOP IF r.phone IS NULL OR r.phone = '' THEN CONTINUE; END IF; v_last9 := RIGHT(REGEXP_REPLACE(r.phone, '[^0-9]', '', 'g'), 9); SELECT ca.id, ca.name INTO v_existing_id, v_existing_name FROM client_accounts ca WHERE ca.phone ILIKE '%' || v_last9 LIMIT 1; IF v_existing_id IS NOT NULL THEN IF v_existing_name IS NULL OR TRIM(v_existing_name) = '' THEN UPDATE client_accounts SET name = TRIM(r.name), updated_at = NOW() WHERE id = v_existing_id; RETURN QUERY SELECT 'updated_name'::text, r.phone, TRIM(r.name); ELSE RETURN QUERY SELECT 'skipped'::text, r.phone, v_existing_name; END IF; ELSE v_id := gen_random_uuid(); v_ref := 'NAILOX-' || UPPER(REPLACE(SUBSTRING(v_id::text, 1, 8), '-', '')); BEGIN INSERT INTO client_accounts (id, phone, name, points, referral_code, import_source) VALUES (v_id, r.phone, NULLIF(TRIM(r.name), ''), 0, v_ref, p_source); RETURN QUERY SELECT 'inserted'::text, r.phone, TRIM(r.name); EXCEPTION WHEN unique_violation THEN RETURN QUERY SELECT 'conflict'::text, r.phone, TRIM(r.name); END; END IF; END LOOP; END; $$;


ALTER FUNCTION "public"."import_whatsapp_contacts"("p_contacts" "jsonb", "p_source" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."increment_campaign_stat"("campaign_row_id" "uuid", "stat_column" "text") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  EXECUTE format('UPDATE marketing_campaigns SET %I = %I + 1 WHERE id = %L', stat_column, stat_column, campaign_row_id);
END;
$$;


ALTER FUNCTION "public"."increment_campaign_stat"("campaign_row_id" "uuid", "stat_column" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."increment_profile_points"("p_user_id" "uuid", "p_points" integer) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  UPDATE public.profiles
  SET points = COALESCE(points, 0) + p_points
  WHERE id = p_user_id;
END;
$$;


ALTER FUNCTION "public"."increment_profile_points"("p_user_id" "uuid", "p_points" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_email_taken"("p_email" "text", "p_phone" "text" DEFAULT NULL::"text") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.client_accounts ca
    WHERE ca.email IS NOT NULL
      AND lower(trim(ca.email)) = lower(trim(coalesce(p_email, '')))
      AND (
        p_phone IS NULL
        OR right(regexp_replace(ca.phone, '\D', '', 'g'), 9)
           <> right(regexp_replace(coalesce(p_phone, ''), '\D', '', 'g'), 9)
      )
  )
  OR EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.email IS NOT NULL
      AND lower(trim(p.email)) = lower(trim(coalesce(p_email, '')))
  );
$$;


ALTER FUNCTION "public"."is_email_taken"("p_email" "text", "p_phone" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."normalize_phone"("p_phone" "text") RETURNS "text"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    v_clean TEXT;
BEGIN
    IF p_phone IS NULL OR p_phone = '' THEN
        RETURN NULL;
    END IF;
    v_clean := regexp_replace(p_phone, '[^0-9+]', '', 'g');
    IF v_clean LIKE '00%' THEN
        v_clean := '+' || substr(v_clean, 3);
    END IF;
    IF v_clean NOT LIKE '+%' AND length(v_clean) = 9 THEN
        v_clean := '+34' || v_clean;
    END IF;
    IF v_clean NOT LIKE '+%' AND length(v_clean) > 9 THEN
        v_clean := '+' || v_clean;
    END IF;
    RETURN v_clean;
END;
$$;


ALTER FUNCTION "public"."normalize_phone"("p_phone" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."rls_auto_enable"() RETURNS "event_trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog'
    AS $$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN
    SELECT *
    FROM pg_event_trigger_ddl_commands()
    WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      AND object_type IN ('table','partitioned table')
  LOOP
     IF cmd.schema_name IS NOT NULL AND cmd.schema_name IN ('public') AND cmd.schema_name NOT IN ('pg_catalog','information_schema') AND cmd.schema_name NOT LIKE 'pg_toast%' AND cmd.schema_name NOT LIKE 'pg_temp%' THEN
      BEGIN
        EXECUTE format('alter table if exists %s enable row level security', cmd.object_identity);
        RAISE LOG 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE LOG 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      END;
     ELSE
        RAISE LOG 'rls_auto_enable: skip % (either system schema or not in enforced list: %.)', cmd.object_identity, cmd.schema_name;
     END IF;
  END LOOP;
END;
$$;


ALTER FUNCTION "public"."rls_auto_enable"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."send_booking_reminders_client"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT b.id
    FROM public.bookings b
    WHERE b.status IN ('confirmed', 'pending')
      AND b.booking_date = CURRENT_DATE
      -- 25-35 min window centered on 30 min
      AND b.booking_time BETWEEN (NOW() + INTERVAL '25 minutes')::time
                               AND (NOW() + INTERVAL '35 minutes')::time
      AND NOT EXISTS (
        SELECT 1 FROM public.notification_logs nl
        WHERE nl.booking_id = b.id
          AND nl.notification_type = 'appointment_reminder'
      )
  LOOP
    PERFORM public.call_notify_booking_client(r.id, 'appointment_reminder');
  END LOOP;
END;
$$;


ALTER FUNCTION "public"."send_booking_reminders_client"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."send_booking_reminders_staff"() RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT b.id
    FROM public.bookings b
    WHERE b.status IN ('confirmed', 'pending')
      AND b.booking_date = CURRENT_DATE
      -- Window: between 25 and 35 minutes from now (centered at 30 min)
      AND b.booking_time BETWEEN (NOW() + INTERVAL '25 minutes')::time
                               AND (NOW() + INTERVAL '35 minutes')::time
      AND NOT EXISTS (
        SELECT 1 FROM public.notification_logs nl
        WHERE nl.booking_id = b.id
          AND nl.event_type = 'booking_reminder'
      )
  LOOP
    PERFORM public.call_notify_booking_staff(r.id, 'reminder_30min');
  END LOOP;
END;
$$;


ALTER FUNCTION "public"."send_booking_reminders_staff"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_professional_name_snapshot"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  v_name TEXT;
BEGIN
  -- Only act when professional_id is set and name isn't already captured
  IF NEW.professional_id IS NOT NULL AND
     (NEW.professional_name_snapshot IS NULL OR NEW.professional_name_snapshot = '') THEN

    -- Try display_name from professional_settings first
    SELECT NULLIF(TRIM(ps.display_name), '')
    INTO v_name
    FROM public.professional_settings ps
    WHERE ps.profile_id = NEW.professional_id;

    -- Fallback to profiles.name
    IF v_name IS NULL THEN
      SELECT NULLIF(TRIM(p.name), '')
      INTO v_name
      FROM public.profiles p
      WHERE p.id = NEW.professional_id;
    END IF;

    IF v_name IS NOT NULL THEN
      NEW.professional_name_snapshot := v_name;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."set_professional_name_snapshot"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."sync_all_automations_cron"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  hour_val TEXT;
  job_name TEXT;
  cron_expr TEXT;
  service_key TEXT := 'your_supabase_service_role_key_here';
  func_url TEXT := 'https://expbduyqklpnnkyoapvi.supabase.co/functions/v1/cron-availability-alert'; -- We can generalize this later
BEGIN
  -- 1. Remove all old cron jobs for this specific automation
  DELETE FROM cron.job WHERE jobname LIKE 'auto-' || NEW.id || '-%';
  
  -- 2. If it is active, schedule new jobs
  IF NEW.is_active THEN
    FOR hour_val IN SELECT * FROM jsonb_array_elements_text(NEW.schedule)
    LOOP
      job_name := 'auto-' || NEW.id || '-' || replace(hour_val, ':', '-');
      cron_expr := split_part(hour_val, ':', 2) || ' ' || split_part(hour_val, ':', 1) || ' * * *';
      
      PERFORM cron.schedule(job_name, cron_expr, 
        format('SELECT net.http_post(url := %L, headers := %L, body := %L)', 
          func_url, 
          jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer ' || service_key),
          jsonb_build_object('automation_id', NEW.id)
        )
      );
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."sync_all_automations_cron"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."sync_availability_cron"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  hour_val TEXT;
  job_name TEXT;
  cron_expr TEXT;
  service_key TEXT := 'your_supabase_service_role_key_here';
  func_url TEXT := 'https://expbduyqklpnnkyoapvi.supabase.co/functions/v1/cron-availability-alert';
BEGIN
  IF NEW.key = 'availability_alert_hours' THEN
    DELETE FROM cron.job WHERE jobname LIKE 'availability-alert-%';
    FOR hour_val IN SELECT * FROM jsonb_array_elements_text(NEW.value)
    LOOP
      job_name := 'availability-alert-' || replace(hour_val, ':', '-');
      cron_expr := split_part(hour_val, ':', 2) || ' ' || split_part(hour_val, ':', 1) || ' * * *';
      PERFORM cron.schedule(job_name, cron_expr, 
        format('SELECT net.http_post(url := %L, headers := %L, body := %L)', 
          func_url, 
          jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer ' || service_key),
          '{}'::jsonb
        )
      );
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."sync_availability_cron"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."trig_client_rewards_before"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    -- Premio por Email (100 pts)
    IF NEW.email IS NOT NULL AND (OLD.email IS NULL OR OLD.email = '') AND NEW.email_reward_awarded = FALSE THEN
        NEW.points := COALESCE(NEW.points, 0) + 100;
        NEW.email_reward_awarded := TRUE;
        INSERT INTO public.client_points_transactions (client_account_id, points, type, description)
        VALUES (NEW.id, 100, 'earned', 'Completar perfil: Email 📧');
    END IF;

    -- Premio por Cumpleaños (100 pts)
    IF NEW.birthday IS NOT NULL AND OLD.birthday IS NULL AND NEW.birthday_reward_awarded = FALSE THEN
        NEW.points := COALESCE(NEW.points, 0) + 100;
        NEW.birthday_reward_awarded := TRUE;
        INSERT INTO public.client_points_transactions (client_account_id, points, type, description)
        VALUES (NEW.id, 100, 'earned', 'Completar perfil: Cumpleaños 🎂');
    END IF;

    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."trig_client_rewards_before"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."trig_normalize_phone_on_upsert"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    IF TG_TABLE_NAME = 'profiles' THEN
        NEW.phone := normalize_phone(NEW.phone);
    ELSIF TG_TABLE_NAME = 'client_accounts' THEN
        NEW.phone := normalize_phone(NEW.phone);
    ELSIF TG_TABLE_NAME = 'bookings' THEN
        NEW.client_phone := normalize_phone(NEW.client_phone);
    ELSIF TG_TABLE_NAME = 'shop_orders' THEN
        NEW.client_phone := normalize_phone(NEW.client_phone);
    ELSIF TG_TABLE_NAME = 'whatsapp_conversations' THEN
        NEW.phone := normalize_phone(NEW.phone);
    ELSIF TG_TABLE_NAME = 'professional_reviews' THEN
        NEW.reviewer_phone := normalize_phone(NEW.reviewer_phone);
    END IF;
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."trig_normalize_phone_on_upsert"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."trig_profile_rewards_before"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    -- Premio por Email (100 pts)
    IF NEW.email IS NOT NULL AND (OLD.email IS NULL OR OLD.email = '') AND NEW.email_reward_awarded = FALSE THEN
        NEW.points := COALESCE(NEW.points, 0) + 100;
        NEW.email_reward_awarded := TRUE;
        INSERT INTO public.points_transactions (user_id, points, type, description)
        VALUES (NEW.id, 100, 'earned', 'Completar perfil: Email 📧');
    END IF;

    -- Premio por Cumpleaños (100 pts)
    IF NEW.birthday IS NOT NULL AND OLD.birthday IS NULL AND NEW.birthday_reward_awarded = FALSE THEN
        NEW.points := COALESCE(NEW.points, 0) + 100;
        NEW.birthday_reward_awarded := TRUE;
        INSERT INTO public.points_transactions (user_id, points, type, description)
        VALUES (NEW.id, 100, 'earned', 'Completar perfil: Cumpleaños 🎂');
    END IF;

    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."trig_profile_rewards_before"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."trigger_notify_new_booking"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  PERFORM public.call_notify_booking_staff(NEW.id, 'new_booking');
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."trigger_notify_new_booking"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."trigger_notify_new_booking_client"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  PERFORM public.call_notify_booking_client(NEW.id, 'booking_confirmation');
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."trigger_notify_new_booking_client"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_professional_rating"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    UPDATE public.professional_profiles
    SET 
        rating = (
            SELECT COALESCE(AVG(rating), 0) 
            FROM public.professional_reviews 
            WHERE professional_id = NEW.professional_id
        ),
        review_count = (
            SELECT COUNT(*) 
            FROM public.professional_reviews 
            WHERE professional_id = NEW.professional_id
        )
    WHERE id = NEW.professional_id;
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_professional_rating"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_service_booking_count"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
begin
  if (TG_OP = 'INSERT') then
    update public.services
    set booking_count = booking_count + 1
    where id = new.service_id;
  elsif (TG_OP = 'DELETE') then
    update public.services
    set booking_count = greatest(0, booking_count - 1)
    where id = old.service_id;
  elsif (TG_OP = 'UPDATE') then
    if (old.service_id <> new.service_id) then
      update public.services
      set booking_count = greatest(0, booking_count - 1)
      where id = old.service_id;
      
      update public.services
      set booking_count = booking_count + 1
      where id = new.service_id;
    end if;
  end if;
  return null;
end;
$$;


ALTER FUNCTION "public"."update_service_booking_count"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_subscription_sessions_on_booking"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    -- Case 1: Insert new booking with a subscription
    IF (TG_OP = 'INSERT') THEN
        IF NEW.subscription_id IS NOT NULL AND NEW.status != 'cancelled' THEN
            UPDATE public.client_subscriptions
            SET sessions_used = sessions_used + 1,
                updated_at = now()
            WHERE id = NEW.subscription_id;
        END IF;
        
    -- Case 2: Update existing booking
    ELSIF (TG_OP = 'UPDATE') THEN
        -- If subscription changed
        IF OLD.subscription_id IS DISTINCT FROM NEW.subscription_id THEN
            -- Decrement old subscription if existed
            IF OLD.subscription_id IS NOT NULL AND OLD.status != 'cancelled' THEN
                UPDATE public.client_subscriptions
                SET sessions_used = LEAST(sessions_total, GREATEST(0, sessions_used - 1)),
                    updated_at = now()
                WHERE id = OLD.subscription_id;
            END IF;
            -- Increment new subscription if exists
            IF NEW.subscription_id IS NOT NULL AND NEW.status != 'cancelled' THEN
                UPDATE public.client_subscriptions
                SET sessions_used = sessions_used + 1,
                    updated_at = now()
                WHERE id = NEW.subscription_id;
            END IF;
        -- If subscription didn't change, but status changed to cancelled
        ELSIF NEW.subscription_id IS NOT NULL AND OLD.status != 'cancelled' AND NEW.status = 'cancelled' THEN
            UPDATE public.client_subscriptions
            SET sessions_used = LEAST(sessions_total, GREATEST(0, sessions_used - 1)),
                updated_at = now()
            WHERE id = NEW.subscription_id;
        -- If subscription didn't change, but status changed FROM cancelled back to active/pending
        ELSIF NEW.subscription_id IS NOT NULL AND OLD.status = 'cancelled' AND NEW.status != 'cancelled' THEN
            UPDATE public.client_subscriptions
            SET sessions_used = sessions_used + 1,
                updated_at = now()
            WHERE id = NEW.subscription_id;
        END IF;

    -- Case 3: Delete booking
    ELSIF (TG_OP = 'DELETE') THEN
        IF OLD.subscription_id IS NOT NULL AND OLD.status != 'cancelled' THEN
            UPDATE public.client_subscriptions
            SET sessions_used = LEAST(sessions_total, GREATEST(0, sessions_used - 1)),
                updated_at = now()
            WHERE id = OLD.subscription_id;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_subscription_sessions_on_booking"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."automations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "template_id" "uuid",
    "target_audience" "text" NOT NULL,
    "schedule" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."automations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."booking_services" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "booking_id" "uuid",
    "service_id" "uuid",
    "service_name" "text" NOT NULL,
    "price_at_booking" numeric(10,2) NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."booking_services" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."bookings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "client_name" "text" NOT NULL,
    "client_email" "text",
    "client_phone" "text" NOT NULL,
    "booking_date" "date" NOT NULL,
    "booking_time" "text" NOT NULL,
    "total_duration_minutes" integer DEFAULT 30 NOT NULL,
    "total_price" numeric(10,2) DEFAULT 0 NOT NULL,
    "deposit_amount" numeric(10,2) DEFAULT 0 NOT NULL,
    "deposit_paid" boolean DEFAULT false NOT NULL,
    "stripe_session_id" "text",
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "professional_id" "uuid",
    "google_event_id" "text",
    "payment_method" "text" DEFAULT 'stripe'::"text",
    "booking_source" "text",
    "referral_discount_eur" numeric(10,2) DEFAULT 0 NOT NULL,
    "referral_id" "uuid",
    "is_guarantee" boolean DEFAULT false NOT NULL,
    "guarantee_original_booking_id" "uuid",
    "guarantee_original_professional_id" "uuid",
    "guarantee_reason" "text",
    "subscription_id" "uuid",
    "professional_name_snapshot" "text"
);


ALTER TABLE "public"."bookings" OWNER TO "postgres";


COMMENT ON COLUMN "public"."bookings"."booking_source" IS 'Origen de la reserva: web, bot, admin, walk_in, import. NULL = legacy';



CREATE TABLE IF NOT EXISTS "public"."campaign_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "campaign_id" "uuid",
    "recipient_id" "uuid",
    "recipient_type" "text",
    "status" "text",
    "error_message" "text",
    "sent_at" timestamp with time zone DEFAULT "now"(),
    "opened_at" timestamp with time zone,
    "clicked_at" timestamp with time zone
);


ALTER TABLE "public"."campaign_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."center_settings" (
    "id" "text" DEFAULT 'main'::"text" NOT NULL,
    "center_name" "text" DEFAULT 'NAILOX Centro'::"text" NOT NULL,
    "address" "text" DEFAULT 'Calle Ejemplo 123, Madrid, España'::"text" NOT NULL,
    "city" "text" DEFAULT 'Madrid'::"text" NOT NULL,
    "postal_code" "text" DEFAULT '28001'::"text" NOT NULL,
    "phone" "text",
    "email" "text",
    "schedule" "text",
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "academy_name" "text" DEFAULT 'Academia NailPro'::"text",
    "instructor_name" "text" DEFAULT 'María González'::"text",
    "instructor_title" "text" DEFAULT 'Instructora Principal'::"text",
    "course_title" "text" DEFAULT 'Manicura y Nail Art Profesional'::"text",
    "email_brand_name" "text" DEFAULT 'NAILOX'::"text",
    "site_url" "text" DEFAULT 'https://nailox.com'::"text",
    "contact_email" "text" DEFAULT 'hola@nailox.com'::"text",
    "sender_email" "text" DEFAULT 'noreply@nailox.com'::"text",
    "email_footer_text" "text" DEFAULT 'Curso Profesional de Manicura y Pedicura'::"text",
    "email_header_color" "text" DEFAULT '#f43f5e'::"text",
    "email_header_color2" "text" DEFAULT '#fb7185'::"text",
    "email_logo_text" "text" DEFAULT 'NAILOX'::"text",
    "email_accent_color" "text" DEFAULT '#f43f5e'::"text",
    "email_bg_color" "text" DEFAULT '#fdf2f4'::"text",
    "email_card_bg" "text" DEFAULT '#fff1f2'::"text",
    "notification_email" "text",
    "total_hours_override" "text",
    "hero_countdown_hours" integer DEFAULT 72,
    "hero_countdown_label" "text" DEFAULT 'Oferta termina en'::"text",
    "hero_countdown_enabled" boolean DEFAULT true,
    "bizum_whatsapp" "text",
    "stripe_disabled" boolean DEFAULT false,
    "presale_mode" boolean DEFAULT false,
    "presale_badge_text" "text" DEFAULT '¡Preventa especial!'::"text",
    "presale_hero_title" "text" DEFAULT 'Únete a la Preventa'::"text",
    "presale_hero_subtitle" "text" DEFAULT 'Sé de las primeras en acceder al curso completo con precio especial de lanzamiento.'::"text",
    "presale_cta_text" "text" DEFAULT 'Reservar mi plaza'::"text",
    "presale_buy_btn_text" "text" DEFAULT 'Unirme a la preventa'::"text",
    "stripe_disabled_message" "text" DEFAULT 'Los pagos online están temporalmente desactivados. Contacta con nosotros para completar tu compra.'::"text"
);


ALTER TABLE "public"."center_settings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."certificates" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "student_name" "text" NOT NULL,
    "course_title" "text" NOT NULL,
    "academy_name" "text" NOT NULL,
    "completed_lessons" integer DEFAULT 0 NOT NULL,
    "total_modules" integer DEFAULT 0 NOT NULL,
    "total_hours" "text" DEFAULT ''::"text" NOT NULL,
    "issued_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."certificates" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."client_accounts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "phone" "text",
    "name" "text",
    "email" "text",
    "points" integer DEFAULT 0,
    "referral_code" "text",
    "auth_user_id" "uuid",
    "phone_login_enabled" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "birthday" "date",
    "push_points_awarded" boolean DEFAULT false,
    "email_reward_awarded" boolean DEFAULT false,
    "birthday_reward_awarded" boolean DEFAULT false,
    "google_review_reward_awarded" boolean DEFAULT false,
    "import_source" "text"
);


ALTER TABLE "public"."client_accounts" OWNER TO "postgres";


COMMENT ON COLUMN "public"."client_accounts"."import_source" IS 'Identificador para clientes creados via import (ej. whatsapp_import_2026_05_20). NULL = creado normalmente';



CREATE TABLE IF NOT EXISTS "public"."client_points_transactions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "client_account_id" "uuid" NOT NULL,
    "points" integer NOT NULL,
    "type" "text" DEFAULT 'earned'::"text" NOT NULL,
    "description" "text" NOT NULL,
    "reference_id" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."client_points_transactions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."client_referrals" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "referrer_account_id" "uuid" NOT NULL,
    "referred_phone" "text",
    "event_type" "text" DEFAULT 'booking'::"text" NOT NULL,
    "points_awarded" integer DEFAULT 0,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "completed_at" timestamp with time zone
);


ALTER TABLE "public"."client_referrals" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."client_subscriptions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "client_account_id" "uuid",
    "plan_id" "uuid",
    "status" "text" DEFAULT 'active'::"text" NOT NULL,
    "start_date" timestamp with time zone DEFAULT "now"() NOT NULL,
    "end_date" timestamp with time zone NOT NULL,
    "sessions_total" integer NOT NULL,
    "sessions_used" integer DEFAULT 0 NOT NULL,
    "paused_days" integer DEFAULT 0 NOT NULL,
    "stripe_session_id" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "check_status" CHECK (("status" = ANY (ARRAY['active'::"text", 'paused'::"text", 'cancelled'::"text", 'expired'::"text"])))
);


ALTER TABLE "public"."client_subscriptions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."coupon_uses" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "coupon_id" "uuid" NOT NULL,
    "user_id" "uuid",
    "used_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."coupon_uses" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."coupons" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "code" "text" NOT NULL,
    "type" "text" NOT NULL,
    "value" numeric NOT NULL,
    "min_purchase" numeric DEFAULT 0,
    "max_uses" integer,
    "uses_count" integer DEFAULT 0,
    "active" boolean DEFAULT true,
    "expires_at" timestamp with time zone,
    "description" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "applies_to" "text" DEFAULT 'all'::"text",
    "target_ids" "text"[] DEFAULT '{}'::"text"[],
    CONSTRAINT "coupons_type_check" CHECK (("type" = ANY (ARRAY['percentage'::"text", 'fixed'::"text", 'points'::"text"])))
);


ALTER TABLE "public"."coupons" OWNER TO "postgres";


COMMENT ON COLUMN "public"."coupons"."applies_to" IS 'Define si el cupón aplica a all, services, products o category';



COMMENT ON COLUMN "public"."coupons"."target_ids" IS 'Lista de IDs de servicios o productos específicos';



CREATE TABLE IF NOT EXISTS "public"."expense_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "expense_id" "uuid" NOT NULL,
    "inventory_id" "uuid",
    "item_name" "text" NOT NULL,
    "quantity" numeric(10,2) DEFAULT 1 NOT NULL,
    "unit_price" numeric(10,2) DEFAULT 0 NOT NULL,
    "subtotal" numeric(10,2) GENERATED ALWAYS AS (("quantity" * "unit_price")) STORED,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."expense_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."expenses" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "expense_date" "date" DEFAULT CURRENT_DATE NOT NULL,
    "category" "text" NOT NULL,
    "subcategory" "text",
    "description" "text" NOT NULL,
    "amount" numeric DEFAULT 0 NOT NULL,
    "payment_method" "text" DEFAULT 'efectivo'::"text",
    "vendor" "text",
    "inventory_id" "uuid",
    "related_user_id" "uuid",
    "related_booking_id" "uuid",
    "receipt_url" "text",
    "notes" "text",
    "is_recurring" boolean DEFAULT false NOT NULL,
    "recurring_period" "text",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."expenses" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."forum_questions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "student_id" "uuid",
    "student_name" "text",
    "student_email" "text" NOT NULL,
    "category" "text" NOT NULL,
    "title" "text" NOT NULL,
    "message" "text" NOT NULL,
    "admin_reply" "text",
    "replied_at" timestamp with time zone,
    "resolved" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."forum_questions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."gift_cards" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "code" character varying(16) NOT NULL,
    "amount" numeric(8,2) NOT NULL,
    "remaining_amount" numeric(8,2) NOT NULL,
    "buyer_name" "text" NOT NULL,
    "buyer_email" "text" NOT NULL,
    "recipient_name" "text",
    "recipient_email" "text",
    "message" "text",
    "occasion" "text",
    "gift_type" character varying(10) DEFAULT 'single'::character varying,
    "group_target" numeric(8,2),
    "group_collected" numeric(8,2) DEFAULT 0,
    "delivery_method" character varying(20) DEFAULT 'email'::character varying,
    "delivery_date" "date",
    "recipient_phone" "text",
    "postal_address" "text",
    "postal_city" "text",
    "postal_zip" character varying(10),
    "stripe_session_id" "text",
    "status" character varying(20) DEFAULT 'active'::character varying,
    "purchased_at" timestamp with time zone DEFAULT "now"(),
    "expires_at" timestamp with time zone DEFAULT ("now"() + '1 year'::interval),
    "redeemed_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "purchased_by" "uuid",
    "purchased_at_time" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "gift_cards_delivery_method_check" CHECK ((("delivery_method")::"text" = ANY ((ARRAY['email'::character varying, 'sms'::character varying, 'whatsapp'::character varying, 'postal'::character varying])::"text"[]))),
    CONSTRAINT "gift_cards_gift_type_check" CHECK ((("gift_type")::"text" = ANY ((ARRAY['single'::character varying, 'bulk'::character varying, 'group'::character varying])::"text"[]))),
    CONSTRAINT "gift_cards_status_check" CHECK ((("status")::"text" = ANY ((ARRAY['pending'::character varying, 'active'::character varying, 'used'::character varying, 'expired'::character varying])::"text"[])))
);


ALTER TABLE "public"."gift_cards" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."google_calendar_tokens" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "profile_id" "uuid" NOT NULL,
    "access_token" "text",
    "refresh_token" "text" NOT NULL,
    "token_expiry" timestamp with time zone,
    "calendar_id" "text" DEFAULT 'primary'::"text",
    "connected_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."google_calendar_tokens" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "email" "text",
    "name" "text",
    "avatar_url" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "last_sign_in_at" timestamp with time zone DEFAULT "now"(),
    "role" "text" DEFAULT 'student'::"text" NOT NULL,
    "points" integer DEFAULT 0,
    "course_completed" boolean DEFAULT false,
    "is_professional" boolean DEFAULT false,
    "referral_code" "text",
    "course_access" boolean DEFAULT false,
    "signup_source" "text" DEFAULT 'manual'::"text",
    "phone" "text",
    "birthday" "date",
    "push_points_awarded" boolean DEFAULT false,
    "email_reward_awarded" boolean DEFAULT false,
    "birthday_reward_awarded" boolean DEFAULT false,
    "google_review_reward_awarded" boolean DEFAULT false,
    CONSTRAINT "profiles_signup_source_check" CHECK (("signup_source" = ANY (ARRAY['manual'::"text", 'booking'::"text", 'google'::"text", 'purchase'::"text"])))
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."guarantees_analytics" AS
 WITH "original_stats" AS (
         SELECT "bookings"."professional_id",
            "count"("bookings"."id") FILTER (WHERE (("bookings"."status" = ANY (ARRAY['completed'::"text", 'confirmed'::"text"])) AND ("bookings"."is_guarantee" = false))) AS "total_bookings_done"
           FROM "public"."bookings"
          GROUP BY "bookings"."professional_id"
        ), "caused_stats" AS (
         SELECT "bookings"."guarantee_original_professional_id",
            "count"("bookings"."id") AS "total_guarantees_caused"
           FROM "public"."bookings"
          WHERE ("bookings"."is_guarantee" = true)
          GROUP BY "bookings"."guarantee_original_professional_id"
        )
 SELECT "p"."id" AS "professional_id",
    "p"."name" AS "professional_name",
    COALESCE("o"."total_bookings_done", (0)::bigint) AS "total_bookings_done",
    COALESCE("c"."total_guarantees_caused", (0)::bigint) AS "total_guarantees_caused",
        CASE
            WHEN (COALESCE("o"."total_bookings_done", (0)::bigint) = 0) THEN 0.0
            ELSE "round"((((COALESCE("c"."total_guarantees_caused", (0)::bigint))::numeric / ("o"."total_bookings_done")::numeric) * 100.0), 2)
        END AS "guarantee_rate"
   FROM (("public"."profiles" "p"
     LEFT JOIN "original_stats" "o" ON (("o"."professional_id" = "p"."id")))
     LEFT JOIN "caused_stats" "c" ON (("c"."guarantee_original_professional_id" = "p"."id")))
  WHERE (("p"."role" = 'admin'::"text") OR ("p"."is_professional" = true));


ALTER VIEW "public"."guarantees_analytics" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."incomes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "income_date" "date" DEFAULT CURRENT_DATE NOT NULL,
    "category" "text" NOT NULL,
    "subcategory" "text",
    "description" "text" NOT NULL,
    "amount" numeric DEFAULT 0 NOT NULL,
    "payment_method" "text" DEFAULT 'efectivo'::"text",
    "client_name" "text",
    "client_phone" "text",
    "client_email" "text",
    "related_booking_id" "uuid",
    "related_user_id" "uuid",
    "notes" "text",
    "is_recurring" boolean DEFAULT false NOT NULL,
    "recurring_period" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."incomes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."inventory" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "type" "text" NOT NULL,
    "quantity" numeric DEFAULT 0 NOT NULL,
    "unit" "text" DEFAULT 'unidades'::"text" NOT NULL,
    "min_stock" numeric DEFAULT 0 NOT NULL,
    "last_restock_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "category" "text" DEFAULT 'general'::"text" NOT NULL,
    "brand" "text",
    "sku" "text",
    "cost_price" numeric DEFAULT 0 NOT NULL,
    "sell_price" numeric,
    "image_url" "text",
    "active" boolean DEFAULT true NOT NULL,
    "notes" "text",
    "expiry_date" "date",
    "location" "text",
    "usage_capacity" numeric,
    "usage_unit" "text" DEFAULT 'usos'::"text",
    "pack_size" numeric,
    "pack_unit" "text",
    CONSTRAINT "inventory_type_check" CHECK (("type" = ANY (ARRAY['insumo'::"text", 'herramienta'::"text", 'equipo'::"text", 'decoracion'::"text"])))
);


ALTER TABLE "public"."inventory" OWNER TO "postgres";


COMMENT ON COLUMN "public"."inventory"."usage_capacity" IS 'How many times this item can be used (e.g., 30 manicures from one polish bottle)';



COMMENT ON COLUMN "public"."inventory"."usage_unit" IS 'Unit for usage_capacity: usos, servicios, ml, gr, dias, meses';



COMMENT ON COLUMN "public"."inventory"."pack_size" IS 'Number of individual units per package';



COMMENT ON COLUMN "public"."inventory"."pack_unit" IS 'Package name: caja, blister, rollo, pack...';



CREATE TABLE IF NOT EXISTS "public"."lesson_tags" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "color" "text" DEFAULT 'rose'::"text" NOT NULL,
    "icon" "text" DEFAULT 'ri-price-tag-3-line'::"text" NOT NULL,
    "description" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."lesson_tags" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."lessons" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "module_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "type" "text" NOT NULL,
    "duration" "text",
    "video_url" "text",
    "content" "text",
    "description" "text",
    "order_index" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "is_free" boolean DEFAULT false,
    "tag_id" "uuid",
    "questions" "jsonb",
    "file_url" "text",
    CONSTRAINT "lessons_type_check" CHECK (("type" = ANY (ARRAY['video'::"text", 'lectura'::"text", 'practica'::"text", 'evaluacion'::"text", 'material'::"text"])))
);


ALTER TABLE "public"."lessons" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."marketing_campaigns" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "type" "text" NOT NULL,
    "content" "text" NOT NULL,
    "subject" "text",
    "status" "text" DEFAULT 'draft'::"text",
    "target_segment" "text" DEFAULT 'all'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "scheduled_at" timestamp with time zone,
    "sent_count" integer DEFAULT 0,
    "total_targets" integer DEFAULT 0,
    "use_24h_filter" boolean DEFAULT false,
    "meta_template_name" "text",
    "specific_recipient_ids" "text"[] DEFAULT '{}'::"text"[],
    "image_url" "text",
    "opened_count" integer DEFAULT 0,
    "clicked_count" integer DEFAULT 0,
    "template_language" "text" DEFAULT 'es'::"text",
    "template_variables" "jsonb" DEFAULT '[]'::"jsonb",
    "recency_mode" "text" DEFAULT 'none'::"text",
    "recency_days" integer DEFAULT 0
);


ALTER TABLE "public"."marketing_campaigns" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."modules" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "duration" "text",
    "order_index" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "level" "text" DEFAULT 'Principiante'::"text",
    "color" "text" DEFAULT 'rose'::"text",
    "icon" "text" DEFAULT 'ri-book-line'::"text",
    "tag_id" "uuid",
    "price" numeric(10,2) DEFAULT NULL::numeric,
    "stripe_product_id" "text",
    "stripe_price_id" "text"
);


ALTER TABLE "public"."modules" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."notification_campaigns" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "template_id" "uuid",
    "title" "text" NOT NULL,
    "body" "text" NOT NULL,
    "url" "text" DEFAULT 'https://www.nailox.com'::"text",
    "target_segment" "text" DEFAULT 'all'::"text",
    "scheduled_at" timestamp with time zone,
    "status" "text" DEFAULT 'draft'::"text",
    "sent_count" integer DEFAULT 0,
    "total_targets" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."notification_campaigns" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."notification_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "campaign_id" "uuid",
    "template_type" "text",
    "client_account_id" "uuid",
    "profile_id" "uuid",
    "title" "text" NOT NULL,
    "body" "text" NOT NULL,
    "status" "text" DEFAULT 'sent'::"text",
    "error_message" "text",
    "sent_at" timestamp with time zone DEFAULT "now"(),
    "booking_id" "uuid",
    "event_type" "text",
    "channel" "text",
    "notification_type" "text",
    "recipient_name" "text",
    "recipient_email" "text"
);


ALTER TABLE "public"."notification_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."notification_settings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "key" "text" NOT NULL,
    "value" "jsonb" NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."notification_settings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."notification_templates" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "type" "text" NOT NULL,
    "name" "text" NOT NULL,
    "title" "text" NOT NULL,
    "body" "text" NOT NULL,
    "icon" "text",
    "url" "text" DEFAULT 'https://www.nailox.com/reservar'::"text",
    "is_active" boolean DEFAULT true,
    "trigger_hours" numeric,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "email_body" "text",
    "target_audience" "text" DEFAULT 'client'::"text",
    "channels" "text"[] DEFAULT '{push}'::"text"[]
);


ALTER TABLE "public"."notification_templates" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."points_transactions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "points" integer NOT NULL,
    "type" "text" NOT NULL,
    "description" "text" NOT NULL,
    "reference_id" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "points_transactions_type_check" CHECK (("type" = ANY (ARRAY['earned'::"text", 'redeemed'::"text", 'bonus'::"text", 'referral'::"text"])))
);


ALTER TABLE "public"."points_transactions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."professional_blocked_times" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "profile_id" "uuid" NOT NULL,
    "blocked_date" "date" NOT NULL,
    "start_time" "text" NOT NULL,
    "end_time" "text" NOT NULL,
    "reason" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."professional_blocked_times" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."professional_profiles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "bio" "text",
    "specialties" "text"[],
    "instagram" "text",
    "portfolio_images" "text"[],
    "rating" numeric DEFAULT 0,
    "review_count" integer DEFAULT 0,
    "active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "address" "text"
);


ALTER TABLE "public"."professional_profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."professional_reviews" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "professional_id" "uuid" NOT NULL,
    "reviewer_id" "uuid",
    "reviewer_name" "text" NOT NULL,
    "rating" integer NOT NULL,
    "comment" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "pro_reply" "text",
    "pro_reply_at" timestamp with time zone,
    "reviewer_phone" "text",
    "reviewer_email" "text",
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "professional_reviews_rating_check" CHECK ((("rating" >= 1) AND ("rating" <= 5)))
);


ALTER TABLE "public"."professional_reviews" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."professional_schedules" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "profile_id" "uuid" NOT NULL,
    "day_of_week" integer NOT NULL,
    "is_working" boolean DEFAULT false NOT NULL,
    "start_time" time without time zone,
    "end_time" time without time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "break_start" time without time zone,
    "break_end" time without time zone,
    CONSTRAINT "professional_schedules_day_of_week_check" CHECK ((("day_of_week" >= 0) AND ("day_of_week" <= 6)))
);


ALTER TABLE "public"."professional_schedules" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."professional_services" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "profile_id" "uuid" NOT NULL,
    "service_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."professional_services" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."professional_settings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "profile_id" "uuid" NOT NULL,
    "display_name" "text",
    "bio" "text",
    "photo_url" "text",
    "slot_duration_minutes" integer DEFAULT 30 NOT NULL,
    "buffer_minutes" integer DEFAULT 10 NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "google_calendar_connected" boolean DEFAULT false
);


ALTER TABLE "public"."professional_settings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."purchases" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "email" "text" NOT NULL,
    "product_id" "text" NOT NULL,
    "session_id" "text" NOT NULL,
    "amount_total" integer,
    "currency" "text" DEFAULT 'eur'::"text",
    "status" "text" DEFAULT 'completed'::"text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."purchases" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."push_subscriptions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "client_account_id" "uuid",
    "profile_id" "uuid",
    "endpoint" "text" NOT NULL,
    "p256dh" "text" NOT NULL,
    "auth" "text" NOT NULL,
    "user_agent" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."push_subscriptions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."referrals" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "referrer_id" "uuid" NOT NULL,
    "referred_user_id" "uuid",
    "referred_email" "text",
    "referral_code" "text" NOT NULL,
    "event_type" "text" DEFAULT 'booking'::"text" NOT NULL,
    "reference_id" "text",
    "points_awarded" integer DEFAULT 0 NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "completed_at" timestamp with time zone
);


ALTER TABLE "public"."referrals" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."service_inventory_usage" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "service_id" "uuid" NOT NULL,
    "inventory_id" "uuid" NOT NULL,
    "quantity_per_service" numeric DEFAULT 1 NOT NULL,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."service_inventory_usage" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."services" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "duration_minutes" integer DEFAULT 30 NOT NULL,
    "price" numeric(10,2) DEFAULT 0 NOT NULL,
    "service_type" "text" DEFAULT 'General'::"text" NOT NULL,
    "active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "reward_points" integer DEFAULT 0,
    "order_index" integer DEFAULT 0,
    "booking_count" integer DEFAULT 0 NOT NULL,
    "guarantee_window_days" integer DEFAULT 0 NOT NULL,
    "guarantee_duration_minutes" integer DEFAULT 0 NOT NULL
);


ALTER TABLE "public"."services" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."shop_orders" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "client_name" "text" NOT NULL,
    "client_email" "text" NOT NULL,
    "client_phone" "text",
    "delivery_type" "text" DEFAULT 'pickup'::"text" NOT NULL,
    "delivery_address" "text",
    "items" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "total_price" numeric DEFAULT 0 NOT NULL,
    "points_earned" integer DEFAULT 0 NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "payment_method" "text" DEFAULT 'stripe'::"text"
);


ALTER TABLE "public"."shop_orders" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."shop_products" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "price" numeric DEFAULT 0 NOT NULL,
    "stock" integer DEFAULT 0 NOT NULL,
    "image_url" "text",
    "category" "text" DEFAULT 'General'::"text" NOT NULL,
    "reward_points" integer DEFAULT 0 NOT NULL,
    "active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."shop_products" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."student_progress" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "student_id" "text" NOT NULL,
    "lesson_id" "uuid" NOT NULL,
    "module_id" "uuid" NOT NULL,
    "completed" boolean DEFAULT false,
    "completed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."student_progress" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."students" AS
 SELECT "id",
    "email",
    "name",
    "phone",
    "created_at",
    "points"
   FROM "public"."profiles"
  WHERE ("role" = 'student'::"text");


ALTER VIEW "public"."students" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."subscription_plans" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "service_id" "uuid",
    "total_price" numeric(10,2) NOT NULL,
    "duration_months" integer NOT NULL,
    "total_sessions" integer NOT NULL,
    "stripe_price_id" "text",
    "active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."subscription_plans" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."unified_points_transactions" AS
 SELECT "points_transactions"."id",
    "points_transactions"."user_id" AS "profile_id",
    "points_transactions"."points",
    "points_transactions"."type",
    "points_transactions"."description",
    "points_transactions"."reference_id",
    "points_transactions"."created_at"
   FROM "public"."points_transactions"
UNION ALL
 SELECT "cpt"."id",
    ( SELECT "p"."id"
           FROM "public"."profiles" "p"
          WHERE ("p"."phone" = "ca"."phone")
         LIMIT 1) AS "profile_id",
    "cpt"."points",
    "cpt"."type",
    "cpt"."description",
    "cpt"."reference_id",
    "cpt"."created_at"
   FROM ("public"."client_accounts" "ca"
     JOIN "public"."client_points_transactions" "cpt" ON (("ca"."id" = "cpt"."client_account_id")));


ALTER VIEW "public"."unified_points_transactions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."whatsapp_bot_config" (
    "id" "text" DEFAULT 'main'::"text" NOT NULL,
    "enabled" boolean DEFAULT true,
    "greeting" "text" DEFAULT 'Hola! Soy el asistente de NAILOX 💅'::"text",
    "system_prompt" "text",
    "respect_business_hours" boolean DEFAULT false,
    "max_failed_turns" integer DEFAULT 3,
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "services_list_template" "text",
    "follow_up_no_decision" "text",
    "service_confirmed_template" "text",
    "date_follow_up_template" "text",
    "no_availability_template" "text",
    "booking_error_template" "text",
    "human_escalation_template" "text",
    "session_timeout_hours" integer DEFAULT 24,
    "bot_name" "text" DEFAULT 'Asistente de NAILOX'::"text",
    "summary_upsell_template" "text",
    "closing_template" "text"
);


ALTER TABLE "public"."whatsapp_bot_config" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."whatsapp_conversations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "phone" "text" NOT NULL,
    "client_name" "text",
    "client_email" "text",
    "client_account_id" "uuid",
    "state" "jsonb" DEFAULT '{}'::"jsonb",
    "needs_human" boolean DEFAULT false,
    "human_note" "text",
    "last_message_at" timestamp with time zone DEFAULT "now"(),
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "last_reset_at" timestamp with time zone DEFAULT "now"(),
    "admin_last_read_at" timestamp with time zone,
    "last_followup_at" timestamp with time zone,
    "archived_at" timestamp with time zone
);


ALTER TABLE "public"."whatsapp_conversations" OWNER TO "postgres";


COMMENT ON COLUMN "public"."whatsapp_conversations"."admin_last_read_at" IS 'Última vez que un admin abrió esta conversación, usado para contar mensajes no leídos';



COMMENT ON COLUMN "public"."whatsapp_conversations"."archived_at" IS 'Conversación movida a Gestionadas por el admin. Se limpia automáticamente cuando llega un mensaje nuevo.';



CREATE TABLE IF NOT EXISTS "public"."whatsapp_messages" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "conversation_id" "uuid" NOT NULL,
    "direction" "text" NOT NULL,
    "role" "text" NOT NULL,
    "content" "text",
    "tool_calls" "jsonb",
    "whatsapp_message_id" "text",
    "status" "text" DEFAULT 'pending'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "input_tokens" integer DEFAULT 0,
    "output_tokens" integer DEFAULT 0,
    "status_detail" "text"
);


ALTER TABLE "public"."whatsapp_messages" OWNER TO "postgres";


ALTER TABLE ONLY "public"."automations"
    ADD CONSTRAINT "automations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."booking_services"
    ADD CONSTRAINT "booking_services_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."bookings"
    ADD CONSTRAINT "bookings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."campaign_logs"
    ADD CONSTRAINT "campaign_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."center_settings"
    ADD CONSTRAINT "center_settings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."certificates"
    ADD CONSTRAINT "certificates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."client_accounts"
    ADD CONSTRAINT "client_accounts_auth_user_id_key" UNIQUE ("auth_user_id");



ALTER TABLE ONLY "public"."client_accounts"
    ADD CONSTRAINT "client_accounts_phone_key" UNIQUE ("phone");



ALTER TABLE ONLY "public"."client_accounts"
    ADD CONSTRAINT "client_accounts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."client_accounts"
    ADD CONSTRAINT "client_accounts_referral_code_key" UNIQUE ("referral_code");



ALTER TABLE ONLY "public"."client_points_transactions"
    ADD CONSTRAINT "client_points_transactions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."client_referrals"
    ADD CONSTRAINT "client_referrals_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."client_subscriptions"
    ADD CONSTRAINT "client_subscriptions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."coupon_uses"
    ADD CONSTRAINT "coupon_uses_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."coupons"
    ADD CONSTRAINT "coupons_code_key" UNIQUE ("code");



ALTER TABLE ONLY "public"."coupons"
    ADD CONSTRAINT "coupons_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."expense_items"
    ADD CONSTRAINT "expense_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."expenses"
    ADD CONSTRAINT "expenses_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."forum_questions"
    ADD CONSTRAINT "forum_questions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."gift_cards"
    ADD CONSTRAINT "gift_cards_code_key" UNIQUE ("code");



ALTER TABLE ONLY "public"."gift_cards"
    ADD CONSTRAINT "gift_cards_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."google_calendar_tokens"
    ADD CONSTRAINT "google_calendar_tokens_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."google_calendar_tokens"
    ADD CONSTRAINT "google_calendar_tokens_profile_id_key" UNIQUE ("profile_id");



ALTER TABLE ONLY "public"."incomes"
    ADD CONSTRAINT "incomes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."inventory"
    ADD CONSTRAINT "inventory_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."lesson_tags"
    ADD CONSTRAINT "lesson_tags_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."lessons"
    ADD CONSTRAINT "lessons_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."marketing_campaigns"
    ADD CONSTRAINT "marketing_campaigns_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."modules"
    ADD CONSTRAINT "modules_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."notification_campaigns"
    ADD CONSTRAINT "notification_campaigns_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."notification_logs"
    ADD CONSTRAINT "notification_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."notification_settings"
    ADD CONSTRAINT "notification_settings_key_key" UNIQUE ("key");



ALTER TABLE ONLY "public"."notification_settings"
    ADD CONSTRAINT "notification_settings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."notification_templates"
    ADD CONSTRAINT "notification_templates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."notification_templates"
    ADD CONSTRAINT "notification_templates_type_unique" UNIQUE ("type");



ALTER TABLE ONLY "public"."points_transactions"
    ADD CONSTRAINT "points_transactions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."professional_blocked_times"
    ADD CONSTRAINT "professional_blocked_times_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."professional_profiles"
    ADD CONSTRAINT "professional_profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."professional_profiles"
    ADD CONSTRAINT "professional_profiles_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."professional_reviews"
    ADD CONSTRAINT "professional_reviews_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."professional_schedules"
    ADD CONSTRAINT "professional_schedules_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."professional_schedules"
    ADD CONSTRAINT "professional_schedules_profile_id_day_of_week_key" UNIQUE ("profile_id", "day_of_week");



ALTER TABLE ONLY "public"."professional_services"
    ADD CONSTRAINT "professional_services_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."professional_services"
    ADD CONSTRAINT "professional_services_profile_id_service_id_key" UNIQUE ("profile_id", "service_id");



ALTER TABLE ONLY "public"."professional_settings"
    ADD CONSTRAINT "professional_settings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."professional_settings"
    ADD CONSTRAINT "professional_settings_profile_id_key" UNIQUE ("profile_id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_referral_code_key" UNIQUE ("referral_code");



ALTER TABLE ONLY "public"."purchases"
    ADD CONSTRAINT "purchases_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."purchases"
    ADD CONSTRAINT "purchases_session_id_key" UNIQUE ("session_id");



ALTER TABLE ONLY "public"."push_subscriptions"
    ADD CONSTRAINT "push_subscriptions_endpoint_key" UNIQUE ("endpoint");



ALTER TABLE ONLY "public"."push_subscriptions"
    ADD CONSTRAINT "push_subscriptions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."referrals"
    ADD CONSTRAINT "referrals_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."service_inventory_usage"
    ADD CONSTRAINT "service_inventory_usage_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."service_inventory_usage"
    ADD CONSTRAINT "service_inventory_usage_service_id_inventory_id_key" UNIQUE ("service_id", "inventory_id");



ALTER TABLE ONLY "public"."services"
    ADD CONSTRAINT "services_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."shop_orders"
    ADD CONSTRAINT "shop_orders_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."shop_products"
    ADD CONSTRAINT "shop_products_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."student_progress"
    ADD CONSTRAINT "student_progress_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."student_progress"
    ADD CONSTRAINT "student_progress_student_id_lesson_id_key" UNIQUE ("student_id", "lesson_id");



ALTER TABLE ONLY "public"."student_progress"
    ADD CONSTRAINT "student_progress_student_lesson_unique" UNIQUE ("student_id", "lesson_id");



ALTER TABLE ONLY "public"."subscription_plans"
    ADD CONSTRAINT "subscription_plans_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."whatsapp_bot_config"
    ADD CONSTRAINT "whatsapp_bot_config_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."whatsapp_conversations"
    ADD CONSTRAINT "whatsapp_conversations_phone_key" UNIQUE ("phone");



ALTER TABLE ONLY "public"."whatsapp_conversations"
    ADD CONSTRAINT "whatsapp_conversations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."whatsapp_messages"
    ADD CONSTRAINT "whatsapp_messages_pkey" PRIMARY KEY ("id");



CREATE INDEX "bookings_client_phone_idx" ON "public"."bookings" USING "btree" ("client_phone");



CREATE INDEX "bookings_referral_id_idx" ON "public"."bookings" USING "btree" ("referral_id") WHERE ("referral_id" IS NOT NULL);



CREATE UNIQUE INDEX "client_accounts_email_unique_idx" ON "public"."client_accounts" USING "btree" ("lower"(TRIM(BOTH FROM "email"))) WHERE (("email" IS NOT NULL) AND (TRIM(BOTH FROM "email") <> ''::"text"));



CREATE INDEX "idx_blocked_times_profile_date" ON "public"."professional_blocked_times" USING "btree" ("profile_id", "blocked_date");



CREATE INDEX "idx_client_accounts_auth_user" ON "public"."client_accounts" USING "btree" ("auth_user_id");



CREATE INDEX "idx_client_accounts_phone" ON "public"."client_accounts" USING "btree" ("phone");



CREATE INDEX "idx_client_pts_tx_account" ON "public"."client_points_transactions" USING "btree" ("client_account_id");



CREATE INDEX "idx_client_referrals_referrer" ON "public"."client_referrals" USING "btree" ("referrer_account_id");



CREATE INDEX "idx_expense_items_expense_id" ON "public"."expense_items" USING "btree" ("expense_id");



CREATE INDEX "idx_expense_items_inventory_id" ON "public"."expense_items" USING "btree" ("inventory_id");



CREATE INDEX "idx_expenses_category" ON "public"."expenses" USING "btree" ("category");



CREATE INDEX "idx_expenses_date" ON "public"."expenses" USING "btree" ("expense_date" DESC);



CREATE INDEX "idx_expenses_inventory" ON "public"."expenses" USING "btree" ("inventory_id");



CREATE INDEX "idx_gift_cards_buyer_email" ON "public"."gift_cards" USING "btree" ("buyer_email");



CREATE INDEX "idx_gift_cards_code" ON "public"."gift_cards" USING "btree" ("code");



CREATE INDEX "idx_gift_cards_gift_type" ON "public"."gift_cards" USING "btree" ("gift_type");



CREATE INDEX "idx_gift_cards_purchased_by" ON "public"."gift_cards" USING "btree" ("purchased_by");



CREATE INDEX "idx_gift_cards_status" ON "public"."gift_cards" USING "btree" ("status");



CREATE INDEX "idx_inventory_active" ON "public"."inventory" USING "btree" ("active");



CREATE INDEX "idx_inventory_category" ON "public"."inventory" USING "btree" ("category");



CREATE INDEX "idx_inventory_type" ON "public"."inventory" USING "btree" ("type");



CREATE INDEX "idx_pro_reviews_phone" ON "public"."professional_reviews" USING "btree" ("reviewer_phone");



CREATE INDEX "idx_service_inv_usage_inventory" ON "public"."service_inventory_usage" USING "btree" ("inventory_id");



CREATE INDEX "idx_service_inv_usage_service" ON "public"."service_inventory_usage" USING "btree" ("service_id");



CREATE INDEX "idx_student_progress_lesson" ON "public"."student_progress" USING "btree" ("lesson_id");



CREATE INDEX "idx_student_progress_student" ON "public"."student_progress" USING "btree" ("student_id");



CREATE INDEX "idx_wa_convs_archived" ON "public"."whatsapp_conversations" USING "btree" ("archived_at") WHERE ("archived_at" IS NOT NULL);



CREATE UNIQUE INDEX "profiles_email_unique_idx" ON "public"."profiles" USING "btree" ("lower"(TRIM(BOTH FROM "email"))) WHERE (("email" IS NOT NULL) AND (TRIM(BOTH FROM "email") <> ''::"text"));



CREATE INDEX "profiles_phone_idx" ON "public"."profiles" USING "btree" ("phone");



CREATE INDEX "push_subscriptions_client_account_id_idx" ON "public"."push_subscriptions" USING "btree" ("client_account_id");



CREATE INDEX "push_subscriptions_profile_id_idx" ON "public"."push_subscriptions" USING "btree" ("profile_id");



CREATE OR REPLACE TRIGGER "on_new_booking_notify_client" AFTER INSERT ON "public"."bookings" FOR EACH ROW EXECUTE FUNCTION "public"."trigger_notify_new_booking_client"();



CREATE OR REPLACE TRIGGER "on_new_booking_notify_staff" AFTER INSERT ON "public"."bookings" FOR EACH ROW EXECUTE FUNCTION "public"."trigger_notify_new_booking"();



CREATE OR REPLACE TRIGGER "tr_award_booking_points" AFTER INSERT OR DELETE OR UPDATE ON "public"."bookings" FOR EACH ROW EXECUTE FUNCTION "public"."handle_booking_completed_points"();



CREATE OR REPLACE TRIGGER "tr_booking_services_count" AFTER INSERT OR DELETE OR UPDATE ON "public"."booking_services" FOR EACH ROW EXECUTE FUNCTION "public"."update_service_booking_count"();



CREATE OR REPLACE TRIGGER "tr_client_rewards_before" BEFORE UPDATE ON "public"."client_accounts" FOR EACH ROW EXECUTE FUNCTION "public"."trig_client_rewards_before"();



CREATE OR REPLACE TRIGGER "tr_normalize_bookings_phone" BEFORE INSERT OR UPDATE OF "client_phone" ON "public"."bookings" FOR EACH ROW EXECUTE FUNCTION "public"."trig_normalize_phone_on_upsert"();



CREATE OR REPLACE TRIGGER "tr_normalize_reviews_phone" BEFORE INSERT OR UPDATE OF "reviewer_phone" ON "public"."professional_reviews" FOR EACH ROW EXECUTE FUNCTION "public"."trig_normalize_phone_on_upsert"();



CREATE OR REPLACE TRIGGER "tr_normalize_shop_orders_phone" BEFORE INSERT OR UPDATE OF "client_phone" ON "public"."shop_orders" FOR EACH ROW EXECUTE FUNCTION "public"."trig_normalize_phone_on_upsert"();



CREATE OR REPLACE TRIGGER "tr_normalize_whatsapp_phone" BEFORE INSERT OR UPDATE OF "phone" ON "public"."whatsapp_conversations" FOR EACH ROW EXECUTE FUNCTION "public"."trig_normalize_phone_on_upsert"();



CREATE OR REPLACE TRIGGER "tr_profile_rewards_before" BEFORE UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."trig_profile_rewards_before"();



CREATE OR REPLACE TRIGGER "tr_update_pro_rating" AFTER INSERT ON "public"."professional_reviews" FOR EACH ROW EXECUTE FUNCTION "public"."update_professional_rating"();



CREATE OR REPLACE TRIGGER "tr_update_subscription_sessions_on_booking" AFTER INSERT OR DELETE OR UPDATE ON "public"."bookings" FOR EACH ROW EXECUTE FUNCTION "public"."update_subscription_sessions_on_booking"();



CREATE OR REPLACE TRIGGER "trg_check_whatsapp_stuck" AFTER INSERT ON "public"."whatsapp_messages" FOR EACH ROW EXECUTE FUNCTION "public"."check_whatsapp_conversation_stuck"();



CREATE OR REPLACE TRIGGER "trg_set_professional_name_snapshot" BEFORE INSERT OR UPDATE OF "professional_id" ON "public"."bookings" FOR EACH ROW EXECUTE FUNCTION "public"."set_professional_name_snapshot"();



CREATE OR REPLACE TRIGGER "trigger_sync_all_automations" AFTER INSERT OR UPDATE ON "public"."automations" FOR EACH ROW EXECUTE FUNCTION "public"."sync_all_automations_cron"();



CREATE OR REPLACE TRIGGER "trigger_sync_availability_cron" AFTER INSERT OR UPDATE ON "public"."notification_settings" FOR EACH ROW EXECUTE FUNCTION "public"."sync_availability_cron"();



CREATE OR REPLACE TRIGGER "update_expenses_updated_at" BEFORE UPDATE ON "public"."expenses" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_inventory_updated_at" BEFORE UPDATE ON "public"."inventory" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_lessons_updated_at" BEFORE UPDATE ON "public"."lessons" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_modules_updated_at" BEFORE UPDATE ON "public"."modules" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_service_inventory_usage_updated_at" BEFORE UPDATE ON "public"."service_inventory_usage" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



ALTER TABLE ONLY "public"."automations"
    ADD CONSTRAINT "automations_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "public"."notification_templates"("id");



ALTER TABLE ONLY "public"."booking_services"
    ADD CONSTRAINT "booking_services_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."booking_services"
    ADD CONSTRAINT "booking_services_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."bookings"
    ADD CONSTRAINT "bookings_guarantee_original_booking_id_fkey" FOREIGN KEY ("guarantee_original_booking_id") REFERENCES "public"."bookings"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."bookings"
    ADD CONSTRAINT "bookings_guarantee_original_professional_id_fkey" FOREIGN KEY ("guarantee_original_professional_id") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."bookings"
    ADD CONSTRAINT "bookings_professional_id_fkey" FOREIGN KEY ("professional_id") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."bookings"
    ADD CONSTRAINT "bookings_referral_id_fkey" FOREIGN KEY ("referral_id") REFERENCES "public"."referrals"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."bookings"
    ADD CONSTRAINT "bookings_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "public"."client_subscriptions"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."bookings"
    ADD CONSTRAINT "bookings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."campaign_logs"
    ADD CONSTRAINT "campaign_logs_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "public"."marketing_campaigns"("id");



ALTER TABLE ONLY "public"."certificates"
    ADD CONSTRAINT "certificates_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."client_points_transactions"
    ADD CONSTRAINT "client_points_transactions_client_account_id_fkey" FOREIGN KEY ("client_account_id") REFERENCES "public"."client_accounts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."client_referrals"
    ADD CONSTRAINT "client_referrals_referrer_account_id_fkey" FOREIGN KEY ("referrer_account_id") REFERENCES "public"."client_accounts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."client_subscriptions"
    ADD CONSTRAINT "client_subscriptions_client_account_id_fkey" FOREIGN KEY ("client_account_id") REFERENCES "public"."client_accounts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."client_subscriptions"
    ADD CONSTRAINT "client_subscriptions_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "public"."subscription_plans"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."coupon_uses"
    ADD CONSTRAINT "coupon_uses_coupon_id_fkey" FOREIGN KEY ("coupon_id") REFERENCES "public"."coupons"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."coupon_uses"
    ADD CONSTRAINT "coupon_uses_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."expense_items"
    ADD CONSTRAINT "expense_items_expense_id_fkey" FOREIGN KEY ("expense_id") REFERENCES "public"."expenses"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."expense_items"
    ADD CONSTRAINT "expense_items_inventory_id_fkey" FOREIGN KEY ("inventory_id") REFERENCES "public"."inventory"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."expenses"
    ADD CONSTRAINT "expenses_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."expenses"
    ADD CONSTRAINT "expenses_inventory_id_fkey" FOREIGN KEY ("inventory_id") REFERENCES "public"."inventory"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."expenses"
    ADD CONSTRAINT "expenses_related_booking_id_fkey" FOREIGN KEY ("related_booking_id") REFERENCES "public"."bookings"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."expenses"
    ADD CONSTRAINT "expenses_related_user_id_fkey" FOREIGN KEY ("related_user_id") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."forum_questions"
    ADD CONSTRAINT "forum_questions_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."gift_cards"
    ADD CONSTRAINT "gift_cards_purchased_by_fkey" FOREIGN KEY ("purchased_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."gift_cards"
    ADD CONSTRAINT "gift_cards_redeemed_by_fkey" FOREIGN KEY ("redeemed_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."google_calendar_tokens"
    ADD CONSTRAINT "google_calendar_tokens_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."incomes"
    ADD CONSTRAINT "incomes_related_booking_id_fkey" FOREIGN KEY ("related_booking_id") REFERENCES "public"."bookings"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."incomes"
    ADD CONSTRAINT "incomes_related_user_id_fkey" FOREIGN KEY ("related_user_id") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."lessons"
    ADD CONSTRAINT "lessons_module_id_fkey" FOREIGN KEY ("module_id") REFERENCES "public"."modules"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."lessons"
    ADD CONSTRAINT "lessons_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "public"."lesson_tags"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."modules"
    ADD CONSTRAINT "modules_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "public"."lesson_tags"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."notification_campaigns"
    ADD CONSTRAINT "notification_campaigns_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "public"."notification_templates"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."notification_logs"
    ADD CONSTRAINT "notification_logs_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id");



ALTER TABLE ONLY "public"."notification_logs"
    ADD CONSTRAINT "notification_logs_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "public"."notification_campaigns"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."notification_logs"
    ADD CONSTRAINT "notification_logs_client_account_id_fkey" FOREIGN KEY ("client_account_id") REFERENCES "public"."client_accounts"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."notification_logs"
    ADD CONSTRAINT "notification_logs_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."points_transactions"
    ADD CONSTRAINT "points_transactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."professional_blocked_times"
    ADD CONSTRAINT "professional_blocked_times_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."professional_profiles"
    ADD CONSTRAINT "professional_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."professional_reviews"
    ADD CONSTRAINT "professional_reviews_professional_id_fkey" FOREIGN KEY ("professional_id") REFERENCES "public"."professional_profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."professional_reviews"
    ADD CONSTRAINT "professional_reviews_reviewer_id_fkey" FOREIGN KEY ("reviewer_id") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."professional_schedules"
    ADD CONSTRAINT "professional_schedules_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."professional_services"
    ADD CONSTRAINT "professional_services_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."professional_settings"("profile_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."professional_services"
    ADD CONSTRAINT "professional_services_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."professional_settings"
    ADD CONSTRAINT "professional_settings_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."push_subscriptions"
    ADD CONSTRAINT "push_subscriptions_client_account_id_fkey" FOREIGN KEY ("client_account_id") REFERENCES "public"."client_accounts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."push_subscriptions"
    ADD CONSTRAINT "push_subscriptions_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."referrals"
    ADD CONSTRAINT "referrals_referred_user_id_fkey" FOREIGN KEY ("referred_user_id") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."referrals"
    ADD CONSTRAINT "referrals_referrer_id_fkey" FOREIGN KEY ("referrer_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."service_inventory_usage"
    ADD CONSTRAINT "service_inventory_usage_inventory_id_fkey" FOREIGN KEY ("inventory_id") REFERENCES "public"."inventory"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."service_inventory_usage"
    ADD CONSTRAINT "service_inventory_usage_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."shop_orders"
    ADD CONSTRAINT "shop_orders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."student_progress"
    ADD CONSTRAINT "student_progress_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "public"."lessons"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."student_progress"
    ADD CONSTRAINT "student_progress_module_id_fkey" FOREIGN KEY ("module_id") REFERENCES "public"."modules"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."subscription_plans"
    ADD CONSTRAINT "subscription_plans_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."whatsapp_messages"
    ADD CONSTRAINT "whatsapp_messages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "public"."whatsapp_conversations"("id") ON DELETE CASCADE;



CREATE POLICY "Admin can delete" ON "public"."forum_questions" FOR DELETE USING (true);



CREATE POLICY "Admin can update (reply)" ON "public"."forum_questions" FOR UPDATE USING (true);



CREATE POLICY "Admin manage tags" ON "public"."lesson_tags" USING (true) WITH CHECK (true);



CREATE POLICY "Admins can manage all professional schedules" ON "public"."professional_schedules" TO "authenticated" USING ((( SELECT "profiles"."role"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = "auth"."uid"())) = 'admin'::"text"));



CREATE POLICY "Admins can manage all professional settings" ON "public"."professional_settings" TO "authenticated" USING ((( SELECT "profiles"."role"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = "auth"."uid"())) = 'admin'::"text"));



CREATE POLICY "Admins can manage expense items" ON "public"."expense_items" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"text")))));



CREATE POLICY "Admins can manage inventory" ON "public"."inventory" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"text"))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"text")))));



CREATE POLICY "Admins insert professional profiles" ON "public"."professional_profiles" FOR INSERT WITH CHECK ((( SELECT "profiles"."role"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = "auth"."uid"())) = 'admin'::"text"));



CREATE POLICY "Admins manage all orders" ON "public"."shop_orders" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"text")))));



CREATE POLICY "Admins manage all professional profiles" ON "public"."professional_profiles" USING ((( SELECT "profiles"."role"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = "auth"."uid"())) = 'admin'::"text"));



CREATE POLICY "Admins manage coupon uses" ON "public"."coupon_uses" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"text"))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"text")))));



CREATE POLICY "Admins manage coupons" ON "public"."coupons" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"text")))));



CREATE POLICY "Admins manage expenses" ON "public"."expenses" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"text"))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"text")))));



CREATE POLICY "Admins manage incomes" ON "public"."incomes" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"text"))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"text")))));



CREATE POLICY "Admins manage own schedules" ON "public"."professional_schedules" USING (("profile_id" = "auth"."uid"()));



CREATE POLICY "Admins manage own settings" ON "public"."professional_settings" USING (("profile_id" = "auth"."uid"()));



CREATE POLICY "Admins manage own tokens" ON "public"."google_calendar_tokens" USING (("profile_id" = "auth"."uid"()));



CREATE POLICY "Admins manage products" ON "public"."shop_products" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"text")))));



CREATE POLICY "Admins manage referrals" ON "public"."referrals" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"text")))));



CREATE POLICY "Admins manage service_inventory_usage" ON "public"."service_inventory_usage" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"text"))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"text")))));



CREATE POLICY "Admins read all professional profiles" ON "public"."professional_profiles" FOR SELECT USING ((( SELECT "profiles"."role"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = "auth"."uid"())) = 'admin'::"text"));



CREATE POLICY "Admins update professional profiles" ON "public"."professional_profiles" FOR UPDATE USING ((( SELECT "profiles"."role"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = "auth"."uid"())) = 'admin'::"text"));



CREATE POLICY "Allow admin write access" ON "public"."professional_services" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"text")))));



CREATE POLICY "Allow all on notification_campaigns" ON "public"."notification_campaigns" USING (true) WITH CHECK (true);



CREATE POLICY "Allow all on notification_templates" ON "public"."notification_templates" USING (true) WITH CHECK (true);



CREATE POLICY "Allow authenticated select notification_logs" ON "public"."notification_logs" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Allow public read access" ON "public"."professional_services" FOR SELECT USING (true);



CREATE POLICY "Anyone can insert orders" ON "public"."shop_orders" FOR INSERT WITH CHECK (true);



CREATE POLICY "Anyone can insert reviews" ON "public"."professional_reviews" FOR INSERT TO "authenticated", "anon" WITH CHECK (true);



CREATE POLICY "Anyone can read forum questions" ON "public"."forum_questions" FOR SELECT USING (true);



CREATE POLICY "Anyone can read reviews" ON "public"."professional_reviews" FOR SELECT USING (true);



CREATE POLICY "Anyone can read their own gift cards" ON "public"."gift_cards" FOR SELECT USING ((("buyer_email" = "auth"."email"()) OR ("recipient_email" = "auth"."email"())));



CREATE POLICY "Anyone can view certificate by id" ON "public"."certificates" FOR SELECT USING (true);



CREATE POLICY "Anyone reads active coupons" ON "public"."coupons" FOR SELECT USING (("active" = true));



CREATE POLICY "Anyone reads active professionals" ON "public"."professional_profiles" FOR SELECT USING (("active" = true));



CREATE POLICY "Authenticated read service_inventory_usage" ON "public"."service_inventory_usage" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Authenticated users can insert" ON "public"."forum_questions" FOR INSERT WITH CHECK (("auth"."uid"() IS NOT NULL));



CREATE POLICY "Enable delete for all" ON "public"."push_subscriptions" FOR DELETE USING (true);



CREATE POLICY "Enable insert for all" ON "public"."push_subscriptions" FOR INSERT WITH CHECK (true);



CREATE POLICY "Enable select for all" ON "public"."push_subscriptions" FOR SELECT USING (true);



CREATE POLICY "Enable update for all" ON "public"."push_subscriptions" FOR UPDATE USING (true);



CREATE POLICY "Professionals manage own blocked times" ON "public"."professional_blocked_times" USING (("profile_id" = "auth"."uid"()));



CREATE POLICY "Public read active products" ON "public"."shop_products" FOR SELECT USING (("active" = true));



CREATE POLICY "Public read active professionals" ON "public"."professional_settings" FOR SELECT USING (("is_active" = true));



CREATE POLICY "Public read blocked times" ON "public"."professional_blocked_times" FOR SELECT USING (true);



CREATE POLICY "Public read progress for admin" ON "public"."student_progress" FOR SELECT USING (true);



CREATE POLICY "Public read schedules" ON "public"."professional_schedules" FOR SELECT USING (true);



CREATE POLICY "Public read tags" ON "public"."lesson_tags" FOR SELECT USING (true);



CREATE POLICY "Service role can do everything" ON "public"."gift_cards" USING (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Service role can do everything" ON "public"."professional_reviews" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "Users can manage own certificate" ON "public"."certificates" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can read own purchases" ON "public"."purchases" FOR SELECT TO "authenticated" USING (("email" = "auth"."email"()));



CREATE POLICY "Users insert own coupon uses or anonymous" ON "public"."coupon_uses" FOR INSERT WITH CHECK ((("user_id" IS NULL) OR ("auth"."uid"() = "user_id")));



CREATE POLICY "Users insert own points" ON "public"."points_transactions" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users insert own professional profile" ON "public"."professional_profiles" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users insert referrals" ON "public"."referrals" FOR INSERT WITH CHECK (true);



CREATE POLICY "Users manage own progress" ON "public"."student_progress" USING (("student_id" = ("auth"."uid"())::"text")) WITH CHECK (("student_id" = ("auth"."uid"())::"text"));



CREATE POLICY "Users see own coupon uses" ON "public"."coupon_uses" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users see own orders" ON "public"."shop_orders" FOR SELECT USING ((("user_id" = "auth"."uid"()) OR ("client_email" = ( SELECT "profiles"."email"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = "auth"."uid"())))));



CREATE POLICY "Users see own points" ON "public"."points_transactions" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users see own professional profile" ON "public"."professional_profiles" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users see own referrals" ON "public"."referrals" FOR SELECT USING (("referrer_id" = "auth"."uid"()));



CREATE POLICY "Users update own professional profile" ON "public"."professional_profiles" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "admin_all_subscriptions" ON "public"."client_subscriptions" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"text")))));



CREATE POLICY "admins_delete_any_profile" ON "public"."profiles" FOR DELETE USING ((( SELECT "profiles_1"."role"
   FROM "public"."profiles" "profiles_1"
  WHERE ("profiles_1"."id" = "auth"."uid"())) = 'admin'::"text"));



CREATE POLICY "admins_manage_bot_config" ON "public"."whatsapp_bot_config" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "admins_read_all_purchases" ON "public"."purchases" FOR SELECT TO "authenticated" USING ((( SELECT "profiles"."role"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = "auth"."uid"())) = 'admin'::"text"));



CREATE POLICY "admins_update_any_profile" ON "public"."profiles" FOR UPDATE TO "authenticated" USING ((( SELECT "profiles_1"."role"
   FROM "public"."profiles" "profiles_1"
  WHERE ("profiles_1"."id" = "auth"."uid"())) = 'admin'::"text")) WITH CHECK ((( SELECT "profiles_1"."role"
   FROM "public"."profiles" "profiles_1"
  WHERE ("profiles_1"."id" = "auth"."uid"())) = 'admin'::"text"));



ALTER TABLE "public"."automations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."booking_services" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "booking_services_admin" ON "public"."booking_services" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"text")))));



CREATE POLICY "booking_services_insert" ON "public"."booking_services" FOR INSERT WITH CHECK (true);



CREATE POLICY "booking_services_select_owner" ON "public"."booking_services" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."bookings"
  WHERE ("bookings"."id" = "booking_services"."booking_id"))));



ALTER TABLE "public"."bookings" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "bookings_admin_all" ON "public"."bookings" USING (((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"text")))) OR ("user_id" = "auth"."uid"())));



CREATE POLICY "bookings_insert_anon" ON "public"."bookings" FOR INSERT WITH CHECK (true);



CREATE POLICY "bookings_select_public" ON "public"."bookings" FOR SELECT USING (true);



CREATE POLICY "bookings_update_public" ON "public"."bookings" FOR UPDATE USING (true) WITH CHECK (true);



ALTER TABLE "public"."campaign_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."center_settings" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "center_settings_admin_write" ON "public"."center_settings" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"text")))));



CREATE POLICY "center_settings_public_read" ON "public"."center_settings" FOR SELECT USING (true);



ALTER TABLE "public"."certificates" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."client_accounts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."client_points_transactions" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "client_read_own_subscription" ON "public"."client_subscriptions" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."client_accounts"
  WHERE (("client_accounts"."id" = "client_subscriptions"."client_account_id") AND ("client_accounts"."auth_user_id" = "auth"."uid"())))));



ALTER TABLE "public"."client_referrals" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."client_subscriptions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."coupon_uses" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."coupons" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "delete_bookings" ON "public"."bookings" FOR DELETE USING (true);



CREATE POLICY "delete_client_accounts" ON "public"."client_accounts" FOR DELETE USING (true);



CREATE POLICY "delete_purchases" ON "public"."purchases" FOR DELETE USING (true);



ALTER TABLE "public"."expense_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."expenses" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."forum_questions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."gift_cards" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."google_calendar_tokens" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."incomes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."inventory" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."lesson_tags" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."lessons" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."marketing_campaigns" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."modules" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."notification_campaigns" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."notification_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."notification_settings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."notification_templates" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."points_transactions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."professional_blocked_times" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."professional_profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."professional_schedules" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."professional_services" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."professional_settings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "profiles_public_read" ON "public"."profiles" FOR SELECT USING (true);



CREATE POLICY "profiles_self_write" ON "public"."profiles" USING (("auth"."uid"() = "id")) WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "public_all_progress" ON "public"."student_progress" USING (true) WITH CHECK (true);



CREATE POLICY "public_insert_client_accounts" ON "public"."client_accounts" FOR INSERT WITH CHECK (true);



CREATE POLICY "public_insert_client_pts" ON "public"."client_points_transactions" FOR INSERT WITH CHECK (true);



CREATE POLICY "public_insert_client_refs" ON "public"."client_referrals" FOR INSERT WITH CHECK (true);



CREATE POLICY "public_read_lessons" ON "public"."lessons" FOR SELECT USING (true);



CREATE POLICY "public_read_modules" ON "public"."modules" FOR SELECT USING (true);



CREATE POLICY "public_select_client_accounts" ON "public"."client_accounts" FOR SELECT USING (true);



CREATE POLICY "public_select_client_pts" ON "public"."client_points_transactions" FOR SELECT USING (true);



CREATE POLICY "public_select_client_refs" ON "public"."client_referrals" FOR SELECT USING (true);



CREATE POLICY "public_update_client_accounts" ON "public"."client_accounts" FOR UPDATE USING (true);



CREATE POLICY "public_update_client_refs" ON "public"."client_referrals" FOR UPDATE USING (true);



CREATE POLICY "public_write_lessons" ON "public"."lessons" USING (true) WITH CHECK (true);



CREATE POLICY "public_write_modules" ON "public"."modules" USING (true) WITH CHECK (true);



ALTER TABLE "public"."purchases" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."push_subscriptions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."referrals" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "reviews_delete_own" ON "public"."professional_reviews" FOR DELETE TO "authenticated" USING ((("reviewer_id" = "auth"."uid"()) OR ("reviewer_email" = (( SELECT "users"."email"
   FROM "auth"."users"
  WHERE ("users"."id" = "auth"."uid"())))::"text") OR ("reviewer_phone" IN ( SELECT "client_accounts"."phone"
   FROM "public"."client_accounts"
  WHERE ("client_accounts"."auth_user_id" = "auth"."uid"())))));



CREATE POLICY "reviews_insert_anon" ON "public"."professional_reviews" FOR INSERT TO "anon" WITH CHECK (true);



CREATE POLICY "reviews_insert_authenticated" ON "public"."professional_reviews" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "reviews_select_all" ON "public"."professional_reviews" FOR SELECT USING (true);



CREATE POLICY "reviews_update_own" ON "public"."professional_reviews" FOR UPDATE TO "authenticated" USING ((("reviewer_id" = "auth"."uid"()) OR ("reviewer_email" = (( SELECT "users"."email"
   FROM "auth"."users"
  WHERE ("users"."id" = "auth"."uid"())))::"text") OR ("reviewer_phone" IN ( SELECT "client_accounts"."phone"
   FROM "public"."client_accounts"
  WHERE ("client_accounts"."auth_user_id" = "auth"."uid"())))));



ALTER TABLE "public"."service_inventory_usage" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."services" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "services_admin_write" ON "public"."services" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"text")))));



CREATE POLICY "services_admin_write_plans" ON "public"."subscription_plans" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"text")))));



CREATE POLICY "services_public_read" ON "public"."services" FOR SELECT USING (true);



CREATE POLICY "services_public_read_plans" ON "public"."subscription_plans" FOR SELECT USING (true);



ALTER TABLE "public"."shop_orders" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."shop_products" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."student_progress" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."subscription_plans" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "test_access_wa_conv" ON "public"."whatsapp_conversations" TO "authenticated" USING (true);



CREATE POLICY "test_access_wa_msg" ON "public"."whatsapp_messages" TO "authenticated" USING (true);



ALTER TABLE "public"."whatsapp_bot_config" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."whatsapp_conversations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."whatsapp_messages" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";









GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";














































































































































































GRANT ALL ON FUNCTION "public"."award_profile_points"("p_user_id" "uuid", "p_client_id" "uuid", "p_points" integer, "p_reason" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."award_profile_points"("p_user_id" "uuid", "p_client_id" "uuid", "p_points" integer, "p_reason" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."award_profile_points"("p_user_id" "uuid", "p_client_id" "uuid", "p_points" integer, "p_reason" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."call_notify_booking_client"("p_booking_id" "uuid", "p_type" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."call_notify_booking_client"("p_booking_id" "uuid", "p_type" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."call_notify_booking_client"("p_booking_id" "uuid", "p_type" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."call_notify_booking_staff"("p_booking_id" "uuid", "p_event" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."call_notify_booking_staff"("p_booking_id" "uuid", "p_event" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."call_notify_booking_staff"("p_booking_id" "uuid", "p_event" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."call_whatsapp_followup"() TO "anon";
GRANT ALL ON FUNCTION "public"."call_whatsapp_followup"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."call_whatsapp_followup"() TO "service_role";



GRANT ALL ON FUNCTION "public"."call_whatsapp_reminders"() TO "anon";
GRANT ALL ON FUNCTION "public"."call_whatsapp_reminders"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."call_whatsapp_reminders"() TO "service_role";



GRANT ALL ON FUNCTION "public"."check_whatsapp_conversation_stuck"() TO "anon";
GRANT ALL ON FUNCTION "public"."check_whatsapp_conversation_stuck"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_whatsapp_conversation_stuck"() TO "service_role";



GRANT ALL ON FUNCTION "public"."client_is_new_for_referral"("p_phone" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."client_is_new_for_referral"("p_phone" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."client_is_new_for_referral"("p_phone" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."find_client_account_by_phone"("p_phone" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."find_client_account_by_phone"("p_phone" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."find_client_account_by_phone"("p_phone" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_potentially_silenced_clients"("days_back" integer, "migration_date" timestamp with time zone) TO "anon";
GRANT ALL ON FUNCTION "public"."get_potentially_silenced_clients"("days_back" integer, "migration_date" timestamp with time zone) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_potentially_silenced_clients"("days_back" integer, "migration_date" timestamp with time zone) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_stalled_whatsapp_convs"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_stalled_whatsapp_convs"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_stalled_whatsapp_convs"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_wa_reminder_candidates"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_wa_reminder_candidates"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_wa_reminder_candidates"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_booking_completed_points"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_booking_completed_points"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_booking_completed_points"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."import_whatsapp_contacts"("p_contacts" "jsonb", "p_source" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."import_whatsapp_contacts"("p_contacts" "jsonb", "p_source" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."import_whatsapp_contacts"("p_contacts" "jsonb", "p_source" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."increment_campaign_stat"("campaign_row_id" "uuid", "stat_column" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."increment_campaign_stat"("campaign_row_id" "uuid", "stat_column" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."increment_campaign_stat"("campaign_row_id" "uuid", "stat_column" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."increment_profile_points"("p_user_id" "uuid", "p_points" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."increment_profile_points"("p_user_id" "uuid", "p_points" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."increment_profile_points"("p_user_id" "uuid", "p_points" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."is_email_taken"("p_email" "text", "p_phone" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."is_email_taken"("p_email" "text", "p_phone" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_email_taken"("p_email" "text", "p_phone" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."normalize_phone"("p_phone" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."normalize_phone"("p_phone" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."normalize_phone"("p_phone" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."rls_auto_enable"() TO "anon";
GRANT ALL ON FUNCTION "public"."rls_auto_enable"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."rls_auto_enable"() TO "service_role";



GRANT ALL ON FUNCTION "public"."send_booking_reminders_client"() TO "anon";
GRANT ALL ON FUNCTION "public"."send_booking_reminders_client"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."send_booking_reminders_client"() TO "service_role";



GRANT ALL ON FUNCTION "public"."send_booking_reminders_staff"() TO "anon";
GRANT ALL ON FUNCTION "public"."send_booking_reminders_staff"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."send_booking_reminders_staff"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_professional_name_snapshot"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_professional_name_snapshot"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_professional_name_snapshot"() TO "service_role";



GRANT ALL ON FUNCTION "public"."sync_all_automations_cron"() TO "anon";
GRANT ALL ON FUNCTION "public"."sync_all_automations_cron"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."sync_all_automations_cron"() TO "service_role";



GRANT ALL ON FUNCTION "public"."sync_availability_cron"() TO "anon";
GRANT ALL ON FUNCTION "public"."sync_availability_cron"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."sync_availability_cron"() TO "service_role";



GRANT ALL ON FUNCTION "public"."trig_client_rewards_before"() TO "anon";
GRANT ALL ON FUNCTION "public"."trig_client_rewards_before"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trig_client_rewards_before"() TO "service_role";



GRANT ALL ON FUNCTION "public"."trig_normalize_phone_on_upsert"() TO "anon";
GRANT ALL ON FUNCTION "public"."trig_normalize_phone_on_upsert"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trig_normalize_phone_on_upsert"() TO "service_role";



GRANT ALL ON FUNCTION "public"."trig_profile_rewards_before"() TO "anon";
GRANT ALL ON FUNCTION "public"."trig_profile_rewards_before"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trig_profile_rewards_before"() TO "service_role";



GRANT ALL ON FUNCTION "public"."trigger_notify_new_booking"() TO "anon";
GRANT ALL ON FUNCTION "public"."trigger_notify_new_booking"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trigger_notify_new_booking"() TO "service_role";



GRANT ALL ON FUNCTION "public"."trigger_notify_new_booking_client"() TO "anon";
GRANT ALL ON FUNCTION "public"."trigger_notify_new_booking_client"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trigger_notify_new_booking_client"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_professional_rating"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_professional_rating"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_professional_rating"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_service_booking_count"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_service_booking_count"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_service_booking_count"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_subscription_sessions_on_booking"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_subscription_sessions_on_booking"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_subscription_sessions_on_booking"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";
























GRANT ALL ON TABLE "public"."automations" TO "anon";
GRANT ALL ON TABLE "public"."automations" TO "authenticated";
GRANT ALL ON TABLE "public"."automations" TO "service_role";



GRANT ALL ON TABLE "public"."booking_services" TO "anon";
GRANT ALL ON TABLE "public"."booking_services" TO "authenticated";
GRANT ALL ON TABLE "public"."booking_services" TO "service_role";



GRANT ALL ON TABLE "public"."bookings" TO "anon";
GRANT ALL ON TABLE "public"."bookings" TO "authenticated";
GRANT ALL ON TABLE "public"."bookings" TO "service_role";



GRANT ALL ON TABLE "public"."campaign_logs" TO "anon";
GRANT ALL ON TABLE "public"."campaign_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."campaign_logs" TO "service_role";



GRANT ALL ON TABLE "public"."center_settings" TO "anon";
GRANT ALL ON TABLE "public"."center_settings" TO "authenticated";
GRANT ALL ON TABLE "public"."center_settings" TO "service_role";



GRANT ALL ON TABLE "public"."certificates" TO "anon";
GRANT ALL ON TABLE "public"."certificates" TO "authenticated";
GRANT ALL ON TABLE "public"."certificates" TO "service_role";



GRANT ALL ON TABLE "public"."client_accounts" TO "anon";
GRANT ALL ON TABLE "public"."client_accounts" TO "authenticated";
GRANT ALL ON TABLE "public"."client_accounts" TO "service_role";



GRANT ALL ON TABLE "public"."client_points_transactions" TO "anon";
GRANT ALL ON TABLE "public"."client_points_transactions" TO "authenticated";
GRANT ALL ON TABLE "public"."client_points_transactions" TO "service_role";



GRANT ALL ON TABLE "public"."client_referrals" TO "anon";
GRANT ALL ON TABLE "public"."client_referrals" TO "authenticated";
GRANT ALL ON TABLE "public"."client_referrals" TO "service_role";



GRANT ALL ON TABLE "public"."client_subscriptions" TO "anon";
GRANT ALL ON TABLE "public"."client_subscriptions" TO "authenticated";
GRANT ALL ON TABLE "public"."client_subscriptions" TO "service_role";



GRANT ALL ON TABLE "public"."coupon_uses" TO "anon";
GRANT ALL ON TABLE "public"."coupon_uses" TO "authenticated";
GRANT ALL ON TABLE "public"."coupon_uses" TO "service_role";



GRANT ALL ON TABLE "public"."coupons" TO "anon";
GRANT ALL ON TABLE "public"."coupons" TO "authenticated";
GRANT ALL ON TABLE "public"."coupons" TO "service_role";



GRANT ALL ON TABLE "public"."expense_items" TO "anon";
GRANT ALL ON TABLE "public"."expense_items" TO "authenticated";
GRANT ALL ON TABLE "public"."expense_items" TO "service_role";



GRANT ALL ON TABLE "public"."expenses" TO "anon";
GRANT ALL ON TABLE "public"."expenses" TO "authenticated";
GRANT ALL ON TABLE "public"."expenses" TO "service_role";



GRANT ALL ON TABLE "public"."forum_questions" TO "anon";
GRANT ALL ON TABLE "public"."forum_questions" TO "authenticated";
GRANT ALL ON TABLE "public"."forum_questions" TO "service_role";



GRANT ALL ON TABLE "public"."gift_cards" TO "anon";
GRANT ALL ON TABLE "public"."gift_cards" TO "authenticated";
GRANT ALL ON TABLE "public"."gift_cards" TO "service_role";



GRANT ALL ON TABLE "public"."google_calendar_tokens" TO "anon";
GRANT ALL ON TABLE "public"."google_calendar_tokens" TO "authenticated";
GRANT ALL ON TABLE "public"."google_calendar_tokens" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."guarantees_analytics" TO "anon";
GRANT ALL ON TABLE "public"."guarantees_analytics" TO "authenticated";
GRANT ALL ON TABLE "public"."guarantees_analytics" TO "service_role";



GRANT ALL ON TABLE "public"."incomes" TO "anon";
GRANT ALL ON TABLE "public"."incomes" TO "authenticated";
GRANT ALL ON TABLE "public"."incomes" TO "service_role";



GRANT ALL ON TABLE "public"."inventory" TO "anon";
GRANT ALL ON TABLE "public"."inventory" TO "authenticated";
GRANT ALL ON TABLE "public"."inventory" TO "service_role";



GRANT ALL ON TABLE "public"."lesson_tags" TO "anon";
GRANT ALL ON TABLE "public"."lesson_tags" TO "authenticated";
GRANT ALL ON TABLE "public"."lesson_tags" TO "service_role";



GRANT ALL ON TABLE "public"."lessons" TO "anon";
GRANT ALL ON TABLE "public"."lessons" TO "authenticated";
GRANT ALL ON TABLE "public"."lessons" TO "service_role";



GRANT ALL ON TABLE "public"."marketing_campaigns" TO "anon";
GRANT ALL ON TABLE "public"."marketing_campaigns" TO "authenticated";
GRANT ALL ON TABLE "public"."marketing_campaigns" TO "service_role";



GRANT ALL ON TABLE "public"."modules" TO "anon";
GRANT ALL ON TABLE "public"."modules" TO "authenticated";
GRANT ALL ON TABLE "public"."modules" TO "service_role";



GRANT ALL ON TABLE "public"."notification_campaigns" TO "anon";
GRANT ALL ON TABLE "public"."notification_campaigns" TO "authenticated";
GRANT ALL ON TABLE "public"."notification_campaigns" TO "service_role";



GRANT ALL ON TABLE "public"."notification_logs" TO "anon";
GRANT ALL ON TABLE "public"."notification_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."notification_logs" TO "service_role";



GRANT ALL ON TABLE "public"."notification_settings" TO "anon";
GRANT ALL ON TABLE "public"."notification_settings" TO "authenticated";
GRANT ALL ON TABLE "public"."notification_settings" TO "service_role";



GRANT ALL ON TABLE "public"."notification_templates" TO "anon";
GRANT ALL ON TABLE "public"."notification_templates" TO "authenticated";
GRANT ALL ON TABLE "public"."notification_templates" TO "service_role";



GRANT ALL ON TABLE "public"."points_transactions" TO "anon";
GRANT ALL ON TABLE "public"."points_transactions" TO "authenticated";
GRANT ALL ON TABLE "public"."points_transactions" TO "service_role";



GRANT ALL ON TABLE "public"."professional_blocked_times" TO "anon";
GRANT ALL ON TABLE "public"."professional_blocked_times" TO "authenticated";
GRANT ALL ON TABLE "public"."professional_blocked_times" TO "service_role";



GRANT ALL ON TABLE "public"."professional_profiles" TO "anon";
GRANT ALL ON TABLE "public"."professional_profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."professional_profiles" TO "service_role";



GRANT ALL ON TABLE "public"."professional_reviews" TO "anon";
GRANT ALL ON TABLE "public"."professional_reviews" TO "authenticated";
GRANT ALL ON TABLE "public"."professional_reviews" TO "service_role";



GRANT ALL ON TABLE "public"."professional_schedules" TO "anon";
GRANT ALL ON TABLE "public"."professional_schedules" TO "authenticated";
GRANT ALL ON TABLE "public"."professional_schedules" TO "service_role";



GRANT ALL ON TABLE "public"."professional_services" TO "anon";
GRANT ALL ON TABLE "public"."professional_services" TO "authenticated";
GRANT ALL ON TABLE "public"."professional_services" TO "service_role";



GRANT ALL ON TABLE "public"."professional_settings" TO "anon";
GRANT ALL ON TABLE "public"."professional_settings" TO "authenticated";
GRANT ALL ON TABLE "public"."professional_settings" TO "service_role";



GRANT ALL ON TABLE "public"."purchases" TO "anon";
GRANT ALL ON TABLE "public"."purchases" TO "authenticated";
GRANT ALL ON TABLE "public"."purchases" TO "service_role";



GRANT ALL ON TABLE "public"."push_subscriptions" TO "anon";
GRANT ALL ON TABLE "public"."push_subscriptions" TO "authenticated";
GRANT ALL ON TABLE "public"."push_subscriptions" TO "service_role";



GRANT ALL ON TABLE "public"."referrals" TO "anon";
GRANT ALL ON TABLE "public"."referrals" TO "authenticated";
GRANT ALL ON TABLE "public"."referrals" TO "service_role";



GRANT ALL ON TABLE "public"."service_inventory_usage" TO "anon";
GRANT ALL ON TABLE "public"."service_inventory_usage" TO "authenticated";
GRANT ALL ON TABLE "public"."service_inventory_usage" TO "service_role";



GRANT ALL ON TABLE "public"."services" TO "anon";
GRANT ALL ON TABLE "public"."services" TO "authenticated";
GRANT ALL ON TABLE "public"."services" TO "service_role";



GRANT ALL ON TABLE "public"."shop_orders" TO "anon";
GRANT ALL ON TABLE "public"."shop_orders" TO "authenticated";
GRANT ALL ON TABLE "public"."shop_orders" TO "service_role";



GRANT ALL ON TABLE "public"."shop_products" TO "anon";
GRANT ALL ON TABLE "public"."shop_products" TO "authenticated";
GRANT ALL ON TABLE "public"."shop_products" TO "service_role";



GRANT ALL ON TABLE "public"."student_progress" TO "anon";
GRANT ALL ON TABLE "public"."student_progress" TO "authenticated";
GRANT ALL ON TABLE "public"."student_progress" TO "service_role";



GRANT ALL ON TABLE "public"."students" TO "anon";
GRANT ALL ON TABLE "public"."students" TO "authenticated";
GRANT ALL ON TABLE "public"."students" TO "service_role";



GRANT ALL ON TABLE "public"."subscription_plans" TO "anon";
GRANT ALL ON TABLE "public"."subscription_plans" TO "authenticated";
GRANT ALL ON TABLE "public"."subscription_plans" TO "service_role";



GRANT ALL ON TABLE "public"."unified_points_transactions" TO "anon";
GRANT ALL ON TABLE "public"."unified_points_transactions" TO "authenticated";
GRANT ALL ON TABLE "public"."unified_points_transactions" TO "service_role";



GRANT ALL ON TABLE "public"."whatsapp_bot_config" TO "anon";
GRANT ALL ON TABLE "public"."whatsapp_bot_config" TO "authenticated";
GRANT ALL ON TABLE "public"."whatsapp_bot_config" TO "service_role";



GRANT ALL ON TABLE "public"."whatsapp_conversations" TO "anon";
GRANT ALL ON TABLE "public"."whatsapp_conversations" TO "authenticated";
GRANT ALL ON TABLE "public"."whatsapp_conversations" TO "service_role";



GRANT ALL ON TABLE "public"."whatsapp_messages" TO "anon";
GRANT ALL ON TABLE "public"."whatsapp_messages" TO "authenticated";
GRANT ALL ON TABLE "public"."whatsapp_messages" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";



































