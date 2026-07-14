import { useState, useEffect, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useSEO } from "@/hooks/useSEO";
import { useAuth } from "@/hooks/useAuth";
import { usePurchase } from "@/hooks/usePurchase";
import { usePoints } from "@/hooks/usePoints";
import { useClientAccount } from "@/hooks/useClientAccount";
import { supabase } from "@/lib/supabase";
import { GOOGLE_REVIEW_URL } from "@/lib/constants";
import { useCourseStore } from "@/hooks/useCourseStore";
import { useProgress } from "@/hooks/useProgress";
import ProAgendaTab from "@/pages/account/components/ProAgendaTab";
import ClientBookingsTab from "@/pages/account/components/ClientBookingsTab";
import ReferralTab from "@/pages/account/components/ReferralTab";
import SecurityTab from "@/pages/account/components/SecurityTab";
import PushNotificationButton from "@/components/PushNotificationButton";

interface Purchase {
  id: string;
  product_id: string;
  session_id: string;
  amount_total: number;
  currency: string;
  status: string;
  created_at: string;
}

const PRODUCT_NAME: Record<string, string> = {
  prod_UG5ehG9IrGh4hl: "Acceso Completo — Curso Profesional de Manicura",
};

function formatAmount(amount: number, currency: string) {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(amount / 100);
}

function formatDate(dateStr: string) {
  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(dateStr));
}

function getInitials(name: string) {
  return name.split(/\s+/).map((w: string) => w[0]?.toUpperCase() ?? "").slice(0, 2).join("");
}

type TabKey = "overview" | "bonos" | "points" | "purchases" | "profesional" | "agenda" | "reservas" | "referidos" | "seguridad";
type AppRole = "professional" | "student" | "client";

const ROLE_CONFIG: Record<AppRole, {
  label: string;
  icon: string;
  color: string;
  bg: string;
  gradient: string;
  heroTitle: string;
  heroDesc: string;
}> = {
  professional: {
    label: "Profesional",
    icon: "ri-award-line",
    color: "teal",
    bg: "bg-teal-50",
    gradient: "from-teal-500 to-emerald-600",
    heroTitle: "Panel de Gestión Pro",
    heroDesc: "Gestiona tus citas, horarios y visibilidad pública."
  },
  student: {
    label: "Estudiante",
    icon: "ri-graduation-cap-line",
    color: "rose",
    bg: "bg-rose-50",
    gradient: "from-rose-500 to-pink-600",
    heroTitle: "Centro de Formación",
    heroDesc: "Continúa aprendiendo y descarga tus certificados."
  },
  client: {
    label: "Cliente",
    icon: "ri-user-heart-line",
    color: "amber",
    bg: "bg-amber-50",
    gradient: "from-amber-400 to-orange-500",
    heroTitle: "Área de Cliente",
    heroDesc: "Tus próximas citas y puntos acumulados."
  }
};

