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
      type: 'new_booking' | 'reminder_30min';
    };

    // Fetch booking details
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', booking_id)
      .maybeSingle();

    if (bookingError || !booking) {
      return new Response(JSON.stringify({ error: 'Booking not found' }), { status: 404, headers: corsHeaders });
    }

    // Fetch professional info from profiles + professional_profiles
    let proName: string | null = null;
    let proEmail: string | null = null;
    if (booking.professional_id) {
      const { data: proProfile } = await supabase
        .from('profiles')
        .select('name, email')
        .eq('id', booking.professional_id)
        .maybeSingle();
      if (proProfile) {
        proName = proProfile.name;
        proEmail = proProfile.email;
      }
      if (!proEmail) {
        try {
          const { data: authUser } = await supabase.auth.admin.getUserById(booking.professional_id);
          proEmail = authUser?.user?.email ?? null;
        } catch { /* ignore */ }
      }
    }

    // Fetch template from DB with advanced fields
    const { data: template } = await supabase
      .from('notification_templates')
      .select('title, body, is_active, channels, target_audience')
      .eq('type', type === 'new_booking' ? 'staff_new_booking' : 'staff_reminder_30min')
      .maybeSingle();

    // If template is explicitly inactive, we don't send anything
    if (template && !template.is_active) {
      return new Response(JSON.stringify({ success: true, message: 'Notification disabled by template setting' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const professionalName = proName ?? booking.professional_name ?? 'Profesional';
    const clientName = booking.client_name ?? 'Cliente';
    const bookingDate = booking.booking_date ?? booking.date ?? '';
    const bookingTime = booking.booking_time ?? booking.time ?? '';

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
      // Fallback
      if (type === 'new_booking') {
        title = '📅 Nueva cita agendada';
        body = `${clientName} ha reservado una cita el ${bookingDate} a las ${bookingTime} con ${professionalName}.`;
      } else {
        title = '⏰ Cita en 30 minutos';
        body = `Recuerda: ${clientName} tiene cita con ${professionalName} a las ${bookingTime}.`;
      }
    }

    const channels = template?.channels || ['push'];
    const results: any = {};

    // 1. Send Push if enabled
    // IMPORTANT: Only notify the assigned professional, NOT all admins
    // If no professional is assigned, fall back to notifying admins
    if (channels.includes('push')) {
      const hasProfessional = !!proEmail;
      const pushRes = await fetch(`${supabaseUrl}/functions/v1/send-push-notification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authHeader,
        },
        body: JSON.stringify({
          _send_all: false,
          // Only send to admins if there's NO professional assigned
          target_roles: hasProfessional ? [] : ['admin'],
          professional_email: proEmail ?? null,
          booking_id,
          title,
          body,
          notification_type: type === 'new_booking' ? 'new_booking' : 'reminder_30min',
        }),
      });
      results.push = await pushRes.json();
    }

    // 2. Send Email if enabled
    if (channels.includes('email')) {
      const emailRes = await fetch(`${supabaseUrl}/functions/v1/resend-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authHeader,
        },
        body: JSON.stringify({
          type: type === 'new_booking' ? 'booking_new_admin' : 'booking_reminder',
          to: {
            email: proEmail || Deno.env.get('ADMIN_EMAIL') || 'admin@caluatnails.com',
            name: professionalName
          },
          data: {
            clientName,
            bookingDate,
            bookingTime,
            professionalName,
            subject: title,
            customBody: body // Assuming resend-email can handle customBody
          }
        }),
      });
      results.email = await emailRes.json();
    }

    console.log(`[notify-booking-staff] Results for ${type}:`, results);

    const eventType = type === 'new_booking' ? 'new_booking' : 'booking_reminder';
    const notificationType = type === 'new_booking' ? 'new_booking' : 'reminder_30min';

    // Log email notification (push is logged by send-push-notification)
    if (channels.includes('email')) {
      await supabase.from('notification_logs').insert({
        booking_id,
        event_type: eventType,
        channel: 'email',
        notification_type: notificationType,
        profile_id: booking.professional_id,
        recipient_name: professionalName,
        recipient_email: proEmail,
        title,
        body,
        status: results.email?.error ? 'failed' : 'sent',
        error_message: results.email?.error || null,
        template_type: type === 'new_booking' ? 'staff_new_booking' : 'staff_reminder_30min',
      });
    }

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    console.error('[notify-booking-staff] Error:', err.message);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: corsHeaders,
    });
  }
});
