const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey, x-client-info",
};

const BREVO_API = "https://api.brevo.com/v3/smtp/email";

// Try multiple possible secret names for the Brevo API key
function getBrevoKey(): string | undefined {
  const candidates = [
    "BREVO_API_KEY",
    "BREVO_KEY",
    "BREVO_APIKEY",
    "BREVO_SECRET_KEY",
    "BREVO_SECRET",
  ];
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
  | "purchase_confirmation"
  | "newsletter_welcome";

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
};

async function loadBrandConfig(): Promise<BrandConfig> {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !supabaseKey) return DEFAULT_BRAND;

    const res = await fetch(
      `${supabaseUrl}/rest/v1/center_settings?id=eq.main&select=email_brand_name,site_url,contact_email,sender_email,email_footer_text,email_header_color,email_header_color2,email_accent_color,email_bg_color,email_card_bg`,
      {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
      }
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
    };
  } catch {
    return DEFAULT_BRAND;
  }
}

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
            <span style="font-family:'Georgia',serif;font-size:30px;font-weight:700;letter-spacing:6px;color:#ffffff;">
              ${brand.email_brand_name}
            </span>
          </td>
        </tr>
        <tr>
          <td style="padding:36px 40px;">
            ${content}
          </td>
        </tr>
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

function btnPrimary(href: string, label: string, brand: BrandConfig) {
  const grad = `linear-gradient(135deg,${brand.email_header_color},${brand.email_header_color2})`;
  return `<a href="${href}" style="display:inline-block;background:${grad};color:#ffffff;font-size:14px;font-weight:600;padding:14px 32px;border-radius:50px;text-decoration:none;letter-spacing:0.3px;">${label}</a>`;
}

