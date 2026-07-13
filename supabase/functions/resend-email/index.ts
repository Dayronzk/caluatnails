const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey, x-client-info",
};

const RESEND_API = "https://api.resend.com/emails";

function getResendKey(): string | undefined {
  const candidates = ["RESEND_API_KEY", "RESEND_KEY", "RESEND_SECRET", "RESEND_TOKEN"];
  for (const name of candidates) {
    const val = Deno.env.get(name);
    if (val && val.trim().length > 0) return val.trim();
  }
  return undefined;
}

type EmailType =
  | "welcome"
  | "verify_email"
  | "password_reset"
  | "booking_confirmation"
  | "booking_reminder"
  | "booking_new_admin"
  | "booking_cancelled"
  | "purchase_confirmation"
  | "newsletter_welcome"
  | "signup_confirmation"
  | "gift_card_received"
  | "gift_card_confirmation"
  | "gift_card_admin";

interface EmailPayload {
  type: EmailType;
  to: { email: string; name?: string };
  data?: Record<string, unknown>;
}

interface BrandConfig {
  email_brand_name: string;
  site_url: string;
  contact_email: string;
  sender_email: string;
  email_footer_text: string;
  email_header_color: string;
  email_header_color2: string;
  email_accent_color: string;
  email_bg_color: string;
  email_card_bg: string;
  notification_email: string;
}

const DEFAULT_BRAND: BrandConfig = {
  email_brand_name: "NAILOX",
  site_url: "https://nailox.com",
  contact_email: "hola@nailox.com",
  sender_email: "noreply@nailox.com",
  email_footer_text: "Curso Profesional de Manicura y Pedicura",
  email_header_color: "#f43f5e",
  email_header_color2: "#fb7185",
  email_accent_color: "#f43f5e",
  email_bg_color: "#fdf2f4",
  email_card_bg: "#fff1f2",
  notification_email: "",
};

