
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Parse automation_id if coming from cron job
    const body = await req.json().catch(() => ({}))
    const { automation_id } = body

    let targetProfiles: any[] = []
    let title = ""
    let message = ""
    let url = "/admin"

    // 1. If we have an automation_id, fetch its details
    if (automation_id) {
      const { data: auto } = await supabase
        .from('automations')
        .select('*, template:notification_templates(*)')
        .eq('id', automation_id)
        .single()

      if (!auto || !auto.is_active) {
        return new Response(JSON.stringify({ message: "Automation inactive or not found" }), { headers: corsHeaders })
      }

      // Handle "Availability Alert" logic
      if (auto.name.includes('Disponibilidad')) {
        // --- CALCULATION LOGIC ---
        const tomorrow = new Date()
        tomorrow.setDate(tomorrow.getDate() + 1)
        const dateStr = tomorrow.toISOString().split('T')[0]
        const dow = tomorrow.getDay()

        const [professionalsRes, bookingsRes, schedulesRes, settingsRes] = await Promise.all([
          supabase.from('profiles').select('id, name, role, is_professional').or('role.eq.admin,is_professional.eq.true'),
          supabase.from('bookings').select('professional_id, total_duration_minutes, status').eq('booking_date', dateStr).neq('status', 'cancelled'),
          supabase.from('professional_schedules').select('profile_id, day_of_week, is_working, start_time, end_time'),
          supabase.from('professional_settings').select('profile_id, slot_duration_minutes'),
        ])

        const professionals = professionalsRes.data || []
        const bookings = bookingsRes.data || []
        const schedules = schedulesRes.data || []
        const settings = settingsRes.data || []

        let totalSlots = 0
        let totalOccupied = 0

        professionals.forEach(pro => {
          const sched = schedules.find(s => s.profile_id === pro.id && s.day_of_week === dow)
          const setting = settings.find(s => s.profile_id === pro.id)
          const slotSize = setting?.slot_duration_minutes || 30

          if (sched?.is_working) {
            const start = sched.start_time.split(':').map(Number)
            const end = sched.end_time.split(':').map(Number)
            const totalMinutes = (end[0] * 60 + end[1]) - (start[0] * 60 + start[1])
            totalSlots += Math.floor(totalMinutes / slotSize)
          }

          const profBookings = bookings.filter(b => b.professional_id === pro.id)
          const totalOccupiedMinutes = profBookings.reduce((acc, b) => acc + (Number(b.total_duration_minutes) || slotSize), 0)
          totalOccupied += Math.ceil(totalOccupiedMinutes / slotSize)
        })

        const occupancyRate = totalSlots > 0 ? Math.round((totalOccupied / totalSlots) * 100) : 0
        const freeSlots = Math.max(0, totalSlots - totalOccupied)

        title = `📊 Estado Caluatnails: ${dateStr}`
        message = occupancyRate >= 90 
          ? `¡Día completo! 🌟 Mañana estamos al ${occupancyRate}% con ${totalOccupied} servicios.`
          : `Disponibilidad Mañana: ${occupancyRate}% ocupado. Quedan ${freeSlots} huecos libres. 💅`
        targetProfiles = professionals
      } else {
        // Generic Automation logic
        title = auto.template?.title || auto.name
        message = auto.template?.body || "Aviso automático del sistema Caluatnails 💅"
        url = auto.template?.url || "/admin"
        
        // Audience filtering
        const query = supabase.from('profiles').select('id')
        if (auto.target_audience === 'admins') query.eq('role', 'admin')
        else if (auto.target_audience === 'professionals') query.eq('is_professional', true)
        else if (auto.target_audience === 'all_staff') query.or('role.eq.admin,is_professional.eq.true')
        
        const { data: recipients } = await query
        targetProfiles = recipients || []
      }
    }

    // 2. Dispatch Notifications
    if (targetProfiles.length > 0) {
      await Promise.all(
        targetProfiles.map(pro => 
          fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-push-notification`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`
            },
            body: JSON.stringify({
              client_account_id: pro.id,
              title: title,
              message: message,
              url: url
            })
          }).then(r => r.json().catch(() => ({})))
        )
      )
    }

    return new Response(JSON.stringify({ success: true, recipients: targetProfiles.length }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
