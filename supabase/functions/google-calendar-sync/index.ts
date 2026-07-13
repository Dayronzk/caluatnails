import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey, x-client-info",
};

const GOOGLE_CLIENT_ID = "YOUR_GOOGLE_CLIENT_ID_HERE";
const GOOGLE_CLIENT_SECRET = "YOUR_GOOGLE_CLIENT_SECRET_HERE";

interface BookingPayload {
  bookingId: string;
  professionalId: string;
  clientName: string;
  clientEmail: string;
  bookingDate: string; // YYYY-MM-DD
  bookingTime: string; // HH:MM
  durationMinutes: number;
  services: string[];
  action?: 'create' | 'delete';
  googleEventId?: string;
}

async function refreshAccessToken(refreshToken: string): Promise<{ access_token: string; expires_in: number } | null> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });
  if (!res.ok) return null;
  return res.json();
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const payload: BookingPayload = await req.json();
    const { bookingId, professionalId, clientName, clientEmail, bookingDate, bookingTime, durationMinutes, services } = payload;

    // Get professional's Google Calendar token
    const { data: tokenRow, error: tokenErr } = await supabase
      .from("google_calendar_tokens")
      .select("*")
      .eq("profile_id", professionalId)
      .maybeSingle();

    if (tokenErr || !tokenRow) {
      return new Response(JSON.stringify({ success: false, error: "No Google Calendar token found for professional" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let accessToken = tokenRow.access_token;

    // Refresh token if expired
    const now = new Date();
    const expiry = new Date(tokenRow.token_expiry);
    if (now >= expiry) {
      const refreshed = await refreshAccessToken(tokenRow.refresh_token);
      if (!refreshed) {
        return new Response(JSON.stringify({ success: false, error: "Failed to refresh Google token" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      accessToken = refreshed.access_token;
      const newExpiry = new Date(Date.now() + refreshed.expires_in * 1000).toISOString();
      await supabase
        .from("google_calendar_tokens")
        .update({ access_token: accessToken, token_expiry: newExpiry, updated_at: new Date().toISOString() })
        .eq("profile_id", professionalId);
    }

    const calendarId = tokenRow.calendar_id || "primary";

    // Handle Deletion
    if (payload.action === 'delete') {
      const eventId = payload.googleEventId;
      if (!eventId) {
        return new Response(JSON.stringify({ success: true, message: "No event ID to delete" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const delRes = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      // 404 means it's already gone, which is fine
      if (!delRes.ok && delRes.status !== 404) {
        const errBody = await delRes.text();
        return new Response(JSON.stringify({ success: false, error: `Google Calendar delete error: ${errBody}` }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ success: true, message: "Event deleted" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build event datetime
    const [year, month, day] = bookingDate.split("-").map(Number);
    const [hour, minute] = bookingTime.split(":").map(Number);
    const startDt = new Date(year, month - 1, day, hour, minute);
    const endDt = new Date(startDt.getTime() + durationMinutes * 60 * 1000);

    const toISOLocal = (d: Date) => {
      const pad = (n: number) => String(n).padStart(2, "0");
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:00`;
    };

    const calendarId = tokenRow.calendar_id || "primary";
    const servicesList = services.join(", ");

    const event = {
      summary: `Cita: ${clientName}`,
      description: `Cliente: ${clientName}\nEmail: ${clientEmail}\nServicios: ${servicesList}\nDuración: ${durationMinutes} min`,
      start: {
        dateTime: toISOLocal(startDt),
        timeZone: "America/Bogota",
      },
      end: {
        dateTime: toISOLocal(endDt),
        timeZone: "America/Bogota",
      },
      attendees: [{ email: clientEmail, displayName: clientName }],
      reminders: {
        useDefault: false,
        overrides: [
          { method: "email", minutes: 60 },
          { method: "popup", minutes: 30 },
        ],
      },
    };

    const gcalRes = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(event),
      }
    );

    if (!gcalRes.ok) {
      const errBody = await gcalRes.text();
      return new Response(JSON.stringify({ success: false, error: `Google Calendar API error: ${errBody}` }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const gcalEvent = await gcalRes.json() as { id: string };

    // Save google_event_id to booking
    await supabase
      .from("bookings")
      .update({ google_event_id: gcalEvent.id, updated_at: new Date().toISOString() })
      .eq("id", bookingId);

    return new Response(JSON.stringify({ success: true, eventId: gcalEvent.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return new Response(JSON.stringify({ success: false, error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
