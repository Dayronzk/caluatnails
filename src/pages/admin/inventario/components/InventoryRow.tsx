import { DBInventory } from "@/lib/types";

interface Props {
  item: DBInventory;
  onEdit: () => void;
  onDelete: () => void;
}

export default function InventoryRow({ item, onEdit, onDelete }: Props) {
  const isLowStock = item.quantity <= item.min_stock;

  return (
    <tr className="hover:bg-gray-50/60 transition-colors group">
      <td className="px-4 py-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${
            item.type === 'insumo' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'
          }`}>
            {item.name.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="font-semibold text-gray-900">{item.name}</p>
              {item.brand && (
                <span className="px-2 py-0.5 rounded-md bg-gray-100 text-[10px] font-bold text-gray-500 uppercase tracking-tight">
                  {item.brand}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {item.category && (
                <span className="text-[10px] text-rose-400 font-medium">{item.category}</span>
              )}
              {item.sku && (
                <span className="text-[10px] text-gray-400">SKU: {item.sku}</span>
              )}
            </div>
          </div>
        </div>
      </td>
      <td className="px-4 py-4">
        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
          item.type === 'insumo' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
        }`}>
          {item.type}
        </span>
      </td>
      <td className="px-4 py-4 text-center">
        <div className="flex flex-col items-center">
          <span className={`text-sm font-bold ${isLowStock ? 'text-rose-600' : 'text-gray-900'}`}>
            {item.quantity}
          </span>
          <span className="text-[10px] text-gray-400 uppercase">{item.unit}</span>
          {item.pack_size && item.pack_size > 0 && (
            <span className="mt-1 px-1.5 py-0.5 rounded-md bg-indigo-50 text-indigo-600 text-[9px] font-bold uppercase tracking-wide">
              {(item.quantity / item.pack_size).toFixed(item.quantity % item.pack_size === 0 ? 0 : 1)} {item.pack_unit || 'paq'} · {item.pack_size}/{item.unit}
            </span>
          )}
        </div>
      </td>
      <td className="px-4 py-4 text-center">
        <div className="flex flex-col items-center">
          <span className="text-sm font-bold text-gray-900">
            {item.cost_price ? `${item.cost_price}€` : '-'}
          </span>
          <span className="text-[10px] text-gray-400 uppercase">Costo</span>
        </div>
      </td>
      <td className="px-4 py-4">
        {isLowStock ? (
          <div className="flex items-center gap-1.5 text-rose-500">
            <i className="ri-error-warning-fill text-sm"></i>
            <span className="text-xs font-bold uppercase tracking-wide">Stock Bajo</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-teal-500">
            <i className="ri-checkbox-circle-fill text-sm"></i>
            <span className="text-xs font-bold uppercase tracking-wide">Ok</span>
          </div>
        )}
      </td>
      <td className="px-4 py-4 text-right">
        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={onEdit}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-rose-500 hover:bg-rose-50 transition-all"
            title="Editar"
          >
            <i className="ri-pencil-line text-lg"></i>
          </button>
          <button
            onClick={onDelete}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all"
            title="Eliminar"
          >
            <i className="ri-delete-bin-line text-lg"></i>
          </button>
        </div>
      </td>
    </tr>
  );
}
