import React, { forwardRef } from "react";

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options?: { value: string | number; label: string }[];
  helperText?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options = [], helperText, children, className = "", id, ...props }, ref) => {
    const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label htmlFor={selectId} className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          <select
            id={selectId}
            ref={ref}
            className={`w-full rounded-2xl border px-4 py-3.5 pr-10 text-sm font-medium transition-all duration-300 outline-none shadow-soft-xs bg-white text-gray-900 appearance-none cursor-pointer ${
              error
                ? "border-red-300 bg-red-50/40 focus:border-red-400 focus:ring-4 focus:ring-red-100"
                : "border-rose-100/80 focus:border-rose-400 focus:ring-4 focus:ring-rose-100/60"
            } ${className}`}
            {...props}
          >
            {children ||
              options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
          </select>
          <i className="ri-arrow-down-s-line absolute right-3.5 text-rose-400 text-lg pointer-events-none" />
        </div>
        {error ? (
          <p className="text-xs font-semibold text-red-500 flex items-center gap-1 mt-1">
            <i className="ri-error-warning-line" /> {error}
          </p>
        ) : helperText ? (
          <p className="text-xs text-gray-500 mt-1">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Select.displayName = "Select";
export default Select;
