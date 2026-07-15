import { useEffect, useState } from "react";

interface BookingData {
  date: string;
  time: string;
  durationMinutes: number;
  clientName: string;
  services: string[];
  professionalName?: string;
  professionalAddress?: string;
  totalPrice: number;
}

interface Props {
  type: "tienda" | "reserva" | "efectivo";
  total: string;
  onClose: () => void;
  bookingData?: BookingData;
}

function buildCalendarLinks(booking: {
  date: string;
  time: string;
  durationMinutes: number;
  services: string[];
  totalPrice: number;
  location?: string;
}) {
  const servicesList = booking.services.join(", ");
  const title = `Cita Caluatnails: ${servicesList}`;
  const description = `💅 Tu cita en Caluatnails\n\nServicios: ${servicesList}\nTotal: €${Number(booking.totalPrice).toFixed(2)}\n\n¡Te esperamos!`;
  const location = booking.location && booking.location !== "Salón CALUATNAILS"
    ? `Caluatnails - ${booking.location}`
    : "Caluatnails - Carrer del Rosselló, 497, Eixample, 08025 Barcelona";

  const [year, month, day] = booking.date.split("-").map(Number);
  const [hour, minute] = booking.time.split(":").map(Number);
  const startDate = new Date(year, month - 1, day, hour, minute);
  const endDate = new Date(startDate.getTime() + booking.durationMinutes * 60000);

  const pad = (n: number) => String(n).padStart(2, "0");
  const toGCal = (d: Date) =>
    `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;

  const gcalStart = toGCal(startDate);
  const gcalEnd = toGCal(endDate);

  const googleUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${gcalStart}/${gcalEnd}&details=${encodeURIComponent(description)}&location=${encodeURIComponent(location)}`;
  const outlookUrl = `https://outlook.live.com/calendar/0/deeplink/compose?subject=${encodeURIComponent(title)}&startdt=${startDate.toISOString()}&enddt=${endDate.toISOString()}&body=${encodeURIComponent(description)}&location=${encodeURIComponent(location)}`;

  const icsContent = [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Caluatnails//Agenda//ES",
    "BEGIN:VEVENT",
    `DTSTART:${gcalStart}`, `DTEND:${gcalEnd}`,
    `SUMMARY:${title}`,
    `DESCRIPTION:${description.replace(/\n/g, "\\n")}`,
    `LOCATION:${location}`,
    "END:VEVENT", "END:VCALENDAR",
  ].join("\r\n");

  const icsBlob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
  const icsUrl = URL.createObjectURL(icsBlob);

  return { googleUrl, outlookUrl, icsUrl };
}