function buildWelcome(data: Record<string, unknown>, brand: BrandConfig) {
  const name = (data.name as string) || "Estudiante";
  return {
    subject: `¡Bienvenida a ${brand.email_brand_name}! Tu formación comienza ahora`,
    html: wrapper(`
      <h2 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#1A1A1A;">¡Hola, ${name}! 💅</h2>
      <p style="margin:0 0 20px;font-size:14px;color:#6b7280;line-height:1.7;">
        Nos alegra tenerte en <strong>${brand.email_brand_name}</strong>. Tu cuenta ha sido creada exitosamente y ya puedes acceder a todos los recursos de la plataforma.
      </p>
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
        ${btnPrimary(`${brand.site_url}/login`, "Ir a mi cuenta", brand)}
      </div>
      <p style="margin:0;font-size:12px;color:#9ca3af;text-align:center;">Si tienes alguna duda, escríbenos a <a href="mailto:${brand.contact_email}" style="color:${brand.email_accent_color};">${brand.contact_email}</a></p>
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
  const name = (data.name as string) || "Estudiante";
  const link = (data.link as string) || "#";
  return {
    subject: `Restablece tu contraseña — ${brand.email_brand_name}`,
    html: wrapper(`
      <h2 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#1A1A1A;">Restablecer contraseña</h2>
      <p style="margin:0 0 20px;font-size:14px;color:#6b7280;line-height:1.7;">
        Hola <strong>${name}</strong>, recibimos una solicitud para restablecer la contraseña de tu cuenta ${brand.email_brand_name}. Haz clic en el botón para crear una nueva contraseña.
      </p>
      <div style="text-align:center;margin:28px 0;">
        ${btnPrimary(link, "Restablecer contraseña", brand)}
      </div>
      <div style="background:${brand.email_card_bg};border-radius:12px;padding:14px 20px;margin-bottom:16px;">
        <p style="margin:0;font-size:12px;color:#9f1239;">
          <strong>Importante:</strong> Este enlace expira en 1 hora. Si no solicitaste este cambio, ignora este correo.
        </p>
      </div>
      <p style="margin:0;font-size:12px;color:#9ca3af;text-align:center;">¿Necesitas ayuda? Escríbenos a <a href="mailto:${brand.contact_email}" style="color:${brand.email_accent_color};">${brand.contact_email}</a></p>
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
        <tr>
          <td style="padding:5px 0;font-size:12px;color:#166534;font-weight:600;width:110px;">Nombre</td>
          <td style="padding:5px 0;font-size:13px;color:#1f2937;font-weight:600;">${proName}</td>
        </tr>
        ${proAddress ? `<tr>
          <td style="padding:5px 0;font-size:12px;color:#166534;font-weight:600;vertical-align:top;">Dirección</td>
          <td style="padding:5px 0;font-size:13px;color:#1f2937;">
            ${proAddress}
            ${mapsUrl ? `<br><a href="${mapsUrl}" style="color:${brand.email_accent_color};font-size:12px;font-weight:600;text-decoration:none;">Ver en Google Maps</a>` : ""}
          </td>
        </tr>` : ""}
        ${proInstagram ? `<tr>
          <td style="padding:5px 0;font-size:12px;color:#166534;font-weight:600;">Instagram</td>
          <td style="padding:5px 0;font-size:13px;">
            <a href="https://instagram.com/${proInstagram.replace(/^@/, "")}" style="color:${brand.email_accent_color};text-decoration:none;font-weight:500;">@${proInstagram.replace(/^@/, "")}</a>
          </td>
        </tr>` : ""}
      </table>
    </div>
  ` : "";

  return {
    subject: `Reserva confirmada — ${formattedDate} a las ${time}`,
    html: wrapper(`
      <h2 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#1A1A1A;">¡Tu cita está confirmada! 🎉</h2>
      <p style="margin:0 0 20px;font-size:14px;color:#6b7280;line-height:1.7;">
        Hola <strong>${name}</strong>, tu reserva ha sido procesada correctamente. Aquí tienes todos los detalles:
      </p>
      <div style="background:${brand.email_card_bg};border-radius:14px;padding:20px 24px;margin-bottom:24px;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="padding:6px 0;font-size:12px;color:#9f1239;font-weight:600;width:110px;">Fecha</td>
            <td style="padding:6px 0;font-size:13px;color:#1f2937;font-weight:500;text-transform:capitalize;">${formattedDate}</td>
          </tr>
          <tr>
            <td style="padding:6px 0;font-size:12px;color:#9f1239;font-weight:600;">Hora</td>
            <td style="padding:6px 0;font-size:13px;color:#1f2937;font-weight:500;">${time}</td>
          </tr>
          <tr>
            <td style="padding:6px 0;font-size:12px;color:#9f1239;font-weight:600;vertical-align:top;">Servicios</td>
            <td style="padding:6px 0;"><ul style="margin:0;padding-left:16px;">${servicesList}</ul></td>
          </tr>
          <tr>
            <td style="padding:6px 0;font-size:12px;color:#9f1239;font-weight:600;">Total</td>
            <td style="padding:6px 0;font-size:13px;color:#1f2937;font-weight:700;">€${total.toFixed(2)}</td>
          </tr>
          <tr>
            <td style="padding:6px 0;font-size:12px;color:#9f1239;font-weight:600;">Anticipo</td>
            <td style="padding:6px 0;font-size:13px;color:#059669;font-weight:600;">€${deposit.toFixed(2)} pagado</td>
          </tr>
          <tr>
            <td style="padding:6px 0;font-size:12px;color:#9f1239;font-weight:600;">Pendiente</td>
            <td style="padding:6px 0;font-size:13px;color:#d97706;font-weight:600;">€${remaining.toFixed(2)} (en el momento de la cita)</td>
          </tr>
        </table>
      </div>
      ${proBlock}
      <p style="margin:0 0 8px;font-size:13px;color:#6b7280;line-height:1.6;">
        Si necesitas cancelar o modificar tu cita, contáctanos con al menos 24 horas de antelación.
      </p>
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

  return {
    subject: `Recordatorio de cita — ${formattedDate} a las ${time}`,
    html: wrapper(`
      <h2 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#1A1A1A;">¡Te esperamos pronto! 💅</h2>
      <p style="margin:0 0 20px;font-size:14px;color:#6b7280;line-height:1.7;">
        Hola <strong>${name}</strong>, te recordamos que tienes una cita programada. Aquí tienes todos los detalles:
      </p>
      <div style="background:${brand.email_card_bg};border-radius:14px;padding:20px 24px;margin-bottom:24px;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="padding:6px 0;font-size:12px;color:#9f1239;font-weight:600;width:110px;">📅 Fecha</td>
            <td style="padding:6px 0;font-size:13px;color:#1f2937;font-weight:500;text-transform:capitalize;">${formattedDate}</td>
          </tr>
          <tr>
            <td style="padding:6px 0;font-size:12px;color:#9f1239;font-weight:600;">🕐 Hora</td>
            <td style="padding:6px 0;font-size:13px;color:#1f2937;font-weight:500;">${time}</td>
          </tr>
          <tr>
            <td style="padding:6px 0;font-size:12px;color:#9f1239;font-weight:600;vertical-align:top;">✂️ Servicios</td>
            <td style="padding:6px 0;"><ul style="margin:0;padding-left:16px;">${servicesList}</ul></td>
          </tr>
          <tr>
            <td style="padding:6px 0;font-size:12px;color:#9f1239;font-weight:600;">💰 Total</td>
            <td style="padding:6px 0;font-size:13px;color:#1f2937;font-weight:700;">€${total.toFixed(2)}</td>
          </tr>
          <tr>
            <td style="padding:6px 0;font-size:12px;color:#9f1239;font-weight:600;">🧾 Anticipo</td>
            <td style="padding:6px 0;font-size:14px;">${depositStatus}</td>
          </tr>
        </table>
      </div>
      <p style="margin:0 0 8px;font-size:13px;color:#6b7280;line-height:1.6;">
        Recuerda que el resto <strong>(€${remaining})</strong> se abona en el momento de la cita.
      </p>
      <p style="margin:0;font-size:13px;color:#6b7280;line-height:1.6;">
        Si necesitas cancelar o modificar tu cita, contáctanos con antelación.
      </p>
    `, brand),
  };
}

function buildPurchaseConfirmation(data: Record<string, unknown>, brand: BrandConfig) {
  const name = (data.name as string) || "Estudiante";
  const courseName = (data.courseName as string) || `Curso ${brand.email_brand_name}`;
  const amount = Number(data.amount) || 0;
  const orderId = (data.orderId as string) || "";

  return {
    subject: `¡Acceso activado! ${courseName} — ${brand.email_brand_name}`,
    html: wrapper(`
      <h2 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#1A1A1A;">¡Compra exitosa! 🎓</h2>
      <p style="margin:0 0 20px;font-size:14px;color:#6b7280;line-height:1.7;">
        Hola <strong>${name}</strong>, tu pago ha sido procesado y ya tienes acceso completo a tu curso.
      </p>
      <div style="background:${brand.email_card_bg};border-radius:14px;padding:20px 24px;margin-bottom:24px;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="padding:6px 0;font-size:12px;color:#9f1239;font-weight:600;width:110px;">Curso</td>
            <td style="padding:6px 0;font-size:13px;color:#1f2937;font-weight:600;">${courseName}</td>
          </tr>
          <tr>
            <td style="padding:6px 0;font-size:12px;color:#9f1239;font-weight:600;">Total pagado</td>
            <td style="padding:6px 0;font-size:13px;color:#059669;font-weight:700;">€${amount.toFixed(2)}</td>
          </tr>
          ${orderId ? `<tr>
            <td style="padding:6px 0;font-size:12px;color:#9f1239;font-weight:600;">Pedido</td>
            <td style="padding:6px 0;font-size:12px;color:#6b7280;">${orderId}</td>
          </tr>` : ""}
        </table>
      </div>
      <div style="text-align:center;margin:24px 0;">
        ${btnPrimary(`${brand.site_url}/login`, "Acceder a mi curso", brand)}
      </div>
      <p style="margin:0;font-size:12px;color:#9ca3af;text-align:center;">Tienes acceso de por vida a todos los materiales del curso.</p>
    `, brand),
  };
}

function buildNewsletterWelcome(data: Record<string, unknown>, brand: BrandConfig) {
  const email = (data.email as string) || "";
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
        ${btnPrimary(brand.site_url, `Explorar ${brand.email_brand_name}`, brand)}
      </div>
      <p style="margin:0;font-size:11px;color:#9ca3af;text-align:center;">
        Suscrito con: ${email}
      </p>
    `, brand),
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const brevoKey = getBrevoKey();

    if (!brevoKey) {
      console.error("BREVO_API_KEY not found. Checked: BREVO_API_KEY, BREVO_KEY, BREVO_APIKEY, BREVO_SECRET_KEY, BREVO_SECRET");
      return new Response(
        JSON.stringify({
          success: false,
          error: "BREVO_API_KEY not configured. Please add it in Supabase Edge Function Secrets with the exact name: BREVO_API_KEY",
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const payload = await req.json() as EmailPayload;
    const { type, to, data = {} } = payload;

    const brand = await loadBrandConfig();

    let emailContent: { subject: string; html: string };

    switch (type) {
      case "welcome":
        emailContent = buildWelcome(data, brand);
        break;
      case "verify_email":
        emailContent = buildVerifyEmail(data, brand);
        break;
      case "password_reset":
        emailContent = buildPasswordReset(data, brand);
        break;
      case "booking_confirmation":
        emailContent = buildBookingConfirmation(data, brand);
        break;
      case "booking_reminder":
        emailContent = buildBookingReminder(data, brand);
        break;
      case "purchase_confirmation":
        emailContent = buildPurchaseConfirmation(data, brand);
        break;
      case "newsletter_welcome":
        emailContent = buildNewsletterWelcome(data, brand);
        break;
      default:
        throw new Error(`Unknown email type: ${type}`);
    }

    // Use sender_email from brand config (must be verified in Brevo)
    const senderEmail = brand.sender_email || "noreply@nailox.com";

    const brevoBody = {
      sender: { name: brand.email_brand_name, email: senderEmail },
      to: [{ email: to.email, name: to.name || to.email }],
      subject: emailContent.subject,
      htmlContent: emailContent.html,
    };

    console.log(`Sending ${type} email to ${to.email} from ${senderEmail}`);

    const res = await fetch(BREVO_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": brevoKey,
      },
      body: JSON.stringify(brevoBody),
    });

    const resText = await res.text();
    let resData: Record<string, unknown> = {};
    try { resData = JSON.parse(resText); } catch { resData = { raw: resText }; }

    if (!res.ok) {
      console.error(`Brevo API error ${res.status}:`, resText);
      throw new Error(`Brevo error (${res.status}): ${resText}`);
    }

    console.log(`Email sent successfully. MessageId: ${resData.messageId}`);

    return new Response(
      JSON.stringify({ success: true, messageId: resData.messageId }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Brevo email error:", message);
    return new Response(
      JSON.stringify({ success: false, error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
