import { createContext, useContext, useState, useCallback, useEffect } from "react";
import type { ReactNode } from "react";

export interface CartItem {
  id: string;
  title: string;
  price: number;
  image: string;
  level: string;
  lessonCount: number;
  stripe_price_id?: string | null;
  itemType?: "course";
}

export interface ShopCartItem {
  id: string;
  title: string;
  price: number;
  image: string;
  category: string;
  rewardPoints: number;
  qty: number;
  itemType: "shop";
}

const STORAGE_KEY = "nail_course_cart";
const SHOP_STORAGE_KEY = "nail_shop_cart";

function loadCart(): CartItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as CartItem[]) : [];
  } catch {
    return [];
  }
}

function loadShopCart(): ShopCartItem[] {
  try {
    const raw = localStorage.getItem(SHOP_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ShopCartItem[]) : [];
  } catch {
    return [];
  }
}

interface CartContextValue {
  items: CartItem[];
  shopItems: ShopCartItem[];
  isOpen: boolean;
  setIsOpen: (v: boolean) => void;
  count: number;
  total: number;
  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
  isInCart: (id: string) => boolean;
  clearCourseCart: () => void;
  addShopItem: (item: Omit<ShopCartItem, "itemType" | "qty"> & { qty?: number }) => void;
  removeShopItem: (id: string) => void;
  updateShopQty: (id: string, qty: number) => void;
  isShopInCart: (id: string) => boolean;
  clearShopCart: () => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(loadCart);
  const [shopItems, setShopItems] = useState<ShopCartItem[]>(loadShopCart);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    localStorage.setItem(SHOP_STORAGE_KEY, JSON.stringify(shopItems));
  }, [shopItems]);

  const addItem = useCallback((item: CartItem) => {
    setItems((prev) => {
      if (prev.some((i) => i.id === item.id)) return prev;
      return [...prev, { ...item, itemType: "course" }];
    });
    setIsOpen(true);
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const isInCart = useCallback(
    (id: string) => items.some((i) => i.id === id),
    [items]
  );

  const addShopItem = useCallback(
    (item: Omit<ShopCartItem, "itemType" | "qty"> & { qty?: number }) => {
      setShopItems((prev) => {
        const existing = prev.find((i) => i.id === item.id);
        if (existing) {
          return prev.map((i) =>
            i.id === item.id ? { ...i, qty: i.qty + (item.qty ?? 1) } : i
          );
        }
        return [...prev, { ...item, qty: item.qty ?? 1, itemType: "shop" }];
      });
      setIsOpen(true);
    },
    []
  );

  const removeShopItem = useCallback((id: string) => {
    setShopItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const updateShopQty = useCallback((id: string, qty: number) => {
    if (qty <= 0) {
      setShopItems((prev) => prev.filter((i) => i.id !== id));
    } else {
      setShopItems((prev) =>
        prev.map((i) => (i.id === id ? { ...i, qty } : i))
      );
    }
  }, []);

  const isShopInCart = useCallback(
    (id: string) => shopItems.some((i) => i.id === id),
    [shopItems]
  );

  const clearCourseCart = useCallback(() => setItems([]), []);
  const clearShopCart = useCallback(() => setShopItems([]), []);
  const clearCart = useCallback(() => {
    setItems([]);
    setShopItems([]);
  }, []);

  const courseTotal = items.reduce((s, i) => s + i.price, 0);
  const shopTotal = shopItems.reduce((s, i) => s + i.price * i.qty, 0);
  const total = courseTotal + shopTotal;
  const count = items.length + shopItems.reduce((s, i) => s + i.qty, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        shopItems,
        isOpen,
        setIsOpen,
        count,
        total,
        addItem,
        removeItem,
        isInCart,
        clearCourseCart,
        addShopItem,
        removeShopItem,
        updateShopQty,
        isShopInCart,
        clearShopCart,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCartContext(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCartContext must be used inside CartProvider");
  return ctx;
}
