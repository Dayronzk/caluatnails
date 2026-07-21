import { Sparkles, ShieldCheck, HeartHandshake, Leaf } from "lucide-react";

export default function FilosofiaHome() {
  return (
    <section className="py-20 bg-gradient-to-b from-white via-organic-cream/40 to-white relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Visual Composition with Real Salon Photos */}
          <div className="lg:col-span-5 relative">
            <div className="relative z-10 rounded-[2.5rem] overflow-hidden shadow-xl border-4 border-white bg-white">
              <img
                src="/assets/salon-puestos.jpg"
                alt="Puestos de manicura y pedicura en Caluatnails Barcelona"
                className="w-full h-80 sm:h-96 object-cover object-center transform hover:scale-105 transition-transform duration-700"
                onError={(e) => { (e.currentTarget as HTMLImageElement).src = "/assets/manicure-premium.png"; }}
              />
            </div>
            {/* Secondary Floating Image */}
            <div className="absolute -bottom-6 -right-6 z-20 w-48 h-48 rounded-[2rem] overflow-hidden shadow-2xl border-4 border-white hidden sm:block">
              <img
                src="/assets/manicure-pastel.jpg"
                alt="Detalle de manicura impecable"
                className="w-full h-full object-cover"
              />
            </div>
            {/* Decorative Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-rose-200/30 rounded-full blur-3xl -z-10" />
          </div>

          {/* Right Literary Content */}
          <div className="lg:col-span-7 space-y-6">
            <span className="inline-flex items-center gap-2 text-rose-600 text-xs font-bold tracking-widest uppercase bg-rose-50 px-4 py-1.5 rounded-full border border-rose-100/70 shadow-soft-xs">
              <Sparkles className="w-3.5 h-3.5" /> Filosofía de Atelier
            </span>

            <h2 className="font-playfair text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 leading-tight">
              Donde la alta precisión estética se encuentra con la <br />
              <span className="bg-gradient-to-r from-rose-500 to-pink-600 bg-clip-text text-transparent">
                serenidad del cuidado personal
              </span>
            </h2>

            {/* Literary Essays */}
            <div className="space-y-4 text-gray-600 text-base leading-relaxed font-medium">
              <p>
                Entender las uñas como un reflejo de cuidado y elegancia es la esencia de <strong className="text-gray-900 font-bold">Caluatnails</strong>. En nuestro salón en la Calle Padilla 301 (Eixample, Barcelona), ofrecemos una experiencia estética cuidada, relajante y personalizada.
              </p>
              <p>
                Especializadas en <strong className="text-rose-600 font-bold">manicura y pedicura semipermanente completa</strong>, aplicación de uñas de gel/acrílico y refuerzo con suplemento de fibra niveladora. Trabajamos con máximo esmero en cutículas, limado artesanal e hidratación profunda para lograr resultados duraderos e impecables.
              </p>
            </div>

            {/* Values Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
              <div className="bg-white p-4 rounded-2xl border border-rose-100/60 shadow-soft-xs space-y-1.5">
                <div className="w-8 h-8 rounded-xl bg-rose-50 flex items-center justify-center text-rose-500">
                  <ShieldCheck className="w-4.5 h-4.5" />
                </div>
                <h4 className="font-bold text-gray-900 text-sm">Higiene & Cuidado</h4>
                <p className="text-gray-500 text-xs leading-relaxed">Instrumental esterilizado y protocolos de máxima limpieza por clienta.</p>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-rose-100/60 shadow-soft-xs space-y-1.5">
                <div className="w-8 h-8 rounded-xl bg-rose-50 flex items-center justify-center text-rose-500">
                  <Leaf className="w-4.5 h-4.5" />
                </div>
                <h4 className="font-bold text-gray-900 text-sm">Esmaltes de Calidad</h4>
                <p className="text-gray-500 text-xs leading-relaxed">Pigmentos de alta fijación con acabado espejo impecable.</p>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-rose-100/60 shadow-soft-xs space-y-1.5">
                <div className="w-8 h-8 rounded-xl bg-rose-50 flex items-center justify-center text-rose-500">
                  <HeartHandshake className="w-4.5 h-4.5" />
                </div>
                <h4 className="font-bold text-gray-900 text-sm">Atención Dedicada</h4>
                <p className="text-gray-500 text-xs leading-relaxed">Asesoramiento cercano según tus gustos y necesidades.</p>
              </div>
            </div>

          </div>

        </div>
      </div>
    </section>
  );
}
