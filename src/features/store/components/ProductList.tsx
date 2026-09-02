import { Edit2, Trash2, Package, Tag, Plus, ShoppingBag } from 'lucide-react';
import type { DbProduct } from '../types';
import { BentoGrid, BentoCard } from '../../../components/ui/magicui/bento-grid';
import { BorderBeam } from '../../../components/ui/magicui/border-beam';
import { ShinyButton } from '../../../components/ui/magicui/shiny-button';

interface ProductListProps {
  products: DbProduct[];
  onOpenCreate: () => void;
  onEdit: (product: DbProduct) => void;
  onDelete: (id: string) => void;
}

const ProductList = ({ products, onOpenCreate, onEdit, onDelete }: ProductListProps) => {
  return (
    <div className="space-y-4 animate-fade-in text-xs">
      <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-4 rounded-xl border border-gray-200 dark:border-white/10">
        <span className="text-xs font-semibold text-gray-500">Listado de Productos del Catálogo</span>
        <div onClick={onOpenCreate} className="cursor-pointer">
          <ShinyButton className="text-xs font-bold px-4 py-1.5 flex items-center gap-2">
            <Plus size={14} />
            <span>Nuevo Producto</span>
          </ShinyButton>
        </div>
      </div>

      <div className="bg-transparent overflow-hidden">
        {products.length > 0 ? (
          <BentoGrid className="grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 auto-rows-[280px]">
            {products.map((prod) => (
              <BentoCard
                key={prod.id}
                name={prod.name}
                description={prod.category}
                Icon={ShoppingBag}
                cta="Ver detalles"
                onClick={() => onEdit(prod)}
                className="col-span-1 shadow-xs border border-gray-150 dark:border-white/10 overflow-hidden relative cursor-pointer"
                background={
                  <div className="absolute inset-0 z-0">
                    {prod.image_url ? <img loading="lazy" src={prod.image_url} alt={prod.name} className="absolute inset-0 w-full h-full object-cover opacity-10 dark:opacity-20 group-hover:opacity-30 transition-opacity duration-300" /> : <div aria-hidden="true" className="flex h-full w-full items-center justify-center text-primary/30"><ShoppingBag size={64} /></div>}
                    <div className="absolute inset-0 bg-gradient-to-t from-white/90 via-white/50 to-transparent dark:from-slate-900/90 dark:via-slate-900/50 dark:to-transparent" />
                  </div>
                }
              >
                <div className="flex flex-col gap-2 mt-4 relative z-10 text-xs text-gray-700 dark:text-gray-300">
                  <div className="flex justify-between items-center bg-white/60 dark:bg-slate-900/60 backdrop-blur-md p-2 rounded-lg border border-gray-100 dark:border-white/10">
                    <div className="flex items-center gap-1.5">
                      <Tag size={14} className="text-primary" />
                      <span className="font-bold">
                        {prod.discount_price ? (
                          <div className="flex flex-col">
                            <span className="text-green-600 dark:text-green-400 font-extrabold">${Number(prod.discount_price).toFixed(2)}</span>
                            <span className="line-through text-[9px] text-gray-400">${Number(prod.price).toFixed(2)}</span>
                          </div>
                        ) : (
                          <span>${Number(prod.price).toFixed(2)}</span>
                        )}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className={`block font-bold ${prod.stock === 0 ? 'text-red-500' : 'text-gray-600 dark:text-gray-400'}`}>
                        {prod.stock} ud.
                      </span>
                      <span className="text-[9px] uppercase tracking-wider">{prod.type === 'digital' ? 'Digital' : 'Físico'}</span>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 mt-2">
                    <button 
                      onClick={(e) => { e.stopPropagation(); onEdit(prod); }}
                      className="p-1.5 bg-white dark:bg-slate-800 text-gray-500 hover:text-primary rounded-lg border border-gray-200 dark:border-white/10 shadow-xs transition-colors"
                      title="Editar"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); onDelete(prod.id); }}
                      className="p-1.5 bg-white dark:bg-slate-800 text-gray-500 hover:text-red-500 rounded-lg border border-gray-200 dark:border-white/10 shadow-xs transition-colors"
                      title="Eliminar"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {prod.type === 'physical' && prod.stock === 0 && (
                  <BorderBeam size={100} duration={8} colorFrom="#ef4444" colorTo="#b91c1c" />
                )}
              </BentoCard>
            ))}
          </BentoGrid>
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
