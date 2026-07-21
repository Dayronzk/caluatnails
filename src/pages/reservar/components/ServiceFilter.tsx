interface Props {
  categories?: string[];
  types?: string[];
  activeCategory?: string;
  active?: string;
  onSelectCategory?: (category: string) => void;
  onChange?: (category: string) => void;
}

export default function ServiceFilter({
  categories,
  types,
  activeCategory,
  active,
  onSelectCategory,
  onChange,
}: Props) {
  const categoryList = categories || types || [];
  const currentActive = activeCategory || active || "Todos";
  const handleSelect = onSelectCategory || onChange || (() => {});

  const fullList = categoryList.includes("Todos") ? categoryList : ["Todos", ...categoryList];

  return (
    <div className="w-full relative">
      <div className="flex items-center gap-2.5 overflow-x-auto pb-3 pt-1 px-1 no-scrollbar scroll-smooth">
        {fullList.map((cat) => {
          const isActive = cat === currentActive;
          return (
            <button
              key={cat}
              type="button"
              onClick={() => handleSelect(cat)}
              className={`px-5 py-2.5 rounded-full text-xs sm:text-sm font-semibold whitespace-nowrap transition-all duration-300 cursor-pointer flex items-center gap-2 ${
                isActive
                  ? "bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-soft-sm scale-[1.03]"
                  : "bg-white/90 backdrop-blur-sm text-gray-700 border border-rose-100/70 shadow-soft-xs hover:border-rose-300 hover:bg-rose-50/50 hover:text-rose-600 hover:scale-[1.01]"
              }`}
            >
              {isActive && (
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              )}
              {cat}
            </button>
          );
        })}
      </div>
    </div>
  );
}
