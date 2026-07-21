import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { QRCodeSVG } from "qrcode.react";
import { GOOGLE_REVIEW_URL } from "@/lib/constants";

const WIFI_SSID = "DIGIFIBRA-PLUS-4AE4";
const WIFI_PASSWORD = "3UFPX73FD8";
const WIFI_ENCRYPTION: "WPA" | "WEP" | "nopass" = "WPA";
const WIFI_QR = `WIFI:T:${WIFI_ENCRYPTION};S:${WIFI_SSID};P:${WIFI_PASSWORD};H:false;;`;
const MOBILECONFIG_URL = "/assets/wifi-caluatnails.mobileconfig";

const ADDRESS = "Calle Padilla, 301 · Eixample · Barcelona";
const PHONE = "+34 635 797 539";
const PHONE_DISPLAY = "635 797 539";
const WHATSAPP_URL = "https://wa.me/34635797539";
const MAPS_URL =
  "https://www.google.com/maps/dir/?api=1&destination=Calle+Padilla+301,+08025+Barcelona";

type Device = "ios" | "android" | "other";

function detectDevice(): Device {
  if (typeof navigator === "undefined") return "other";
  const ua = navigator.userAgent || "";
  if (/iPad|iPhone|iPod/.test(ua) && !(window as unknown as { MSStream?: unknown }).MSStream) return "ios";
  if (/android/i.test(ua)) return "android";
  return "other";
}

