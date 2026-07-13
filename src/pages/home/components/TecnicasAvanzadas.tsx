import { useState, useEffect } from "react";
import type { CartItem } from "@/hooks/useCart";

/* ── Stripe product shape returned by our edge function ── */
interface StripeProduct {
  id: string;
  name: string;
  description: string | null;
  images: string[];
  metadata: Record<string, string>;
  price_id: string | null;
  unit_amount: number | null;   // cents
  currency: string;
}

/* ── Fallback images (used when Stripe product has no image) ── */
const FALLBACK_IMAGES = [
  "https://readdy.ai/api/search-image?query=3D%20acrylic%20nail%20sculpture%20flowers%20petals%20art%20close%20up%20professional%20beauty%20salon%20warm%20pastel%20background%20elegant%20nail%20technician%20work%20detailed&width=600&height=460&seq=shop7&orientation=landscape",
  "https://readdy.ai/api/search-image?query=polygel%20nail%20extension%20builder%20gel%20professional%20manicure%20elegant%20hands%20warm%20studio%20lighting%20rose%20gold%20tools%20beauty%20salon%20close%20up&width=600&height=460&seq=shop8&orientation=landscape",
  "https://readdy.ai/api/search-image?query=nail%20art%20fine%20brush%20painting%20floral%20marble%20acrylic%20design%20close%20up%20elegant%20beauty%20warm%20tones%20professional%20studio%20manicure%20detailed%20rose&width=600&height=460&seq=shop9&orientation=landscape",
  "https://readdy.ai/api/search-image?query=chrome%20mirror%20holographic%20nail%20powder%20pigment%20effect%20close%20up%20shiny%20elegant%20professional%20manicure%20beauty%20warm%20background%20aurora&width=600&height=460&seq=shop10&orientation=landscape",
  "https://readdy.ai/api/search-image?query=nail%20monetization%20business%20beauty%20salon%20client%20professional%20workspace%20elegant%20tools%20rose%20gold%20minimal%20studio%20light&width=600&height=460&seq=shop11&orientation=landscape",
  "https://readdy.ai/api/search-image?query=nail%20art%20certificate%20graduation%20award%20professional%20beauty%20nail%20technician%20elegant%20diploma%20studio%20warm%20light%20minimal%20background&width=600&height=460&seq=shop12&orientation=landscape",
];

function getProductImage(product: StripeProduct, idx: number): string {
  if (product.images && product.images.length > 0) return product.images[0];
  return FALLBACK_IMAGES[idx % FALLBACK_IMAGES.length];
}

function getLevelBadge(level: string) {
  if (level === "Avanzado") return "bg-rose-600 text-white";
  if (level === "Intermedio") return "bg-orange-500 text-white";
  return "bg-green-600 text-white";
}

function formatPrice(unit_amount: number, currency: string): string {
  const amount = unit_amount / 100;
  if (currency.toLowerCase() === "eur") return `${amount.toFixed(2)} €`;
  if (currency.toLowerCase() === "usd") return `$${amount.toFixed(2)}`;
  return `${amount.toFixed(2)} ${currency.toUpperCase()}`;
}

const SUPABASE_URL = import.meta.env.VITE_PUBLIC_SUPABASE_URL as string;
const LIST_FN = `${SUPABASE_URL}/functions/v1/stripe-list-products`;

interface Props {
  addItem: (item: CartItem) => void;
  isInCart: (id: string) => boolean;
}

