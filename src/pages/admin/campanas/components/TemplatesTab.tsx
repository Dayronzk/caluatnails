import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Save, ToggleLeft, ToggleRight, Clock, Send, Users, Smartphone, Mail, MessageCircle, Settings2 } from "lucide-react";
import ManualSendModal from "./ManualSendModal";

const BASE_EMAIL_TEMPLATES: Record<string, string> = {
  confirmacion_cuenta: `<div style="text-align:center;"><h2>¡Bienvenida a bordo! 🚢</h2><p>Gracias por registrarte en <strong>Caluatnails</strong>. Estamos emocionados de tenerte aquí.</p><p>Para activar tu cuenta y empezar a disfrutar de nuestros servicios, por favor confirma tu email pulsando el botón:</p><div style="margin:30px 0;"><a href="{{link}}" style="background:#f43f5e;color:#fff;padding:14px 35px;border-radius:50px;text-decoration:none;font-weight:bold;box-shadow:0 10px 15px -3px rgba(244,63,94,0.3);">Activar mi cuenta</a></div><p style="font-size:12px;color:#9ca3af;">Si no creaste esta cuenta, puedes ignorar este email.</p></div>`,
  bienvenida: `<h2>¡Bienvenida a la Academia Caluatnails! 💅</h2><p>Hola <strong>{{clientName}}</strong>, nos hace muy felices que formes parte de nuestra comunidad.</p><p>Tu formación comienza hoy mismo. Hemos preparado contenido exclusivo para que lleves tu talento al siguiente nivel.</p><div style="background:#fff1f2;padding:25px;border-radius:20px;margin:25px 0;border:1px solid #fecdd3;"><h4 style="margin-top:0;color:#e11d48;">¿Qué puedes hacer ahora?</h4><ul style="margin-bottom:0;padding-left:20px;"><li>Accede a tus cursos</li><li>Descarga el material de apoyo</li><li>Únete a nuestro grupo privado</li></ul></div><p>¡Disfruta del camino!</p>`,
  recuperar_pass: `<div style="text-align:center;"><h2>¿Olvidaste tu contraseña? 🔑</h2><p>No te preocupes, suele pasar. Haz clic en el botón de abajo para elegir una nueva contraseña de forma segura:</p><div style="margin:30px 0;"><a href="{{link}}" style="background:#1e293b;color:#fff;padding:14px 35px;border-radius:50px;text-decoration:none;font-weight:bold;box-shadow:0 10px 15px -3px rgba(30,41,59,0.3);">Restablecer Contraseña</a></div><p style="font-size:12px;color:#9ca3af;">Este enlace caducará en 24 horas. Si no solicitaste este cambio, contacta con nosotros.</p></div>`,
  reserva_confirmada: `<h2>¡Cita confirmada en Caluatnails! ✅</h2><p>Hola <strong>{{clientName}}</strong>, tu cita ha sido procesada y confirmada correctamente.</p><div style="background:#f8fafc;padding:25px;border-radius:20px;margin:25px 0;border:1px solid #e2e8f0;"><p style="margin:5px 0;"><strong>Servicio:</strong> {{services}}</p><p style="margin:5px 0;"><strong>Fecha:</strong> {{bookingDate}}</p><p style="margin:5px 0;"><strong>Hora:</strong> {{bookingTime}}</p></div><p>Por favor, llega 5 minutos antes de tu cita. ¡Te esperamos con muchas ganas!</p>`,
  recordatorio_cita: `<h2>¡Mañana nos vemos! 💅</h2><p>Hola <strong>{{clientName}}</strong>, te escribimos para recordarte que mañana tienes una cita en nuestro centro.</p><div style="background:#fff1f2;padding:25px;border-radius:20px;margin:25px 0;border:2px dashed #fecdd3;text-align:center;"><p style="font-size:24px;margin:10px 0;font-weight:bold;color:#e11d48;">{{bookingTime}}</p><p style="margin:0;color:#f43f5e;font-weight:600;">{{bookingDate}}</p></div><p>Si por algún motivo no puedes asistir, avísanos cuanto antes para que alguien más pueda aprovechar el hueco.</p>`,
  nueva_reserva_admin: `<div style="border-left:4px solid #f43f5e;padding-left:20px;"><h2>🔔 Nueva Cita Agendada</h2><p>Se ha recibido una nueva reserva en el sistema.</p><div style="background:#f8fafc;padding:20px;border-radius:15px;margin:20px 0;"><strong>Cliente:</strong> {{clientName}}<br><strong>Servicios:</strong> {{services}}<br><strong>Profesional:</strong> {{professionalName}}<br><strong>Fecha:</strong> {{bookingDate}} a las {{bookingTime}}</div><p>Recuerda preparar todo para la visita.</p></div>`,
  compra_curso: `<h2>¡Acceso activado! 🎓</h2><p>Hola <strong>{{clientName}}</strong>, gracias por tu compra. Tu pago ha sido procesado correctamente y ya tienes acceso al curso.</p><div style="text-align:center;margin:30px 0;"><a href="/mi-cuenta" style="background:#f43f5e;color:#fff;padding:15px 40px;border-radius:50px;text-decoration:none;font-weight:bold;display:inline-block;">Empezar a Aprender</a></div><p>¡Esperamos que disfrutes mucho de la formación!</p>`,
  newsletter_welcome: `<h2>¡Ya eres parte de la comunidad! 🌟</h2><p>Hola, gracias por suscribirte a nuestro newsletter. A partir de ahora serás la primera en recibir:</p><ul style="color:#4b5563;"><li>Ofertas exclusivas de último minuto</li><li>Nuevos lanzamientos de cursos</li><li>Tips de manicura y diseño</li></ul><p>¡Nos vemos en el próximo correo!</p>`,
  cancelacion_reserva: `<h2>Cita cancelada ❌</h2><p>Hola <strong>{{clientName}}</strong>, te informamos que tu cita ha sido cancelada.</p><div style="background:#fef2f2;padding:20px;border-radius:15px;margin:20px 0;color:#991b1b;">Sentimos que no hayas podido asistir. Esperamos poder verte en otra ocasión pronto.</div><p>Puedes volver a reservar en cualquier momento desde nuestra web.</p>`,
  feliz_cumple: `<div style="text-align:center;"><h2>¡Feliz Cumpleaños! 🎂✨</h2><p>Hola <strong>{{clientName}}</strong>, hoy es tu día especial y en Caluatnails queremos celebrarlo contigo.</p><div style="padding:30px;background:linear-gradient(45deg,#fff1f2,#fdf2f4);border-radius:30px;margin:25px 0;"><p style="font-size:18px;margin:0;">Tienes un <strong>Regalo Especial</strong> esperándote</p><p style="font-size:32px;font-weight:black;color:#f43f5e;margin:15px 0;">20% OFF</p><p style="font-size:12px;color:#f43f5e;">Válido durante todo el mes de tu cumple</p></div><p>¡Disfruta mucho de tu día!</p></div>`,
  pedir_resena: `<h2>¿Qué tal te ha ido hoy? ⭐</h2><p>Hola <strong>{{clientName}}</strong>, ha sido un placer atenderte hoy. En Caluatnails nos esforzamos por darte lo mejor, y tu opinión nos ayuda muchísimo.</p><p>¿Podrías dedicarnos 1 minuto para dejarnos una reseña?</p><div style="text-align:center;margin:30px 0;"><a href="https://g.page/caluatnails/review" style="background:#facc15;color:#000;padding:14px 35px;border-radius:50px;text-decoration:none;font-weight:bold;">Dejar mi opinión ⭐⭐⭐⭐⭐</a></div><p>¡Gracias por tu confianza!</p>`,
  reactivacion: `<div style="text-align:center;"><h2>¡Te echamos de menos! 💕</h2><p>Hola <strong>{{clientName}}</strong>, hace tiempo que no nos visitas y tus uñas te extrañan.</p><p>Queremos motivarte a volver con un detalle exclusivo:</p><div style="background:#fdf2f4;padding:20px;border-radius:20px;margin:20px 0;border:1px solid #fecdd3;"><p style="margin:0;font-weight:600;">Reserva esta semana y llévate un tratamiento de hidratación de regalo</p></div><div style="margin:30px 0;"><a href="/" style="background:#f43f5e;color:#fff;padding:14px 35px;border-radius:50px;text-decoration:none;font-weight:bold;">Quiero reservar ya</a></div></div>`,
  puntos_ganados: `<h2>¡Has ganado puntos! 🌟</h2><p>Hola <strong>{{clientName}}</strong>, ¡enhorabuena! Has acumulado nuevos puntos tras tu última visita.</p><div style="background:#fefce8;padding:25px;border-radius:25px;text-align:center;border:1px solid #fef08a;margin:25px 0;"><p style="font-size:12px;text-transform:uppercase;letter-spacing:1px;margin-bottom:5px;">Tu nuevo saldo es de</p><p style="font-size:48px;font-weight:black;color:#ca8a04;margin:0;">{{points}} pts</p></div><p>Sigue acumulando para canjearlos por servicios gratis.</p>`,
  nuevo_servicio: `<h2>✨ ¡Algo nuevo llega a Caluatnails!</h2><p>Hola <strong>{{clientName}}</strong>, estamos constantemente innovando para ti. Acabamos de lanzar:</p><div style="overflow:hidden;border-radius:20px;background:#f8fafc;margin:25px 0;"><div style="padding:25px;"><h3>{{serviceName}}</h3><p>{{serviceDesc}}</p><a href="/" style="color:#f43f5e;font-weight:bold;text-decoration:none;">Descubrir más →</a></div></div>`,
  promocion: `<h2>🎉 ¡Oferta exclusiva para ti!</h2><p>Hola <strong>{{clientName}}</strong>, solo por tiempo limitado disfruta de esta promoción especial en nuestro centro.</p><div style="background:linear-gradient(135deg,#f43f5e,#fb7185);padding:40px;border-radius:30px;color:#fff;text-align:center;margin:25px 0;"><h2 style="margin:0;font-size:40px;">-30%</h2><p style="margin:5px 0;">En tu próximo servicio de Nail Art</p><div style="background:rgba(255,255,255,0.2);padding:10px;border-radius:10px;margin-top:20px;border:1px dashed #fff;">CÓDIGO: LOVE-NAILS</div></div>`,
  staff_30min: `<h2>⏰ Cita en 30 minutos</h2><p>Recordatorio interno: <strong>{{clientName}}</strong> tiene una cita programada para dentro de media hora.</p><div style="background:#fff7ed;padding:20px;border-radius:15px;margin:20px 0;border-left:4px solid #f97316;"><strong>Hora:</strong> {{bookingTime}}<br><strong>Servicio:</strong> {{services}}<br><strong>Profesional:</strong> {{professionalName}}</div>`,
  custom: `<h2>Hola {{clientName}} 👋</h2><p>Te enviamos este mensaje personalizado de parte del equipo de <strong>Caluatnails</strong>.</p><div style="padding:25px;background:#f8fafc;border-radius:20px;margin:25px 0;line-height:1.6;">{{customMessage}}</div><p>Si tienes cualquier duda, estamos a tu disposición.</p>`
};