export default function AccountPage() {
  useSEO({
    title: "Mi Cuenta",
    description: "Área privada de cliente CALUATNAILS.",
    ogUrl: "/mi-cuenta",
    canonical: "/mi-cuenta",
    noindex: true,
  });
  const navigate = useNavigate();
  const { user, loading: authLoading, signOut } = useAuth();
  const { hasPurchase, loading: purchaseLoading } = usePurchase();
  const { points: authPoints, transactions: authTransactions, loading: pointsLoading, fetchPoints } = usePoints();
  const { allModules, allDBLessons, getLessonCountsByModuleOrderIndex } = useCourseStore();
  const lessonCounts = getLessonCountsByModuleOrderIndex();
  const dbContext = user ? { userId: user.id, dbLessons: allDBLessons, dbModules: allModules } : undefined;
  const { totalPercentage, completedLessons, totalLessons, isCourseComplete } = useProgress(lessonCounts, dbContext);

  // Phone-based identity
  const clientPhone = sessionStorage.getItem("caluatnails_client_phone") ?? "";
  const linkedProfileId = sessionStorage.getItem("caluatnails_linked_profile_id") ?? "";
  const isPhoneMode = !user && !!clientPhone;
  const { account: clientAccount, transactions: clientTransactions, loading: clientLoading } = useClientAccount(
    isPhoneMode ? clientPhone : undefined,
    user?.id
  );



  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loadingPurchases, setLoadingPurchases] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>(() => {
    if (typeof window === "undefined") return "overview";
    const tab = new URLSearchParams(window.location.search).get("tab");
    const valid: TabKey[] = ["overview", "bonos", "points", "purchases", "profesional", "agenda", "reservas", "referidos", "seguridad"];
    return (valid.includes(tab as TabKey) ? (tab as TabKey) : "overview");
  });
  const [isProfessional, setIsProfessional] = useState(false);
  const [proProfile, setProProfile] = useState<{ bio: string; specialties: string; instagram: string; address: string } | null>(null);
  const [proSaving, setProSaving] = useState(false);
  const [proToast, setProToast] = useState("");
  
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const refreshData = useCallback(() => setRefreshTrigger(prev => prev + 1), []);

  // When in phone mode and there's a linked registered profile,
  // fetch that profile's points, transactions AND role data so the user
  // sees exactly the same account as when logging in with email.
  const [linkedProfilePoints, setLinkedProfilePoints] = useState<number | null>(null);
  const [linkedProfileTransactions, setLinkedProfileTransactions] = useState<any[]>([]);
  const [linkedProfileHasPurchase, setLinkedProfileHasPurchase] = useState(false);
  const [linkedProfileIsProfessional, setLinkedProfileIsProfessional] = useState(false);
  const [linkedProfileEmail, setLinkedProfileEmail] = useState<string | null>(null);
  useEffect(() => {
    if (!isPhoneMode || !linkedProfileId) {
      setLinkedProfilePoints(null);
      setLinkedProfileTransactions([]);
      setLinkedProfileHasPurchase(false);
      setLinkedProfileIsProfessional(false);
      setLinkedProfileEmail(null);
      return;
    }
    (async () => {
      const { data: prof } = await supabase
        .from("profiles")
        .select("points, is_professional, course_access, email")
        .eq("id", linkedProfileId)
        .maybeSingle();

      if (prof) {
        setLinkedProfilePoints(prof.points ?? 0);
        setLinkedProfileIsProfessional(prof.is_professional ?? false);
        setLinkedProfileEmail(prof.email ?? null);

        // Check course access
        if (prof.course_access) {
          setLinkedProfileHasPurchase(true);
        } else if (prof.email) {
          const { data: purchaseData } = await supabase
            .from("purchases")
            .select("id")
            .eq("product_id", "prod_UG5ehG9IrGh4hl")
            .eq("email", prof.email.toLowerCase().trim())
            .eq("status", "completed")
            .limit(1);
          setLinkedProfileHasPurchase((purchaseData?.length ?? 0) > 0);
        }
      }

      const { data: txs } = await supabase
        .from("points_transactions")
        .select("*")
        .eq("user_id", linkedProfileId)
        .order("created_at", { ascending: false })
        .limit(50);
      setLinkedProfileTransactions(txs ?? []);
    })();
  }, [isPhoneMode, linkedProfileId, refreshTrigger]);


  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [profileData, setProfileData] = useState<{
    name: string;
    birthday: string;
    phone: string;
    emailReward: boolean;
    birthdayReward: boolean;
    pushReward: boolean;
    googleReviewReward: boolean;
  }>({
    name: "",
    birthday: "",
    phone: "",
    emailReward: false,
    birthdayReward: false,
    pushReward: false,
    googleReviewReward: false
  });

  // Fetch full profile data
  const fetchProfileData = useCallback(async () => {
    let pName = "";
    let pBirthday = "";
    let pPhone = "";
    let pEmailReward = false;
    let pBirthdayReward = false;
    let pPushReward = false;
    let pGoogleReviewReward = false;

    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("name, birthday, phone, email_reward_awarded, birthday_reward_awarded, push_points_awarded, google_review_reward_awarded")
        .eq("id", user.id)
        .maybeSingle();
      
      const { data: clientAcc } = await supabase
        .from("client_accounts")
        .select("name, birthday, phone, email_reward_awarded, birthday_reward_awarded, push_points_awarded, google_review_reward_awarded")
        .eq("auth_user_id", user.id)
        .maybeSingle();

      if (profile) {
        pName = profile.name || (user.user_metadata?.name ?? "");
        pBirthday = profile.birthday || clientAcc?.birthday || "";
        pPhone = profile.phone || clientAcc?.phone || "";
        pEmailReward = (profile.email_reward_awarded ?? false) || (clientAcc?.email_reward_awarded ?? false);
        pBirthdayReward = (profile.birthday_reward_awarded ?? false) || (clientAcc?.birthday_reward_awarded ?? false);
        pPushReward = (profile.push_points_awarded ?? false) || (clientAcc?.push_points_awarded ?? false);
        pGoogleReviewReward = (profile.google_review_reward_awarded ?? false) || (clientAcc?.google_review_reward_awarded ?? false);
      }
    } else if (clientAccount) {
      let linkedProfile: any = null;
      if (linkedProfileId) {
        const { data } = await supabase
          .from("profiles")
          .select("name, birthday, phone, email_reward_awarded, birthday_reward_awarded, push_points_awarded, google_review_reward_awarded")
          .eq("id", linkedProfileId)
          .maybeSingle();
        linkedProfile = data;
      }

      pName = clientAccount.name || linkedProfile?.name || "";
      pBirthday = clientAccount.birthday || linkedProfile?.birthday || "";
      pPhone = clientAccount.phone || linkedProfile?.phone || "";
      pEmailReward = (clientAccount.email_reward_awarded ?? false) || (linkedProfile?.email_reward_awarded ?? false);
      pBirthdayReward = (clientAccount.birthday_reward_awarded ?? false) || (linkedProfile?.birthday_reward_awarded ?? false);
      pPushReward = (clientAccount.push_points_awarded ?? false) || (linkedProfile?.push_points_awarded ?? false);
      pGoogleReviewReward = (clientAccount.google_review_reward_awarded ?? false) || (linkedProfile?.google_review_reward_awarded ?? false);
    }

    setProfileData({
      name: pName,
      birthday: pBirthday,
      phone: pPhone,
      emailReward: pEmailReward,
      birthdayReward: pBirthdayReward,
      pushReward: pPushReward,
      googleReviewReward: pGoogleReviewReward
    });
  }, [user, clientAccount, linkedProfileId]);

  useEffect(() => {
    fetchProfileData();
  }, [fetchProfileData, refreshTrigger]);

  // Unified identity values
  const isAuthenticated = !!user || isPhoneMode;
  const displayName = profileData.name || (user
    ? (user.user_metadata?.name ?? user.email?.split("@")[0] ?? "Usuaria")
    : (clientAccount?.name ?? "Cliente"));
  const displayEmail = user?.email ?? clientAccount?.email ?? null;
  const displayPhone = user?.phone || profileData.phone || clientPhone || clientAccount?.phone || null;
  const initials = getInitials(displayName);

  // Points: if in phone mode with a linked profile, use the profile's points (all migrated there)
  const points = isPhoneMode
    ? (linkedProfileId && linkedProfilePoints !== null ? linkedProfilePoints : (clientAccount?.points ?? 0))
    : authPoints;
  const transactions = isPhoneMode
    ? (linkedProfileId && linkedProfileTransactions.length > 0 ? linkedProfileTransactions : clientTransactions)
    : authTransactions;

  const memberSince = user?.created_at
    ? new Date(user.created_at)
    : clientAccount?.created_at
      ? new Date(clientAccount.created_at)
      : new Date();

  const [certId, setCertId] = useState('');
  const [certLoading, setCertLoading] = useState(true);
  useEffect(() => {
    if (!user) { setCertLoading(false); return; }
    const saved = localStorage.getItem(`cert_id_${user.id}`) ?? '';
    if (saved) {
      setCertId(saved);
      setCertLoading(false);
      return;
    }
    supabase.from('certificates').select('id').eq('user_id', user.id).maybeSingle()
      .then(
        ({ data }) => {
          if (data) setCertId((data as { id: string }).id);
          setCertLoading(false);
        },
        () => setCertLoading(false)
      );
  }, [user]);

  // Redirect to login if neither auth user nor phone session
  useEffect(() => {
    if (!authLoading && !user && !clientPhone) {
      navigate("/login?redirect=/mi-cuenta");
    }
  }, [user, authLoading, clientPhone, navigate]);

  const [reviewToast, setReviewToast] = useState("");
  const handleGoogleReviewClick = async () => {
    // Open Google review in new tab immediately
    window.open(GOOGLE_REVIEW_URL, "_blank", "noopener,noreferrer");

    // Award 100 points (only once)
    if (profileData.googleReviewReward) return;
    try {
      if (user) {
        const { data: prof } = await supabase
          .from("profiles")
          .select("google_review_reward_awarded")
          .eq("id", user.id)
          .single();
        if (prof && !prof.google_review_reward_awarded) {
          await supabase.rpc("award_profile_points", {
            p_user_id: user.id,
            p_client_id: null,
            p_points: 100,
            p_reason: "Reseña en Google ⭐",
          });
          await supabase
            .from("profiles")
            .update({ google_review_reward_awarded: true })
            .eq("id", user.id);
        }
      } else if (clientAccount) {
        const { data: ca } = await supabase
          .from("client_accounts")
          .select("google_review_reward_awarded")
          .eq("id", clientAccount.id)
          .single();
        if (ca && !ca.google_review_reward_awarded) {
          await supabase.rpc("award_profile_points", {
            p_user_id: null,
            p_client_id: clientAccount.id,
            p_points: 100,
            p_reason: "Reseña en Google ⭐",
          });
          await supabase
            .from("client_accounts")
            .update({ google_review_reward_awarded: true })
            .eq("id", clientAccount.id);
        }
      }
      setProfileData(prev => ({ ...prev, googleReviewReward: true }));
      fetchPoints();
      refreshData();
      setReviewToast("¡+100 puntos por tu reseña en Google! Gracias 🌟");
      setTimeout(() => setReviewToast(""), 4000);
    } catch (err) {
      console.error("[GoogleReview] Error awarding points:", err);
    }
  };

  useEffect(() => {
    if (!user) return;
    const fetchPro = async () => {
      const { data: profile } = await supabase
        .from("profiles")
        .select("is_professional")
        .eq("id", user.id)
        .maybeSingle();

      if (profile?.is_professional) {
        setIsProfessional(true);
        const { data: pro } = await supabase
          .from("professional_profiles")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();

        if (pro) {
          setProProfile({
            bio: pro.bio ?? "",
            specialties: Array.isArray(pro.specialties) ? pro.specialties.join(", ") : "",
            instagram: pro.instagram ?? "",
            address: pro.address ?? "",
          });
        } else {
          await supabase.from("professional_profiles").insert({
            user_id: user.id,
            bio: null,
            specialties: [],
            instagram: null,
            address: null,
            active: true,
          });
          setProProfile({ bio: "", specialties: "", instagram: "", address: "" });
        }
      }
    };
    fetchPro();
  }, [user]);

  useEffect(() => {
    const emailToUse = user?.email || (isPhoneMode ? linkedProfileEmail : null);
    if (!emailToUse) {
      setPurchases([]);
      setLoadingPurchases(false);
      return;
    }
    const fetchPurchases = async () => {
      setLoadingPurchases(true);
      const { data } = await supabase
        .from("purchases")
        .select("*")
        .eq("email", emailToUse.toLowerCase().trim())
        .order("created_at", { ascending: false });
      setPurchases(data ?? []);
      setLoadingPurchases(false);
    };
    fetchPurchases();
  }, [user, isPhoneMode, linkedProfileEmail]);

  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [loadingSubscriptions, setLoadingSubscriptions] = useState(true);

  useEffect(() => {
    if (!clientAccount?.id) {
      setLoadingSubscriptions(false);
      return;
    }
    const fetchSubscriptions = async () => {
      setLoadingSubscriptions(true);
      try {
        const { data, error } = await supabase
          .from("client_subscriptions")
          .select(`
            *,
            subscription_plans (
              name,
              total_price,
              duration_months,
              total_sessions
            )
          `)
          .eq("client_account_id", clientAccount.id)
          .order("created_at", { ascending: false });
        if (error) throw error;
        setSubscriptions(data || []);
      } catch (err) {
        console.error("Error fetching client subscriptions:", err);
      } finally {
        setLoadingSubscriptions(false);
      }
    };
    fetchSubscriptions();
  }, [clientAccount?.id, refreshTrigger]);

  const loading = authLoading || (isPhoneMode && clientLoading);
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-pink-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-rose-300 border-t-rose-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  // Primary Role detection
  const effectiveIsProfessional = isPhoneMode && linkedProfileId ? linkedProfileIsProfessional : isProfessional;
  const effectiveHasPurchase    = isPhoneMode && linkedProfileId ? linkedProfileHasPurchase    : hasPurchase;
  const primaryRole: AppRole = effectiveIsProfessional ? "professional" : effectiveHasPurchase ? "student" : "client";
  const rCfg = ROLE_CONFIG[primaryRole];

  // Build tabs based on role prioritization
  const allTabs: { key: TabKey; label: string; icon: string; badge?: string; roles?: AppRole[] }[] = [
    { key: "overview", label: "Dashboard", icon: "ri-dashboard-line", badge: user && isCourseComplete && !certLoading && certId ? "🎓" : undefined },
    { key: "bonos", label: "Mis Bonos", icon: "ri-ticket-line" },
    { key: "agenda", label: "Mi agenda", icon: "ri-calendar-schedule-line", roles: ["professional"] },
    { key: "profesional", label: "Perfil público", icon: "ri-award-line", roles: ["professional"] },
    { key: "reservas", label: "Mis reservas", icon: "ri-calendar-check-line" },
    { key: "points", label: "Puntos", icon: "ri-coin-line" },
    { key: "purchases", label: "Mis cursos", icon: "ri-graduation-cap-line", roles: ["student", "professional"] },
    { key: "referidos", label: "Referidos", icon: "ri-links-line" },
    { key: "seguridad", label: "Seguridad", icon: "ri-shield-keyhole-line" },
  ];

  let tabs = allTabs.filter(t => !t.roles || t.roles.includes(primaryRole));

  // Reorder tabs to put role-specific ones first after overview
  if (primaryRole === "professional") {
    const agendaTab = tabs.find(t => t.key === "agenda");
    const proTab = tabs.find(t => t.key === "profesional");
    if (agendaTab && proTab) {
      const other = tabs.filter(t => t.key !== "agenda" && t.key !== "profesional" && t.key !== "overview");
      tabs = [tabs[0], agendaTab, proTab, ...other];
    }
  } else if (primaryRole === "student") {
    const purchaseTab = tabs.find(t => t.key === "purchases");
    const bonosTab = tabs.find(t => t.key === "bonos");
    if (purchaseTab && bonosTab) {
      const other = tabs.filter(t => t.key !== "purchases" && t.key !== "bonos" && t.key !== "overview");
      tabs = [tabs[0], bonosTab, purchaseTab, ...other];
    } else if (purchaseTab) {
      const other = tabs.filter(t => t.key !== "purchases" && t.key !== "overview");
      tabs = [tabs[0], purchaseTab, ...other];
    }
  } else {
    const reservationsTab = tabs.find(t => t.key === "reservas");
    const pointsTab = tabs.find(t => t.key === "points");
    const bonosTab = tabs.find(t => t.key === "bonos");
    if (reservationsTab && pointsTab && bonosTab) {
      const other = tabs.filter(t => t.key !== "reservas" && t.key !== "points" && t.key !== "bonos" && t.key !== "overview");
      tabs = [tabs[0], bonosTab, reservationsTab, pointsTab, ...other];
    }
  }

  const handleLogout = () => {
    if (isPhoneMode) {
      sessionStorage.removeItem("caluatnails_client_phone");
      navigate("/login");
    } else {
      signOut();
    }
  };

  const handleSavePro = async () => {
    if (!user || !proProfile) return;
    setProSaving(true);
    const specialtiesArr = proProfile.specialties
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const { error } = await supabase
      .from("professional_profiles")
      .upsert(
        {
          user_id: user.id,
          bio: proProfile.bio || null,
          specialties: specialtiesArr,
          instagram: proProfile.instagram || null,
          address: proProfile.address || null,
          active: true,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      );

    setProSaving(false);
    if (error) {
      setProToast("Error al guardar. Inténtalo de nuevo.");
    } else {
      setProToast("Perfil actualizado correctamente");
    }
    setTimeout(() => setProToast(""), 3000);
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br ${rCfg.bg} via-white to-white`}>
      {/* Top nav */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 cursor-pointer">
            <span className="font-playfair text-xl font-bold tracking-widest text-gray-900">
              <img src="/assets/caluatnails-logo.png" alt="Caluatnails" className="h-8 md:h-10 w-auto object-contain" />
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <Link 
              to="/reservar"
              className={`text-sm font-bold px-4 py-2 ${rCfg.bg} text-${rCfg.color}-600 rounded-full hover:opacity-80 transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5`}
            >
              <i className="ri-calendar-check-line"></i>RESERVAR
            </Link>
            <button
              onClick={handleLogout}
              className="text-sm font-medium px-4 py-2 rounded-full border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer whitespace-nowrap"
            >
              Cerrar sesión
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10 space-y-6">

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-2xl w-fit flex-wrap">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer whitespace-nowrap ${
                activeTab === tab.key ? `bg-white text-${rCfg.color}-600 shadow-sm` : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <i className={tab.icon}></i>
              {tab.label}
              {tab.key === "points" && (
                <span className="bg-amber-400 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                  {points}
                </span>
              )}
              {tab.badge && (
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ===== OVERVIEW TAB ===== */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            
            {/* Dynamic Hero Section */}
            <div className={`bg-gradient-to-r ${rCfg.gradient} rounded-3xl p-8 text-white shadow-xl shadow-${rCfg.color}-200/50 relative overflow-hidden group`}>
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-110 transition-transform duration-700"></div>
              <div className="relative flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="text-center md:text-left">
                  <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-[10px] font-bold uppercase tracking-wider mb-3">
                    {rCfg.label}
                  </span>
                  <h2 className="text-3xl font-bold mb-2">{rCfg.heroTitle}</h2>
                  <p className="text-white/80 text-sm max-w-sm">
                    {rCfg.heroDesc}
                  </p>
                </div>
                
                <div className="flex flex-wrap justify-center gap-3">
                  {primaryRole === "professional" ? (
                    <>
                      <button 
                        onClick={() => setActiveTab("agenda")}
                        className="px-6 py-3 bg-white text-teal-600 font-bold rounded-2xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all flex items-center gap-2 group/btn"
                      >
                        <i className="ri-calendar-schedule-line text-lg"></i>
                        <span>VER MI AGENDA</span>
                      </button>
                      <button 
                        onClick={() => setActiveTab("profesional")}
                        className="px-6 py-3 bg-teal-600 border border-white/30 text-white font-bold rounded-2xl shadow-lg hover:bg-teal-700 transition-all flex items-center gap-2"
                      >
                        <i className="ri-award-line text-lg"></i>
                        <span>PERFIL PÚBLICO</span>
                      </button>
                    </>
                  ) : primaryRole === "student" ? (
                    <>
                      <Link
                        to="/modulo/1"
                        className="px-8 py-4 bg-white text-rose-600 font-bold rounded-2xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all flex items-center gap-3 group/btn"
                      >
                        <i className="ri-play-circle-line text-xl"></i>
                        <span>CONTINUAR CURSO</span>
                      </Link>
                      {isCourseComplete && certId && (
                         <Link
                          to={`/certificado/${certId}`}
                          className="px-6 py-4 bg-amber-400 text-amber-900 font-bold rounded-2xl shadow-lg hover:bg-amber-500 transition-all flex items-center gap-2"
                        >
                          <i className="ri-award-line text-xl"></i>
                          <span>MI CERTIFICADO</span>
                        </Link>
                      )}
                    </>
                  ) : (
                    <Link
                      to="/reservar"
                      className="px-8 py-4 bg-white text-amber-600 font-bold rounded-2xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all flex items-center gap-3 group/btn"
                    >
                      <i className="ri-calendar-check-line text-xl group-hover/btn:scale-110 transition-transform"></i>
                      <span>RESERVAR CITA</span>
                    </Link>
                  )}
                </div>
              </div>
            </div>

            {/* Push notifications */}
            <PushNotificationButton
              clientAccountId={isPhoneMode ? clientAccount?.id : undefined}
              profileId={user?.id}
              onSuccess={() => {
                refreshData();
                fetchPoints();
              }}
            />

            {/* Profile header with Role Badge */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 flex flex-col sm:flex-row items-center sm:items-start gap-5">
              <div className={`w-20 h-20 rounded-full bg-gradient-to-br ${rCfg.gradient} flex items-center justify-center text-white text-2xl font-bold shrink-0 relative`}>
                {initials}
                <div className={`absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-white border-2 border-${rCfg.color}-500 flex items-center justify-center text-${rCfg.color}-600 shadow-sm`}>
                  <i className={rCfg.icon}></i>
                </div>
              </div>
              <div className="flex-1 text-center sm:text-left">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-1">
                  <h1 className="text-2xl font-bold text-gray-900">{displayName}</h1>
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${rCfg.bg} text-${rCfg.color}-600 border border-${rCfg.color}-100 w-fit mx-auto sm:mx-0`}>
                    <i className={rCfg.icon}></i>
                    {primaryRole === "professional" ? "Profesional Caluatnails" : primaryRole === "student" ? (isCourseComplete ? "Alumna Certificada" : "Estudiante") : "Cliente VIP"}
                  </span>
                </div>
                {displayEmail && <p className="text-gray-500 text-sm mt-0.5">{displayEmail}</p>}
                {displayPhone && !displayEmail && <p className="text-gray-500 text-sm mt-0.5">{displayPhone}</p>}
                <p className="text-xs text-gray-400 mt-1">
                  <i className="ri-calendar-line mr-1"></i>
                  Miembro desde{" "}
                  {new Intl.DateTimeFormat("es-ES", { month: "long", year: "numeric" }).format(memberSince)}
                </p>
              </div>
              {(user || (isPhoneMode && linkedProfileId)) && !purchaseLoading && primaryRole !== "professional" && (
                <div className={`px-4 py-2 rounded-full text-sm font-semibold shrink-0 ${effectiveHasPurchase ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-600"}`}>
                  {effectiveHasPurchase ? <><i className="ri-shield-check-line mr-1.5"></i>Acceso completo</> : <><i className="ri-lock-line mr-1.5"></i>Sin acceso premium</>}
                </div>
              )}
            </div>

            {/* Role-Specific Secondary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Points card (Always relevant but styled) */}
              <div
                className={`bg-gradient-to-r from-amber-400 to-orange-400 rounded-2xl p-6 text-white flex items-center justify-between cursor-pointer hover:scale-[1.02] transition-transform`}
                onClick={() => setActiveTab("points")}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 flex items-center justify-center bg-white/20 rounded-xl">
                    <i className="ri-coin-line text-2xl"></i>
                  </div>
                  <div>
                    <p className="text-sm opacity-90">Mis puntos acumulados</p>
                    <p className="text-3xl font-bold">{(pointsLoading && !isPhoneMode) ? "..." : points.toLocaleString()}</p>
                    <p className="text-xs opacity-80">= {(points / 100).toFixed(2)} € descuento</p>
                  </div>
                </div>
                <div className="flex items-center justify-center w-10 h-10 bg-white/20 rounded-full">
                  <i className="ri-arrow-right-line"></i>
                </div>
              </div>

              {/* Dynamic second card based on role */}
              {primaryRole === "professional" ? (
                <Link
                  to="/profesionales"
                  className="bg-white rounded-2xl border border-gray-100 p-6 flex items-center justify-between hover:border-teal-300 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 flex items-center justify-center bg-teal-50 text-teal-600 rounded-xl">
                      <i className="ri-earth-line text-2xl"></i>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Estado público</p>
                      <p className="text-lg font-bold text-gray-900">Perfil Activo</p>
                      <p className="text-xs text-teal-600 font-medium">Apareces en el directorio</p>
                    </div>
                  </div>
                  <i className="ri-external-link-line text-gray-300"></i>
                </Link>
              ) : primaryRole === "student" ? (
                 <div
                  className="bg-white rounded-2xl border border-gray-100 p-6 flex items-center justify-between cursor-pointer hover:border-rose-300 transition-colors"
                  onClick={() => setActiveTab("purchases")}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 flex items-center justify-center bg-rose-50 text-rose-600 rounded-xl">
                      <i className="ri-graduation-cap-line text-2xl"></i>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Estado formación</p>
                      <p className="text-lg font-bold text-gray-900">{isCourseComplete ? "Finalizado" : "En progreso"}</p>
                      <p className="text-xs text-rose-600 font-medium">{totalPercentage}% completado</p>
                    </div>
                  </div>
                  <i className="ri-arrow-right-line text-gray-300"></i>
                </div>
              ) : (
                <>
                  <div
                    className="bg-white rounded-2xl border border-gray-100 p-6 flex items-center justify-between cursor-pointer hover:border-rose-300 transition-colors"
                    onClick={() => setActiveTab("bonos")}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 flex items-center justify-center bg-rose-50 text-rose-500 rounded-xl">
                        <i className="ri-ticket-line text-2xl"></i>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Mis Bonos de Prepago</p>
                        {loadingSubscriptions ? (
                          <p className="text-sm font-semibold text-gray-400">Cargando...</p>
                        ) : (
                          <p className="text-lg font-bold text-gray-900 font-inter">
                            {subscriptions.filter(s => s.status === "active").length > 0
                              ? `${subscriptions.filter(s => s.status === "active").reduce((acc, curr) => acc + (curr.sessions_total - curr.sessions_used), 0)} sesiones`
                              : "Sin bonos activos"}
                          </p>
                        )}
                        <p className="text-xs text-rose-600 font-medium">Ver saldo y vencimiento</p>
                      </div>
                    </div>
                    <i className="ri-arrow-right-line text-gray-300"></i>
                  </div>
                  <div
                    className="bg-white rounded-2xl border border-gray-100 p-6 flex items-center justify-between cursor-pointer hover:border-amber-300 transition-colors"
                    onClick={() => setActiveTab("referidos")}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 flex items-center justify-center bg-amber-50 text-amber-600 rounded-xl">
                        <i className="ri-links-line text-2xl"></i>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Programa Embajadora</p>
                        <p className="text-lg font-bold text-gray-900">Invita y Gana</p>
                        <p className="text-xs text-amber-600 font-medium">Gana puntos por cada amiga</p>
                      </div>
                    </div>
                    <i className="ri-arrow-right-line text-gray-300"></i>
                  </div>
                </>
              )}
            </div>

            {/* Google Review CTA */}
            {reviewToast && (
              <div className="bg-emerald-500 text-white px-5 py-3 rounded-xl text-sm font-medium flex items-center gap-2 animate-fade-in">
                <i className="ri-check-line"></i>{reviewToast}
              </div>
            )}
            <button
              onClick={handleGoogleReviewClick}
              className="w-full bg-white rounded-2xl border border-gray-100 p-6 hover:border-amber-300 hover:shadow-md transition-all group text-left cursor-pointer"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-50 to-rose-50 flex items-center justify-center shrink-0">
                  <i className="ri-google-fill text-2xl bg-gradient-to-r from-blue-500 via-red-500 to-yellow-500 bg-clip-text text-transparent"></i>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-900 flex items-center gap-2">
                    Déjanos tu reseña en Google
                    <span className="flex">
                      {[1,2,3,4,5].map(i => <i key={i} className="ri-star-fill text-amber-400 text-xs"></i>)}
                    </span>
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {profileData.googleReviewReward
                      ? "¡Gracias por tu reseña! Ya conseguiste tus puntos ✅"
                      : "Tu opinión nos ayuda a crecer · Gana +100 puntos"}
                  </p>
                </div>
                <div className="flex flex-col items-center gap-1 shrink-0">
                  {!profileData.googleReviewReward && (
                    <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">+100 pts</span>
                  )}
                  <div className="w-10 h-10 rounded-full bg-amber-50 group-hover:bg-amber-100 flex items-center justify-center transition-colors">
                    <i className={`${profileData.googleReviewReward ? "ri-checkbox-circle-fill text-emerald-500" : "ri-external-link-line text-amber-600"}`}></i>
                  </div>
                </div>
              </div>
            </button>

            {/* Progress / Profile Completion Rewards */}
            <div className="space-y-4">
              <div className="bg-white rounded-2xl border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="font-bold text-gray-900 flex items-center gap-2">
                      <i className="ri-medal-line text-amber-500"></i> Completa tu perfil y gana premios
                    </h3>
                    <p className="text-xs text-gray-500">Consigue puntos por cada dato que verifiques</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-amber-600 bg-amber-50 px-3 py-1 rounded-full">
                      ¡Gana hasta 500 pts!
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {[
                    {
                      label: "Email Verificado", 
                      pts: "100 pts", 
                      done: profileData.emailReward || !!displayEmail, 
                      icon: "ri-mail-check-line",
                      action: () => setActiveTab("seguridad")
                    },
                    { 
                      label: "Fecha Cumpleaños", 
                      pts: "100 pts", 
                      done: profileData.birthdayReward || !!profileData.birthday, 
                      icon: "ri-cake-2-line",
                      action: () => setIsEditModalOpen(true)
                    },
                    {
                      label: "Notificaciones",
                      pts: "200 pts",
                      done: profileData.pushReward,
                      icon: "ri-notification-3-line",
                      action: () => {
                        const el = document.getElementById('push-button');
                        el?.scrollIntoView({ behavior: 'smooth' });
                      }
                    },
                    {
                      label: "Reseña Google",
                      pts: "100 pts",
                      done: profileData.googleReviewReward,
                      icon: "ri-google-fill",
                      action: handleGoogleReviewClick
                    },
                  ].map((reward) => (
                    <div 
                      key={reward.label}
                      onClick={reward.done ? undefined : reward.action}
                      className={`relative p-4 rounded-2xl border transition-all ${reward.done ? 'bg-emerald-50 border-emerald-100' : 'bg-gray-50 border-transparent hover:border-amber-200 cursor-pointer'}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${reward.done ? 'bg-white text-emerald-500' : 'bg-white text-gray-400'}`}>
                          <i className={`${reward.icon} text-lg`}></i>
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-gray-800 truncate">{reward.label}</p>
                          <p className={`text-[10px] font-bold ${reward.done ? 'text-emerald-600' : 'text-amber-600'}`}>
                            {reward.done ? '¡Conseguido!' : `+${reward.pts}`}
                          </p>
                        </div>
                        {reward.done && (
                          <div className="absolute top-2 right-2">
                            <i className="ri-checkbox-circle-fill text-emerald-500"></i>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {(primaryRole === "student" || primaryRole === "professional") && (user || (isPhoneMode && linkedProfileId)) && effectiveHasPurchase && (
                <div className={`rounded-2xl border p-6 ${isCourseComplete ? 'bg-gradient-to-r from-amber-50 to-rose-50 border-amber-200' : 'bg-white border-gray-100'}`}>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shrink-0 ${isCourseComplete ? 'bg-amber-100 text-amber-500' : 'bg-rose-50 text-rose-400'}`}>
                      <i className={isCourseComplete ? 'ri-award-fill' : 'ri-book-open-line'}></i>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h2 className="text-base font-bold text-gray-900">
                        {isCourseComplete ? '¡Curso completado al 100%!' : 'Tu progreso formativo'}
                      </h2>
                      <p className="text-sm text-gray-500 mt-0.5">
                        {isCourseComplete
                          ? `${completedLessons} lecciones · Formación profesional finalizada`
                          : `${completedLessons} de ${totalLessons} lecciones completadas`}
                      </p>
                      {!isCourseComplete && (
                        <div className="mt-2 flex items-center gap-3">
                          <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-rose-400 rounded-full transition-all duration-500" style={{ width: `${totalPercentage}%` }} />
                          </div>
                          <span className="text-xs font-bold text-gray-400">{totalPercentage}%</span>
                        </div>
                      )}
                    </div>
                    {isCourseComplete ? (
                      <Link
                        to="/mi-cuenta/certificado"
                        className="w-full sm:w-auto px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-amber-200 flex items-center justify-center gap-2"
                      >
                        <i className="ri-medal-line text-lg"></i>
                        Ver Certificado
                      </Link>
                    ) : (
                      <Link
                        to="/academia"
                        className={`w-full sm:w-auto px-6 py-3 bg-${rCfg.color}-500 hover:bg-${rCfg.color}-600 text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-${rCfg.color}-200 flex items-center justify-center gap-2`}
                      >
                        Continuar
                        <i className="ri-arrow-right-line"></i>
                      </Link>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Quick actions for phone-only clients */}
            {isPhoneMode && (
              <div className="grid grid-cols-2 gap-4">
                <Link
                  to="/reservar"
                  className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center gap-4 hover:border-rose-200 transition-colors"
                >
                  <div className="w-12 h-12 rounded-xl bg-rose-50 flex items-center justify-center text-rose-500 shrink-0">
                    <i className="ri-calendar-check-line text-xl"></i>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">Nueva reserva</p>
                    <p className="text-xs text-gray-400">Reservar cita</p>
                  </div>
                </Link>
                <div
                  className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center gap-4 hover:border-rose-200 transition-colors cursor-pointer"
                  onClick={() => setActiveTab("referidos")}
                >
                  <div className="w-12 h-12 rounded-xl bg-teal-50 flex items-center justify-center text-teal-500 shrink-0">
                    <i className="ri-links-line text-xl"></i>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">Invitar amigas</p>
                    <p className="text-xs text-gray-400">Ganar puntos</p>
                  </div>
                </div>
                <button
                  onClick={handleGoogleReviewClick}
                  className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center gap-4 hover:border-amber-200 transition-colors col-span-2 text-left cursor-pointer w-full"
                >
                  <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-500 shrink-0">
                    <i className="ri-star-line text-xl"></i>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">Dejar reseña en Google</p>
                    <p className="text-xs text-gray-400">
                      {profileData.googleReviewReward ? "¡Gracias! ✅" : "Gana +100 puntos"}
                    </p>
                  </div>
                  <i className={`${profileData.googleReviewReward ? "ri-checkbox-circle-fill text-emerald-500" : "ri-external-link-line text-gray-300"} ml-auto`}></i>
                </button>
              </div>
            )}

            {/* Account info */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl ${rCfg.bg} flex items-center justify-center text-${rCfg.color}-600 shrink-0`}>
                    <i className="ri-user-settings-line text-lg"></i>
                  </div>
                  <div>
                    <h2 className="font-bold text-gray-900">Información de cuenta</h2>
                    <p className="text-sm text-gray-500">Tus datos de acceso</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsEditModalOpen(true)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold border border-${rCfg.color}-100 text-${rCfg.color}-600 hover:${rCfg.bg} transition-all flex items-center gap-2`}
                >
                  <i className="ri-edit-line"></i> EDITAR
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { label: "Nombre", value: displayName },
                  ...(profileData.birthday ? [{ label: "Cumpleaños", value: new Date(profileData.birthday).toLocaleDateString("es-ES", { day: "numeric", month: "long" }) }] : []),
                  ...(displayEmail ? [{ label: "Email", value: displayEmail }] : []),
                  ...(displayPhone ? [{ label: "Teléfono", value: displayPhone }] : []),
                  ...(user ? [{ label: "ID de usuario", value: user.id, mono: true }] : []),
                  { label: "Estado", value: "Cuenta activa", green: true },
                  ...(isPhoneMode && !clientAccount?.auth_user_id ? [{ label: "Tipo de acceso", value: "Solo teléfono", amber: true }] : []),
                ].map((item) => (
                  <div key={item.label} className="p-4 rounded-xl bg-gray-50 group hover:bg-white hover:shadow-sm transition-all border border-transparent hover:border-gray-100">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{item.label}</p>
                    <p className={`text-sm font-semibold truncate ${(item as { green?: boolean }).green ? "text-emerald-600" : (item as { amber?: boolean }).amber ? "text-amber-600" : "text-gray-900"} ${(item as { mono?: boolean }).mono ? "font-mono text-[11px]" : ""}`}>
                      {(item as { green?: boolean }).green && <i className="ri-checkbox-circle-line mr-1"></i>}
                      {(item as { amber?: boolean }).amber && <i className="ri-phone-line mr-1"></i>}
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>
              {isPhoneMode && !clientAccount?.auth_user_id && (
                <div className={`mt-4 bg-gradient-to-r ${rCfg.bg} to-white border border-${rCfg.color}-100 rounded-xl p-4 flex items-start gap-3`}>
                  <i className={`ri-shield-keyhole-line text-${rCfg.color}-500 text-lg mt-0.5 shrink-0`}></i>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-900 mb-0.5">Protege tu cuenta</p>
                    <p className="text-xs text-gray-500">Añade un email y contraseña para mayor seguridad y acceder a más funciones.</p>
                  </div>
                  <button
                    onClick={() => setActiveTab("seguridad")}
                    className={`px-4 py-2 bg-${rCfg.color}-500 hover:bg-${rCfg.color}-600 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0`}
                  >
                    Configurar
                  </button>
                </div>
              )}
            </div>

            <EditProfileModal
              isOpen={isEditModalOpen}
              onClose={() => setIsEditModalOpen(false)}
              currentName={displayName}
              currentBirthday={profileData.birthday}
              currentEmail={displayEmail ?? clientAccount?.email ?? ""}
              currentPhone={user?.phone ?? clientPhone ?? clientAccount?.phone ?? ""}
              isPhoneMode={isPhoneMode}
              profileId={user?.id}
              clientAccountId={clientAccount?.id}
              onUpdate={() => {
                refreshData();
                fetchPoints();
              }}
            />
          </div>
        )}

        {/* ===== POINTS TAB ===== */}
        {activeTab === "points" && (
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-amber-400 to-orange-400 rounded-2xl p-8 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
              <div className="relative">
                <div className="flex items-center gap-2 mb-2">
                  <i className="ri-coin-line text-xl"></i>
                  <span className="text-sm font-medium opacity-90">Mis puntos disponibles</span>
                </div>
                <p className="text-5xl font-bold mb-1">{points.toLocaleString()}</p>
                <p className="text-sm opacity-80">= {(points / 100).toFixed(2)} € en descuentos</p>
                <div className="mt-4 flex items-center gap-2 bg-white/20 rounded-xl px-4 py-2 w-fit">
                  <i className="ri-information-line text-sm"></i>
                  <span className="text-xs">100 puntos = 1 € de descuento (máx. 50% por compra)</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <i className="ri-gift-line text-rose-500"></i> ¿Cómo ganar puntos?
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { icon: "ri-shopping-bag-line", label: "Compra un módulo", pts: "+500 pts", color: "bg-rose-50 text-rose-500" },
                  { icon: "ri-calendar-check-line", label: "Reserva una cita", pts: "Según servicio", color: "bg-emerald-50 text-emerald-600" },
                  { icon: "ri-store-2-line", label: "Compra en tienda", pts: "Según producto", color: "bg-amber-50 text-amber-500" },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                    <div className={`w-10 h-10 flex items-center justify-center rounded-xl ${item.color}`}>
                      <i className={`${item.icon} text-lg`}></i>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800">{item.label}</p>
                      <p className="text-xs font-bold text-amber-600">{item.pts}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                <i className="ri-exchange-line text-rose-500"></i> ¿Cómo canjear puntos?
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Al finalizar tu compra o reserva, activa la opción <strong>"Usar mis puntos"</strong> para aplicar un descuento automático.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { icon: "ri-shopping-cart-line", label: "En cursos y tienda", desc: "Activa el toggle en el carrito al pagar", color: "text-rose-500" },
                  { icon: "ri-calendar-line", label: "En reservas de citas", desc: "Activa el toggle en el paso final de reserva", color: "text-emerald-600" },
                ].map((item) => (
                  <div key={item.label} className="flex items-start gap-3 bg-rose-50 rounded-xl px-4 py-3">
                    <i className={`${item.icon} ${item.color} text-lg mt-0.5`}></i>
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{item.label}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <i className="ri-history-line text-rose-500"></i> Historial de puntos
              </h3>
              {transactions.length === 0 ? (
                <div className="text-center py-10">
                  <i className="ri-coin-line text-3xl text-gray-200 block mb-2"></i>
                  <p className="text-gray-400 text-sm">Aún no tienes movimientos de puntos</p>
                  <p className="text-xs text-gray-300 mt-1">Compra un módulo o reserva una cita para empezar a ganar</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {transactions.map((tx) => {
                    const typeConfig: Record<string, { icon: string; bg: string; text: string; label: string }> = {
                      earned:           { icon: "ri-shopping-bag-line",      bg: "bg-rose-50",    text: "text-rose-500",    label: "Compra" },
                      redeemed:         { icon: "ri-coupon-3-line",           bg: "bg-gray-100",   text: "text-gray-500",    label: "Canje" },
                      bonus:            { icon: "ri-gift-line",               bg: "bg-amber-50",   text: "text-amber-500",   label: "Bonus" },
                      referral:         { icon: "ri-links-line",              bg: "bg-teal-50",    text: "text-teal-600",    label: "Referido" },
                      referral_booking: { icon: "ri-links-line",              bg: "bg-teal-50",    text: "text-teal-600",    label: "Referido" },
                      shop_purchase:    { icon: "ri-store-2-line",            bg: "bg-amber-50",   text: "text-amber-500",   label: "Tienda" },
                      booking:          { icon: "ri-calendar-check-line",     bg: "bg-emerald-50", text: "text-emerald-600", label: "Reserva" },
                    };
                    const cfg = typeConfig[tx.type] ?? (tx.points > 0
                      ? { icon: "ri-arrow-up-line",   bg: "bg-emerald-50", text: "text-emerald-600", label: "Ganado" }
                      : { icon: "ri-arrow-down-line", bg: "bg-rose-50",    text: "text-rose-500",    label: "Usado" });
                    return (
                      <div key={tx.id} className="flex items-center justify-between py-3 px-4 rounded-xl hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 flex items-center justify-center rounded-xl shrink-0 ${cfg.bg} ${cfg.text}`}>
                            <i className={cfg.icon}></i>
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium text-gray-800">{tx.description}</p>
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cfg.bg} ${cfg.text}`}>{cfg.label}</span>
                            </div>
                            <p className="text-xs text-gray-400 mt-0.5">
                              {new Date(tx.created_at).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                            </p>
                          </div>
                        </div>
                        <span className={`text-sm font-bold shrink-0 ml-4 ${tx.points > 0 ? "text-emerald-600" : "text-rose-500"}`}>
                          {tx.points > 0 ? "+" : ""}{tx.points} pts
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ===== PURCHASES TAB ===== */}
        {activeTab === "purchases" && (user || (isPhoneMode && linkedProfileId)) && (
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center text-rose-600 shrink-0">
                <i className="ri-receipt-line text-lg"></i>
              </div>
              <div>
                <h2 className="font-bold text-gray-900">Historial de compras</h2>
                <p className="text-sm text-gray-500">Todas tus transacciones</p>
              </div>
            </div>
            {loadingPurchases ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-6 h-6 border-2 border-rose-300 border-t-rose-600 rounded-full animate-spin" />
              </div>
            ) : purchases.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-4">
                  <i className="ri-shopping-bag-line text-2xl text-gray-300"></i>
                </div>
                <p className="text-gray-500 font-medium">Sin compras todavía</p>
                <p className="text-sm text-gray-400 mt-1">Tus compras aparecerán aquí después de completar un pago.</p>
                <Link to="/#tecnicas" className="inline-block mt-4 px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold rounded-full transition-colors cursor-pointer whitespace-nowrap">
                  Explorar cursos
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {purchases.map((p) => (
                  <div key={p.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center text-rose-500 shrink-0">
                        <i className="ri-graduation-cap-line text-base"></i>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 text-sm">{PRODUCT_NAME[p.product_id] ?? p.product_id}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{formatDate(p.created_at)}</p>
                        {p.session_id && (
                          <p className="text-xs text-gray-300 mt-0.5 font-mono truncate max-w-xs">{p.session_id}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-4 sm:flex-col sm:items-end">
                      <span className="text-base font-bold text-gray-900">{formatAmount(p.amount_total, p.currency)}</span>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${p.status === "completed" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                        {p.status === "completed" ? <><i className="ri-check-line mr-1"></i>Completado</> : p.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ===== BONOS TAB ===== */}
        {activeTab === "bonos" && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center text-rose-500 shrink-0">
                    <i className="ri-ticket-line text-lg"></i>
                  </div>
                  <div>
                    <h2 className="font-bold text-gray-900">Mis Bonos de Sesiones</h2>
                    <p className="text-sm text-gray-500">Saldo de sesiones prepagadas y vigencia</p>
                  </div>
                </div>
                <Link
                  to="/suscripciones"
                  className="px-5 py-2.5 bg-rose-500 hover:bg-rose-600 text-white text-sm font-bold rounded-xl transition-all shadow-md shadow-rose-200 flex items-center justify-center gap-2 cursor-pointer w-full sm:w-auto text-center"
                >
                  <i className="ri-plus-line"></i>
                  Comprar Bono
                </Link>
              </div>

              {loadingSubscriptions ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-6 h-6 border-2 border-rose-300 border-t-rose-600 rounded-full animate-spin" />
                </div>
              ) : subscriptions.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-gray-200 rounded-2xl bg-gray-50/30">
                  <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-4">
                    <i className="ri-ticket-line text-2xl text-gray-300 font-light"></i>
                  </div>
                  <p className="text-gray-500 font-medium">Aún no tienes ningún bono contratado</p>
                  <p className="text-sm text-gray-400 mt-1 max-w-sm mx-auto">Consigue descuentos de hasta el 25% y asegura tus citas fijas en agenda comprando un bono trimestral, semestral o anual.</p>
                  <Link to="/suscripciones" className="inline-block mt-4 px-5 py-2.5 bg-rose-500 hover:bg-rose-600 text-white text-sm font-bold rounded-xl transition-colors cursor-pointer">
                    Ver Planes Disponibles
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {subscriptions.map((sub) => {
                    const sessionsLeft = sub.sessions_total - sub.sessions_used;
                    const isExpired = new Date(sub.end_date) < new Date();
                    const isPaused = sub.status === "paused";
                    const isCancelled = sub.status === "cancelled";
                    
                    let statusLabel = "Activo";
                    let statusColor = "bg-emerald-100 text-emerald-800 border-emerald-200";
                    if (isPaused) {
                      statusLabel = "Pausado";
                      statusColor = "bg-amber-100 text-amber-800 border-amber-200";
                    } else if (isExpired) {
                      statusLabel = "Caducado";
                      statusColor = "bg-slate-100 text-slate-500 border-slate-200";
                    } else if (isCancelled) {
                      statusLabel = "Cancelado";
                      statusColor = "bg-rose-100 text-rose-800 border-rose-200";
                    }

                    // Calculate progress percentage
                    const progressPercent = Math.min(100, (sub.sessions_used / sub.sessions_total) * 100);

                    // Formulate WhatsApp pause/help text
                    const waText = `Hola, soy cliente de CALUATNAILS. Tengo contratado el bono "${sub.subscription_plans?.name || 'Bono'}" y me gustaría solicitar una consulta o gestionar una pausa por vacaciones.`;
                    const waUrl = `https://wa.me/34636689101?text=${encodeURIComponent(waText)}`;

                    return (
                      <div key={sub.id} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden flex flex-col justify-between">
                        {/* Decorative background circle */}
                        <div className="absolute -right-6 -top-6 w-20 h-20 bg-rose-50 rounded-full pointer-events-none opacity-40"></div>
                        
                        <div>
                          <div className="flex justify-between items-start gap-2 mb-3">
                            <div>
                              <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${statusColor}`}>
                                {statusLabel}
                              </span>
                              <h3 className="font-bold text-gray-900 mt-2 text-base leading-tight">
                                {sub.subscription_plans?.name || "Bono de Sesiones"}
                              </h3>
                            </div>
                          </div>

                          <p className="text-xs text-gray-400 mb-4">
                            Pago Único: <span className="font-semibold text-gray-700">{sub.subscription_plans?.total_price || 0}€</span> · Duración: {sub.subscription_plans?.duration_months || 0} meses
                          </p>

                          {/* Session status tracker */}
                          <div className="bg-slate-50 rounded-xl p-3 mb-4 border border-slate-100">
                            <div className="flex justify-between items-end mb-2">
                              <span className="text-xs text-slate-400 uppercase tracking-widest font-bold">Sesiones consumidas</span>
                              <span className="text-sm font-bold text-slate-900">
                                {sub.sessions_used} <span className="text-xs text-slate-400 font-normal">de {sub.sessions_total}</span>
                              </span>
                            </div>
                            
                            {/* Progress bar */}
                            <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden mb-2">
                              <div className="h-full bg-rose-500 rounded-full transition-all duration-500" style={{ width: `${progressPercent}%` }}></div>
                            </div>
                            
                            <div className="flex justify-between text-xs mt-1">
                              <span className="text-slate-400">Restan:</span>
                              <span className={`font-bold ${sessionsLeft > 0 ? "text-emerald-600" : "text-rose-500"}`}>
                                {sessionsLeft} sesiones
                              </span>
                            </div>
                          </div>

                          {/* Dates */}
                          <div className="space-y-1.5 text-xs text-gray-500 mb-4">
                            <p className="flex items-center gap-1.5">
                              <i className="ri-calendar-line text-gray-400"></i>
                              <span>Vence el: <strong>{new Date(sub.end_date).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" })}</strong></span>
                            </p>
                            <p className="flex items-center gap-1.5">
                              <i className="ri-time-line text-gray-400"></i>
                              <span>Alta: {new Date(sub.start_date).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" })}</span>
                            </p>
                            {sub.paused_days > 0 && (
                              <p className="flex items-center gap-1.5 text-amber-600 font-medium">
                                <i className="ri-pause-circle-line"></i>
                                <span>Pausado por vacaciones: {sub.paused_days} días acumulados</span>
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="border-t border-gray-100 pt-4 mt-auto flex gap-2">
                          <Link
                            to="/reservar"
                            className={`flex-1 py-2 rounded-xl text-xs font-bold text-center transition-all ${
                              sessionsLeft > 0 && !isExpired && !isPaused && !isCancelled
                                ? "bg-rose-500 hover:bg-rose-600 text-white shadow-sm"
                                : "bg-gray-100 text-gray-400 pointer-events-none cursor-not-allowed"
                            }`}
                          >
                            Reservar con Bono
                          </Link>
                          <a
                            href={waUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-2 border border-gray-200 hover:border-gray-300 text-gray-600 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1"
                          >
                            <i className="ri-whatsapp-line text-emerald-500 text-sm"></i>
                            Pausar / Ayuda
                          </a>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ===== CLIENT BOOKINGS TAB ===== */}
        {activeTab === "reservas" && <ClientBookingsTab clientPhone={displayPhone || undefined} />}

        {/* ===== REFERRAL TAB ===== */}
        {activeTab === "referidos" && <ReferralTab clientPhone={isPhoneMode ? clientPhone : undefined} clientAccountId={isPhoneMode ? clientAccount?.id : undefined} />}

        {/* ===== SECURITY TAB ===== */}
        {activeTab === "seguridad" && (
          <div className="space-y-6">
            {isPhoneMode && clientAccount ? (
              <SecurityTab clientAccount={clientAccount} />
            ) : user ? (
              <FullUserSecurityView user={user} />
            ) : (
              <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
                <i className="ri-shield-user-line text-4xl text-gray-200 block mb-4"></i>
                <p className="text-gray-500 font-medium">Inicia sesión para ver los ajustes de seguridad</p>
              </div>
            )}
          </div>
        )}

        {/* ===== AGENDA TAB ===== */}
        {activeTab === "agenda" && isProfessional && (
          <ProAgendaTab />
        )}

        {/* ===== PROFESIONAL TAB ===== */}
        {activeTab === "profesional" && isProfessional && user && (
          <div className="space-y-6">
            {proToast && (
              <div className="bg-emerald-500 text-white px-5 py-3 rounded-xl text-sm font-medium flex items-center gap-2">
                <i className="ri-check-line"></i>{proToast}
              </div>
            )}

            <div className="bg-gradient-to-r from-amber-400 to-orange-400 rounded-2xl p-6 text-white flex items-center gap-4">
              <div className="w-14 h-14 flex items-center justify-center bg-white/20 rounded-xl shrink-0">
                <i className="ri-star-fill text-2xl"></i>
              </div>
              <div>
                <h2 className="text-xl font-bold">Perfil Profesional</h2>
                <p className="text-sm opacity-90">Apareces en la página pública de profesionales CALUATNAILS</p>
                <a href="/profesionales" target="_blank" rel="noopener noreferrer" className="text-xs underline opacity-80 hover:opacity-100 cursor-pointer">
                  Ver página de profesionales →
                </a>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h3 className="font-bold text-gray-900 mb-5 flex items-center gap-2">
                <i className="ri-edit-line text-rose-500"></i> Editar mi perfil
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Biografía</label>
                  <textarea
                    value={proProfile?.bio ?? ""}
                    onChange={(e) => setProProfile((p) => p ? { ...p, bio: e.target.value } : p)}
                    placeholder="Cuéntanos sobre ti, tu experiencia y estilo..."
                    rows={4}
                    maxLength={500}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-rose-400 focus:ring-2 focus:ring-rose-100 outline-none text-sm resize-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Especialidades <span className="text-gray-400 font-normal">(separadas por coma)</span></label>
                  <input
                    type="text"
                    value={proProfile?.specialties ?? ""}
                    onChange={(e) => setProProfile((p) => p ? { ...p, specialties: e.target.value } : p)}
                    placeholder="Ej: Nail art, Gel, Acrílico, Manicura rusa"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-rose-400 focus:ring-2 focus:ring-rose-100 outline-none text-sm transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Instagram <span className="text-gray-400 font-normal">(opcional)</span></label>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400 text-sm">@</span>
                    <input
                      type="text"
                      value={proProfile?.instagram ?? ""}
                      onChange={(e) => setProProfile((p) => p ? { ...p, instagram: e.target.value } : p)}
                      placeholder="tu_usuario"
                      className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:border-rose-400 focus:ring-2 focus:ring-rose-100 outline-none text-sm transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                    Dirección donde atiendes <span className="text-gray-400 font-normal">(visible para clientes)</span>
                  </label>
                  <div className="relative">
                    <i className="ri-map-pin-line absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>
                    <input
                      type="text"
                      value={proProfile?.address ?? ""}
                      onChange={(e) => setProProfile((p) => p ? { ...p, address: e.target.value } : p)}
                      placeholder="Ej: Calle Gran Vía 45, Madrid"
                      className="w-full pl-9 pr-4 py-3 rounded-xl border border-gray-200 focus:border-rose-400 focus:ring-2 focus:ring-rose-100 outline-none text-sm transition-all"
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-1.5 flex items-center gap-1">
                    <i className="ri-information-line"></i>
                    Los clientes verán esta dirección con un botón para abrir Google Maps
                  </p>
                </div>
                <button
                  onClick={handleSavePro}
                  disabled={proSaving}
                  className="w-full py-3 bg-rose-500 hover:bg-rose-600 disabled:opacity-60 text-white font-semibold rounded-xl transition-colors cursor-pointer whitespace-nowrap flex items-center justify-center gap-2"
                >
                  {proSaving ? <><i className="ri-loader-4-line animate-spin"></i>Guardando...</> : <><i className="ri-save-line"></i>Guardar perfil</>}
                </button>
              </div>
            </div>

            <ProReviewsSection userId={user.id} />
          </div>
        )}

      </main>
    </div>
  );
}

interface ProReview {
  id: string;
  reviewer_name: string;
  rating: number;
  comment: string | null;
  created_at: string;
  pro_reply: string | null;
  pro_reply_at: string | null;
}

function ProReviewsSection({ userId }: { userId: string }) {
  const [reviews, setReviews] = useState<ProReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyingId, setReplyingId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [savingReply, setSavingReply] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data: pro } = await supabase.from("professional_profiles").select("id").eq("user_id", userId).maybeSingle();
      if (!pro) { setLoading(false); return; }
      const { data: revs } = await supabase
        .from("professional_reviews")
        .select("id, reviewer_name, rating, comment, created_at, pro_reply, pro_reply_at")
        .eq("professional_id", pro.id)
        .order("created_at", { ascending: false });
      setReviews((revs ?? []) as ProReview[]);
      setLoading(false);
    };
    load();
  }, [userId]);

  const handleStartReply = (rev: ProReview) => {
    setReplyingId(rev.id);
    setReplyText(rev.pro_reply ?? "");
  };

  const handleSaveReply = async (reviewId: string) => {
    if (!replyText.trim()) return;
    setSavingReply(true);
    const { error } = await supabase
      .from("professional_reviews")
      .update({ pro_reply: replyText.trim(), pro_reply_at: new Date().toISOString() })
      .eq("id", reviewId);
    if (!error) {
      setReviews(prev => prev.map(r => r.id === reviewId
        ? { ...r, pro_reply: replyText.trim(), pro_reply_at: new Date().toISOString() }
        : r
      ));
      setReplyingId(null);
      setReplyText("");
    }
    setSavingReply(false);
  };

  const handleDeleteReply = async (reviewId: string) => {
    await supabase
      .from("professional_reviews")
      .update({ pro_reply: null, pro_reply_at: null })
      .eq("id", reviewId);
    setReviews(prev => prev.map(r => r.id === reviewId
      ? { ...r, pro_reply: null, pro_reply_at: null }
      : r
    ));
  };

  const avg = reviews.length > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-5">
        <h3 className="font-bold text-gray-900 flex items-center gap-2">
          <i className="ri-star-line text-amber-400"></i> Mis reseñas recibidas
        </h3>
        {reviews.length > 0 && (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-0.5">
              {[1,2,3,4,5].map(s => <i key={s} className={`text-sm ${s <= Math.round(avg) ? "ri-star-fill text-amber-400" : "ri-star-line text-gray-200"}`}></i>)}
            </div>
            <span className="text-sm font-bold text-gray-700">{avg.toFixed(1)}</span>
            <span className="text-xs text-gray-400">({reviews.length} reseñas)</span>
          </div>
        )}
      </div>
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="w-5 h-5 border-2 border-rose-300 border-t-rose-600 rounded-full animate-spin" />
        </div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-8">
          <i className="ri-star-line text-3xl text-gray-200 block mb-2"></i>
          <p className="text-gray-400 text-sm">Aún no tienes reseñas</p>
          <p className="text-xs text-gray-300 mt-1">Tus clientes podrán dejarte reseñas desde la página de profesionales</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((rev) => (
            <div key={rev.id} className="border border-gray-100 rounded-xl p-4">
              <div className="flex items-start justify-between mb-1.5">
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{rev.reviewer_name}</p>
                  <div className="flex items-center gap-0.5 mt-0.5">
                    {[1,2,3,4,5].map(s => <i key={s} className={`text-sm ${s <= rev.rating ? "ri-star-fill text-amber-400" : "ri-star-line text-gray-200"}`}></i>)}
                  </div>
                </div>
                <span className="text-xs text-gray-400">{new Date(rev.created_at).toLocaleDateString("es-ES", { day: "numeric", month: "short" })}</span>
              </div>
              {rev.comment && <p className="text-sm text-gray-600 mb-3">{rev.comment}</p>}

              {rev.pro_reply && replyingId !== rev.id && (
                <div className="mt-3 ml-4 pl-3 border-l-2 border-rose-200 bg-rose-50/50 rounded-r-xl p-3">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs font-semibold text-rose-600 flex items-center gap-1">
                      <i className="ri-reply-line"></i> Tu respuesta
                    </p>
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleStartReply(rev)} className="text-xs text-gray-400 hover:text-rose-500 cursor-pointer transition-colors">
                        <i className="ri-edit-line"></i> Editar
                      </button>
                      <button onClick={() => handleDeleteReply(rev.id)} className="text-xs text-gray-400 hover:text-red-500 cursor-pointer transition-colors">
                        <i className="ri-delete-bin-line"></i>
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-gray-700">{rev.pro_reply}</p>
                </div>
              )}

              {replyingId === rev.id ? (
                <div className="mt-3 ml-4 pl-3 border-l-2 border-rose-300">
                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Escribe tu respuesta a esta reseña..."
                    rows={3}
                    maxLength={500}
                    className="w-full px-3 py-2.5 rounded-xl border border-rose-200 focus:border-rose-400 focus:ring-2 focus:ring-rose-100 outline-none text-sm resize-none transition-all"
                  />
                  <div className="flex gap-2 mt-2">
                    <button onClick={() => { setReplyingId(null); setReplyText(""); }} className="px-4 py-1.5 rounded-full border border-gray-200 text-xs font-medium text-gray-600 cursor-pointer hover:bg-gray-50 transition-colors whitespace-nowrap">
                      Cancelar
                    </button>
                    <button
                      onClick={() => handleSaveReply(rev.id)}
                      disabled={savingReply || !replyText.trim()}
                      className="px-4 py-1.5 rounded-full bg-rose-500 hover:bg-rose-600 text-white text-xs font-semibold cursor-pointer disabled:opacity-50 transition-colors flex items-center gap-1.5 whitespace-nowrap"
                    >
                      {savingReply ? <><i className="ri-loader-4-line animate-spin"></i>Guardando...</> : <><i className="ri-send-plane-line"></i>Publicar respuesta</>}
                    </button>
                  </div>
                </div>
              ) : !rev.pro_reply && (
                <button onClick={() => handleStartReply(rev)} className="mt-2 flex items-center gap-1.5 text-xs text-gray-400 hover:text-rose-500 cursor-pointer transition-colors">
                  <i className="ri-reply-line"></i> Responder a esta reseña
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function FullUserSecurityView({ user }: { user: any }) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }
    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess(false);

    const { error: updateError } = await supabase.auth.updateUser({
      password: password
    });

    setSaving(false);
    if (updateError) {
      setError(updateError.message);
    } else {
      setSuccess(true);
      setPassword("");
      setConfirmPassword("");
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-gray-700 to-gray-900 rounded-2xl p-6 text-white flex items-center gap-4">
        <div className="w-14 h-14 flex items-center justify-center bg-white/20 rounded-xl shrink-0">
          <i className="ri-shield-keyhole-line text-2xl"></i>
        </div>
        <div>
          <h2 className="text-xl font-bold">Seguridad de la cuenta</h2>
          <p className="text-sm opacity-90">Gestiona tu contraseña y seguridad</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <h3 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
          <i className="ri-lock-password-line text-rose-500"></i> Cambiar contraseña
        </h3>
        <p className="text-sm text-gray-500 mb-6">
          Introduce una nueva contraseña segura para tu cuenta.
        </p>

        {error && (
          <div className="bg-rose-50 border border-rose-200 rounded-xl px-4 py-3 text-sm text-rose-700 flex items-center gap-2 mb-4">
            <i className="ri-error-warning-line shrink-0"></i>{error}
          </div>
        )}

        {success && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 text-sm text-emerald-700 flex items-center gap-2 mb-4">
            <i className="ri-checkbox-circle-line shrink-0"></i>¡Contraseña actualizada correctamente!
          </div>
        )}

        <form onSubmit={handleUpdatePassword} className="space-y-4 max-w-sm">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Nueva contraseña</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              required
              minLength={6}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-rose-400 focus:ring-2 focus:ring-rose-100 outline-none text-sm transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Confirmar contraseña</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder="Repite la contraseña"
              required
              minLength={6}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-rose-400 focus:ring-2 focus:ring-rose-100 outline-none text-sm transition-all"
            />
          </div>
          <button
            type="submit"
            disabled={saving || !password.trim()}
            className="w-full py-3 bg-gray-900 hover:bg-black disabled:opacity-60 text-white font-semibold rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-2"
          >
            {saving
              ? <><i className="ri-loader-4-line animate-spin"></i>Actualizando...</>
              : <><i className="ri-save-line"></i>Actualizar contraseña</>
            }
          </button>
        </form>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <h3 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
          <i className="ri-mail-line text-teal-500"></i> Email de la cuenta
        </h3>
        <p className="text-sm text-gray-500 mb-4">
          Tu cuenta está vinculada a: <strong>{user.email}</strong>
        </p>
        <p className="text-xs text-gray-400">
          Para cambiar tu email, por favor contacta con soporte técnico.
        </p>
      </div>
    </div>
  );
}

function EditProfileModal({
  isOpen,
  onClose,
  currentName,
  currentBirthday,
  currentEmail,
  currentPhone,
  isPhoneMode,
  profileId,
  clientAccountId,
  onUpdate
}: {
  isOpen: boolean;
  onClose: () => void;
  currentName: string;
  currentBirthday: string;
  currentEmail: string;
  currentPhone: string;
  isPhoneMode: boolean;
  profileId?: string;
  clientAccountId?: string;
  onUpdate: () => void;
}) {
  const [name, setName] = useState(currentName);
  const [birthday, setBirthday] = useState(currentBirthday);
  const [email, setEmail] = useState(currentEmail);
  const [phone, setPhone] = useState(currentPhone);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    setName(currentName);
    setBirthday(currentBirthday);
    setEmail(currentEmail);
    setPhone(currentPhone);
    setError("");
    setSuccess("");
  }, [currentName, currentBirthday, currentEmail, currentPhone, isOpen]);

  if (!isOpen) return null;

  const emailChanged = email.trim().toLowerCase() !== currentEmail.trim().toLowerCase();
  const phoneChanged = phone.trim() !== currentPhone.trim() && phone.trim() !== "";

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const trimmedPhone = phone.trim() || null;
      const trimmedEmail = email.trim() || null;

      if (phoneChanged && trimmedPhone) {
        const { data: phoneTaken } = await supabase
          .from('client_accounts')
          .select('id')
          .neq('id', clientAccountId ?? '')
          .eq('phone', trimmedPhone)
          .maybeSingle();

        if (!phoneTaken) {
          const { data: profilePhoneTaken } = await supabase
            .from('profiles')
            .select('id')
            .neq('id', profileId ?? '')
            .eq('phone', trimmedPhone)
            .maybeSingle();
          if (profilePhoneTaken) {
            setError("Este teléfono ya está vinculado a otro perfil.");
            setSaving(false);
            return;
          }
        } else {
          setError("Este teléfono ya está vinculado a otra cuenta.");
          setSaving(false);
          return;
        }
      }

      if (profileId) {
        const [profileRes] = await Promise.all([
          supabase
            .from('profiles')
            .update({ name, birthday, phone: trimmedPhone })
            .eq('id', profileId),
          supabase.auth.updateUser({ data: { name } }),
        ]);
        if (profileRes.error) throw profileRes.error;

        if (clientAccountId) {
          await supabase
            .from('client_accounts')
            .update({ name, birthday, updated_at: new Date().toISOString() })
            .eq('id', clientAccountId);
        }

        if (emailChanged && trimmedEmail) {
          const { error: emailErr } = await supabase.auth.updateUser({ email: trimmedEmail });
          if (emailErr) throw emailErr;
          setSuccess("Se ha enviado un enlace de confirmación a " + trimmedEmail + ". Revisa tu bandeja de entrada para verificar el cambio de email.");
          setSaving(false);
          onUpdate();
          return;
        }
      } else if (clientAccountId) {
        const { error: err } = await supabase
          .from('client_accounts')
          .update({ name, birthday, email: trimmedEmail, phone: trimmedPhone, updated_at: new Date().toISOString() })
          .eq('id', clientAccountId);
        if (err) throw err;
      }

      onUpdate();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-[2.5rem] w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in duration-300">
        <div className="p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Editar Perfil</h2>
            <button onClick={onClose} className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition-colors">
              <i className="ri-close-line text-xl"></i>
            </button>
          </div>

          {error && (
            <div className="bg-rose-50 border border-rose-100 rounded-2xl px-4 py-3 text-xs font-bold text-rose-500 mb-6 flex items-center gap-2">
              <i className="ri-error-warning-line"></i> {error}
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-5">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Nombre Completo</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Tu nombre"
                required
                className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-transparent focus:bg-white focus:border-rose-200 outline-none text-sm font-bold text-slate-700 transition-all"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Teléfono</label>
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="+34 600 000 000"
                readOnly={isPhoneMode}
                className={`w-full px-5 py-4 rounded-2xl border border-transparent outline-none text-sm font-bold transition-all ${
                  isPhoneMode ? "bg-slate-100 text-slate-400" : "bg-slate-50 focus:bg-white focus:border-rose-200 text-slate-700"
                }`}
              />
              {isPhoneMode && (
                <p className="text-[10px] text-slate-400 mt-2 ml-1">
                  El teléfono es tu método de acceso y no se puede cambiar aquí
                </p>
              )}
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Correo Electrónico</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="tu@email.com"
                className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-transparent focus:bg-white focus:border-rose-200 outline-none text-sm font-bold text-slate-700 transition-all"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Fecha de Nacimiento</label>
              <input
                type="date"
                value={birthday}
                onChange={e => setBirthday(e.target.value)}
                className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-transparent focus:bg-white focus:border-rose-200 outline-none text-sm font-bold text-slate-700 transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full py-5 bg-rose-500 hover:bg-rose-600 disabled:opacity-50 text-white font-black rounded-2xl shadow-xl shadow-rose-200 transition-all active:scale-95 flex items-center justify-center gap-2 mt-4"
            >
              {saving ? <i className="ri-loader-4-line animate-spin text-xl"></i> : <i className="ri-save-line text-xl"></i>}
              <span>{saving ? 'Guardando...' : 'Guardar Cambios'}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
