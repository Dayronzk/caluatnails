import { DBService } from "@/lib/types";

interface Props {
  service: DBService;
  selected: boolean;
  isDragOver: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onDragStart: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: () => void;
  onDragEnd: () => void;
}

const TYPE_COLORS: Record<string, string> = {
  Manicura: "bg-pink-50 text-pink-600",
  Pedicura: "bg-orange-50 text-orange-600",
  "Diseño Artístico": "bg-violet-50 text-violet-600",
  Extensiones: "bg-sky-50 text-sky-600",
  Mantenimiento: "bg-teal-50 text-teal-600",
  Formación: "bg-amber-50 text-amber-600",
  General: "bg-gray-100 text-gray-600",
};

function formatDuration(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h} h`;
  return `${h} h ${m} min`;
}

export default function ServiceRow({
  service: s,
  selected,
  isDragOver,
  onSelect,
  onEdit,
  onDelete,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
}: Props) {
  const typeColor = TYPE_COLORS[s.service_type] ?? "bg-gray-100 text-gray-600";

  return (
    <tr
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      className={`transition-colors ${selected ? "bg-rose-50/40" : "hover:bg-gray-50"} ${isDragOver ? "border-t-2 border-rose-400" : ""}`}
    >
      {/* Checkbox */}
      <td className="px-4 py-3">
        <input
          type="checkbox"
          checked={selected}
          onChange={onSelect}
          className="rounded cursor-pointer accent-rose-500"
        />
      </td>

      {/* Drag handle */}
      <td className="px-2 py-3">
        <div className="w-5 h-5 flex items-center justify-center text-gray-300 cursor-grab active:cursor-grabbing">
          <i className="ri-draggable text-base"></i>
        </div>
      </td>

      {/* Name */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <p className="font-medium text-gray-900 text-sm">{s.name}</p>
          <a 
            href={`/servicios/${s.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-300 hover:text-rose-500 transition-colors"
            title="Ver landing SEO"
          >
            <i className="ri-external-link-line text-xs"></i>
          </a>
        </div>
        {s.description && (
          <p className="text-xs text-gray-400 mt-0.5 line-clamp-1 max-w-xs">{s.description}</p>
        )}
      </td>

      {/* Type */}
      <td className="px-4 py-3">
        <span className={`text-xs font-medium px-2.5 py-1 rounded-full whitespace-nowrap ${typeColor}`}>
          {s.service_type}
        </span>
      </td>

      {/* Duration */}
      <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
        <i className="ri-time-line mr-1 text-gray-300"></i>
        {formatDuration(s.duration_minutes)}
      </td>

      {/* Price */}
      <td className="px-4 py-3 text-sm font-semibold text-gray-900 whitespace-nowrap">
        €{Number(s.price).toFixed(2)}
      </td>

      {/* Points */}
      <td className="px-4 py-3">
        {(s.reward_points ?? 0) > 0 ? (
          <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-amber-50 text-amber-600 whitespace-nowrap">
            <i className="ri-coin-line mr-1"></i>{s.reward_points} pts
          </span>
        ) : (
          <span className="text-xs text-gray-300">—</span>
        )}
      </td>

      {/* Status */}
      <td className="px-4 py-3">
        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${s.active ? "bg-teal-50 text-teal-600" : "bg-gray-100 text-gray-400"}`}>
          {s.active ? "Activo" : "Inactivo"}
        </span>
      </td>

      {/* Actions */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-1 justify-end">
          <button
            onClick={onEdit}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors cursor-pointer"
          >
            <i className="ri-edit-line text-sm"></i>
          </button>
          <button
            onClick={onDelete}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors cursor-pointer"
          >
            <i className="ri-delete-bin-line text-sm"></i>
          </button>
        </div>
      </td>
    </tr>
  );
}
