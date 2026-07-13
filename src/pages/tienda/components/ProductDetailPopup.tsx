import { useState } from "react";

interface ShopProduct {
  id: string;
  name: string;
  description: string | null;
  price: number;
  stock: number;
  image_url: string | null;
  category: string;
  reward_points: number;
}

interface Props {
  product: ShopProduct;
  onClose: () => void;
  onBuy: (qty: number) => void;
  getImage: (p: ShopProduct) => string;
}

export default function ProductDetailPopup({ product, onClose, onBuy, getImage }: Props) {
  const [qty, setQty] = useState(1);

  const maxQty = Math.min(product.stock, 10);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Image */}
        <div className="relative w-full h-64 sm:h-80 overflow-hidden rounded-t-2xl">
          <img
            src={getImage(product)}
            alt={product.name}
            className="w-full h-full object-cover object-top"
          />
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-9 h-9 flex items-center justify-center rounded-full bg-black/30 hover:bg-black/50 text-white transition-colors cursor-pointer"
          >
            <i className="ri-close-line text-lg"></i>
          </button>
          {product.reward_points > 0 && (
            <div className="absolute bottom-4 left-4 bg-amber-400 text-white text-sm font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5">
              <i className="ri-coin-line"></i>+{product.reward_points} puntos al comprar
            </div>
          )}
        </div>

        <div className="p-6">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <span className="text-xs text-rose-500 font-semibold uppercase tracking-wide">{product.category}</span>
              <h2 className="text-2xl font-bold text-gray-900 mt-1">{product.name}</h2>
            </div>
            <div className="text-right shrink-0">
              <p className="text-3xl font-bold text-gray-900">€{Number(product.price).toFixed(2)}</p>
              {product.stock > 0 ? (
                <p className="text-xs text-emerald-600 font-medium mt-1">
                  <i className="ri-checkbox-circle-line mr-1"></i>
                  {product.stock <= 5 ? `¡Solo ${product.stock} disponibles!` : "En stock"}
                </p>
              ) : (
                <p className="text-xs text-red-500 font-medium mt-1">Agotado</p>
              )}
            </div>
          </div>

          {product.description && (
            <p className="text-gray-600 text-sm leading-relaxed mb-6">{product.description}</p>
          )}

          {/* Features */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            {[
              { icon: "ri-truck-line", label: "Envío disponible" },
              { icon: "ri-store-line", label: "Recogida en centro" },
              { icon: "ri-shield-check-line", label: "Calidad garantizada" },
            ].map(f => (
              <div key={f.label} className="flex flex-col items-center gap-1.5 p-3 bg-gray-50 rounded-xl text-center">
                <i className={`${f.icon} text-rose-400 text-lg`}></i>
                <span className="text-xs text-gray-500">{f.label}</span>
              </div>
            ))}
          </div>

          {/* Qty + buy */}
          {product.stock > 0 && (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 border border-gray-200 rounded-xl p-1">
                <button
                  onClick={() => setQty(q => Math.max(1, q - 1))}
                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors cursor-pointer text-gray-600"
                >
                  <i className="ri-subtract-line"></i>
                </button>
                <span className="w-8 text-center font-semibold text-gray-900 text-sm">{qty}</span>
                <button
                  onClick={() => setQty(q => Math.min(maxQty, q + 1))}
                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors cursor-pointer text-gray-600"
                >
                  <i className="ri-add-line"></i>
                </button>
              </div>
              <button
                onClick={() => onBuy(qty)}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-rose-500 hover:bg-rose-600 text-white font-semibold rounded-xl transition-colors cursor-pointer whitespace-nowrap"
              >
                <i className="ri-shopping-bag-line"></i>
                Comprar — €{(Number(product.price) * qty).toFixed(2)}
              </button>
            </div>
          )}

          {product.reward_points > 0 && product.stock > 0 && (
            <p className="text-xs text-amber-600 text-center mt-3">
              <i className="ri-coin-line mr-1"></i>
              Ganarás <strong>+{product.reward_points * qty} puntos</strong> con esta compra
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
