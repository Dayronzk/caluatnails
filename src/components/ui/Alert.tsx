import React from "react";

export interface AlertProps {
  variant?: "info" | "success" | "warning" | "danger";
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export const Alert: React.FC<AlertProps> = ({
  variant = "info",
  title,
  children,
  className = "",
}) => {
  const variantStyles = {
    info: {
      bg: "bg-rose-50/90 border-rose-200/70 text-rose-950",
      icon: "ri-information-line text-rose-500",
    },
    success: {
      bg: "bg-emerald-50/90 border-emerald-200/70 text-emerald-950",
      icon: "ri-checkbox-circle-line text-emerald-500",
    },
    warning: {
      bg: "bg-amber-50/90 border-amber-200/70 text-amber-950",
      icon: "ri-alert-line text-amber-500",
    },
    danger: {
      bg: "bg-red-50/90 border-red-200/70 text-red-950",
      icon: "ri-error-warning-line text-red-500",
    },
  };

  const style = variantStyles[variant];

  return (
    <div className={`p-4 rounded-3xl border ${style.bg} shadow-soft-xs flex items-start gap-3.5 ${className}`}>
      <div className="w-8 h-8 rounded-2xl bg-white/80 flex items-center justify-center shrink-0 shadow-soft-xs">
        <i className={`${style.icon} text-lg`} />
      </div>
      <div className="flex-1 min-w-0">
        {title && <h4 className="font-bold text-xs sm:text-sm uppercase tracking-wider mb-0.5">{title}</h4>}
        <div className="text-xs sm:text-sm font-medium leading-relaxed">{children}</div>
      </div>
    </div>
  );
};

export default Alert;
