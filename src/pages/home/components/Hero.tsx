import { useNavigate } from "react-router-dom";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";

interface HeroProps {
  onComprar?: () => void;
  price?: number;
}

interface UrgencyConfig {
  enabled: boolean;
  hours: number;
  label: string;
}

interface PresaleConfig {
  presale_mode: boolean;
  presale_badge_text: string;
  presale_hero_title: string;
  presale_hero_subtitle: string;
  presale_cta_text: string;
  presale_buy_btn_text: string;
}

const DEFAULT_URGENCY: UrgencyConfig = {
  enabled: true,
  hours: 72,
  label: "Oferta termina en",
};

const DEFAULT_PRESALE: PresaleConfig = {
  presale_mode: true,
  presale_badge_text: "🎉 PREVENTA ESPECIAL",
  presale_hero_title: "Únete a la\nPreventa del\nCurso CALUATNAILS",
  presale_hero_subtitle: "Sé de las primeras en acceder al curso completo de manicura y pedicura con precio especial de lanzamiento. +80 lecciones, certificación incluida.",
  presale_cta_text: "Reservar mi plaza",
  presale_buy_btn_text: "Unirme a la preventa",
};

const SALON_IMG = "https://readdy.ai/api/search-image?query=professional%20nail%20technician%20elegant%20manicure%20pedicure%20beauty%20salon%20warm%20rose%20gold%20lighting%20hands%20close%20up%20luxury%20spa%20pastel%20tones%20soft%20bokeh%20background&width=1440&height=900&seq=1&orientation=landscape";
const SALON_IMG_FALLBACK = "/assets/manicure-premium.png";
const COURSE_IMG = "/assets/extensions-premium.png";
const COURSE_IMG_FALLBACK = "/assets/manicure-exotic.jpg";

function getCountdownTarget(hours: number): number {
  const KEY = `caluatnails_offer_end_${hours}`;
  const stored = sessionStorage.getItem(KEY);
  if (stored) {
    const ts = parseInt(stored, 10);
    if (!isNaN(ts) && ts > Date.now()) return ts;
  }
  const target = Date.now() + hours * 60 * 60 * 1000;
  sessionStorage.setItem(KEY, String(target));
  return target;
}

function useCountdown(hours: number) {
  const [target, setTarget] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    const t = getCountdownTarget(hours);
    setTarget(t);
    setTimeLeft(Math.max(0, t - Date.now()));
  }, [hours]);

  useEffect(() => {
    if (target === null) return;
    const interval = setInterval(() => {
      setTimeLeft(Math.max(0, target - Date.now()));
    }, 1000);
    return () => clearInterval(interval);
  }, [target]);

  const h = Math.floor(timeLeft / 3_600_000);
  const m = Math.floor((timeLeft % 3_600_000) / 60_000);
  const s = Math.floor((timeLeft % 60_000) / 1_000);

  return {
    h: String(h).padStart(2, "0"),
    m: String(m).padStart(2, "0"),
    s: String(s).padStart(2, "0"),
    expired: timeLeft === 0,
  };
}

const STATS = [
  { icon: "ri-map-pin-line", value: "Barcelona", label: "Centro de Estética" },
  { icon: "ri-time-line", value: "Reserva", label: "Cita Online" },
  { icon: "ri-star-line", value: "Premium", label: "Materiales de Calidad" },
  { icon: "ri-award-line", value: "Academia", label: "Cursos Disponibles" },
];

