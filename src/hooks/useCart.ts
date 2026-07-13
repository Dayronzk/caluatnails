// Re-export types for backward compatibility
export type { CartItem, ShopCartItem } from "@/lib/CartContext";
export type AnyCartItem = import("@/lib/CartContext").CartItem | import("@/lib/CartContext").ShopCartItem;

// useCart now delegates to the global CartContext
export { useCartContext as useCart } from "@/lib/CartContext";
