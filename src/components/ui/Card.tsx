import React from "react";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "glass" | "bordered" | "gradient";
  padding?: "none" | "sm" | "md" | "lg";
  children: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({
  variant = "glass",
  padding = "md",
  children,
  className = "",
  ...props
}) => {
  const baseStyles = "rounded-3xl sm:rounded-4xl transition-all duration-300 relative overflow-hidden";

  const paddingStyles = {
    none: "p-0",
    sm: "p-4 sm:p-5",
    md: "p-6 sm:p-7",
    lg: "p-8 sm:p-10",
  };

  const variantStyles = {
    default: "bg-white border border-rose-100/70 shadow-soft-sm",
    glass: "bg-white/90 backdrop-blur-md border border-rose-100/70 shadow-soft-sm hover:shadow-soft-md",
    bordered: "bg-white/80 border-2 border-rose-200/60 shadow-soft-xs",
    gradient: "bg-gradient-to-br from-rose-50/90 via-pink-50/40 to-white border border-rose-200/60 shadow-soft-md",
  };

  return (
    <div className={`${baseStyles} ${paddingStyles[padding]} ${variantStyles[variant]} ${className}`} {...props}>
      {children}
    </div>
  );
};

export default Card;
