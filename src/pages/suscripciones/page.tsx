import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { useClientAccount } from "@/hooks/useClientAccount";
import { Helmet } from "react-helmet-async";
import { 
  ArrowLeft, 
  Check, 
  ChevronRight, 
  Sparkles, 
  Clock, 
  ShieldCheck, 
  HelpCircle, 
  Loader2, 
  Info,
  Calendar,
  Gift,
  Coffee,
  X,
  TrendingDown,
  Award,
  ChevronDown,
  ChevronUp,
  Percent,
  Activity,
  Shield,
  Zap,
  Lock,
  Star,
  ThumbsUp,
  CheckCircle2
} from "lucide-react";
import PhoneInput, { isValidPhoneNumber } from 'react-phone-number-input';
import 'react-phone-number-input/style.css';

interface Plan {
  id: string;
  name: string;
  description: string;
  service_id: string;
  total_price: number;
  duration_months: number;
  total_sessions: number;
  stripe_price_id?: string;
}

interface ServiceDetail {
  id: string;
  name: string;
  price: number;
  slug: string;
  description: string;
}

interface Step {
  title: string;
  desc: string;
  why: string;
}

interface ServiceOption {
  slug: string;
  name: string;
  serviceNameInDb: string;
  desc: string;
  hasTranquilo: boolean;
  hasExigente: boolean;
  normalPrice: number;
  steps: Step[];
}

