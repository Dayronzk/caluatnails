import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

const REVIEWS = [
  {
    name: "Laura G.",
    service: "Manicura Rusa con Nivelación",
    rating: 5,
    text: "Increíble la precisión de Karol con el torno. Mis uñas estaban super débiles y la nivelación ha sido un antes y un después. Me duraron 4 semanas perfectas sin un solo desconchón.",
    date: "Hace 2 semanas",
  },
  {
    name: "Marta S.",
    service: "Pedicura Spa & Semipermanente",
    rating: 5,
    text: "El ambiente en el atelier de Padilla 301 es pura relajación. Eidy cuida cada detalle de los pies con una delicadeza increíble. Salí renovada y súper descansada.",
    date: "Hace 1 mes",
  },
  {
    name: "Elena R.",
    service: "Lifting de Pestañas & Tinte",
    rating: 5,
    text: "Maryuri es una artista. Es la primera vez que me hago el lifting de pestañas con queratina y el resultado es natural pero súper favorecedor. Repetiré seguro.",
    date: "Hace 3 semanas",
  },
  {
    name: "Claudia P.",
    service: "Depilación con Hilo de Cejas",
    rating: 5,
    text: "Tengo la piel muy sensible y la cera siempre me irritaba. La depilación con hilo que hacen aquí deja una forma perfecta y la piel totalmente limpia y tranquila.",
    date: "Hace 1 semana",
  },
  {
    name: "Sofía T.",
    service: "Uñas Esculpidas de Gel",
    rating: 5,
    text: "Llevo 2 años viniendo a Caluatnails. El trabajo de arquitectura de la uña es de otro nivel. Cuidan la uña natural para que no sufra nada.",
    date: "Hace 1 mes",
  },
];

export default function Testimonios() {
  return (
    <section className="py-20 bg-gradient-to-b from-white via-organic-cream to-white relative">
      <div className="max-w-7xl mx-auto px-6 lg:px-10 space-y-12">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <Badge variant="rose" icon="ri-star-line">
            Opiniones Verificadas · 4.9/5 de Valoración Excelente
          </Badge>
          <h2 className="font-playfair text-3xl sm:text-4xl font-extrabold text-gray-900">
            Lo que dicen nuestras clientas
          </h2>
          <p className="text-gray-600 text-xs sm:text-sm font-medium">
            Experiencias reales de quienes confían su cuidado personal en nuestro atelier de Calle Padilla 301, Barcelona.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {REVIEWS.map((rev, idx) => (
            <Card
              key={idx}
              variant="glass"
              padding="md"
              className="space-y-4 flex flex-col justify-between border-rose-100/80 shadow-soft-xs"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-amber-400">
                    {Array.from({ length: rev.rating }).map((_, i) => (
                      <i key={i} className="ri-star-fill text-sm" />
                    ))}
                  </div>
                  <span className="text-[10px] text-gray-400 font-medium">{rev.date}</span>
                </div>

                <p className="text-gray-700 text-xs sm:text-sm leading-relaxed font-medium italic">
                  "{rev.text}"
                </p>
              </div>

              <div className="pt-3 border-t border-rose-50 flex items-center justify-between">
                <div>
                  <p className="font-playfair font-bold text-sm text-gray-900">{rev.name}</p>
                  <p className="text-[10px] text-rose-500 font-bold uppercase tracking-wider">{rev.service}</p>
                </div>
                <div className="w-8 h-8 rounded-full bg-rose-100 text-rose-600 font-bold text-xs flex items-center justify-center shrink-0">
                  {rev.name[0]}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