const TYPE_META: Record<string, { label: string; icon: string; color: string; desc: string; eventName: string }> = {
  signup_confirmation:    { label: "Confirmar cuenta",            icon: "ri-user-add-line",         color: "bg-blue-50 text-blue-600",    desc: "Se envía cuando alguien se registra. Enlace real de Supabase.", eventName: "el registro" },
  welcome:                { label: "Bienvenida",                  icon: "ri-magic-line",            color: "bg-emerald-50 text-emerald-600", desc: "Se envía al crear una cuenta automáticamente tras reserva.", eventName: "la bienvenida" },
  password_reset:         { label: "Recuperar contraseña",        icon: "ri-key-line",              color: "bg-rose-50 text-rose-600",    desc: "Se envía al solicitar restablecer contraseña.", eventName: "la recuperación" },
  appointment_confirmation:{ label: "Confirmación de Cita",       icon: "ri-checkbox-circle-line",  color: "bg-emerald-50 text-emerald-600", desc: "Se envía al confirmar una nueva reserva.", eventName: "la reserva" },
  appointment_reminder:   { label: "Recordatorio de Cita",        icon: "ri-calendar-check-line",   color: "bg-blue-50 text-blue-600",    desc: "Recordatorio automático o manual antes de la cita.", eventName: "la cita" },
  booking_reminder:       { label: "Recordatorio de Cita (Alt)",  icon: "ri-calendar-check-line",   color: "bg-blue-50 text-blue-600",    desc: "Recordatorio enviado manualmente desde la agenda.", eventName: "la cita" },
  review_request:         { label: "Pedir Reseña ⭐",              icon: "ri-star-line",             color: "bg-amber-50 text-amber-600",   desc: "Se envía X horas después de completada la cita.", eventName: "la cita" },
  reactivation:           { label: "Reactivación de Cliente",     icon: "ri-heart-pulse-line",      color: "bg-rose-50 text-rose-600",    desc: "Se envía cuando un cliente lleva mucho tiempo sin visitar.", eventName: "la última visita" },
  birthday:               { label: "Feliz Cumpleaños 🎂",         icon: "ri-cake-line",             color: "bg-purple-50 text-purple-600", desc: "Se envía el día del cumpleaños del cliente.", eventName: "el cumpleaños" },
  purchase_confirmation:  { label: "Confirmación de Compra",      icon: "ri-shopping-bag-line",     color: "bg-indigo-50 text-indigo-600", desc: "Se envía tras comprar el curso online vía Stripe.", eventName: "la compra" },
  newsletter_welcome:     { label: "Bienvenida newsletter",       icon: "ri-mail-star-line",        color: "bg-teal-50 text-teal-600",    desc: "Se envía al suscribirse al newsletter desde la web.", eventName: "la suscripción" },
  cancellation:           { label: "Cancelación de Cita ❌",      icon: "ri-calendar-close-line",   color: "bg-red-50 text-red-500",      desc: "Se envía cuando se cancela una reserva.", eventName: "la cita" },
  booking_cancelled:      { label: "Cancelación de Cita (Alt)",   icon: "ri-calendar-close-line",   color: "bg-red-50 text-red-500",      desc: "Se envía al cancelar reserva desde la agenda.", eventName: "la cita" },
  promotion:              { label: "Promoción Especial 🎉",       icon: "ri-megaphone-line",        color: "bg-orange-50 text-orange-600", desc: "Oferta o descuento puntual, uso manual en campañas.", eventName: "el evento" },
  new_service:            { label: "Nuevo Servicio ✨",            icon: "ri-scissors-line",         color: "bg-teal-50 text-teal-600",    desc: "Avisa cuando hay un servicio nuevo disponible.", eventName: "el evento" },
  points_earned:          { label: "Puntos Ganados 🌟",           icon: "ri-coin-line",             color: "bg-yellow-50 text-yellow-600", desc: "Se envía al acumular puntos tras una visita o compra.", eventName: "la compra" },
  staff_new_booking:      { label: "Nueva Cita (Staff) 👤",        icon: "ri-user-follow-line",      color: "bg-indigo-50 text-indigo-600", desc: "Aviso al admin y profesional cuando se agenda una cita.", eventName: "la cita" },
  booking_new_admin:      { label: "Nueva Cita (Admin)",          icon: "ri-notification-3-line",   color: "bg-indigo-50 text-indigo-600", desc: "Notificación interna de nueva reserva pagada.", eventName: "la cita" },
  staff_reminder_30min:   { label: "Recordatorio 30min (Staff) ⏰", icon: "ri-timer-line",            color: "bg-orange-50 text-orange-600", desc: "Aviso al admin y profesional 30 min antes de la cita.", eventName: "la cita" },
  custom:                 { label: "Mensaje Personalizado",       icon: "ri-edit-line",             color: "bg-gray-100 text-gray-600",   desc: "Plantilla libre para uso manual en campañas.", eventName: "el evento" },
};

