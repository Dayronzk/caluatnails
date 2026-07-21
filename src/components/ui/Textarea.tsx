import React, { forwardRef } from "react";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, helperText, className = "", id, rows = 3, ...props }, ref) => {
    const textareaId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label htmlFor={textareaId} className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
            {label}
          </label>
        )}
        <textarea
          id={textareaId}
          ref={ref}
          rows={rows}
          className={`w-full rounded-2xl border px-4 py-3.5 text-sm font-medium transition-all duration-300 outline-none shadow-soft-xs bg-white text-gray-900 placeholder:text-gray-400 ${
            error
              ? "border-red-300 bg-red-50/40 focus:border-red-400 focus:ring-4 focus:ring-red-100"
              : "border-rose-100/80 focus:border-rose-400 focus:ring-4 focus:ring-rose-100/60"
          } ${className}`}
          {...props}
        />
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

Textarea.displayName = "Textarea";
export default Textarea;
