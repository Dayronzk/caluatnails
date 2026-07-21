import { useEffect, useState } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { useSEO } from "@/hooks/useSEO";
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import FilosofiaHome from "./components/FilosofiaHome";
import ServiciosHome from "./components/ServiciosHome";
import EquipoHome from "./components/EquipoHome";
import GaleriaHome from "./components/GaleriaHome";
import Testimonios from "./components/Testimonios";
import SeoContentHome from "./components/SeoContentHome";
import Footer from "./components/Footer";
import FloatingCart from "./components/FloatingCart";
import { useCart } from "@/hooks/useCart";
import { supabase } from "@/lib/supabase";

export default function Home() {
  useSEO({
    title: "Caluatnails | Salón de Manicura Rusa, Pedicura y Estética en Barcelona (Eixample)",
    description: "Atelier de manicura rusa con nivelación, esmaltado semipermanente, uñas de gel, pedicura spa y depilación con hilo en Calle Padilla 301, Eixample, Barcelona. Reserva tu cita online.",
    ogTitle: "CALUATNAILS — Manicura Rusa & Estética en Barcelona Eixample",
    ogDescription: "Reserva online tu cita con nuestras estilistas Karol, Eidy y Maryuri. Manicura rusa, pedicura spa, uñas en gel y lifting de pestañas.",
    canonical: "/",
    ogImage: "https://www.caluatnails.com/assets/salon-interior.jpg",
    ogUrl: "/",
    keywords: "manicura rusa barcelona, manicura nivelacion eixample, pedicura spa sagrada familia, salon de unas padilla 301, caluatnails barcelona, lifting pestanas eixample",
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
    <main className="min-h-screen w-full bg-white">
      <Navbar />

      {/* Banners de estado de pago */}
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

      {/* 1. Hero Principal */}
      <Hero />
      
      {/* 2. Filosofía de Atelier & Manicura Rusa */}
      <FilosofiaHome />

      {/* 3. Catálogo Dinámico de Servicios (35 Ofertas) */}
      <ServiciosHome />

      {/* 4. Equipo de Estilistas: Karol, Eidy y Maryuri */}
      <EquipoHome />

      {/* 5. Galería Fotográfica del Local */}
      <GaleriaHome />

      {/* 6. Testimonios Reales de Clientas (4.9 ⭐) */}
      <Testimonios />

      {/* 7. Contenido Literario SEO, Localización Eixample & FAQs */}
      <SeoContentHome />

      {/* 8. Pie de Página Completo */}
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
