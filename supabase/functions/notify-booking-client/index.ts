// notify-booking-client: sends push/email notifications to the CLIENT (not staff)
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const authHeader = req.headers.get('Authorization') || `Bearer ${serviceRoleKey}`;

    const { booking_id, type } = await req.json() as {
      booking_id: string;
      type: 'booking_confirmation' | 'appointment_reminder';
    };

    // Fetch booking details
    const { data: booking } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', booking_id)
      .maybeSingle();

    if (!booking) {
      return new Response(JSON.stringify({ error: 'Booking not found' }), { status: 404, headers: corsHeaders });
    }

    // Find client_account_id by phone
    let clientAccountId: string | null = null;
    if (booking.client_phone) {
      const { data: client } = await supabase
        .from('client_accounts')
        .select('id')
        .eq('phone', booking.client_phone)
        .maybeSingle();
      clientAccountId = client?.id ?? null;
    }

    if (!clientAccountId) {
      return new Response(JSON.stringify({ success: false, reason: 'no_client_account' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch template (use appointment_reminder for reminders, fallback for confirmation)
    const templateType = type === 'appointment_reminder' ? 'appointment_reminder' : 'booking_confirmation_client';
    const { data: template } = await supabase
      .from('notification_templates')
      .select('title, body, is_active, channels')
      .eq('type', templateType)
      .maybeSingle();

    if (template && !template.is_active) {
      return new Response(JSON.stringify({ success: true, message: 'Notification disabled' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const clientName = booking.client_name ?? 'Cliente';
    const bookingDate = booking.booking_date ?? '';
    const bookingTime = booking.booking_time ?? '';

    // Fetch professional name
    let professionalName = booking.professional_name ?? 'tu profesional';
    if (booking.professional_id) {
      const { data: prof } = await supabase
        .from('profiles')
        .select('name')
        .eq('id', booking.professional_id)
        .maybeSingle();
      if (prof?.name) professionalName = prof.name;
    }

    let title = '';
    let body = '';

    if (template) {
      title = template.title;
      body = template.body
        .replace(/{{clientName}}/g, clientName)
        .replace(/{{bookingDate}}/g, bookingDate)
        .replace(/{{bookingTime}}/g, bookingTime)
        .replace(/{{professionalName}}/g, professionalName);
    } else {
      if (type === 'appointment_reminder') {
        title = '💅 Recordatorio de tu cita';
        body = `¡Hola ${clientName}! Tu cita con ${professionalName} es en 30 minutos (${bookingTime}). ¡Te esperamos!`;
      } else {
        title = '✅ Reserva confirmada';
        body = `¡Hola ${clientName}! Tu cita está confirmada para ${bookingDate} a las ${bookingTime} con ${professionalName}.`;
      }
    }

    const channels = template?.channels || ['push'];
    const results: Record<string, unknown> = {};

    // Send Push to the client
    if (channels.includes('push')) {
      const pushRes = await fetch(`${supabaseUrl}/functions/v1/send-push-notification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': authHeader },
        body: JSON.stringify({
          _send_all: false,
          client_account_id: clientAccountId,
          booking_id,
          title,
          body,
          notification_type: type,
        }),
      });
      results.push = await pushRes.json();
    }

    // Optional: also send email if enabled and client has email
    if (channels.includes('email') && booking.client_email) {
      const emailRes = await fetch(`${supabaseUrl}/functions/v1/resend-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': authHeader },
        body: JSON.stringify({
          type: type === 'appointment_reminder' ? 'appointment_reminder' : 'booking_confirmation',
          to: { email: booking.client_email, name: clientName },
          data: { clientName, bookingDate, bookingTime, professionalName, subject: title, customBody: body },
        }),
      }).catch(() => null);
      if (emailRes) results.email = await emailRes.json().catch(() => ({ ok: true }));
    }

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.error('[notify-booking-client] Error:', msg);
    return new Response(JSON.stringify({ error: msg }), { status: 500, headers: corsHeaders });
  }
});
