import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useSEO } from "@/hooks/useSEO";
import { supabase } from "@/lib/supabase";
import { DBService } from "@/lib/types";
import { useAuth } from "@/hooks/useAuth";
import { usePoints } from "@/hooks/usePoints";
import { ensureClientAccount } from "@/hooks/useClientAccount";
import ServiceCard from "./components/ServiceCard";
import ServiceFilter from "./components/ServiceFilter";
import BookingSummaryBar from "./components/BookingSummaryBar";
import CalendarPicker from "./components/CalendarPicker";
import ClientForm from "./components/ClientForm";
import PhoneInput, { isValidPhoneNumber } from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import BookingStepIndicator from "./components/BookingStepIndicator";
import PushNotificationButton from "@/components/PushNotificationButton";

function timeAddMinutes(timeStr: string, minutes: number): string {
  const [h, m] = timeStr.split(":").map(Number);
  const totalMin = h * 60 + m + minutes;
  const newH = Math.floor(totalMin / 60) % 24;
  const newM = totalMin % 60;
  return `${String(newH).padStart(2, "0")}:${String(newM).padStart(2, "0")}`;
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

const STEPS = [
  { label: "Servicios", icon: "ri-scissors-line" },
  { label: "Fecha y hora", icon: "ri-calendar-line" },
  { label: "Tus datos", icon: "ri-user-line" },
];

const SUPABASE_URL = import.meta.env.VITE_PUBLIC_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY as string;

export interface Companion {
  id: string;
  name: string;
  phone: string;
  services: DBService[];
  professionalId: string;
  professionalInfo: { name: string; address: string | null; instagram: string | null } | null;
}

export default function ReservarPage() {
  useSEO({
    title: "Reservar Cita de Manicura y Pedicura Profesional",
    description: "Reserva tu cita de manicura o pedicura con profesionales certificadas CALUATNAILS. Elige servicio, fecha y hora en minutos. Pago seguro del anticipo online.",
    ogTitle: "Reserva tu Cita — Manicura y Pedicura Profesional CALUATNAILS",
    ogDescription: "Agenda tu cita con profesionales certificadas. Selecciona el servicio, elige tu horario y paga el anticipo de forma segura. ¡Así de fácil!",
    ogImage: "https://readdy.ai/api/search-image?query=elegant%20nail%20salon%20appointment%20booking%20calendar%20professional%20manicure%20pedicure%20beauty%20spa%20rose%20gold%20warm%20tones%20luxury%20minimal%20clean%20aesthetic%20hands%20nails&width=1200&height=630&seq=og-reservar-v1&orientation=landscape",
    ogUrl: "/reservar",
    canonical: "/reservar",
    keywords: "reservar cita manicura, pedicura profesional cita, agenda nail salon, booking manicura",
  });

  const { user, role } = useAuth();
  const { redeemPoints, applyCouponUse, fetchPoints } = usePoints();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // If returning from WhatsApp Bizum flow on iOS PWA, redirect to account page
  useEffect(() => {
    if (sessionStorage.getItem("bizum_pending") === "1") {
      sessionStorage.removeItem("bizum_pending");
      navigate("/mi-cuenta", { replace: true });
    }
  }, []);

  const [step, setStep] = useState(0);
  const [services, setServices] = useState<DBService[]>([]);
  const [loadingServices, setLoadingServices] = useState(true);
  const [filterType, setFilterType] = useState("Todos");
  const [selected, setSelected] = useState<DBService[]>([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [selectedProfessionalId, setSelectedProfessionalId] = useState("");
  const [selectedProfessionalInfo, setSelectedProfessionalInfo] = useState<{ name: string; address: string | null; instagram: string | null } | null>(null);

  // Double/Multiple booking states
  const [companions, setCompanions] = useState<Companion[]>([]);
  const [bookingMode, setBookingMode] = useState<"simultaneous" | "consecutive">("simultaneous");
  const [activeTab, setActiveTab] = useState<string>("main");

  const handleAddCompanion = () => {
    const newId = `comp-${Date.now()}`;
    setCompanions(prev => [
      ...prev,
      {
        id: newId,
        name: "",
        phone: "",
        services: [],
        professionalId: "",
        professionalInfo: null,
      }
    ]);
    setActiveTab(newId);
  };

  const handleRemoveCompanion = (id: string) => {
    setCompanions(prev => prev.filter(c => c.id !== id));
    setActiveTab("main");
  };

  const handleAssignProfessionals = async (assignments: { [clientId: string]: string }) => {
    const mainProfId = assignments["main"] || "";
    setSelectedProfessionalId(mainProfId);
    if (mainProfId) {
      const { data: pp } = await supabase
        .from("professional_profiles")
        .select("address, instagram")
        .eq("user_id", mainProfId)
        .maybeSingle();
      const { data: profile } = await supabase
        .from("profiles")
        .select("name")
        .eq("id", mainProfId)
        .maybeSingle();
      setSelectedProfessionalInfo({
        name: profile?.name ?? "Profesional",
        address: pp?.address ?? null,
        instagram: pp?.instagram ?? null,
      });
    } else {
      setSelectedProfessionalInfo(null);
    }

    const updatedCompanions = await Promise.all(
      companions.map(async (c) => {
        const pId = assignments[c.id] || "";
        if (!pId) {
          return { ...c, professionalId: "", professionalInfo: null };
        }
        
        const { data: pp } = await supabase
          .from("professional_profiles")
          .select("address, instagram")
          .eq("user_id", pId)
          .maybeSingle();
        const { data: profile } = await supabase
          .from("profiles")
          .select("name")
          .eq("id", pId)
          .maybeSingle();
          
        return {
          ...c,
          professionalId: pId,
          professionalInfo: {
            name: profile?.name ?? "Profesional",
            address: pp?.address ?? null,
            instagram: pp?.instagram ?? null,
          },
        };
      })
    );
    setCompanions(updatedCompanions);
  };

  const [clientPhone, setClientPhone] = useState(() => sessionStorage.getItem("caluatnails_client_phone") ?? "");
  const [phoneVerified, setPhoneVerified] = useState(() => !!sessionStorage.getItem("caluatnails_client_phone"));
  const [phoneInput, setPhoneInput] = useState("");
  const [nameStep, setNameStep] = useState(false);
  const [clientNameInput, setClientNameInput] = useState("");
  const [checkingPhone, setCheckingPhone] = useState(false);
  // Don't pre-fill email from auth user if they're an admin (admin emails should never end up as client_email).
  const initialEmail = user?.email && role !== "admin" ? user.email : "";
  const [clientData, setClientData] = useState({ name: "", email: initialEmail, phone: "" });
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [successBooking, setSuccessBooking] = useState<{ id: string, client_account_id?: string } | null>(null);
  const [bookingDetails, setBookingDetails] = useState<any | null>(null);
  const [calDropdown, setCalDropdown] = useState(false);
  const [refCode, setRefCode] = useState<string | null>(null);
  const [referralReferrerName, setReferralReferrerName] = useState<string | null>(null);
  const [referralEligible, setReferralEligible] = useState(false);  // true = phone is new + refCode valid

  // Pre-fill user data when a non-admin user is logged in
  // (admins booking on behalf of clients should not have their email auto-attached)
  useEffect(() => {
    if (user && role !== "admin") {
      setClientData(prev => ({
        ...prev,
        email: user.email ?? prev.email,
        name: user.user_metadata?.name ?? prev.name,
      }));
    }
  }, [user, role]);

  useEffect(() => {
    if (clientPhone) {
      setClientData(prev => ({ ...prev, phone: clientPhone }));
    }
  }, [clientPhone]);

  // Scroll to top when wizard step changes or phone gate clears (mobile UX)
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" as ScrollBehavior });
  }, [step, phoneVerified]);

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneInput.trim()) return;
    const normalized = phoneInput.replace(/\s/g, "");
    setCheckingPhone(true);

    try {
      // 1. Search if the client account already exists
      const { data: viaRpc } = await supabase
        .rpc("find_client_account_by_phone", { p_phone: normalized })
        .maybeSingle();

      const existing = viaRpc as any;

      if (existing && existing.name && existing.name.trim()) {
        // If returning customer with a name, save and skip to services
        sessionStorage.setItem("caluatnails_client_phone", normalized);
        setClientPhone(normalized);
        setClientData(prev => ({ ...prev, name: existing.name, phone: normalized }));
        setPhoneVerified(true);
      } else {
        // New client or client without name -> show name input
        setNameStep(true);
      }
    } catch (err) {
      console.error("Error checking phone:", err);
      // Fallback: just go to name input
      setNameStep(true);
    } finally {
      setCheckingPhone(false);
    }
  };

  const handleNameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientNameInput.trim()) return;
    const normalizedPhone = phoneInput.replace(/\s/g, "");
    setCheckingPhone(true);

    try {
      // Ensure client account is created/updated with the name
      await ensureClientAccount(normalizedPhone, clientNameInput.trim());

      sessionStorage.setItem("caluatnails_client_phone", normalizedPhone);
      setClientPhone(normalizedPhone);
      setClientData(prev => ({ ...prev, name: clientNameInput.trim(), phone: normalizedPhone }));
      setPhoneVerified(true);
      setNameStep(false);
    } catch (err) {
      console.error("Error saving client name:", err);
      alert("Hubo un error al guardar tu nombre. Por favor, inténtalo de nuevo.");
    } finally {
      setCheckingPhone(false);
    }
  };

  // Detect referral code from URL ?ref= or sessionStorage
  useEffect(() => {
    const urlRef = searchParams.get("ref");
    if (urlRef) {
      setRefCode(urlRef);
      sessionStorage.setItem("caluatnails_ref", urlRef);
    } else {
      const stored = sessionStorage.getItem("caluatnails_ref");
      if (stored) setRefCode(stored);
    }
  }, [searchParams]);

  // Resolve referrer name from refCode (for banner copy)
  useEffect(() => {
    if (!refCode) { setReferralReferrerName(null); return; }
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("name")
        .eq("referral_code", refCode)
        .maybeSingle();
      if (!cancelled) setReferralReferrerName((data?.name || "Una amiga").split(" ")[0] || null);
    })();
    return () => { cancelled = true; };
  }, [refCode]);

  // Check eligibility: phone has zero prior non-cancelled bookings
  useEffect(() => {
    const phone = (clientData.phone || clientPhone || "").trim();
    if (!refCode || !phone || phone.length < 8) { setReferralEligible(false); return; }
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase.rpc("client_is_new_for_referral", { p_phone: phone });
      if (cancelled) return;
      setReferralEligible(!error && data === true);
    })();
    return () => { cancelled = true; };
  }, [refCode, clientData.phone, clientPhone]);

  // Discount only applies if the customer picks an "Esmaltado Semipermanente" service.
  // 18€ → 5€ = 13€ off. We apply per qualifying service (max 1, conservative).
  const referralServiceMatch = selected.find((s) =>
    /esmaltado\s*semipermanente/i.test(s.name) && Number(s.price) >= 13,
  );
  const referralDiscount = referralEligible && referralServiceMatch ? 13 : 0;

  // Check payment success return
  useEffect(() => {
    const paymentStatus = searchParams.get("payment");
    const bookingId = searchParams.get("booking");
    if (paymentStatus === "success" && bookingId) {
      fetchPoints();
      sessionStorage.removeItem("caluatnails_ref");
      
      const fetchClientAndBooking = async () => {
        const ids = bookingId.split(",");
        // 1. Fetch full bookings
        const { data: bookings } = await supabase
          .from("bookings")
          .select("*, booking_services(service_name, price_at_booking)")
          .in("id", ids);
        
        if (bookings && bookings.length > 0) {
          const mainBooking = bookings[0];
          
          let profName = "Profesional";
          let profAddress = "";
          
          const profNames: string[] = [];
          for (const b of bookings) {
            if (b.professional_id) {
              const { data: profProfile } = await supabase
                .from("profiles")
                .select("name")
                .eq("id", b.professional_id)
                .maybeSingle();
              if (profProfile) profNames.push(profProfile.name);
            }
          }
          if (profNames.length > 0) {
            profName = profNames.join(" y ");
          }

          if (mainBooking.professional_id) {
            const { data: pp } = await supabase
              .from("professional_profiles")
              .select("address")
              .eq("user_id", mainBooking.professional_id)
              .maybeSingle();
            if (pp?.address) profAddress = pp.address;
          }

          // Combine services list
          const combinedServices: string[] = [];
          bookings.forEach((b: any) => {
            b.booking_services?.forEach((s: any) => {
              combinedServices.push(s.service_name);
            });
          });

          // Sum total price and duration
          const totalCombinedPrice = bookings.reduce((sum: number, b: any) => sum + Number(b.total_price), 0);
          const totalCombinedDuration = bookings.reduce((sum: number, b: any) => sum + Number(b.total_duration_minutes), 0);

          setBookingDetails({
            date: mainBooking.booking_date,
            time: mainBooking.booking_time,
            durationMinutes: totalCombinedDuration,
            services: combinedServices,
            totalPrice: totalCombinedPrice,
            professionalName: profName,
            professionalAddress: profAddress,
          });

          // Fetch client account ID
          const { data: client } = await supabase
            .from("client_accounts")
            .select("id")
            .eq("phone", mainBooking.client_phone)
            .single();
          
          setSuccessBooking({ id: bookingId, client_account_id: client?.id });
        } else {
          setSuccessBooking({ id: bookingId });
        }
      };
      fetchClientAndBooking();
    }
  }, [searchParams]);

  // Auto redirect to account page after success (60s)
  const [redirectCountdown, setRedirectCountdown] = useState(60);
  useEffect(() => {
    if (successBooking) {
      setRedirectCountdown(60);
      const interval = setInterval(() => {
        setRedirectCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            navigate("/mi-cuenta");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [successBooking, navigate]);

  // Google Ads conversion tracking on successful booking
  useEffect(() => {
    if (successBooking && typeof window !== "undefined") {
      const gtag = (window as unknown as { gtag?: (...args: unknown[]) => void }).gtag;
      if (typeof gtag === "function") {
        gtag("event", "conversion", {
          send_to: "AW-18161532046/EthpCLzn8K0cEI75i9RD",
          transaction_id: successBooking.id,
        });
      }
    }
  }, [successBooking]);

  useEffect(() => {
    const fetch = async () => {
      setLoadingServices(true);
      const { data } = await supabase
        .from("services")
        .select("*")
        .eq("active", true)
        .order("booking_count", { ascending: false })
        .order("service_type")
        .order("name");
      setServices(data ?? []);
      setLoadingServices(false);
    };
    fetch();
  }, []);

  const serviceTypes = [...new Set(services.map(s => s.service_type))].sort();

  const filteredServices = filterType === "Todos"
    ? services
    : services.filter(s => s.service_type === filterType);

  const toggleService = (service: DBService) => {
    if (activeTab !== "main") {
      setCompanions(prev =>
        prev.map(c => {
          if (c.id === activeTab) {
            const hasService = c.services.some(s => s.id === service.id);
            return {
              ...c,
              services: hasService
                ? c.services.filter(s => s.id !== service.id)
                : [...c.services, service]
            };
          }
          return c;
        })
      );
    } else {
      setSelected(prev =>
        prev.find(s => s.id === service.id)
          ? prev.filter(s => s.id !== service.id)
          : [...prev, service]
      );
    }
  };

  const totalMinutes = selected.reduce((acc, s) => acc + s.duration_minutes, 0);
  const totalPrice = selected.reduce((acc, s) => acc + Number(s.price), 0);
  const deposit = totalPrice * 0.1;

  const handleDateTimeSelect = async (date: string, time: string, professionalId: string) => {
    setSelectedDate(date);
    setSelectedTime(time);
    if (professionalId && professionalId !== selectedProfessionalId) {
      setSelectedProfessionalId(professionalId);
      // Load professional info for summary display
      const { data: pp } = await supabase
        .from("professional_profiles")
        .select("address, instagram")
        .eq("user_id", professionalId)
        .maybeSingle();
      const { data: profile } = await supabase
        .from("profiles")
        .select("name")
        .eq("id", professionalId)
        .maybeSingle();
      setSelectedProfessionalInfo({
        name: profile?.name ?? "Profesional",
        address: pp?.address ?? null,
        instagram: pp?.instagram ?? null,
      });
    } else if (professionalId) {
      setSelectedProfessionalId(professionalId);
    }
  };

  // ── Helper: create booking in DB ──────────────────────────────────────────
  const createBookingRecord = async (discountAmount: number, pointsUsed: number, couponId?: string, paymentMethod = "stripe", subscriptionId?: string) => {
    if (pointsUsed > 0 && user) {
      await redeemPoints(pointsUsed, `Descuento en reserva del ${selectedDate}`);
    }
    if (couponId) {
      await applyCouponUse(couponId);
    }

    const totalDiscount = discountAmount;
    
    // Distribute prices
    const mainPrice = selected.reduce((acc, s) => acc + Number(s.price), 0);
    
    let discountLeft = totalDiscount;
    const finalMainPrice = Math.max(0, mainPrice - discountLeft);
    discountLeft = Math.max(0, discountLeft - (mainPrice - finalMainPrice));
    
    const companionFinalPrices = companions.map(c => {
      const price = c.services.reduce((acc, s) => acc + Number(s.price), 0);
      const finalPrice = Math.max(0, price - discountLeft);
      discountLeft = Math.max(0, discountLeft - (price - finalPrice));
      return finalPrice;
    });

    const isCash = paymentMethod === "efectivo" || paymentMethod === "efectivo_full";
    const depositAmt1 = isCash ? 0 : finalMainPrice * 0.1;

    // Create Booking 1
    const { data: booking, error: bErr } = await supabase
      .from("bookings")
      .insert({
        user_id: user?.id ?? null,
        client_name: clientData.name,
        client_email: clientData.email,
        client_phone: clientData.phone,
        booking_date: selectedDate,
        booking_time: selectedTime,
        total_duration_minutes: totalMinutes,
        total_price: finalMainPrice,
        deposit_amount: depositAmt1,
        deposit_paid: (paymentMethod === "subscription" && finalMainPrice === 0) ? true : false,
        status: "pending",
        professional_id: selectedProfessionalId || null,
        payment_method: paymentMethod,
        booking_source: "web",
        referral_discount_eur: referralDiscount,
        subscription_id: subscriptionId || null,
        notes: companions.length > 0 
          ? `Cita con ${companions.length} acompañante(s): ${companions.map(c => `${c.name} (${c.phone})`).join(", ")}.`
          : null,
      })
      .select()
      .single();

    if (bErr || !booking) throw new Error("Error creando la reserva principal");

    if (pointsUsed > 0 && !user) {
      const cleanPhone = clientData.phone.trim();
      const { data: clientAcct } = await supabase
        .from("client_accounts")
        .select("id, points")
        .eq("phone", cleanPhone)
        .maybeSingle();

      if (clientAcct) {
        const currentPoints = clientAcct.points ?? 0;
        const newPoints = Math.max(0, currentPoints - pointsUsed);
        await supabase
          .from("client_accounts")
          .update({ points: newPoints })
          .eq("id", clientAcct.id);

        await supabase
          .from("client_points_transactions")
          .insert({
            client_account_id: clientAcct.id,
            points: -pointsUsed,
            type: "redeemed",
            description: `Canje de puntos por descuento en reserva del ${selectedDate}`,
            reference_id: booking.id,
          });
      }
    }

    // Insert services for Booking 1
    await supabase.from("booking_services").insert(
      selected.map(s => ({
        booking_id: booking.id,
        service_id: s.id,
        service_name: s.name,
        price_at_booking: s.price,
      }))
    );

    const createdCompanions: any[] = [];
    let currentConsecTime = selectedTime;
    if (bookingMode === "consecutive") {
      currentConsecTime = timeAddMinutes(selectedTime, totalMinutes);
    }

    for (let i = 0; i < companions.length; i++) {
      const c = companions[i];
      const finalPrice = companionFinalPrices[i];
      const depositAmt = isCash ? 0 : finalPrice * 0.1;
      const duration = c.services.reduce((acc, s) => acc + s.duration_minutes, 0);

      const companionStartTime = bookingMode === "consecutive" ? currentConsecTime : selectedTime;

      const { data: bComp, error: compErr } = await supabase
        .from("bookings")
        .insert({
          user_id: null,
          client_name: c.name,
          client_email: null,
          client_phone: c.phone,
          booking_date: selectedDate,
          booking_time: companionStartTime,
          total_duration_minutes: duration,
          total_price: finalPrice,
          deposit_amount: depositAmt,
          deposit_paid: (paymentMethod === "subscription" && finalPrice === 0) ? true : false,
          status: "pending",
          professional_id: c.professionalId || null,
          payment_method: paymentMethod,
          booking_source: "web",
          notes: `Acompañante de ${clientData.name} (${clientData.phone}). Grupo: ${[clientData.name, ...companions.map(x => x.name)].join(", ")}.`,
        })
        .select()
        .single();

      if (compErr || !bComp) {
        await supabase.from("bookings").delete().eq("id", booking.id);
        for (const created of createdCompanions) {
          await supabase.from("bookings").delete().eq("id", created.id);
        }
        throw new Error(`Error creando la reserva para el acompañante ${c.name}`);
      }

      createdCompanions.push(bComp);

      // Insert services
      await supabase.from("booking_services").insert(
        c.services.map(s => ({
          booking_id: bComp.id,
          service_id: s.id,
          service_name: s.name,
          price_at_booking: s.price,
        }))
      );

      if (bookingMode === "consecutive") {
        currentConsecTime = timeAddMinutes(companionStartTime, duration);
      }
    }

    if (refCode) {
      const { data: referrer } = await supabase
        .from("profiles")
        .select("id")
        .eq("referral_code", refCode)
        .maybeSingle();

      if (referrer && referrer.id !== (user?.id ?? null)) {
        const { data: refRow } = await supabase
          .from("referrals")
          .insert({
            referrer_id: referrer.id,
            referred_user_id: user?.id ?? null,
            referred_email: clientData.email,
            referral_code: refCode,
            event_type: "booking",
            reference_id: booking.id,
            points_awarded: 300,
            status: "pending",
          })
          .select("id")
          .single();
        if (refRow?.id) {
          await supabase
            .from("bookings")
            .update({ referral_id: refRow.id })
            .eq("id", booking.id);
        }
      }
    }

    if (!user && clientData.email.trim() && clientData.email.includes("@")) {
      try {
        const { data: emailExists } = await supabase.rpc("is_email_taken", {
          p_email: clientData.email.trim(),
          p_phone: clientData.phone,
        });
        if (!emailExists) {
          const tempPassword = crypto.randomUUID().slice(0, 16) + "Aa1!";
          await fetch(`${SUPABASE_URL}/functions/v1/register-user`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
              "apikey": SUPABASE_ANON_KEY,
            },
            body: JSON.stringify({
              email: clientData.email.trim(),
              password: tempPassword,
              name: clientData.name.trim(),
              phone: clientData.phone,
            }),
          });
        }
      } catch (regErr) {
        console.warn("Auto-register after booking failed (non-fatal):", regErr);
      }
    }

    return { 
      booking, 
      companionBookings: createdCompanions, 
      finalTotal: finalMainPrice + companionFinalPrices.reduce((sum, p) => sum + p, 0), 
      depositAmt: depositAmt1 + companionFinalPrices.reduce((sum, p) => sum + p * 0.1, 0) 
    };
  };

  // ── Stripe payment ─────────────────────────────────────────────────────────
  const CARD_DISCOUNT_PCT = 0.05;
  const handlePayment = async (discountAmount: number, pointsUsed: number, couponId?: string, paymentMode: "deposit" | "full" = "deposit") => {
    if (!clientData.phone) return;
    setPaymentLoading(true);
    try {
      const { booking, companionBookings, finalTotal, depositAmt } = await createBookingRecord(discountAmount, pointsUsed, couponId, "stripe");
      
      const baseAmount = paymentMode === "full" ? finalTotal : depositAmt;
      const amountToCharge = paymentMode === "full"
        ? Math.max(0, baseAmount * (1 - CARD_DISCOUNT_PCT))
        : baseAmount;

      if (paymentMode === "full") {
        const discRatio = 1 - CARD_DISCOUNT_PCT;
        await supabase
          .from("bookings")
          .update({ deposit_amount: booking.total_price * discRatio })
          .eq("id", booking.id);
        booking.deposit_amount = booking.total_price * discRatio;
        
        for (const cb of companionBookings) {
          await supabase
            .from("bookings")
            .update({ deposit_amount: cb.total_price * discRatio })
            .eq("id", cb.id);
        }
      }

      // Validate env vars
      if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
        throw new Error("Configuración incompleta: faltan variables de entorno de Supabase");
      }

      // Validate email (Stripe requires it)
      const safeEmail = (clientData.email || "").trim();
      if (!safeEmail || !safeEmail.includes("@")) {
        throw new Error("Debes indicar un email válido para el pago con tarjeta");
      }

      // Validate at least 1 service
      if (selected.length === 0) {
        throw new Error("Debes seleccionar al menos un servicio");
      }

      const allIds = [booking.id, ...companionBookings.map(cb => cb.id)].join(",");
      const baseUrl = `${window.location.origin}${window.location.pathname}`;
      const res = await fetch(
        `${SUPABASE_URL}/functions/v1/stripe-booking-checkout`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
            "apikey": SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({
            bookingId: allIds,
            clientName: clientData.name,
            clientEmail: safeEmail,
            services: [
              ...selected.map(s => ({ name: s.name })),
              ...companions.flatMap(c => c.services.map(s => ({ name: `${s.name} (${c.name || "Acompañante"})` })))
            ],
            totalPrice: finalTotal,
            depositAmount: amountToCharge,
            paymentMode,
            bookingDate: selectedDate,
            bookingTime: selectedTime,
            successUrl: `${baseUrl}?payment=success&booking=${allIds}`,
            cancelUrl: `${baseUrl}?payment=cancelled&booking=${allIds}`,
          }),
        }
      );

      if (!res.ok) {
        const errText = await res.text();
        console.error("Edge function HTTP error:", res.status, errText);
        throw new Error(`Error del servidor (${res.status}): ${errText.slice(0, 100)}`);
      }

      const responseData = await res.json();
      const { url, error: stripeErr } = responseData;
      if (stripeErr) throw new Error(stripeErr);
      if (!url) throw new Error("La respuesta de Stripe no contiene una URL válida");

      await supabase.from("bookings").update({ stripe_session_id: url }).eq("id", booking.id);
      for (const cb of companionBookings) {
        await supabase.from("bookings").update({ stripe_session_id: url }).eq("id", cb.id);
      }
      window.location.href = url;
    } catch (err) {
      console.error("Stripe error:", err);
      alert(err instanceof Error ? `Error al procesar el pago:\n${err.message}` : "Hubo un error al procesar el pago. Inténtalo de nuevo.");
    } finally {
      setPaymentLoading(false);
    }
  };

  // ── Cash payment: create booking but do NOT redirect to Stripe ────────────
  const handleBizumPayment = async (discountAmount: number, pointsUsed: number, couponId?: string, paymentMode: "deposit" | "full" = "deposit") => {
    if (!clientData.phone) return;
    setPaymentLoading(true);
    try {
      const { booking, companionBookings, finalTotal } = await createBookingRecord(discountAmount, pointsUsed, couponId, paymentMode === "full" ? "efectivo_full" : "efectivo");
      
      // Update local points balance
      fetchPoints();
      sessionStorage.removeItem("caluatnails_ref");

      const groupId = "group-" + crypto.randomUUID();
      await supabase.from("bookings").update({ stripe_session_id: groupId }).eq("id", booking.id);
      for (const cb of companionBookings) {
        await supabase.from("bookings").update({ stripe_session_id: groupId }).eq("id", cb.id);
      }

      // Setup success screen data
      let profName = "Profesional";
      let profAddress = "";
      
      const bookingsList = [booking, ...companionBookings];
      const profNames: string[] = [];
      
      for (const b of bookingsList) {
        if (b.professional_id) {
          const { data: profProfile } = await supabase
            .from("profiles")
            .select("name")
            .eq("id", b.professional_id)
            .maybeSingle();
          if (profProfile) profNames.push(profProfile.name);
        }
      }
      
      if (profNames.length > 0) profName = profNames.join(" y ");

      if (booking.professional_id) {
        const { data: pp = {} } = await supabase
          .from("professional_profiles")
          .select("address")
          .eq("user_id", booking.professional_id)
          .maybeSingle();
        if (pp?.address) profAddress = pp.address;
      }

      const combinedServices = [
        ...selected.map(s => s.name),
        ...companions.flatMap(c => c.services.map(s => `${s.name} (${c.name || "Acompañante"})`))
      ];

      const combinedDuration = bookingsList.reduce((sum, b) => sum + Number(b.total_duration_minutes), 0);

      setBookingDetails({
        date: booking.booking_date,
        time: booking.booking_time,
        durationMinutes: combinedDuration,
        services: combinedServices,
        totalPrice: finalTotal,
        professionalName: profName,
        professionalAddress: profAddress,
      });

      // Get client account ID
      const { data: client } = await supabase
        .from("client_accounts")
        .select("id")
        .eq("phone", booking.client_phone)
        .single();

      const allIds = [booking.id, ...companionBookings.map(cb => cb.id)].join(",");
      setSuccessBooking({ id: allIds, client_account_id: client?.id });
    } catch (err) {
      console.error("Bizum booking error:", err);
      alert(err instanceof Error ? `Error al reservar con Bizum:\n${err.message}` : "Hubo un error al procesar tu reserva con Bizum. Inténtalo de nuevo.");
    } finally {
      setPaymentLoading(false);
    }
  };

  // ── Subscription payment: create booking covered by a prepaid voucher ──────
  const handleSubscriptionPayment = async (discountAmount: number, pointsUsed: number, couponId?: string, subscriptionId?: string) => {
    if (!clientData.phone) return;
    setPaymentLoading(true);
    try {
      const { booking, companionBookings } = await createBookingRecord(discountAmount, pointsUsed, couponId, "subscription", subscriptionId);
      
      // Update local points balance
      fetchPoints();
      sessionStorage.removeItem("caluatnails_ref");

      const groupId = "group-" + crypto.randomUUID();
      await supabase.from("bookings").update({ stripe_session_id: groupId }).eq("id", booking.id);
      for (const cb of companionBookings) {
        await supabase.from("bookings").update({ stripe_session_id: groupId }).eq("id", cb.id);
      }

      // Setup success screen data
      let profName = "Profesional";
      let profAddress = "";
      
      const bookingsList = [booking, ...companionBookings];
      const profNames: string[] = [];
      
      for (const b of bookingsList) {
        if (b.professional_id) {
          const { data: profProfile } = await supabase
            .from("profiles")
            .select("name")
            .eq("id", b.professional_id)
            .maybeSingle();
          if (profProfile) profNames.push(profProfile.name);
        }
      }
      
      if (profNames.length > 0) profName = profNames.join(" y ");

      if (booking.professional_id) {
        const { data: pp = {} } = await supabase
          .from("professional_profiles")
          .select("address")
          .eq("user_id", booking.professional_id)
          .maybeSingle();
        if (pp?.address) profAddress = pp.address;
      }

      const combinedServices = [
        ...selected.map(s => s.name),
        ...companions.flatMap(c => c.services.map(s => `${s.name} (${c.name || "Acompañante"})`))
      ];

      const combinedPrice = bookingsList.reduce((sum, b) => sum + Number(b.total_price), 0);
      const combinedDuration = bookingsList.reduce((sum, b) => sum + Number(b.total_duration_minutes), 0);

      setBookingDetails({
        date: booking.booking_date,
        time: booking.booking_time,
        durationMinutes: combinedDuration,
        services: combinedServices,
        totalPrice: combinedPrice,
        professionalName: profName,
        professionalAddress: profAddress,
      });

      // Get client account ID
      const { data: client } = await supabase
        .from("client_accounts")
        .select("id")
        .eq("phone", booking.client_phone)
        .single();

      const allIds = [booking.id, ...companionBookings.map(cb => cb.id)].join(",");
      setSuccessBooking({ id: allIds, client_account_id: client?.id });
    } catch (err) {
      console.error("Subscription booking error:", err);
      alert(err instanceof Error ? `Error al reservar con tu bono:\n${err.message}` : "Hubo un error al procesar tu reserva con bono. Inténtalo de nuevo.");
    } finally {
      setPaymentLoading(false);
    }
  };

  if (successBooking) {
    const savedPhone = sessionStorage.getItem("caluatnails_client_phone") ?? clientData.phone;
    return (
      <div className="min-h-screen bg-rose-50 flex items-center justify-center px-4 py-10">
        <div className="bg-white rounded-3xl p-10 text-center max-w-md w-full shadow-sm space-y-6">
          {/* Icon */}
          <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto">
            <i className="ri-calendar-check-line text-4xl text-emerald-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">¡Reserva confirmada! ✅</h1>
            <p className="text-gray-500 leading-relaxed text-sm">
              Tu anticipo ha sido procesado correctamente. Recibirás un mensaje de WhatsApp con todos los detalles de tu cita.
            </p>
          </div>
          {bookingDetails && bookingDetails.totalPrice === 0 ? (
            <p className="text-sm text-emerald-700 bg-emerald-50 rounded-xl px-4 py-3 font-semibold">
              ✓ Esta cita ha sido cubierta al 100% por tu Bono de Prepago (0€ a pagar).
            </p>
          ) : (
            <p className="text-sm text-amber-700 bg-amber-50 rounded-xl px-4 py-3">
              Recuerda: el 90% restante se abona en el momento de la cita.
            </p>
          )}

          {/* Push notification opt-in */}
          <PushNotificationButton
            clientAccountId={successBooking.client_account_id ?? undefined}
          />

          {/* Add to calendar */}
          {bookingDetails && (
            <div className="relative w-full text-left">
              <button
                onClick={(e) => { e.stopPropagation(); setCalDropdown(p => !p); }}
                className="w-full flex items-center justify-between gap-2 py-3 px-5 rounded-full border border-gray-200 text-gray-700 text-sm font-semibold hover:bg-gray-50 transition-colors cursor-pointer"
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
                  date: bookingDetails.date,
                  time: bookingDetails.time,
                  durationMinutes: bookingDetails.durationMinutes,
                  services: bookingDetails.services,
                  totalPrice: bookingDetails.totalPrice,
                  location: bookingDetails.professionalAddress || undefined,
                });
                return (
                  <div className="absolute left-0 right-0 mt-1.5 bg-white border border-gray-100 rounded-2xl shadow-xl overflow-hidden z-[250] text-left animate-[fadeInUp_0.2s_ease]">
                    {[
                      { href: links.googleUrl, target: "_blank", download: undefined, icon: "ri-google-fill", color: "bg-red-50 text-red-500", label: "Google Calendar", desc: "Abrir en Google Calendar" },
                      { href: links.icsUrl, target: undefined, download: `cita-${bookingDetails.date}.ics`, icon: "ri-apple-fill", color: "bg-gray-100 text-gray-800", label: "Apple Calendar / iCal", desc: "Descargar archivo .ics" },
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

          {/* Primary: Go to Mi Cuenta */}
          <button
            onClick={() => navigate("/mi-cuenta")}
            className="w-full bg-rose-500 hover:bg-rose-600 text-white font-semibold px-8 py-3.5 rounded-full transition-all hover:shadow-lg hover:shadow-rose-200 cursor-pointer flex items-center justify-center gap-2"
          >
            <i className="ri-user-line"></i>
            Ir a Mi Cuenta
            <i className="ri-arrow-right-line"></i>
          </button>

          {/* Countdown info */}
          <p className="text-xs text-gray-400 flex items-center justify-center gap-1.5">
            <i className="ri-time-line"></i>
            Te llevaremos automáticamente en <span className="font-bold text-rose-500">{redirectCountdown}s</span>
          </p>

          {/* Secondary: Back to home */}
          <button
            onClick={() => navigate("/")}
            className="w-full bg-white border border-gray-200 hover:border-gray-300 text-gray-600 hover:text-gray-900 font-medium px-8 py-2.5 rounded-full transition-colors cursor-pointer"
          >
            Volver al inicio
          </button>
        </div>
      </div>
    );
  }

  // Phone gate: show phone input before anything else
  if (!phoneVerified) {
    if (nameStep) {
      return (
        <div className="min-h-screen bg-gray-50/50 flex items-center justify-center px-4">
          <div className="w-full max-w-md animate-[fadeInUp_0.3s_ease]">
            <div className="text-center mb-8">
              <div className="w-16 h-16 rounded-full bg-rose-100 flex items-center justify-center mx-auto mb-4">
                <i className="ri-user-add-line text-2xl text-rose-500"></i>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Dinos tu nombre</h1>
              <p className="text-gray-500 text-sm">Para personalizar tu reserva y enviarte los detalles</p>
            </div>
            <form onSubmit={handleNameSubmit} className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4 shadow-sm">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nombre completo</label>
                <input
                  type="text"
                  required
                  value={clientNameInput}
                  onChange={e => setClientNameInput(e.target.value)}
                  placeholder="Tu nombre y apellido"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-rose-500 focus:ring-2 focus:ring-rose-100 outline-none transition-all text-sm"
                  autoFocus
                />
              </div>
              <button
                type="submit"
                disabled={!clientNameInput.trim() || checkingPhone}
                className="w-full py-3.5 bg-rose-500 hover:bg-rose-600 text-white rounded-xl font-semibold text-sm transition-all cursor-pointer disabled:opacity-40 disabled:grayscale-[0.5] shadow-lg shadow-rose-200/50"
              >
                {checkingPhone ? (
                  <span className="flex items-center justify-center gap-2">
                    <i className="ri-loader-4-line animate-spin"></i> 
                    Guardando...
                  </span>
                ) : (
                  "Continuar a servicios"
                )}
              </button>
              <button
                type="button"
                onClick={() => setNameStep(false)}
                className="w-full py-2.5 text-xs font-semibold text-gray-400 hover:text-gray-600 transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                <i className="ri-arrow-left-line"></i>
                Atrás
              </button>
            </form>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-gray-50/50 flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-full bg-rose-100 flex items-center justify-center mx-auto mb-4">
              <i className="ri-phone-line text-2xl text-rose-500"></i>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Reservar cita</h1>
            <p className="text-gray-500 text-sm">Introduce tu número de teléfono para comenzar</p>
          </div>
          <form onSubmit={handlePhoneSubmit} className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4 shadow-sm">
            <div className="phone-input-container">
              <label className="block text-sm font-medium text-gray-700 mb-2">Teléfono móvil</label>
              <PhoneInput
                international
                defaultCountry="ES"
                value={phoneInput}
                onChange={val => setPhoneInput(val || "")}
                placeholder="600 000 000"
                className="w-full"
                autoFocus
              />
              <p className="mt-2 text-[10px] text-gray-400 italic">
                Usaremos este número para enviarte los detalles de tu cita por WhatsApp.
              </p>
            </div>
            <button
              type="submit"
              disabled={!phoneInput || !isValidPhoneNumber(phoneInput) || checkingPhone}
              className="w-full py-3.5 bg-rose-500 hover:bg-rose-600 text-white rounded-xl font-semibold text-sm transition-all cursor-pointer disabled:opacity-40 disabled:grayscale-[0.5] shadow-lg shadow-rose-200/50"
            >
              {checkingPhone ? (
                <span className="flex items-center justify-center gap-2">
                  <i className="ri-loader-4-line animate-spin"></i> 
                  Verificando...
                </span>
              ) : (
                "Continuar reserva"
              )}
            </button>
            <div className="flex items-center gap-4 py-2">
              <div className="h-px flex-1 bg-gray-100"></div>
              <span className="text-[10px] text-gray-300 font-bold uppercase tracking-widest">O</span>
              <div className="h-px flex-1 bg-gray-100"></div>
            </div>
            <button
              type="button"
              onClick={() => navigate("/mis-citas")}
              className="w-full py-2.5 text-xs font-semibold text-gray-500 hover:text-rose-500 transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              <i className="ri-history-line"></i>
              Consultar mis citas anteriores
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => navigate("/")}
              className="flex items-center gap-2 text-sm text-gray-500 hover:text-rose-500 transition-colors cursor-pointer"
            >
              <i className="ri-arrow-left-line"></i>
              <span className="hidden sm:inline">Volver</span>
            </button>
            <h1 className="text-lg font-bold text-gray-900">Reservar cita</h1>
            <div className="w-16"></div>
          </div>
          <BookingStepIndicator currentStep={step} steps={STEPS} />
        </div>
      </div>

      <div className={`max-w-5xl mx-auto px-6 py-8 ${step === 0 ? "pb-32" : "pb-10"}`}>
        {/* Step 0: Service selection */}
        {step === 0 && (
          <div>
            {refCode && referralReferrerName && (
              <div className={`mb-6 rounded-2xl p-4 border ${
                referralEligible
                  ? "bg-gradient-to-r from-amber-50 via-orange-50 to-rose-50 border-amber-200"
                  : "bg-rose-50/40 border-rose-100"
              }`}>
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    referralEligible ? "bg-amber-400 text-white" : "bg-rose-100 text-rose-600"
                  }`}>
                    <i className="ri-gift-2-fill text-xl"></i>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-900 text-sm">
                      Invitación de <span className="text-rose-600">{referralReferrerName}</span> {referralEligible && "✨ activada"}
                    </p>
                    {referralEligible ? (
                      <p className="text-xs text-gray-700 mt-0.5 leading-relaxed">
                        Eres clienta nueva — añade un <strong>Esmaltado Semipermanente</strong> y te llega por <strong>5€ en lugar de 18€</strong> (descuento de 13€ aplicado al total).
                      </p>
                    ) : (
                      <p className="text-xs text-gray-500 mt-0.5">
                        La oferta de bienvenida (5€ esmaltado) solo aplica para clientas nuevas en su primera cita.
                      </p>
                    )}
                    {referralEligible && referralServiceMatch && (
                      <p className="text-[11px] text-emerald-700 font-semibold mt-1.5">
                        ✓ Descuento -13€ aplicado a "{referralServiceMatch.name}"
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
            <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-1">
                  {companions.length > 0 && activeTab !== "main" 
                    ? `Selecciona los servicios de ${companions.find(c => c.id === activeTab)?.name || "tu acompañante"}` 
                    : "Selecciona tus servicios"}
                </h2>
                <p className="text-gray-500 text-sm">Puedes seleccionar uno o varios servicios</p>
              </div>

              <div className="flex flex-wrap items-center gap-2 bg-gray-100 p-1 rounded-xl shrink-0">
                <button
                  type="button"
                  onClick={() => setActiveTab("main")}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    activeTab === "main" ? "bg-white text-rose-600 shadow-sm" : "text-gray-500 hover:text-gray-900"
                  }`}
                >
                  Tú ({selected.reduce((acc, s) => acc + Number(s.price), 0)}€)
                </button>
                
                {companions.map((c, idx) => (
                  <div key={c.id} className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setActiveTab(c.id)}
                      className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                        activeTab === c.id ? "bg-white text-rose-600 shadow-sm" : "text-gray-500 hover:text-gray-900"
                      }`}
                    >
                      {c.name.trim() || `Acomp. ${idx + 1}`} ({c.services.reduce((acc, s) => acc + Number(s.price), 0)}€)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveCompanion(c.id)}
                      className="p-1 text-gray-400 hover:text-red-500 transition-colors cursor-pointer"
                      title="Eliminar acompañante"
                    >
                      <i className="ri-close-line"></i>
                    </button>
                  </div>
                ))}
                
                <button
                  type="button"
                  onClick={handleAddCompanion}
                  className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-xs rounded-lg flex items-center gap-1 transition-all cursor-pointer border border-rose-100/50 shrink-0"
                >
                  <i className="ri-user-add-line"></i>
                  Añadir acompañante
                </button>
              </div>
            </div>

            {companions.length > 0 && activeTab !== "main" && (
              <div className="mb-6 bg-white rounded-3xl border border-gray-100 p-6 space-y-4 animate-[fadeInUp_0.3s_ease] shadow-sm">
                <h3 className="font-bold text-gray-900 text-sm flex items-center gap-1.5">
                  <i className="ri-user-add-line text-rose-500"></i>
                  Datos de tu acompañante
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">Nombre completo</label>
                    <input
                      type="text"
                      required
                      value={companions.find(c => c.id === activeTab)?.name || ""}
                      onChange={e => {
                        const val = e.target.value;
                        setCompanions(prev =>
                          prev.map(c => (c.id === activeTab ? { ...c, name: val } : c))
                        );
                      }}
                      placeholder="Nombre del acompañante"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-rose-500 focus:ring-2 focus:ring-rose-100 outline-none transition-all text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">Teléfono móvil</label>
                    <PhoneInput
                      international
                      defaultCountry="ES"
                      value={companions.find(c => c.id === activeTab)?.phone || ""}
                      onChange={val => {
                        setCompanions(prev =>
                          prev.map(c => (c.id === activeTab ? { ...c, phone: val || "" } : c))
                        );
                      }}
                      placeholder="600 000 000"
                      className="w-full"
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="mb-6">
              <ServiceFilter types={serviceTypes} active={filterType} onChange={setFilterType} />
            </div>
            {loadingServices ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-40 rounded-2xl bg-gray-100 animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {filteredServices.map(service => (
                  <ServiceCard
                    key={service.id}
                    service={service}
                    selected={
                      companions.length > 0 && activeTab !== "main"
                        ? !!companions.find(c => c.id === activeTab)?.services.find(s => s.id === service.id)
                        : !!selected.find(s => s.id === service.id)
                    }
                    onToggle={toggleService}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step 1: Date & Time */}
        {step === 1 && (
          <div>
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-1">Elige fecha y hora</h2>
              <p className="text-sm text-gray-500">
                Duración total de tu cita: {Math.floor(totalMinutes / 60) > 0 ? `${Math.floor(totalMinutes / 60)} h ` : ""}{totalMinutes % 60 > 0 ? `${totalMinutes % 60} min` : ""}
              </p>
            </div>
            <CalendarPicker
              totalMinutes={totalMinutes}
              selectedDate={selectedDate}
              selectedTime={selectedTime}
              selectedProfessionalId={selectedProfessionalId}
              onSelect={handleDateTimeSelect}
              selectedServices={selected}
              companions={companions}
              bookingMode={bookingMode}
              setBookingMode={setBookingMode}
              onAssignProfessionals={handleAssignProfessionals}
            />
            <div className="flex justify-between mt-8 gap-4">
              <button
                onClick={() => setStep(0)}
                className="flex items-center gap-2 px-6 py-3 rounded-full border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
              >
                <i className="ri-arrow-left-line"></i> Volver
              </button>
              <button
                disabled={!selectedDate || !selectedTime || !selectedProfessionalId}
                onClick={() => setStep(2)}
                className={`flex items-center gap-2 px-8 py-3 rounded-full text-sm font-semibold transition-all cursor-pointer ${
                  selectedDate && selectedTime && selectedProfessionalId
                    ? "bg-rose-500 hover:bg-rose-600 text-white shadow-lg shadow-rose-200"
                    : "bg-gray-100 text-gray-400 cursor-not-allowed"
                }`}
              >
                Continuar <i className="ri-arrow-right-line"></i>
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Client form & Payment */}
        {step === 2 && (
          <div>
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-1">Completa tu reserva</h2>
              <p className="text-sm text-gray-500">Rellena tus datos y realiza el pago del anticipo</p>
            </div>
            <ClientForm
              data={clientData}
              onChange={setClientData}
              selectedServices={selected}
              selectedDate={selectedDate}
              selectedTime={selectedTime}
              onSubmit={(discount, pts, couponId, mode) => handlePayment(discount, pts, couponId, mode)}
              onBizumSubmit={(discount, pts, couponId, mode) => handleBizumPayment(discount, pts, couponId, mode)}
              onSubscriptionSubmit={(discount, pts, couponId, subId) => handleSubscriptionPayment(discount, pts, couponId, subId)}
              loading={paymentLoading}
              professional={selectedProfessionalInfo}
              referralDiscount={referralDiscount}
              referralReferrerName={referralReferrerName}
              companions={companions}
              bookingMode={bookingMode}
            />
            <div className="mt-6">
              <button
                onClick={() => setStep(1)}
                className="flex items-center gap-2 text-sm text-gray-500 hover:text-rose-500 transition-colors cursor-pointer"
              >
                <i className="ri-arrow-left-line"></i> Volver a fecha y hora
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Floating summary bar (only step 0) */}
      {step === 0 && (
        <BookingSummaryBar
          selected={[
            ...selected,
            ...companions.flatMap(c => c.services)
          ]}
          onContinue={() => {
            if (selected.length === 0) {
              alert("Debes seleccionar al menos un servicio para ti.");
              setActiveTab("main");
              return;
            }
            // Validate all companions
            for (let i = 0; i < companions.length; i++) {
              const c = companions[i];
              if (!c.name.trim()) {
                alert(`Por favor, introduce el nombre del Acompañante ${i + 1}.`);
                setActiveTab(c.id);
                return;
              }
              if (!c.phone || !isValidPhoneNumber(c.phone)) {
                alert(`Por favor, introduce un teléfono móvil válido para ${c.name || `el Acompañante ${i + 1}`}.`);
                setActiveTab(c.id);
                return;
              }
              if (c.services.length === 0) {
                alert(`Por favor, selecciona al menos un servicio para ${c.name}.`);
                setActiveTab(c.id);
                return;
              }
            }
            setStep(1);
          }}
        />
      )}
    </div>
  );
}
