import React, { forwardRef } from "react";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: string;
  helperText?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon, helperText, className = "", id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label htmlFor={inputId} className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {icon && (
            <i className={`${icon} absolute left-4 text-gray-400 text-base pointer-events-none`} />
          )}
          <input
            id={inputId}
            ref={ref}
            className={`w-full rounded-2xl border px-4 py-3.5 text-sm font-medium transition-all duration-300 outline-none shadow-soft-xs bg-white text-gray-900 placeholder:text-gray-400 ${
              icon ? "pl-11" : ""
            } ${
              error
                ? "border-red-300 bg-red-50/40 focus:border-red-400 focus:ring-4 focus:ring-red-100"
                : "border-rose-100/80 focus:border-rose-400 focus:ring-4 focus:ring-rose-100/60"
            } ${className}`}
            {...props}
          />
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

Input.displayName = "Input";
export default Input;
