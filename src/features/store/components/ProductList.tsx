import { Edit2, Trash2, Package } from 'lucide-react';
import type { DbProduct } from '../types';

interface ProductListProps {
  products: DbProduct[];
  onOpenCreate: () => void;
  onEdit: (product: DbProduct) => void;
  onDelete: (id: string) => void;
}

import { Plus } from 'lucide-react';

const ProductList = ({ products, onOpenCreate, onEdit, onDelete }: ProductListProps) => {
  return (
    <div className="space-y-4 animate-fade-in text-xs">
      <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-4 rounded-xl border border-gray-200 dark:border-white/10">
        <span className="text-xs font-semibold text-gray-500">Listado de Productos del Catálogo</span>
        <button
          onClick={onOpenCreate}
          className="bg-primary text-white hover:bg-blue-900 px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer shadow-sm"
        >
          <Plus size={14} />
          Nuevo Producto
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-150 dark:border-white/10 shadow-sm overflow-hidden">
        {products.length > 0 ? (
          <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-gray-50 dark:bg-slate-950 text-gray-500 dark:text-gray-400 font-bold border-b border-gray-150 dark:border-white/10">
                <th className="py-4 px-6">Producto</th>
                <th className="py-4 px-6">Precio Regular</th>
                <th className="py-4 px-6">Oferta / Promoción</th>
                <th className="py-4 px-6">Inventario</th>
                <th className="py-4 px-6">Categoría</th>
                <th className="py-4 px-6 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/5 text-gray-700 dark:text-gray-300 font-medium">
              {products.map((prod) => (
                <tr key={prod.id} className="hover:bg-slate-50/50">
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <img loading="lazy"
                        src={prod.image_url || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=600'}
                        alt={prod.name}
                        className="w-10 h-10 rounded object-cover border border-gray-150"
                      />
                      <div>
                        <span className="font-bold text-slate-800 dark:text-white block">{prod.name}</span>
                        <span className="text-[10px] text-gray-400 capitalize">{prod.type === 'digital' ? 'Digital' : 'Físico'}</span>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6 font-bold text-gray-800 dark:text-gray-200">
                    <span className={prod.discount_price ? 'line-through text-gray-400 mr-2 font-normal' : ''}>
                      ${Number(prod.price).toFixed(2)}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    {prod.discount_price ? (
                      <div className="flex flex-col">
                        <span className="font-extrabold text-green-600 dark:text-green-400">${Number(prod.discount_price).toFixed(2)}</span>
                        {prod.promo_tag && (
                          <span className="text-[8px] uppercase tracking-wider font-extrabold text-white bg-green-500 rounded px-1 self-start mt-0.5">
                            {prod.promo_tag}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-400 font-normal italic">Sin descuento</span>
                    )}
                  </td>
                  <td className="py-4 px-6">
                    <span className={prod.stock === 0 ? 'text-red-500 font-bold' : ''}>
                      {prod.stock} u.
                    </span>
                  </td>
                  <td className="py-4 px-6">{prod.category}</td>
                  <td className="py-4 px-6 text-right space-x-2">
                    <button onClick={() => onEdit(prod)} className="p-1 hover:text-primary transition-colors cursor-pointer text-gray-400">
                      <Edit2 size={14} />
                    </button>
                    <button onClick={() => onDelete(prod.id)} className="p-1 hover:text-red-500 transition-colors cursor-pointer text-gray-400">
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-20">
          <Package className="mx-auto text-gray-300 mb-2" size={48} />
          <p className="text-sm text-gray-400">No hay productos registrados en el catálogo.</p>
        </div>
      )}
      </div>
    </div>
  );
};

export default ProductList;
