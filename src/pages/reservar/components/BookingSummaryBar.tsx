import { DBService } from "@/lib/types";

interface Props {
  totalServices?: number;
  totalPrice?: number;
  totalMinutes?: number;
  currentStep?: number;
  onNextStep?: () => void;
  loading?: boolean;

  // Alternate props used in page.tsx
  selected?: DBService[];
  onContinue?: () => void;
}

function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h} h`;
  return `${h} h ${m} min`;
}

export default function BookingSummaryBar({
  totalServices,
  totalPrice,
  totalMinutes,
  currentStep = 0,
  onNextStep,
  loading = false,
  selected,
  onContinue,
}: Props) {
  const serviceList = selected ?? [];
  const calculatedCount = totalServices ?? serviceList.length;
  const calculatedPrice = totalPrice ?? serviceList.reduce((acc, s) => acc + Number(s.price), 0);
  const calculatedMinutes = totalMinutes ?? serviceList.reduce((acc, s) => acc + s.duration_minutes, 0);
  const handleAction = onNextStep ?? onContinue ?? (() => {});

  if (calculatedCount === 0) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 max-w-2xl mx-auto z-40 animate-fadeIn">
      <div className="bg-white/90 backdrop-blur-md rounded-full border border-rose-100/80 shadow-soft-lg p-3 sm:p-3.5 pl-5 sm:pl-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center text-rose-500 font-bold text-sm shrink-0 shadow-soft-xs">
            <i className="ri-shopping-bag-3-line text-lg"></i>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold text-gray-500">
                {calculatedCount} {calculatedCount === 1 ? "servicio" : "servicios"} · {formatDuration(calculatedMinutes)}
              </span>
            </div>
            <p className="text-lg sm:text-xl font-bold text-gray-900 leading-tight">
              €{calculatedPrice.toFixed(2)}
            </p>
          </div>
        </div>

        {currentStep < 2 && (
          <button
            type="button"
            onClick={handleAction}
            disabled={loading}
            className="px-6 py-3 bg-gradient-to-r from-rose-500 via-pink-500 to-rose-600 hover:opacity-95 disabled:opacity-50 text-white font-bold text-sm rounded-full transition-all duration-300 shadow-soft-sm hover:scale-[1.03] cursor-pointer flex items-center gap-2 shrink-0"
          >
            {loading ? (
              <i className="ri-loader-4-line animate-spin text-base"></i>
            ) : (
              <>
                <span>Continuar</span>
                <i className="ri-arrow-right-line text-base"></i>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