export default function Hero({ onComprar }: HeroProps) {
  const navigate = useNavigate();
  const [urgency, setUrgency] = useState<UrgencyConfig>(DEFAULT_URGENCY);
  const [presale, setPresale] = useState<PresaleConfig>(DEFAULT_PRESALE);
  const [slide, setSlide] = useState(0);
  const [paused, setPaused] = useState(false);
  const countdown = useCountdown(urgency.hours);

  useEffect(() => {
    supabase
      .from("center_settings")
      .select("hero_countdown_enabled, hero_countdown_hours, hero_countdown_label, presale_mode, presale_badge_text, presale_hero_title, presale_hero_subtitle, presale_cta_text, presale_buy_btn_text")
      .eq("id", "main")
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setUrgency({
            enabled: data.hero_countdown_enabled ?? true,
            hours: data.hero_countdown_hours ?? 72,
            label: data.hero_countdown_label ?? "Oferta termina en",
          });
          setPresale({
            presale_mode: data.presale_mode ?? true,
            presale_badge_text: data.presale_badge_text ?? DEFAULT_PRESALE.presale_badge_text,
            presale_hero_title: data.presale_hero_title ?? DEFAULT_PRESALE.presale_hero_title,
            presale_hero_subtitle: data.presale_hero_subtitle ?? DEFAULT_PRESALE.presale_hero_subtitle,
            presale_cta_text: data.presale_cta_text ?? DEFAULT_PRESALE.presale_cta_text,
            presale_buy_btn_text: data.presale_buy_btn_text ?? DEFAULT_PRESALE.presale_buy_btn_text,
          });
        }
      });
  }, []);

  const handleScroll = useCallback((href: string) => {
    const el = document.querySelector(href);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  }, []);

  const handleComprarCurso = useCallback(() => {
    if (onComprar) onComprar();
    handleScroll("#tienda");
  }, [onComprar, handleScroll]);

  const slides = [0, 1]; // 0 = salón (prioritario), 1 = preventa curso
  const totalSlides = slides.length;

  // Auto-advance
  useEffect(() => {
    if (paused) return;
    const id = setInterval(() => {
      setSlide(s => (s + 1) % totalSlides);
    }, 7000);
    return () => clearInterval(id);
  }, [paused, totalSlides]);

  const goTo = (idx: number) => setSlide(((idx % totalSlides) + totalSlides) % totalSlides);
  const prev = () => goTo(slide - 1);
  const next = () => goTo(slide + 1);

  const showCountdown = urgency.enabled && !countdown.expired;
  const courseTitleLines = presale.presale_hero_title.split("\n");

  return (
    <section
      className="relative w-full min-h-screen overflow-hidden"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-roledescription="carousel"
    >
      {/* SLIDE 1 — SALÓN (Reservar cita) */}
      <div
        className={`absolute inset-0 transition-opacity duration-700 ${slide === 0 ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"}`}
        aria-hidden={slide !== 0}
        aria-roledescription="slide"
        aria-label="Reserva tu cita en el salón"
      >
        <div className="absolute inset-0">
          <img
            src={SALON_IMG}
            onError={(e) => { (e.currentTarget as HTMLImageElement).src = SALON_IMG_FALLBACK; }}
            alt="Salón de manicura y pedicura premium en Barcelona"
            className="w-full h-full object-cover object-top"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/55 to-black/30"></div>
        </div>

        <div className="relative z-10 w-full h-full min-h-screen flex items-center max-w-7xl mx-auto px-6 lg:px-10 py-32 pt-40">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm border border-white/20 rounded-full px-4 py-1.5 mb-6">
              <i className="ri-sparkling-fill text-rose-300 text-sm"></i>
              <span className="text-white text-xs font-medium tracking-wide uppercase">Salón Premium · Eixample Barcelona</span>
            </div>

            <h1 className="font-playfair text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold text-white leading-tight mb-6">
              Tus Uñas Merecen<br />
              <span className="text-rose-300">Cuidado de Lujo</span><br />
              y Precisión
            </h1>

            <p className="text-white/85 text-base sm:text-lg lg:text-xl leading-relaxed mb-8 max-w-xl">
              Especialistas en <strong className="text-white">manicura rusa con nivelación</strong>, esmaltado semipermanente, uñas en gel y pedicura spa. Reserva tu cita en pleno corazón del Eixample, Barcelona.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <button
                onClick={() => navigate("/reservar")}
                className="flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold px-6 sm:px-8 py-3.5 sm:py-4 rounded-full transition-all cursor-pointer whitespace-nowrap text-sm sm:text-base shadow-xl shadow-rose-900/30"
              >
                <i className="ri-calendar-check-line text-lg"></i>
                Reservar mi Cita
              </button>

              <button
                onClick={() => navigate("/servicios")}
                className="flex items-center justify-center gap-2 bg-white/15 hover:bg-white/25 backdrop-blur-sm border border-white/30 text-white font-semibold px-6 sm:px-8 py-3.5 sm:py-4 rounded-full transition-all cursor-pointer whitespace-nowrap text-sm sm:text-base"
              >
                <i className="ri-list-check-2 text-lg"></i>
                Ver Servicios
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* SLIDE 2 — PREVENTA CURSO */}
      <div
        className={`absolute inset-0 transition-opacity duration-700 ${slide === 1 ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"}`}
        aria-hidden={slide !== 1}
        aria-roledescription="slide"
        aria-label="Preventa del curso online"
      >
        <div className="absolute inset-0">
          <img
            src={COURSE_IMG}
            onError={(e) => { (e.currentTarget as HTMLImageElement).src = COURSE_IMG_FALLBACK; }}
            alt="Curso online de manicura y pedicura con certificación"
            className="w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/55 to-black/30"></div>
        </div>

        <div className="relative z-10 w-full h-full min-h-screen flex items-center max-w-7xl mx-auto px-6 lg:px-10 py-32 pt-40">
          <div className="max-w-2xl">
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <div className="flex items-center gap-2 bg-rose-500/90 backdrop-blur-sm rounded-full px-4 py-1.5">
                <span className="text-white text-xs font-bold tracking-wide">{presale.presale_badge_text}</span>
              </div>
            </div>

            {showCountdown && (
              <div className="flex flex-wrap items-center gap-3 mb-6">
                <div className="flex items-center gap-2 bg-amber-500/90 backdrop-blur-sm rounded-full px-4 py-1.5">
                  <i className="ri-time-line text-white text-sm"></i>
                  <span className="text-white text-xs font-semibold tracking-wide">{urgency.label}</span>
                  <div className="flex items-center gap-1">
                    {[countdown.h, countdown.m, countdown.s].map((unit, i) => (
                      <span key={i} className="flex items-center gap-1">
                        <span className="bg-white/25 text-white font-bold text-xs px-1.5 py-0.5 rounded-md tabular-nums min-w-[26px] text-center">
                          {unit}
                        </span>
                        {i < 2 && <span className="text-white/70 font-bold text-xs">:</span>}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <h2 className="font-playfair text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold text-white leading-tight mb-6">
              {courseTitleLines.map((line, i) => (
                <span key={i}>
                  {i === 1 ? <span className="text-rose-300">{line}</span> : line}
                  {i < courseTitleLines.length - 1 && <br />}
                </span>
              ))}
            </h2>

            <p className="text-white/85 text-base sm:text-lg lg:text-xl leading-relaxed mb-8 max-w-xl">
              {presale.presale_hero_subtitle}
            </p>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <button
                onClick={handleComprarCurso}
                className="flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold px-6 sm:px-8 py-3.5 sm:py-4 rounded-full transition-all cursor-pointer whitespace-nowrap text-sm sm:text-base shadow-xl shadow-rose-900/30"
              >
                <i className="ri-bookmark-line text-lg"></i>
                {presale.presale_cta_text}
              </button>

              <button
                onClick={handleComprarCurso}
                className="flex items-center justify-center gap-2 bg-white/15 hover:bg-white/25 backdrop-blur-sm border border-white/30 text-white font-semibold px-6 sm:px-8 py-3.5 sm:py-4 rounded-full transition-all cursor-pointer whitespace-nowrap text-sm sm:text-base"
              >
                <i className="ri-graduation-cap-line text-lg"></i>
                {presale.presale_buy_btn_text}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats (compartido entre slides) */}
      <div className="absolute bottom-24 left-0 right-0 z-20 pointer-events-none">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <div className="flex flex-wrap gap-4 sm:gap-6 lg:gap-8">
            {STATS.map((stat) => (
              <div key={stat.label} className="flex items-center gap-2">
                <div className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-full bg-white/15 backdrop-blur-sm">
                  <i className={`${stat.icon} text-rose-300 text-sm`}></i>
                </div>
                <div>
                  <p className="text-white font-bold text-xs sm:text-sm leading-none">{stat.value}</p>
                  <p className="text-white/60 text-[10px] sm:text-xs mt-0.5">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Slider controls */}
      <button
        onClick={prev}
        aria-label="Slide anterior"
        className="hidden md:flex absolute left-4 lg:left-6 top-1/2 -translate-y-1/2 z-30 w-12 h-12 items-center justify-center rounded-full bg-white/10 hover:bg-white/25 backdrop-blur-sm border border-white/20 text-white transition-all"
      >
        <i className="ri-arrow-left-s-line text-2xl"></i>
      </button>
      <button
        onClick={next}
        aria-label="Slide siguiente"
        className="hidden md:flex absolute right-4 lg:right-6 top-1/2 -translate-y-1/2 z-30 w-12 h-12 items-center justify-center rounded-full bg-white/10 hover:bg-white/25 backdrop-blur-sm border border-white/20 text-white transition-all"
      >
        <i className="ri-arrow-right-s-line text-2xl"></i>
      </button>

      {/* Dots */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2">
        {slides.map((idx) => (
          <button
            key={idx}
            onClick={() => goTo(idx)}
            aria-label={`Ir al slide ${idx + 1}`}
            className={`h-2 rounded-full transition-all ${slide === idx ? "w-8 bg-rose-400" : "w-2 bg-white/40 hover:bg-white/70"}`}
          />
        ))}
      </div>
    </section>
  );
}
