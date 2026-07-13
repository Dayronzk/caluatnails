import { AdminSidebar } from "../components/AdminSidebar";
import { Save, Bell, Shield, Globe, Palette, Zap, CheckCircle, XCircle, MapPin, Award, Mail, Timer, Tag, Smartphone } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

interface CenterSettings {
  center_name: string;
  address: string;
  city: string;
  postal_code: string;
  phone: string;
  email: string;
  schedule: string;
  bizum_whatsapp: string;
  pwa_name: string;
  pwa_short_name: string;
  pwa_icon_url: string;
}

const DEFAULT_CENTER: CenterSettings = {
  center_name: "CALUATNAILS Centro",
  address: "Calle Ejemplo 123",
  city: "Madrid",
  postal_code: "28001",
  phone: "+34 600 000 000",
  email: "info@caluatnails.es",
  schedule: "Lun-Vie 9:00-20:00 · Sáb 9:00-14:00",
  bizum_whatsapp: "",
  pwa_name: "CALUATNAILS",
  pwa_short_name: "CALUATNAILS",
  pwa_icon_url: "",
};

interface EmailBrand {
  email_brand_name: string;
  site_url: string;
  contact_email: string;
  sender_email: string;
  notification_email: string;
  email_footer_text: string;
  email_header_color: string;
  email_header_color2: string;
  email_accent_color: string;
  email_bg_color: string;
  email_card_bg: string;
}

const DEFAULT_EMAIL_BRAND: EmailBrand = {
  email_brand_name: "CALUATNAILS",
  site_url: "https://caluatnails.com",
  contact_email: "hola@caluatnails.com",
  sender_email: "noreply@caluatnails.com",
  notification_email: "",
  email_footer_text: "Curso Profesional de Manicura y Pedicura",
  email_header_color: "#f43f5e",
  email_header_color2: "#fb7185",
  email_accent_color: "#f43f5e",
  email_bg_color: "#fdf2f4",
  email_card_bg: "#fff1f2",
};



interface PresaleConfig {
  presale_mode: boolean;
  presale_badge_text: string;
  presale_hero_title: string;
  presale_hero_subtitle: string;
  presale_cta_text: string;
  presale_buy_btn_text: string;
  stripe_disabled: boolean;
  stripe_disabled_message: string;
}

const DEFAULT_PRESALE: PresaleConfig = {
  presale_mode: false,
  presale_badge_text: "🎉 PREVENTA ESPECIAL",
  presale_hero_title: "Conviértete en\nExperta en Uñas\ndesde Casa",
  presale_hero_subtitle: "Plazas limitadas en preventa. Reserva tu acceso ahora con precio especial y empieza en cuanto abramos el curso.",
  presale_cta_text: "Reservar plaza en preventa",
  presale_buy_btn_text: "Reservar ahora",
  stripe_disabled: false,
  stripe_disabled_message: "El pago online estará disponible próximamente. Contáctanos para reservar tu plaza.",
};

function ColorField({ label, value, onChange, hint }: { label: string; value: string; onChange: (v: string) => void; hint?: string }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1.5">{label}</label>
      <div className="flex items-center gap-2">
        <div className="relative">
          <input
            type="color"
            value={value}
            onChange={e => onChange(e.target.value)}
            className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer p-0.5 bg-white"
          />
        </div>
        <input
          type="text"
          value={value}
          onChange={e => onChange(e.target.value)}
          className="flex-1 px-3 py-2 rounded-xl border border-gray-200 focus:border-rose-400 focus:ring-2 focus:ring-rose-100 outline-none transition-all text-sm font-mono"
          placeholder="#f43f5e"
        />
      </div>
      {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
    </div>
  );
}

