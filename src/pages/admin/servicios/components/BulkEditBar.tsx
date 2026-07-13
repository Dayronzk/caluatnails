import { useState } from "react";

interface Props {
  count: number;
  serviceTypes: string[];
  saving: boolean;
  onSetType: (type: string) => void;
  onSetPoints: (points: number) => void;
  onActivate: () => void;
  onDeactivate: () => void;
  onClear: () => void;
}

export default function BulkEditBar({
  count, serviceTypes, saving, onSetType, onSetPoints, onActivate, onDeactivate, onClear,
}: Props) {
  const [showTypeMenu, setShowTypeMenu] = useState(false);
  const [showPointsInput, setShowPointsInput] = useState(false);
  const [pointsValue, setPointsValue] = useState(0);

  return (
    <div className="mb-4 bg-rose-500 text-white rounded-2xl px-5 py-3 flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-2 mr-2">
        <div className="w-6 h-6 flex items-center justify-center rounded-full bg-white/20 text-xs font-bold">
          {count}
        </div>
        <span className="text-sm font-medium whitespace-nowrap">
          {count === 1 ? "servicio seleccionado" : "servicios seleccionados"}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-2 ml-auto">
        {/* Change type */}
        <div className="relative">
          <button
            onClick={() => { setShowTypeMenu(p => !p); setShowPointsInput(false); }}
            disabled={saving}
            className="flex items-center gap-1.5 bg-white/15 hover:bg-white/25 px-3 py-1.5 rounded-full text-xs font-medium transition-colors cursor-pointer whitespace-nowrap disabled:opacity-50"
          >
            <i className="ri-price-tag-3-line"></i>
            Cambiar tipo
            <i className="ri-arrow-down-s-line"></i>
          </button>
          {showTypeMenu && (
            <div className="absolute top-full left-0 mt-1 bg-white rounded-xl border border-gray-100 py-1 z-50 min-w-[160px]">
              {serviceTypes.map(t => (
                <button
                  key={t}
                  onClick={() => { onSetType(t); setShowTypeMenu(false); }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  {t}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Set points */}
        <div className="relative">
          <button
            onClick={() => { setShowPointsInput(p => !p); setShowTypeMenu(false); }}
            disabled={saving}
            className="flex items-center gap-1.5 bg-white/15 hover:bg-white/25 px-3 py-1.5 rounded-full text-xs font-medium transition-colors cursor-pointer whitespace-nowrap disabled:opacity-50"
          >
            <i className="ri-coin-line"></i>
            Asignar puntos
          </button>
          {showPointsInput && (
            <div className="absolute top-full left-0 mt-1 bg-white rounded-xl border border-gray-100 p-3 z-50 min-w-[200px]">
              <p className="text-xs text-gray-500 mb-2">Puntos de recompensa</p>
              <div className="flex gap-2">
                <input
                  type="number"
                  min={0}
                  step={10}
                  value={pointsValue}
                  onChange={e => setPointsValue(Number(e.target.value))}
                  className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-rose-400"
                />
                <button
                  onClick={() => { onSetPoints(pointsValue); setShowPointsInput(false); }}
                  className="bg-rose-500 text-white px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer hover:bg-rose-600 transition-colors whitespace-nowrap"
                >
                  Aplicar
                </button>
              </div>
              <div className="flex gap-1 mt-2 flex-wrap">
                {[0, 50, 100, 200, 500].map(v => (
                  <button
                    key={v}
                    onClick={() => setPointsValue(v)}
                    className={`px-2 py-0.5 rounded-full text-xs cursor-pointer transition-colors ${pointsValue === v ? "bg-rose-100 text-rose-600" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Activate */}
        <button
          onClick={onActivate}
          disabled={saving}
          className="flex items-center gap-1.5 bg-white/15 hover:bg-white/25 px-3 py-1.5 rounded-full text-xs font-medium transition-colors cursor-pointer whitespace-nowrap disabled:opacity-50"
        >
          <i className="ri-eye-line"></i>
          Activar
        </button>

        {/* Deactivate */}
        <button
          onClick={onDeactivate}
          disabled={saving}
          className="flex items-center gap-1.5 bg-white/15 hover:bg-white/25 px-3 py-1.5 rounded-full text-xs font-medium transition-colors cursor-pointer whitespace-nowrap disabled:opacity-50"
        >
          <i className="ri-eye-off-line"></i>
          Desactivar
        </button>

        {/* Clear */}
        <button
          onClick={onClear}
          className="flex items-center gap-1 bg-white/10 hover:bg-white/20 px-2.5 py-1.5 rounded-full text-xs transition-colors cursor-pointer whitespace-nowrap"
        >
          <i className="ri-close-line"></i>
          Limpiar
        </button>
      </div>

      {saving && (
        <div className="flex items-center gap-1.5 text-xs text-white/80">
          <i className="ri-loader-4-line animate-spin"></i>
          Guardando...
        </div>
      )}
    </div>
  );
}
