interface Props {
  types: string[];
  active: string;
  onChange: (type: string) => void;
}

export default function ServiceFilter({ types, active, onChange }: Props) {
  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={() => onChange("Todos")}
        className={`px-4 py-2 rounded-full text-sm font-medium transition-all cursor-pointer whitespace-nowrap ${
          active === "Todos"
            ? "bg-rose-500 text-white"
            : "bg-white border border-gray-200 text-gray-600 hover:border-rose-200 hover:text-rose-600"
        }`}
      >
        Todos
      </button>
      {types.map((t) => (
        <button
          key={t}
          onClick={() => onChange(t)}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-all cursor-pointer whitespace-nowrap ${
            active === t
              ? "bg-rose-500 text-white"
              : "bg-white border border-gray-200 text-gray-600 hover:border-rose-200 hover:text-rose-600"
          }`}
        >
          {t}
        </button>
      ))}
    </div>
  );
}
