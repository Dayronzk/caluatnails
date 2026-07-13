// Lists approved WhatsApp message templates from Meta for the connected
// WhatsApp Business Account. Used by the admin panel to send templates
// when the 24h customer service window has closed.
//
// Auto-discovers the WhatsApp Business Account ID (WABA) from the
// configured phone number, so we don't need an extra env var.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const PHONE_ID = Deno.env.get("WHATSAPP_PHONE_ID")!;
const ACCESS_TOKEN = Deno.env.get("WHATSAPP_ACCESS_TOKEN")!;
const WABA_ID_ENV = Deno.env.get("WHATSAPP_BUSINESS_ACCOUNT_ID"); // optional override

interface MetaError { error?: { code?: number; message?: string; type?: string; error_subcode?: number } }

function authError(text: string): string {
  try {
    const parsed = JSON.parse(text) as MetaError;
    const code = parsed?.error?.code;
    const type = parsed?.error?.type;
    if (code === 190 || type === "OAuthException" || parsed?.error?.message === "Authentication Error") {
      return "El token de acceso de WhatsApp ha caducado o es inválido. Renuévalo en Meta for Developers → WhatsApp → API Setup.";
    }
    return parsed?.error?.message || `Meta error: ${text.slice(0, 200)}`;
  } catch {
    return `Meta error: ${text.slice(0, 200)}`;
  }
}

async function getWabaId(): Promise<{ id: string | null; error: string | null }> {
  if (WABA_ID_ENV) return { id: WABA_ID_ENV, error: null };

  const url = `https://graph.facebook.com/v21.0/${PHONE_ID}?fields=whatsapp_business_account_id`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${ACCESS_TOKEN}` },
  });
  const text = await res.text();
  if (!res.ok) return { id: null, error: authError(text) };

  try {
    const parsed = JSON.parse(text);
    // The phone-number node returns { id, whatsapp_business_account_id }
    const id = parsed?.whatsapp_business_account_id || parsed?.whatsapp_business_account?.id || null;
    if (!id) {
      // Fallback: fetch the linked WABA via business_account_id alternative path.
      // Some accounts expose it under "whatsapp_business_account.id".
      return { id: null, error: "No se pudo descubrir el WhatsApp Business Account ID. Define WHATSAPP_BUSINESS_ACCOUNT_ID como secret en Supabase." };
    }
    return { id, error: null };
  } catch {
    return { id: null, error: "Respuesta inesperada al descubrir WABA ID" };
  }
}

interface TemplateComponent {
  type: string;
  format?: string;
  text?: string;
  buttons?: Array<{ type: string; text?: string; url?: string }>;
  example?: { body_text?: string[][]; header_text?: string[]; header_handle?: string[] };
}

interface Template {
  name: string;
  language: string;
  status: string;
  category: string;
  components: TemplateComponent[];
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    if (!PHONE_ID || !ACCESS_TOKEN) {
      return new Response(
        JSON.stringify({ error: "Faltan WHATSAPP_PHONE_ID o WHATSAPP_ACCESS_TOKEN" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { id: wabaId, error: wabaErr } = await getWabaId();
    if (!wabaId) {
      return new Response(
        JSON.stringify({ error: wabaErr }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch templates from Meta
    const url = `https://graph.facebook.com/v21.0/${wabaId}/message_templates?limit=100`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${ACCESS_TOKEN}` },
    });
    const text = await res.text();
    if (!res.ok) {
      return new Response(
        JSON.stringify({ error: authError(text) }),
        { status: res.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const parsed = JSON.parse(text) as { data?: Template[] };
    const templates = (parsed.data ?? [])
      .filter(t => t.status === "APPROVED")
      .map(t => {
        // Count body variables by scanning {{1}}, {{2}}...
        const body = t.components.find(c => c.type === "BODY");
        const bodyText = body?.text ?? "";
        const matches = bodyText.match(/\{\{(\d+)\}\}/g) ?? [];
        const variableCount = matches.length;
        const header = t.components.find(c => c.type === "HEADER");
        const footer = t.components.find(c => c.type === "FOOTER");
        return {
          name: t.name,
          language: t.language,
          category: t.category,
          body_text: bodyText,
          header_text: header?.text ?? null,
          header_format: header?.format ?? null,
          footer_text: footer?.text ?? null,
          variable_count: variableCount,
        };
      });

    return new Response(JSON.stringify({ templates }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return new Response(
      JSON.stringify({ error: message }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
