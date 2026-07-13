import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useSEO } from "@/hooks/useSEO";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";
import ProductDetailPopup from "@/pages/tienda/components/ProductDetailPopup";
import CheckoutModal from "@/pages/tienda/components/ShopCheckoutModal";
import FloatingCart from "@/pages/home/components/FloatingCart";
import StripeProductsCarousel from "@/pages/tienda/components/StripeProductsCarousel";

interface ShopProduct {
  id: string;
  name: string;
  description: string | null;
  price: number;
  stock: number;
  image_url: string | null;
  category: string;
  reward_points: number;
  active: boolean;
}

const CATEGORY_ICONS: Record<string, string> = {
  "Kits": "ri-gift-line",
  "Herramientas": "ri-tools-line",
  "Equipos": "ri-flashlight-line",
  "Geles": "ri-drop-line",
  "Esmaltes": "ri-palette-line",
  "Accesorios": "ri-star-line",
  "General": "ri-store-line",
};

const FALLBACK_IMAGES: Record<string, string> = {
  "Kits": "https://readdy.ai/api/search-image?query=professional%20nail%20art%20kit%20tools%20brushes%20gel%20polish%20elegant%20flat%20lay%20rose%20gold%20marble%20surface%20beauty%20salon%20premium%20manicure%20supplies%20luxury%20minimal&width=600&height=500&seq=shopcat1&orientation=portrait",
  "Herramientas": "https://readdy.ai/api/search-image?query=professional%20nail%20art%20brushes%20tools%20set%20elegant%20flat%20lay%20white%20marble%20background%20beauty%20salon%20manicure%20pedicure%20premium%20minimal%20rose%20gold&width=600&height=500&seq=shopcat2&orientation=portrait",
  "Equipos": "https://readdy.ai/api/search-image?query=professional%20UV%20LED%20nail%20lamp%20equipment%20beauty%20salon%20elegant%20white%20background%20manicure%20pedicure%20premium%20minimal%20modern&width=600&height=500&seq=shopcat3&orientation=portrait",
  "Geles": "https://readdy.ai/api/search-image?query=nail%20gel%20polish%20bottles%20collection%20elegant%20flat%20lay%20white%20marble%20background%20beauty%20salon%20manicure%20premium%20minimal%20pastel%20colors&width=600&height=500&seq=shopcat4&orientation=portrait",
  "Esmaltes": "https://readdy.ai/api/search-image?query=nail%20polish%20bottles%20collection%20elegant%20flat%20lay%20rose%20gold%20marble%20background%20beauty%20salon%20manicure%20premium%20minimal%20pastel%20colors&width=600&height=500&seq=shopcat5&orientation=portrait",
  "General": "https://readdy.ai/api/search-image?query=professional%20nail%20art%20beauty%20salon%20products%20elegant%20flat%20lay%20white%20marble%20background%20manicure%20pedicure%20premium%20minimal%20rose%20gold&width=600&height=500&seq=shopcat6&orientation=portrait",
};

function getProductImage(product: ShopProduct): string {
  if (product.image_url) return product.image_url;
  return FALLBACK_IMAGES[product.category] ?? FALLBACK_IMAGES["General"];
}