async function loadBrandConfig(): Promise<BrandConfig> {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !supabaseKey) return DEFAULT_BRAND;
    const res = await fetch(
      `${supabaseUrl}/rest/v1/center_settings?id=eq.main&select=email_brand_name,site_url,contact_email,sender_email,email_footer_text,email_header_color,email_header_color2,email_accent_color,email_bg_color,email_card_bg,notification_email`,
      { headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` } }
    );
    if (!res.ok) return DEFAULT_BRAND;
    const rows = await res.json();
    if (!rows || rows.length === 0) return DEFAULT_BRAND;
    const row = rows[0];
    return {
      email_brand_name: row.email_brand_name || DEFAULT_BRAND.email_brand_name,
      site_url: row.site_url || DEFAULT_BRAND.site_url,
      contact_email: row.contact_email || DEFAULT_BRAND.contact_email,
      sender_email: row.sender_email || DEFAULT_BRAND.sender_email,
      email_footer_text: row.email_footer_text || DEFAULT_BRAND.email_footer_text,
      email_header_color: row.email_header_color || DEFAULT_BRAND.email_header_color,
      email_header_color2: row.email_header_color2 || DEFAULT_BRAND.email_header_color2,
      email_accent_color: row.email_accent_color || DEFAULT_BRAND.email_accent_color,
      email_bg_color: row.email_bg_color || DEFAULT_BRAND.email_bg_color,
      email_card_bg: row.email_card_bg || DEFAULT_BRAND.email_card_bg,
      notification_email: row.notification_email || "",
    };
  } catch {
    return DEFAULT_BRAND;
  }
}

// ── Generate Supabase link via Admin API ─────────────────────────────────
async function generateSupabaseLink(
  type: "signup" | "recovery",
  email: string,
  redirectTo: string
): Promise<{ link: string | null; error?: string }> {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceRoleKey) return { link: null, error: "Server config error" };
    
    const res = await fetch(`${supabaseUrl}/auth/v1/admin/generate_link`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": serviceRoleKey,
        "Authorization": `Bearer ${serviceRoleKey}`,
      },
      body: JSON.stringify({ type, email, options: { redirect_to: redirectTo } }),
    });
    
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      const errText = errData.msg || errData.message || "Unknown error";
      console.warn(`generate_link (${type}) error for ${email}:`, errText);
      
      if (res.status === 404 || errText.includes("User not found")) {
        return { link: null, error: "USER_NOT_FOUND" };
      }
      return { link: null, error: errText };
    }
    const linkData = await res.json();
    return { link: linkData.action_link || null };
  } catch (err) {
    console.warn("generateSupabaseLink exception:", err);
    return { link: null, error: String(err) };
  }
}

// ── HTML helpers ──────────────────────────────────────────────────────────
function wrapper(content: string, brand: BrandConfig) {
  const year = new Date().getFullYear();
  const grad = `linear-gradient(135deg,${brand.email_header_color},${brand.email_header_color2})`;
  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:${brand.email_bg_color};font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:${brand.email_bg_color};padding:40px 20px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:20px;overflow:hidden;border:1px solid #fce7eb;">
        <tr>
          <td style="background:${grad};padding:32px 40px;text-align:center;">
            <span style="font-family:'Georgia',serif;font-size:30px;font-weight:700;letter-spacing:6px;color:#ffffff;">${brand.email_brand_name}</span>
          </td>
        </tr>
        <tr><td style="padding:36px 40px;">${content}</td></tr>
        <tr>
          <td style="background:${brand.email_bg_color};padding:20px 40px;text-align:center;border-top:1px solid #fce7eb;">
            <p style="margin:0;font-size:11px;color:#9ca3af;">© ${year} ${brand.email_brand_name} — ${brand.email_footer_text}</p>
            <p style="margin:6px 0 0;font-size:11px;color:#d1d5db;">Este correo fue enviado automáticamente, por favor no respondas a este mensaje.</p>
            <p style="margin:6px 0 0;font-size:11px;color:#9ca3af;">¿Preguntas? <a href="mailto:${brand.contact_email}" style="color:${brand.email_accent_color};">${brand.contact_email}</a></p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// Admin wrapper — dark header with amber accent for internal notifications
function adminWrapper(content: string, brand: BrandConfig) {
  const year = new Date().getFullYear();
  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:40px 20px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:20px;overflow:hidden;border:1px solid #e2e8f0;">
        <tr>
          <td style="background:linear-gradient(135deg,#1e293b,#334155);padding:28px 40px;text-align:center;">
            <span style="font-family:'Georgia',serif;font-size:13px;font-weight:600;letter-spacing:3px;color:#94a3b8;text-transform:uppercase;">Panel Interno</span>
            <br>
            <span style="font-family:'Georgia',serif;font-size:26px;font-weight:700;letter-spacing:5px;color:#ffffff;">${brand.email_brand_name}</span>
          </td>
        </tr>
        <tr><td style="padding:36px 40px;">${content}</td></tr>
        <tr>
          <td style="background:#f8fafc;padding:16px 40px;text-align:center;border-top:1px solid #e2e8f0;">
            <p style="margin:0;font-size:11px;color:#94a3b8;">© ${year} ${brand.email_brand_name} — Notificación interna del sistema</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function btnPrimary(href: string, label: string, brand: BrandConfig) {
  const grad = `linear-gradient(135deg,${brand.email_header_color},${brand.email_header_color2})`;
  return `<a href="${href}" style="display:inline-block;background:${grad};color:#ffffff;font-size:14px;font-weight:600;padding:14px 32px;border-radius:50px;text-decoration:none;letter-spacing:0.3px;">${label}</a>`;
}

// ── Calendar helpers ──────────────────────────────────────────────────────
function buildCalendarLinks(date: string, time: string, durationMinutes: number, title: string, description: string) {
  const [year, month, day] = date.split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);
  const pad = (n: number) => String(n).padStart(2, "0");
  const startMs = new Date(year, month - 1, day, hour, minute).getTime();
  const endMs = startMs + durationMinutes * 60000;
  const startDate = new Date(startMs);
  const endDate = new Date(endMs);
  const toGCal = (d: Date) =>
    `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;
  const gcalStart = toGCal(startDate);
  const gcalEnd = toGCal(endDate);
  const googleUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${gcalStart}/${gcalEnd}&details=${encodeURIComponent(description)}`;
  const outlookUrl = `https://outlook.live.com/calendar/0/deeplink/compose?subject=${encodeURIComponent(title)}&startdt=${startDate.toISOString()}&enddt=${endDate.toISOString()}&body=${encodeURIComponent(description)}`;
  const icsContent = [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Nailox//Agenda//ES",
    "BEGIN:VEVENT",
    `DTSTART:${gcalStart}`, `DTEND:${gcalEnd}`,
    `SUMMARY:${title}`, `DESCRIPTION:${description.replace(/\n/g, "\\n")}`,
    "END:VEVENT", "END:VCALENDAR",
  ].join("\r\n");
  const icsDataUri = `data:text/calendar;charset=utf-8,${encodeURIComponent(icsContent)}`;
  return { googleUrl, outlookUrl, icsDataUri };
}

function calendarButtons(date: string, time: string, durationMinutes: number, services: string[], clientName: string, brand: BrandConfig) {
  const title = `Cita: ${services.join(", ")}`;
  const description = `Cliente: ${clientName}\nServicios: ${services.join(", ")}\nFecha: ${date} a las ${time}`;
  const { googleUrl, outlookUrl, icsDataUri } = buildCalendarLinks(date, time, durationMinutes, title, description);
  return `
    <div style="margin:24px 0;">
      <p style="margin:0 0 12px;font-size:13px;font-weight:600;color:#374151;">Añade esta cita a tu calendario:</p>
      <table cellpadding="0" cellspacing="0" style="border-collapse:separate;border-spacing:8px 0;">
        <tr>
          <td><a href="${googleUrl}" target="_blank" style="display:inline-flex;align-items:center;gap:6px;background:#ffffff;border:1.5px solid #e5e7eb;color:#374151;font-size:12px;font-weight:600;padding:9px 16px;border-radius:50px;text-decoration:none;">📅 Google Calendar</a></td>
          <td><a href="${icsDataUri}" download="cita-nailox.ics" style="display:inline-flex;align-items:center;gap:6px;background:#ffffff;border:1.5px solid #e5e7eb;color:#374151;font-size:12px;font-weight:600;padding:9px 16px;border-radius:50px;text-decoration:none;">🍎 Apple Calendar</a></td>
          <td><a href="${outlookUrl}" target="_blank" style="display:inline-flex;align-items:center;gap:6px;background:#ffffff;border:1.5px solid #e5e7eb;color:#374151;font-size:12px;font-weight:600;padding:9px 16px;border-radius:50px;text-decoration:none;">📧 Outlook</a></td>
        </tr>
      </table>
      <p style="margin:8px 0 0;font-size:11px;color:#9ca3af;">¿Usas otro calendario? Descarga el archivo .ics con Apple Calendar y ábrelo en tu app favorita.</p>
    </div>
  `;
}

// ── Email builders ────────────────────────────────────────────────────────

function buildWelcome(data: Record<string, unknown>, brand: BrandConfig) {
  const name = (data.name as string) || "Estudiante";
  const password = (data.password as string) || null;
  const loginUrl = `${brand.site_url}/login`;

  const passwordBlock = password ? `
    <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:16px 20px;margin-bottom:24px;text-align:center;">
      <p style="margin:0 0 8px;font-size:12px;color:#64748b;font-weight:600;text-transform:uppercase;letter-spacing:1px;">Tus datos de acceso</p>
      <p style="margin:0;font-size:14px;color:#1e293b;">Email: <strong>${data.email || ""}</strong></p>
      <p style="margin:4px 0 0;font-size:14px;color:#1e293b;">Contraseña: <code style="background:#f1f5f9;padding:2px 6px;border-radius:4px;font-family:monospace;font-weight:700;">${password}</code></p>
      <p style="margin:12px 0 0;font-size:11px;color:#94a3b8;">Por seguridad, te recomendamos cambiar tu contraseña una vez hayas iniciado sesión.</p>
    </div>
  ` : "";

  return {
    subject: `¡Bienvenida a ${brand.email_brand_name}! Tu formación comienza ahora`,
    html: wrapper(`
      <h2 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#1A1A1A;">¡Hola, ${name}! 💅</h2>
      <p style="margin:0 0 20px;font-size:14px;color:#6b7280;line-height:1.7;">
        Nos alegra tenerte en <strong>${brand.email_brand_name}</strong>. Tu cuenta ha sido creada exitosamente y ya puedes acceder a todos los recursos de la plataforma.
      </p>

      ${passwordBlock}

      <div style="background:${brand.email_card_bg};border-radius:14px;padding:20px 24px;margin-bottom:24px;">
        <p style="margin:0 0 10px;font-size:13px;font-weight:600;color:#9f1239;">¿Qué puedes hacer ahora?</p>
        <ul style="margin:0;padding-left:18px;font-size:13px;color:#374151;line-height:2;">
          <li>Explorar el catálogo de módulos y lecciones</li>
          <li>Acceder a recursos descargables exclusivos</li>
          <li>Participar en el foro de la comunidad</li>
          <li>Reservar tu cita de práctica presencial</li>
        </ul>
      </div>
      <div style="text-align:center;margin-bottom:24px;">
        ${btnPrimary(loginUrl, "Iniciar sesión", brand)}
      </div>
      <p style="margin:0;font-size:12px;color:#9ca3af;text-align:center;">Si tienes alguna duda, escríbenos a <a href="mailto:${brand.contact_email}" style="color:${brand.email_accent_color};">${brand.contact_email}</a></p>
    `, brand),
  };
}

function buildSignupConfirmation(data: Record<string, unknown>, brand: BrandConfig) {
  const name = (data.name as string) || "Estudiante";
  const link = (data.link as string) || "#";
  return {
    subject: `Confirma tu cuenta en ${brand.email_brand_name}`,
    html: wrapper(`
      <h2 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#1A1A1A;">¡Hola, ${name}! 👋</h2>
      <p style="margin:0 0 20px;font-size:14px;color:#6b7280;line-height:1.7;">
        Gracias por registrarte en <strong>${brand.email_brand_name}</strong>. Solo falta un paso: confirma tu dirección de correo electrónico para activar tu cuenta.
      </p>
      <div style="text-align:center;margin:32px 0;">
        ${btnPrimary(link, "Confirmar mi correo", brand)}
      </div>
      <div style="background:${brand.email_card_bg};border-radius:14px;padding:16px 20px;margin-bottom:20px;">
        <p style="margin:0;font-size:12px;color:#9f1239;line-height:1.6;">
          <strong>Importante:</strong> Este enlace expira en 24 horas. Si no creaste esta cuenta, puedes ignorar este correo.
        </p>
      </div>
      <p style="margin:0;font-size:12px;color:#9ca3af;text-align:center;">
        ¿Tienes problemas con el botón? Copia y pega este enlace en tu navegador:<br>
        <span style="color:${brand.email_accent_color};word-break:break-all;font-size:11px;">${link}</span>
      </p>
    `, brand),
  };
}

function buildVerifyEmail(data: Record<string, unknown>, brand: BrandConfig) {
  const name = (data.name as string) || "Estudiante";
  const link = (data.link as string) || "#";
  return {
    subject: `Confirma tu correo electrónico — ${brand.email_brand_name}`,
    html: wrapper(`
      <h2 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#1A1A1A;">Confirma tu email</h2>
      <p style="margin:0 0 20px;font-size:14px;color:#6b7280;line-height:1.7;">
        Hola <strong>${name}</strong>, solo falta un paso para activar tu cuenta en ${brand.email_brand_name}. Haz clic en el botón para verificar tu correo electrónico.
      </p>
      <div style="text-align:center;margin:28px 0;">
        ${btnPrimary(link, "Verificar mi correo", brand)}
      </div>
      <p style="margin:0 0 8px;font-size:12px;color:#9ca3af;text-align:center;">Este enlace expira en 24 horas.</p>
      <p style="margin:0;font-size:12px;color:#9ca3af;text-align:center;">Si no creaste esta cuenta, puedes ignorar este correo.</p>
    `, brand),
  };
}

function buildPasswordReset(data: Record<string, unknown>, brand: BrandConfig) {
  const name = (data.name as string) || "";
  const link = (data.link as string) || "#";
  return {
    subject: `Restablece tu contraseña — ${brand.email_brand_name}`,
    html: wrapper(`
      <h2 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#1A1A1A;">Restablecer contraseña</h2>
      <p style="margin:0 0 20px;font-size:14px;color:#6b7280;line-height:1.7;">
        ${name ? `Hola <strong>${name}</strong>, r` : "R"}ecibimos una solicitud para restablecer la contraseña de tu cuenta <strong>${brand.email_brand_name}</strong>. Haz clic en el botón para crear una nueva contraseña.
      </p>
      <div style="text-align:center;margin:28px 0;">
        ${btnPrimary(link, "Restablecer contraseña", brand)}
      </div>
      <div style="background:${brand.email_card_bg};border-radius:12px;padding:14px 20px;margin-bottom:16px;">
        <p style="margin:0;font-size:12px;color:#9f1239;">
          <strong>Importante:</strong> Este enlace expira en 1 hora. Si no solicitaste este cambio, ignora este correo.
        </p>
      </div>
      <p style="margin:0;font-size:12px;color:#9ca3af;text-align:center;">
        ¿Tienes problemas con el botón? Copia y pega este enlace:<br>
        <span style="color:${brand.email_accent_color};word-break:break-all;font-size:11px;">${link}</span>
      </p>
      <p style="margin:8px 0 0;font-size:12px;color:#9ca3af;text-align:center;">¿Necesitas ayuda? Escríbenos a <a href="mailto:${brand.contact_email}" style="color:${brand.email_accent_color};">${brand.contact_email}</a></p>
    `, brand),
  };
}

function buildBookingConfirmation(data: Record<string, unknown>, brand: BrandConfig) {
  const name = (data.clientName as string) || "Cliente";
  const date = (data.bookingDate as string) || "";
  const time = (data.bookingTime as string) || "";
  const services = (data.services as string[]) || [];
  const total = Number(data.totalPrice) || 0;
  const deposit = Number(data.depositAmount) || 0;
  const durationMinutes = Number(data.durationMinutes) || 60;
  const remaining = total - deposit;
  const proName = (data.professionalName as string) || "";
  const proAddress = (data.professionalAddress as string) || "";
  const proInstagram = (data.professionalInstagram as string) || "";

  const formattedDate = date
    ? new Date(date + "T12:00:00").toLocaleDateString("es-ES", {
      weekday: "long", day: "numeric", month: "long", year: "numeric",
    })
    : "";

  const servicesList = services.map((s) => `<li style="margin:4px 0;font-size:13px;color:#374151;">${s}</li>`).join("");
  const mapsUrl = proAddress ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(proAddress)}` : "";

  const proBlock = proName ? `
    <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:14px;padding:20px 24px;margin-bottom:24px;">
      <p style="margin:0 0 12px;font-size:13px;font-weight:700;color:#166534;">Tu profesional</p>
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr><td style="padding:5px 0;font-size:12px;color:#166534;font-weight:600;width:110px;">Nombre</td><td style="padding:5px 0;font-size:13px;color:#1f2937;font-weight:600;">${proName}</td></tr>
        ${proAddress ? `<tr><td style="padding:5px 0;font-size:12px;color:#166534;font-weight:600;vertical-align:top;">Dirección</td><td style="padding:5px 0;font-size:13px;color:#1f2937;">${proAddress}${mapsUrl ? `<br><a href="${mapsUrl}" style="color:${brand.email_accent_color};font-size:12px;font-weight:600;text-decoration:none;">Ver en Google Maps</a>` : ""}</td></tr>` : ""}
        ${proInstagram ? `<tr><td style="padding:5px 0;font-size:12px;color:#166534;font-weight:600;">Instagram</td><td style="padding:5px 0;font-size:13px;"><a href="https://instagram.com/${proInstagram.replace(/^@/, "")}" style="color:${brand.email_accent_color};text-decoration:none;font-weight:500;">@${proInstagram.replace(/^@/, "")}</a></td></tr>` : ""}
      </table>
    </div>
  ` : "";

  const calBtns = date && time ? calendarButtons(date, time, durationMinutes, services, name, brand) : "";

  return {
    subject: `Reserva confirmada — ${formattedDate} a las ${time}`,
    html: wrapper(`
      <h2 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#1A1A1A;">¡Tu cita está confirmada! 🎉</h2>
      <p style="margin:0 0 20px;font-size:14px;color:#6b7280;line-height:1.7;">
        Hola <strong>${name}</strong>, tu reserva ha sido procesada correctamente. Aquí tienes todos los detalles:
      </p>
      <div style="background:${brand.email_card_bg};border-radius:14px;padding:20px 24px;margin-bottom:24px;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr><td style="padding:6px 0;font-size:12px;color:#9f1239;font-weight:600;width:110px;">Fecha</td><td style="padding:6px 0;font-size:13px;color:#1f2937;font-weight:500;text-transform:capitalize;">${formattedDate}</td></tr>
          <tr><td style="padding:6px 0;font-size:12px;color:#9f1239;font-weight:600;">Hora</td><td style="padding:6px 0;font-size:13px;color:#1f2937;font-weight:500;">${time}</td></tr>
          <tr><td style="padding:6px 0;font-size:12px;color:#9f1239;font-weight:600;vertical-align:top;">Servicios</td><td style="padding:6px 0;"><ul style="margin:0;padding-left:16px;">${servicesList}</ul></td></tr>
          <tr><td style="padding:6px 0;font-size:12px;color:#9f1239;font-weight:600;">Total</td><td style="padding:6px 0;font-size:13px;color:#1f2937;font-weight:700;">€${total.toFixed(2)}</td></tr>
          <tr><td style="padding:6px 0;font-size:12px;color:#9f1239;font-weight:600;">Anticipo</td><td style="padding:6px 0;font-size:13px;color:#059669;font-weight:600;">€${deposit.toFixed(2)} pagado</td></tr>
          <tr><td style="padding:6px 0;font-size:12px;color:#9f1239;font-weight:600;">Pendiente</td><td style="padding:6px 0;font-size:13px;color:#d97706;font-weight:600;">€${remaining.toFixed(2)} (en el momento de la cita)</td></tr>
        </table>
      </div>
      ${proBlock}
      ${calBtns}
      <p style="margin:0 0 8px;font-size:13px;color:#6b7280;line-height:1.6;">Si necesitas cancelar o modificar tu cita, contáctanos con al menos 24 horas de antelación.</p>
      <p style="margin:0;font-size:12px;color:#9ca3af;">¿Preguntas? Escríbenos a <a href="mailto:${brand.contact_email}" style="color:${brand.email_accent_color};">${brand.contact_email}</a></p>
    `, brand),
  };
}

function buildBookingReminder(data: Record<string, unknown>, brand: BrandConfig) {
  const name = (data.clientName as string) || "Cliente";
  const date = (data.bookingDate as string) || "";
  const time = (data.bookingTime as string) || "";
  const services = (data.services as string[]) || [];
  const total = Number(data.totalPrice) || 0;
  const deposit = Number(data.depositAmount) || 0;
  const depositPaid = Boolean(data.depositPaid);
  const durationMinutes = Number(data.durationMinutes) || 60;
  const remaining = (total - deposit).toFixed(2);

  const formattedDate = date
    ? new Date(date + "T12:00:00").toLocaleDateString("es-ES", {
      weekday: "long", day: "numeric", month: "long", year: "numeric",
    })
    : "";

  const servicesList = services.map((s) => `<li style="margin:4px 0;font-size:13px;color:#374151;">${s}</li>`).join("");
  const depositStatus = depositPaid
    ? `<span style="color:#059669;font-weight:600;">€${deposit.toFixed(2)} pagado ✓</span>`
    : `<span style="color:#d97706;font-weight:600;">€${deposit.toFixed(2)} pendiente</span>`;

  const calBtns = date && time ? calendarButtons(date, time, durationMinutes, services, name, brand) : "";

  return {
    subject: `Recordatorio de cita — ${formattedDate} a las ${time}`,
    html: wrapper(`
      <h2 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#1A1A1A;">¡Te esperamos pronto! 💅</h2>
      <p style="margin:0 0 20px;font-size:14px;color:#6b7280;line-height:1.7;">
        Hola <strong>${name}</strong>, te recordamos que tienes una cita programada. Aquí tienes todos los detalles:
      </p>
      <div style="background:${brand.email_card_bg};border-radius:14px;padding:20px 24px;margin-bottom:24px;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr><td style="padding:6px 0;font-size:12px;color:#9f1239;font-weight:600;width:110px;">📅 Fecha</td><td style="padding:6px 0;font-size:13px;color:#1f2937;font-weight:500;text-transform:capitalize;">${formattedDate}</td></tr>
          <tr><td style="padding:6px 0;font-size:12px;color:#9f1239;font-weight:600;">🕐 Hora</td><td style="padding:6px 0;font-size:13px;color:#1f2937;font-weight:500;">${time}</td></tr>
          <tr><td style="padding:6px 0;font-size:12px;color:#9f1239;font-weight:600;vertical-align:top;">✂️ Servicios</td><td style="padding:6px 0;"><ul style="margin:0;padding-left:16px;">${servicesList}</ul></td></tr>
          <tr><td style="padding:6px 0;font-size:12px;color:#9f1239;font-weight:600;">💰 Total</td><td style="padding:6px 0;font-size:13px;color:#1f2937;font-weight:700;">€${total.toFixed(2)}</td></tr>
          <tr><td style="padding:6px 0;font-size:12px;color:#9f1239;font-weight:600;">🧾 Anticipo</td><td style="padding:6px 0;font-size:14px;">${depositStatus}</td></tr>
        </table>
      </div>
      ${calBtns}
      <p style="margin:0 0 8px;font-size:13px;color:#6b7280;line-height:1.6;">Recuerda que el resto <strong>(€${remaining})</strong> se abona en el momento de la cita.</p>
      <p style="margin:0;font-size:13px;color:#6b7280;line-height:1.6;">Si necesitas cancelar o modificar tu cita, contáctanos con antelación.</p>
    `, brand),
  };
}

function buildBookingCancelled(data: Record<string, unknown>, brand: BrandConfig) {
  const name = (data.clientName as string) || "Cliente";
  const date = (data.bookingDate as string) || "";
  const time = (data.bookingTime as string) || "";
  const services = (data.services as string[]) || [];

  const formattedDate = date
    ? new Date(date + "T12:00:00").toLocaleDateString("es-ES", {
        weekday: "long", day: "numeric", month: "long", year: "numeric",
      })
    : "";

  const servicesList = services.map((s) => `<li style="margin:4px 0;font-size:13px;color:#374151;">${s}</li>`).join("");

  return {
    subject: `Cita cancelada — ${formattedDate} a las ${time}`,
    html: wrapper(`
      <h2 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#1A1A1A;">Cita cancelada 🗓️</h2>
      <p style="margin:0 0 20px;font-size:14px;color:#6b7280;line-height:1.7;">
        Hola <strong>${name}</strong>, te informamos que tu cita ha sido cancelada.
      </p>
      <div style="background:${brand.email_card_bg};border-radius:14px;padding:20px 24px;margin-bottom:24px;">
        <p style="margin:0 0 12px;font-size:13px;font-weight:700;color:#9f1239;text-transform:uppercase;letter-spacing:1px;">Detalles de la cita cancelada</p>
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr><td style="padding:6px 0;font-size:12px;color:#9f1239;font-weight:600;width:110px;">📅 Fecha</td><td style="padding:6px 0;font-size:13px;color:#1f2937;font-weight:500;text-transform:capitalize;">${formattedDate}</td></tr>
          <tr><td style="padding:6px 0;font-size:12px;color:#9f1239;font-weight:600;">🕐 Hora</td><td style="padding:6px 0;font-size:13px;color:#1f2937;font-weight:500;">${time}</td></tr>
          <tr><td style="padding:6px 0;font-size:12px;color:#9f1239;font-weight:600;vertical-align:top;">✂️ Servicios</td><td style="padding:6px 0;"><ul style="margin:0;padding-left:16px;">${servicesList}</ul></td></tr>
        </table>
      </div>
      <p style="margin:0 0 16px;font-size:14px;color:#6b7280;line-height:1.7;">Lamentamos las molestias que esto pueda causarte. Si deseas programar una nueva cita, puedes hacerlo a través de nuestra web.</p>
      <div style="text-align:center;margin:24px 0;">
        ${btnPrimary(brand.site_url, "Ver disponibilidad", brand)}
      </div>
      <p style="margin:0;font-size:12px;color:#9ca3af;text-align:center;">Si tienes alguna pregunta, no dudes en contactarnos escribiendo a <a href="mailto:${brand.contact_email}" style="color:${brand.email_accent_color};">${brand.contact_email}</a></p>
    `, brand),
  };
}

// ── Admin notification for new booking ───────────────────────────────────
function buildBookingNewAdmin(data: Record<string, unknown>, brand: BrandConfig) {
  const clientName = (data.clientName as string) || "Cliente";
  const clientEmail = (data.clientEmail as string) || "";
  const clientPhone = (data.clientPhone as string) || "";
  const date = (data.bookingDate as string) || "";
  const time = (data.bookingTime as string) || "";
  const services = (data.services as string[]) || [];
  const total = Number(data.totalPrice) || 0;
  const deposit = Number(data.depositAmount) || 0;
  const durationMinutes = Number(data.durationMinutes) || 60;
  const proName = (data.professionalName as string) || "";
  const bookingId = (data.bookingId as string) || "";
  const isNewClient = Boolean(data.isNewClient);

  const formattedDate = date
    ? new Date(date + "T12:00:00").toLocaleDateString("es-ES", {
      weekday: "long", day: "numeric", month: "long", year: "numeric",
    })
    : "";

  const servicesList = services.map((s) => `<li style="margin:4px 0;font-size:13px;color:#374151;">${s}</li>`).join("");

  const newClientBadge = isNewClient
    ? `<span style="display:inline-block;background:#dcfce7;color:#166534;font-size:11px;font-weight:700;padding:3px 10px;border-radius:50px;margin-left:8px;">NUEVO CLIENTE</span>`
    : "";

  const adminUrl = `${brand.site_url}/admin/agenda`;

  const durationText = durationMinutes >= 60
    ? `${Math.floor(durationMinutes / 60)}h${durationMinutes % 60 > 0 ? ` ${durationMinutes % 60}min` : ""}`
    : `${durationMinutes}min`;

  return {
    subject: `🔔 Nueva reserva — ${clientName} · ${formattedDate} ${time}`,
    html: adminWrapper(`
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:20px;">
        <div style="width:48px;height:48px;background:#fef3c7;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:24px;flex-shrink:0;">🔔</div>
        <div>
          <h2 style="margin:0;font-size:20px;font-weight:700;color:#1e293b;">Nueva reserva confirmada</h2>
          <p style="margin:4px 0 0;font-size:13px;color:#64748b;">El anticipo ha sido cobrado correctamente por Stripe</p>
        </div>
      </div>

      <div style="background:#f0fdf4;border:1.5px solid #86efac;border-radius:14px;padding:16px 20px;margin-bottom:20px;display:flex;align-items:center;gap:10px;">
        <span style="font-size:18px;">✅</span>
        <div>
          <p style="margin:0;font-size:13px;font-weight:700;color:#166534;">Anticipo cobrado: €${deposit.toFixed(2)}</p>
          <p style="margin:2px 0 0;font-size:12px;color:#15803d;">Pendiente en cita: €${(total - deposit).toFixed(2)}</p>
        </div>
      </div>

      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:14px;padding:20px 24px;margin-bottom:20px;">
        <p style="margin:0 0 14px;font-size:12px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:1px;">Datos del cliente</p>
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="padding:5px 0;font-size:12px;color:#64748b;font-weight:600;width:100px;">Cliente</td>
            <td style="padding:5px 0;font-size:13px;color:#1e293b;font-weight:700;">${clientName}${newClientBadge}</td>
          </tr>
          ${clientEmail ? `<tr><td style="padding:5px 0;font-size:12px;color:#64748b;font-weight:600;">Email</td><td style="padding:5px 0;font-size:13px;"><a href="mailto:${clientEmail}" style="color:#f43f5e;text-decoration:none;">${clientEmail}</a></td></tr>` : ""}
          ${clientPhone ? `<tr><td style="padding:5px 0;font-size:12px;color:#64748b;font-weight:600;">Teléfono</td><td style="padding:5px 0;font-size:13px;"><a href="tel:${clientPhone}" style="color:#f43f5e;text-decoration:none;">${clientPhone}</a></td></tr>` : ""}
        </table>
      </div>

      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:14px;padding:20px 24px;margin-bottom:20px;">
        <p style="margin:0 0 14px;font-size:12px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:1px;">Detalles de la cita</p>
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr><td style="padding:5px 0;font-size:12px;color:#64748b;font-weight:600;width:100px;">📅 Fecha</td><td style="padding:5px 0;font-size:13px;color:#1e293b;font-weight:600;text-transform:capitalize;">${formattedDate}</td></tr>
          <tr><td style="padding:5px 0;font-size:12px;color:#64748b;font-weight:600;">🕐 Hora</td><td style="padding:5px 0;font-size:13px;color:#1e293b;font-weight:600;">${time} <span style="color:#94a3b8;font-weight:400;">(${durationText})</span></td></tr>
          <tr><td style="padding:5px 0;font-size:12px;color:#64748b;font-weight:600;vertical-align:top;">✂️ Servicios</td><td style="padding:5px 0;"><ul style="margin:0;padding-left:16px;">${servicesList}</ul></td></tr>
          ${proName ? `<tr><td style="padding:5px 0;font-size:12px;color:#64748b;font-weight:600;">👩 Profesional</td><td style="padding:5px 0;font-size:13px;color:#1e293b;">${proName}</td></tr>` : ""}
          <tr><td style="padding:5px 0;font-size:12px;color:#64748b;font-weight:600;">💰 Total</td><td style="padding:5px 0;font-size:14px;color:#1e293b;font-weight:700;">€${total.toFixed(2)}</td></tr>
        </table>
      </div>

      ${bookingId ? `<p style="margin:0 0 20px;font-size:11px;color:#94a3b8;">ID de reserva: <code style="background:#f1f5f9;padding:2px 6px;border-radius:4px;font-family:monospace;">${bookingId}</code></p>` : ""}

      <div style="text-align:center;margin-top:8px;">
        <a href="${adminUrl}" style="display:inline-block;background:linear-gradient(135deg,#1e293b,#334155);color:#ffffff;font-size:14px;font-weight:600;padding:13px 32px;border-radius:50px;text-decoration:none;letter-spacing:0.3px;">Ver en el panel de agenda</a>
      </div>
    `, brand),
  };
}

function buildPurchaseConfirmation(data: Record<string, unknown>, brand: BrandConfig) {
  const name = (data.name as string) || "Estudiante";
  const courseName = (data.courseName as string) || `Curso ${brand.email_brand_name}`;
  const amount = Number(data.amount) || 0;
  const orderId = (data.orderId as string) || "";
  const grad = `linear-gradient(135deg,${brand.email_header_color},${brand.email_header_color2})`;

  return {
    subject: `¡Acceso activado! ${courseName} — ${brand.email_brand_name}`,
    html: wrapper(`
      <h2 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#1A1A1A;">¡Compra exitosa! 🎓</h2>
      <p style="margin:0 0 20px;font-size:14px;color:#6b7280;line-height:1.7;">
        Hola <strong>${name}</strong>, tu pago ha sido procesado y ya tienes acceso completo a tu curso.
      </p>
      <div style="background:${brand.email_card_bg};border-radius:14px;padding:20px 24px;margin-bottom:24px;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr><td style="padding:6px 0;font-size:12px;color:#9f1239;font-weight:600;width:110px;">Curso</td><td style="padding:6px 0;font-size:13px;color:#1f2937;font-weight:600;">${courseName}</td></tr>
          <tr><td style="padding:6px 0;font-size:12px;color:#9f1239;font-weight:600;">Total pagado</td><td style="padding:6px 0;font-size:13px;color:#059669;font-weight:700;">€${amount.toFixed(2)}</td></tr>
          ${orderId ? `<tr><td style="padding:6px 0;font-size:12px;color:#9f1239;font-weight:600;">Pedido</td><td style="padding:6px 0;font-size:12px;color:#6b7280;">${orderId}</td></tr>` : ""}
        </table>
      </div>
      <div style="text-align:center;margin:24px 0;">
        <a href="${brand.site_url}/mi-cuenta" style="display:inline-block;background:${grad};color:#ffffff;font-size:14px;font-weight:600;padding:14px 32px;border-radius:50px;text-decoration:none;">Acceder a mi curso</a>
      </div>
      <p style="margin:0;font-size:12px;color:#9ca3af;text-align:center;">Tienes acceso de por vida a todos los materiales del curso.</p>
    `, brand),
  };
}

function buildGiftCardReceived(data: Record<string, unknown>, brand: BrandConfig) {
  const recipientName = (data.recipientName as string) || "Querida amiga";
  const buyerName = (data.buyerName as string) || "Alguien especial";
  const amount = Number(data.amount) || 0;
  const code = (data.code as string) || "";
  const message = (data.message as string) || "";
  const occasion = (data.occasion as string) || "Porque sí";

  return {
    subject: `🎁 ¡${buyerName} te ha regalado una tarjeta NAILOX!`,
    html: wrapper(`
      <h2 style="margin:0 0 12px;font-size:24px;font-weight:700;color:#1A1A1A;text-align:center;">¡Tienes un regalo! 🎁</h2>
      <p style="margin:0 0 24px;font-size:14px;color:#6b7280;line-height:1.7;text-align:center;">
        Hola <strong>${recipientName}</strong>, <strong>${buyerName}</strong> te ha enviado una tarjeta regalo para disfrutar de los servicios de NAILOX.
      </p>

      <!-- Gift card visual -->
      <div style="background:linear-gradient(135deg,#f43f5e,#ec4899,#f97316);border-radius:20px;padding:32px 24px;margin:20px 0;color:#ffffff;text-align:center;box-shadow:0 10px 30px rgba(244,63,94,0.3);">
        <p style="margin:0 0 8px;font-family:'Georgia',serif;font-size:14px;letter-spacing:6px;color:rgba(255,255,255,0.85);">NAIL<span style="color:#fbcfe8;">OX</span></p>
        <p style="margin:0 0 16px;font-size:11px;letter-spacing:2px;color:rgba(255,255,255,0.8);text-transform:uppercase;">Tarjeta Regalo · ${occasion}</p>
        <p style="margin:0 0 8px;font-size:48px;font-weight:800;color:#ffffff;">${amount} €</p>
        <p style="margin:0;font-size:13px;color:rgba(255,255,255,0.9);">Para: <strong style="color:#ffffff;">${recipientName}</strong></p>
      </div>

      <!-- Code box -->
      <div style="background:#fff;border:2px dashed #f43f5e;border-radius:14px;padding:20px;margin:20px 0;text-align:center;">
        <p style="margin:0 0 6px;font-size:11px;color:#6b7280;text-transform:uppercase;letter-spacing:1.5px;font-weight:600;">Tu código</p>
        <p style="margin:0;font-family:'Courier New',monospace;font-size:24px;font-weight:700;color:#f43f5e;letter-spacing:3px;">${code}</p>
      </div>

      ${message ? `
        <div style="background:#fef2f2;border-radius:14px;padding:18px;margin:20px 0;">
          <p style="margin:0 0 8px;font-size:11px;color:#9f1239;text-transform:uppercase;letter-spacing:1px;font-weight:700;">Mensaje de ${buyerName}</p>
          <p style="margin:0;font-size:14px;color:#374151;line-height:1.7;font-style:italic;">"${message}"</p>
        </div>
      ` : ""}

      <!-- How to use -->
      <div style="background:#f9fafb;border-radius:14px;padding:20px;margin:24px 0;">
        <p style="margin:0 0 12px;font-size:13px;font-weight:700;color:#1f2937;">¿Cómo canjearla?</p>
        <ol style="margin:0;padding-left:20px;font-size:13px;color:#4b5563;line-height:1.9;">
          <li>Reserva una cita en NAILOX</li>
          <li>Elige los servicios que quieras</li>
          <li>Introduce tu código <strong>${code}</strong> al pagar</li>
        </ol>
      </div>

      <div style="text-align:center;margin:28px 0;">
        <a href="${brand.site_url}/reservar" style="display:inline-block;background:linear-gradient(135deg,${brand.email_header_color},${brand.email_header_color2});color:#ffffff;font-size:14px;font-weight:700;padding:14px 32px;border-radius:50px;text-decoration:none;">Reservar mi cita</a>
      </div>

      <p style="margin:0;font-size:12px;color:#9ca3af;text-align:center;">
        ✨ Tu tarjeta regalo es válida durante 12 meses · Disfrútala cuando quieras
      </p>
    `, brand),
  };
}

function buildGiftCardConfirmation(data: Record<string, unknown>, brand: BrandConfig) {
  const buyerName = (data.buyerName as string) || "Cliente";
  const recipientName = (data.recipientName as string) || "";
  const amount = Number(data.amount) || 0;
  const code = (data.code as string) || "";
  const occasion = (data.occasion as string) || "";

  return {
    subject: `✅ Compra confirmada — Tarjeta Regalo NAILOX ${amount}€`,
    html: wrapper(`
      <h2 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#1A1A1A;">¡Compra exitosa! 🎁</h2>
      <p style="margin:0 0 24px;font-size:14px;color:#6b7280;line-height:1.7;">
        Hola <strong>${buyerName}</strong>, hemos procesado correctamente tu compra de la tarjeta regalo NAILOX.
        ${recipientName ? `<br>Hemos enviado la tarjeta directamente a <strong>${recipientName}</strong>.` : ""}
      </p>

      <!-- Summary -->
      <div style="background:${brand.email_card_bg};border-radius:14px;padding:20px;margin:20px 0;">
        <p style="margin:0 0 14px;font-size:12px;font-weight:700;color:#9f1239;text-transform:uppercase;letter-spacing:1px;">Resumen de tu compra</p>
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr><td style="padding:6px 0;font-size:12px;color:#6b7280;width:140px;">Tarjeta regalo</td><td style="padding:6px 0;font-size:13px;color:#1f2937;font-weight:600;">${amount} €</td></tr>
          ${recipientName ? `<tr><td style="padding:6px 0;font-size:12px;color:#6b7280;">Destinatario</td><td style="padding:6px 0;font-size:13px;color:#1f2937;font-weight:600;">${recipientName}</td></tr>` : ""}
          ${occasion ? `<tr><td style="padding:6px 0;font-size:12px;color:#6b7280;">Ocasión</td><td style="padding:6px 0;font-size:13px;color:#1f2937;font-weight:600;">${occasion}</td></tr>` : ""}
          <tr><td style="padding:6px 0;font-size:12px;color:#6b7280;">Código</td><td style="padding:6px 0;font-family:'Courier New',monospace;font-size:14px;color:#f43f5e;font-weight:700;letter-spacing:2px;">${code}</td></tr>
          <tr><td style="padding:6px 0;font-size:12px;color:#6b7280;">Validez</td><td style="padding:6px 0;font-size:12px;color:#059669;font-weight:600;">12 meses desde hoy</td></tr>
        </table>
      </div>

      <div style="background:#fef3c7;border-radius:12px;padding:16px;margin:20px 0;">
        <p style="margin:0;font-size:13px;color:#92400e;line-height:1.6;">
          💡 <strong>Guarda este código</strong> por si quieres compartirlo manualmente o como respaldo.
        </p>
      </div>

      <div style="text-align:center;margin:28px 0;">
        <a href="${brand.site_url}/mi-cuenta" style="display:inline-block;background:linear-gradient(135deg,${brand.email_header_color},${brand.email_header_color2});color:#ffffff;font-size:14px;font-weight:600;padding:14px 32px;border-radius:50px;text-decoration:none;">Ver mis tarjetas regalo</a>
      </div>

      <p style="margin:0;font-size:12px;color:#9ca3af;text-align:center;">Gracias por confiar en NAILOX para tus regalos especiales 💖</p>
    `, brand),
  };
}

function buildGiftCardAdmin(data: Record<string, unknown>, brand: BrandConfig) {
  const buyerName = (data.buyerName as string) || "";
  const buyerEmail = (data.buyerEmail as string) || "";
  const recipientName = (data.recipientName as string) || "—";
  const amount = Number(data.amount) || 0;
  const code = (data.code as string) || "";
  const giftType = (data.giftType as string) || "single";

  return {
    subject: `🎁 Nueva venta — Tarjeta Regalo ${amount}€ (${code})`,
    html: wrapper(`
      <h2 style="margin:0 0 12px;font-size:20px;font-weight:700;color:#1A1A1A;">🎁 Nueva tarjeta regalo vendida</h2>
      <div style="background:${brand.email_card_bg};border-radius:14px;padding:20px;margin:20px 0;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr><td style="padding:6px 0;font-size:12px;color:#6b7280;width:140px;">Comprador</td><td style="padding:6px 0;font-size:13px;color:#1f2937;font-weight:600;">${buyerName} (${buyerEmail})</td></tr>
          <tr><td style="padding:6px 0;font-size:12px;color:#6b7280;">Destinatario</td><td style="padding:6px 0;font-size:13px;color:#1f2937;font-weight:600;">${recipientName}</td></tr>
          <tr><td style="padding:6px 0;font-size:12px;color:#6b7280;">Tipo</td><td style="padding:6px 0;font-size:13px;color:#1f2937;font-weight:600;">${giftType}</td></tr>
          <tr><td style="padding:6px 0;font-size:12px;color:#6b7280;">Importe</td><td style="padding:6px 0;font-size:14px;color:#059669;font-weight:700;">${amount} €</td></tr>
          <tr><td style="padding:6px 0;font-size:12px;color:#6b7280;">Código</td><td style="padding:6px 0;font-family:'Courier New',monospace;font-size:13px;color:#f43f5e;font-weight:700;letter-spacing:2px;">${code}</td></tr>
        </table>
      </div>
    `, brand),
  };
}

function buildNewsletterWelcome(data: Record<string, unknown>, brand: BrandConfig) {
  const email = (data.email as string) || "";
  const grad = `linear-gradient(135deg,${brand.email_header_color},${brand.email_header_color2})`;
  return {
    subject: `¡Ya eres parte de la comunidad ${brand.email_brand_name}! 💅`,
    html: wrapper(`
      <h2 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#1A1A1A;">¡Bienvenida a la comunidad!</h2>
      <p style="margin:0 0 20px;font-size:14px;color:#6b7280;line-height:1.7;">
        Gracias por suscribirte al newsletter de <strong>${brand.email_brand_name}</strong>. A partir de ahora recibirás:
      </p>
      <div style="background:${brand.email_card_bg};border-radius:14px;padding:20px 24px;margin-bottom:24px;">
        <ul style="margin:0;padding-left:18px;font-size:13px;color:#374151;line-height:2.2;">
          <li>Tips y técnicas exclusivas de nail art</li>
          <li>Nuevos módulos y recursos descargables</li>
          <li>Ofertas especiales y acceso anticipado</li>
          <li>Novedades de la comunidad ${brand.email_brand_name}</li>
        </ul>
      </div>
      <div style="text-align:center;margin:24px 0;">
        <a href="${brand.site_url}" style="display:inline-block;background:${grad};color:#ffffff;font-size:14px;font-weight:600;padding:14px 32px;border-radius:50px;text-decoration:none;">Explorar ${brand.email_brand_name}</a>
      </div>
      <p style="margin:0;font-size:11px;color:#9ca3af;text-align:center;">Suscrito con: ${email}</p>
    `, brand),
  };
}

// ── Main handler ──────────────────────────────────────────────────────────
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resendKey = getResendKey();

    if (!resendKey) {
      console.error("RESEND_API_KEY not found.");
      return new Response(
        JSON.stringify({ success: false, error: "RESEND_API_KEY not configured." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const payload = await req.json() as EmailPayload;
    const { type, to, data: rawData = {} } = payload;
    const data = { ...rawData }; // Mutable copy

    console.log(`📩 [resend-email] Incoming request [${type}] to ${to?.email}`);

    // ── Notification logger (records every outcome in notification_logs) ──
    const logNotification = async (params: {
      status: "sent" | "failed" | "skipped";
      title?: string | null;
      body?: string | null;
      error_message?: string | null;
    }) => {
      try {
        const supabaseUrl = Deno.env.get("SUPABASE_URL");
        const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
        if (!supabaseUrl || !supabaseKey) return;
        await fetch(`${supabaseUrl}/rest/v1/notification_logs`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "apikey": supabaseKey,
            "Authorization": `Bearer ${supabaseKey}`,
            "Prefer": "return=minimal",
          },
          body: JSON.stringify({
            channel: "email",
            notification_type: type,
            title: params.title ?? null,
            body: params.body ?? (to?.email ? `Destinatario: ${to.email}` : null),
            recipient_email: to?.email ?? null,
            recipient_name: to?.name ?? null,
            status: params.status,
            error_message: params.error_message ?? null,
            sent_at: new Date().toISOString(),
          }),
        });
      } catch (logErr) {
        console.warn("[resend-email] log insert failed:", logErr);
      }
    };

    if (!to || !to.email) {
      console.error("❌ [resend-email] No recipient email provided");
      await logNotification({
        status: "skipped",
        title: `[${type}] sin destinatario`,
        error_message: "No recipient email provided",
      });
      return new Response(JSON.stringify({ success: false, error: "No recipient email provided" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const brand = await loadBrandConfig();

    // ── Generate links if needed BEFORE template processing ──────────────────
    // This ensures that both DB custom templates and built-in builders have the link.
    if (type === "signup_confirmation" || type === "verify_email") {
      let confirmationLink = (data.link as string) || null;
      if (!confirmationLink || confirmationLink === "#") {
        const siteUrl = brand.site_url || "https://nailox.com";
        const redirectTo = `${siteUrl}/confirmar-email`;
        console.log(`🔗 Generating signup link for ${to.email}...`);
        const { link, error } = await generateSupabaseLink("signup", to.email, redirectTo);
        confirmationLink = link || redirectTo;
      }
      data.link = confirmationLink;
    } else if (type === "password_reset") {
      let recoveryLink = (data.link as string) || null;
      if (!recoveryLink || recoveryLink === "#") {
        const siteUrl = brand.site_url || "https://nailox.com";
        const redirectTo = (data.redirectTo as string) || `${siteUrl}/nueva-contrasena`;
        console.log(`🔗 Generating recovery link for ${to.email}...`);
        const { link, error } = await generateSupabaseLink("recovery", to.email, redirectTo);
        
        if (error === "USER_NOT_FOUND") {
          return new Response(
            JSON.stringify({ success: false, error: "USER_NOT_FOUND" }),
            { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        
        recoveryLink = link;
        
        // Fallback for other errors (security fallback)
        if (!recoveryLink) {
          console.warn(`⚠️ Could not generate recovery link for ${to.email}:`, error);
          recoveryLink = `${siteUrl}/login`;
        }
      }
      data.link = recoveryLink;
    }

    // ── Check if there is a custom template (passed directly or in DB) ────
    let customTemplate: any = null;
    if (data.customHtml) {
      customTemplate = { email_body: data.customHtml, title: data.title || "Prueba de Diseño" };
    } else {
      try {
        const supabaseUrl = Deno.env.get("SUPABASE_URL");
        const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
        if (supabaseUrl && supabaseKey) {
          const res = await fetch(`${supabaseUrl}/rest/v1/notification_templates?type=eq.${type}&select=title,email_body`, {
            headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` }
          });
          if (res.ok) {
            const rows = await res.json();
            if (rows && rows.length > 0 && rows[0].email_body) {
              customTemplate = rows[0];
            }
          }
        }
      } catch (err) {
        console.warn("Error loading custom template:", err);
      }
    }

    let emailContent: { subject: string; html: string };
    let recipientEmail = to.email;

    if (customTemplate) {
      console.log(`✨ Using custom DB template for [${type}]`);
      let body = customTemplate.email_body;
      let subject = customTemplate.title || "Notificación de Nailox";

      // Simple placeholder replacement
      Object.entries(data).forEach(([key, val]) => {
        const regex = new RegExp(`{{${key}}}`, "g");
        body = body.replace(regex, String(val));
        subject = subject.replace(regex, String(val));
      });

      emailContent = {
        subject,
        html: wrapper(body, brand)
      };
    } else if (type === "signup_confirmation") {
      emailContent = buildSignupConfirmation(data, brand);

    } else if (type === "password_reset") {
      emailContent = buildPasswordReset(data, brand);

    } else if (type === "booking_new_admin") {
      // Send to notification_email (admin/professional), fallback to contact_email
      const notifEmail = brand.notification_email || brand.contact_email;
      if (!notifEmail) {
        console.warn("No notification_email configured, skipping admin notification");
        await logNotification({
          status: "skipped",
          title: `[${type}] omitido`,
          error_message: "No notification_email configured",
        });
        return new Response(
          JSON.stringify({ success: true, skipped: true, reason: "No notification_email configured" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      recipientEmail = notifEmail;
      emailContent = buildBookingNewAdmin(data, brand);

    } else {
      switch (type) {
        case "welcome": emailContent = buildWelcome(data, brand); break;
        case "verify_email": emailContent = buildVerifyEmail(data, brand); break;
        case "booking_confirmation": emailContent = buildBookingConfirmation(data, brand); break;
        case "booking_reminder": emailContent = buildBookingReminder(data, brand); break;
        case "booking_cancelled": emailContent = buildBookingCancelled(data, brand); break;
        case "purchase_confirmation": emailContent = buildPurchaseConfirmation(data, brand); break;
        case "gift_card_received": emailContent = buildGiftCardReceived(data, brand); break;
        case "gift_card_confirmation": emailContent = buildGiftCardConfirmation(data, brand); break;
        case "gift_card_admin": emailContent = buildGiftCardAdmin(data, brand); break;
        case "newsletter_welcome": emailContent = buildNewsletterWelcome(data, brand); break;
        default: 
          console.log(`⚠️ Unknown type [${type}], using default simple layout`);
          emailContent = {
            subject: (data.title as string) || "Notificación de Nailox",
            html: wrapper(`
              <h2 style="margin:0 0 10px;font-size:20px;font-weight:700;color:#1e293b;">${(data.title as string) || "Notificación"}</h2>
              <p style="margin:0;font-size:14px;color:#64748b;line-height:1.6;">${(data.body as string) || ""}</p>
              ${data.link ? `
                <div style="margin-top:25px;text-align:center;">
                  <a href="${data.link}" style="display:inline-block;background:#f43f5e;color:#ffffff;padding:12px 30px;border-radius:50px;text-decoration:none;font-weight:700;font-size:14px;">Ver detalles</a>
                </div>
              ` : ""}
            `, brand)
          };
      }
    }

    const senderEmail = brand.sender_email || "noreply@nailox.com";

    const resendBody = {
      from: `${brand.email_brand_name} <${senderEmail}>`,
      to: [recipientEmail],
      subject: emailContent.subject,
      html: emailContent.html,
    };

    console.log(`📤 [resend-email] Sending [${type}] via Resend to ${recipientEmail}...`);

    const res = await fetch(RESEND_API, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${resendKey}` },
      body: JSON.stringify(resendBody),
    });

    const resText = await res.text();
    let resData: Record<string, unknown> = {};
    try { 
      resData = JSON.parse(resText); 
    } catch { 
      resData = { raw: resText }; 
    }

    if (!res.ok) {
      const errMsg = `Resend error (${res.status}): ${typeof resData === 'object' ? JSON.stringify(resData) : String(resData)}`;
      console.error(`❌ [resend-email] Resend API error ${res.status}:`, JSON.stringify(resData, null, 2));
      await logNotification({
        status: "failed",
        title: emailContent.subject,
        body: `Destinatario: ${recipientEmail}`,
        error_message: errMsg,
      });
      return new Response(
        JSON.stringify({ success: false, error: `Resend error (${res.status})`, details: resData }),
        { status: res.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`✅ [resend-email] Email [${type}] sent successfully to ${recipientEmail}. ID: ${resData.id}`);

    await logNotification({
      status: "sent",
      title: emailContent.subject,
      body: `Enviado a: ${recipientEmail}`,
    });

    return new Response(
      JSON.stringify({ success: true, messageId: resData.id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err: unknown) {
    const message = err instanceof Error ? err.stack || err.message : "Unknown error";
    console.error("Resend email error:", message);
    return new Response(
      JSON.stringify({ success: false, error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});