import { useState } from "react";
import { Sparkles, Camera, MapPin, ExternalLink } from "lucide-react";

const GALLERY_IMAGES = [
  {
    url: "/assets/salon-interior.jpg",
    title: "Atelier Caluatnails — Recepción & Ambiente",
    category: "Instalaciones",
    desc: "Un rincón de serenidad y diseño nórdico-orgánico en Calle Padilla 301, Barcelona.",
  },
  {
    url: "/assets/salon-puestos.jpg",
    title: "Puestos de Manicura & Pedicura Spa",
    category: "Espacio",
    desc: "Estaciones equipadas con aparatología milimétrica y máxima esterilización higiénica.",
  },
  {
    url: "/assets/manicure-premium.png",
    title: "Manicura Rusa con Nivelación",
    category: "Manicura",
    desc: "Limpieza precisa de cutícula con torno y refuerzo con gel estructurante biocompatible.",
  },
  {
    url: "/assets/manicure-pastel.jpg",
    title: "Esmaltado Semipermanente & Micro-Nail Art",
    category: "Diseño",
    desc: "Tonos pastel pigmentados con acabado de brillo espejo de larga duración.",
  },
  {
    url: "/assets/pedicure-luxury.jpg",
    title: "Pedicura Spa Holística",
    category: "Pedicura",
    desc: "Baño de sales aromáticas, tratamiento de durezas y exfoliación profunda.",
  },
  {
    url: "/assets/extensions-premium.png",
    title: "Lifting de Pestañas & Diseño de Cejas",
    category: "Mirada",
    desc: "Elevación con queratina y visajismo personalizado con depilación a hilo orgánico.",
  },
];

export default function GaleriaHome() {
  const [activeImg, setActiveImg] = useState<string | null>(null);

  return (
    <section className="py-20 bg-white relative">
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-14">
          <div className="max-w-2xl space-y-3">
            <span className="inline-flex items-center gap-2 text-rose-600 text-xs font-bold tracking-widest uppercase bg-rose-50 px-4 py-1.5 rounded-full border border-rose-100/70 shadow-soft-xs">
              <Camera className="w-3.5 h-3.5" /> Galería Fotográfica del Atelier
            </span>
            <h2 className="font-playfair text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 leading-tight">
              Conoce las instalaciones y <br />
              <span className="bg-gradient-to-r from-rose-500 to-pink-600 bg-clip-text text-transparent">
                nuestros acabados reales
              </span>
            </h2>
          </div>

          <div className="flex items-center gap-2 text-xs font-bold text-gray-500 bg-gray-50 px-4 py-2.5 rounded-2xl border border-gray-100">
            <MapPin className="w-4 h-4 text-rose-500" />
            <span>Calle Padilla 301, 08025 Barcelona (Eixample)</span>
          </div>
        </div>

        {/* Masonry / Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {GALLERY_IMAGES.map((item, index) => (
            <div
              key={index}
              onClick={() => setActiveImg(item.url)}
              className="group relative rounded-[2rem] overflow-hidden bg-gray-100 border border-gray-100 shadow-soft-xs cursor-pointer hover:shadow-soft-lg hover:-translate-y-1 transition-all duration-500 aspect-[4/3]"
            >
              <img
                src={item.url}
                alt={item.title}
                className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
                onError={(e) => { (e.currentTarget as HTMLImageElement).src = "/assets/manicure-premium.png"; }}
              />

              {/* Overlay Gradient & Captions */}
              <div className="absolute inset-0 bg-gradient-to-t from-gray-950/80 via-gray-950/20 to-transparent opacity-80 group-hover:opacity-95 transition-opacity" />

              <div className="absolute inset-0 p-6 flex flex-col justify-end text-white">
                <span className="inline-block text-[10px] font-extrabold tracking-widest uppercase text-rose-300 bg-rose-950/60 px-3 py-1 rounded-full w-fit mb-2 border border-rose-400/30 backdrop-blur-md">
                  {item.category}
                </span>
                <h3 className="font-playfair text-lg font-bold text-white leading-snug group-hover:text-rose-200 transition-colors">
                  {item.title}
                </h3>
                <p className="text-white/70 text-xs mt-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300 font-medium">
                  {item.desc}
                </p>
              </div>
            </div>
          ))}
        </div>

      </div>

      {/* Lightbox Modal */}
      {activeImg && (
        <div
          onClick={() => setActiveImg(null)}
          className="fixed inset-0 z-[300] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 cursor-pointer animate-in fade-in duration-200"
        >
          <div className="relative max-w-4xl w-full max-h-[90vh] rounded-3xl overflow-hidden shadow-2xl">
            <img
              src={activeImg}
              alt="Caluatnails vista ampliada"
              className="w-full h-full object-contain max-h-[85vh] mx-auto rounded-3xl"
            />
            <button
              onClick={() => setActiveImg(null)}
              className="absolute top-4 right-4 bg-white/20 hover:bg-white/40 text-white w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-md transition-colors"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
