import React from "react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "gold" | "danger";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  icon?: string;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = "primary",
  size = "md",
  isLoading = false,
  icon,
  children,
  className = "",
  disabled,
  type = "button",
  ...props
}) => {
  const baseStyles = "inline-flex items-center justify-center font-bold transition-all duration-300 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed select-none rounded-full shrink-0";

  const sizeStyles = {
    sm: "px-4 py-2 text-xs gap-1.5 shadow-soft-xs",
    md: "px-6 py-3 text-sm gap-2 shadow-soft-sm hover:scale-[1.02]",
    lg: "px-8 py-4 text-base gap-2.5 shadow-soft-md hover:scale-[1.02]",
  };

  const variantStyles = {
    primary: "bg-gradient-to-r from-rose-500 via-pink-500 to-rose-600 hover:opacity-95 text-white border border-rose-400/30",
    secondary: "bg-rose-50/80 hover:bg-rose-100/80 text-rose-700 border border-rose-200/60 shadow-soft-xs",
    outline: "bg-white/80 hover:bg-rose-50/60 text-gray-800 border border-rose-200/80 hover:border-rose-400 shadow-soft-xs",
    ghost: "bg-transparent hover:bg-rose-50/60 text-rose-600 hover:text-rose-700 shadow-none",
    gold: "bg-gradient-to-r from-amber-400 to-amber-500 hover:opacity-95 text-white border border-amber-300/40 shadow-soft-sm",
    danger: "bg-gradient-to-r from-red-500 to-rose-600 hover:opacity-95 text-white border border-red-400/30 shadow-soft-sm",
  };

  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {isLoading ? (
        <i className="ri-loader-4-line animate-spin text-base" />
      ) : icon ? (
        <i className={`${icon} text-base`} />
      ) : null}
      <span>{children}</span>
    </button>
  );
};

export default Button;