export default function TemplatesTab() {
  const [templates, setTemplates] = useState<any[]>([]);
  const [editing, setEditing] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);
  const [edits, setEdits] = useState<Record<string, any>>({});
  const [sendModal, setSendModal] = useState<{ title: string; body: string; defaultEmailBody?: string; url: string; type: string } | null>(null);
  const [filterAudience, setFilterAudience] = useState<string>("all");
  const [search, setSearch] = useState("");

  const [isCreating, setIsCreating] = useState(false);
  const [newTemplate, setNewTemplate] = useState({
    name: "",
    title: "",
    body: "",
    email_body: "",
    type: "custom",
    target_audience: "client",
    channels: ["push"],
    trigger_hours: 0
  });

  const [previewHtml, setPreviewHtml] = useState<string | null>(null);

  useEffect(() => { load(); }, []);

  const wrapForPreview = (content: string) => {
    return `
      <!DOCTYPE html>
      <html>
        <head><meta charset="UTF-8"></head>
        <body style="margin:0;padding:0;background:#fdf2f4;font-family:sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;">
            <tr><td align="center">
              <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:20px;overflow:hidden;border:1px solid #fce7eb;">
                <tr><td style="background:linear-gradient(135deg,#f43f5e,#fb7185);padding:30px;text-align:center;"><span style="font-size:24px;font-weight:700;letter-spacing:4px;color:#ffffff;">CALUATNAILS</span></td></tr>
                <tr><td style="padding:30px;">${content}</td></tr>
                <tr><td style="background:#fdf2f4;padding:20px;text-align:center;border-top:1px solid #fce7eb;color:#9ca3af;font-size:11px;">© 2026 Caluatnails — Sistema de Notificaciones</td></tr>
              </table>
            </td></tr>
          </table>
        </body>
      </html>
    `.replace(/{{clientName}}/g, 'Dayron')
     .replace(/{{bookingTime}}/g, '14:30')
     .replace(/{{bookingDate}}/g, '15 de Mayo')
     .replace(/{{services}}/g, 'Manicura Rusa + Nail Art');
  };

  const load = async () => {
    const { data } = await supabase.from("notification_templates").select("*").order("type");
    setTemplates(data || []);
  };

  const createTemplate = async () => {
    if (!newTemplate.name || !newTemplate.title || !newTemplate.body) return;
    setSaving("new");
    const { error } = await supabase.from("notification_templates").insert([{
      ...newTemplate,
      type: `custom_${Date.now()}`,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }]);

    if (!error) {
      setIsCreating(false);
      setNewTemplate({ name: "", title: "", body: "", email_body: "", type: "custom", target_audience: "client", channels: ["push"], trigger_hours: 0 });
      load();
    }
    setSaving(null);
  };

  const filtered = templates.filter(t => {
    const target = t.target_audience || (t.type.startsWith('staff_') ? 'admin' : 'client');
    if (filterAudience !== "all" && target !== filterAudience) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!t.title.toLowerCase().includes(q) && !t.body.toLowerCase().includes(q) && !t.type.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const toggleActive = async (t: any) => {
    await supabase.from("notification_templates").update({ is_active: !t.is_active, updated_at: new Date().toISOString() }).eq("id", t.id);
    load();
  };

  const startEdit = (t: any) => {
    setEdits(prev => ({ 
      ...prev, 
      [t.id]: { 
        title: t.title, 
        body: t.body, 
        email_body: t.email_body || "",
        url: t.url, 
        trigger_hours: t.trigger_hours,
        target_audience: t.target_audience || (t.type.startsWith('staff_') ? 'admin' : 'client'),
        channels: t.channels || ['push']
      } 
    }));
    setEditing(t.id);
  };

  const save = async (id: string) => {
    setSaving(id);
    const updateData = edits[id];
    
    try {
      const { error } = await supabase.from("notification_templates").update({ 
        title: updateData.title,
        body: updateData.body,
        email_body: updateData.email_body,
        url: updateData.url,
        trigger_hours: Number(updateData.trigger_hours),
        target_audience: updateData.target_audience,
        channels: updateData.channels,
        updated_at: new Date().toISOString() 
      }).eq("id", id);
      
      if (error) {
        console.error("Save error:", error);
        // Fallback if columns are missing from cache
        if (error.message.includes("column")) {
           const { error: error2 } = await supabase.from("notification_templates").update({ 
            title: updateData.title,
            body: updateData.body,
            email_body: updateData.email_body,
            url: updateData.url,
            trigger_hours: Number(updateData.trigger_hours),
            updated_at: new Date().toISOString() 
          }).eq("id", id);
          if (error2) throw error2;
        } else {
          throw error;
        }
      }

      setEditing(null);
      load();
    } catch (err: any) {
      alert("Error al guardar: " + (err.message || "Error desconocido"));
    } finally {
      setSaving(null);
    }
  };

  const toggleChannel = (id: string, channel: string) => {
    setEdits(p => {
      const current = p[id].channels || ['push'];
      const next = current.includes(channel) 
        ? current.filter((c: string) => c !== channel) 
        : [...current, channel];
      return { ...p, [id]: { ...p[id], channels: next.length ? next : ['push'] } };
    });
  };

  return (
    <div className="space-y-4 pb-20">
      <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex gap-3">
        <i className="ri-information-line text-blue-500 text-lg mt-0.5 flex-shrink-0" />
        <p className="text-sm text-blue-700 font-medium">
          Configura el contenido y el <strong>funcionamiento</strong> de cada aviso. Decide quién lo recibe, por qué canales y en qué momento se dispara.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3 bg-white p-2 border border-gray-100 rounded-[1.5rem] shadow-sm">
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
          {[
            { id: 'all', label: 'Todas' },
            { id: 'client', label: 'Clientas' },
            { id: 'admin', label: 'Admins' },
            { id: 'professional', label: 'Staff' },
          ].map(f => (
            <button key={f.id} onClick={() => setFilterAudience(f.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                filterAudience === f.id ? "bg-white text-gray-900 shadow-sm" : "text-gray-400 hover:text-gray-600"
              }`}>
              {f.label}
            </button>
          ))}
        </div>
        <div className="relative flex-1 min-w-[200px]">
          <input 
            type="text" 
            placeholder="Buscar por título o contenido..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-4 pr-4 py-2 text-xs bg-gray-50 border border-transparent rounded-xl outline-none focus:bg-white focus:border-rose-100 transition-all font-medium"
          />
        </div>
        <button 
          onClick={() => setIsCreating(!isCreating)}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-lg ${
            isCreating 
              ? "bg-gray-100 text-gray-600 shadow-none" 
              : "bg-gray-900 text-white shadow-gray-200 hover:bg-black hover:-translate-y-0.5"
          }`}
        >
          {isCreating ? "Cancelar" : <><i className="ri-add-line text-lg" /> Nuevo Mensaje</>}
        </button>
      </div>

      {/* Create New Template Form */}
      {isCreating && (
        <div className="bg-white rounded-[2rem] border-2 border-rose-100 p-8 shadow-xl shadow-rose-500/5 animate-in zoom-in-95 duration-300">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center shadow-sm">
              <i className="ri-magic-line text-2xl" />
            </div>
            <div>
              <h3 className="text-xl font-black text-gray-900">Crear Nueva Plantilla</h3>
              <p className="text-xs text-gray-400 font-medium">Diseña un nuevo mensaje para tus campañas o avisos</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <p className="text-[10px] font-black text-rose-500 uppercase tracking-[0.2em] mb-2">Identificación y Contenido</p>
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">Nombre Interno (Solo tú lo ves)</label>
                <input type="text" placeholder="Ej: Promo Verano 2024" value={newTemplate.name} onChange={ev => setNewTemplate({...newTemplate, name: ev.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm font-medium outline-none focus:ring-4 focus:ring-rose-500/10 focus:border-rose-500 transition-all" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">Asunto / Título del Mensaje</label>
                <input type="text" placeholder="¡No te pierdas esto!" value={newTemplate.title} onChange={ev => setNewTemplate({...newTemplate, title: ev.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm font-medium outline-none focus:ring-4 focus:ring-rose-500/10 focus:border-rose-500 transition-all" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">Cuerpo del Mensaje (Push/WhatsApp)</label>
                <textarea rows={4} placeholder="Hola {{clientName}}, tenemos algo para ti..." value={newTemplate.body} onChange={ev => setNewTemplate({...newTemplate, body: ev.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm font-medium outline-none focus:ring-4 focus:ring-rose-500/10 focus:border-rose-500 resize-none transition-all leading-relaxed" />
                <p className="text-[10px] text-gray-400 mt-2 font-medium">Puedes usar: {"{{clientName}}"}, {"{{bookingTime}}"}, {"{{bookingDate}}"}, {"{{professionalName}}"}, {"{{services}}"}, {"{{totalPrice}}"}, {"{{points}}"}, {"{{link}}"}</p>
              </div>
              {newTemplate.channels.includes('email') && (
                <div className="animate-in slide-in-from-left-4 duration-500">
                  <div className="space-y-4 mb-4">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-black text-blue-500 uppercase tracking-widest block flex items-center gap-2">
                        <Mail className="w-3 h-3" /> Diseño del Email (HTML)
                      </label>
                      <button onClick={() => setPreviewHtml(newTemplate.email_body)} 
                        className="px-4 py-2 text-[10px] font-black bg-rose-500 text-white rounded-xl shadow-lg shadow-rose-200 hover:bg-rose-600 transition-all flex items-center gap-2 uppercase tracking-wider">
                        <i className="ri-eye-line text-xs" /> Ver Previa
                      </button>
                    </div>

                    <div className="bg-gray-50/50 border border-gray-100 rounded-[1.5rem] p-4">
                      <p className="text-[9px] font-bold text-gray-400 uppercase tracking-[0.15em] mb-3 px-1">Librería de Diseños Base</p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                        {[
                          { id: 'confirmacion_cuenta', label: 'Cuenta', icon: 'ri-user-follow-line' },
                          { id: 'bienvenida', label: 'Bienvenida', icon: 'ri-magic-line' },
                          { id: 'recuperar_pass', label: 'Pass', icon: 'ri-key-line' },
                          { id: 'reserva_confirmada', label: 'Reserva', icon: 'ri-calendar-check-line' },
                          { id: 'recordatorio_cita', label: 'Recordatorio', icon: 'ri-timer-line' },
                          { id: 'nueva_reserva_admin', label: 'Admin', icon: 'ri-notification-3-line' },
                          { id: 'compra_curso', label: 'Curso', icon: 'ri-graduation-cap-line' },
                          { id: 'newsletter_welcome', label: 'News', icon: 'ri-mail-send-line' },
                          { id: 'cancelacion_reserva', label: 'Cancel', icon: 'ri-close-circle-line' },
                          { id: 'feliz_cumple', label: 'Cumple', icon: 'ri-cake-3-line' },
                          { id: 'pedir_resena', label: 'Reseña', icon: 'ri-star-line' },
                          { id: 'reactivacion', label: 'Volver', icon: 'ri-heart-pulse-line' },
                          { id: 'puntos_ganados', label: 'Puntos', icon: 'ri-coin-line' },
                          { id: 'nuevo_servicio', label: 'Nuevo', icon: 'ri-sparkling-line' },
                          { id: 'promocion', label: 'Promo', icon: 'ri-megaphone-line' },
                          { id: 'staff_30min', label: '30min', icon: 'ri-alarm-warning-line' },
                          { id: 'custom', label: 'Libre', icon: 'ri-edit-line' },
                        ].map(t => (
                          <button key={t.id} type="button" onClick={() => setNewTemplate({...newTemplate, email_body: BASE_EMAIL_TEMPLATES[t.id]})}
                            className="flex flex-col items-center gap-1.5 p-2.5 rounded-xl bg-white border border-gray-100 shadow-sm hover:border-blue-400 hover:text-blue-600 transition-all group">
                            <i className={`${t.icon} text-lg text-gray-400 group-hover:text-blue-500 transition-colors`} />
                            <span className="text-[9px] font-black uppercase tracking-tight">{t.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                  <textarea rows={6} placeholder="<h1>Hola!</h1><p>Diseño en HTML...</p>" value={newTemplate.email_body} onChange={ev => setNewTemplate({...newTemplate, email_body: ev.target.value})}
                    className="w-full px-4 py-3 rounded-xl border border-blue-100 bg-blue-50/30 text-sm font-medium outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-400 resize-none transition-all leading-relaxed" />
                  <p className="text-[10px] text-blue-400 mt-2 font-medium italic">Si lo dejas vacío, se usará el cuerpo estándar en formato plano.</p>
                </div>
              )}
            </div>

            <div className="space-y-6">
              <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em] mb-2">Configuración de Envío</p>
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">¿A quién va dirigido?</label>
                  <select value={newTemplate.target_audience} onChange={ev => setNewTemplate({...newTemplate, target_audience: ev.target.value})}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm font-bold outline-none focus:border-indigo-500 appearance-none bg-gray-50">
                    <option value="client">Clientas</option>
                    <option value="admin">Administradores</option>
                    <option value="professional">Profesionales del equipo</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">Canales de envío</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'push', label: 'Push', icon: Smartphone, color: 'violet' },
                      { id: 'email', label: 'Email', icon: Mail, color: 'blue' },
                      { id: 'whatsapp', label: 'WhatsApp', icon: MessageCircle, color: 'emerald' },
                    ].map(c => {
                      const Icon = c.icon;
                      const isActive = newTemplate.channels.includes(c.id);
                      return (
                        <button key={c.id} onClick={() => {
                          const next = isActive ? newTemplate.channels.filter(id => id !== c.id) : [...newTemplate.channels, c.id];
                          setNewTemplate({...newTemplate, channels: next.length ? next : ['push']});
                        }}
                          className={`flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all ${isActive ? `border-${c.color}-500 bg-${c.color}-50 text-${c.color}-600` : 'border-gray-50 bg-gray-50/50 text-gray-400 hover:border-gray-200'}`}>
                          <Icon className="w-5 h-5" />
                          <span className="text-[9px] font-bold uppercase">{c.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-100 flex gap-4">
            <button onClick={() => setIsCreating(false)} className="px-8 py-4 text-sm font-bold text-gray-400 hover:text-gray-900 transition-colors">Cancelar</button>
            <button 
              onClick={createTemplate}
              disabled={saving === 'new' || !newTemplate.name || !newTemplate.title || !newTemplate.body}
              className="flex-1 py-4 bg-gray-900 text-white rounded-2xl text-sm font-bold shadow-xl shadow-gray-200 hover:bg-black transition-all disabled:opacity-50"
            >
              {saving === 'new' ? "Creando..." : "Crear Plantilla Ahora"}
            </button>
          </div>
        </div>
      )}

      {filtered.map(t => {
        const meta = TYPE_META[t.type] || TYPE_META.custom;
        const isEditing = editing === t.id;
        const e = edits[t.id] || {};
        const channels = e.channels || t.channels || ['push'];
        const target = e.target_audience || t.target_audience || (t.type.startsWith('staff_') ? 'admin' : 'client');

        return (
          <div key={t.id} className={`bg-white rounded-[2rem] border transition-all ${isEditing ? "border-rose-200 shadow-xl shadow-rose-100/20 ring-1 ring-rose-100" : "border-gray-100 shadow-sm"}`}>
            <div className="p-6 flex items-center justify-between gap-4">
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${meta.color} shadow-sm`}>
                  <i className={`${meta.icon} text-xl`} />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="font-bold text-gray-900 text-base">{meta.label}</p>
                    {t.is_active && <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />}
                  </div>
                  <p className="text-xs text-gray-400 font-medium">{meta.desc}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                {!isEditing && (
                  <>
                    <button
                      onClick={() => setSendModal({ title: t.title, body: t.body, defaultEmailBody: t.email_body, url: t.url || 'https://www.caluatnails.com', type: t.type })}
                      className="flex items-center gap-2 text-xs font-bold bg-gradient-to-r from-rose-500 to-pink-600 text-white px-4 py-2 rounded-xl shadow-md shadow-rose-200 hover:shadow-lg transition-all hover:-translate-y-0.5 active:translate-y-0">
                      <Send className="w-3.5 h-3.5" /> Probar Envío
                    </button>
                    <button onClick={() => startEdit(t)} className="flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-gray-900 px-4 py-2 rounded-xl hover:bg-gray-50 transition-all border border-transparent hover:border-gray-100">
                      <Settings2 className="w-3.5 h-3.5" /> Configurar
                    </button>
                  </>
                )}
                <button onClick={() => toggleActive(t)} className="transition-all hover:scale-105 active:scale-95">
                  {t.is_active ? <ToggleRight className="w-8 h-8 text-emerald-500" /> : <ToggleLeft className="w-8 h-8 text-gray-300" />}
                </button>
              </div>
            </div>

            {!isEditing && (
              <div className="px-6 pb-6 pt-0">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                  <div className="bg-gray-50/50 border border-gray-100 rounded-xl p-3">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Destinatario</p>
                    <div className="flex items-center gap-2 text-xs font-bold text-gray-700">
                      <Users className="w-3 h-3" />
                      {target === 'client' ? 'Clientes' : target === 'admin' ? 'Administradores' : 'Profesionales'}
                    </div>
                  </div>
                  <div className="bg-gray-50/50 border border-gray-100 rounded-xl p-3">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Canales Activos</p>
                    <div className="flex gap-2">
                      {channels.map((c: string) => (
                        <div key={c} className="bg-white border border-gray-100 px-2 py-0.5 rounded-md flex items-center gap-1 shadow-sm">
                          {c === 'push' && <Smartphone className="w-2.5 h-2.5 text-violet-500" />}
                          {c === 'email' && <Mail className="w-2.5 h-2.5 text-blue-500" />}
                          {c === 'whatsapp' && <MessageCircle className="w-2.5 h-2.5 text-emerald-500" />}
                          <span className="text-[9px] font-bold text-gray-600 uppercase">{c}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="bg-gray-50/50 border border-gray-100 rounded-xl p-3">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Activador</p>
                    <div className="flex items-center gap-1.5 text-xs font-bold text-gray-700">
                      <Clock className="w-3 h-3" />
                      {t.trigger_hours === null ? "Evento inmediato" : 
                       t.trigger_hours < 0 ? `${Math.abs(t.trigger_hours * 60).toFixed(0)} min antes de ${meta.eventName}` : `${t.trigger_hours}h después de ${meta.eventName}`}
                    </div>
                  </div>
                </div>
                <div className="bg-rose-50/30 rounded-2xl p-4 border border-rose-100/50">
                  <p className="text-xs font-bold text-rose-600 mb-1">"{t.title}"</p>
                  <p className="text-[11px] text-gray-500 leading-relaxed">{t.body}</p>
                </div>
              </div>
            )}

            {isEditing && (
              <div className="px-6 pb-8 pt-4 border-t border-gray-50 space-y-6 animate-in slide-in-from-top-2 duration-300">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <p className="text-[10px] font-black text-rose-500 uppercase tracking-[0.2em] mb-2">Contenido del Mensaje</p>
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">Asunto / Título</label>
                      <input type="text" value={e.title || ""} onChange={ev => setEdits(p => ({ ...p, [t.id]: { ...p[t.id], title: ev.target.value } }))}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm font-medium outline-none focus:ring-4 focus:ring-rose-500/10 focus:border-rose-500 transition-all" />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">Cuerpo del mensaje (Push/WhatsApp)</label>
                      <textarea rows={4} value={e.body || ""} onChange={ev => setEdits(p => ({ ...p, [t.id]: { ...p[t.id], body: ev.target.value } }))}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm font-medium outline-none focus:ring-4 focus:ring-rose-500/10 focus:border-rose-500 resize-none transition-all leading-relaxed" />
                      <p className="text-[10px] text-gray-400 mt-2 font-medium">Puedes usar: {"{{clientName}}"}, {"{{bookingTime}}"}, {"{{bookingDate}}"}, {"{{professionalName}}"}, {"{{services}}"}, {"{{totalPrice}}"}, {"{{points}}"}, {"{{link}}"}</p>
                    </div>
                    {channels.includes('email') && (
                      <div className="animate-in slide-in-from-left-4 duration-500 space-y-4">
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] font-black text-blue-500 uppercase tracking-widest block flex items-center gap-2">
                            <Mail className="w-3 h-3" /> Diseño del Email (HTML)
                          </label>
                          <button onClick={() => setPreviewHtml(e.email_body || "")} 
                            className="px-4 py-2 text-[10px] font-black bg-rose-500 text-white rounded-xl shadow-lg shadow-rose-200 hover:bg-rose-600 transition-all flex items-center gap-2 uppercase tracking-wider">
                            <i className="ri-eye-line text-xs" /> Ver Previa
                          </button>
                        </div>

                        <div className="bg-gray-50/50 border border-gray-100 rounded-[1.5rem] p-4">
                          <p className="text-[9px] font-bold text-gray-400 uppercase tracking-[0.15em] mb-3 px-1">Librería de Diseños Base</p>
                          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                            {[
                              { id: 'confirmacion_cuenta', label: 'Cuenta', icon: 'ri-user-follow-line' },
                              { id: 'bienvenida', label: 'Bienvenida', icon: 'ri-magic-line' },
                              { id: 'recuperar_pass', label: 'Pass', icon: 'ri-key-line' },
                              { id: 'reserva_confirmada', label: 'Reserva', icon: 'ri-calendar-check-line' },
                              { id: 'recordatorio_cita', label: 'Recordatorio', icon: 'ri-timer-line' },
                              { id: 'nueva_reserva_admin', label: 'Admin', icon: 'ri-notification-3-line' },
                              { id: 'compra_curso', label: 'Curso', icon: 'ri-graduation-cap-line' },
                              { id: 'newsletter_welcome', label: 'News', icon: 'ri-mail-send-line' },
                              { id: 'cancelacion_reserva', label: 'Cancel', icon: 'ri-close-circle-line' },
                              { id: 'feliz_cumple', label: 'Cumple', icon: 'ri-cake-3-line' },
                              { id: 'pedir_resena', label: 'Reseña', icon: 'ri-star-line' },
                              { id: 'reactivacion', label: 'Volver', icon: 'ri-heart-pulse-line' },
                              { id: 'puntos_ganados', label: 'Puntos', icon: 'ri-coin-line' },
                              { id: 'nuevo_servicio', label: 'Nuevo', icon: 'ri-sparkling-line' },
                              { id: 'promocion', label: 'Promo', icon: 'ri-megaphone-line' },
                              { id: 'staff_30min', label: '30min', icon: 'ri-alarm-warning-line' },
                              { id: 'custom', label: 'Libre', icon: 'ri-edit-line' },
                            ].map(libItem => (
                              <button key={libItem.id} type="button" onClick={() => setEdits(p => ({ ...p, [t.id]: { ...p[t.id], email_body: BASE_EMAIL_TEMPLATES[libItem.id] } }))}
                                className="flex flex-col items-center gap-1.5 p-2.5 rounded-xl bg-white border border-gray-100 shadow-sm hover:border-blue-400 hover:text-blue-600 transition-all group">
                                <i className={`${libItem.icon} text-lg text-gray-400 group-hover:text-blue-500 transition-colors`} />
                                <span className="text-[9px] font-black uppercase tracking-tight">{libItem.label}</span>
                              </button>
                            ))}
                          </div>
                        </div>

                        <textarea rows={6} value={e.email_body || ""} onChange={ev => setEdits(p => ({ ...p, [t.id]: { ...p[t.id], email_body: ev.target.value } }))}
                          className="w-full px-4 py-3 rounded-xl border border-blue-100 bg-blue-50/30 text-sm font-medium outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-400 resize-none transition-all leading-relaxed" />
                        <p className="text-[10px] text-blue-400 mt-2 font-medium italic">Si lo dejas vacío, se usará el cuerpo estándar en formato plano.</p>
                      </div>
                    )}
                  </div>

                  <div className="space-y-6">
                    <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em] mb-2">Funcionamiento y Lógica</p>
                    <div className="space-y-4">
                      <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">¿A quién va dirigido?</label>
                        <select value={e.target_audience || "client"} onChange={ev => setEdits(p => ({ ...p, [t.id]: { ...p[t.id], target_audience: ev.target.value } }))}
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm font-bold outline-none focus:border-indigo-500 appearance-none bg-gray-50">
                          <option value="client">Clientas</option>
                          <option value="admin">Administradores</option>
                          <option value="professional">Profesionales del equipo</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">Activador del Mensaje</label>
                        <div className="flex flex-wrap items-center gap-2">
                          <input type="number" step="any" value={Math.abs(e.trigger_val || (e.trigger_hours < 0 ? Math.abs(e.trigger_hours) : e.trigger_hours) || 0)} 
                            onChange={ev => {
                              const val = parseFloat(ev.target.value) || 0;
                              const currentType = e.trigger_type || (e.trigger_hours < 0 ? 'before' : 'after');
                              const currentUnit = e.trigger_unit || 'hours';
                              const realHours = currentUnit === 'minutes' ? val / 60 : val;
                              setEdits(p => ({ ...p, [t.id]: { ...p[t.id], trigger_val: val, trigger_hours: currentType === 'before' ? -realHours : realHours }}));
                            }}
                            className="w-20 px-4 py-3 rounded-xl border border-gray-200 text-sm font-bold outline-none focus:border-indigo-500" />
                          <select value={e.trigger_unit || 'hours'} onChange={ev => {
                              const unit = ev.target.value;
                              const val = e.trigger_val || (e.trigger_hours < 0 ? Math.abs(e.trigger_hours) : e.trigger_hours) || 0;
                              const currentType = e.trigger_type || (e.trigger_hours < 0 ? 'before' : 'after');
                              const realHours = unit === 'minutes' ? val / 60 : val;
                              setEdits(p => ({ ...p, [t.id]: { ...p[t.id], trigger_unit: unit, trigger_hours: currentType === 'before' ? -realHours : realHours }}));
                            }} className="px-3 py-3 rounded-xl border border-gray-200 text-xs font-bold bg-gray-50 outline-none">
                            <option value="minutes">Minutos</option>
                            <option value="hours">Horas</option>
                          </select>
                          <select value={e.trigger_type || (e.trigger_hours < 0 ? 'before' : 'after')} onChange={ev => {
                              const type = ev.target.value;
                              const val = e.trigger_val || (e.trigger_hours < 0 ? Math.abs(e.trigger_hours) : e.trigger_hours) || 0;
                              const currentUnit = e.trigger_unit || 'hours';
                              const realHours = currentUnit === 'minutes' ? val / 60 : val;
                              setEdits(p => ({ ...p, [t.id]: { ...p[t.id], trigger_type: type, trigger_hours: type === 'before' ? -realHours : realHours }}));
                            }} className="px-3 py-3 rounded-xl border border-gray-200 text-xs font-bold bg-gray-50 outline-none">
                            <option value="before">Antes de {meta.eventName}</option>
                            <option value="after">Después de {meta.eventName}</option>
                          </select>
                        </div>
                        <p className="text-[10px] text-gray-400 mt-2 font-medium">
                          Valor guardado: <span className="font-bold text-indigo-500">{Number(e.trigger_hours || 0).toFixed(2)}h</span>
                        </p>
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">Canales de envío</label>
                        <div className="grid grid-cols-3 gap-2">
                          {[
                            { id: 'push', label: 'Push', icon: Smartphone, color: 'violet' },
                            { id: 'email', label: 'Email', icon: Mail, color: 'blue' },
                            { id: 'whatsapp', label: 'WhatsApp', icon: MessageCircle, color: 'emerald' },
                          ].map(c => {
                            const Icon = c.icon;
                            const isActive = (e.channels || []).includes(c.id);
                            return (
                              <button key={c.id} onClick={() => toggleChannel(t.id, c.id)}
                                className={`flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all ${isActive ? `border-${c.color}-500 bg-${c.color}-50 text-${c.color}-600` : 'border-gray-50 bg-gray-50/50 text-gray-400 hover:border-gray-200'}`}>
                                <Icon className="w-5 h-5" />
                                <span className="text-[9px] font-bold uppercase">{c.label}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-4 border-t border-gray-50">
                  <button onClick={() => setEditing(null)} className="px-6 py-3 text-sm text-gray-500 font-bold hover:text-gray-900 transition-colors">Cancelar</button>
                  <button onClick={() => save(t.id)} disabled={!!saving}
                    className="flex-1 flex items-center justify-center gap-2 py-4 bg-gray-900 hover:bg-black text-white rounded-2xl text-sm font-bold transition-all shadow-xl shadow-gray-200 disabled:opacity-50">
                    <Save className="w-4 h-4" />
                    {saving === t.id ? "Guardando cambios..." : "Guardar Configuración Avanzada"}
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}

      {sendModal && (
        <ManualSendModal
          defaultTitle={sendModal.title}
          defaultBody={sendModal.body}
          defaultEmailBody={sendModal.defaultEmailBody}
          defaultUrl={sendModal.url}
          templateType={sendModal.type}
          onClose={() => setSendModal(null)}
        />
      )}

      {previewHtml !== null && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] w-full max-w-2xl h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-500 text-white flex items-center justify-center shadow-lg shadow-rose-200">
                  <i className="ri-eye-line text-xl" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-gray-900">Vista Previa del Email</h3>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Resultado Final con Diseño de Marca</p>
                </div>
              </div>
              <button onClick={() => setPreviewHtml(null)} className="w-10 h-10 rounded-full bg-white border border-gray-200 text-gray-400 hover:text-gray-900 hover:border-gray-900 transition-all flex items-center justify-center">
                <i className="ri-close-line text-2xl" />
              </button>
            </div>
            
            <div className="flex-1 bg-gray-100 p-8 overflow-auto">
              <div className="max-w-[600px] mx-auto bg-white shadow-xl rounded-2xl overflow-hidden min-h-full">
                <iframe 
                  title="Email Preview"
                  className="w-full h-full min-h-[600px] border-none"
                  srcDoc={wrapForPreview(previewHtml)}
                />
              </div>
            </div>

            <div className="px-8 py-6 bg-white border-t border-gray-100 text-center">
              <p className="text-[10px] text-gray-400 font-medium mb-4 italic">Nota: Las etiquetas como {"{{clientName}}"} se muestran con datos de ejemplo.</p>
              <button onClick={() => setPreviewHtml(null)} className="px-12 py-3 bg-gray-900 text-white rounded-xl text-xs font-bold hover:bg-black transition-all shadow-lg shadow-gray-200 uppercase tracking-widest">
                Volver al Editor
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
