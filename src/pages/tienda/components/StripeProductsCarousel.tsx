import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";
import StripeProductCheckoutModal from "@/pages/tienda/components/StripeProductCheckoutModal";

const SUPABASE_URL = import.meta.env.VITE_PUBLIC_SUPABASE_URL as string;
const LIST_PRODUCTS_FN = `${SUPABASE_URL}/functions/v1/stripe-list-products`;

const FEATURED_PRODUCT_ID = "prod_UG5ehG9IrGh4hl";

export interface StripeProduct {
  id: string;
  name: string;
  description: string | null;
  images: string[];
  metadata: Record<string, string>;
  price_id: string | null;
  unit_amount: number | null;
  currency: string;
}

function getStripeImage(product: StripeProduct): string {
  if (product.images && product.images.length > 0) return product.images[0];
  return "https://readdy.ai/api/search-image?query=professional%20nail%20art%20beauty%20product%20elegant%20minimal%20white%20marble%20background%20rose%20gold%20manicure%20pedicure%20premium%20salon%20quality%20cosmetics&width=600&height=500&seq=stripe-fallback-1&orientation=portrait";
}

function formatPrice(amount: number | null, currency: string): string {
  if (amount === null) return "Consultar precio";
  const value = amount / 100;
  return new Intl.NumberFormat("es-ES", { style: "currency", currency: currency.toUpperCase() }).format(value);
}

function sortProducts(products: StripeProduct[]): StripeProduct[] {
  const featured = products.find((p) => p.id === FEATURED_PRODUCT_ID);
  const rest = products.filter((p) => p.id !== FEATURED_PRODUCT_ID);
  return featured ? [featured, ...rest] : products;
}

export default function StripeProductsCarousel() {
  const { user } = useAuth();
  const cart = useCart();
  const [products, setProducts] = useState<StripeProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [checkoutProduct, setCheckoutProduct] = useState<StripeProduct | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(LIST_PRODUCTS_FN, {
          method: "GET",
          headers: {
            "apikey": import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY as string,
            "Authorization": `Bearer ${import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY as string}`
          }
        });
        const data = await res.json() as { products?: StripeProduct[]; error?: string };
        if (data.error) throw new Error(data.error);
        setProducts(sortProducts(data.products ?? []));
      } catch (e) {
        setError(e instanceof Error ? e.message : "Error al cargar productos");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const updateScrollButtons = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    updateScrollButtons();
    el.addEventListener("scroll", updateScrollButtons);
    window.addEventListener("resize", updateScrollButtons);
    return () => {
      el.removeEventListener("scroll", updateScrollButtons);
      window.removeEventListener("resize", updateScrollButtons);
    };
  }, [products]);

  const scroll = (dir: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir === "left" ? -320 : 320, behavior: "smooth" });
  };

  const isInCart = (productId: string) => cart.isShopInCart(`stripe_${productId}`);

  const handleAddToCart = (product: StripeProduct) => {
    if (!product.unit_amount) return;
    cart.addShopItem({
      id: `stripe_${product.id}`,
      title: product.name,
      price: product.unit_amount / 100,
      image: getStripeImage(product),
      category: "Tienda",
      rewardPoints: 0,
      qty: 1,
    });
  };

  if (!loading && (error || products.length === 0)) return null;

  return (
    <>
      <section className="py-12 px-6 bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto">
          {/* Section header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-900" style={{ fontFamily: "'Playfair Display', serif" }}>
                Productos destacados
              </h2>
              <p className="text-sm text-gray-400 mt-1">Selección premium disponible con pago inmediato</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => scroll("left")}
                disabled={!canScrollLeft}
                className="w-9 h-9 flex items-center justify-center rounded-full border border-gray-200 hover:border-rose-300 hover:text-rose-500 text-gray-500 transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <i className="ri-arrow-left-s-line text-lg"></i>
              </button>
              <button
                onClick={() => scroll("right")}
                disabled={!canScrollRight}
                className="w-9 h-9 flex items-center justify-center rounded-full border border-gray-200 hover:border-rose-300 hover:text-rose-500 text-gray-500 transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <i className="ri-arrow-right-s-line text-lg"></i>
              </button>
            </div>
          </div>

          {/* Carousel */}
          {loading ? (
            <div className="flex gap-5 overflow-hidden">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="w-64 shrink-0 h-80 rounded-2xl bg-gray-100 animate-pulse" />
              ))}
            </div>
          ) : (
            <div
              ref={scrollRef}
              className="flex gap-5 overflow-x-auto pb-2 scroll-smooth"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              {products.map((product) => {
                const inCart = isInCart(product.id);
                const hasPrice = product.unit_amount !== null && product.price_id !== null;
                const isFeatured = product.id === FEATURED_PRODUCT_ID;

                return (
                  <article
                    key={product.id}
                    className={`w-64 shrink-0 rounded-2xl overflow-hidden group transition-all flex flex-col ${
                      isFeatured
                        ? "border-2 border-rose-300 bg-white"
                        : "border border-gray-100 bg-white hover:border-rose-200"
                    }`}
                  >
                    {/* Image */}
                    <div className="w-full h-48 overflow-hidden relative">
                      <img
                        src={getStripeImage(product)}
                        alt={product.name}
                        className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                      {/* Featured badge */}
                      {isFeatured && (
                        <div className="absolute top-3 left-3 bg-rose-500 text-white text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                          <i className="ri-star-fill text-xs"></i>Destacado
                        </div>
                      )}

                      {/* In cart badge */}
                      {inCart && (
                        <div className="absolute bottom-3 left-3 bg-emerald-500 text-white text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                          <i className="ri-check-line text-xs"></i>En carrito
                        </div>
                      )}
                    </div>

                    <div className="p-4 flex flex-col flex-1">
                      <h3 className="font-semibold text-gray-900 text-sm mt-0.5 mb-1 line-clamp-2">
                        {product.name}
                      </h3>
                      {product.description && (
                        <p className="text-xs text-gray-400 line-clamp-2 mb-3 flex-1">{product.description}</p>
                      )}
                      <div className="flex items-center justify-between mb-3 mt-auto">
                        <span className={`text-xl font-bold ${isFeatured ? "text-rose-600" : "text-gray-900"}`}>
                          {formatPrice(product.unit_amount, product.currency)}
                        </span>
                      </div>
                      {/* Action buttons */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleAddToCart(product)}
                          disabled={!hasPrice}
                          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap ${
                            inCart
                              ? "bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-100"
                              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                          }`}
                        >
                          <i className={inCart ? "ri-check-line" : "ri-shopping-cart-2-line"}></i>
                          {inCart ? "En carrito" : "Al carrito"}
                        </button>
                        <button
                          onClick={() => setCheckoutProduct(product)}
                          disabled={!hasPrice}
                          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap ${
                            isFeatured
                              ? "bg-rose-500 hover:bg-rose-600 text-white"
                              : "bg-rose-500 hover:bg-rose-600 text-white"
                          }`}
                        >
                          <i className="ri-shopping-bag-line"></i>Comprar
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {checkoutProduct && (
        <StripeProductCheckoutModal
          product={checkoutProduct}
          user={user}
          getImage={getStripeImage}
          onClose={() => setCheckoutProduct(null)}
        />
      )}
    </>
  );
}
