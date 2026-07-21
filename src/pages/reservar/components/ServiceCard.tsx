import { DBService } from "@/lib/types";

interface Props {
  service: DBService;
  selected: boolean;
  onToggle: (service: DBService) => void;
}

const typeColors: Record<string, string> = {
  Manicura: "bg-rose-100/70 text-rose-700 border border-rose-200/50",
  Pedicura: "bg-pink-100/70 text-pink-700 border border-pink-200/50",
  "Pack Completo": "bg-fuchsia-100/70 text-fuchsia-700 border border-fuchsia-200/50",
  Extensiones: "bg-amber-100/70 text-amber-700 border border-amber-200/50",
  Mantenimiento: "bg-orange-100/70 text-orange-700 border border-orange-200/50",
};

function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h} h`;
  return `${h} h ${m} min`;
}

export default function ServiceCard({ service, selected, onToggle }: Props) {
  const colorClass = typeColors[service.service_type] || "bg-gray-100/70 text-gray-700 border border-gray-200/50";

  return (
    <div
      onClick={() => onToggle(service)}
      className={`w-full text-left rounded-3xl p-5 sm:p-6 transition-all duration-300 cursor-pointer relative group overflow-hidden ${
        selected
          ? "bg-gradient-to-br from-rose-50/90 via-pink-50/40 to-white border-2 border-rose-400/90 shadow-soft-md scale-[1.01]"
          : "bg-white/90 backdrop-blur-sm border border-rose-100/70 shadow-soft-xs hover:shadow-soft-md hover:border-rose-300/80 hover:-translate-y-0.5"
      }`}
    >
      {/* Soft organic accent background blur when selected */}
      {selected && (
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-rose-300/20 rounded-full blur-2xl pointer-events-none" />
      )}

      <div className="flex items-start justify-between gap-4 relative z-10">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2.5 flex-wrap">
            <span className={`text-[11px] font-semibold px-3 py-1 rounded-full ${colorClass}`}>
              {service.service_type}
            </span>
            {selected && (
              <span className="text-[11px] font-semibold px-3 py-1 rounded-full bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-soft-xs flex items-center gap-1.5 animate-fadeIn">
                <i className="ri-check-line text-xs font-bold"></i> Seleccionado
              </span>
            )}
          </div>

          <h3 className="font-bold text-gray-900 text-base sm:text-lg leading-snug tracking-tight group-hover:text-rose-600 transition-colors">
            {service.name}
          </h3>

          <p className="text-sm text-gray-600 mt-2 leading-relaxed font-normal">
            {service.description}
          </p>
        </div>

        {/* Checkbox circle indicator */}
        <div
          className={`w-7 h-7 flex items-center justify-center rounded-full flex-shrink-0 mt-0.5 transition-all duration-300 ${
            selected
              ? "bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-soft-sm scale-110"
              : "border-2 border-rose-200/80 bg-rose-50/30 group-hover:border-rose-400"
          }`}
        >
          {selected ? (
            <i className="ri-check-line text-white text-sm font-bold"></i>
          ) : (
            <i className="ri-add-line text-rose-300 text-sm group-hover:text-rose-500 transition-colors"></i>
          )}
        </div>
      </div>

      {/* Footer details row */}
      <div className="flex items-center gap-4 mt-5 pt-4 border-t border-rose-100/50 flex-wrap relative z-10">
        <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500 bg-rose-50/50 px-3 py-1.5 rounded-full border border-rose-100/40">
          <i className="ri-time-line text-rose-400 text-sm"></i>
          <span>{formatDuration(service.duration_minutes)}</span>
        </div>

        <div className="flex items-center gap-1.5 text-sm font-bold text-gray-900 bg-rose-50/60 px-3.5 py-1.5 rounded-full border border-rose-100/50">
          <i className="ri-price-tag-3-line text-rose-500"></i>
          <span>€{service.price.toFixed(2)}</span>
        </div>

        {(service.reward_points ?? 0) > 0 && (
          <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-700 bg-amber-50/80 px-3 py-1.5 rounded-full border border-amber-200/50">
            <i className="ri-coin-line text-amber-500"></i>
            <span>+{service.reward_points} pts</span>
          </div>
        )}

        <a
          href={`/servicios/${service.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="ml-auto flex items-center gap-1 px-3.5 py-1.5 bg-white text-[11px] font-semibold text-rose-600 rounded-full hover:bg-rose-500 hover:text-white transition-all duration-300 shadow-soft-xs border border-rose-100"
        >
          Ver detalles <i className="ri-arrow-right-up-line text-xs"></i>
        </a>
      </div>
    </div>
  );
}
