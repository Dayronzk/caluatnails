interface Step {
  label: string;
  icon: string;
}

interface Props {
  currentStep: number;
  steps: Step[];
  onStepClick?: (stepIndex: number) => void;
}

export default function BookingStepIndicator({ currentStep, steps, onStepClick }: Props) {
  return (
    <div className="w-full max-w-xl mx-auto px-2">
      <div className="bg-white/80 backdrop-blur-md rounded-full p-2.5 sm:p-3 border border-rose-100/70 shadow-soft-sm flex items-center justify-between relative overflow-hidden">
        {steps.map((step, index) => {
          const isCompleted = index < currentStep;
          const isActive = index === currentStep;
          const isClickable = onStepClick && index <= currentStep;

          return (
            <div key={index} className="flex-1 flex items-center relative z-10">
              <button
                type="button"
                disabled={!isClickable}
                onClick={() => isClickable && onStepClick && onStepClick(index)}
                className={`flex items-center gap-2 sm:gap-2.5 px-3 sm:px-4 py-2 rounded-full transition-all duration-300 w-full justify-center ${
                  isClickable ? "cursor-pointer" : "cursor-default"
                } ${
                  isActive
                    ? "bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-soft-md scale-[1.02]"
                    : isCompleted
                    ? "bg-rose-50/80 text-rose-600 hover:bg-rose-100/60"
                    : "bg-transparent text-gray-400"
                }`}
              >
                <div
                  className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300 ${
                    isActive
                      ? "bg-white/25 text-white"
                      : isCompleted
                      ? "bg-rose-500 text-white"
                      : "bg-gray-100 text-gray-400"
                  }`}
                >
                  {isCompleted ? (
                    <i className="ri-check-line text-sm sm:text-base"></i>
                  ) : (
                    <i className={`${step.icon} text-xs sm:text-sm`}></i>
                  )}
                </div>

                <div className="flex flex-col text-left">
                  <span
                    className={`text-xs sm:text-sm font-semibold leading-none tracking-wide ${
                      isActive ? "text-white" : isCompleted ? "text-rose-900" : "text-gray-400 hidden sm:block"
                    }`}
                  >
                    {step.label}
                  </span>
                  {isActive && (
                    <span className="text-[10px] text-white/80 leading-tight hidden sm:block mt-0.5 font-normal">
                      Paso {index + 1} de {steps.length}
                    </span>
                  )}
                </div>
              </button>

              {index < steps.length - 1 && (
                <div className="hidden sm:block w-3 h-0.5 bg-rose-100/80 rounded-full mx-1 flex-shrink-0" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