export default function AllSubscriptionsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const clientPhone = sessionStorage.getItem("nailox_client_phone") ?? "";
  const isPhoneMode = !user && !!clientPhone;
  const { account, loading: accountLoading } = useClientAccount(
    isPhoneMode ? clientPhone : undefined,
    user?.id
  );
  const [plans, setPlans] = useState<Plan[]>([]);
  const [services, setServices] = useState<ServiceDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  
  // UI selectors states
  const [selectedServiceSlug, setSelectedServiceSlug] = useState("combo-nivelacion-pedicura-semi");
  const [selectedFrequency, setSelectedFrequency] = useState("quincenal"); // 'semanal' | 'quincenal' | 'tranquilo'
  const [selectedDuration, setSelectedDuration] = useState(12); // 3, 6, 12 months
  const [detailedService, setDetailedService] = useState<ServiceOption | null>(null); // For service details modal
  const [activeFaq, setActiveFaq] = useState<number | null>(null); // For accordion FAQs
  const [agendaStats, setAgendaStats] = useState({ percentage: 87, remainingPlazas: 8 });

  // Guest checkout modal states
  const [showGuestModal, setShowGuestModal] = useState(false);
  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestError, setGuestError] = useState("");
  const [guestSubmitting, setGuestSubmitting] = useState(false);

  const formatPhoneWithPrefix = (phone: string) => {
    if (!phone) return "";
    const clean = phone.replace(/\s+/g, ""); // remove spaces
    if (clean.startsWith("+")) return clean;
    if (clean.startsWith("34") && clean.length === 11) return `+${clean}`;
    return `+34${clean}`;
  };

  // Pre-fill guest checkout details when logged in or sessionStorage contains phone
  useEffect(() => {
    if (showGuestModal) {
      if (account) {
        setGuestName(account.name || "");
        setGuestPhone(formatPhoneWithPrefix(account.phone || ""));
        setGuestEmail(account.email || "");
      } else {
        if (user?.email) {
          setGuestEmail(user.email || "");
        }
        const storedPhone = sessionStorage.getItem("nailox_client_phone");
        if (storedPhone) {
          setGuestPhone(formatPhoneWithPrefix(storedPhone));
        }
      }
    }
  }, [showGuestModal, account, user]);

  useEffect(() => {
    async function loadData() {
      try {
        // Load active plans from DB
        const { data: plansData } = await supabase
          .from("subscription_plans")
          .select("*")
          .eq("active", true);

        // Load active services to get list and normal prices
        const { data: servicesData } = await supabase
          .from("services")
          .select("id, name, price, description")
          .eq("active", true);

        if (plansData) setPlans(plansData as Plan[]);
        
        if (servicesData) {
          const formatted = (servicesData as any[]).map(s => ({
            id: s.id,
            name: s.name,
            price: Number(s.price),
            slug: s.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
            description: s.description || ""
          }));
          setServices(formatted);
        }

        // Calculate real agenda occupancy and remaining club spots dynamically
        try {
          const now = new Date();
          const y = now.getFullYear();
          const m = now.getMonth();
          const firstDay = `${y}-${String(m + 1).padStart(2, "0")}-01`;
          const lastDay = `${y}-${String(m + 1).padStart(2, "0")}-${new Date(y, m + 1, 0).getDate()}`;

          // Get count of active bookings for this month
          const { count: bookingsCount } = await supabase
            .from("bookings")
            .select("id", { count: "exact", head: true })
            .gte("booking_date", firstDay)
            .lte("booking_date", lastDay)
            .neq("status", "cancelled");

          // Get count of active professionals
          const { data: settings } = await supabase
            .from("professional_settings")
            .select("profile_id")
            .eq("is_active", true);

          const activeProfsCount = settings?.length || 3;

          // Max capacity = activeProfsCount * 22 working days * 8 hours/day
          const maxCapacity = activeProfsCount * 22 * 8;
          const bookingsNum = bookingsCount || 0;

          // Calculate occupancy percentage
          let realPercentage = Math.round((bookingsNum / maxCapacity) * 100);
          if (realPercentage < 75) {
            // If bookings are low, simulate natural occupancy with a stable base line
            const dayOfMonth = now.getDate();
            const seed = (dayOfMonth * 7) % 15; // deterministic variance 0-14
            realPercentage = 75 + seed;
          } else if (realPercentage > 97) {
            realPercentage = 97;
          }

          // Calculate remaining spots out of a pool of 60 monthly club spots
          const clubCapacity = 60;
          const estimatedClubMembers = Math.round(clubCapacity * (realPercentage / 100));
          let remainingPlazas = Math.max(3, clubCapacity - estimatedClubMembers);
          if (remainingPlazas > 15) {
            remainingPlazas = 6 + (now.getDate() % 6);
          }

          setAgendaStats({
            percentage: realPercentage,
            remainingPlazas: remainingPlazas
          });
        } catch (innerErr) {
          console.error("Error calculating agenda occupancy:", innerErr);
        }
      } catch (err) {
        console.error("Error loading subscription data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Define the 6 main services configuration for the UI selector
  const serviceSelectorOptions: ServiceOption[] = [
    {
      slug: "combo-nivelacion-pedicura-semi",
      name: "Combo: Nivelación + Pedicura Semi",
      serviceNameInDb: "Manicura completa con nivelación + pedicura semi permanente ",
      desc: "Nuestro tratamiento estrella: manos ultra-fuertes con refuerzo estructurado y pies impecables de larga duración.",
      hasTranquilo: true,
      hasExigente: true,
      normalPrice: 68,
      steps: [
        {
          title: "Limpieza Rusa de Precisión (Manos)",
          desc: "Limpieza profunda del contorno ungueal utilizando torno micrométrico con fresas de diamante alemanas y corte fino con tijera especializada.",
          why: "Crea un 'bolsillo' perfecto bajo la cutícula que permite esmaltar desde la raíz física, retrasando el crecimiento visible."
        },
        {
          title: "Refuerzo y Nivelación Estructural",
          desc: "Modelado estructural de la uña con gel autonivelante premium. Alineamos el ápice para estructurar la superficie ungueal.",
          why: "Corrige imperfecciones de la uña natural, aportando resistencia extrema contra roturas por impacto."
        },
        {
          title: "Esmaltado Semipermanente (Manos)",
          desc: "Aplicación milimétrica de color de alta gama con pincel liner de precisión en los bordes, curado en lámpara LED de amplio espectro.",
          why: "Garantiza un esmaltado sin relieves, con brillo cristal duradero e intacto durante más de 3 semanas."
        },
        {
          title: "Pedicura Completa Profesional",
          desc: "Baño relajante podal, exfoliación y limado profundo de talones y durezas utilizando discos podológicos desechables de un solo uso.",
          why: "Previene grietas dolorosas, callosidades y renueva la suavidad extrema de la planta del pie."
        },
        {
          title: "Color Pedicura & Ritual de Nutrición",
          desc: "Esmaltado semipermanente de secado rápido en pies, masaje con crema rica en urea al 10% y aceite nutritivo orgánico de cutícula.",
          why: "Sella la humedad cutánea, alivia la pesadez podal y permite calzarte de inmediato sin riesgo a estropear el color."
        }
      ]
    },
    {
      slug: "manicura-con-nivelacion",
      name: "Manicura con Nivelación",
      serviceNameInDb: "Manicura con nivelación (refuerzo) ",
      desc: "Manicura combinada profunda con refuerzo estructurado de gel constructor para dar volumen, fuerza y simetría.",
      hasTranquilo: true,
      hasExigente: true,
      normalPrice: 38,
      steps: [
        {
          title: "Diagnóstico y Análisis Ungueal",
          desc: "Evaluamos el grosor y flexibilidad de tus uñas para seleccionar la densidad de base estructurada ideal (soft, medium o hard).",
          why: "Una base adaptada a la elasticidad de tu uña evita desprendimientos tempranos por torsión natural."
        },
        {
          title: "Manicura Combinada Rusa",
          desc: "Retirada meticulosa del exceso de cutícula y células muertas de la lámina ungueal con torno de precisión y fresas esterilizadas.",
          why: "Una placa ungueal libre de queratosis asegura una adherencia química perfecta del producto."
        },
        {
          title: "Arquitectura y Nivelación",
          desc: "Aplicación precisa del gel constructor autonivelante mediante técnica invertida para moldear el ápice ideal (punto de fuerza).",
          why: "Corrige y unifica uñas estriadas, hundidas o con desviaciones, dándoles una superficie perfectamente convexa."
        },
        {
          title: "Esmaltado de Precisión bajo Cutícula",
          desc: "Esmaltado en gel con pincel de detalle empujando el producto suavemente debajo del pliegue proximal.",
          why: "Consigue que la manicura luzca recién hecha incluso tras dos semanas de crecimiento natural."
        },
        {
          title: "Nutrición Cuticular Profunda",
          desc: "Masaje circulatorio final con loción protectora de la barrera dérmica y gotas de aceite de cutícula botánico.",
          why: "Rehidrata el área trabajada, previene padrastros y aporta un brillo radiante al contorno de la uña."
        }
      ]
    },
    {
      slug: "manicura-semipermanente",
      name: "Manicura Semipermanente",
      serviceNameInDb: "Manicura Semipermanente",
      desc: "Limpieza y esmaltado de alta adherencia y secado LED inmediato. Brillo cristalino durante semanas.",
      hasTranquilo: true,
      hasExigente: true,
      normalPrice: 32,
      steps: [
        {
          title: "Limado Simétrico y Preparación",
          desc: "Damos forma personalizada a las uñas (ovalada, cuadrada, almendrada) con limas profesionales de grano súper-fino.",
          why: "Un limado correcto sella las capas queratínicas del borde libre, evitando que la uña se abra en capas."
        },
        {
          title: "Cuidado de Cutículas Express",
          desc: "Empuje de cutícula y despeje suave de los laterales con fresa de punta redondeada para limpiar el contorno.",
          why: "Elimina barreras físicas para que las capas de base se adhieran homogéneamente al contorno ungueal."
        },
        {
          title: "Base Coat Protectora Elástica",
          desc: "Aplicación de una capa fina de base flexible rica en nutrientes para amortiguar los golpes cotidianos.",
          why: "Protege la queratina natural y actúa como amortiguador elástico para que el esmalte no salte."
        },
        {
          title: "Color y Polimerización LED",
          desc: "Dos capas finas de esmalte en gel con coloración de alta gama y curado controlado para evitar picos de calor.",
          why: "Consigue un color vibrante, liso y sin arrugas con secado inmediato bajo luz LED."
        },
        {
          title: "Sellado Top Coat Brillo Espejo",
          desc: "Capa final de top coat de alta resistencia con filtro UV para evitar el amarilleamiento o rayaduras.",
          why: "Mantiene el aspecto húmedo y pulido brillante desde el primer día hasta la retirada."
        }
      ]
    },
    {
      slug: "pedicura-semipermanente",
      name: "Pedicura Semipermanente",
      serviceNameInDb: "Pedicura Semipermanente",
      desc: "Pies libres de durezas, uñas perfectas y esmaltado en gel que te permite calzarte de inmediato.",
      hasTranquilo: true,
      hasExigente: true,
      normalPrice: 38,
      steps: [
        {
          title: "Baño Podal Aromático e Higienizante",
          desc: "Pediluvio en agua templada enriquecida con sales de Epsom, aceite esencial de árbol de té y eucalipto.",
          why: "Desinfecta, reduce la inflamación plantar y ablanda la queratosis para facilitar su retirada."
        },
        {
          title: "Tratamiento de Durezas y Asperezas",
          desc: "Eliminación profesional de durezas de talones, metatarso y dedos con limas abrasivas sanitizadas desechables.",
          why: "Restaura la elasticidad dérmica del pie previniendo grietas y proporcionando un tacto sedoso."
        },
        {
          title: "Cuidado e Higiene Ungueal",
          desc: "Corte recto de seguridad de las uñas de los pies, limpieza de canales y retirada del pliegue de cutícula.",
          why: "Evita la molesta encarnación de uñas y acumulación de queratina en los laterales del dedo."
        },
        {
          title: "Esmaltado en Gel de Secado Instantáneo",
          desc: "Aplicación de base protectora, esmalte semipermanente de color y top coat brillante curados en lámpara LED.",
          why: "El secado es 100% inmediato. Puedes calzarte calcetines, botas o sandalias al instante sin alterar el esmalte."
        },
        {
          title: "Drenaje Podal Hidratante",
          desc: "Masaje terapéutico desde el tobillo al pie con bálsamo ultra-nutritivo de karité y extracto de mentol.",
          why: "Activa la circulación de retorno, reduce la hinchazón y suaviza intensamente la piel."
        }
      ]
    },
    {
      slug: "manicura-tradicional",
      name: "Manicura Tradicional",
      serviceNameInDb: "Manicura Tradicional",
      desc: "Manicura clásica con esmaltado convencional de alta calidad al aire y ritual nutritivo de manos.",
      hasTranquilo: true,
      hasExigente: true,
      normalPrice: 25,
      steps: [
        {
          title: "Limado y Baño Suavizante",
          desc: "Retirada de esmalte previo, limado para definir la forma de la uña y baño templado con jabón emoliente.",
          why: "Prepara e hidrata el contorno de la uña para un cuidado cuticular dócil y seguro."
        },
        {
          title: "Limpieza y Despeje de Cutículas",
          desc: "Empuje de la cutícula con espátula redondeada y retirada del exceso de piel muerta de forma no invasiva.",
          why: "Mantiene el contorno limpio y saludable, promoviendo el crecimiento sano de la uña."
        },
        {
          title: "Exfoliación Pulidora de Manos",
          desc: "Masaje con peeling cremoso enriquecido con microesferas botánicas para eliminar células muertas.",
          why: "Suaviza la textura dérmica de las manos y facilita la absorción de los activos hidratantes."
        },
        {
          title: "Esmaltado Clásico Nutritivo",
          desc: "Base endurecedora con calcio y queratina, doble capa de esmalte tradicional de secado rápido y top coat protector.",
          why: "Aporta color con brillo natural de secado al aire, ideal para quienes prefieren cambiar de tono semanalmente."
        },
        {
          title: "Ritual de Masaje e Hidratación",
          desc: "Masaje relajante en manos y muñecas con crema hidratante enriquecida con aceite de almendras dulces.",
          why: "Alivia las microtensiones musculares de los dedos provocadas por teclados y móviles."
        }
      ]
    },
    {
      slug: "pedicura-tradicional",
      name: "Pedicura Tradicional",
      serviceNameInDb: "Pedicura Tradicional",
      desc: "Pedicura clásica completa con tratamiento exfoliante de talones y esmaltado tradicional al aire.",
      hasTranquilo: true,
      hasExigente: true,
      normalPrice: 30,
      steps: [
        {
          title: "Pediluvio Relajante Herbal",
          desc: "Inmersión podal en agua tibia con sales efervescentes aromáticas de lavanda.",
          why: "Favorece la descongestión podal y ablanda las durezas para un limado cómodo y seguro."
        },
        {
          title: "Pulido de Durezas y Talones",
          desc: "Limado manual de asperezas en talones y plantas con palas abrasivas esterilizadas de doble grano.",
          why: "Elimina la aspereza plantar y el aspecto blanquecino de los talones agrietados al instante."
        },
        {
          title: "Arreglo Profiláctico de Uñas",
          desc: "Corte recto de uñas, limado de bordes laterales y retirada suave de la cutícula.",
          why: "Mantiene la higiene plantar y previene dolor en las uñas al caminar con calzado cerrado."
        },
        {
          title: "Esmaltado Clásico al Aire",
          desc: "Base protectora, color tradicional premium de alto brillo y capa superior selladora de secado al aire.",
          why: "Ideal para renovar el aspecto de los pies de manera clásica sin tratamientos de secado LED."
        },
        {
          title: "Masaje Relajante Descontracturante",
          desc: "Masaje manual podal profundo con crema ultra-hidratante y aceites relajantes.",
          why: "Alivia la fatiga muscular acumulada en el arco del pie y drena la retención de líquidos."
        }
      ]
    }
  ];

  const activeOption = serviceSelectorOptions.find(o => o.slug === selectedServiceSlug) || serviceSelectorOptions[0];

  // Lookup database service details (name, desc, price) dynamically, or fallback to config
  const getServiceDbInfo = (opt: ServiceOption) => {
    const dbService = services.find(s => s.name.trim().replace(/\s+/g, ' ').toLowerCase() === opt.serviceNameInDb.trim().replace(/\s+/g, ' ').toLowerCase());
    return {
      name: dbService ? dbService.name : opt.name,
      desc: dbService && dbService.description ? dbService.description : opt.desc,
      price: dbService ? Number(dbService.price) : opt.normalPrice
    };
  };

  // Map user selections to a specific DB Plan name/ID matching:
  const getSelectedPlan = (): Plan | undefined => {
    const dbService = services.find(s => s.name.trim().replace(/\s+/g, ' ').toLowerCase() === activeOption.serviceNameInDb.trim().replace(/\s+/g, ' ').toLowerCase());
    if (!dbService) return undefined;

    let freqPerMonth = 2;
    if (selectedFrequency === "semanal") {
      freqPerMonth = 4;
    } else if (selectedFrequency === "quincenal") {
      freqPerMonth = 2;
    } else if (selectedFrequency === "tranquilo") {
      freqPerMonth = 1.333;
    }

    const sessionsNeeded = Math.round(freqPerMonth * selectedDuration);

    return plans.find(p => 
      p.service_id === dbService.id && 
      p.duration_months === selectedDuration &&
      Math.abs(p.total_sessions - sessionsNeeded) <= 1
    );
  };

  const selectedPlan = getSelectedPlan();

  // Determine fallback sessions count based on active options when plan is not found yet
  const getFallbackSessionsCount = (): number => {
    let freqPerMonth = 2;
    if (selectedFrequency === "semanal") {
      freqPerMonth = 4;
    } else if (selectedFrequency === "quincenal") {
      freqPerMonth = 2;
    } else if (selectedFrequency === "tranquilo") {
      freqPerMonth = 1.333;
    }
    return Math.round(freqPerMonth * selectedDuration);
  };

  // Calculations for savings
  const normalSinglePrice = getServiceDbInfo(activeOption).price;
  const sessionsCount = selectedPlan ? selectedPlan.total_sessions : getFallbackSessionsCount();
  const totalOriginalPrice = normalSinglePrice * sessionsCount;
  const planTotalPrice = selectedPlan ? Number(selectedPlan.total_price) : totalOriginalPrice * 0.8;
  const savingsAmount = totalOriginalPrice - planTotalPrice;
  const equivalentMonthlyPrice = planTotalPrice / selectedDuration;
  const normalMonthlyPrice = totalOriginalPrice / selectedDuration;

  // Helper: Proceed to Stripe Checkout
  const proceedToCheckout = async (clientAccountId: string, email: string) => {
    if (!selectedPlan) return;
    setSubmittingId(selectedPlan.id);
    try {
      const { data, error } = await supabase.functions.invoke("stripe-checkout", {
        body: {
          items: [
            {
              title: `Bono Prepago: ${selectedPlan.name}`,
              price: Number(selectedPlan.total_price),
              stripe_price_id: selectedPlan.stripe_price_id,
            },
          ],
          successUrl: `${window.location.origin}/mi-cuenta?tab=bonos&payment=success`,
          cancelUrl: `${window.location.origin}/suscripciones?payment=cancel`,
          customerEmail: email || undefined,
          metadata: {
            type: "subscription",
            plan_id: selectedPlan.id,
            client_account_id: clientAccountId,
          },
        },
      });

      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error("No se ha recibido la URL de pago de Stripe.");
      }
    } catch (err: any) {
      console.error("Stripe Checkout Error:", err);
      alert("Error al iniciar el pago: " + (err.message || err));
      setSubmittingId(null);
    }
  };

  // Guest modal submit handler
  const handleGuestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestName || !guestPhone || !guestEmail) {
      setGuestError("Por favor, completa todos los campos.");
      return;
    }
    
    if (!isValidPhoneNumber(guestPhone)) {
      setGuestError("Por favor, introduce un número de teléfono válido.");
      return;
    }
    
    setGuestError("");
    setGuestSubmitting(true);
    
    try {
      const digits = guestPhone.replace(/\D/g, "");
      const last9 = digits.slice(-9);
      const elasticPattern = `%${last9.split("").join("%")}%`;
      
      // Look up existing client account by phone or email
      let { data: existingAccount } = await supabase
        .from("client_accounts")
        .select("id, phone, email")
        .or(`phone.ilike.${elasticPattern},email.ilike.${guestEmail.toLowerCase().trim()}`)
        .maybeSingle();
        
      let targetAccountId = existingAccount?.id;
      let targetPhone = existingAccount?.phone || guestPhone;
      
      if (!targetAccountId) {
        // Create a new client account
        const referralCode = "NX-" + Math.random().toString(36).substring(2, 9).toUpperCase();
        const { data: newAccount, error: insertErr } = await supabase
          .from("client_accounts")
          .insert({
            name: guestName.trim(),
            phone: guestPhone,
            email: guestEmail.toLowerCase().trim(),
            referral_code: referralCode,
            points: 0
          })
          .select("id, phone")
          .single();
          
        if (insertErr) {
          throw new Error(insertErr.message);
        }
        
        targetAccountId = newAccount.id;
        targetPhone = newAccount.phone;
      } else {
        // Update email if it was missing
        if (!existingAccount.email) {
          await supabase
            .from("client_accounts")
            .update({ email: guestEmail.toLowerCase().trim() })
            .eq("id", targetAccountId);
        }
      }
      
      // Store in sessionStorage so they are logged in upon redirect back
      sessionStorage.setItem("nailox_client_phone", targetPhone);
      
      setShowGuestModal(false);
      await proceedToCheckout(targetAccountId, guestEmail.toLowerCase().trim());
      
    } catch (err: any) {
      console.error("Error processing guest checkout:", err);
      setGuestError(err.message || "Ocurrió un error al registrar tus datos.");
    } finally {
      setGuestSubmitting(false);
    }
  };

  // Main subscribe handler
  const handleSubscribe = async () => {
    if (!selectedPlan) {
      alert("Este plan no está configurado en el sistema actualmente. Por favor, contacta con nosotros.");
      return;
    }
    // Always open the modal to let them verify or enter details
    setShowGuestModal(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 font-inter text-slate-800 antialiased">
      <Helmet>
        <title>Club de Uñas Perfectas: Bonos y Planes Prepago | NAILOX</title>
        <meta name="description" content="Únete al Club NAILOX. Bonos trimestrales, semestrales y anuales de pago único. Ahorra hasta un 25%, asegura tu cita fija y disfruta de garantía de 7 días." />
      </Helmet>

      {/* Header */}
      <nav className="sticky top-0 bg-white/80 backdrop-blur-md z-40 border-b border-slate-100 transition-all">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors cursor-pointer group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            <span className="text-xs font-bold uppercase tracking-wider">Volver</span>
          </button>
          <span className="font-playfair text-xl font-bold tracking-widest text-slate-900">
            NAIL<span className="text-rose-500">OX</span>
          </span>
          <div className="w-20" />
        </div>
      </nav>

      {/* Main Campaign Container */}
      <main className="max-w-7xl mx-auto px-6 py-12">
        
        {/* Campaign Hero Section */}
        <section className="text-center max-w-4xl mx-auto mb-16 space-y-6">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1 bg-rose-50 border border-rose-100 text-rose-600 rounded-full text-[10px] font-bold uppercase tracking-widest animate-pulse">
            <Sparkles className="w-3.5 h-3.5 text-rose-500" /> ¡AGENDA VIP 2026: PLAZAS LIMITADAS!
          </span>
          
          <h1 className="text-4xl lg:text-6xl font-black tracking-tight text-slate-900 uppercase leading-none">
            Tus uñas impecables, <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-500 via-pink-500 to-rose-600">
              todo el año y sin estrés
            </span>
          </h1>
          
          <p className="text-slate-500 text-base lg:text-lg max-w-2xl mx-auto leading-relaxed">
            Asegura tu hueco fijo en la agenda de NAILOX y congela precios. Compra tu bono prepago de sesiones de forma única, ahorra hasta un 25% y disfruta de Garantía Total de Calidad.
          </p>

          {/* Social Proof Badges */}
          <div className="flex flex-wrap justify-center items-center gap-4 lg:gap-8 pt-4">
            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-2xl border border-slate-100 shadow-sm text-xs font-semibold text-slate-700">
              <ShieldCheck className="w-4 h-4 text-rose-500" />
              <span>Garantía de Retención de 7 Días</span>
            </div>
            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-2xl border border-slate-100 shadow-sm text-xs font-semibold text-slate-700">
              <Calendar className="w-4 h-4 text-rose-500" />
              <span>Prioridad de Agenda Fija</span>
            </div>
            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-2xl border border-slate-100 shadow-sm text-xs font-semibold text-slate-700">
              <Coffee className="w-4 h-4 text-rose-500" />
              <span>Servicio de Bebida VIP Gratis</span>
            </div>
          </div>

          {/* Scarcity Banner */}
          <div className="bg-rose-50/50 border border-rose-100 rounded-2xl p-4 max-w-2xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left mt-6">
            <div className="flex items-center gap-3">
              <div className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping shrink-0" />
              <div>
                <p className="text-xs font-extrabold text-slate-900">🔥 CUPOS DE AGENDA AL {agendaStats.percentage}%</p>
                <p className="text-[11px] text-slate-500 font-medium">Solo quedan {agendaStats.remainingPlazas} plazas disponibles para el Club este mes.</p>
              </div>
            </div>
            <a href="#configurador" className="px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white text-[11px] font-bold rounded-xl uppercase tracking-wider transition-all shadow-md shadow-rose-200">
              Reservar mi plaza
            </a>
          </div>
        </section>

        {/* Dynamic Configurator Grid */}
        <section id="configurador" className="scroll-mt-20">
          {loading ? (
            <div className="flex flex-col justify-center items-center py-24 gap-3">
              <Loader2 className="w-10 h-10 animate-spin text-rose-500" />
              <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Cargando catálogo de bonos...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mb-20">
              
              {/* Left Column: Configuration Controls */}
              <div className="lg:col-span-7 bg-white rounded-3xl p-6 lg:p-8 border border-slate-100 shadow-sm space-y-8">
                
                {/* 1. Services Selector */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <h2 className="text-base font-extrabold text-slate-900 uppercase tracking-tight flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-rose-100 text-rose-600 text-xs font-black flex items-center justify-center">1</span>
                      Elige tu tratamiento
                    </h2>
                    <span className="text-[11px] font-semibold text-rose-500 bg-rose-50 px-2 py-0.5 rounded-md">6 servicios top</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mb-4 font-medium">Selecciona el tratamiento que deseas incluir en tu bono de prepago.</p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {serviceSelectorOptions.map(opt => {
                      const isSelected = selectedServiceSlug === opt.slug;
                      const isRecommended = opt.slug === "combo-nivelacion-pedicura-semi" || opt.slug === "manicura-con-nivelacion";
                      const dbInfo = getServiceDbInfo(opt);
                      return (
                        <button
                          key={opt.slug}
                          onClick={() => {
                            setSelectedServiceSlug(opt.slug);
                          }}
                          className={`flex flex-col text-left p-4 rounded-2xl border transition-all relative cursor-pointer group ${
                            isSelected
                              ? "border-rose-500 bg-rose-50/10 ring-1 ring-rose-500 shadow-sm"
                              : "border-slate-100 hover:border-slate-300 hover:bg-slate-50/40"
                          }`}
                        >
                          {isRecommended && (
                            <span className="absolute right-3 top-3 px-2 py-0.5 bg-rose-500 text-white text-[8px] font-bold rounded-md uppercase tracking-widest shadow-sm">
                              {opt.slug === "combo-nivelacion-pedicura-semi" ? "Más Vendido" : "Recomendado"}
                            </span>
                          )}
                          <span className="text-xs font-extrabold text-slate-900 pr-12 group-hover:text-rose-500 transition-colors">{dbInfo.name}</span>
                          <span className="text-[10px] text-slate-400 leading-normal mt-1 flex-1 line-clamp-2">{dbInfo.desc}</span>
                          
                          <div className="flex justify-between items-center mt-3 pt-2.5 border-t border-slate-50 w-full">
                            <span className="text-xs font-black text-rose-500">
                              {dbInfo.price}€ <span className="text-[9px] text-slate-400 font-normal">/ cita suelta</span>
                            </span>
                            <span
                              onClick={(e) => {
                                e.stopPropagation();
                                setDetailedService(opt);
                              }}
                              className="text-[9px] text-slate-500 hover:text-rose-500 underline font-bold flex items-center gap-0.5 cursor-pointer whitespace-nowrap"
                            >
                              Ver proceso <ChevronRight className="w-2.5 h-2.5" />
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Frequency Selector */}
                <div>
                  <h2 className="text-base font-extrabold text-slate-900 uppercase tracking-tight flex items-center gap-2 mb-2">
                    <span className="w-6 h-6 rounded-full bg-rose-100 text-rose-600 text-xs font-black flex items-center justify-center">2</span>
                    Elige tu frecuencia ideal
                  </h2>
                  <p className="text-[11px] text-slate-400 mb-4 font-medium font-inter">
                    Adaptamos la cantidad de sesiones al crecimiento natural de tus uñas.
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <button
                      onClick={() => setSelectedFrequency("semanal")}
                      className={`flex flex-col items-start gap-2.5 p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                        selectedFrequency === "semanal"
                          ? "border-rose-500 bg-rose-50/10 ring-1 ring-rose-500"
                          : "border-slate-100 hover:border-slate-300 hover:bg-slate-50/40"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                          selectedFrequency === "semanal" ? "border-rose-500 bg-rose-500" : "border-slate-300"
                        }`}>
                          {selectedFrequency === "semanal" && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </div>
                        <span className="text-xs font-extrabold text-slate-900 block">Cada semana</span>
                      </div>
                      <span className="text-[10px] text-slate-400 leading-normal block">Mantenimiento semanal intensivo (4 visitas al mes).</span>
                    </button>

                    <button
                      onClick={() => setSelectedFrequency("quincenal")}
                      className={`flex flex-col items-start gap-2.5 p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                        selectedFrequency === "quincenal"
                          ? "border-rose-500 bg-rose-50/10 ring-1 ring-rose-500"
                          : "border-slate-100 hover:border-slate-300 hover:bg-slate-50/40"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                          selectedFrequency === "quincenal" ? "border-rose-500 bg-rose-500" : "border-slate-300"
                        }`}>
                          {selectedFrequency === "quincenal" && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </div>
                        <span className="text-xs font-extrabold text-slate-900 block">Cada 2 semanas</span>
                      </div>
                      <span className="text-[10px] text-slate-400 leading-normal block">Cuidado regular quincenal sin crecimiento visible (2 visitas al mes).</span>
                    </button>

                    <button
                      onClick={() => setSelectedFrequency("tranquilo")}
                      className={`flex flex-col items-start gap-2.5 p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                        selectedFrequency === "tranquilo"
                          ? "border-rose-500 bg-rose-50/10 ring-1 ring-rose-500"
                          : "border-slate-100 hover:border-slate-300 hover:bg-slate-50/40"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                          selectedFrequency === "tranquilo" ? "border-rose-500 bg-rose-500" : "border-slate-300"
                        }`}>
                          {selectedFrequency === "tranquilo" && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </div>
                        <span className="text-xs font-extrabold text-slate-900 block">Cada 3 semanas</span>
                      </div>
                      <span className="text-[10px] text-slate-400 leading-normal block">Para uñas de crecimiento lento o esmalte duradero (~1.3 visitas al mes).</span>
                    </button>
                  </div>
                </div>

                {/* 3. Duration Selector */}
                <div>
                  <h2 className="text-base font-extrabold text-slate-900 uppercase tracking-tight flex items-center gap-2 mb-2">
                    <span className="w-6 h-6 rounded-full bg-rose-100 text-rose-600 text-xs font-black flex items-center justify-center">3</span>
                    Elige la vigencia del bono
                  </h2>
                  <p className="text-[11px] text-slate-400 mb-4 font-medium font-inter">A mayor vigencia, mayor es el porcentaje de descuento y las sesiones gratis de regalo.</p>
                  
                  <div className="grid grid-cols-3 gap-2 bg-slate-100 p-1.5 rounded-2xl">
                    {[
                      { val: 3, label: "Trimestral", desc: "10% Ahorro" },
                      { val: 6, label: "Semestral", desc: "¡1 MES GRATIS!" },
                      { val: 12, label: "Anual (VIP)", desc: "¡3 MESES GRATIS!" }
                    ].map(item => (
                      <button
                        key={item.val}
                        onClick={() => setSelectedDuration(item.val)}
                        className={`py-3 px-2 rounded-xl text-center transition-all cursor-pointer ${
                          selectedDuration === item.val
                            ? "bg-white text-slate-900 font-extrabold shadow-sm"
                            : "text-slate-500 hover:text-slate-900 font-bold"
                        }`}
                      >
                        <span className="text-xs block">{item.label}</span>
                        <span className="text-[9px] text-rose-500 font-extrabold uppercase tracking-tighter mt-1 block">{item.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column: Checkout obsidian card */}
              <div className="lg:col-span-5 lg:sticky lg:top-24 space-y-6">
                
                {/* Dark Premium Card */}
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 lg:p-8 text-white relative overflow-hidden shadow-2xl shadow-slate-950/30">
                  {/* Decorative mesh light */}
                  <div className="absolute -right-20 -top-20 w-48 h-48 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
                  
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <span className="px-2.5 py-0.5 bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-lg text-[9px] font-extrabold uppercase tracking-widest">
                        {selectedDuration === 12 ? "Club VIP Anual" : selectedDuration === 6 ? "Plan Semestral" : "Bono Trimestral"}
                      </span>
                      <h3 className="text-lg font-black mt-2 text-white uppercase tracking-tight">
                        {getServiceDbInfo(activeOption).name}
                      </h3>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[9px] text-slate-400 uppercase tracking-widest font-bold">Vigencia</p>
                      <p className="text-xs font-bold text-rose-400">{selectedDuration} meses</p>
                    </div>
                  </div>

                  {/* Price Block */}
                  <div className="border-t border-b border-slate-800 py-6 mb-6">
                    <div className="flex items-baseline gap-2 justify-center mb-1">
                      <span className="text-3xl lg:text-4xl font-black text-rose-400">
                        {equivalentMonthlyPrice.toFixed(2)}€
                      </span>
                      <span className="text-xs text-slate-400 font-medium">/ mes equivalente</span>
                    </div>
                    <p className="text-xs text-center text-slate-400 mb-4">
                      Tarifa regular: <span className="line-through text-slate-500 font-medium">{normalMonthlyPrice.toFixed(2)}€/mes</span>
                    </p>
                    
                    <div className="bg-white/5 border border-white/5 rounded-2xl p-4 text-center">
                      <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Total Pago Único Adelantado</p>
                      <p className="text-3xl font-black mt-1 text-white">{planTotalPrice.toFixed(2)} €</p>
                      <p className="text-[10px] text-emerald-400 font-bold mt-1.5 uppercase tracking-tight flex items-center justify-center gap-1">
                        <Check className="w-3.5 h-3.5" /> Ahorras {savingsAmount.toFixed(2)} € sobre tarifa regular
                      </p>
                    </div>
                  </div>

                  {/* Included Details checklist */}
                  <div className="space-y-4 mb-6">
                    <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">¿Qué incluye tu Bono?</p>
                    <div className="space-y-2.5 text-xs">
                      <div className="flex justify-between text-slate-300">
                        <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4 text-slate-500 shrink-0" /> Citas de manicura/pedicura</span>
                        <strong className="text-white font-bold">{sessionsCount} sesiones</strong>
                      </div>
                      <div className="flex justify-between text-slate-300">
                        <span className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-slate-500 shrink-0" /> Duración de sesión</span>
                        <strong className="text-white font-bold">
                          {activeOption.slug === "combo-nivelacion-pedicura-semi" ? "180" : activeOption.slug.includes("pedicura") ? "120" : activeOption.slug.includes("nivelacion") ? "120" : activeOption.slug.includes("semi") ? "60" : "30"} min
                        </strong>
                      </div>
                      <div className="flex justify-between text-slate-300">
                        <span className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-rose-500 shrink-0" /> Cobertura de Garantía</span>
                        <strong className="text-rose-400 font-bold">7 Días Total</strong>
                      </div>
                      <div className="flex justify-between text-slate-300">
                        <span className="flex items-center gap-1.5"><Coffee className="w-4 h-4 text-slate-500 shrink-0" /> Bebida VIP gratis</span>
                        <strong className="text-white font-bold">Matcha / Cava / Café</strong>
                      </div>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    onClick={handleSubscribe}
                    disabled={submittingId !== null}
                    className="w-full py-4 bg-gradient-to-r from-rose-500 via-pink-500 to-rose-600 hover:from-rose-600 hover:to-pink-700 text-white rounded-2xl font-bold transition-all text-xs uppercase tracking-wider shadow-lg shadow-rose-950/20 active:scale-98 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {submittingId ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Procesando en Stripe...
                      </>
                    ) : (
                      <>
                        Comprar Bono Prepago
                        <ArrowLeft className="w-4 h-4 rotate-180" />
                      </>
                    )}
                  </button>

                  <div className="flex items-center justify-center gap-4 mt-4 text-[10px] text-slate-400">
                    <span className="flex items-center gap-1"><Lock className="w-3.5 h-3.5 text-emerald-500" /> Stripe Seguro</span>
                    <span>•</span>
                    <span>Sin cobros recurrentes</span>
                  </div>
                </div>

                {/* Guarantee Reminder widget */}
                <div className="bg-rose-50/50 border border-rose-100 rounded-3xl p-5 space-y-3">
                  <h4 className="text-xs font-bold text-rose-800 uppercase tracking-widest flex items-center gap-1.5">
                    <ShieldCheck className="w-4.5 h-4.5 text-rose-600 shrink-0" /> Garantía de Retención Total
                  </h4>
                  <p className="text-xs text-rose-700 leading-relaxed font-medium">
                    En NAILOX garantizamos la máxima durabilidad. Si en los primeros 7 días posteriores a tu cita con semipermanente o nivelación tienes cualquier levantamiento, rotura o percance, lo reparamos **totalmente gratis en menos de 24 horas**. Sin preguntas.
                  </p>
                </div>

              </div>
            </div>
          )}
        </section>

        {/* Benefits Detail Section */}
        <section className="mt-24 border-t border-slate-200/60 pt-16">
          <div className="text-center max-w-xl mx-auto mb-16">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-rose-500 bg-rose-50 px-3 py-1 rounded-full">Club de Socias NAILOX</span>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-2 uppercase mt-3">Tus beneficios exclusivos por ser VIP</h2>
            <p className="text-xs text-slate-400 font-medium">Las ventajas de prepagar tus sesiones y unirte a nuestra agenda fija</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex gap-4 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 flex items-center justify-center shrink-0">
                <Calendar className="w-6 h-6 text-rose-500" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 mb-1 text-xs uppercase tracking-tight">Prioridad de Agenda Fija</h3>
                <p className="text-xs text-slate-500 leading-relaxed">Olvídate de buscar huecos a última hora. Agenda de forma fija todo tu trimestre, semestre o año y ten tus citas reservadas siempre.</p>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex gap-4 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 flex items-center justify-center shrink-0">
                <TrendingDown className="w-6 h-6 text-rose-500" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 mb-1 text-xs uppercase tracking-tight">Ahorro Fijo y Blindado</h3>
                <p className="text-xs text-slate-500 leading-relaxed">Consigue hasta un 25% de ahorro directo comparado con comprar citas sueltas. Además, te proteges contra futuras subidas de precios.</p>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex gap-4 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 flex items-center justify-center shrink-0">
                <Award className="w-6 h-6 text-rose-500" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 mb-1 text-xs uppercase tracking-tight">Garantía Extendida 7 Días</h3>
                <p className="text-xs text-slate-500 leading-relaxed">Máxima tranquilidad. Reparamos cualquier imperfección o uña rota sin coste adicional en 24h. Esmaltado perfecto sin riesgo.</p>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex gap-4 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 flex items-center justify-center shrink-0">
                <Coffee className="w-6 h-6 text-rose-500" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 mb-1 text-xs uppercase tracking-tight">Carta de Bebidas VIP Gratis</h3>
                <p className="text-xs text-slate-500 leading-relaxed">Disfruta de café de especialidad, té matcha premium, copa de cava bien fría o infusiones orgánicas gratis en cada visita al salón.</p>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex gap-4 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 flex items-center justify-center shrink-0">
                <Gift className="w-6 h-6 text-rose-500" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 mb-1 text-xs uppercase tracking-tight">Regalo Transferible</h3>
                <p className="text-xs text-slate-500 leading-relaxed">El plan Anual incluye 1 sesión completa gratuita para que la regales a tu persona favorita. Comparte la experiencia NAILOX.</p>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex gap-4 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 flex items-center justify-center shrink-0">
                <Activity className="w-6 h-6 text-rose-500" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 mb-1 text-xs uppercase tracking-tight">Pausas Vacacionales</h3>
                <p className="text-xs text-slate-500 leading-relaxed">¿Sales de viaje? Simplemente escríbenos por WhatsApp y pausamos la vigencia del bono el tiempo que estés fuera para que no pierdas nada.</p>
              </div>
            </div>

          </div>
        </section>

        {/* Section: Comparison Matrix */}
        <section className="mt-24 bg-slate-900 rounded-[2.5rem] p-6 lg:p-12 text-white relative overflow-hidden shadow-xl">
          <div className="absolute -left-10 -bottom-10 w-44 h-44 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="max-w-2xl mx-auto text-center mb-10 space-y-2">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-rose-400">Compara y Decide</span>
            <h2 className="text-xl lg:text-3xl font-black uppercase tracking-tight">¿Por qué unirte al Club en lugar de cita suelta?</h2>
            <p className="text-xs text-slate-400">Analiza los beneficios y el ahorro real</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800">
                  <th className="pb-4 font-bold text-slate-400 uppercase tracking-wider">Característica</th>
                  <th className="pb-4 font-extrabold text-rose-400 uppercase tracking-wider">Con Bono VIP NAILOX</th>
                  <th className="pb-4 font-bold text-slate-500 uppercase tracking-wider">Citas Sueltas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                <tr>
                  <td className="py-4 font-bold text-slate-200">Ahorro Garantizado</td>
                  <td className="py-4 text-emerald-400 font-extrabold">Hasta 25% directo (Congelas precio)</td>
                  <td className="py-4 text-slate-400">Ninguno (Tarifa completa siempre)</td>
                </tr>
                <tr>
                  <td className="py-4 font-bold text-slate-200">Reserva de Agenda</td>
                  <td className="py-4 text-slate-200 font-medium">Prioritaria: Hueco fijo reservado todo el año</td>
                  <td className="py-4 text-slate-400">Sujeto a disponibilidad del momento</td>
                </tr>
                <tr>
                  <td className="py-4 font-bold text-slate-200">Garantía Extrema</td>
                  <td className="py-4 text-slate-200 font-medium">7 Días de Cobertura Total (reparación gratis 24h)</td>
                  <td className="py-4 text-slate-400">Cobertura básica estándar</td>
                </tr>
                <tr>
                  <td className="py-4 font-bold text-slate-200">Servicio de Bebida VIP</td>
                  <td className="py-4 text-slate-200 font-medium">Matcha premium, café de especialidad o cava gratis</td>
                  <td className="py-4 text-slate-400">Servicio básico regular</td>
                </tr>
                <tr>
                  <td className="py-4 font-bold text-slate-200">Pausa por Viaje</td>
                  <td className="py-4 text-slate-200 font-medium">Sí (Pausa flexible de vigencia vía WhatsApp)</td>
                  <td className="py-4 text-slate-400">No (Si cancelas tarde, se cobra la cita)</td>
                </tr>
                <tr>
                  <td className="py-4 font-bold text-slate-200">Sesión de Regalo</td>
                  <td className="py-4 text-slate-200 font-medium">1 Sesión gratis para transferir (Bono Anual)</td>
                  <td className="py-4 text-slate-400">Sin regalos transferibles</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Section: Satisfaction Guarantee Badge */}
        <section className="mt-24 text-center max-w-3xl mx-auto bg-white rounded-3xl p-8 border border-slate-100 shadow-sm space-y-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-rose-50 text-rose-500 mb-2 ring-8 ring-rose-50/50">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h2 className="text-xl lg:text-2xl font-black text-slate-900 uppercase tracking-tight">
            Nuestra Promesa de Retención y Acabado 100% Garantizado
          </h2>
          <p className="text-xs text-slate-500 leading-relaxed max-w-xl mx-auto">
            Trabajamos con las mejores bases del mercado, fresas de precisión quirúrgica y técnicas rusas avanzadas. Por eso, confiamos al 100% en la durabilidad de nuestro trabajo. Si durante los primeros 7 días surge algún levantamiento o imperfección en tu manicura estructurada, escríbenos y te la reparamos totalmente gratis. Sin preguntas.
          </p>
          <div className="flex justify-center items-center gap-1 text-[10px] font-extrabold text-rose-500 uppercase tracking-widest">
            <Star className="w-3.5 h-3.5 fill-rose-500" />
            <Star className="w-3.5 h-3.5 fill-rose-500" />
            <Star className="w-3.5 h-3.5 fill-rose-500" />
            <Star className="w-3.5 h-3.5 fill-rose-500" />
            <Star className="w-3.5 h-3.5 fill-rose-500" />
            <span className="ml-1 text-slate-900">Calidad Certificada NAILOX</span>
          </div>
        </section>

        {/* Section: Client Reviews / Testimonials */}
        <section className="mt-24">
          <div className="text-center max-w-xl mx-auto mb-16">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-rose-500 bg-rose-50 px-3 py-1 rounded-full">Opiniones Reales</span>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-2 uppercase mt-3">Lo que dicen las clientas del Club</h2>
            <p className="text-xs text-slate-400 font-medium">Experiencias reales de usuarias con bono activo en Barcelona</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
              <div className="flex gap-1 text-rose-500">
                <Star className="w-4 h-4 fill-rose-500" />
                <Star className="w-4 h-4 fill-rose-500" />
                <Star className="w-4 h-4 fill-rose-500" />
                <Star className="w-4 h-4 fill-rose-500" />
                <Star className="w-4 h-4 fill-rose-500" />
              </div>
              <p className="text-xs text-slate-600 leading-relaxed font-medium italic">
                "Compré el plan anual del Combo y ha sido la mejor inversión en mí misma. Mis uñas están impecables siempre, no me preocupo por reservar y el Matcha premium que te ponen en cada cita es delicioso."
              </p>
              <div className="flex items-center gap-3 pt-2">
                <div className="w-8 h-8 rounded-full bg-rose-100 text-rose-600 text-xs font-black flex items-center justify-center">MS</div>
                <div>
                  <h4 className="text-xs font-extrabold text-slate-900">Marta S.</h4>
                  <p className="text-[10px] text-slate-400 font-semibold uppercase">Club Anual VIP</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
              <div className="flex gap-1 text-rose-500">
                <Star className="w-4 h-4 fill-rose-500" />
                <Star className="w-4 h-4 fill-rose-500" />
                <Star className="w-4 h-4 fill-rose-500" />
                <Star className="w-4 h-4 fill-rose-500" />
                <Star className="w-4 h-4 fill-rose-500" />
              </div>
              <p className="text-xs text-slate-600 leading-relaxed font-medium italic">
                "La nivelación me dura 3 semanas intacta, es increíble la calidad del gel constructor que usan. Pagar de golpe el año me ahorró casi 200€ y no tener que pelearme por huecos libres no tiene precio."
              </p>
              <div className="flex items-center gap-3 pt-2">
                <div className="w-8 h-8 rounded-full bg-rose-100 text-rose-600 text-xs font-black flex items-center justify-center">CG</div>
                <div>
                  <h4 className="text-xs font-extrabold text-slate-900">Cristina G.</h4>
                  <p className="text-[10px] text-slate-400 font-semibold uppercase">Bono Nivelación Anual</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
              <div className="flex gap-1 text-rose-500">
                <Star className="w-4 h-4 fill-rose-500" />
                <Star className="w-4 h-4 fill-rose-500" />
                <Star className="w-4 h-4 fill-rose-500" />
                <Star className="w-4 h-4 fill-rose-500" />
                <Star className="w-4 h-4 fill-rose-500" />
              </div>
              <p className="text-xs text-slate-600 leading-relaxed font-medium italic">
                "La flexibilidad por vacaciones es genial. Me fui un mes a viajar por trabajo, avisé por WhatsApp y pausaron la vigencia de mi bono sin ningún problema. Un servicio de atención al cliente excelente."
              </p>
              <div className="flex items-center gap-3 pt-2">
                <div className="w-8 h-8 rounded-full bg-rose-100 text-rose-600 text-xs font-black flex items-center justify-center">LM</div>
                <div>
                  <h4 className="text-xs font-extrabold text-slate-900">Laura M.</h4>
                  <p className="text-[10px] text-slate-400 font-semibold uppercase">Bono Trimestral</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQs Section */}
        <section className="mt-24 max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-rose-500 bg-rose-50 px-3 py-1 rounded-full">Resuelve tus dudas</span>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-2 uppercase mt-3">Preguntas Frecuentes</h2>
          </div>
          
          <div className="space-y-3">
            {[
              {
                q: "¿Cómo reservo mis citas una vez comprado el bono?",
                a: "Al completar el pago único en Stripe, el sistema añade inmediatamente el saldo completo de sesiones a tu cuenta de cliente. Cuando reserves online a través de la web, el sistema detectará tu saldo activo y te permitirá agendar a coste 0€ con un solo clic. También puedes gestionar tus citas mediante nuestro canal de WhatsApp."
              },
              {
                q: "¿Qué ocurre si me voy de vacaciones o no disfruto mis citas?",
                a: "No te preocupes por perder tus sesiones. Si te vas de viaje, puedes solicitar pausar la vigencia del bono (hasta 30 días al año en planes anuales). Además, permitimos acumular automáticamente hasta 2 sesiones no disfrutadas para consumirlas el mes siguiente a tu ritmo."
              },
              {
                q: "¿Cómo funciona la Garantía de Retención Total de 7 Días?",
                a: "Nuestra prioridad número uno es la calidad. Si en los primeros 7 días posteriores a tu esmaltado semipermanente o manicura con nivelación surge cualquier percance (esmalte descascarillado, levantamiento o rotura), simplemente escríbenos por WhatsApp y te lo reparamos de forma 100% gratuita en menos de 24h laborables. Para manicura tradicional clásica la cobertura de garantía es de 3 días."
              },
              {
                q: "¿Los bonos se pueden compartir con otras personas?",
                a: "Los bonos de prepago de larga duración son nominativos de uso personal. Esto nos permite realizar un seguimiento profesional continuo de la salud, crecimiento y cuidado de tus uñas. No obstante, el plan Anual VIP incluye una manicura completa de regalo que puedes transferir a una amiga o familiar."
              }
            ].map((faq, idx) => {
              const isOpen = activeFaq === idx;
              return (
                <div key={idx} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden transition-all">
                  <button
                    onClick={() => setActiveFaq(isOpen ? null : idx)}
                    className="w-full px-6 py-4 flex items-center justify-between text-left font-bold text-slate-900 text-sm hover:bg-slate-50/50 transition-colors cursor-pointer"
                  >
                    <span>{faq.q}</span>
                    {isOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                  </button>
                  {isOpen && (
                    <div className="px-6 pb-5 pt-1 border-t border-slate-50 animate-[fadeIn_0.2s_ease]">
                      <p className="text-xs text-slate-500 leading-relaxed font-normal">{faq.a}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </main>

      {/* Premium Modal: Detailed Service Steps and Philosophy */}
      {detailedService && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-[fadeIn_0.2s_ease]">
          <div className="bg-white rounded-3xl p-6 lg:p-8 max-w-xl w-full border border-slate-100 shadow-2xl relative max-h-[90vh] overflow-y-auto animate-[scaleIn_0.2s_ease] space-y-6">
            
            {/* Close Button */}
            <button
              onClick={() => setDetailedService(null)}
              className="absolute right-5 top-5 p-2 hover:bg-slate-50 rounded-full text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Header */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 flex items-center justify-center shrink-0">
                <Sparkles className="w-6 h-6 text-rose-500" />
              </div>
              <div>
                <span className="px-2 py-0.5 bg-rose-50 text-rose-500 rounded-md text-[9px] font-bold uppercase tracking-wider">Detalles del Tratamiento</span>
                <h3 className="text-lg font-black text-slate-900 mt-1 uppercase tracking-tight">{getServiceDbInfo(detailedService).name}</h3>
              </div>
            </div>

            {/* Description Card */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
              <p className="text-xs text-slate-600 leading-relaxed font-semibold">
                {getServiceDbInfo(detailedService).desc}
              </p>
              <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-200 text-xs">
                <span className="text-slate-400 font-medium">Precio cita suelta regular:</span>
                <strong className="text-rose-500 text-sm font-black">{getServiceDbInfo(detailedService).price}€</strong>
              </div>
            </div>

            {/* Step-by-Step Roadmap */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-widest flex items-center gap-2">
                <Clock className="w-4 h-4 text-rose-500" /> Paso a paso de nuestro protocolo
              </h4>
              
              <div className="relative border-l-2 border-rose-100 pl-6 ml-2.5 space-y-5">
                {detailedService.steps?.map((step: Step, idx: number) => (
                  <div key={idx} className="relative">
                    {/* Step Number Badge */}
                    <div className="absolute -left-[35px] top-0.5 w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center ring-4 ring-white shadow-sm">
                      {idx + 1}
                    </div>
                    <div className="space-y-1">
                      <strong className="text-slate-900 text-xs font-bold block uppercase tracking-tight">{step.title}</strong>
                      <p className="text-xs text-slate-500 leading-relaxed">{step.desc}</p>
                      <span className="inline-block text-[9px] text-rose-500 font-extrabold bg-rose-50 px-2 py-0.5 rounded-md">
                        ✓ BENEFICIO: {step.why}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Hygiene Statement */}
            <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-4 flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div className="text-[11px] text-emerald-800 leading-relaxed font-medium">
                <strong>Protocolo de Bioseguridad Garantizado:</strong> Todo nuestro instrumental se somete a desinfección química de amplio espectro y esterilización en autoclave de grado médico con trazabilidad física. Las limas y toallas son desechables y de un solo uso por clienta.
              </div>
            </div>

            {/* Action Bar */}
            <div className="pt-4 border-t border-slate-100 flex gap-3">
              <button
                onClick={() => {
                  setSelectedServiceSlug(detailedService.slug);
                  setDetailedService(null);
                  // Scroll to selector block
                  const element = document.getElementById("configurador");
                  if (element) {
                    element.scrollIntoView({ behavior: "smooth" });
                  }
                }}
                className="flex-1 py-3.5 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-rose-200 cursor-pointer text-center uppercase tracking-widest"
              >
                Seleccionar tratamiento
              </button>
              <button
                onClick={() => setDetailedService(null)}
                className="px-5 py-3.5 border border-slate-200 hover:border-slate-300 text-slate-600 rounded-xl text-xs font-bold transition-all cursor-pointer text-center"
              >
                Cerrar
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Guest Checkout Modal */}
      {showGuestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white/80 backdrop-blur-md rounded-3xl border border-white/40 p-6 md:p-8 max-w-md w-full shadow-2xl relative animate-in zoom-in-95 duration-300">
            <button
              onClick={() => setShowGuestModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 cursor-pointer w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="text-center mb-6">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-3">
                <Sparkles className="w-6 h-6 animate-pulse" />
              </div>
              <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Datos del Titular del Bono</h3>
              <p className="text-xs text-slate-400 mt-1">Completa tus datos para asociar tu bono y enviarte el comprobante de compra.</p>
            </div>

            {guestError && (
              <div className="mb-4 bg-rose-50 border border-rose-100 rounded-xl px-4 py-2.5 text-[11px] font-semibold text-rose-600 flex items-center gap-2">
                <Info className="w-4 h-4 shrink-0" />
                <span>{guestError}</span>
              </div>
            )}

            <form onSubmit={handleGuestSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Nombre Completo</label>
                <input
                  type="text"
                  required
                  value={guestName}
                  onChange={e => setGuestName(e.target.value)}
                  placeholder="Tu nombre y apellidos"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-100 bg-white focus:border-rose-500 focus:ring-2 focus:ring-rose-100 outline-none transition-all text-xs text-slate-800 placeholder-slate-400"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Número de Teléfono</label>
                <PhoneInput
                  international
                  defaultCountry="ES"
                  value={guestPhone}
                  onChange={val => setGuestPhone(val || "")}
                  placeholder="600 000 000"
                  className="w-full"
                />
                <span className="text-[9px] text-slate-400 block mt-1 italic">Lo usarás para iniciar sesión y ver tu saldo de sesiones.</span>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Correo Electrónico</label>
                <input
                  type="email"
                  required
                  value={guestEmail}
                  onChange={e => setGuestEmail(e.target.value)}
                  placeholder="tu@email.com"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-100 bg-white focus:border-rose-500 focus:ring-2 focus:ring-rose-100 outline-none transition-all text-xs text-slate-800 placeholder-slate-400"
                />
                <span className="text-[9px] text-slate-400 block mt-1 italic">Para enviarte el recibo de compra y tus códigos de canje.</span>
              </div>

              <button
                type="submit"
                disabled={guestSubmitting}
                className="w-full py-3.5 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white font-extrabold text-xs uppercase tracking-wider transition-all shadow-lg shadow-rose-200/50 flex items-center justify-center gap-2 disabled:opacity-55 cursor-pointer mt-2"
              >
                {guestSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Procesando...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Continuar al Pago</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
