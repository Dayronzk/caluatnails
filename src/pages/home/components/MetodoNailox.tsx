import { useNavigate } from "react-router-dom";

const STEPS = [
  {
    letter: "N",
    title: "Nivelación",
    subtitle: "Base perfecta para que todo funcione",
    items: ["Preparación de la uña", "Higiene", "Herramientas correctas"],
    color: "from-rose-50 to-pink-50",
    accent: "text-rose-500",
    border: "border-rose-200",
    dot: "bg-rose-400",
  },
  {
    letter: "A",
    title: "Aplicación",
    subtitle: "Técnica limpia y profesional",
    items: ["Acrílico / gel / semipermanente", "Control del producto", "Evitar burbujas y errores"],
    color: "from-fuchsia-50 to-rose-50",
    accent: "text-fuchsia-500",
    border: "border-fuchsia-200",
    dot: "bg-fuchsia-400",
  },
  {
    letter: "I",
    title: "Imagen",
    subtitle: "El acabado que vende",
    items: ["Forma", "Brillo", "Estética profesional"],
    color: "from-pink-50 to-rose-50",
    accent: "text-pink-500",
    border: "border-pink-200",
    dot: "bg-pink-400",
  },
  {
    letter: "L",
    title: "Longevidad",
    subtitle: "Durabilidad del trabajo",
    items: ["Sellado correcto", "Evitar levantamientos", "Mantenimiento"],
    color: "from-rose-50 to-fuchsia-50",
    accent: "text-rose-600",
    border: "border-rose-200",
    dot: "bg-rose-500",
  },
  {
    letter: "O",
    title: "Oferta",
    subtitle: "Convertir habilidad en dinero",
    items: ["Cómo poner precios", "Qué servicios ofrecer", "Diferenciarte"],
    color: "from-amber-50 to-rose-50",
    accent: "text-amber-600",
    border: "border-amber-200",
    dot: "bg-amber-400",
  },
  {
    letter: "X",
    title: "Expansión",
    subtitle: "Escalar ingresos",
    items: ["Conseguir clientes", "Redes sociales", "Repetición y fidelización"],
    color: "from-rose-50 to-orange-50",
    accent: "text-rose-700",
    border: "border-rose-300",
    dot: "bg-rose-600",
    highlight: true,
  },
];

export default function MetodoNailox() {
  const navigate = useNavigate();

  const handleScroll = () => {
    const el = document.getElementById("tienda");
    if (el) el.scrollIntoView({ behavior: "smooth" });
    else navigate("/login");
  };

  return (
    <section className="w-full bg-white py-20 px-4">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="text-center mb-14">
          <span className="inline-block text-xs font-semibold tracking-widest uppercase text-rose-400 mb-3">
            Metodología exclusiva
          </span>
          <h2 className="font-playfair text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            El Método{" "}
            <span className="text-rose-500">N.A.I.L.O.X</span>
          </h2>
          <p className="text-gray-500 text-base max-w-xl mx-auto leading-relaxed">
            Un sistema de 6 pilares diseñado para llevarte de cero a profesional con estructura, claridad y resultados reales.
          </p>
        </div>

        {/* Steps grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 mb-12">
          {STEPS.map((step, idx) => (
            <div
              key={step.letter}
              className={`relative rounded-2xl border ${step.border} bg-gradient-to-b ${step.color} p-5 flex flex-col gap-3 ${(step as any).highlight ? "ring-2 ring-rose-400/40" : ""}`}
            >
              {/* Step number */}
              <span className="absolute top-3 right-4 text-xs font-bold text-gray-300">
                0{idx + 1}
              </span>

              {/* Highlight badge for X */}
              {(step as any).highlight && (
                <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-rose-600 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full tracking-wide whitespace-nowrap">
                  🔥 Nivel Pro
                </span>
              )}

              {/* Letter badge */}
              <div className={`w-10 h-10 flex items-center justify-center rounded-xl ${(step as any).highlight ? "bg-rose-600 border-rose-600" : `bg-white border ${step.border}`}`}>
                <span className={`font-playfair text-xl font-bold ${(step as any).highlight ? "text-white" : step.accent}`}>{step.letter}</span>
              </div>

              {/* Title */}
              <div>
                <h3 className={`font-semibold text-sm ${step.accent}`}>{step.title}</h3>
                <p className="text-gray-500 text-xs mt-0.5 leading-snug">{step.subtitle}</p>
              </div>

              {/* Items */}
              <ul className="flex flex-col gap-1.5 mt-1">
                {step.items.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className={`mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0 ${step.dot}`}></span>
                    <span className="text-gray-600 text-xs leading-snug">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="flex flex-col items-center gap-4">
          <p className="text-gray-400 text-sm">
            Todo esto está incluido en el curso — paso a paso, desde el primer módulo.
          </p>
          <button
            onClick={handleScroll}
            className="inline-flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold px-8 py-3.5 rounded-full transition-all cursor-pointer whitespace-nowrap text-sm"
          >
            <i className="ri-play-circle-fill text-base"></i>
            Quiero aprender el método completo
          </button>
        </div>

      </div>
    </section>
  );
}
