import { useMemo, useState } from 'react';
import { Edit2, Trash2, Package, Plus } from 'lucide-react';
import type { DbProduct } from '../types';
import { getProductStock, normalizeStoreSearch, formatStoreCurrency } from '../catalog';
import OptimizedMedia from '../../../components/common/OptimizedMedia';
import CatalogToolbar from './CatalogToolbar';
import CatalogPagination from './CatalogPagination';

interface ProductListProps {
  products: DbProduct[];
  onOpenCreate: () => void;
  onEdit: (product: DbProduct) => void;
  onDelete: (id: string) => void;
  canEdit?: boolean;
  deleting?: boolean;
}

const ProductList = ({ products, onOpenCreate, onEdit, onDelete, canEdit = true, deleting = false }: ProductListProps) => {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [category, setCategory] = useState('all');
  const [page, setPage] = useState(1);
  const filtered = useMemo(() => products.filter(product => {
    const matchesSearch = normalizeStoreSearch(`${product.name} ${product.sku || ''} ${product.category}`).includes(normalizeStoreSearch(search));
    const stock = getProductStock(product);
    return matchesSearch && (category === 'all' || category === product.category) && (
      filter === 'all' || (filter === 'active' && product.is_active !== false) ||
      (filter === 'hidden' && product.is_active === false) ||
      (filter === 'out' && product.type !== 'digital' && stock === 0) ||
      (filter === 'low' && product.type !== 'digital' && stock > 0 && stock <= 5)
    );
  }), [products, search, filter, category]);
  const currentPage = Math.min(page, Math.max(1, Math.ceil(filtered.length / 12)));
  const controlClass = 'h-11 rounded-xl border border-slate-200 bg-transparent px-3 text-sm dark:border-white/15 dark:bg-slate-900 dark:text-white';
  return <div className="space-y-4">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><h2 className="text-xl font-bold text-slate-900 dark:text-white">Catálogo e inventario</h2><p className="mt-1 text-sm text-slate-500">Gestiona publicaciones, precios y existencias por variante.</p></div>
      {canEdit && <button type="button" onClick={onOpenCreate} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-bold text-white"><Plus size={17} /> Nuevo producto</button>}
    </div>
    <CatalogToolbar label="Buscar productos por nombre, SKU o categoría" search={search} onSearch={value => { setSearch(value); setPage(1); }} count={filtered.length}>
      <select aria-label="Filtrar publicación y stock" value={filter} onChange={event => { setFilter(event.target.value); setPage(1); }} className={controlClass}>
        <option value="all">Todos los estados</option><option value="active">Publicados</option><option value="hidden">Ocultos</option><option value="out">Agotados</option><option value="low">Stock bajo (1–5)</option>
      </select>
      <select aria-label="Filtrar categoría" value={category} onChange={event => { setCategory(event.target.value); setPage(1); }} className={controlClass}>
        <option value="all">Todas las categorías</option>{[...new Set(products.map(product => product.category))].sort().map(name => <option key={name} value={name}>{name}</option>)}
      </select>
    </CatalogToolbar>
    {filtered.length === 0 ? <div className="rounded-2xl border border-dashed p-12 text-center text-slate-500"><Package size={32} className="mx-auto mb-3" /><p>{products.length ? 'No hay productos que coincidan con estos filtros.' : 'Todavía no hay productos registrados.'}</p></div> :
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {filtered.slice((currentPage - 1) * 12, currentPage * 12).map(product => {
          const stock = getProductStock(product);
          const discount = product.discount_price != null && product.discount_price < product.price;
          const image = product.thumbnail_url || product.image_url;
          return <article key={product.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-white/10 dark:bg-slate-900">
            <div className="flex gap-4 p-4">
              <div className="h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-800">{image ? <OptimizedMedia src={image} alt={product.name} width={192} height={192} className="h-full w-full object-cover" /> : <Package className="m-auto mt-7 text-slate-400" size={32} />}</div>
              <div className="min-w-0"><p className="text-xs text-slate-500">{product.category}</p><h3 className="mt-1 break-words text-base font-bold text-slate-900 dark:text-white">{product.name}</h3><p className="mt-1 break-all font-mono text-xs text-slate-500">{product.sku || 'Sin SKU'}</p><p className="mt-2 font-bold text-slate-900 dark:text-white">{formatStoreCurrency(Number(discount ? product.discount_price : product.price))} {discount && <del className="ml-1 text-xs font-normal text-slate-500">{formatStoreCurrency(product.price)}</del>}</p></div>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-4 py-3 dark:border-white/10">
              <div className="flex flex-wrap gap-2 text-xs"><span className={`rounded-lg px-2 py-1 ${product.is_active === false ? 'bg-slate-100 text-slate-600' : 'bg-emerald-50 text-emerald-700'}`}>{product.is_active === false ? 'Oculto' : 'Publicado'}</span><span className={`rounded-lg px-2 py-1 ${stock === 0 && product.type !== 'digital' ? 'bg-red-50 text-red-700' : 'bg-slate-100 text-slate-600'}`}>{product.type === 'digital' ? 'Digital' : `${stock} unidades`}</span>{Boolean(product.product_variants?.length) && <span className="py-1 text-slate-500">{product.product_variants?.length} variantes</span>}</div>
              {canEdit && <div className="flex gap-1"><button type="button" onClick={() => onEdit(product)} aria-label={`Editar ${product.name}`} className="rounded-lg p-3 text-blue-700 hover:bg-blue-50"><Edit2 size={17} /></button><button type="button" disabled={deleting} onClick={() => onDelete(product.id)} aria-label={`Archivar ${product.name}`} className="rounded-lg p-3 text-red-700 hover:bg-red-50 disabled:opacity-40"><Trash2 size={17} /></button></div>}
            </div>
          </article>;
        })}
      </div>}
    <CatalogPagination page={currentPage} total={filtered.length} pageSize={12} onPage={setPage} />
  </div>;
};
export default ProductList;