export default function BizumSuccessModal({ type, total, onClose, bookingData }: Props) {
  const [calDropdown, setCalDropdown] = useState(false);

  useEffect(() => {
    // Only auto-close if it's not a booking (so clients have time to click add to calendar!)
    if (type !== "reserva" && type !== "efectivo") {
      const timer = setTimeout(onClose, 12000);
      return () => clearTimeout(timer);
    }
  }, [onClose, type]);

  const config = {
    tienda: {
      icon: "ri-shopping-bag-line",
      title: "¡Pedido registrado!",
      desc: "Tu pedido ha sido registrado y la solicitud de pago por Bizum enviada.",
      detail: "Un administrador validará tu pago y procesará el pedido en breve.",
      color: "emerald",
    },
    reserva: {
      icon: "ri-calendar-check-line",
      title: "¡Reserva enviada!",
      desc: "Tu reserva ha sido registrada con pago de anticipo por Bizum.",
      detail: "Un administrador validará tu pago y confirmará la cita en breve.",
      color: "rose",
    },
    efectivo: {
      icon: "ri-calendar-check-line",
      title: "¡Cita reservada!",
      desc: "Tu reserva ha sido registrada para pago en efectivo en el centro.",
      detail: "Un administrador confirmará tu cita en breve. No tienes que pagar nada hoy.",
      color: "emerald",
    },
  }[type];

  return (
    <div className="fixed inset-0 z-[200] overflow-y-auto flex items-start sm:items-center justify-center p-4 py-8 sm:p-6">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-xl animate-[fadeInUp_0.3s_ease] my-auto">

        {/* Top green stripe */}
        <div className="h-2 bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-t-3xl" />

        <div className="p-8 text-center">
          {/* Icon */}
          <div className="w-20 h-20 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-5">
            <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center">
              <i className="ri-checkbox-circle-fill text-emerald-500 text-3xl"></i>
            </div>
          </div>

          <h2 className="text-xl font-bold text-gray-900 mb-2">{config.title}</h2>
          <p className="text-gray-500 text-sm mb-4">{config.desc}</p>

          {/* Amount */}
          <div className="bg-emerald-50 rounded-2xl px-6 py-4 mb-5 inline-block w-full">
            <p className="text-xs text-emerald-600 font-medium mb-1">
              {type === "efectivo" ? "Importe a abonar en el centro" : "Importe a transferir por Bizum"}
            </p>
            <p className="text-3xl font-bold text-emerald-700">{total}</p>
          </div>

          {/* Steps */}
          {type === "efectivo" ? (
            <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 mb-6 text-left space-y-3">
              <p className="text-xs font-bold text-amber-800 uppercase tracking-wide">Detalles de tu cita</p>
              {[
                { icon: "ri-calendar-line", text: `Fecha: ${bookingData?.date ? new Date(bookingData.date + "T12:00:00").toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" }) : ""} a las ${bookingData?.time ?? ""}` },
                { icon: "ri-coins-line", text: "Paga tu servicio en efectivo o tarjeta en el salón el día de tu cita." },
                { icon: "ri-time-line", text: config.detail },
              ].map((step, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center shrink-0 mt-0.5">
                    <i className={`${step.icon} text-amber-600 text-xs`}></i>
                  </div>
                  <p className="text-xs text-amber-700 leading-relaxed capitalize-first">{step.text}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 mb-6 text-left space-y-3">
              <p className="text-xs font-bold text-amber-800 uppercase tracking-wide">Próximos pasos</p>
              {[
                { icon: "ri-smartphone-line", text: "Realiza el Bizum al número que te indiquen" },
                { icon: "ri-time-line", text: config.detail },
              ].map((step, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center shrink-0 mt-0.5">
                    <i className={`${step.icon} text-amber-600 text-xs`}></i>
                  </div>
                  <p className="text-xs text-amber-700 leading-relaxed">{step.text}</p>
                </div>
              ))}
            </div>
          )}

          {/* Add to calendar */}
          {bookingData && (
            <div className="relative mb-6">
              <button
                onClick={(e) => { e.stopPropagation(); setCalDropdown(p => !p); }}
                className="w-full flex items-center justify-between gap-2 py-3 px-4 rounded-2xl border border-gray-200 text-gray-700 text-sm font-semibold hover:bg-gray-50 transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <i className="ri-calendar-check-line text-emerald-500 text-lg"></i>
                  Añadir cita a mi calendario
                </span>
                {calDropdown
                  ? <i className="ri-arrow-up-s-line text-gray-400 text-lg"></i>
                  : <i className="ri-arrow-down-s-line text-gray-400 text-lg"></i>
                }
              </button>
              {calDropdown && (() => {
                const links = buildCalendarLinks({
                  date: bookingData.date,
                  time: bookingData.time,
                  durationMinutes: bookingData.durationMinutes,
                  services: bookingData.services,
                  totalPrice: bookingData.totalPrice,
                  location: bookingData.professionalAddress || undefined,
                });
                return (
                  <div className="absolute left-0 right-0 mt-1.5 bg-white border border-gray-100 rounded-2xl shadow-xl overflow-hidden z-[250] text-left animate-[fadeInUp_0.2s_ease]">
                    {[
                      { href: links.googleUrl, target: "_blank", download: undefined, icon: "ri-google-fill", color: "bg-red-50 text-red-500", label: "Google Calendar", desc: "Abrir en Google Calendar" },
                      { href: links.icsUrl, target: undefined, download: `cita-${bookingData.date}.ics`, icon: "ri-apple-fill", color: "bg-gray-100 text-gray-800", label: "Apple Calendar / iCal", desc: "Descargar archivo .ics" },
                      { href: links.outlookUrl, target: "_blank", download: undefined, icon: "ri-microsoft-line", color: "bg-sky-50 text-sky-500", label: "Outlook", desc: "Abrir en Outlook Web" },
                    ].map((item, i) => (
                      <a
                        key={i}
                        href={item.href}
                        target={item.target}
                        download={item.download}
                        rel="noopener noreferrer"
                        onClick={() => setCalDropdown(false)}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer border-b border-gray-50 last:border-0"
                      >
                        <div className={`w-8 h-8 flex items-center justify-center rounded-full ${item.color}`}>
                          <i className={`${item.icon} text-base`}></i>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-800">{item.label}</p>
                          <p className="text-xs text-gray-400 truncate">{item.desc}</p>
                        </div>
                      </a>
                    ))}
                  </div>
                );
              })()}
            </div>
          )}

          {/* Admin note */}
          <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-4 py-3 mb-6">
            <i className="ri-information-line text-gray-400 text-sm shrink-0"></i>
            <p className="text-xs text-gray-500 text-left">
              {type === "efectivo"
                ? "Tu cita se ha registrado en nuestra agenda. ¡Nos vemos pronto en CALUATNAILS!"
                : "Tu compra quedará pendiente de validación hasta que el administrador confirme la recepción del pago."
              }
            </p>
          </div>

          <button
            onClick={onClose}
            className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-2xl transition-colors cursor-pointer whitespace-nowrap"
          >
            Entendido
          </button>
          {(type !== "reserva" && type !== "efectivo") && (
            <p className="text-xs text-gray-400 mt-3">Este mensaje se cerrará automáticamente en unos segundos</p>
          )}
        </div>
      </div>
    </div>
  );
}
