import React, { useEffect } from "react";

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl";
  className?: string;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = "md",
  className = "",
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) onClose();
    };
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidthClasses = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    "2xl": "max-w-2xl",
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-md animate-fadeIn">
      <div
        className="fixed inset-0"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className={`bg-white/95 backdrop-blur-xl rounded-4xl border border-rose-100/80 shadow-soft-lg w-full ${maxWidthClasses[maxWidth]} p-6 sm:p-8 relative z-10 animate-fadeIn max-h-[90vh] flex flex-col ${className}`}
      >
        <div className="flex items-center justify-between pb-4 border-b border-rose-100/60 mb-5 shrink-0">
          {title && <h3 className="font-bold text-gray-900 text-lg sm:text-xl font-playfair">{title}</h3>}
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-rose-50 hover:bg-rose-100 text-rose-600 flex items-center justify-center transition-all cursor-pointer ml-auto"
          >
            <i className="ri-close-line text-lg" />
          </button>
        </div>
        <div className="overflow-y-auto no-scrollbar flex-1">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;
