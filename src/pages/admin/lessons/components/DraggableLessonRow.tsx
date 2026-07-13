import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Edit2, Trash2, Video, FileText, BookOpen, Award, Clock, Download, GripVertical } from "lucide-react";
import type { DBLesson } from "@/lib/types";

const typeConfig = {
  video: { icon: Video, label: "Video", color: "text-rose-600 bg-rose-50" },
  lectura: { icon: FileText, label: "Lectura", color: "text-amber-600 bg-amber-50" },
  practica: { icon: BookOpen, label: "Práctica", color: "text-emerald-600 bg-emerald-50" },
  evaluacion: { icon: Award, label: "Evaluación", color: "text-purple-600 bg-purple-50" },
  material: { icon: Download, label: "Material", color: "text-teal-600 bg-teal-50" },
};

type LessonWithModule = DBLesson & { moduleTitle: string };

interface Props {
  lesson: LessonWithModule;
  index: number;
  selected: boolean;
  onSelect: (id: string, checked: boolean) => void;
  onEdit: (lesson: LessonWithModule) => void;
  onDelete: (lesson: LessonWithModule) => void;
}

export function DraggableLessonRow({ lesson, index, selected, onSelect, onEdit, onDelete }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: lesson.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : undefined,
  };

  const cfg = typeConfig[lesson.type];
  const TypeIcon = cfg.icon;
  const hasContent = !!(lesson.video_url || lesson.content);

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className={`transition-colors ${isDragging ? "bg-rose-50" : selected ? "bg-rose-50/40" : "hover:bg-gray-50"}`}
    >
      {/* Drag handle + checkbox */}
      <td className="px-3 py-4 w-10">
        <div className="flex items-center gap-1">
          <div
            {...attributes}
            {...listeners}
            className="w-6 h-6 flex items-center justify-center text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing"
          >
            <GripVertical className="w-4 h-4" />
          </div>
          <input
            type="checkbox"
            checked={selected}
            onChange={(e) => onSelect(lesson.id, e.target.checked)}
            className="w-4 h-4 rounded border-gray-300 text-rose-500 cursor-pointer accent-rose-500"
          />
        </div>
      </td>
      {/* Order */}
      <td className="px-2 py-4 w-8 text-center">
        <span className="text-xs font-bold text-gray-300">{index + 1}</span>
      </td>
      {/* Lesson info */}
      <td className="px-4 py-4">
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${cfg.color}`}>
            <TypeIcon className="w-4 h-4" />
          </div>
          <div>
            <p className="font-medium text-gray-900 text-sm">{lesson.title}</p>
            <p className="text-xs text-gray-400 truncate max-w-xs">{lesson.description}</p>
          </div>
        </div>
      </td>
      {/* Module */}
      <td className="px-4 py-4 text-sm text-gray-600 whitespace-nowrap">{lesson.moduleTitle}</td>
      {/* Type */}
      <td className="px-4 py-4">
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${cfg.color}`}>
          <TypeIcon className="w-3 h-3" />{cfg.label}
        </span>
      </td>
      {/* Duration */}
      <td className="px-4 py-4">
        <span className="flex items-center gap-1 text-sm text-gray-500">
          <Clock className="w-3.5 h-3.5" />{lesson.duration}
        </span>
      </td>
      {/* Content status */}
      <td className="px-4 py-4">
        {lesson.type === "material" ? (
          lesson.file_url ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-teal-100 text-teal-700">
              <i className="ri-download-2-line"></i>Listo
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
              <i className="ri-time-line"></i>Sin archivo
            </span>
          )
        ) : hasContent ? (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
            <i className="ri-check-line"></i>Subido
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
            <i className="ri-time-line"></i>Pendiente
          </span>
        )}
      </td>
      {/* Actions */}
      <td className="px-4 py-4">
        <div className="flex items-center justify-end gap-1">
          <button onClick={() => onEdit(lesson)}
            className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 cursor-pointer">
            <Edit2 className="w-4 h-4" />
          </button>
          <button onClick={() => onDelete(lesson)}
            className="w-8 h-8 rounded-lg hover:bg-rose-50 flex items-center justify-center text-gray-400 hover:text-rose-600 cursor-pointer">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </td>
    </tr>
  );
}
