import { useEffect, useState } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { useSEO } from "@/hooks/useSEO";
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import Footer from "./components/Footer";
import ServiciosHome from "./components/ServiciosHome";
import FloatingCart from "./components/FloatingCart";
import { useCart } from "@/hooks/useCart";
import { supabase } from "@/lib/supabase";



export default function Home() {
  useSEO({
    title: "Manicura y Pedicura Profesional en Barcelona (Eixample)",
    description: "Salón premium de manicura y pedicura en el Eixample, Barcelona. Especialistas en manicura con nivelación, esmaltado semipermanente, uñas en gel y pedicura spa. Reserva tu cita online.",
    ogTitle: "CALUATNAILS — Manicura y Pedicura Profesional en Barcelona",
    ogDescription: "Salón premium en el Eixample, Barcelona. Reserva tu cita online: manicura con nivelación, semipermanente, uñas en gel y pedicura.",
    canonical: "/",
    ogImage: "https://www.caluatnails.com/assets/manicure-premium.png",
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
  // Capture referral code from URL and store in sessionStorage
  useEffect(() => {
    const urlRef = searchParams.get("ref");
    if (urlRef) {
      sessionStorage.setItem("caluatnails_ref", urlRef);
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
      const storedRef = sessionStorage.getItem("caluatnails_ref");
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

              sessionStorage.removeItem("caluatnails_ref");
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
              <p className="text-sm text-white/80">Recibirás un correo de confirmación con los detalles de tu reserva.</p>
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

      <Hero />
      
      {/* Primary Focus: Services */}
      <ServiciosHome />

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
    </main>
  );
}
