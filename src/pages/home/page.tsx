import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { useSEO } from "@/hooks/useSEO";
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import Introduccion from "./components/Introduccion";
import TecnicasAvanzadas from "./components/TecnicasAvanzadas";
import PracticaInteractiva from "./components/PracticaInteractiva";
import RecursosDescargables from "./components/RecursosDescargables";
import EvaluacionesAutomaticas from "./components/EvaluacionesAutomaticas";
import ForoDiscusion from "./components/ForoDiscusion";
import Footer from "./components/Footer";
import MetodoNailox from "./components/MetodoNailox";
import ServiciosHome from "./components/ServiciosHome";
import FloatingCart from "./components/FloatingCart";
import KitPopup from "./components/KitPopup";
import { useCart } from "@/hooks/useCart";
import type { CartItem } from "@/hooks/useCart";
import { supabase } from "@/lib/supabase";

const MAIN_PRODUCT_ID = "prod_UG5ehG9IrGh4hl";
const SUPABASE_URL = import.meta.env.VITE_PUBLIC_SUPABASE_URL as string;
const LIST_FN = `${SUPABASE_URL}/functions/v1/stripe-list-products`;

interface StripeProduct {
  id: string;
  name: string;
  images: string[];
  metadata: Record<string, string>;
  price_id: string | null;
  unit_amount: number | null;
  currency: string;
}

const HERO_FALLBACK_IMAGE = "https://readdy.ai/api/search-image?query=professional%20nail%20technician%20elegant%20manicure%20pedicure%20beauty%20salon%20warm%20rose%20gold%20lighting%20hands%20close%20up%20luxury%20spa%20pastel%20tones%20soft%20bokeh%20background&width=600&height=460&seq=hero1&orientation=landscape";

