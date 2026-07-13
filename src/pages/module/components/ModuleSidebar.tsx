import { useNavigate } from "react-router-dom";
import type { DBModule, DBLessonTag } from "@/lib/types";

interface Props {
  currentModuleId: number;
  allModules: DBModule[];
  allTags: DBLessonTag[];
  lessonCounts: Record<number, number>;
  getModulePercentage: (moduleId: number) => number;
  onShowCertificate?: () => void;
}

const tagBgMap: Record<string, string> = {
  rose: "bg-rose-50", orange: "bg-orange-50", amber: "bg-amber-50",
  pink: "bg-pink-50", green: "bg-green-50", teal: "bg-teal-50",
  purple: "bg-purple-50", blue: "bg-blue-50",
};
const tagTextMap: Record<string, string> = {
  rose: "text-rose-600", orange: "text-orange-600", amber: "text-amber-600",
  pink: "text-pink-600", green: "text-green-600", teal: "text-teal-600",
  purple: "text-purple-600", blue: "text-blue-600",
};

export default function ModuleSidebar({ currentModuleId, allModules, allTags, lessonCounts, getModulePercentage, onShowCertificate }: Props) {
  const navigate = useNavigate();

  // Build sections: modules grouped by tag, then untagged at top
  const taggedModules = allModules.filter(m => m.tag_id);
  const untaggedModules = allModules.filter(m => !m.tag_id);

  // Group by tag_id maintaining tag order
  const tagGroups: Array<{ tag: DBLessonTag; modules: DBModule[] }> = [];
  allTags.forEach(tag => {
    const mods = taggedModules.filter(m => m.tag_id === tag.id);
    if (mods.length > 0) tagGroups.push({ tag, modules: mods });
  });

  const renderModule = (mod: DBModule, globalIndex: number) => {
    const isActive = mod.order_index === currentModuleId;
    const pct = getModulePercentage(mod.order_index);
    const isDone = pct === 100;
    const count = lessonCounts[mod.order_index] ?? 0;
    const color = mod.color ?? "rose";

    return (
      <button key={mod.id} onClick={() => navigate(`/modulo/${mod.order_index}`)}
        className={`flex items-center gap-3 px-4 py-3 text-left w-full transition-colors cursor-pointer border-b border-gray-50 last:border-0 ${
          isActive ? (color === "rose" ? "bg-rose-50" : "bg-orange-50") : "hover:bg-gray-50"
        }`}>
        <div className={`w-7 h-7 flex items-center justify-center rounded-lg shrink-0 text-xs font-bold ${
          isDone ? "bg-green-500 text-white" :
          isActive ? (color === "rose" ? "bg-rose-600 text-white" : "bg-orange-500 text-white") :
          "bg-gray-100 text-gray-500"
        }`}>
          {isDone ? <i className="ri-check-line text-sm"></i> : String(globalIndex).padStart(2, "0")}
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-xs font-semibold leading-snug truncate ${isActive ? "text-gray-900" : "text-gray-600"}`}>{mod.title}</p>
          {pct > 0 ? (
            <div className="flex items-center gap-2 mt-0.5">
              <div className="flex-1 h-1 bg-gray-100 rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all ${isDone ? "bg-green-500" : color === "rose" ? "bg-rose-400" : "bg-orange-400"}`}
                  style={{ width: `${pct}%` }} />
              </div>
              <span className={`text-xs font-semibold shrink-0 whitespace-nowrap ${isDone ? "text-green-600" : "text-gray-400"}`}>{pct}%</span>
            </div>
          ) : (
            <p className="text-gray-400 text-xs mt-0.5">{count} lecciones</p>
          )}
        </div>
        {isActive && <i className={`ri-arrow-right-s-line shrink-0 text-sm ${color === "rose" ? "text-rose-500" : "text-orange-500"}`}></i>}
      </button>
    );
  };

  let globalIdx = 1;

  return (
    <aside className="w-full lg:w-72 shrink-0">
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden sticky top-6">

        {/* Untagged modules — no section header, render directly */}
        {untaggedModules.length > 0 && (
          <div>
            {untaggedModules.length > 0 && tagGroups.length > 0 && (
              <div className="px-4 py-2.5 border-b border-gray-100 bg-gray-50">
                <h3 className="text-gray-500 font-semibold text-xs tracking-widest uppercase">General</h3>
              </div>
            )}
            <div className="flex flex-col">
              {untaggedModules.map((mod) => renderModule(mod, globalIdx++))}
            </div>
          </div>
        )}

        {/* Tag-grouped modules */}
        {tagGroups.map(({ tag, modules }) => {
          const bg = tagBgMap[tag.color] ?? tagBgMap.rose;
          const text = tagTextMap[tag.color] ?? tagTextMap.rose;
          return (
            <div key={tag.id} className="border-t border-gray-100">
              <div className={`px-4 py-2.5 border-b border-gray-100 ${bg} flex items-center gap-2`}>
                <div className="w-4 h-4 flex items-center justify-center">
                  <i className={`${tag.icon} text-xs ${text}`}></i>
                </div>
                <h3 className={`${text} font-semibold text-xs tracking-widest uppercase`}>{tag.name}</h3>
              </div>
              <div className="flex flex-col">
                {modules.map((mod) => renderModule(mod, globalIdx++))}
              </div>
            </div>
          );
        })}

        {onShowCertificate && (
          <div className="p-4 border-t border-gray-100 bg-gradient-to-br from-rose-50 to-pink-50">
            <button onClick={onShowCertificate}
              className="w-full flex items-center justify-center gap-2 bg-rose-600 text-white px-4 py-3 rounded-xl text-sm font-semibold hover:bg-rose-700 transition-colors cursor-pointer whitespace-nowrap">
              <i className="ri-award-fill text-base"></i>Ver mi certificado
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
