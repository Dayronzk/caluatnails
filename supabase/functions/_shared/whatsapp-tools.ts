// Tools that the Claude agent can call to interact with the booking system.
// Each tool has a JSON schema definition (for Claude) and an execute function.

import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

export interface ToolContext {
  supabase: SupabaseClient;
  conversationId: string;
  clientPhone: string;
}

// ── Tool schemas (passed to Claude) ─────────────────────────────────────────

export const TOOL_SCHEMAS = [
  {
    name: "list_services",
    description:
      "Lista todos los servicios disponibles (manicura, pedicura, etc.) con su precio y duración. Úsalo cuando la cliente pregunte por servicios o precios.",
    input_schema: {
      type: "object",
      properties: {
        search: {
          type: "string",
          description: "Filtro opcional por nombre del servicio",
        },
      },
    },
  },
  {
    name: "check_availability",
    description:
      "Consulta los slots disponibles para una fecha y unos servicios. Devuelve los horarios libres para cada profesional. Si la clienta pidió un profesional específico, pásalo en professional_id y solo verás slots de esa persona. Úsalo cuando la cliente quiera reservar y ya sepamos qué servicios y qué día.",
    input_schema: {
      type: "object",
      properties: {
        date: {
          type: "string",
          description: "Fecha en formato YYYY-MM-DD",
        },
        service_ids: {
          type: "array",
          items: { type: "string" },
          description: "IDs de los servicios a reservar",
        },
        professional_id: {
          type: "string",
          description: "UUID del profesional específico (opcional). Úsalo SOLO si la clienta nombró a una profesional concreta. Si lo pasas y esa profesional no tiene disponibilidad ese día, devuelve vacío y debes proponer otro día con esa misma profesional usando find_next_available_slot.",
        },
        after_time: {
          type: "string",
          description: "HH:MM. Filtra slots que empiecen a partir de esta hora (ej. la clienta pide 'después de las 12').",
        },
      },
      required: ["date", "service_ids"],
    },
  },
  {
    name: "find_next_available_slot",
    description:
      "Busca el PRÓXIMO hueco libre escaneando los siguientes 14 días en UNA sola llamada. Devuelve hasta 5 slots ordenados por fecha. Úsalo cuando la clienta diga 'el primer hueco', 'cuando puedas', 'cualquier día', 'lo antes posible', 'el próximo disponible'. EVITA hacer múltiples llamadas a check_availability día por día — esto es muchísimo más rápido y elegante.",
    input_schema: {
      type: "object",
      properties: {
        service_ids: {
          type: "array",
          items: { type: "string" },
          description: "IDs de los servicios a reservar",
        },
        professional_id: {
          type: "string",
          description: "UUID del profesional (opcional). Si se pasa, solo busca huecos de esa profesional.",
        },
        from_date: {
          type: "string",
          description: "YYYY-MM-DD desde donde empezar a buscar. Si no se pasa, empieza desde mañana.",
        },
        after_time: {
          type: "string",
          description: "HH:MM. Solo cuenta slots que empiecen a partir de esta hora.",
        },
      },
      required: ["service_ids"],
    },
  },
  {
    name: "create_booking",
    description:
      "Crea una reserva confirmada en el sistema. Solo úsalo cuando hayas confirmado con la cliente: servicios, fecha, hora, profesional y nombre. NO pidas email — no es obligatorio.",
    input_schema: {
      type: "object",
      properties: {
        date: { type: "string", description: "YYYY-MM-DD" },
        time: { type: "string", description: "HH:MM (24h)" },
        service_ids: { type: "array", items: { type: "string" } },
        professional_id: { type: "string", description: "ID del profesional (UUID)" },
        client_name: { type: "string", description: "Nombre de la clienta (si ya lo tenemos en la conversación, no lo preguntes de nuevo)" },
      },
      required: ["date", "time", "service_ids", "professional_id", "client_name"],
    },
  },
  {
    name: "reschedule_booking",
    description:
      "Cambia la fecha, hora y/o profesional de una reserva existente. Úsalo cuando la cliente diga 'cambiar la cita', 'mover la reserva', 'reagendar', 'no puedo ese día', 'pasarla a otra hora'. Antes de llamarlo, usa list_my_bookings para obtener el booking_id correcto. Comprueba disponibilidad con check_availability si la cliente sugiere una nueva fecha/hora.",
    input_schema: {
      type: "object",
      properties: {
        booking_id: { type: "string", description: "UUID de la reserva existente a mover" },
        new_date: { type: "string", description: "Nueva fecha YYYY-MM-DD" },
        new_time: { type: "string", description: "Nueva hora HH:MM (24h)" },
        new_professional_id: { type: "string", description: "UUID del nuevo profesional. Si no cambia, omite o pasa el mismo." },
      },
      required: ["booking_id", "new_date", "new_time"],
    },
  },
  {
    name: "save_client_name",
    description:
      "Guarda el nombre de la clienta en la conversación y en su cuenta de cliente (client_accounts). Llama a esto en cuanto la clienta te diga su nombre, para que no se lo vuelvas a preguntar y para que aparezca en el panel admin. SOLO úsalo si todavía no tenemos el nombre.",
    input_schema: {
      type: "object",
      properties: {
        name: { type: "string", description: "Nombre completo de la clienta tal cual lo escribió" },
      },
      required: ["name"],
    },
  },
  {
    name: "list_my_bookings",
    description:
      "Lista las reservas existentes de la cliente (por su número de WhatsApp). Úsalo cuando pregunte por sus citas.",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "get_last_booking",
    description:
      "Devuelve la última reserva COMPLETADA o CONFIRMADA de la cliente (por su número de WhatsApp), con servicios, profesional y fecha. Úsalo cuando la cliente diga frases como 'quiero reservar lo de siempre', 'lo mismo del mes pasado', 'lo que me hice la última vez', 'lo mismo que la otra vez', etc. Devuelve también la próxima fecha disponible sugerida para reservar el mismo servicio.",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "cancel_booking",
    description: "Cancela una reserva específica de la cliente.",
    input_schema: {
      type: "object",
      properties: {
        booking_id: { type: "string", description: "UUID de la reserva" },
      },
      required: ["booking_id"],
    },
  },
  {
    name: "escalate_to_human",
    description:
      "Cuando la cliente solicite hablar con una persona, o tu no puedas resolver algo (queja, problema, pregunta fuera del alcance), úsalo para que un admin tome el control.",
    input_schema: {
      type: "object",
      properties: {
        reason: { type: "string", description: "Por qué escalas" },
      },
      required: ["reason"],
    },
  },
];

