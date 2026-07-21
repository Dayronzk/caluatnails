import React from "react";

export interface BadgeProps {
  variant?: "rose" | "pink" | "gold" | "emerald" | "amber" | "slate" | "sky";
  size?: "sm" | "md";
  icon?: string;
  children: React.ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = "rose",
  size = "md",
  icon,
  children,
  className = "",
}) => {
  const baseStyles = "inline-flex items-center gap-1.5 font-bold rounded-full transition-all shrink-0 uppercase tracking-wider";

  const sizeStyles = {
    sm: "text-[10px] px-2.5 py-0.5",
    md: "text-[11px] px-3.5 py-1",
  };

  const variantStyles = {
    rose: "bg-rose-100/70 text-rose-700 border border-rose-200/50",
    pink: "bg-pink-100/70 text-pink-700 border border-pink-200/50",
    gold: "bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-soft-xs",
    emerald: "bg-emerald-100/80 text-emerald-800 border border-emerald-200/60",
    amber: "bg-amber-100/80 text-amber-800 border border-amber-200/60",
    slate: "bg-slate-100/80 text-slate-700 border border-slate-200/60",
    sky: "bg-sky-100/80 text-sky-800 border border-sky-200/60",
  };

  return (
    <span className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}>
      {icon && <i className={`${icon} text-xs`} />}
      <span>{children}</span>
    </span>
  );
};

export default Badge;