export default function Home() {
  useSEO({
    title: "Manicura y Pedicura Profesional en Barcelona (Eixample)",
    description: "Salón premium de manicura y pedicura en el Eixample, Barcelona. Especialistas en manicura con nivelación, esmaltado semipermanente, uñas en gel y pedicura spa. Reserva tu cita online.",
    ogTitle: "NAILOX — Manicura y Pedicura Profesional en Barcelona",
    ogDescription: "Salón premium en el Eixample, Barcelona. Reserva tu cita online: manicura con nivelación, semipermanente, uñas en gel y pedicura.",
    canonical: "/",
    ogImage: "https://www.nailox.com/assets/manicure-premium.png",
    ogUrl: "/",
  });

  const cart = useCart();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const location = useLocation();

  useEffect(() => {
    if (!location.hash) return;
    const id = location.hash.slice(1);
    const el = document.getElementById(id);
    if (el) {
      requestAnimationFrame(() => el.scrollIntoView({ behavior: "smooth" }));
    }
  }, [location]);

  const [paymentStatus, setPaymentStatus] = useState<"success" | "cancelled" | null>(null);
  const [showKitPopup, setShowKitPopup] = useState(false);
  const [heroProduct, setHeroProduct] = useState<CartItem | null>(null);
  const [heroPrice, setHeroPrice] = useState<number | null>(null);

  // Track if the cart was opened via the Hero "Comprar" button
  const heroCartOpened = useRef(false);
  const prevCartOpen = useRef(false);

  // Load main product price from Stripe
  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(LIST_FN, {
        headers: {
          "apikey": import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY,
          "Authorization": `Bearer ${import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY}`
        }
      });
        const data = await res.json() as { products?: StripeProduct[] };
        const main = (data.products ?? []).find(p => p.id === MAIN_PRODUCT_ID);
        if (main && main.unit_amount) {
          const priceEuros = main.unit_amount / 100;
          setHeroPrice(priceEuros);
          setHeroProduct({
            id: main.id,
            title: main.name,
            price: priceEuros,
            image: main.images?.[0] ?? HERO_FALLBACK_IMAGE,
            level: main.metadata.level ?? "Todos los niveles",
            lessonCount: parseInt(main.metadata.lesson_count ?? "80", 10),
            stripe_price_id: main.price_id,
          });
        }
      } catch {
        // fallback silently — TecnicasAvanzadas also loads products
      }
    };
    load();
  }, []);

  // Detect when cart closes after being opened by hero button
  useEffect(() => {
    if (prevCartOpen.current && !cart.isOpen && heroCartOpened.current) {
      heroCartOpened.current = false;
      setShowKitPopup(true);
    }
    prevCartOpen.current = cart.isOpen;
  }, [cart.isOpen]);

  // Capture referral code from URL and store in sessionStorage
  useEffect(() => {
    const urlRef = searchParams.get("ref");
    if (urlRef) {
      sessionStorage.setItem("nailox_ref", urlRef);
    }
  }, [searchParams]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const status = params.get("payment");
    const sessionId = params.get("session_id");

    if (status === "success") {
      setPaymentStatus("success");
      cart.clearCart();

      // Complete referral for course purchase
      const storedRef = sessionStorage.getItem("nailox_ref");
      if (storedRef && sessionId) {
        (async () => {
          const { data: referrer } = await supabase
            .from("profiles")
            .select("id")
            .eq("referral_code", storedRef)
            .maybeSingle();

          if (referrer) {
            const { data: existing } = await supabase
              .from("referrals")
              .select("id")
              .eq("referrer_id", referrer.id)
              .eq("reference_id", sessionId)
              .maybeSingle();

            if (!existing) {
              await supabase.from("referrals").insert({
                referrer_id: referrer.id,
                referred_email: null,
                referral_code: storedRef,
                event_type: "purchase",
                reference_id: sessionId,
                points_awarded: 500,
                status: "completed",
                completed_at: new Date().toISOString(),
              });

              await supabase.from("points_transactions").insert({
                user_id: referrer.id,
                points: 500,
                type: "referral_purchase",
                description: "Referido completado — compra de curso",
                reference_id: sessionId,
              });

              const { data: refProfile } = await supabase
                .from("profiles")
                .select("points")
                .eq("id", referrer.id)
                .maybeSingle();

              if (refProfile) {
                await supabase
                  .from("profiles")
                  .update({ points: (refProfile.points ?? 0) + 500 })
                  .eq("id", referrer.id);
              }

              sessionStorage.removeItem("nailox_ref");
            }
          }
        })();
      }

      navigate("/", { replace: true });
    } else if (status === "cancelled") {
      setPaymentStatus("cancelled");
      navigate("/", { replace: true });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const dismissStatus = () => setPaymentStatus(null);

  const handleHeroComprar = () => {
    if (heroProduct) {
      cart.addItem(heroProduct);
    }
    heroCartOpened.current = true;
  };

  return (
    <main className="min-h-screen w-full">
      <Navbar />

      {/* Payment status banners */}
      {paymentStatus === "success" && (
        <div className="fixed top-0 inset-x-0 z-[200] flex items-center justify-between gap-4 bg-emerald-500 text-white px-6 py-4">
          <div className="flex items-center gap-3">
            <i className="ri-check-double-line text-2xl"></i>
            <div>
              <p className="font-semibold">¡Pago completado con éxito!</p>
              <p className="text-sm text-white/80">Recibirás un correo de confirmación con acceso a tus módulos.</p>
            </div>
          </div>
          <button onClick={dismissStatus} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/20 cursor-pointer">
            <i className="ri-close-line text-lg"></i>
          </button>
        </div>
      )}
      {paymentStatus === "cancelled" && (
        <div className="fixed top-0 inset-x-0 z-[200] flex items-center justify-between gap-4 bg-amber-500 text-white px-6 py-4">
          <div className="flex items-center gap-3">
            <i className="ri-information-line text-2xl"></i>
            <p className="font-semibold">Pago cancelado. Tu carrito sigue guardado.</p>
          </div>
          <button onClick={dismissStatus} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/20 cursor-pointer">
            <i className="ri-close-line text-lg"></i>
          </button>
        </div>
      )}

      <Hero onComprar={handleHeroComprar} price={heroPrice ?? undefined} />
      
      {/* Primary Focus: Services */}
      <ServiciosHome />

      {/* Secondary Focus: Academy */}
      <div id="academia" className="scroll-mt-20">
        <MetodoNailox />
        <Introduccion />
        <TecnicasAvanzadas addItem={cart.addItem} isInCart={cart.isInCart} />
        <PracticaInteractiva />
        <RecursosDescargables />
        <EvaluacionesAutomaticas />
        <ForoDiscusion />
      </div>

      <Footer />

      <FloatingCart
        items={cart.items}
        shopItems={cart.shopItems}
        count={cart.count}
        total={cart.total}
        isOpen={cart.isOpen}
        setIsOpen={cart.setIsOpen}
        removeItem={cart.removeItem}
        removeShopItem={cart.removeShopItem}
        updateShopQty={cart.updateShopQty}
        clearCart={cart.clearCart}
        clearCourseCart={cart.clearCourseCart}
        clearShopCart={cart.clearShopCart}
      />

      {showKitPopup && (
        <KitPopup onClose={() => setShowKitPopup(false)} />
      )}
    </main>
  );
}
