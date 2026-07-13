interface Step {
  label: string;
  icon: string;
}

interface Props {
  currentStep: number;
  steps: Step[];
}

export default function BookingStepIndicator({ currentStep, steps }: Props) {
  return (
    <div className="flex items-center justify-center gap-0">
      {steps.map((step, index) => {
        const isCompleted = index < currentStep;
        const isActive = index === currentStep;
        return (
          <div key={index} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm transition-all ${
                  isCompleted
                    ? "bg-rose-500 text-white"
                    : isActive
                    ? "bg-rose-500 text-white shadow-lg shadow-rose-200"
                    : "bg-gray-100 text-gray-400"
                }`}
              >
                {isCompleted ? (
                  <i className="ri-check-line"></i>
                ) : (
                  <i className={step.icon}></i>
                )}
              </div>
              <span
                className={`text-xs mt-1.5 font-medium whitespace-nowrap hidden sm:block ${
                  isActive ? "text-rose-600" : isCompleted ? "text-rose-400" : "text-gray-400"
                }`}
              >
                {step.label}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div
                className={`w-16 sm:w-24 h-0.5 mx-1 mb-5 transition-all ${
                  index < currentStep ? "bg-rose-400" : "bg-gray-100"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