export default function TecnicasAvanzadas({ addItem, isInCart }: Props) {
  const [products, setProducts] = useState<StripeProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [featured, setFeatured] = useState<StripeProduct | null>(null);
  const [addedFlash, setAddedFlash] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(LIST_FN, {
        headers: {
          "apikey": import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY,
          "Authorization": `Bearer ${import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY}`
        }
      });
        const data = await res.json() as { products?: StripeProduct[]; error?: string };
        if (data.error) throw new Error(data.error);
        const raw = (data.products ?? []).filter((p) => p.unit_amount && p.unit_amount > 0 && p.price_id);

        // Hardcoded main product ID - always first
        const MAIN_PRODUCT_ID = "prod_UG5ehG9IrGh4hl";
        const sorted = [...raw].sort((a, b) => {
          const aIsMain = a.id === MAIN_PRODUCT_ID ? 0 : 1;
          const bIsMain = b.id === MAIN_PRODUCT_ID ? 0 : 1;
          if (aIsMain !== bIsMain) return aIsMain - bIsMain;
          const aOrder = parseInt(a.metadata.order ?? "999", 10);
          const bOrder = parseInt(b.metadata.order ?? "999", 10);
          return aOrder - bOrder;
        });

        setProducts(sorted);
        // Default featured = first product (the main/featured one)
        setFeatured(sorted[0] ?? null);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Error al cargar productos");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleAdd = (product: StripeProduct, idx: number) => {
    addItem({
      id: product.id,
      title: product.name,
      price: (product.unit_amount ?? 0) / 100,
      image: getProductImage(product, idx),
      level: product.metadata.level ?? "Avanzado",
      lessonCount: parseInt(product.metadata.lesson_count ?? "0", 10),
      stripe_price_id: product.price_id,
    });
    setAddedFlash(product.id);
    setTimeout(() => setAddedFlash(null), 2000);
  };

  return (
    <section id="tienda" className="py-24 bg-stone-50">
      <div className="max-w-7xl mx-auto px-6 lg:px-10">

        {/* Header */}
        <div className="text-center mb-16">
          <span className="inline-block text-rose-600 text-sm font-semibold tracking-widest uppercase mb-3">
            Módulos Individuales
          </span>
          <h2 className="font-playfair text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            Elige Tu Módulo,
            <br />
            <span className="text-rose-600">Aprende a Tu Ritmo</span>
          </h2>
          <p className="text-gray-500 text-lg max-w-xl mx-auto leading-relaxed">
            Adquiere solo los módulos que necesitas. Contenido profesional, acceso de por vida y certificado al completar.
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24 gap-3">
            <i className="ri-loader-4-line text-rose-400 text-2xl animate-spin"></i>
            <span className="text-gray-400 text-sm">Cargando catálogo...</span>
          </div>
        ) : error ? (
          <div className="text-center py-16 text-red-400 text-sm flex flex-col items-center gap-3">
            <i className="ri-error-warning-line text-3xl"></i>
            <p>{error}</p>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-16 text-gray-400 text-sm">
            Aún no hay productos publicados en Stripe.
          </div>
        ) : (
          <>
            {/* ── Featured hero ── */}
            {featured && (() => {
              const featuredIdx = products.findIndex((p) => p.id === featured.id);
              return (
                <div className="relative rounded-3xl overflow-hidden mb-16 w-full" style={{ height: "420px" }}>
                  <img
                    src={getProductImage(featured, featuredIdx)}
                    alt={featured.name}
                    className="w-full h-full object-cover object-top"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent"></div>
                  <div className="absolute inset-0 flex items-center">
                    <div className="px-12 max-w-xl">
                      <div className="flex items-center gap-3 mb-4 flex-wrap">
                        {featured.metadata.level && (
                          <span className={`text-xs font-semibold px-3 py-1.5 rounded-full whitespace-nowrap ${getLevelBadge(featured.metadata.level)}`}>
                            {featured.metadata.level}
                          </span>
                        )}
                        {featured.metadata.lesson_count && (
                          <span className="text-white/60 text-xs">· {featured.metadata.lesson_count} lecciones</span>
                        )}
                        {featured.metadata.duration && (
                          <span className="text-white/60 text-xs">· {featured.metadata.duration}</span>
                        )}
                      </div>
                      <h3 className="font-playfair text-3xl lg:text-4xl font-bold text-white mb-3 leading-tight">{featured.name}</h3>
                      {featured.description && (
                        <p className="text-white/70 text-sm leading-relaxed mb-6 line-clamp-2">{featured.description}</p>
                      )}
                      <div className="flex items-center gap-5 flex-wrap">
                        <span className="text-white text-3xl font-bold whitespace-nowrap">
                          {formatPrice(featured.unit_amount!, featured.currency)}
                        </span>
                        <button
                          onClick={() => handleAdd(featured, featuredIdx)}
                          disabled={isInCart(featured.id)}
                          className={`flex items-center gap-2 px-6 py-3 rounded-full font-semibold text-sm transition-all cursor-pointer whitespace-nowrap ${
                            isInCart(featured.id)
                              ? "bg-white/20 text-white/60 cursor-not-allowed"
                              : addedFlash === featured.id
                              ? "bg-green-500 text-white"
                              : "bg-white text-gray-900 hover:bg-rose-50"
                          }`}
                        >
                          {isInCart(featured.id) ? (
                            <><i className="ri-check-line"></i> En el carrito</>
                          ) : addedFlash === featured.id ? (
                            <><i className="ri-check-line"></i> Agregado</>
                          ) : (
                            <><i className="ri-shopping-cart-2-line"></i> Agregar al carrito</>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                  {/* Selector pills */}
                  <div className="absolute bottom-6 right-6 flex gap-2 flex-wrap justify-end max-w-sm">
                    {products.map((p, idx) => (
                      <button
                        key={p.id}
                        onClick={() => setFeatured(p)}
                        className={`text-xs px-3 py-1.5 rounded-full transition-all cursor-pointer whitespace-nowrap ${
                          featured.id === p.id
                            ? "bg-white text-gray-900 font-semibold"
                            : "bg-white/20 text-white/80 hover:bg-white/30"
                        }`}
                      >
                        {p.metadata.short_name ?? `M${idx + 1}`}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* ── Product grid ── */}
            <div>
              <div className="flex items-end justify-between mb-8 flex-wrap gap-4">
                <div>
                  <span className="inline-block text-rose-500 text-xs font-semibold tracking-widest uppercase mb-2">Todos los módulos</span>
                  <h3 className="font-playfair text-2xl lg:text-3xl font-bold text-gray-900">Catálogo completo</h3>
                </div>
                <div className="hidden sm:flex items-center gap-6 text-sm text-gray-400">
                  <span className="flex items-center gap-1.5"><i className="ri-store-line text-rose-400"></i>{products.length} productos disponibles</span>
                  <span className="flex items-center gap-1.5"><i className="ri-award-line text-rose-400"></i>Certificado incluido</span>
                </div>
              </div>

              <div data-product-shop className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {products.map((product, idx) => {
                  const inCart = isInCart(product.id);
                  const flashing = addedFlash === product.id;
                  const level = product.metadata.level ?? "";
                  const lessonCount = product.metadata.lesson_count ?? "";
                  const duration = product.metadata.duration ?? "";

                  const MAIN_PRODUCT_ID = "prod_UG5ehG9IrGh4hl";
                  const isMain = product.id === MAIN_PRODUCT_ID;

                  return (
                    <article
                      key={product.id}
                      className={`group bg-white rounded-2xl border transition-all duration-300 overflow-hidden flex flex-col ${
                        isMain
                          ? "border-rose-300 ring-2 ring-rose-200"
                          : "border-gray-100 hover:border-rose-200"
                      }`}
                    >
                      {/* Image */}
                      <div
                        className="relative overflow-hidden w-full flex-shrink-0 cursor-pointer"
                        style={{ height: "180px" }}
                        onClick={() => setFeatured(product)}
                      >
                        <img
                          src={getProductImage(product, idx)}
                          alt={product.name}
                          className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                        {isMain && (
                          <div className="absolute top-0 left-0 right-0 bg-rose-600 text-white text-center text-xs font-bold py-1 tracking-widest uppercase">
                            <i className="ri-star-fill mr-1"></i>Producto Principal
                          </div>
                        )}
                        {level && (
                          <span className={`absolute ${isMain ? "top-7" : "top-3"} left-3 text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap ${getLevelBadge(level)}`}>
                            {level}
                          </span>
                        )}
                        <span className={`absolute ${isMain ? "top-7" : "top-3"} right-3 bg-black/30 backdrop-blur-sm text-white text-xs px-2 py-0.5 rounded-full whitespace-nowrap`}>
                          {product.metadata.short_name ?? `M${idx + 1}`}
                        </span>
                      </div>

                      {/* Content */}
                      <div className="p-5 flex flex-col flex-1">
                        <div className="flex items-start gap-3 mb-3">
                          <div className="w-9 h-9 flex items-center justify-center rounded-xl flex-shrink-0 bg-rose-50">
                            <i className={`${product.metadata.icon ?? "ri-book-line"} text-sm text-rose-600`}></i>
                          </div>
                          <h4 className="font-semibold text-gray-900 text-sm leading-snug group-hover:text-rose-700 transition-colors">
                            {product.name}
                          </h4>
                        </div>

                        {product.description && (
                          <p className="text-gray-400 text-xs leading-relaxed line-clamp-2 mb-4 flex-1">{product.description}</p>
                        )}

                        {(lessonCount || duration) && (
                          <div className="flex items-center gap-3 pt-3 border-t border-gray-100 mb-4">
                            {lessonCount && (
                              <span className="flex items-center gap-1 text-xs text-gray-400">
                                <i className="ri-book-2-line"></i>{lessonCount} lec.
                              </span>
                            )}
                            {duration && (
                              <span className="flex items-center gap-1 text-xs text-gray-400">
                                <i className="ri-time-line"></i>{duration}
                              </span>
                            )}
                            <span className="ml-auto flex items-center gap-1 text-xs text-gray-400">
                              <i className="ri-award-line"></i>Cert.
                            </span>
                          </div>
                        )}

                        <div className="flex items-center justify-between gap-3 mt-auto">
                          <span className="text-xl font-bold text-gray-900">
                            {formatPrice(product.unit_amount!, product.currency)}
                          </span>
                          <button
                            onClick={() => handleAdd(product, idx)}
                            disabled={inCart}
                            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                              inCart
                                ? "bg-green-50 text-green-600 cursor-not-allowed"
                                : flashing
                                ? "bg-green-500 text-white"
                                : "bg-rose-500 hover:bg-rose-600 text-white"
                            }`}
                          >
                            {inCart ? (
                              <><i className="ri-check-line"></i> En carrito</>
                            ) : flashing ? (
                              <><i className="ri-check-line"></i> Listo</>
                            ) : (
                              <><i className="ri-shopping-cart-2-line"></i> Agregar</>
                            )}
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>

            {/* Trust badges */}
            <div className="mt-14 grid grid-cols-2 sm:grid-cols-4 gap-6">
              {[
                { icon: "ri-shield-check-line", title: "Pago seguro", desc: "Procesado por Stripe" },
                { icon: "ri-infinity-line", title: "Acceso de por vida", desc: "Sin vencimiento" },
                { icon: "ri-award-line", title: "Certificado", desc: "Al completar el módulo" },
                { icon: "ri-customer-service-2-line", title: "Soporte directo", desc: "Resolvemos tus dudas" },
              ].map((b) => (
                <div key={b.title} className="flex items-center gap-4 bg-white rounded-2xl border border-gray-100 p-5">
                  <div className="w-10 h-10 flex items-center justify-center bg-rose-50 rounded-xl flex-shrink-0">
                    <i className={`${b.icon} text-rose-600 text-base`}></i>
                  </div>
                  <div>
                    <p className="text-gray-900 font-semibold text-sm">{b.title}</p>
                    <p className="text-gray-400 text-xs mt-0.5">{b.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
