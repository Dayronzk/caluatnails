import { createClient } from "https://esm.sh/@supabase/supabase-js@2.42.0";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

Deno.serve(async (req) => {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  
  const sql = `
    CREATE TABLE IF NOT EXISTS public.whatsapp_conversations (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      phone TEXT UNIQUE NOT NULL,
      client_name TEXT,
      client_email TEXT,
      client_account_id UUID,
      state JSONB DEFAULT '{}'::jsonb,
      needs_human BOOLEAN DEFAULT false,
      human_note TEXT,
      last_message_at TIMESTAMPTZ DEFAULT NOW(),
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS public.whatsapp_messages (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      conversation_id UUID NOT NULL REFERENCES public.whatsapp_conversations(id) ON DELETE CASCADE,
      direction TEXT NOT NULL,
      role TEXT NOT NULL,
      content TEXT,
      tool_calls JSONB,
      whatsapp_message_id TEXT,
      status TEXT DEFAULT 'pending',
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS public.whatsapp_bot_config (
      id TEXT PRIMARY KEY DEFAULT 'main',
      enabled BOOLEAN DEFAULT true,
      greeting TEXT DEFAULT 'Hola! Soy el asistente de CALUATNAILS 💅',
      system_prompt TEXT,
      respect_business_hours BOOLEAN DEFAULT false,
      max_failed_turns INT DEFAULT 3,
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    INSERT INTO public.whatsapp_bot_config (id) VALUES ('main') ON CONFLICT DO NOTHING;
  `;

  // We use unsafe SQL execution via a temporary function if possible, 
  // but Supabase JS client doesn't support raw SQL easily without RPC.
  // Instead, we will try to use the 'postgres' extension or just rely on 
  // the fact that we can at least try to query.
  
  // Actually, the best way is to use the REST API to execute SQL if enabled, 
  // but it's usually disabled.
  
  return new Response(JSON.stringify({ 
    message: "Esta función requiere permisos de RPC para ejecutar SQL. Por favor, ejecuta el SQL manualmente en el SQL Editor de Supabase.",
    sql: sql 
  }), { headers: { "Content-Type": "application/json" } });
});