export default function SedeEixamplePage() {
  const [showWifiModal, setShowWifiModal] = useState(false);
  const [device, setDevice] = useState<Device>("other");
  const [copied, setCopied] = useState<"ssid" | "pwd" | null>(null);

  useEffect(() => {
    setDevice(detectDevice());
  }, []);

  const copy = (value: string, what: "ssid" | "pwd") => {
    navigator.clipboard?.writeText(value).then(() => {
      setCopied(what);
      setTimeout(() => setCopied(null), 1800);
    });
  };

  const handleCopyPasswordAndOpenSettings = async () => {
    try {
      await navigator.clipboard.writeText(WIFI_PASSWORD);
      setCopied("pwd");
      setTimeout(() => setCopied(null), 2500);
    } catch {
      /* ignore */
    }
  };

  return (
    <>
      <Helmet>
        <title>Bienvenida a CALUATNAILS · Eixample Barcelona</title>
        <meta
          name="description"
          content="Bienvenida a CALUATNAILS Eixample. Conecta al WiFi gratis, deja tu reseña en Google y reserva tu próxima cita en un solo lugar."
        />
        <link rel="canonical" href="https://www.caluatnails.com/sede-eixample" />
        <meta property="og:title" content="Bienvenida a CALUATNAILS · Eixample Barcelona" />
        <meta
          property="og:description"
          content="WiFi gratis, reseña en Google y reservas en segundos. Todo desde tu móvil."
        />
        <meta property="og:image" content="https://www.caluatnails.com/assets/manicure-premium.png" />
        <meta property="og:url" content="https://www.caluatnails.com/sede-eixample" />
      </Helmet>

      <main className="min-h-screen bg-gradient-to-b from-rose-50 via-white to-rose-100/40 px-4 py-10">
        <div className="max-w-md mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-white shadow-lg shadow-rose-200/60 mb-4">
              <img src="/favicon.png" alt="CALUATNAILS" className="w-12 h-12 rounded-2xl" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
              Bienvenida a <span className="text-rose-600">CALUATNAILS</span>
            </h1>
            <p className="text-sm text-gray-500 mt-1">Eixample · Barcelona</p>
          </div>

          {/* Saludo */}
          <div className="bg-white rounded-3xl shadow-xl shadow-rose-100/60 p-6 mb-4 border border-rose-100">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-rose-400 to-pink-500 flex items-center justify-center shrink-0">
                <i className="ri-sparkling-2-fill text-white text-xl"></i>
              </div>
              <div>
                <h2 className="font-bold text-gray-900 text-lg leading-tight mb-1">
                  ¡Qué bien tenerte aquí!
                </h2>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Mientras disfrutas de tu cita, aprovecha para conectarte al WiFi y, si te ha gustado,
                  déjanos una reseña en Google. Tu opinión nos ayuda muchísimo a crecer 💕
                </p>
              </div>
            </div>
          </div>

          {/* ─── Card WiFi ─── */}
          <button
            onClick={() => setShowWifiModal(true)}
            className="w-full bg-gradient-to-br from-indigo-500 via-blue-500 to-cyan-500 text-white rounded-3xl p-6 mb-4 shadow-xl shadow-blue-200 hover:shadow-2xl hover:scale-[1.02] active:scale-[0.99] transition-all duration-200 text-left"
          >
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shrink-0">
                  <i className="ri-wifi-fill text-3xl"></i>
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] uppercase tracking-widest opacity-80 mb-0.5">WiFi gratis</p>
                  <p className="font-bold text-lg leading-tight truncate">Conectar al instante</p>
                  <p className="text-xs opacity-80 truncate">{WIFI_SSID}</p>
                </div>
              </div>
              <i className="ri-arrow-right-line text-2xl shrink-0"></i>
            </div>
          </button>

          {/* ─── Card Reseña ─── */}
          <a
            href={GOOGLE_REVIEW_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full bg-white border-2 border-amber-200 rounded-3xl p-6 mb-4 shadow-xl shadow-amber-100/50 hover:shadow-2xl hover:scale-[1.02] active:scale-[0.99] transition-all duration-200"
          >
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shrink-0 shadow-lg shadow-amber-200">
                  <i className="ri-google-fill text-3xl text-white"></i>
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] uppercase tracking-widest text-amber-700 font-semibold mb-0.5">
                    ¿Te ha gustado?
                  </p>
                  <p className="font-bold text-lg text-gray-900 leading-tight">Déjanos una reseña</p>
                  <div className="flex items-center gap-0.5 mt-0.5">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <i key={n} className="ri-star-fill text-amber-400 text-sm"></i>
                    ))}
                    <span className="text-xs text-gray-500 ml-1">en Google</span>
                  </div>
                </div>
              </div>
              <i className="ri-arrow-right-line text-2xl text-amber-600 shrink-0"></i>
            </div>
            <div className="mt-4 pt-4 border-t border-amber-100 flex items-center gap-2 text-xs text-amber-700">
              <i className="ri-coin-fill text-base"></i>
              <span className="font-semibold">¡Ganas +100 puntos CALUATNAILS!</span>
            </div>
          </a>

          {/* ─── Card Reservar ─── */}
          <Link
            to="/reservar"
            className="block w-full bg-gradient-to-br from-rose-500 via-pink-500 to-rose-600 text-white rounded-3xl p-6 mb-4 shadow-xl shadow-rose-200 hover:shadow-2xl hover:scale-[1.02] active:scale-[0.99] transition-all duration-200"
          >
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shrink-0">
                  <i className="ri-calendar-check-fill text-3xl"></i>
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] uppercase tracking-widest opacity-80 mb-0.5">Próxima cita</p>
                  <p className="font-bold text-lg leading-tight">Reserva ahora</p>
                  <p className="text-xs opacity-80">Confirmación inmediata</p>
                </div>
              </div>
              <i className="ri-arrow-right-line text-2xl shrink-0"></i>
            </div>
          </Link>

          {/* ─── Tarjeta Regalo + Promociones ─── */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <Link
              to="/tarjeta-regalo"
              className="bg-white rounded-2xl border border-gray-100 p-4 shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all"
            >
              <div className="w-10 h-10 rounded-xl bg-fuchsia-50 flex items-center justify-center mb-2">
                <i className="ri-gift-2-fill text-fuchsia-500 text-xl"></i>
              </div>
              <p className="text-sm font-bold text-gray-900 leading-tight">Tarjeta Regalo</p>
              <p className="text-[11px] text-gray-500 mt-0.5">Desde 10 €</p>
            </Link>
            <Link
              to="/promociones"
              className="bg-white rounded-2xl border border-gray-100 p-4 shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all"
            >
              <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center mb-2">
                <i className="ri-coupon-3-fill text-amber-500 text-xl"></i>
              </div>
              <p className="text-sm font-bold text-gray-900 leading-tight">Promociones</p>
              <p className="text-[11px] text-gray-500 mt-0.5">Hasta -5%</p>
            </Link>
          </div>

          {/* Contacto */}
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-gray-100 p-5">
            <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold mb-3 text-center">
              Información del salón
            </p>
            <div className="space-y-3">
              <a
                href={MAPS_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 hover:bg-rose-50/50 -mx-2 px-2 py-2 rounded-xl transition-colors"
              >
                <i className="ri-map-pin-2-fill text-rose-500 text-lg shrink-0"></i>
                <span className="text-sm text-gray-700 flex-1">{ADDRESS}</span>
                <i className="ri-arrow-right-up-line text-gray-400 text-sm"></i>
              </a>
              <a
                href={`tel:${PHONE}`}
                className="flex items-center gap-3 hover:bg-rose-50/50 -mx-2 px-2 py-2 rounded-xl transition-colors"
              >
                <i className="ri-phone-fill text-rose-500 text-lg shrink-0"></i>
                <span className="text-sm text-gray-700 flex-1">{PHONE_DISPLAY}</span>
                <i className="ri-arrow-right-up-line text-gray-400 text-sm"></i>
              </a>
              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 hover:bg-rose-50/50 -mx-2 px-2 py-2 rounded-xl transition-colors"
              >
                <i className="ri-whatsapp-fill text-emerald-500 text-lg shrink-0"></i>
                <span className="text-sm text-gray-700 flex-1">WhatsApp</span>
                <i className="ri-arrow-right-up-line text-gray-400 text-sm"></i>
              </a>
            </div>
          </div>

          <p className="text-center text-[11px] text-gray-400 mt-8">
            © CALUATNAILS · {new Date().getFullYear()} · Calle Padilla 301 (Eixample)
          </p>
        </div>

        {/* ════════ MODAL WiFi ════════ */}
        {showWifiModal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-4 animate-in fade-in"
            onClick={() => setShowWifiModal(false)}
            style={{ paddingTop: "max(0.75rem, env(safe-area-inset-top))", paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
          >
            {/* Botón X flotante SIEMPRE visible (fuera del modal scrollable) */}
            <button
              onClick={() => setShowWifiModal(false)}
              className="fixed z-[60] w-11 h-11 rounded-full bg-white shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-transform"
              style={{
                top: "max(1rem, env(safe-area-inset-top))",
                right: "max(1rem, env(safe-area-inset-right))",
              }}
              aria-label="Cerrar"
            >
              <i className="ri-close-line text-2xl text-gray-900"></i>
            </button>

            <div
              className="bg-white rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden animate-in slide-in-from-bottom max-h-[88dvh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="bg-gradient-to-br from-indigo-500 via-blue-500 to-cyan-500 px-6 py-5 text-white sticky top-0 z-10">
                <div className="flex items-center gap-2 mb-1">
                  <i className="ri-wifi-fill text-2xl"></i>
                  <p className="text-[11px] uppercase tracking-widest opacity-90 font-semibold">WiFi CALUATNAILS</p>
                </div>
                <h3 className="text-2xl font-bold">Conéctate al WiFi</h3>
              </div>

              <div className="p-6 space-y-4">
                {/* ════ iPhone: botón mágico mobileconfig ════ */}
                {device === "ios" && (
                  <>
                    <a
                      href={MOBILECONFIG_URL}
                      className="block w-full bg-gradient-to-br from-gray-900 to-gray-700 text-white rounded-2xl p-5 shadow-lg hover:shadow-xl active:scale-[0.98] transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center shrink-0">
                          <i className="ri-apple-fill text-2xl"></i>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-base leading-tight">Añadir red a iPhone</p>
                          <p className="text-xs opacity-80">Toca aquí · Permite e instala el perfil</p>
                        </div>
                        <i className="ri-arrow-down-line text-2xl"></i>
                      </div>
                    </a>
                    <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-xs text-blue-900 leading-relaxed">
                      <p className="font-bold mb-1 flex items-center gap-1.5">
                        <i className="ri-information-fill"></i> Pasos en iPhone
                      </p>
                      <ol className="space-y-0.5 ml-1 list-decimal list-inside">
                        <li>Pulsa el botón de arriba</li>
                        <li>Toca <strong>"Permitir"</strong></li>
                        <li>Ve a <strong>Ajustes</strong> (te lo avisa)</li>
                        <li>Toca <strong>"Perfil descargado"</strong> → <strong>Instalar</strong></li>
                      </ol>
                    </div>
                  </>
                )}

                {/* ════ Android: copiar + abrir ajustes ════ */}
                {device === "android" && (
                  <>
                    <button
                      onClick={handleCopyPasswordAndOpenSettings}
                      className="w-full bg-gradient-to-br from-emerald-500 to-green-600 text-white rounded-2xl p-5 shadow-lg hover:shadow-xl active:scale-[0.98] transition-all text-left"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center shrink-0">
                          <i className="ri-android-fill text-2xl"></i>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-base leading-tight">
                            {copied === "pwd" ? "✓ Contraseña copiada" : "Copiar contraseña"}
                          </p>
                          <p className="text-xs opacity-90">
                            {copied === "pwd"
                              ? "Ahora abre Ajustes WiFi y pégala"
                              : "Pulsa, abre Ajustes WiFi y pégala"}
                          </p>
                        </div>
                        <i className={`text-2xl ${copied === "pwd" ? "ri-check-line" : "ri-file-copy-line"}`}></i>
                      </div>
                    </button>
                    <a
                      href="intent://settings/wifi#Intent;scheme=android-app;end"
                      className="block w-full bg-white border-2 border-gray-200 hover:border-gray-300 rounded-2xl p-4 active:scale-[0.98] transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
                          <i className="ri-settings-3-line text-xl text-gray-700"></i>
                        </div>
                        <div className="flex-1">
                          <p className="font-bold text-sm text-gray-900">Abrir Ajustes WiFi</p>
                          <p className="text-[11px] text-gray-500">Selecciona {WIFI_SSID}</p>
                        </div>
                        <i className="ri-arrow-right-up-line text-gray-400"></i>
                      </div>
                    </a>
                  </>
                )}

                {/* ════ QR (siempre visible como respaldo) ════ */}
                <div className="pt-2">
                  <div className="text-center mb-3">
                    <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">
                      {device === "other" ? "Escanea con la cámara" : "O escanea con otro móvil"}
                    </p>
                  </div>
                  <div className="bg-white p-3 rounded-2xl shadow-md border border-gray-100 flex justify-center">
                    <QRCodeSVG value={WIFI_QR} size={180} level="M" bgColor="#ffffff" fgColor="#1e293b" />
                  </div>
                </div>

                {/* ════ Datos para copiar manualmente ════ */}
                <div className="pt-2">
                  <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold text-center mb-2">
                    O copia los datos
                  </p>
                  <button
                    onClick={() => copy(WIFI_SSID, "ssid")}
                    className="w-full bg-gray-50 hover:bg-gray-100 active:bg-gray-200 rounded-2xl p-3 text-left flex items-center justify-between transition-colors mb-2"
                  >
                    <div className="min-w-0">
                      <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Red</p>
                      <p className="font-mono text-sm font-bold text-gray-900 truncate">{WIFI_SSID}</p>
                    </div>
                    <span className="text-xs font-semibold text-blue-600 shrink-0 ml-2">
                      {copied === "ssid" ? (
                        <span className="flex items-center gap-1 text-emerald-600">
                          <i className="ri-check-line"></i> Copiado
                        </span>
                      ) : (
                        <span className="flex items-center gap-1">
                          <i className="ri-file-copy-line"></i> Copiar
                        </span>
                      )}
                    </span>
                  </button>
                  <button
                    onClick={() => copy(WIFI_PASSWORD, "pwd")}
                    className="w-full bg-gray-50 hover:bg-gray-100 active:bg-gray-200 rounded-2xl p-3 text-left flex items-center justify-between transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Contraseña</p>
                      <p className="font-mono text-sm font-bold text-gray-900 truncate tracking-wide">
                        {WIFI_PASSWORD}
                      </p>
                    </div>
                    <span className="text-xs font-semibold text-blue-600 shrink-0 ml-2">
                      {copied === "pwd" ? (
                        <span className="flex items-center gap-1 text-emerald-600">
                          <i className="ri-check-line"></i> Copiado
                        </span>
                      ) : (
                        <span className="flex items-center gap-1">
                          <i className="ri-file-copy-line"></i> Copiar
                        </span>
                      )}
                    </span>
                  </button>
                </div>

                {/* Cerrar grande al final, siempre alcanzable */}
                <button
                  onClick={() => setShowWifiModal(false)}
                  className="w-full bg-gray-100 hover:bg-gray-200 active:bg-gray-300 text-gray-700 font-bold rounded-2xl py-3.5 mt-2 transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