export default function TiendaPage() {
  useSEO({
    title: "Tienda Profesional de Manicura — Kits, Geles y Herramientas",
    description: "Compra productos profesionales de manicura y pedicura seleccionados por expertas NAILOX. Kits, geles, esmaltes y herramientas con envío a domicilio. Gana puntos con cada compra.",
    ogTitle: "Tienda NAILOX — Todo lo que necesitas para brillar en cada cita",
    ogDescription: "Productos profesionales de manicura y pedicura. Kits completos, geles, esmaltes y herramientas. Gana puntos con cada compra y canjéalos en tus próximos pedidos.",
    ogImage: "https://readdy.ai/api/search-image?query=professional%20nail%20art%20products%20shop%20elegant%20flat%20lay%20rose%20gold%20marble%20surface%20beauty%20salon%20premium%20manicure%20supplies%20gel%20polish%20brushes%20tools%20luxury%20minimal%20branding&width=1200&height=630&seq=og-tienda-v1&orientation=landscape",
    ogUrl: "/tienda",
    canonical: "/tienda",
    keywords: "tienda manicura, productos nail art, gel uñas, kit manicura profesional, esmaltes semipermanentes",
  });

  const { user } = useAuth();
  const cart = useCart();
  const [searchParams] = useSearchParams();
  const [products, setProducts] = useState<ShopProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCat, setFilterCat] = useState("Todos");
  const [selectedProduct, setSelectedProduct] = useState<ShopProduct | null>(null);
  const [checkoutProduct, setCheckoutProduct] = useState<ShopProduct | null>(null);
  const [checkoutQty, setCheckoutQty] = useState(1);
  const [paymentStatus, setPaymentStatus] = useState<"success" | "cancelled" | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("shop_products")
        .select("*")
        .eq("active", true)
        .order("category")
        .order("name");
      setProducts((data ?? []) as ShopProduct[]);
      setLoading(false);
    };
    load();
  }, []);

  // Handle Stripe return
  useEffect(() => {
    const status = searchParams.get("payment");
    const orderId = searchParams.get("order");
    if (status === "success" && orderId) {
      // Mark order as paid
      supabase
        .from("shop_orders")
        .update({ status: "confirmed" })
        .eq("id", orderId)
        .then(async () => {
          // Award points if user logged in
          const { data: order } = await supabase
            .from("shop_orders")
            .select("user_id, points_earned, items")
            .eq("id", orderId)
            .maybeSingle();

          if (order?.user_id && order.points_earned > 0) {
            await supabase.from("points_transactions").insert({
              user_id: order.user_id,
              points: order.points_earned,
              type: "shop_purchase",
              description: `Compra en tienda`,
              reference_id: orderId,
            });
            const { data: profile } = await supabase
              .from("profiles")
              .select("points")
              .eq("id", order.user_id)
              .maybeSingle();
            if (profile) {
              await supabase
                .from("profiles")
                .update({ points: (profile.points ?? 0) + order.points_earned })
                .eq("id", order.user_id);
            }
          }
        });

      cart.clearShopCart();
      setPaymentStatus("success");
    } else if (status === "cancelled") {
      setPaymentStatus("cancelled");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const categories = ["Todos", ...Array.from(new Set(products.map((p) => p.category))).sort()];
  const filtered = filterCat === "Todos" ? products : products.filter((p) => p.category === filterCat);

  const handleBuy = (product: ShopProduct, qty = 1) => {
    setCheckoutProduct(product);
    setCheckoutQty(qty);
    setSelectedProduct(null);
  };

  const handleAddToCart = (product: ShopProduct) => {
    cart.addShopItem({
      id: product.id,
      title: product.name,
      price: Number(product.price),
      image: getProductImage(product),
      category: product.category,
      rewardPoints: product.reward_points,
      qty: 1,
    });
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 cursor-pointer">
            <span className="font-playfair text-xl font-bold tracking-widest text-gray-900">
              NAIL<span className="text-rose-500">OX</span>
            </span>
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm text-gray-600">
            <Link to="/" className="hover:text-rose-600 transition-colors cursor-pointer">Inicio</Link>
            <Link to="/reservar" className="hover:text-rose-600 transition-colors cursor-pointer">Reservar</Link>
            <Link to="/profesionales" className="hover:text-rose-600 transition-colors cursor-pointer">Profesionales</Link>
            <span className="text-rose-600 font-semibold">Tienda</span>
          </nav>
          <div className="flex items-center gap-3">
            {/* Cart button */}
            <button
              onClick={() => cart.setIsOpen(true)}
              className="relative flex items-center gap-2 px-4 py-2 rounded-full border border-gray-200 text-gray-700 hover:border-rose-300 hover:text-rose-600 transition-colors cursor-pointer"
            >
              <i className="ri-shopping-cart-2-line text-base"></i>
              <span className="text-sm font-medium whitespace-nowrap">Carrito</span>
              {cart.count > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 flex items-center justify-center bg-rose-500 text-white text-xs font-bold rounded-full">
                  {cart.count}
                </span>
              )}
            </button>
            {user ? (
              <Link to="/mi-cuenta" className="text-sm font-medium px-4 py-2 rounded-full border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer whitespace-nowrap">
                Mi cuenta
              </Link>
            ) : (
              <Link to="/login" className="text-sm font-medium px-4 py-2 rounded-full bg-rose-500 hover:bg-rose-600 text-white transition-colors cursor-pointer whitespace-nowrap">
                Iniciar sesión
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Payment banners */}
      {paymentStatus === "success" && (
        <div className="bg-emerald-500 text-white px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <i className="ri-check-double-line text-2xl"></i>
            <div>
              <p className="font-semibold">¡Pedido confirmado!</p>
              <p className="text-sm text-white/80">Recibirás un correo con los detalles de tu pedido.</p>
            </div>
          </div>
          <button onClick={() => setPaymentStatus(null)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/20 cursor-pointer">
            <i className="ri-close-line text-lg"></i>
          </button>
        </div>
      )}
      {paymentStatus === "cancelled" && (
        <div className="bg-amber-500 text-white px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <i className="ri-information-line text-2xl"></i>
            <p className="font-semibold">Pago cancelado. Tus productos siguen en el carrito.</p>
          </div>
          <button onClick={() => setPaymentStatus(null)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/20 cursor-pointer">
            <i className="ri-close-line text-lg"></i>
          </button>
        </div>
      )}

      {/* Hero */}
      <section className="bg-gradient-to-br from-rose-50 via-white to-pink-50 py-16 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-rose-100 text-rose-600 text-xs font-semibold px-4 py-1.5 rounded-full mb-5">
            <i className="ri-store-line"></i>Tienda Profesional
          </div>
          <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>
            Todo lo que necesitas para
            <br /><span className="text-rose-500">brillar en cada cita</span>
          </h1>
          <p className="text-gray-500 text-lg max-w-xl mx-auto mb-6">
            Productos profesionales seleccionados por nuestras expertas. Gana puntos con cada compra y canjéalos en tus próximos pedidos.
          </p>
          <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-500">
            {[
              { icon: "ri-coin-line", text: "Gana puntos con cada compra" },
              { icon: "ri-store-line", text: "Recogida en centro disponible" },
              { icon: "ri-truck-line", text: "Envío a domicilio" },
              { icon: "ri-shield-check-line", text: "Pago seguro con Stripe" },
            ].map((item) => (
              <div key={item.text} className="flex items-center gap-1.5">
                <i className={`${item.icon} text-rose-400`}></i>{item.text}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stripe Products Carousel */}
      <StripeProductsCarousel />

      {/* Category filter */}
      <div className="sticky top-16 z-20 bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 py-3 flex gap-2 overflow-x-auto">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCat(cat)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all cursor-pointer whitespace-nowrap ${
                filterCat === cat ? "bg-rose-500 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {cat !== "Todos" && <i className={`${CATEGORY_ICONS[cat] ?? "ri-store-line"} text-xs`}></i>}
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Products grid */}
      <main className="max-w-7xl mx-auto px-6 py-10 pb-28">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-80 rounded-2xl bg-gray-100 animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <i className="ri-store-line text-4xl text-gray-200 block mb-3"></i>
            <p className="text-gray-400">No hay productos en esta categoría</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filtered.map((product) => {
              const inCart = cart.isShopInCart(product.id);
              return (
                <article
                  key={product.id}
                  className="bg-white rounded-2xl border border-gray-100 overflow-hidden group hover:border-rose-200 transition-all flex flex-col"
                >
                  {/* Image */}
                  <button onClick={() => setSelectedProduct(product)} className="w-full cursor-pointer block">
                    <div className="w-full h-52 overflow-hidden relative">
                      <img
                        src={getProductImage(product)}
                        alt={product.name}
                        className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      {product.reward_points > 0 && (
                        <div className="absolute top-3 right-3 bg-amber-400 text-white text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                          <i className="ri-coin-line text-xs"></i>+{product.reward_points} pts
                        </div>
                      )}
                      {product.stock <= 5 && product.stock > 0 && (
                        <div className="absolute top-3 left-3 bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">
                          ¡Últimas {product.stock}!
                        </div>
                      )}
                      {product.stock === 0 && (
                        <div className="absolute inset-0 bg-gray-900/50 flex items-center justify-center">
                          <span className="bg-white text-gray-700 text-sm font-semibold px-4 py-2 rounded-full">Agotado</span>
                        </div>
                      )}
                      {inCart && (
                        <div className="absolute bottom-3 left-3 bg-emerald-500 text-white text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                          <i className="ri-check-line text-xs"></i>En carrito
                        </div>
                      )}
                    </div>
                  </button>

                  <div className="p-4 flex flex-col flex-1">
                    <span className="text-xs text-rose-500 font-medium">{product.category}</span>
                    <h3
                      onClick={() => setSelectedProduct(product)}
                      className="font-semibold text-gray-900 text-sm mt-0.5 mb-1 line-clamp-2 cursor-pointer hover:text-rose-600 transition-colors"
                    >
                      {product.name}
                    </h3>
                    <p className="text-xs text-gray-400 line-clamp-2 mb-3 flex-1">{product.description}</p>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xl font-bold text-gray-900">€{Number(product.price).toFixed(2)}</span>
                    </div>
                    {/* Action buttons */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAddToCart(product)}
                        disabled={product.stock === 0}
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
                        onClick={() => handleBuy(product)}
                        disabled={product.stock === 0}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-semibold transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
                      >
                        <i className="ri-secure-payment-line"></i>Comprar
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-rose-50 border-t border-rose-100 py-8 mt-10">
        <div className="max-w-7xl mx-auto px-6 text-center text-sm text-gray-500">
          <p>© 2025 NAILOX · <Link to="/privacidad" className="hover:text-rose-600 cursor-pointer">Privacidad</Link> · <Link to="/terminos" className="hover:text-rose-600 cursor-pointer">Términos</Link></p>
        </div>
      </footer>

      {/* Product detail popup */}
      {selectedProduct && (
        <ProductDetailPopup
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onBuy={(qty) => handleBuy(selectedProduct, qty)}
          getImage={getProductImage}
        />
      )}

      {/* Checkout modal (direct buy) */}
      {checkoutProduct && (
        <CheckoutModal
          product={checkoutProduct}
          qty={checkoutQty}
          user={user}
          getImage={getProductImage}
          onClose={() => setCheckoutProduct(null)}
        />
      )}

      {/* Shared floating cart */}
      <FloatingCart
        items={cart.items}
        shopItems={cart.shopItems}
        count={cart.count}
        total={cart.total}
        isOpen={cart.isOpen}
        setIsOpen={cart.setIsOpen}
        removeItem={cart.removeItem}
        removeShopItem={cart.removeShopItem}
        updateShopQty={cart.updateShopQty}
        clearCart={cart.clearCart}
        clearCourseCart={cart.clearCourseCart}
        clearShopCart={cart.clearShopCart}
      />
    </div>
  );
}
