import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { DBService } from "@/lib/types";
import {
  Clock,
  CheckCircle2,
  ArrowRight,
  Star,
  ShieldCheck,
  Sparkles,
  ChevronLeft,
  Heart,
  MessageCircle,
  MapPin,
} from "lucide-react";
import { Helmet } from "react-helmet-async";

// ════════════════════════════════════════════════════════════
//  CONSTANTES COMPARTIDAS (idénticas para todos los servicios)
// ════════════════════════════════════════════════════════════

const TRUST_BADGES = [
  { icon: "ri-award-fill", label: "+10 años de experiencia" },
  { icon: "ri-user-heart-fill", label: "+5.000 clientas felices" },
  { icon: "ri-shield-check-fill", label: "Higiene certificada" },
  { icon: "ri-medal-fill", label: "Productos OPI / Essie / CND" },
  { icon: "ri-google-fill", label: "Valoración 4,9 ★ en Google" },
];

const WHY_US = [
  {
    icon: "ri-graduation-cap-line",
    title: "Manicuristas certificadas",
    desc: "Todo nuestro equipo cuenta con formación oficial y reciclaje continuo en las técnicas más avanzadas.",
  },
  {
    icon: "ri-shield-check-line",
    title: "Material esterilizado en cada servicio",
    desc: "Protocolo de esterilización en autoclave y material desechable individual. Cero riesgos.",
  },
  {
    icon: "ri-medal-line",
    title: "Esmaltes de primeras marcas",
    desc: "Trabajamos con OPI, Essie, CND, Mavala y Sally Hansen. Calidad profesional en cada aplicación.",
  },
  {
    icon: "ri-heart-line",
    title: "Ambiente relajante y trato cercano",
    desc: "Salón cuidado al detalle, música suave, café/té de cortesía y un trato 100% personalizado.",
  },
];

const BRANDS = ["OPI", "Essie", "CND", "Mavala", "Sally Hansen", "Semilac", "Kodi", "IBD"];

// Servicios relacionados por categoría (internal linking)
const RELATED_SERVICES: Record<string, { slug: string; name: string; desc: string }[]> = {
  tradicional: [
    { slug: "manicura-semipermanente", name: "Manicura semipermanente", desc: "Hasta 4 semanas de duración" },
    { slug: "manicura-con-nivelacion-refuerzo", name: "Manicura con nivelación", desc: "Técnica rusa, acabado espejo" },
    { slug: "manicura-y-pedicura-normal", name: "Manicura + pedicura", desc: "Pack completo con descuento" },
  ],
  semipermanente: [
    { slug: "manicura-con-nivelacion-refuerzo", name: "Manicura con nivelación", desc: "Hasta 5 semanas de duración" },
    { slug: "unas-en-gel", name: "Uñas en gel", desc: "Extensiones largas y resistentes" },
    { slug: "manicura-y-pedicura-semipermanente", name: "Manicura + pedicura semi", desc: "Pack ahorro" },
  ],
  nivelacion: [
    { slug: "manicura-semipermanente", name: "Manicura semipermanente", desc: "Versión clásica de 3-4 semanas" },
    { slug: "unas-en-gel", name: "Uñas en gel", desc: "Extensiones esculpidas a medida" },
    { slug: "manicura-completa-con-nivelacion-pedicura-semi-permanente", name: "Nivelación + pedicura semi", desc: "Pack premium" },
  ],
  gel: [
    { slug: "manicura-con-nivelacion-refuerzo", name: "Manicura con nivelación", desc: "Acabado espejo en uña natural" },
    { slug: "relleno-de-gel-acrilico", name: "Relleno de gel", desc: "Mantén tus extensiones" },
    { slug: "manicura-semipermanente", name: "Semipermanente", desc: "Sin extensiones, hasta 4 semanas" },
  ],
  relleno: [
    { slug: "unas-en-gel", name: "Uñas en gel completas", desc: "Si necesitas empezar de cero" },
    { slug: "manicura-con-nivelacion-refuerzo", name: "Manicura con nivelación", desc: "Alternativa sin extensiones" },
    { slug: "manicura-semipermanente", name: "Semipermanente", desc: "Tu uña natural, 3-4 semanas" },
  ],
  pedicura: [
    { slug: "manicura-semipermanente", name: "Manicura semipermanente", desc: "A juego con tu pedicura" },
    { slug: "manicura-y-pedicura-semipermanente", name: "Pack manos + pies semi", desc: "Ahorra reservando juntos" },
    { slug: "pedicura-tradicional", name: "Pedicura tradicional", desc: "Versión clásica con esmalte normal" },
  ],
  combo: [
    { slug: "manicura-con-nivelacion-refuerzo", name: "Manicura con nivelación", desc: "Si quieres máxima duración" },
    { slug: "unas-en-gel", name: "Uñas en gel", desc: "Para extensiones largas" },
    { slug: "pedicura-semipermanente", name: "Pedicura semipermanente", desc: "Solo pies, hasta 4 semanas" },
  ],
  fallback: [
    { slug: "manicura-semipermanente", name: "Manicura semipermanente", desc: "Nuestro más popular" },
    { slug: "manicura-con-nivelacion-refuerzo", name: "Manicura con nivelación", desc: "Acabado espejo, hasta 5 semanas" },
    { slug: "pedicura-semipermanente", name: "Pedicura semipermanente", desc: "Pies cuidados todo el mes" },
  ],
};

// Posts del blog relacionados por categoría
const RELATED_BLOG: Record<string, { slug: string; title: string }[]> = {
  tradicional: [
    { slug: "como-elegir-el-color-de-esmalte-segun-tu-tono-de-piel", title: "Cómo elegir el color de esmalte según tu tono de piel" },
    { slug: "uñas-fuertes-de-forma-natural-trucos-y-alimentacion", title: "Uñas fuertes de forma natural: trucos y alimentación" },
    { slug: "cuanto-dura-cada-tipo-de-manicura-tabla-comparativa", title: "¿Cuánto dura cada tipo de manicura? Tabla comparativa" },
  ],
  semipermanente: [
    { slug: "cuanto-cuesta-la-manicura-semipermanente-en-barcelona", title: "¿Cuánto cuesta la manicura semipermanente en Barcelona?" },
    { slug: "errores-al-retirar-esmaltado-en-casa", title: "Errores al retirar el esmaltado en casa" },
    { slug: "francesa-moderna-2026-variantes-tendencia", title: "Francesa moderna 2026: 8 variantes tendencia" },
  ],
  nivelacion: [
    { slug: "manicura-rusa-vs-japonesa-diferencias", title: "Manicura rusa vs japonesa: diferencias" },
    { slug: "diferencias-entre-unas-en-gel-y-acrilico", title: "Uñas en gel vs acrílico: cuál elegir" },
    { slug: "cuanto-dura-cada-tipo-de-manicura-tabla-comparativa", title: "¿Cuánto dura cada tipo de manicura?" },
  ],
  gel: [
    { slug: "diferencias-entre-unas-en-gel-y-acrilico", title: "Uñas en gel vs acrílico: cuál elegir" },
    { slug: "como-elegir-largo-y-forma-de-unas-perfecto", title: "Cómo elegir el largo y forma de uñas perfecto" },
    { slug: "biab-builder-in-a-bottle-tecnica-tendencia", title: "BIAB: la técnica que arrasa en los salones" },
  ],
  relleno: [
    { slug: "diferencias-entre-unas-en-gel-y-acrilico", title: "Uñas en gel vs acrílico: cuál elegir" },
    { slug: "errores-al-retirar-esmaltado-en-casa", title: "Errores al retirar el esmaltado" },
    { slug: "biab-builder-in-a-bottle-tecnica-tendencia", title: "BIAB: técnica tendencia" },
  ],
  pedicura: [
    { slug: "cuidados-despues-de-pedicura-semipermanente", title: "Cuidados después de pedicura semipermanente" },
    { slug: "pedicura-en-embarazo-precauciones", title: "Pedicura en embarazo: precauciones" },
    { slug: "pedicura-spa-en-casa-receta-completa", title: "Pedicura spa en casa: receta completa" },
  ],
  combo: [
    { slug: "manicura-para-boda-en-barcelona-guia-2026", title: "Manicura para boda en Barcelona: guía 2026" },
    { slug: "rutina-de-belleza-de-manos-completa-paso-a-paso", title: "Rutina de belleza de manos paso a paso" },
    { slug: "cuanto-dura-cada-tipo-de-manicura-tabla-comparativa", title: "¿Cuánto dura cada tipo de manicura?" },
  ],
  fallback: [
    { slug: "como-elegir-tu-salon-de-uñas-15-señales-clave", title: "Cómo elegir tu salón de uñas: 15 señales clave" },
    { slug: "tendencias-de-unas-2026", title: "Tendencias de uñas 2026" },
    { slug: "mejor-manicura-cerca-de-sagrada-familia", title: "Mejor manicura cerca de Sagrada Familia" },
  ],
};

// Texto local con barrios y "near me" (Local SEO)
const NEIGHBORHOODS_TEXT = "Estamos en el corazón del Eixample, a 5 minutos a pie de la Sagrada Familia y muy cerca de Passeig de Gràcia, Diagonal y Padilla. Atendemos a clientas de toda Barcelona: Gràcia, El Born, Sants, Sant Martí, Sarrià-Sant Gervasi y Les Corts. Si buscas un salón de uñas cerca de ti en Barcelona, estamos a una parada de metro de cualquier zona céntrica.";