// ── Tool execution ──────────────────────────────────────────────────────────

const timeToMin = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};
const minToTime = (min: number) =>
  `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;

export async function executeTool(
  name: string,
  input: Record<string, unknown>,
  ctx: ToolContext,
): Promise<string> {
  try {
    switch (name) {
      case "list_services":
        return await listServices(ctx, input.search as string | undefined);
      case "check_availability":
        return await checkAvailability(
          ctx,
          input.date as string,
          input.service_ids as string[],
          input.professional_id as string | undefined,
          input.after_time as string | undefined,
        );
      case "find_next_available_slot":
        return await findNextAvailableSlot(ctx, input);
      case "create_booking":
        return await createBooking(ctx, input);
      case "reschedule_booking":
        return await rescheduleBooking(ctx, input);
      case "save_client_name":
        return await saveClientName(ctx, input.name as string);
      case "list_my_bookings":
        return await listMyBookings(ctx);
      case "get_last_booking":
        return await getLastBooking(ctx);
      case "cancel_booking":
        return await cancelBooking(ctx, input.booking_id as string);
      case "escalate_to_human":
        return await escalateToHuman(ctx, input.reason as string);
      default:
        return `Error: tool desconocido "${name}"`;
    }
  } catch (err) {
    return `Error ejecutando ${name}: ${err instanceof Error ? err.message : String(err)}`;
  }
}

// ── Implementations ─────────────────────────────────────────────────────────

async function listServices(ctx: ToolContext, search?: string): Promise<string> {
  let q = ctx.supabase
    .from("services")
    .select("id, name, price, duration_minutes, service_type, description")
    .eq("active", true)
    .order("service_type")
    .order("order_index", { ascending: true })
    .order("name");
  if (search) q = q.ilike("name", `%${search}%`);
  const { data, error } = await q;
  if (error) return `Error: ${error.message}`;
  if (!data || data.length === 0) {
    // A narrow search term (e.g. a full pack phrase like "pack de manos y pies")
    // often matches nothing even though the catalog has it. Retry once without
    // the filter so the bot always sees the real services instead of wrongly
    // telling the client "no hay servicios disponibles".
    if (search) return listServices(ctx);
    return "No hay servicios disponibles.";
  }
  return JSON.stringify(
    data.map((s) => ({
      id: s.id,
      nombre: s.name,
      precio_eur: Number(s.price),
      duracion_min: s.duration_minutes,
      tipo: s.service_type,
      descripcion: s.description,
    })),
  );
}

async function checkAvailability(
  ctx: ToolContext,
  date: string,
  serviceIds: string[],
  professionalIdFilter?: string,
  afterTime?: string,
): Promise<string> {
  // 1. Total duration of selected services
  const { data: services } = await ctx.supabase
    .from("services")
    .select("id, duration_minutes")
    .in("id", serviceIds);
  if (!services || services.length === 0) {
    return JSON.stringify({
      error: "servicios_no_encontrados",
      instruccion_bot:
        "Los id de servicio enviados no existen en el catálogo. Llama a list_services (sin filtro o con UNA palabra corta), toma el id EXACTO de un servicio activo y reintenta. NUNCA digas a la clienta que no hay hueco/disponibilidad por esto: es un fallo de búsqueda de id, NO falta de disponibilidad.",
    });
  }
  const totalMin = services.reduce((acc, s) => acc + s.duration_minutes, 0);

  // 2. Day of week (0=Sun .. 6=Sat)
  const dow = new Date(date + "T12:00:00").getDay();

  // 3. Active professionals (filter by professionalIdFilter if requested)
  let settingsQuery = ctx.supabase
    .from("professional_settings")
    .select("profile_id, display_name, slot_duration_minutes, buffer_minutes")
    .eq("is_active", true);
  if (professionalIdFilter) settingsQuery = settingsQuery.eq("profile_id", professionalIdFilter);
  const { data: settings } = await settingsQuery;
  if (!settings || settings.length === 0) {
    return professionalIdFilter
      ? "La profesional solicitada no está activa o no existe."
      : "No hay profesionales disponibles.";
  }

  // 3b. Fallback names: if a professional has an empty display_name in
  //     professional_settings, fetch profiles.name so the bot never proposes
  //     slots without telling the customer who will attend her.
  const profilesNeedingName = settings
    .filter((s) => !s.display_name || s.display_name.trim() === "")
    .map((s) => s.profile_id);
  const nameFallback: Record<string, string> = {};
  if (profilesNeedingName.length > 0) {
    const { data: profs } = await ctx.supabase
      .from("profiles")
      .select("id, name")
      .in("id", profilesNeedingName);
    for (const p of profs ?? []) {
      if (p.name && p.name.trim() !== "") nameFallback[p.id] = p.name.trim();
    }
  }

  const afterMin = afterTime ? timeToMin(afterTime) : 0;

  // 4. Schedules for those professionals
  const profIds = settings.map((s) => s.profile_id);
  const { data: schedules } = await ctx.supabase
    .from("professional_schedules")
    .select("profile_id, day_of_week, is_working, start_time, end_time, break_start, break_end")
    .in("profile_id", profIds)
    .eq("day_of_week", dow);

  // 5. Existing bookings on this date
  const { data: bookings } = await ctx.supabase
    .from("bookings")
    .select("professional_id, booking_time, total_duration_minutes")
    .eq("booking_date", date)
    .neq("status", "cancelled");

  // 6. Blocked times on this date
  const { data: blocks } = await ctx.supabase
    .from("professional_blocked_times")
    .select("profile_id, start_time, end_time")
    .eq("blocked_date", date);

  // 7. Compute slots per professional
  const result: Array<{ profesional: string; profile_id: string; slots: string[] }> = [];

  for (const prof of settings) {
    const sched = schedules?.find((s) => s.profile_id === prof.profile_id);
    if (!sched || !sched.is_working) continue;

    const startMin = timeToMin(sched.start_time.slice(0, 5));
    const endMin = timeToMin(sched.end_time.slice(0, 5));
    const slotSize = prof.slot_duration_minutes ?? 30;
    const buffer = prof.buffer_minutes ?? 0;

    // Build occupied minutes set
    const occupied = new Set<number>();
    for (const b of bookings ?? []) {
      if (b.professional_id !== prof.profile_id) continue;
      const start = timeToMin(b.booking_time.slice(0, 5));
      for (let t = start; t < start + b.total_duration_minutes; t += 15) occupied.add(t);
    }
    for (const blk of blocks ?? []) {
      if (blk.profile_id !== prof.profile_id) continue;
      const start = timeToMin(blk.start_time.slice(0, 5));
      const end = timeToMin(blk.end_time.slice(0, 5));
      for (let t = start; t < end; t += 15) occupied.add(t);
    }
    if (sched.break_start && sched.break_end) {
      const start = timeToMin(sched.break_start.slice(0, 5));
      const end = timeToMin(sched.break_end.slice(0, 5));
      for (let t = start; t < end; t += 15) occupied.add(t);
    }

    const slots: string[] = [];
    const tStart = Math.max(startMin, afterMin);
    for (let t = tStart; t + totalMin <= endMin; t += slotSize) {
      let conflict = false;
      for (let check = t; check < t + totalMin + buffer; check += 15) {
        if (occupied.has(check)) {
          conflict = true;
          break;
        }
      }
      if (!conflict) slots.push(minToTime(t));
    }

    if (slots.length > 0) {
      const resolvedName =
        (prof.display_name && prof.display_name.trim()) ||
        nameFallback[prof.profile_id] ||
        "tu profesional";
      result.push({
        profesional: resolvedName,
        profile_id: prof.profile_id,
        slots,
      });
    }
  }

  if (result.length === 0) {
    // If we filtered by after_time and got nothing, transparently retry
    // without the filter and surface the slots that DO exist that day, so
    // the bot can say "no hay a esa hora exacta pero sí a X, Y, Z" instead
    // of just "no hay nada" (which has cost us bookings — see Laura's chat).
    if (afterTime) {
      const retry = await checkAvailability(ctx, date, serviceIds, professionalIdFilter, undefined);
      try {
        const parsed = JSON.parse(retry);
        if (parsed.disponibilidad?.length) {
          return JSON.stringify({
            duracion_total_min: totalMin,
            requested_after_time: afterTime,
            disponibilidad_misma_fecha_otras_horas: parsed.disponibilidad,
            instrucciones_para_el_bot: `No hay slots ese día a partir de ${afterTime}, pero SÍ hay disponibilidad en otras horas del mismo día. Propón al menos 2-3 de esas horas a la clienta para no perder la reserva.`,
          });
        }
      } catch { /* fall through */ }
    }
    return `No hay disponibilidad para ${date}.`;
  }
  return JSON.stringify({ duracion_total_min: totalMin, disponibilidad: result });
}

async function createBooking(
  ctx: ToolContext,
  input: Record<string, unknown>,
): Promise<string> {
  const date = input.date as string;
  const time = input.time as string;
  const serviceIds = input.service_ids as string[];
  const professionalId = input.professional_id as string;
  const clientName = input.client_name as string;
  // No pedimos email por chat. Si la conversación ya tiene uno (de una reserva
  // anterior o de su cuenta), lo aprovechamos. Si no, queda null y el sistema
  // lo gestiona después por otros canales.
  const { data: convRow } = await ctx.supabase
    .from("whatsapp_conversations")
    .select("client_email")
    .eq("id", ctx.conversationId)
    .maybeSingle();
  const clientEmail = convRow?.client_email || null;

  // Validate date is not in the past
  const today = new Date().toISOString().slice(0, 10);
  if (date < today) {
    return `Error: la fecha ${date} es anterior a hoy (${today}). Pídele a la cliente una fecha futura.`;
  }

  // Get services details
  const { data: services } = await ctx.supabase
    .from("services")
    .select("id, name, price, duration_minutes")
    .in("id", serviceIds);
  if (!services || services.length === 0) {
    return JSON.stringify({
      error: "servicios_no_encontrados",
      instruccion_bot:
        "Los id de servicio no existen. Llama a list_services, toma el id EXACTO de un servicio activo y reintenta create_booking. NO confirmes ni canceles la cita por este fallo.",
    });
  }

  const totalDuration = services.reduce((acc, s) => acc + s.duration_minutes, 0);
  const totalPrice = services.reduce((acc, s) => acc + Number(s.price), 0);

  // Resolve the professional's display name as a snapshot so it's preserved
  // even if the professional profile is deleted in the future.
  let professionalNameSnapshot: string | null = null;
  if (professionalId) {
    const { data: ps } = await ctx.supabase
      .from("professional_settings")
      .select("display_name")
      .eq("profile_id", professionalId)
      .maybeSingle();
    professionalNameSnapshot = ps?.display_name?.trim() || null;
    if (!professionalNameSnapshot) {
      const { data: prof } = await ctx.supabase
        .from("profiles")
        .select("name")
        .eq("id", professionalId)
        .maybeSingle();
      professionalNameSnapshot = prof?.name?.trim() || null;
    }
  }

  // WhatsApp bookings do NOT require a deposit. Mark the booking as confirmed
  // straight away with deposit_paid=true and deposit_amount=0 so it doesn't
  // get caught by deposit-collection flows or treated as "pending payment".
  const { data: booking, error } = await ctx.supabase
    .from("bookings")
    .insert({
      booking_date: date,
      booking_time: time,
      total_duration_minutes: totalDuration,
      total_price: totalPrice,
      deposit_amount: 0,
      deposit_paid: true,
      status: "confirmed",
      payment_method: "in_person",
      professional_id: professionalId,
      professional_name_snapshot: professionalNameSnapshot,
      client_name: clientName,
      client_email: clientEmail,
      client_phone: ctx.clientPhone,
      notes: "Creada por bot WhatsApp",
      booking_source: "bot",
    })
    .select("id")
    .single();

  if (error || !booking) return `Error creando reserva: ${error?.message}`;

  // Insert booking_services
  const bookingServices = services.map((s) => ({
    booking_id: booking.id,
    service_id: s.id,
    service_name: s.name,
    price_at_booking: s.price,
  }));
  await ctx.supabase.from("booking_services").insert(bookingServices);

  // Update conversation with name/email
  await ctx.supabase
    .from("whatsapp_conversations")
    .update({ client_name: clientName, client_email: clientEmail })
    .eq("id", ctx.conversationId);

  return JSON.stringify({
    success: true,
    booking_id: booking.id,
    resumen: `Reserva confirmada: ${services.map((s) => s.name).join(", ")} el ${date} a las ${time}.`,
    instrucciones_para_el_bot: "Confirma la cita en un solo mensaje breve y cálido (día, hora, profesional). NO menciones señal, anticipo, depósito, pago, ni email. Termina con algo amable tipo 'Te esperamos 💅'. Eso es todo.",
  });
}

async function listMyBookings(ctx: ToolContext): Promise<string> {
  const today = new Date().toISOString().slice(0, 10);
  // Phone matching by last 9 digits (handles "+34..." and "34..." formats)
  const last9 = ctx.clientPhone.replace(/\D/g, "").slice(-9);

  // 1. Future / active bookings (NOT cancelled)
  const { data: upcoming } = await ctx.supabase
    .from("bookings")
    .select("id, booking_date, booking_time, status, total_price, booking_services(service_name)")
    .ilike("client_phone", `%${last9}`)
    .gte("booking_date", today)
    .neq("status", "cancelled")
    .order("booking_date");

  // 2. Cancelled bookings — return them separately so the bot can mention
  //    them clearly ("tienes 1 reserva cancelada") instead of pretending the
  //    user has none at all.
  const { data: cancelled } = await ctx.supabase
    .from("bookings")
    .select("id, booking_date, booking_time, status, booking_services(service_name)")
    .ilike("client_phone", `%${last9}`)
    .eq("status", "cancelled")
    .order("booking_date", { ascending: false })
    .limit(3);

  const upcomingList = (upcoming ?? []).map((b) => ({
    id: b.id,
    fecha: b.booking_date,
    hora: b.booking_time,
    estado: b.status,
    precio: b.total_price,
    servicios: (b.booking_services as { service_name: string }[]).map((bs) => bs.service_name),
  }));
  const cancelledList = (cancelled ?? []).map((b) => ({
    id: b.id,
    fecha: b.booking_date,
    hora: b.booking_time,
    estado: "cancelada",
    servicios: (b.booking_services as { service_name: string }[]).map((bs) => bs.service_name),
  }));

  if (upcomingList.length === 0 && cancelledList.length === 0) {
    return JSON.stringify({
      reservas_activas: [],
      reservas_canceladas: [],
      message: "La cliente NO tiene ninguna reserva en el sistema (ni próximas ni canceladas). Confírmaselo amablemente y ofrécele crear una nueva.",
    });
  }

  return JSON.stringify({
    reservas_activas: upcomingList,
    reservas_canceladas: cancelledList,
    instrucciones_para_el_bot:
      upcomingList.length > 0
        ? "Muestra a la cliente sus reservas ACTIVAS con fecha, hora y servicio. NO menciones las canceladas a menos que la cliente pregunte por ellas explícitamente."
        : "La cliente NO tiene reservas próximas. Tiene " + cancelledList.length + " cancelada(s). Dile exactamente: 'No tienes ninguna reserva próxima. Tus últimas citas están canceladas. ¿Quieres agendar una nueva?' NUNCA inventes ni confirmes una reserva nueva sin llamar a create_booking.",
  });
}

async function cancelBooking(ctx: ToolContext, bookingId: string): Promise<string> {
  // Verify the booking belongs to this phone. Match the last 9 digits to be
  // format-agnostic ("+34600...", "34600...", etc.) — strict equality failed
  // because Meta sends the number without "+" while bookings store it with "+".
  const last9 = ctx.clientPhone.replace(/\D/g, "").slice(-9);
  const { data: booking } = await ctx.supabase
    .from("bookings")
    .select("id, client_phone, status")
    .eq("id", bookingId)
    .maybeSingle();
  if (!booking) return "Reserva no encontrada.";
  const bookingPhoneDigits = (booking.client_phone || "").replace(/\D/g, "").slice(-9);
  if (bookingPhoneDigits !== last9) return "Esa reserva no es tuya.";
  if (booking.status === "cancelled") {
    return JSON.stringify({ success: true, already_cancelled: true, message: "Esa reserva ya estaba cancelada." });
  }

  await ctx.supabase
    .from("bookings")
    .update({ status: "cancelled", updated_at: new Date().toISOString() })
    .eq("id", bookingId);
  return JSON.stringify({
    success: true,
    message: "Reserva cancelada.",
    instrucciones_para_el_bot:
      "Confirma la cancelación con un mensaje corto y cálido. Ofrécele SIEMPRE mover la cita a otro día en lugar de perderla (ej: '¿Quieres que te busque otro hueco mejor en vez de cancelar del todo? 💕'). No pidas nada más.",
  });
}

async function escalateToHuman(ctx: ToolContext, reason: string): Promise<string> {
  await ctx.supabase
    .from("whatsapp_conversations")
    .update({ needs_human: true, human_note: reason })
    .eq("id", ctx.conversationId);
  return JSON.stringify({ success: true, message: "Aviso enviado al equipo. Te responderán pronto." });
}

// "Lo de siempre" — Find the customer's last completed/confirmed booking and
// suggest the next available slot for the same service+professional combo.
async function getLastBooking(ctx: ToolContext): Promise<string> {
  // Match the last 9 digits to be format-agnostic ("+34685486408", "34685486408", etc.)
  const last9 = ctx.clientPhone.replace(/\D/g, "").slice(-9);

  // 1. Find the most recent completed/confirmed booking for this phone
  const { data: bookings, error } = await ctx.supabase
    .from("bookings")
    .select(`
      id, booking_date, booking_time, status, total_price, total_duration_minutes,
      professional_id, client_name,
      booking_services ( service_id, service_name, price_at_booking )
    `)
    .ilike("client_phone", `%${last9}`)
    .in("status", ["completed", "confirmed"])
    .order("booking_date", { ascending: false })
    .order("booking_time", { ascending: false })
    .limit(1);

  if (error || !bookings || bookings.length === 0) {
    return JSON.stringify({
      found: false,
      message: "No encontré reservas pasadas tuyas. Es tu primera vez con nosotras o reservaste con otro número.",
    });
  }

  const last = bookings[0];
  const services = (last.booking_services as Array<{ service_id: string; service_name: string; price_at_booking: number }>) || [];
  if (services.length === 0) {
    return JSON.stringify({
      found: false,
      message: "Tu última reserva no tiene servicios asociados, no puedo replicarla automáticamente.",
    });
  }

  // 2. Resolve professional name
  let professionalName = "Profesional";
  let professionalId: string | null = last.professional_id ?? null;
  if (professionalId) {
    const { data: prof } = await ctx.supabase
      .from("professional_settings")
      .select("display_name")
      .eq("profile_id", professionalId)
      .maybeSingle();
    if (prof?.display_name) {
      professionalName = prof.display_name;
    } else {
      // Fallback to profiles.name
      const { data: profile } = await ctx.supabase
        .from("profiles")
        .select("name")
        .eq("id", professionalId)
        .maybeSingle();
      if (profile?.name) professionalName = profile.name;
    }
  }

  // 3. Suggest next available date — scan up to 14 days forward
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const serviceIds = services.map((s) => s.service_id);

  const suggested: Array<{ fecha: string; profesional: string; profile_id: string; slots: string[] }> = [];
  for (let i = 1; i <= 14 && suggested.length < 3; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    const isoDate = d.toISOString().slice(0, 10);
    const availability = await checkAvailability(ctx, isoDate, serviceIds);
    try {
      const parsed = JSON.parse(availability);
      if (parsed.disponibilidad?.length) {
        // Prefer the same professional if available, else first
        const samePro = parsed.disponibilidad.find(
          (p: { profile_id: string }) => p.profile_id === professionalId,
        );
        const chosen = samePro ?? parsed.disponibilidad[0];
        suggested.push({
          fecha: isoDate,
          profesional: chosen.profesional,
          profile_id: chosen.profile_id,
          slots: chosen.slots.slice(0, 3),
        });
      }
    } catch {
      // checkAvailability returned a plain message, not JSON — skip
    }
  }

  return JSON.stringify({
    found: true,
    last_booking: {
      booking_id: last.id,
      fecha: last.booking_date,
      hora: last.booking_time,
      estado: last.status,
      profesional: professionalName,
      profesional_id: professionalId,
      servicios: services.map((s) => ({
        id: s.service_id,
        nombre: s.service_name,
        precio: s.price_at_booking,
      })),
      duracion_min: last.total_duration_minutes,
      precio_total: last.total_price,
    },
    sugerencias_proximas: suggested,
    instrucciones_para_el_bot:
      "Muestra a la cliente el resumen de su última reserva (servicio, profesional, fecha pasada). Pregunta si quiere repetir lo mismo. Si dice que sí, sugiere las primeras fechas disponibles y procede al flujo normal de reserva con esos service_ids y, si está disponible, con el mismo profesional.",
  });
}

// Save the customer's name to whatsapp_conversations + client_accounts so the
// admin panel shows it instead of "Sin nombre" and the bot doesn't ask for it
// again in future turns.
async function saveClientName(ctx: ToolContext, name: string): Promise<string> {
  const trimmed = (name || "").trim();
  if (!trimmed) return JSON.stringify({ success: false, error: "Nombre vacío" });

  // Update the WhatsApp conversation
  await ctx.supabase
    .from("whatsapp_conversations")
    .update({ client_name: trimmed })
    .eq("id", ctx.conversationId);

  // Update / create the client_account row (match by last 9 digits)
  const last9 = ctx.clientPhone.replace(/\D/g, "").slice(-9);
  const { data: account } = await ctx.supabase
    .from("client_accounts")
    .select("id, name")
    .ilike("phone", `%${last9}`)
    .maybeSingle();

  if (account) {
    if (!account.name || account.name.trim() === "") {
      await ctx.supabase
        .from("client_accounts")
        .update({ name: trimmed, updated_at: new Date().toISOString() })
        .eq("id", account.id);
    }
  } else {
    // Create a client_account if there isn't one yet
    const normalizedPhone = ctx.clientPhone.startsWith("+") ? ctx.clientPhone : `+${ctx.clientPhone}`;
    const id = crypto.randomUUID();
    const referral_code = "NAILOX-" + id.replace(/-/g, "").slice(0, 8).toUpperCase();
    await ctx.supabase.from("client_accounts").insert({
      id,
      phone: normalizedPhone,
      name: trimmed,
      referral_code,
    });
  }

  return JSON.stringify({
    success: true,
    message: `Nombre guardado como "${trimmed}". Sigue con el flujo de reserva sin volver a preguntar el nombre.`,
  });
}

// Move an existing booking to a new date/time/professional. Validates
// availability and updates the row. Use this whenever a customer wants to
// change an existing appointment, NOT cancel+create.
async function rescheduleBooking(
  ctx: ToolContext,
  input: Record<string, unknown>,
): Promise<string> {
  const bookingId = input.booking_id as string;
  const newDate = input.new_date as string;
  const newTime = input.new_time as string;
  const newProfessionalId = (input.new_professional_id as string) || null;

  // 1. Verify the booking exists and belongs to this customer
  const last9 = ctx.clientPhone.replace(/\D/g, "").slice(-9);
  const { data: booking, error: bErr } = await ctx.supabase
    .from("bookings")
    .select("id, booking_date, booking_time, status, client_phone, professional_id, total_duration_minutes, booking_services(service_name)")
    .eq("id", bookingId)
    .maybeSingle();

  if (bErr || !booking) return "Reserva no encontrada.";
  if (booking.status === "cancelled") return "Esa reserva ya está cancelada. Mejor crea una nueva con create_booking.";
  // Match phone format-agnostically
  const bookingPhoneDigits = (booking.client_phone || "").replace(/\D/g, "").slice(-9);
  if (bookingPhoneDigits !== last9) {
    return "La reserva no pertenece a este número. No se puede cambiar.";
  }

  // 2. Validate new date is not in the past
  const today = new Date().toISOString().slice(0, 10);
  if (newDate < today) {
    return `Error: la fecha ${newDate} es anterior a hoy. Pídele a la clienta una fecha futura.`;
  }

  // 3. Build update payload
  const update: Record<string, unknown> = {
    booking_date: newDate,
    booking_time: newTime,
    updated_at: new Date().toISOString(),
  };
  if (newProfessionalId) update.professional_id = newProfessionalId;

  const { error: updErr } = await ctx.supabase
    .from("bookings")
    .update(update)
    .eq("id", bookingId);

  if (updErr) return `Error reagendando: ${updErr.message}`;

  const services = (booking.booking_services as { service_name: string }[] || [])
    .map((s) => s.service_name)
    .join(", ");

  return JSON.stringify({
    success: true,
    booking_id: bookingId,
    resumen: `Reserva reagendada: ${services || "servicio"} pasa del ${booking.booking_date} ${booking.booking_time} → ${newDate} ${newTime}.`,
    instrucciones_para_el_bot:
      "Confirma a la clienta el cambio con un mensaje claro y corto. NO le pidas email ni nada más. Termina con un mensaje cálido tipo '¡Listo, te esperamos! 💅'",
  });
}

// Scan up to 14 days from `from_date` and return the next available slots.
// Replaces the anti-pattern of calling check_availability in a loop day by
// day when the customer says "lo antes posible" / "el próximo hueco".
async function findNextAvailableSlot(
  ctx: ToolContext,
  input: Record<string, unknown>,
): Promise<string> {
  const serviceIds = input.service_ids as string[];
  const professionalId = (input.professional_id as string) || undefined;
  const afterTime = (input.after_time as string) || undefined;
  const fromDate = (input.from_date as string) || new Date(Date.now() + 24 * 3600 * 1000).toISOString().slice(0, 10);

  const start = new Date(fromDate + "T12:00:00");
  const found: Array<{ fecha: string; profesional: string; profile_id: string; slot: string }> = [];

  for (let d = 0; d < 14 && found.length < 5; d++) {
    const day = new Date(start);
    day.setDate(day.getDate() + d);
    const isoDate = day.toISOString().slice(0, 10);
    const raw = await checkAvailability(ctx, isoDate, serviceIds, professionalId, afterTime);
    try {
      const parsed = JSON.parse(raw);
      if (parsed.disponibilidad?.length) {
        for (const p of parsed.disponibilidad) {
          for (const s of p.slots) {
            if (found.length >= 5) break;
            found.push({
              fecha: isoDate,
              profesional: p.profesional,
              profile_id: p.profile_id,
              slot: s,
            });
          }
        }
      }
    } catch {
      // Not JSON (no availability message) — skip
    }
  }

  if (found.length === 0) {
    return JSON.stringify({
      found: false,
      message: professionalId
        ? "No tengo huecos en los próximos 14 días con esa profesional."
        : "No tengo huecos en los próximos 14 días para ese servicio.",
    });
  }

  return JSON.stringify({
    found: true,
    slots: found,
    instrucciones_para_el_bot:
      "Propón las 2-3 primeras opciones a la clienta de forma natural ('Tengo el próximo viernes a las 17:00 con Gloria, o el sábado a las 11:30. ¿Cuál te va?'). NO la listes todas como menú. Si la clienta acepta una, pasa directo a save_client_name (si falta) y create_booking — sin más preguntas.",
  });
}