export default function AdminSettings() {
  const [webhookEmail, setWebhookEmail] = useState("");
  const [webhookLoading, setWebhookLoading] = useState(false);
  const [webhookResult, setWebhookResult] = useState<{ ok: boolean; msg: string } | null>(null);

  const [center, setCenter] = useState<CenterSettings>(DEFAULT_CENTER);
  const [centerLoading, setCenterLoading] = useState(true);
  const [centerSaving, setCenterSaving] = useState(false);
  const [centerSaved, setCenterSaved] = useState(false);

  const [emailBrand, setEmailBrand] = useState<EmailBrand>(DEFAULT_EMAIL_BRAND);
  const [emailBrandSaving, setEmailBrandSaving] = useState(false);
  const [emailBrandSaved, setEmailBrandSaved] = useState(false);

  const [urgency, setUrgency] = useState({
    hero_countdown_enabled: true,
    hero_countdown_hours: 72,
    hero_countdown_label: "Oferta termina en",
  });
  const [urgencySaving, setUrgencySaving] = useState(false);
  const [urgencySaved, setUrgencySaved] = useState(false);

  const [cert, setCert] = useState({
    academy_name: "Academia NailPro",
    instructor_name: "María González",
    instructor_title: "Instructora Principal",
    course_title: "Manicura y Nail Art Profesional",
    total_hours_override: "",
  });
  const [certSaving, setCertSaving] = useState(false);
  const [certSaved, setCertSaved] = useState(false);

  const [presale, setPresale] = useState<PresaleConfig>(DEFAULT_PRESALE);
  const [presaleSaving, setPresaleSaving] = useState(false);
  const [presaleSaved, setPresaleSaved] = useState(false);

  useEffect(() => {
    const loadCenter = async () => {
      const { data } = await supabase
        .from("center_settings")
        .select("*")
        .eq("id", "main")
        .maybeSingle();
      if (data) {
        setCenter({
          center_name: data.center_name ?? DEFAULT_CENTER.center_name,
          address: data.address ?? DEFAULT_CENTER.address,
          city: data.city ?? DEFAULT_CENTER.city,
          postal_code: data.postal_code ?? DEFAULT_CENTER.postal_code,
          phone: data.phone ?? DEFAULT_CENTER.phone,
          email: data.email ?? DEFAULT_CENTER.email,
          schedule: data.schedule ?? DEFAULT_CENTER.schedule,
          bizum_whatsapp: data.bizum_whatsapp ?? "",
          pwa_name: data.pwa_name ?? DEFAULT_CENTER.pwa_name,
          pwa_short_name: data.pwa_short_name ?? DEFAULT_CENTER.pwa_short_name,
          pwa_icon_url: data.pwa_icon_url ?? DEFAULT_CENTER.pwa_icon_url,
        });
        setCert({
          academy_name: data.academy_name ?? "Academia NailPro",
          instructor_name: data.instructor_name ?? "María González",
          instructor_title: data.instructor_title ?? "Instructora Principal",
          course_title: data.course_title ?? "Manicura y Nail Art Profesional",
          total_hours_override: data.total_hours_override ?? "",
        });
        setUrgency({
          hero_countdown_enabled: data.hero_countdown_enabled ?? true,
          hero_countdown_hours: data.hero_countdown_hours ?? 72,
          hero_countdown_label: data.hero_countdown_label ?? "Oferta termina en",
        });
        setEmailBrand({
          email_brand_name: data.email_brand_name ?? DEFAULT_EMAIL_BRAND.email_brand_name,
          site_url: data.site_url ?? DEFAULT_EMAIL_BRAND.site_url,
          contact_email: data.contact_email ?? DEFAULT_EMAIL_BRAND.contact_email,
          sender_email: data.sender_email ?? DEFAULT_EMAIL_BRAND.sender_email,
          notification_email: data.notification_email ?? DEFAULT_EMAIL_BRAND.notification_email,
          email_footer_text: data.email_footer_text ?? DEFAULT_EMAIL_BRAND.email_footer_text,
          email_header_color: data.email_header_color ?? DEFAULT_EMAIL_BRAND.email_header_color,
          email_header_color2: data.email_header_color2 ?? DEFAULT_EMAIL_BRAND.email_header_color2,
          email_accent_color: data.email_accent_color ?? DEFAULT_EMAIL_BRAND.email_accent_color,
          email_bg_color: data.email_bg_color ?? DEFAULT_EMAIL_BRAND.email_bg_color,
          email_card_bg: data.email_card_bg ?? DEFAULT_EMAIL_BRAND.email_card_bg,
        });
        setPresale({
          presale_mode: data.presale_mode ?? false,
          presale_badge_text: data.presale_badge_text ?? DEFAULT_PRESALE.presale_badge_text,
          presale_hero_title: data.presale_hero_title ?? DEFAULT_PRESALE.presale_hero_title,
          presale_hero_subtitle: data.presale_hero_subtitle ?? DEFAULT_PRESALE.presale_hero_subtitle,
          presale_cta_text: data.presale_cta_text ?? DEFAULT_PRESALE.presale_cta_text,
          presale_buy_btn_text: data.presale_buy_btn_text ?? DEFAULT_PRESALE.presale_buy_btn_text,
          stripe_disabled: data.stripe_disabled ?? false,
          stripe_disabled_message: data.stripe_disabled_message ?? DEFAULT_PRESALE.stripe_disabled_message,
        });
      }
      setCenterLoading(false);
    };
    loadCenter();
  }, []);

  const handleSaveUrgency = async () => {
    setUrgencySaving(true);
    await supabase.from("center_settings").upsert({ id: "main", ...urgency, updated_at: new Date().toISOString() });
    setUrgencySaving(false);
    setUrgencySaved(true);
    setTimeout(() => setUrgencySaved(false), 3000);
  };

  const handleSaveCenter = async () => {
    setCenterSaving(true);
    await supabase.from("center_settings").upsert({ id: "main", ...center, updated_at: new Date().toISOString() });
    setCenterSaving(false);
    setCenterSaved(true);
    setTimeout(() => setCenterSaved(false), 3000);
  };

  const handleSaveEmailBrand = async () => {
    setEmailBrandSaving(true);
    await supabase.from("center_settings").upsert({ id: "main", ...emailBrand, updated_at: new Date().toISOString() });
    setEmailBrandSaving(false);
    setEmailBrandSaved(true);
    setTimeout(() => setEmailBrandSaved(false), 3000);
  };

  const handleSaveCert = async () => {
    setCertSaving(true);
    await supabase.from("center_settings").upsert({ id: "main", ...cert, updated_at: new Date().toISOString() });
    setCertSaving(false);
    setCertSaved(true);
    setTimeout(() => setCertSaved(false), 3000);
  };

  const handleSavePresale = async () => {
    setPresaleSaving(true);
    await supabase.from("center_settings").upsert({ id: "main", ...presale, updated_at: new Date().toISOString() });
    setPresaleSaving(false);
    setPresaleSaved(true);
    setTimeout(() => setPresaleSaved(false), 3000);
  };

  const testWebhook = async () => {
    if (!webhookEmail.trim()) return;
    setWebhookLoading(true);
    setWebhookResult(null);
    try {
      const { error } = await supabase.from("purchases").upsert(
        {
          email: webhookEmail.toLowerCase().trim(),
          product_id: "prod_UG5ehG9IrGh4hl",
          session_id: `test_session_${Date.now()}`,
          amount_total: 9900,
          currency: "eur",
          status: "completed",
        },
        { onConflict: "session_id" }
      );
      if (error) {
        setWebhookResult({ ok: false, msg: error.message });
      } else {
        setWebhookResult({ ok: true, msg: `Compra de prueba registrada para ${webhookEmail}. El acceso está activo.` });
      }
    } catch (e) {
      setWebhookResult({ ok: false, msg: String(e) });
    }
    setWebhookLoading(false);
  };

  const [settings, setSettings] = useState({
    courseName: "Curso Profesional de Manicura y Pedicura",
    courseDescription: "Aprende las técnicas más avanzadas de manicura y pedicura con nuestro curso completo.",
    emailNotifications: true,
    progressAlerts: true,
    newStudentAlerts: true,
    publicCourse: true,
    freePreview: true,
    primaryColor: "rose",
  });

  const fullAddress = `${center.address}, ${center.city} ${center.postal_code}`;

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <AdminSidebar />
      <main className="flex-1 p-6 lg:p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Configuración</h1>
          <p className="text-gray-500 mt-1">Personaliza tu curso y preferencias</p>
        </div>

        <div className="max-w-3xl space-y-6">

          {/* ── MODO PREVENTA Y PAGOS ── */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center text-rose-600">
                  <Tag className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-bold text-gray-900">Modo Preventa y Pagos</h2>
                  <p className="text-sm text-gray-500">Controla el mensaje de preventa en la portada y los botones de pago</p>
                </div>
              </div>
              {presaleSaved && (
                <div className="flex items-center gap-1.5 text-emerald-600 text-sm font-medium">
                  <CheckCircle className="w-4 h-4" />Guardado
                </div>
              )}
            </div>

            <div className="space-y-5">
              <div className="space-y-4">
                <label className="flex items-center justify-between cursor-pointer">
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">Ocultar botones de pago con Stripe</p>
                    <p className="text-xs text-gray-500 mt-0.5">Cuando está activo, los botones de pago Stripe desaparecen del carrito y la tienda</p>
                  </div>
                  <div
                    onClick={() => setPresale(p => ({ ...p, stripe_disabled: !p.stripe_disabled }))}
                    className={`w-11 h-6 rounded-full cursor-pointer transition-colors flex-shrink-0 ml-4 ${presale.stripe_disabled ? "bg-rose-500" : "bg-gray-200"}`}
                  >
                    <div className="w-5 h-5 bg-white rounded-full shadow-sm transition-transform mt-0.5" style={{ transform: presale.stripe_disabled ? "translateX(22px)" : "translateX(2px)" }} />
                  </div>
                </label>
                {presale.stripe_disabled && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Mensaje cuando el pago está desactivado</label>
                    <input
                      type="text"
                      value={presale.stripe_disabled_message}
                      onChange={e => setPresale(p => ({ ...p, stripe_disabled_message: e.target.value }))}
                      placeholder="El pago online estará disponible próximamente..."
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-rose-400 focus:ring-2 focus:ring-rose-100 outline-none transition-all text-sm"
                    />
                  </div>
                )}
              </div>

              <div className="bg-rose-50 border border-rose-100 rounded-xl p-4 space-y-4">
                <label className="flex items-center justify-between cursor-pointer">
                  <div>
                    <p className="font-semibold text-rose-900 text-sm">Activar modo preventa en la portada</p>
                    <p className="text-xs text-rose-700 mt-0.5">Muestra un banner de preventa y cambia los textos del hero</p>
                  </div>
                  <div
                    onClick={() => setPresale(p => ({ ...p, presale_mode: !p.presale_mode }))}
                    className={`w-11 h-6 rounded-full cursor-pointer transition-colors flex-shrink-0 ml-4 ${presale.presale_mode ? "bg-rose-500" : "bg-gray-200"}`}
                  >
                    <div className="w-5 h-5 bg-white rounded-full shadow-sm transition-transform mt-0.5" style={{ transform: presale.presale_mode ? "translateX(22px)" : "translateX(2px)" }} />
                  </div>
                </label>

                {presale.presale_mode && (
                  <div className="space-y-3 pt-2 border-t border-rose-100">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5">Texto del badge de preventa</label>
                      <input
                        type="text"
                        value={presale.presale_badge_text}
                        onChange={e => setPresale(p => ({ ...p, presale_badge_text: e.target.value }))}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-rose-400 focus:ring-2 focus:ring-rose-100 outline-none transition-all text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5">Título del hero</label>
                      <textarea
                        value={presale.presale_hero_title}
                        onChange={e => setPresale(p => ({ ...p, presale_hero_title: e.target.value }))}
                        rows={2}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-rose-400 focus:ring-2 focus:ring-rose-100 outline-none transition-all text-sm resize-none"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleSavePresale}
                  disabled={presaleSaving}
                  className="flex items-center gap-2 px-6 py-2.5 bg-rose-500 text-white rounded-xl font-medium hover:bg-rose-600 transition-colors disabled:opacity-50 cursor-pointer whitespace-nowrap"
                >
                  {presaleSaving ? "Guardando..." : "Guardar configuración"}
                </button>
              </div>
            </div>
          </div>

          {/* ── CONTADOR DE URGENCIA ── */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600">
                  <Timer className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-bold text-gray-900">Contador de Urgencia</h2>
                  <p className="text-sm text-gray-500">Banner regresivo en la portada</p>
                </div>
              </div>
              {urgencySaved && <CheckCircle className="w-4 h-4 text-emerald-500" />}
            </div>
            <div className="space-y-4">
              <label className="flex items-center justify-between cursor-pointer">
                <p className="text-sm font-medium text-gray-700">Activar contador</p>
                <div
                  onClick={() => setUrgency(p => ({ ...p, hero_countdown_enabled: !p.hero_countdown_enabled }))}
                  className={`w-11 h-6 rounded-full cursor-pointer transition-colors ${urgency.hero_countdown_enabled ? "bg-amber-500" : "bg-gray-200"}`}
                >
                  <div className="w-5 h-5 bg-white rounded-full shadow-sm transition-transform mt-0.5" style={{ transform: urgency.hero_countdown_enabled ? "translateX(22px)" : "translateX(2px)" }} />
                </div>
              </label>
              <div className="flex justify-end">
                <button onClick={handleSaveUrgency} disabled={urgencySaving} className="px-4 py-2 bg-amber-500 text-white rounded-xl text-sm font-bold">
                  {urgencySaving ? "Guardando..." : "Guardar contador"}
                </button>
              </div>
            </div>
          </div>

          {/* ── DIRECCIÓN DEL CENTRO ── */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center text-rose-600">
                  <MapPin className="w-5 h-5" />
                </div>
                <h2 className="font-bold text-gray-900">Dirección del Centro</h2>
              </div>
              {centerSaved && <CheckCircle className="w-4 h-4 text-emerald-500" />}
            </div>
            <div className="space-y-4">
              <input type="text" value={center.address} onChange={e => setCenter({...center, address: e.target.value})} placeholder="Calle y número" className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm" />
              <div className="grid grid-cols-2 gap-3">
                <input type="text" value={center.city} onChange={e => setCenter({...center, city: e.target.value})} placeholder="Ciudad" className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm" />
                <input type="text" value={center.postal_code} onChange={e => setCenter({...center, postal_code: e.target.value})} placeholder="CP" className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm" />
              </div>
              <div className="flex justify-end">
                <button onClick={handleSaveCenter} disabled={centerSaving} className="px-6 py-2.5 bg-rose-500 text-white rounded-xl font-medium">
                  {centerSaving ? "Guardando..." : "Guardar dirección"}
                </button>
              </div>
            </div>
          </div>

          {/* ── CERTIFICADO ── */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600">
                  <Award className="w-5 h-5" />
                </div>
                <h2 className="font-bold text-gray-900">Certificado</h2>
              </div>
              {certSaved && <CheckCircle className="w-4 h-4 text-emerald-500" />}
            </div>
            <div className="space-y-4">
              <input type="text" value={cert.academy_name} onChange={e => setCert({...cert, academy_name: e.target.value})} placeholder="Nombre Academia" className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm" />
              <input type="text" value={cert.instructor_name} onChange={e => setCert({...cert, instructor_name: e.target.value})} placeholder="Instructora" className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm" />
              <div className="flex justify-end">
                <button onClick={handleSaveCert} disabled={certSaving} className="px-6 py-2.5 bg-amber-500 text-white rounded-xl font-medium">
                  {certSaving ? "Guardando..." : "Guardar certificado"}
                </button>
              </div>
            </div>
          </div>

          {/* ── BRANDING EMAILS ── */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center text-rose-600">
                  <Mail className="w-5 h-5" />
                </div>
                <h2 className="font-bold text-gray-900">Diseño de Emails</h2>
              </div>
              {emailBrandSaved && <CheckCircle className="w-4 h-4 text-emerald-500" />}
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <ColorField label="Color Acento" value={emailBrand.email_accent_color} onChange={v => setEmailBrand({...emailBrand, email_accent_color: v})} />
                <ColorField label="Color Fondo" value={emailBrand.email_bg_color} onChange={v => setEmailBrand({...emailBrand, email_bg_color: v})} />
              </div>
              <div className="flex justify-end">
                <button onClick={handleSaveEmailBrand} disabled={emailBrandSaving} className="px-6 py-2.5 bg-rose-500 text-white rounded-xl font-medium">
                  {emailBrandSaving ? "Guardando..." : "Guardar diseño"}
                </button>
              </div>
            </div>
          </div>

          {/* ── CONFIGURACIÓN PWA ── */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center text-rose-600">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-bold text-gray-900">Configuración de App (PWA)</h2>
                  <p className="text-sm text-gray-500">Ajusta cómo se ve la app al instalarla en móviles</p>
                </div>
              </div>
              {centerSaved && <CheckCircle className="w-4 h-4 text-emerald-500" />}
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Nombre de la App</label>
                <input 
                  type="text" 
                  value={center.pwa_name} 
                  onChange={e => setCenter({...center, pwa_name: e.target.value})} 
                  placeholder="Ej: Caluatnails Academia" 
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-rose-400 focus:ring-2 focus:ring-rose-100 outline-none transition-all" 
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Nombre Corto (Home Screen)</label>
                <input 
                  type="text" 
                  value={center.pwa_short_name} 
                  onChange={e => setCenter({...center, pwa_short_name: e.target.value})} 
                  placeholder="Ej: Caluatnails" 
                  maxLength={12}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-rose-400 focus:ring-2 focus:ring-rose-100 outline-none transition-all" 
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">URL del Logo de la App (512x512px)</label>
                <input 
                  type="url" 
                  value={center.pwa_icon_url} 
                  onChange={e => setCenter({...center, pwa_icon_url: e.target.value})} 
                  placeholder="https://..." 
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-rose-400 focus:ring-2 focus:ring-rose-100 outline-none transition-all" 
                />
              </div>
              <div className="flex justify-end">
                <button onClick={handleSaveCenter} disabled={centerSaving} className="px-6 py-2.5 bg-rose-500 text-white rounded-xl font-medium hover:bg-rose-600 transition-colors">
                  {centerSaving ? "Guardando..." : "Guardar ajustes PWA"}
                </button>
              </div>
            </div>
          </div>

          {/* ── TEST WEBHOOK ── */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600">
                <Zap className="w-5 h-5" />
              </div>
              <h2 className="font-bold text-gray-900">Simulador de Compra</h2>
            </div>
            <div className="flex gap-3">
              <input type="email" value={webhookEmail} onChange={e => setWebhookEmail(e.target.value)} placeholder="Email usuario" className="flex-1 px-4 py-3 rounded-xl border border-gray-200 text-sm" />
              <button onClick={testWebhook} disabled={webhookLoading} className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold">
                {webhookLoading ? "Procesando..." : "Simular"}
              </button>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
