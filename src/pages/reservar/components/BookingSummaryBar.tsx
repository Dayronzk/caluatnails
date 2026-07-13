import { DBService } from "@/lib/types";

interface Props {
  selected: DBService[];
  onContinue: () => void;
}

function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h} h`;
  return `${h} h ${m} min`;
}

export default function BookingSummaryBar({ selected, onContinue }: Props) {
  const totalMinutes = selected.reduce((acc, s) => acc + s.duration_minutes, 0);
  const totalPrice = selected.reduce((acc, s) => acc + Number(s.price), 0);
  const totalPoints = selected.reduce((acc, s) => acc + (s.reward_points ?? 0), 0);
  const deposit = totalPrice * 0.1;

  if (selected.length === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-rose-100 shadow-lg">
      <div className="max-w-5xl mx-auto px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-6">
          <div>
            <span className="text-xs text-gray-400 block">Servicios</span>
            <span className="text-sm font-semibold text-gray-800">{selected.length} seleccionado{selected.length > 1 ? "s" : ""}</span>
          </div>
          <div>
            <span className="text-xs text-gray-400 block">Duración total</span>
            <span className="text-sm font-semibold text-gray-800">{formatDuration(totalMinutes)}</span>
          </div>
          <div>
            <span className="text-xs text-gray-400 block">Total</span>
            <span className="text-sm font-bold text-gray-900">€{totalPrice.toFixed(2)}</span>
          </div>
          <div>
            <span className="text-xs text-gray-400 block">Anticipo (10%)</span>
            <span className="text-sm font-bold text-rose-600">€{deposit.toFixed(2)}</span>
          </div>
          {totalPoints > 0 && (
            <div className="hidden sm:block">
              <span className="text-xs text-gray-400 block">Puntos a ganar</span>
              <span className="text-sm font-bold text-amber-600">+{totalPoints} pts</span>
            </div>
          )}
        </div>
        <button
          onClick={onContinue}
          className="bg-rose-500 hover:bg-rose-600 text-white font-semibold px-8 py-3 rounded-full transition-colors cursor-pointer whitespace-nowrap flex items-center gap-2"
        >
          Continuar <i className="ri-arrow-right-line"></i>
        </button>
      </div>
    </div>
  );
}
