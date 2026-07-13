import { DBService } from "@/lib/types";

interface Props {
  service: DBService;
  selected: boolean;
  onToggle: (service: DBService) => void;
}

const typeColors: Record<string, string> = {
  Manicura: "bg-rose-50 text-rose-600",
  Pedicura: "bg-pink-50 text-pink-600",
  "Pack Completo": "bg-fuchsia-50 text-fuchsia-600",
  Extensiones: "bg-orange-50 text-orange-600",
  Mantenimiento: "bg-amber-50 text-amber-600",
};

function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h} h`;
  return `${h} h ${m} min`;
}

export default function ServiceCard({ service, selected, onToggle }: Props) {
  const colorClass = typeColors[service.service_type] || "bg-gray-50 text-gray-600";

  return (
    <button
      onClick={() => onToggle(service)}
      className={`w-full text-left rounded-2xl border-2 p-5 transition-all duration-200 cursor-pointer ${
        selected
          ? "border-rose-500 bg-rose-50/50 shadow-sm"
          : "border-gray-100 bg-white hover:border-rose-200 hover:shadow-sm"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${colorClass}`}>
              {service.service_type}
            </span>
            {selected && (
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-rose-500 text-white flex items-center gap-1">
                <i className="ri-check-line text-xs"></i> Seleccionado
              </span>
            )}
          </div>
          <h3 className="font-semibold text-gray-900 text-base leading-tight">{service.name}</h3>
          <p className="text-sm text-gray-500 mt-1.5 leading-relaxed">{service.description}</p>
        </div>
        <div
          className={`w-6 h-6 flex items-center justify-center rounded-full border-2 flex-shrink-0 mt-1 transition-all ${
            selected ? "border-rose-500 bg-rose-500" : "border-gray-200"
          }`}
        >
          {selected && <i className="ri-check-line text-white text-xs"></i>}
        </div>
      </div>

      <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-100 flex-wrap">
        <div className="flex items-center gap-1.5 text-sm text-gray-500">
          <i className="ri-time-line"></i>
          <span>{formatDuration(service.duration_minutes)}</span>
        </div>
        <div className="flex items-center gap-1.5 text-sm font-semibold text-gray-900">
          <i className="ri-price-tag-3-line text-rose-500"></i>
          <span>€{service.price.toFixed(2)}</span>
        </div>
        {(service.reward_points ?? 0) > 0 && (
          <div className="flex items-center gap-1.5 text-xs font-medium text-amber-600">
            <i className="ri-coin-line"></i>
            <span>+{service.reward_points} pts</span>
          </div>
        )}
        <a
          href={`/servicios/${service.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="ml-auto flex items-center gap-1 px-3 py-1.5 bg-gray-50 text-[10px] font-bold text-gray-500 rounded-full hover:bg-rose-500 hover:text-white transition-all border border-gray-100"
        >
          VER MÁS <i className="ri-arrow-right-up-line"></i>
        </a>
      </div>
    </button>
  );
}
