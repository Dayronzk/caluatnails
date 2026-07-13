import { useState } from "react";
import { LessonPopup } from "./LessonPopup";
import type { Lesson } from "@/mocks/courseData";

interface Props {
  lessons: Lesson[];
  accentColor: "rose" | "orange";
  completed: Set<number>;
  onToggleComplete: (id: number) => void;
}

const typeConfig: Record<Lesson["type"], { icon: string; label: string; bg: string; text: string }> = {
  video: { icon: "ri-play-circle-line", label: "Video", bg: "bg-rose-50", text: "text-rose-600" },
  lectura: { icon: "ri-article-line", label: "Lectura", bg: "bg-amber-50", text: "text-amber-600" },
  practica: { icon: "ri-flashlight-line", label: "Práctica", bg: "bg-orange-50", text: "text-orange-600" },
  evaluacion: { icon: "ri-award-line", label: "Evaluación", bg: "bg-green-50", text: "text-green-600" },
  material: { icon: "ri-download-2-line", label: "Material", bg: "bg-teal-50", text: "text-teal-600" },
};

export default function LessonList({ lessons, accentColor, completed, onToggleComplete }: Props) {
  const [expanded, setExpanded] = useState<number | null>(null);
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);

  const handleStartLesson = (lesson: Lesson) => {
    setActiveLesson(lesson);
  };

  const handleCompleteLesson = () => {
    if (activeLesson) {
      onToggleComplete(activeLesson.id);
    }
  };

  return (
    <>
      <div className="flex flex-col gap-3">
        {lessons.map((lesson, index) => {
          const isCompleted = completed.has(lesson.id);
          const isExpanded = expanded === lesson.id;
          const cfg = typeConfig[lesson.type];

          return (
            <div
              key={lesson.id}
              className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                isCompleted
                  ? "border-green-200 bg-green-50/40"
                  : "border-gray-100 bg-white hover:border-gray-200"
              }`}
            >
              {/* Lesson row */}
              <div
                className="flex items-center gap-4 p-5 cursor-pointer"
                onClick={() => setExpanded(isExpanded ? null : lesson.id)}
              >
                {/* Number / checkmark */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!lesson.free && index > 0) onToggleComplete(lesson.id);
                    else onToggleComplete(lesson.id);
                  }}
                  className={`w-9 h-9 flex items-center justify-center rounded-full border-2 shrink-0 transition-all cursor-pointer ${
                    isCompleted
                      ? "bg-green-500 border-green-500 text-white"
                      : accentColor === "rose"
                      ? "border-gray-200 text-gray-400 hover:border-rose-400 hover:text-rose-500"
                      : "border-gray-200 text-gray-400 hover:border-orange-400 hover:text-orange-500"
                  }`}
                >
                  {isCompleted ? (
                    <i className="ri-check-line text-sm font-bold"></i>
                  ) : (
                    <span className="text-xs font-semibold">{index + 1}</span>
                  )}
                </button>

                {/* Type badge */}
                <div
                  className={`w-8 h-8 flex items-center justify-center rounded-lg shrink-0 ${cfg.bg}`}
                >
                  <i className={`${cfg.icon} text-sm ${cfg.text}`}></i>
                </div>

                {/* Title */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3
                      className={`text-sm font-semibold leading-snug ${
                        isCompleted ? "line-through text-gray-400" : "text-gray-800"
                      }`}
                    >
                      {lesson.title}
                    </h3>
                    {lesson.free && (
                      <span className="text-xs bg-rose-100 text-rose-600 px-2 py-0.5 rounded-full font-medium">
                        Gratis
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <span className={`text-xs ${cfg.text} font-medium`}>{cfg.label}</span>
                    <span className="text-gray-300">·</span>
                    <span className="text-xs text-gray-400">{lesson.duration}</span>
                  </div>
                </div>

                {/* Expand toggle */}
                <i
                  className={`text-gray-300 text-lg transition-transform duration-200 ${
                    isExpanded ? "ri-arrow-up-s-line" : "ri-arrow-down-s-line"
                  }`}
                ></i>
              </div>

              {/* Expanded description */}
              {isExpanded && (
                <div className="px-5 pb-5 pt-0 flex items-start gap-4 border-t border-gray-100">
                  <div className="w-9 shrink-0"></div>
                  <div className="w-8 shrink-0"></div>
                  <div className="flex-1">
                    <p className="text-gray-500 text-sm leading-relaxed mb-4">{lesson.description}</p>
                    {lesson.type === "material" && lesson.fileUrl ? (
                      <a
                        href={lesson.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => onToggleComplete(lesson.id)}
                        className="inline-flex items-center gap-2 text-sm font-semibold px-5 py-2.5 rounded-full bg-teal-600 text-white hover:bg-teal-700 transition-colors cursor-pointer whitespace-nowrap"
                      >
                        <i className="ri-download-2-line"></i>
                        Descargar material
                      </a>
                    ) : (
                      <button
                        onClick={() => handleStartLesson(lesson)}
                        className={`inline-flex items-center gap-2 text-sm font-semibold px-5 py-2.5 rounded-full transition-colors cursor-pointer whitespace-nowrap ${
                          isCompleted
                            ? "bg-gray-100 text-gray-500 hover:bg-gray-200"
                            : accentColor === "rose"
                            ? "bg-rose-600 text-white hover:bg-rose-700"
                            : "bg-orange-500 text-white hover:bg-orange-600"
                        }`}
                      >
                        {isCompleted ? (
                          <><i className="ri-refresh-line"></i>Repetir lección</>
                        ) : (
                          <><i className="ri-play-circle-line"></i>Iniciar lección</>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Lesson Popup */}
      {activeLesson && (
        <LessonPopup
          lesson={activeLesson}
          isOpen={!!activeLesson}
          onClose={() => setActiveLesson(null)}
          onComplete={handleCompleteLesson}
          isCompleted={completed.has(activeLesson.id)}
        />
      )}
    </>
  );
}