const TESTIMONIALS = [
  {
    name: "Carla M.",
    text: "Llevo más de un año yendo a CALUATNAILS y mis uñas nunca habían estado tan sanas. El acabado es impecable y duran semanas perfectas.",
    rating: 5,
    service: "Manicura con nivelación",
  },
  {
    name: "Andrea T.",
    text: "Probé muchos salones en Barcelona y este es el mejor de todos. Higiene impecable, técnicas top y un trato encantador. ¡100% recomendado!",
    rating: 5,
    service: "Esmaltado semipermanente",
  },
  {
    name: "Lucía R.",
    text: "Vine para mi boda y no podía estar más feliz con el resultado. Las fotos quedaron preciosas y duró perfecto hasta la luna de miel.",
    rating: 5,
    service: "Uñas en gel",
  },
];

// ════════════════════════════════════════════════════════════
//  COMPONENTE PRINCIPAL
// ════════════════════════════════════════════════════════════

type IncludedGroup = { title: string; items: string[] };
type GalleryItem = { src: string; title: string };
type PainPoint = { q: string; a: string };

export default function ServiceLandingPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [service, setService] = useState<DBService | null>(null);
  const [loading, setLoading] = useState(true);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [openPain, setOpenPain] = useState<number | null>(null);

  useEffect(() => {
    loadService();
  }, [slug]);

  const loadService = async () => {
    if (!slug) return;
    setLoading(true);

    const { data } = await supabase
      .from("services")
      .select("id, name, description, duration_minutes, price, service_type, active")
      .eq("active", true)
      .filter("name", "ilike", slug.replace(/-/g, " "))
      .maybeSingle();

    if (data) {
      setService(data as DBService);
    } else {
      const { data: allData } = await supabase
        .from("services")
        .select("id, name, description, duration_minutes, price, service_type, active")
        .eq("active", true);

      const canonicalSlug = (s: string) =>
        s.toLowerCase()
          .normalize("NFD")
          .replace(/[̀-ͯ]/g, "")
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, "");

      const legacySlug = (s: string) =>
        s.toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, "");

      const collapse = (s: string) => s.replace(/-+/g, "-");
      const target = collapse(slug);

      const found = allData?.find(s =>
        collapse(canonicalSlug(s.name)) === target ||
        collapse(legacySlug(s.name)) === target
      );

      if (found) {
        const canonical = canonicalSlug(found.name);
        if (canonical && canonical !== slug) {
          navigate(`/servicios/${canonical}`, { replace: true });
          return;
        }
      }

      setService(found || null);
    }
    setLoading(false);
  };

  const getServiceData = () => {
    if (!service) return null;
    const name = (service.name || "").toLowerCase();
    const type = (service.service_type || "").toLowerCase();

    const isPedicura = name.includes("pedicura") || type.includes("pedicura");
    const isManicura = name.includes("manicura") || type.includes("manicura");
    const isSemiPerm = name.includes("semipermanente") || name.includes("semi-permanente") || name.includes("semi permanente");
    const isNivelacion = name.includes("nivelaci");
    const isGel = name.includes("gel") || name.includes("uñas en gel");
    const isRelleno = name.includes("relleno");
    const isTradicional = name.includes("tradicional") || name.includes("normal");
    const isCombo = isPedicura && isManicura;
    const isEsmaltado = name.includes("esmaltado");

    // ── RELLENO ──
    if (isRelleno) {
      return {
        serviceKey: "relleno",
        localTitle: "Especialistas en relleno de uñas en Barcelona",
        image: "/assets/manicure-exotic.jpg",
        category: "Relleno",
        heroClaim: "Mantén tus extensiones impecables semana tras semana",
        keywords: "relleno de gel barcelona, retoque uñas acrílico, mantenimiento extensiones, relleno uñas eixample",
        intro: "El relleno de gel o acrílico es esencial para mantener tus extensiones impecables y prolongar su vida útil. En nuestro salón del Eixample, en Barcelona, realizamos el retoque profesional cada 3-4 semanas para que tus uñas luzcan siempre perfectas.",
        whoFor: "Ideal si ya llevas extensiones de gel o acrílico y necesitas mantenimiento periódico para mantener tus uñas siempre perfectas.",
        whatIncludes: [
          { title: "Diagnóstico previo", items: ["Revisión técnica de cada uña", "Detección de zonas débiles", "Plan de refuerzo personalizado"] },
          { title: "Tratamiento", items: ["Retirada parcial del esmalte", "Limado del crecimiento natural", "Reaplicación de gel o acrílico"] },
          { title: "Estética", items: ["Reesculpido para mantener la forma", "Cambio de color sin coste", "Nail art o francesa opcional"] },
          { title: "Cuidados extra", items: ["Hidratación de cutículas", "Aceite reparador final", "Refuerzo de zonas levantadas"] },
          { title: "Opciones", items: ["Relleno con cambio total de color", "Relleno + diseño nuevo", "Bono de 4 rellenos con descuento"] },
        ] as IncludedGroup[],
        steps: [
          "Reserva online o por WhatsApp",
          "Bienvenida y revisión técnica de tus uñas",
          "Retirada parcial del esmalte previo",
          "Limado del crecimiento natural",
          "Reaplicación de gel o acrílico en zonas necesarias",
          "Reesculpido y limado de precisión",
          "Esmaltado nuevo o nail art según diseño",
          "Sellado y hidratación final",
          "Reserva de tu próximo mantenimiento",
        ],
        painPoints: [
          { q: "Mis extensiones se levantan a los pocos días", a: "Probablemente el problema es la preparación de la uña natural. En CALUATNAILS usamos imprimante profesional y aplicamos capa por capa con curado correcto en cada paso." },
          { q: "Nunca me hacen el relleno bien y se nota el escalón", a: "El secreto es el limado de transición. Usamos fresas profesionales para fundir el límite del crecimiento con la extensión existente. Acabado plano garantizado." },
          { q: "Cada vez tengo la uña más fina", a: "Eso ocurre cuando la retirada se hace mal. Si vienes a CALUATNAILS, valoramos antes si conviene retirar y empezar de cero para regenerar la uña natural." },
          { q: "¿Qué pasa si tengo una uña rota?", a: "La reparamos sin coste adicional dentro del mismo relleno. Aplicamos seda o tela de fibra antes de la reaplicación de gel." },
          { q: "Llevo mucho sin hacérmelas, ¿hay que empezar de cero?", a: "Depende. Si pasaron más de 5 semanas y hay levantamientos serios, sí conviene retirar. Te lo diremos en la primera revisión sin compromiso." },
        ] as PainPoint[],
        gallery: [
          { src: "/assets/manicure-exotic.jpg", title: "Relleno con cambio de color" },
          { src: "/assets/extensions-premium.png", title: "Mantenimiento mensual" },
          { src: "/assets/blog/chrome-nails.jpg", title: "Relleno + cromado" },
          { src: "/assets/blog/glitter-nails.jpg", title: "Relleno + diseño nuevo" },
        ] as GalleryItem[],
        faqs: [
          { q: "¿Cada cuánto debo hacerme el relleno?", a: "Recomendamos hacer el relleno cada 3-4 semanas dependiendo del crecimiento de tu uña natural. Esperar más puede comprometer la estructura." },
          { q: "¿Cuánto cuesta el relleno en Barcelona?", a: `En Caluatnails, el precio del relleno de gel/acrílico es de ${service.price}€ y la duración es de ${service.duration_minutes} minutos.` },
          { q: "¿Hacéis relleno aunque me las hayan puesto en otro centro?", a: "Sí, atendemos rellenos de uñas hechas en otros salones siempre que el estado lo permita. Nuestras técnicas revisarán cada uña antes de empezar." },
          { q: "¿Puedo cambiar de color en el relleno?", a: "¡Por supuesto! El relleno incluye un cambio completo de color o diseño sin coste adicional." },
          { q: "¿Política de cancelación?", a: "Cancela o reprograma sin coste hasta 24h antes. Más tarde se aplica el 50% del anticipo." },
        ],
      };
    }

    // ── UÑAS EN GEL ──
    if (isGel && !isRelleno) {
      return {
        serviceKey: "gel",
        localTitle: "Especialistas en uñas en gel en Barcelona",
        image: "/assets/manicure-exotic.jpg",
        category: "Extensiones",
        heroClaim: "Uñas largas, resistentes y a tu medida",
        keywords: "uñas en gel barcelona, extensiones gel eixample, tips uñas, escultura gel, nail art barcelona",
        intro: "Las uñas en gel son la elección preferida de quienes buscan extensiones resistentes, naturales y duraderas. En nuestro salón de Barcelona esculpimos tus uñas con técnica profesional, materiales premium y resultados que duran hasta 4 semanas.",
        whoFor: "Perfecto para quienes desean uñas largas, resistentes y elegantes — eventos especiales, bodas, día a día con estilo, o si tus uñas naturales se rompen con frecuencia.",
        whatIncludes: [
          { title: "Preparación", items: ["Diagnóstico de uña natural", "Elección de forma y longitud", "Aplicación de imprimante"] },
          { title: "Esculpido", items: ["Colocación de tips o moldes", "Aplicación de gel capa a capa", "Curado en lámpara LED/UV"] },
          { title: "Esmaltado", items: ["Color liso, francesa u ombré", "Nail art básico incluido", "Top coat de alto brillo"] },
          { title: "Cuidados extra", items: ["Hidratación de cutículas", "Aceite reparador final", "Garantía de 7 días"] },
          { title: "Opciones", items: ["Largo corto, medio o XL", "Formas: almendra, cuadrada, stiletto, ballerina", "Nail art 3D, cromado, glitter"] },
        ] as IncludedGroup[],
        steps: [
          "Reserva online o por WhatsApp",
          "Bienvenida y consulta sobre tu estilo",
          "Diagnóstico de tu uña natural",
          "Elección de forma, longitud y diseño",
          "Preparación e imprimación",
          "Colocación de tips o moldes",
          "Esculpido del gel y curado en lámpara",
          "Limado de precisión, esmaltado y top coat",
          "Reserva de tu mantenimiento (relleno) a las 3-4 semanas",
        ],
        painPoints: [
          { q: "Mis uñas naturales son cortas y se rompen", a: "Las uñas en gel son tu solución. Construimos la longitud y resistencia que necesitas. En 3-4 sesiones tu uña natural saldrá más fuerte." },
          { q: "No sé qué forma me favorece", a: "Te asesoramos en consulta gratuita. Analizamos tipo de dedos, profesión y estilo de vida para recomendar entre almendra, ovalada, cuadrada redondeada o stiletto." },
          { q: "Quiero algo distinto pero no exagerado", a: "Trabajamos diseños sobrios y elegantes: nude con borde fino, francesa moderna, glitter discreto. Te enseñamos catálogo antes de empezar." },
          { q: "Tengo un evento importante en pocos días", a: "Reserva en agenda online y te garantizamos hueco. Recomendamos hacerlas 2-3 días antes del evento para que asienten perfectas." },
          { q: "¿Cuánto se ven las raíces al crecer?", a: "Muy poco si el color es nude o francesa. En tonos oscuros se nota más a partir de la semana 3 — ahí toca relleno." },
        ] as PainPoint[],
        gallery: [
          { src: "/assets/manicure-exotic.jpg", title: "Uñas en gel almendra nude" },
          { src: "/assets/extensions-premium.png", title: "Largo medio con francesa" },
          { src: "/assets/blog/chrome-nails.jpg", title: "Acabado cromado" },
          { src: "/assets/blog/wedding-nails.jpg", title: "Uñas en gel de novia" },
        ] as GalleryItem[],
        faqs: [
          { q: "¿Cuánto duran las uñas en gel?", a: "Entre 3 y 4 semanas con un acabado impecable. Después recomendamos una sesión de relleno." },
          { q: "¿Cuánto cuestan las uñas en gel en Barcelona?", a: `En Caluatnails cuestan ${service.price}€ con una duración de la sesión de ${service.duration_minutes} minutos.` },
          { q: "¿Las uñas en gel dañan mi uña natural?", a: "No, siempre que la retirada se haga correctamente. Usamos técnicas y productos profesionales que respetan la salud de la uña." },
          { q: "¿Puedo elegir cualquier longitud y forma?", a: "Sí. Asesoramos sobre la longitud y forma ideal según tu profesión, manos y preferencias estéticas." },
          { q: "¿Qué incluye el servicio de uñas en gel?", a: "Diagnóstico, materiales premium, esculpido completo, esmaltado básico o nail art simple, sellado y cuidado final." },
          { q: "¿Política de cancelación?", a: "Hasta 24h antes sin coste. Después se aplica el 50% del anticipo. Sin presentarse: anticipo completo." },
        ],
      };
    }

    // ── COMBO MANICURA + PEDICURA ──
    if (isCombo) {
      return {
        serviceKey: "combo",
        localTitle: "Especialistas en pack manicura y pedicura en Barcelona",
        image: "/assets/manicure-pastel.jpg",
        category: "Pack Manicura + Pedicura",
        heroClaim: "Manos y pies perfectos en una sola sesión",
        keywords: "manicura y pedicura barcelona, pack belleza uñas, manicura pedicura eixample, oferta manicura pedicura",
        intro: "Disfruta del cuidado integral de manos y pies en una sola sesión. Este pack de manicura y pedicura está pensado para mujeres ocupadas que valoran la eficiencia sin renunciar a un resultado profesional, en pleno corazón del Eixample, Barcelona.",
        whoFor: "Ideal para preparar bodas, eventos, viajes o simplemente para regalarte un momento de mimo completo. También perfecto como regalo personal.",
        whatIncludes: [
          { title: "Preparación", items: ["Diagnóstico de manos y pies", "Retirada de esmalte previo", "Limado y forma personalizada"] },
          { title: "Tratamiento manos", items: ["Limado y forma", "Cutículas profesional", "Hidratación profunda"] },
          { title: "Tratamiento pies", items: ["Baño con sales minerales", "Exfoliación de durezas", "Limado profesional"] },
          { title: "Esmaltado", items: ["A juego en manos y pies", "Color libre por separado", "Francesa o nail art"] },
          { title: "Opciones", items: ["Pack tradicional", "Pack semipermanente", "Pack mixto (semi manos + trad pies)"] },
        ] as IncludedGroup[],
        steps: [
          "Reserva online o por WhatsApp",
          "Bienvenida con café/té de cortesía",
          "Diagnóstico inicial manos y pies",
          "Tratamiento simultáneo o secuencial",
          "Baño relajante y exfoliación de pies",
          "Limado, cutículas y forma en manos",
          "Esmaltado o nivelación según el servicio",
          "Masaje y aceite hidratante final",
          "Asesoramiento de mantenimiento",
        ],
        painPoints: [
          { q: "Voy fatal de tiempo, ¿se puede hacer rápido?", a: "Sí. Trabajamos con dos técnicas simultáneas para reducir el tiempo total a menos de 90 minutos sin sacrificar calidad." },
          { q: "Tengo durezas y grietas en los talones", a: "Las tratamos con limado profesional y mascarilla regeneradora. En 2-3 sesiones notarás un cambio total." },
          { q: "Me da vergüenza que me vean los pies", a: "Tranquila — atendemos cada cliente en privado. Nuestro objetivo es que salgas más cómoda contigo misma." },
          { q: "¿Vale la pena combinarlo?", a: "Sí. El pack te ahorra dinero y tiempo. Además, manos y pies a juego se ven mucho más cuidados." },
          { q: "Quiero esto para un evento concreto", a: "Reserva 2-3 días antes del evento para que el esmalte asiente perfecto. Si es boda, valoramos prueba previa." },
        ] as PainPoint[],
        gallery: [
          { src: "/assets/manicure-pastel.jpg", title: "Pack manos pastel" },
          { src: "/assets/pedicure-luxury.jpg", title: "Pedicura spa" },
          { src: "/assets/blog/wedding-nails.jpg", title: "Pack de novia" },
          { src: "/assets/blog/summer-nails.jpg", title: "Pack de verano" },
        ] as GalleryItem[],
        faqs: [
          { q: "¿Cuánto dura el pack de manicura y pedicura?", a: `La sesión completa dura ${service.duration_minutes} minutos.` },
          { q: "¿Cuánto cuesta manicura y pedicura en Barcelona?", a: `Nuestro pack tiene un precio de ${service.price}€, más económico que contratarlo por separado.` },
          { q: "¿Puedo elegir un color distinto para manos y pies?", a: "¡Sí! Tienes total libertad para escoger combinaciones, colores diferentes o esmaltados a juego." },
          { q: "¿Cada cuánto recomendáis este pack?", a: "Cada 3-4 semanas para mantener manos y pies en perfecto estado durante todo el año." },
          { q: "¿Política de cancelación?", a: "Cancela hasta 24h antes sin coste. Después, 50% del anticipo." },
        ],
      };
    }

    // ── PEDICURA ──
    if (isPedicura) {
      return {
        serviceKey: "pedicura",
        localTitle: `El salón de pedicura ${isSemiPerm ? "semipermanente" : "profesional"} de referencia en Barcelona`,
        image: "/assets/pedicure-luxury.jpg",
        category: "Pedicura",
        heroClaim: "Pies cuidados, ligeros y hidratados todo el año",
        keywords: `pedicura barcelona, pedicura ${isSemiPerm ? "semipermanente" : "spa"}, tratamiento pies eixample, pedicura profesional barcelona, salud podal`,
        intro: `Una pedicura ${isSemiPerm ? "semipermanente" : "completa"} no es solo estética: es salud, hidratación y bienestar para tus pies. En nuestro salón de Barcelona combinamos la técnica profesional con un ambiente relajante para que salgas renovada.`,
        whoFor: "Recomendado para personas que pasan muchas horas de pie, deportistas, embarazadas (consultar previamente), o simplemente para quien quiera mimar sus pies y mantenerlos sanos.",
        whatIncludes: [
          { title: "Preparación", items: ["Baño relajante con sales minerales", "Aceites esenciales y temperatura controlada", "Diagnóstico inicial del estado"] },
          { title: "Tratamiento", items: ["Exfoliación profunda", "Limado y tratamiento de cutículas", "Eliminación suave de durezas"] },
          { title: "Esmaltado", items: [isSemiPerm ? "Semipermanente con secado LED" : "Tradicional con secado al aire", "Más de 200 colores", "Francesa o nail art opcional"] },
          { title: "Cuidados extra", items: ["Mascarilla regeneradora de pies", "Masaje hidratante final", "Aceite reparador especializado"] },
          { title: "Opciones", items: ["Pedicura express (45 min)", "Pedicura spa completa", "Bono de 4 pedicuras con descuento"] },
        ] as IncludedGroup[],
        steps: [
          "Reserva online o por WhatsApp",
          "Bienvenida con bebida de cortesía",
          "Diagnóstico del estado de pies y uñas",
          "Baño relajante con sales minerales",
          "Exfoliación y eliminación de durezas",
          "Tratamiento profesional de cutículas",
          "Limado y forma personalizada",
          isSemiPerm ? "Esmaltado semipermanente con curado LED" : "Esmaltado tradicional con secado al aire",
          "Masaje hidratante y aceite reparador",
        ],
        painPoints: [
          { q: "Tengo durezas muy gruesas en los talones", a: "Las tratamos con limado profesional y mascarilla regeneradora intensiva. Notarás un cambio desde la primera sesión." },
          { q: "Las uñas de los pies están amarillentas o gruesas", a: "Si es por exceso de queratina, lo tratamos en consulta. Si sospechamos hongos, te recomendamos visita al podólogo antes de esmaltar." },
          { q: "Me duelen los pies de estar todo el día de pie", a: "Nuestro masaje final incluye técnica reflexológica suave. Recomendamos pedicura cada 4-6 semanas como rutina de bienestar." },
          { q: "Estoy embarazada, ¿puedo hacérmela?", a: "Sí, con productos sin acetonas agresivas y posturas adaptadas. Avísanos al reservar para preparar la sesión a tu medida." },
          { q: "Voy a la playa y quiero pies presentables", a: "Reserva 1-2 días antes del viaje. Recomendamos semipermanente: aguanta agua salada, arena y crema solar sin desconcharse." },
        ] as PainPoint[],
        gallery: [
          { src: "/assets/pedicure-luxury.jpg", title: "Pedicura spa completa" },
          { src: "/assets/blog/spa-nails.jpg", title: "Tratamiento relajante" },
          { src: "/assets/blog/summer-nails.jpg", title: "Pedicura de verano" },
          { src: "/assets/blog/nude-nails.jpg", title: "Acabado nude elegante" },
        ] as GalleryItem[],
        faqs: [
          { q: "¿Cada cuánto debo hacerme la pedicura?", a: "Recomendamos una sesión cada 4-6 semanas para mantener la salud y suavidad de tus pies durante todo el año." },
          { q: "¿Tratáis durezas y callosidades?", a: "Sí, nuestro proceso incluye la eliminación suave y profesional de durezas para dejar tus pies como nuevos." },
          { q: `¿Cuánto cuesta la pedicura ${isSemiPerm ? "semipermanente" : "tradicional"} en Barcelona?`, a: `En Caluatnails cuesta ${service.price}€ y la sesión dura ${service.duration_minutes} minutos.` },
          { q: "¿Atendéis pedicura podológica?", a: "Realizamos pedicura estética. Si necesitas tratamiento de uñas encarnadas, hongos u otras patologías, te recomendamos un podólogo." },
          { q: isSemiPerm ? "¿Cuánto dura la pedicura semipermanente?" : "¿Cuánto dura la pedicura tradicional?", a: isSemiPerm ? "El esmaltado semipermanente en pedicura dura entre 3 y 4 semanas con brillo intacto." : "El esmalte tradicional aguanta entre 5 y 7 días dependiendo del uso." },
          { q: "¿Política de cancelación?", a: "Cancela hasta 24h antes sin coste. Después, 50% del anticipo." },
        ],
      };
    }

    // ── ESMALTADO SEMIPERMANENTE ──
    if (isEsmaltado || (isSemiPerm && !isNivelacion)) {
      return {
        serviceKey: "semipermanente",
        localTitle: "El salón de manicura semipermanente de referencia en Barcelona",
        image: "/assets/manicure-pastel.jpg",
        category: "Esmaltado Semipermanente",
        heroClaim: "Uñas perfectas durante semanas sin desconchones",
        keywords: "esmaltado semipermanente barcelona, manicura gel eixample, esmalte permanente, manicura larga duración",
        intro: "El esmaltado semipermanente es la solución perfecta para mantener tus uñas perfectas durante semanas. En nuestro salón de manicura en Barcelona aplicamos las mejores marcas profesionales para un resultado de hasta 4 semanas sin desconchados.",
        whoFor: "Ideal para quienes quieren uñas perfectas durante semanas sin dedicarles tiempo cada día. Profesionales, madres, novias, eventos especiales.",
        whatIncludes: [
          { title: "Preparación", items: ["Retirada del esmalte previo", "Diagnóstico de uña natural", "Limado y forma personalizada"] },
          { title: "Tratamiento", items: ["Cutículas profesional", "Deshidratación técnica", "Base rubber de protección"] },
          { title: "Esmaltado", items: ["Más de 200 colores OPI/CND", "Francesa, ombré o nail art", "Top coat brillante o mate"] },
          { title: "Cuidados extra", items: ["Hidratación final de cutículas", "Aceite reparador especializado", "Consejos de mantenimiento"] },
          { title: "Opciones", items: ["Semipermanente express", "Semi + nail art", "Semi + francesa moderna", "Bono mensual con descuento"] },
        ] as IncludedGroup[],
        steps: [
          "Reserva online o por WhatsApp",
          "Bienvenida y elección de color",
          "Retirada del esmalte previo",
          "Limado, forma y cutículas",
          "Preparación técnica y deshidratación",
          "Aplicación de base, color y top coat",
          "Curado en lámpara LED en cada capa",
          "Hidratación final de cutículas",
          "Asesoramiento sobre cuándo volver",
        ],
        painPoints: [
          { q: "El semipermanente se me desconcha a los pocos días", a: "Probablemente la preparación previa fue insuficiente. En CALUATNAILS deshidratamos la uña técnicamente antes de la base. Garantizamos 3-4 semanas." },
          { q: "Tengo las uñas finas y débiles después de quitarlo", a: "Eso pasa cuando se retira mal (raspando o tirando). Nosotras retiramos con producto profesional y técnica respetuosa. Tras 1-2 sesiones notarás la diferencia." },
          { q: "Quiero un acabado que dure de verdad", a: "Nuestro top coat es de larga duración profesional. Con el cuidado correcto, dura 4 semanas con brillo intacto." },
          { q: "No sé qué color me favorece", a: "Te asesoramos en consulta. Analizamos tu tono de piel para sugerir los nudes, rosas, rojos o tonos en tendencia que mejor te quedan." },
          { q: "Vengo a una primera vez, ¿qué necesito?", a: "Nada — venir con las uñas tal como las tienes. Aquí te lo retiramos, tratamos y aplicamos. Toda la sesión sin que tengas que preparar nada." },
        ] as PainPoint[],
        gallery: [
          { src: "/assets/manicure-pastel.jpg", title: "Semipermanente pastel" },
          { src: "/assets/blog/red-nails.jpg", title: "Rojo clásico de larga duración" },
          { src: "/assets/blog/nude-nails.jpg", title: "Nude elegante" },
          { src: "/assets/blog/nails-french.jpg", title: "Francesa moderna" },
        ] as GalleryItem[],
        faqs: [
          { q: "¿Cuánto dura el esmaltado semipermanente?", a: "Entre 3 y 4 semanas manteniendo el brillo y color como el primer día. Tras ese tiempo recomendamos retirar y reaplicar." },
          { q: "¿Cuánto cuesta el esmaltado semipermanente en Barcelona?", a: `En Caluatnails cuesta ${service.price}€ y la sesión dura ${service.duration_minutes} minutos.` },
          { q: "¿El semipermanente daña la uña?", a: "No, siempre que la retirada se haga correctamente con producto profesional. Nunca tirando o picando." },
          { q: "¿Puedo combinarlo con nail art?", a: "¡Sí! Podemos añadir diseños, francesas, glitter o pedrería. Pregúntanos al reservar." },
          { q: "¿Puedo llevar mi propio esmalte?", a: "Para semipermanente usamos siempre nuestros productos profesionales por compatibilidad con el secado LED y duración garantizada." },
          { q: "¿Política de cancelación?", a: "Cancela hasta 24h antes sin coste. Después, 50% del anticipo." },
        ],
      };
    }

    // ── MANICURA CON NIVELACIÓN (RUSA) ──
    if (isNivelacion) {
      return {
        serviceKey: "nivelacion",
        localTitle: "Especialistas en manicura con nivelación (rusa) en Barcelona",
        image: "/assets/manicure-pastel.jpg",
        category: "Manicura Rusa",
        heroClaim: "Acabado espejo, esmaltado bajo cutícula, hasta 5 semanas",
        keywords: "manicura rusa barcelona, manicura con nivelación, manicura japonesa, torno uñas eixample, nivelación placa ungueal",
        intro: "La manicura con nivelación, también conocida como manicura rusa, es la técnica más profesional para conseguir un acabado perfectamente plano, simétrico y duradero. En nuestro salón de Barcelona somos especialistas en esta técnica con torno y nivelación.",
        whoFor: "Pensado para quienes quieren el acabado más profesional posible: uñas planas, simétricas y duraderas. Especialmente recomendado si tienes la uña irregular o curva.",
        whatIncludes: [
          { title: "Preparación", items: ["Limpieza profunda con técnica rusa", "Torno con fresas profesionales", "Retirada técnica de cutícula"] },
          { title: "Tratamiento", items: ["Nivelación de placa ungueal", "Gel constructor o builder", "Curado en lámpara LED por capas"] },
          { title: "Esmaltado", items: ["Bajo cutícula con pincel fino", "Color liso o francesa", "Top coat de alto brillo"] },
          { title: "Cuidados extra", items: ["Aceite hidratante final", "Mascarilla reparadora de cutículas", "Asesoramiento sobre mantenimiento"] },
          { title: "Opciones", items: ["Nivelación solo (sin color)", "Nivelación + francesa moderna", "Nivelación + nail art", "Bono mensual con descuento"] },
        ] as IncludedGroup[],
        steps: [
          "Reserva online o por WhatsApp",
          "Bienvenida con bebida de cortesía",
          "Diagnóstico de la placa ungueal",
          "Manicura rusa con torno profesional",
          "Retirada técnica de cutícula",
          "Nivelación con gel constructor",
          "Curado en lámpara LED por capas",
          "Esmaltado bajo cutícula y sellado",
          "Aceite final y reserva próxima cita",
        ],
        painPoints: [
          { q: "Tengo la uña curva o irregular", a: "Justo para eso es la nivelación. Construimos una placa plana y simétrica que cambia totalmente el aspecto de tus uñas. Resultado visible desde la primera sesión." },
          { q: "Quiero que dure más de 3 semanas", a: "La manicura con nivelación dura hasta 5 semanas con brillo intacto. Es la opción más duradera del mercado." },
          { q: "Me da miedo el torno", a: "Es totalmente seguro en manos profesionales. Nuestras técnicas tienen formación específica en manicura rusa y trabajan en seco sin agredir la cutícula." },
          { q: "El esmaltado siempre se ve el crecimiento rápido", a: "Aplicamos el color hasta el borde real de la uña (bajo cutícula), por eso el crecimiento tarda mucho más en notarse." },
          { q: "¿Es lo mismo que la japonesa?", a: "No. La japonesa usa polvo de sílice y se enfoca en hidratación sin esmaltado. La rusa con nivelación construye placa y aplica color. Te asesoramos según tu objetivo." },
        ] as PainPoint[],
        gallery: [
          { src: "/assets/manicure-pastel.jpg", title: "Acabado espejo nude" },
          { src: "/assets/blog/nails-french.jpg", title: "Nivelación con francesa" },
          { src: "/assets/blog/nude-nails.jpg", title: "Bajo cutícula nude" },
          { src: "/assets/blog/wedding-nails.jpg", title: "Nivelación de novia" },
        ] as GalleryItem[],
        faqs: [
          { q: "¿Qué es la manicura rusa o con nivelación?", a: "Es una técnica avanzada que usa torno para tratar la cutícula y aplica gel constructor para nivelar la placa ungueal, consiguiendo un acabado plano, simétrico y de larga duración." },
          { q: "¿Cuánto dura la manicura con nivelación?", a: "Entre 4 y 5 semanas con brillo y forma impecables. Más que un semipermanente convencional." },
          { q: "¿Cuánto cuesta la manicura con nivelación en Barcelona?", a: `En Caluatnails cuesta ${service.price}€ y dura ${service.duration_minutes} minutos.` },
          { q: "¿Es lo mismo manicura rusa que japonesa?", a: "No. La rusa usa torno y nivelación con gel. La japonesa usa polvo de sílice y se centra en hidratación natural sin esmaltado." },
          { q: "¿Es agresivo para la cutícula?", a: "No si lo hace una técnica formada. Nuestras profesionales tienen formación específica en manicura rusa para una experiencia 100% segura." },
          { q: "¿Política de cancelación?", a: "Cancela hasta 24h antes sin coste. Después, 50% del anticipo." },
        ],
      };
    }

    // ── MANICURA TRADICIONAL ──
    if (isTradicional || isManicura) {
      return {
        serviceKey: "tradicional",
        localTitle: "El salón de manicura tradicional de referencia en Barcelona",
        image: "/assets/manicure-pastel.jpg",
        category: "Manicura Tradicional",
        heroClaim: "Manos cuidadas, esmaltado impecable y un trato que enamora",
        keywords: "manicura tradicional barcelona, manicura natural eixample, manicura clásica, manicura sin gel",
        intro: "La manicura tradicional sigue siendo la elección de muchas mujeres que valoran lo natural, lo sencillo y lo cuidado. En nuestro salón de Barcelona realizamos manicura clásica con técnica profesional y productos respetuosos con tu uña natural.",
        whoFor: "Ideal si prefieres uñas naturales, eventos puntuales, o como complemento entre sesiones de semipermanente para dejar respirar la uña.",
        whatIncludes: [
          { title: "Preparación", items: ["Limado y forma personalizada", "Retirada profesional de cutículas", "Exfoliación e hidratación", "Masaje suave de manos"] },
          { title: "Tratamiento de la uña", items: ["Fortalecimiento si lo necesita", "Pulido profesional", "Base protectora"] },
          { title: "Esmaltado", items: ["Esmalte clásico OPI/Essie", "Francesa o nail art básico", "Top coat de larga duración"] },
          { title: "Cuidados extra", items: ["Parafina hidratante (opcional)", "Mascarilla anti-edad (opcional)", "Aceite reparador final"] },
          { title: "Opciones", items: ["Manicura express (30 min)", "Manicura completa", "Manicura + pedicura", "Bonos mensuales"] },
        ] as IncludedGroup[],
        steps: [
          "Reserva online o por WhatsApp",
          "Bienvenida y elección de color/acabado",
          "Diagnóstico del estado de tus uñas",
          "Preparación e higienización",
          "Limado, cutículas y exfoliación",
          "Masaje hidratante de manos",
          "Esmaltado y sellado",
          "Consejos de mantenimiento en casa",
          "Reserva de tu próxima cita con descuento",
        ],
        painPoints: [
          { q: "Mis uñas se rompen mucho, ¿qué puedo hacer?", a: "En la sesión analizamos por qué se rompen. Aplicamos fortalecedor profesional y te damos pautas de hidratación. Notarás cambio en 2-3 sesiones." },
          { q: "Quiero una manicura que dure más de una semana", a: "Para eso recomendamos esmaltado semipermanente o manicura con nivelación. Te asesoramos sin compromiso sobre la mejor opción para tu uña." },
          { q: "Tengo las cutículas muy secas", a: "Trabajamos con aceite hidratante profesional y mascarilla específica para cutículas. Verás resultado desde la primera sesión." },
          { q: "No sé qué color me favorece", a: "Analizamos tu subtono de piel y te recomendamos paleta. Tenemos más de 100 colores en carta para que elijas el ideal." },
          { q: "Vengo con poco tiempo, ¿hay opción exprés?", a: "Sí. Tenemos manicura express en 30 minutos con limado, cutículas y esmaltado clásico. Reserva online indicando 'express'." },
        ] as PainPoint[],
        gallery: [
          { src: "/assets/manicure-pastel.jpg", title: "Francesa clásica" },
          { src: "/assets/blog/nude-nails.jpg", title: "Nude con brillo" },
          { src: "/assets/blog/red-nails.jpg", title: "Rojo intenso de larga duración" },
          { src: "/assets/blog/nails-pink.jpg", title: "Rosa palo elegante" },
        ] as GalleryItem[],
        faqs: [
          { q: "¿Cuánto dura una manicura tradicional?", a: "El servicio en salón dura entre 30 y 45 minutos. El esmaltado dura entre 5 y 7 días dependiendo del uso." },
          { q: "¿Cuánto tiempo me dura el esmaltado?", a: "Entre 5 y 7 días. Con guantes para tareas domésticas y top coat profesional, puede llegar a 10 días." },
          { q: "¿Qué diferencia hay con la manicura semipermanente?", a: "La tradicional usa esmalte clásico que seca al aire (dura 5-7 días). La semipermanente usa gel curado en lámpara LED (dura 3-4 semanas). Te asesoramos según tu objetivo." },
          { q: "¿Puedo ir embarazada?", a: "Sí. La manicura tradicional es 100% segura en el embarazo. Usamos esmaltes hipoalergénicos sin formaldehído ni tolueno." },
          { q: "¿Y si tengo las uñas muy débiles o mordidas?", a: "Trabajamos con productos fortalecedores específicos. En 2-3 sesiones notarás un cambio importante. También asesoramos sobre alimentación y suplementos." },
          { q: "¿Qué métodos de higiene aplicáis?", a: "Material desechable individual, instrumental esterilizado en autoclave, superficie de trabajo desinfectada entre clientas y formación continua del equipo." },
          { q: "¿Puedo llevar mi propio esmalte?", a: "Sí, sin problema. Aplicamos tu esmalte siguiendo nuestro protocolo profesional. El precio del servicio no cambia." },
          { q: "¿Tenéis bonos o suscripción mensual?", a: "Sí. Tenemos bonos de 4 sesiones con 15% de descuento y suscripción mensual con cita reservada cada 3 semanas." },
          { q: "¿Política de cancelación?", a: "Cancela o reprograma hasta 24h antes sin coste. Después, se aplica el 50% del anticipo." },
          { q: "¿Hacéis manicura a domicilio?", a: "Actualmente no. Toda la atención es en nuestro salón del Eixample para garantizar las máximas condiciones de higiene y calidad." },
        ],
      };
    }

    // ── FALLBACK ──
    return {
      serviceKey: "fallback",
      localTitle: "Tu salón de uñas de referencia en Barcelona",
      image: "/assets/manicure-pastel.jpg",
      category: "Servicio Premium",
      heroClaim: "Cuidado profesional de tus uñas en el Eixample",
      keywords: "manicura barcelona, pedicura barcelona, uñas eixample",
      intro: `Disfruta de nuestro servicio profesional de ${service.name} en pleno corazón del Eixample, Barcelona.`,
      whoFor: "Para quien busca un servicio de uñas profesional en Barcelona con resultados duraderos.",
      whatIncludes: [
        { title: "Preparación", items: ["Diagnóstico previo", "Higienización", "Limado profesional"] },
        { title: "Tratamiento", items: ["Aplicación técnica", "Productos premium", "Curado/secado correcto"] },
        { title: "Esmaltado", items: ["Color libre", "Más de 100 opciones", "Top coat de alto brillo"] },
        { title: "Cuidados extra", items: ["Hidratación final", "Aceite reparador", "Consejos de mantenimiento"] },
        { title: "Opciones", items: ["Servicio individual", "Combinado con pedicura", "Bonos mensuales"] },
      ] as IncludedGroup[],
      steps: [
        "Reserva online o por WhatsApp",
        "Bienvenida y diagnóstico",
        "Preparación profesional",
        "Aplicación técnica del servicio",
        "Acabado y hidratación",
      ],
      painPoints: [
        { q: "Quiero un servicio profesional", a: "Todo nuestro equipo está certificado y trabajamos con productos premium." },
        { q: "Tengo poco tiempo", a: "Optimizamos cada sesión sin sacrificar calidad." },
      ] as PainPoint[],
      gallery: [
        { src: "/assets/manicure-pastel.jpg", title: "Acabado profesional" },
        { src: "/assets/manicure-premium.png", title: "Resultado de salón" },
      ] as GalleryItem[],
      faqs: [
        { q: `¿Cuánto cuesta ${service.name} en Barcelona?`, a: `En Caluatnails cuesta ${service.price}€ y dura ${service.duration_minutes} minutos.` },
        { q: "¿Dónde está el salón?", a: "En Carrer del Rosselló 497, Eixample, Barcelona. A 5 minutos de Sagrada Familia." },
      ],
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-500"></div>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6 text-center">
        <Helmet>
          <title>Servicio no encontrado | CALUATNAILS</title>
          <meta name="robots" content="noindex, follow" />
          <link rel="canonical" href="https://www.caluatnails.com/servicios" />
        </Helmet>
        <h1 className="text-4xl font-black text-gray-900 mb-4">Servicio no encontrado</h1>
        <p className="text-gray-500 mb-8">Lo sentimos, el servicio que buscas no está disponible o ha cambiado de nombre.</p>
        <button onClick={() => navigate("/servicios")} className="bg-rose-500 text-white px-8 py-3 rounded-full font-bold shadow-lg hover:bg-rose-600 transition-all">
          Ver todos los servicios
        </button>
      </div>
    );
  }

  const serviceData = getServiceData()!;
  const canonicalUrl = `https://www.caluatnails.com/servicios/${slug}`;
  const seoTitle = `${service.name} en Barcelona desde ${service.price}€ | CALUATNAILS Eixample`;
  const seoDesc = `${service.name} profesional en Barcelona (Eixample). ${serviceData.intro.slice(0, 110)}... Reserva online — ${service.duration_minutes} min · desde ${service.price}€.`;
  const whatsappUrl = `https://wa.me/34636689101?text=${encodeURIComponent(`Hola, quiero reservar ${service.name}`)}`;

  return (
    <div className="min-h-screen bg-white font-inter">
      <Helmet>
        <title>{seoTitle}</title>
        <meta name="description" content={seoDesc} />
        <meta name="keywords" content={serviceData.keywords} />
        <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1" />
        <link rel="canonical" href={canonicalUrl} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:title" content={seoTitle} />
        <meta property="og:description" content={seoDesc} />
        <meta property="og:image" content={`https://www.caluatnails.com${serviceData.image}`} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:locale" content="es_ES" />
        <meta property="og:site_name" content="CALUATNAILS" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={seoTitle} />
        <meta name="twitter:description" content={seoDesc} />
        <meta name="twitter:image" content={`https://www.caluatnails.com${serviceData.image}`} />

        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@graph": [
              {
                "@type": "Service",
                "@id": `${canonicalUrl}#service`,
                name: service.name,
                description: serviceData.intro,
                image: `https://www.caluatnails.com${serviceData.image}`,
                serviceType: serviceData.category,
                category: serviceData.category,
                url: canonicalUrl,
                provider: {
                  "@type": "BeautySalon",
                  "@id": "https://www.caluatnails.com/#salon",
                  name: "CALUATNAILS",
                  telephone: "+34 636 68 91 01",
                  address: {
                    "@type": "PostalAddress",
                    streetAddress: "Carrer del Rosselló, 497",
                    addressLocality: "Barcelona",
                    postalCode: "08025",
                    addressCountry: "ES",
                  },
                },
                areaServed: { "@type": "City", name: "Barcelona" },
                offers: {
                  "@type": "Offer",
                  price: service.price,
                  priceCurrency: "EUR",
                  availability: "https://schema.org/InStock",
                  url: canonicalUrl,
                  validFrom: "2026-01-01",
                },
                aggregateRating: {
                  "@type": "AggregateRating",
                  ratingValue: "4.9",
                  reviewCount: "247",
                  bestRating: "5",
                  worstRating: "1",
                },
              },
              {
                "@type": "BreadcrumbList",
                itemListElement: [
                  { "@type": "ListItem", position: 1, name: "Inicio", item: "https://www.caluatnails.com/" },
                  { "@type": "ListItem", position: 2, name: "Servicios", item: "https://www.caluatnails.com/servicios" },
                  { "@type": "ListItem", position: 3, name: service.name, item: canonicalUrl },
                ],
              },
              {
                "@type": "FAQPage",
                mainEntity: serviceData.faqs.map(f => ({
                  "@type": "Question",
                  name: f.q,
                  acceptedAnswer: { "@type": "Answer", text: f.a },
                })),
              },
            ],
          })}
        </script>
      </Helmet>

      {/* ── Nav ── */}
      <nav className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md z-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <button onClick={() => (window.history.length > 1 ? navigate(-1) : navigate("/"))} className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors cursor-pointer">
            <ChevronLeft className="w-5 h-5" />
            <span className="text-sm font-medium">Volver</span>
          </button>
          <a href="/" className="flex items-center shrink-0 cursor-pointer">
            <span className="font-playfair text-xl md:text-2xl font-bold tracking-widest text-gray-900">
              <img src="/assets/caluatnails-logo.png" alt="Caluatnails" className="h-8 md:h-10 w-auto object-contain" />
            </span>
          </a>
          <button onClick={() => navigate("/reservar")} className="bg-rose-500 text-white px-5 py-2 rounded-full text-xs font-bold hover:bg-rose-600 transition-all shadow-lg shadow-rose-200">
            RESERVAR
          </button>
        </div>
      </nav>

      <main className="pt-24">
        {/* ═══ 1. HERO ═══ */}
        <section className="max-w-7xl mx-auto px-6 mb-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="order-2 lg:order-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-rose-50 text-rose-600 rounded-full text-[10px] font-bold mb-6 uppercase tracking-widest">
                <Sparkles className="w-3 h-3" /> {serviceData.category} · Barcelona Eixample
              </div>
              <h1 className="text-4xl lg:text-6xl font-black text-gray-900 leading-tight mb-4">
                {service.name} en Barcelona
              </h1>
              <p className="text-xl lg:text-2xl text-gray-600 leading-relaxed mb-8 font-light italic">
                {serviceData.heroClaim}
              </p>

              <div className="flex flex-wrap gap-6 mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-700">
                    <Clock className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Duración</p>
                    <p className="text-lg font-black text-gray-900">{service.duration_minutes} min</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-500">
                    <span className="text-xl font-black">€</span>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Precio desde</p>
                    <p className="text-lg font-black text-gray-900">{service.price}€</p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button onClick={() => navigate("/reservar")} className="group flex items-center justify-center gap-3 bg-gray-900 text-white px-8 py-4 rounded-2xl font-bold text-lg hover:bg-rose-500 transition-all shadow-xl shadow-gray-200">
                  Reserva tu cita online
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
                <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 bg-green-500 text-white px-6 py-4 rounded-2xl font-bold text-base hover:bg-green-600 transition-all">
                  <MessageCircle className="w-5 h-5" /> WhatsApp
                </a>
              </div>

              <p className="mt-6 text-xs text-gray-400 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-teal-500" /> Pago seguro del anticipo online y confirmación inmediata.
              </p>
            </div>

            <div className="order-1 lg:order-2 relative">
              <div className="aspect-[4/5] bg-gray-100 rounded-[3rem] overflow-hidden relative shadow-2xl">
                <img src={serviceData.image} alt={`${service.name} profesional en CALUATNAILS, salón de uñas en el Eixample de Barcelona`} className="w-full h-full object-cover transition-transform duration-700 hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"></div>
                <div className="absolute bottom-8 left-8 right-8 bg-white/90 backdrop-blur-md p-6 rounded-3xl border border-white/50 shadow-lg">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-rose-500 rounded-2xl flex items-center justify-center text-white font-black text-xl">4.9</div>
                    <div>
                      <p className="text-xs font-bold text-gray-900">+5.000 clientas felices</p>
                      <div className="flex text-amber-400">
                        {[1, 2, 3, 4, 5].map(i => (
                          <Star key={i} className="w-3 h-3 fill-current" />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ═══ 2. BARRA DE CONFIANZA ═══ */}
        <section className="bg-gray-50 border-y border-gray-100 py-6 mb-16">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex flex-wrap items-center justify-center gap-4 md:gap-8 text-gray-700">
              {TRUST_BADGES.map(b => (
                <div key={b.label} className="flex items-center gap-2 text-xs md:text-sm font-semibold">
                  <i className={`${b.icon} text-rose-500 text-lg`}></i>
                  <span>{b.label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ 3. PRESENTACIÓN ═══ */}
        <section className="max-w-4xl mx-auto px-6 mb-20 text-center">
          <h2 className="text-3xl lg:text-4xl font-black text-gray-900 mb-6">
            {serviceData.localTitle}
          </h2>
          <p className="text-lg text-gray-600 leading-relaxed">{serviceData.intro}</p>
          <p className="text-lg text-gray-600 leading-relaxed mt-4">
            En <strong>CALUATNAILS</strong>, en pleno corazón del Eixample, combinamos <strong>técnica avanzada</strong>, <strong>higiene certificada</strong> y <strong>atención 100% personalizada</strong> para que cada cita sea una experiencia única.
          </p>
          <p className="text-base text-gray-500 leading-relaxed mt-6 text-balance">
            {NEIGHBORHOODS_TEXT}
          </p>
        </section>

        {/* ═══ 4. ¿QUÉ INCLUYE? ═══ */}
        <section className="bg-gradient-to-b from-rose-50/40 to-white py-20 mb-20">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl lg:text-4xl font-black text-gray-900 mb-4">
                ¿Qué incluye nuestro servicio de {service.name.toLowerCase()}?
              </h2>
              <p className="text-gray-500">Todo lo que recibes en tu cita, desde la preparación hasta los cuidados extra.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {serviceData.whatIncludes.map(group => (
                <div key={group.title} className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                    {group.title}
                  </h3>
                  <ul className="space-y-2">
                    {group.items.map(it => (
                      <li key={it} className="flex items-start gap-2 text-sm text-gray-600 leading-relaxed">
                        <CheckCircle2 className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                        <span>{it}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ 5. ¿POR QUÉ ELEGIRNOS? ═══ */}
        <section className="max-w-7xl mx-auto px-6 mb-20">
          <h2 className="text-3xl lg:text-4xl font-black text-gray-900 mb-12 text-center">
            ¿Por qué elegir nuestro salón?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {WHY_US.map(w => (
              <div key={w.title} className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all">
                <div className="w-14 h-14 bg-rose-50 rounded-2xl flex items-center justify-center mb-5">
                  <i className={`${w.icon} text-rose-500 text-2xl`}></i>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-3">{w.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{w.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ═══ 6. PROCESO PASO A PASO ═══ */}
        <section className="bg-gray-50 py-20 mb-20">
          <div className="max-w-4xl mx-auto px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl lg:text-4xl font-black text-gray-900 mb-4">
                ¿Cómo es tu cita paso a paso?
              </h2>
              <p className="text-gray-500">Sin sorpresas — esto es exactamente lo que vivirás en CALUATNAILS.</p>
            </div>
            <div className="space-y-4">
              {serviceData.steps.map((step, i) => (
                <div key={i} className="flex items-start gap-5 bg-white p-5 rounded-2xl border border-gray-100">
                  <div className="w-10 h-10 rounded-full bg-rose-500 text-white flex items-center justify-center font-black shrink-0">
                    {i + 1}
                  </div>
                  <p className="text-gray-700 pt-1.5">{step}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ 7. PAIN POINTS ═══ */}
        <section className="max-w-4xl mx-auto px-6 mb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-black text-gray-900 mb-4">
              Resolvemos tus dudas más habituales
            </h2>
            <p className="text-gray-500">Hablamos claro. Si tienes alguna preocupación, probablemente la hayamos escuchado antes.</p>
          </div>
          <div className="space-y-3">
            {serviceData.painPoints.map((p, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                <button onClick={() => setOpenPain(openPain === i ? null : i)} className="w-full flex items-center justify-between p-5 text-left cursor-pointer hover:bg-gray-50 transition-colors">
                  <span className="font-semibold text-gray-900 pr-4">"{p.q}"</span>
                  <i className={`ri-${openPain === i ? "subtract" : "add"}-line text-rose-500 text-xl shrink-0`}></i>
                </button>
                {openPain === i && (
                  <div className="px-5 pb-5 border-t border-gray-50">
                    <p className="text-gray-600 leading-relaxed pt-4">{p.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* ═══ 8. CTA INTERMEDIO ═══ */}
        <section className="max-w-5xl mx-auto px-6 mb-20">
          <div className="bg-gradient-to-r from-rose-500 to-rose-400 rounded-3xl p-10 lg:p-14 text-center text-white shadow-xl shadow-rose-200">
            <h2 className="text-3xl lg:text-4xl font-black mb-4">Reserva tu cita en menos de 1 minuto</h2>
            <p className="text-rose-50 mb-8 max-w-xl mx-auto">Elige servicio, profesional y horario. Pago seguro online del anticipo y confirmación inmediata por WhatsApp.</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button onClick={() => navigate("/reservar")} className="bg-white text-rose-600 px-8 py-4 rounded-full font-black hover:scale-105 transition-transform shadow-lg">
                Reservar online
              </button>
              <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="bg-white/20 backdrop-blur-md border border-white/30 text-white px-8 py-4 rounded-full font-bold hover:bg-white/30 transition-all">
                <MessageCircle className="inline w-5 h-5 mr-2" /> Escríbenos por WhatsApp
              </a>
            </div>
          </div>
        </section>

        {/* ═══ 9. MARCAS ═══ */}
        <section className="max-w-7xl mx-auto px-6 mb-20">
          <div className="text-center mb-10">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Trabajamos con las mejores marcas</p>
            <h2 className="text-2xl lg:text-3xl font-black text-gray-900">Productos profesionales en cada servicio</h2>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-4 md:gap-8">
            {BRANDS.map(brand => (
              <div key={brand} className="px-6 py-3 bg-gray-50 rounded-2xl border border-gray-100 text-gray-700 font-bold text-sm md:text-base">
                {brand}
              </div>
            ))}
          </div>
        </section>

        {/* ═══ 10. GALERÍA INSTAGRAM ═══ */}
        <section className="max-w-5xl mx-auto px-6 mb-20">
          <div className="text-center mb-10">
            <h2 className="text-3xl lg:text-4xl font-black text-gray-900 mb-4">
              Galería de trabajos reales
            </h2>
            <p className="text-gray-500">Algunos diseños y acabados que hacemos en el salón.</p>
          </div>

          {/* Instagram header */}
          <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-yellow-400 via-rose-500 to-purple-600 p-[2px]">
                  <div className="w-full h-full rounded-full bg-white flex items-center justify-center">
                    <span className="font-playfair text-sm font-bold text-gray-900">G</span>
                  </div>
                </div>
                <div>
                  <a href="https://www.instagram.com/gloria_hernandez_nails_studio/" target="_blank" rel="noopener noreferrer" className="font-bold text-gray-900 text-sm hover:text-rose-500 transition-colors">
                    gloria_hernandez_nails_studio
                  </a>
                  <p className="text-xs text-gray-500">CALUATNAILS · Barcelona</p>
                </div>
              </div>
              <a
                href="https://www.instagram.com/gloria_hernandez_nails_studio/"
                target="_blank"
                rel="noopener noreferrer"
                className="hidden sm:inline-flex items-center gap-2 bg-gradient-to-r from-rose-500 to-purple-500 text-white px-4 py-2 rounded-full text-xs font-bold hover:scale-105 transition-transform"
              >
                <i className="ri-instagram-line text-base"></i>
                Seguir
              </a>
            </div>

            {/* Grid de posts */}
            <div className="grid grid-cols-3 gap-1 p-1">
              {serviceData.gallery.concat(serviceData.gallery.slice(0, Math.max(0, 6 - serviceData.gallery.length))).slice(0, 6).map((g, i) => (
                <a
                  key={i}
                  href="https://www.instagram.com/gloria_hernandez_nails_studio/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative aspect-square overflow-hidden bg-gray-100"
                >
                  <img src={g.src} alt={`${g.title} — ${service.name} CALUATNAILS Barcelona Eixample`} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" loading="lazy" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <i className="ri-instagram-line text-white text-3xl"></i>
                  </div>
                </a>
              ))}
            </div>

            {/* CTA inferior */}
            <a
              href="https://www.instagram.com/gloria_hernandez_nails_studio/"
              target="_blank"
              rel="noopener noreferrer"
              className="block text-center py-4 border-t border-gray-100 hover:bg-gray-50 transition-colors group"
            >
              <span className="inline-flex items-center gap-2 text-sm font-bold text-gray-900 group-hover:text-rose-500 transition-colors">
                <i className="ri-instagram-line text-rose-500 text-lg"></i>
                Ver más diseños en Instagram
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </span>
            </a>
          </div>
        </section>

        {/* ═══ 11. TESTIMONIOS ═══ */}
        <section className="bg-gray-50 py-20 mb-20">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-12">
              <div className="flex justify-center mb-3">
                {[1, 2, 3, 4, 5].map(i => (
                  <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <h2 className="text-3xl lg:text-4xl font-black text-gray-900 mb-4">
                Lo que dicen nuestras clientas
              </h2>
              <p className="text-gray-500">Reseñas reales en Google y redes — valoración media 4,9 ★ sobre 5.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {TESTIMONIALS.map(t => (
                <div key={t.name} className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
                  <div className="flex text-amber-400 mb-4">
                    {Array.from({ length: t.rating }).map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-current" />
                    ))}
                  </div>
                  <p className="text-gray-700 leading-relaxed mb-6 italic">"{t.text}"</p>
                  <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-rose-400 to-rose-600 flex items-center justify-center text-white font-black">
                      {t.name[0]}
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 text-sm">{t.name}</p>
                      <p className="text-xs text-gray-500">{t.service}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ 12. CÓMO LLEGAR ═══ */}
        <section className="max-w-7xl mx-auto px-6 mb-20">
          <div className="text-center mb-12">
            <p className="text-xs font-bold text-rose-500 uppercase tracking-widest mb-3">Cómo llegar</p>
            <h2 className="text-3xl lg:text-4xl font-black text-gray-900 mb-4">
              Llegar a CALUATNAILS es muy fácil
            </h2>
            <p className="text-gray-500">
              Estamos en <strong className="text-gray-900">Carrer del Rosselló 497, 08025 Barcelona</strong> — pleno Eixample, a 5 min de Sagrada Família.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Mapa Google */}
            <div className="lg:col-span-3 rounded-3xl overflow-hidden border border-gray-100 shadow-sm bg-gray-100 min-h-[400px]">
              <iframe
                title="Ubicación de CALUATNAILS en Barcelona"
                src="https://maps.google.com/maps?q=Carrer+del+Rossell%C3%B3+497,+08025+Barcelona&t=&z=16&ie=UTF8&iwloc=&output=embed"
                width="100%"
                height="100%"
                style={{ minHeight: "400px", border: 0 }}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
              />
            </div>

            {/* Info de transporte */}
            <div className="lg:col-span-2 space-y-4">
              {/* Metro */}
              <div className="bg-white p-5 rounded-2xl border border-gray-100">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center shrink-0">
                    <i className="ri-train-line text-2xl text-red-500"></i>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900 text-sm mb-2">Metro</h3>
                    <div className="space-y-1 text-xs text-gray-600">
                      <p className="flex items-center gap-2">
                        <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-purple-600 text-white font-bold text-[10px]">L2</span>
                        <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-600 text-white font-bold text-[10px]">L5</span>
                        <span><strong>Sagrada Família</strong> · 5 min andando</span>
                      </p>
                      <p className="flex items-center gap-2">
                        <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-yellow-500 text-white font-bold text-[10px]">L4</span>
                        <span><strong>Verdaguer</strong> · 10 min andando</span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bus */}
              <div className="bg-white p-5 rounded-2xl border border-gray-100">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center shrink-0">
                    <i className="ri-bus-line text-2xl text-amber-500"></i>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900 text-sm mb-2">Autobús</h3>
                    <div className="flex flex-wrap gap-1.5">
                      {["19", "33", "34", "50", "51", "92", "H10", "V19"].map(l => (
                        <span key={l} className="px-2 py-0.5 bg-gray-100 rounded-full text-[11px] font-bold text-gray-700">
                          {l}
                        </span>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500 mt-2">Parada Rosselló-Cartagena a 1 min.</p>
                  </div>
                </div>
              </div>

              {/* Bici / Bicing */}
              <div className="bg-white p-5 rounded-2xl border border-gray-100">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center shrink-0">
                    <i className="ri-bike-line text-2xl text-emerald-500"></i>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900 text-sm mb-2">Bicing / Bici</h3>
                    <p className="text-xs text-gray-600">
                      Estación Bicing a 50 m. Carril bici en Carrer de Cartagena y Av. Gaudí.
                    </p>
                  </div>
                </div>
              </div>

              {/* Coche / Parking */}
              <div className="bg-white p-5 rounded-2xl border border-gray-100">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center shrink-0">
                    <i className="ri-car-line text-2xl text-blue-500"></i>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900 text-sm mb-2">En coche</h3>
                    <p className="text-xs text-gray-600">
                      Zona azul/verde en la calle. Parking público SABA Sagrada Família a 3 min andando.
                    </p>
                  </div>
                </div>
              </div>

              {/* CTA Indicaciones */}
              <a
                href="https://www.google.com/maps/dir/?api=1&destination=Carrer+del+Rossell%C3%B3+497,+08025+Barcelona"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 bg-gray-900 text-white px-6 py-4 rounded-2xl font-bold text-sm hover:bg-rose-500 transition-all"
              >
                <MapPin className="w-4 h-4" /> Cómo llegar con Google Maps
              </a>
            </div>
          </div>
        </section>

        {/* ═══ 13. FAQ ═══ */}
        <section className="max-w-4xl mx-auto px-6 mb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-black text-gray-900 mb-4">
              Preguntas frecuentes sobre {service.name.toLowerCase()} en Barcelona
            </h2>
            <p className="text-gray-500">Todo lo que necesitas saber antes de reservar tu cita en el Eixample.</p>
          </div>
          <div className="space-y-3">
            {serviceData.faqs.map((f, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)} className="w-full flex items-center justify-between p-5 text-left cursor-pointer hover:bg-gray-50 transition-colors">
                  <span className="font-semibold text-gray-900 pr-4">{f.q}</span>
                  <i className={`ri-${openFaq === i ? "subtract" : "add"}-line text-rose-500 text-xl shrink-0`}></i>
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-5 border-t border-gray-50">
                    <p className="text-gray-600 leading-relaxed pt-4">{f.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* ═══ 13. OTROS SERVICIOS RELACIONADOS ═══ */}
        <section className="bg-gray-50 py-20 mb-20">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-12">
              <p className="text-xs font-bold text-rose-500 uppercase tracking-widest mb-3">Otros servicios</p>
              <h2 className="text-3xl lg:text-4xl font-black text-gray-900 mb-4">
                Servicios que también te pueden interesar
              </h2>
              <p className="text-gray-500">Explora otras opciones de manicura y pedicura disponibles en CALUATNAILS.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {(RELATED_SERVICES[serviceData.serviceKey] || RELATED_SERVICES.fallback).map(r => (
                <a
                  key={r.slug}
                  href={`/servicios/${r.slug}`}
                  className="group bg-white p-7 rounded-3xl border border-gray-100 hover:border-rose-200 hover:shadow-lg transition-all"
                >
                  <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-rose-500 transition-colors">{r.name}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed mb-4">{r.desc}</p>
                  <span className="inline-flex items-center gap-1 text-rose-500 text-sm font-bold">
                    Ver servicio <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </span>
                </a>
              ))}
            </div>
            <div className="text-center mt-10">
              <a href="/servicios" className="inline-flex items-center gap-2 text-sm font-bold text-gray-700 hover:text-rose-500 transition-colors">
                Ver catálogo completo de servicios <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </div>
        </section>

        {/* ═══ 14. BLOG RELACIONADO ═══ */}
        <section className="max-w-7xl mx-auto px-6 mb-20">
          <div className="text-center mb-12">
            <p className="text-xs font-bold text-rose-500 uppercase tracking-widest mb-3">Sigue aprendiendo</p>
            <h2 className="text-3xl lg:text-4xl font-black text-gray-900 mb-4">
              Consejos sobre {service.name.toLowerCase()} en nuestro blog
            </h2>
            <p className="text-gray-500">Guías y tendencias profesionales del equipo CALUATNAILS.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {(RELATED_BLOG[serviceData.serviceKey] || RELATED_BLOG.fallback).map(b => (
              <a
                key={b.slug}
                href={`/blog/${b.slug}`}
                className="group bg-white p-6 rounded-2xl border border-gray-100 hover:border-rose-200 hover:shadow-md transition-all flex flex-col"
              >
                <div className="text-2xl mb-3">📖</div>
                <h3 className="text-base font-bold text-gray-900 mb-3 leading-snug group-hover:text-rose-500 transition-colors">{b.title}</h3>
                <span className="mt-auto text-xs text-rose-500 font-bold inline-flex items-center gap-1">
                  Leer artículo <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                </span>
              </a>
            ))}
          </div>
        </section>

        {/* ═══ 15. CTA FINAL ═══ */}
        <section className="max-w-7xl mx-auto px-6 mb-12">
          <div className="bg-gray-900 rounded-[3rem] p-12 lg:p-20 text-center relative overflow-hidden">
            <div className="relative z-10">
              <Heart className="w-10 h-10 text-rose-400 mx-auto mb-6" />
              <h2 className="text-4xl lg:text-5xl font-black text-white mb-6">
                ¿Lista para lucir unas manos perfectas?
              </h2>
              <p className="text-gray-400 text-lg mb-10 max-w-2xl mx-auto">
                Reserva tu cita de {service.name.toLowerCase()} en menos de 1 minuto. Confirmación inmediata por WhatsApp.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button onClick={() => navigate("/reservar")} className="bg-rose-500 hover:bg-rose-600 text-white px-10 py-5 rounded-full font-bold text-lg transition-all shadow-xl shadow-rose-900/20">
                  Reservar mi cita
                </button>
                <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="bg-white/10 hover:bg-white/20 backdrop-blur border border-white/20 text-white px-10 py-5 rounded-full font-bold text-lg transition-all flex items-center justify-center gap-2">
                  <MessageCircle className="w-5 h-5" /> Hablar por WhatsApp
                </a>
              </div>
              <div className="mt-10 flex flex-wrap items-center justify-center gap-6 text-sm text-gray-400">
                <span className="flex items-center gap-2"><MapPin className="w-4 h-4" /> Carrer del Rosselló 497, Eixample</span>
                <span className="flex items-center gap-2"><Clock className="w-4 h-4" /> L-V 9:00 — 19:00</span>
              </div>
            </div>
            <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-rose-500/10 rounded-full blur-3xl -ml-32 -mb-32"></div>
          </div>
        </section>
      </main>

      <footer className="py-10 border-t border-gray-100 text-center">
        <div className="font-playfair text-xl font-bold tracking-widest text-gray-900 mb-2">
          <img src="/assets/caluatnails-logo.png" alt="Caluatnails" className="h-8 md:h-10 w-auto object-contain" />
        </div>
        <p className="text-xs text-gray-400">© {new Date().getFullYear()} CALUATNAILS Barcelona. Todos los derechos reservados.</p>
      </footer>
    </div>
  );
}
