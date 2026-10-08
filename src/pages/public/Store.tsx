import { lazy, Suspense, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
  ArrowRight,
  ArrowUpDown,
  Check,
  ChevronDown,
  PackageCheck,
  Search,
  ShoppingBag,
  SlidersHorizontal,
  Sparkles,
  X,
} from 'lucide-react';
import { supabase } from '../../config/supabase';
import type { Product } from '../../types';
import OptimizedMedia from '../../components/common/OptimizedMedia';
import { GlobalErrorBoundary } from '../../components/common/ErrorBoundary';
import { getPriceTiers, getProductBasePrice, getProductImages } from '../../features/store/pricing';
import { getCatalogPrice, normalizeCatalogSearch, getProductStock, isDigitalProduct } from '../../features/store/catalog';
import { useCartStore } from '../../store/useCartStore';

type StoreSort = 'featured' | 'newest' | 'price_asc' | 'price_desc' | 'name_asc';

const ProductQuickView = lazy(() => import('../../components/store/ProductQuickView'));
const currencyFormatter = new Intl.NumberFormat('es-EC', {
  style: 'currency',
  currency: 'USD',
});
const formatCurrency = (value: number) => currencyFormatter.format(value);

const mapProductImage = (product: Product): Product => {
  let img = product.image_url || product.cover_image_url || product.thumbnail_url || '';
  const localOptimisedImages: Record<string, string> = {
    '/products/camiseta-jerusalen.jpg': '/products/camiseta-jerusalen.webp',
    '/products/biblia-estudio.jpg': '/products/biblia-estudio.webp',
    '/products/taza-jerusalen.jpg': '/products/taza-jerusalen.webp',
  };
  img = localOptimisedImages[img] ?? img;
  if (img.includes('unsplash') || !img) {
    if (product.name.toLowerCase().includes('camiseta')) img = '/products/camiseta-jerusalen.webp';
    else if (product.name.toLowerCase().includes('biblia')) img = '/products/biblia-estudio.webp';
    else if (product.name.toLowerCase().includes('taza')) img = '/products/taza-jerusalen.webp';
  }
  return {
    ...product,
    image_url: img,
    cover_image_url: img,
    thumbnail_url: img
  };
};

const Store = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [sortBy, setSortBy] = useState<StoreSort>('featured');
  const totalCartItems = useCartStore((state) => state.getTotalItems());

  const { data: products = [], isPending: loading, error: loadError, refetch, isFetching } = useQuery({
    queryKey: ['public-store-catalog'],
    staleTime: 30_000,
    retry: false,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select(`
          id, name, description, price, discount_price, promo_tag, sku,
          tax_rate, sold_count, is_active, thumbnail_url, image_url, stock,
          category, type, ecommerce_product_type, features, cover_image_url,
          deleted_at, created_at, metadata,
          product_variants(id, product_id, color_name, color_hex, size, cloudinary_image_url, stock, price_adjustment, sku, metadata, created_at)
        `)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (!data) throw new Error('El catálogo no devolvió una respuesta válida.');
      return (data as Product[]).filter((product) => product.is_active !== false).map(mapProductImage);
    },
  });

  const categories = useMemo(
    () => ['Todos', ...new Set(products.map((product) => product.category).filter(Boolean))],
    [products],
  );

  const visibleProducts = useMemo(() => {
    const normalizedSearch = normalizeCatalogSearch(searchQuery.trim());
    const filtered = products.filter((product) => {
      const tags = product.metadata?.tags?.join(' ') || '';
      const searchableText = normalizeCatalogSearch(`${product.name} ${product.description || ''} ${product.category} ${tags}`);
      const matchesSearch = !normalizedSearch || searchableText.includes(normalizedSearch);
      const matchesCategory = selectedCategory === 'Todos' || product.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });

    return [...filtered].sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      if (sortBy === 'price_asc') return getCatalogPrice(a) - getCatalogPrice(b);
      if (sortBy === 'price_desc') return getCatalogPrice(b) - getCatalogPrice(a);
      if (sortBy === 'name_asc') return a.name.localeCompare(b.name, 'es');
      return Number(Boolean(b.promo_tag)) - Number(Boolean(a.promo_tag)) || (b.sold_count || 0) - (a.sold_count || 0);
    });
  }, [products, searchQuery, selectedCategory, sortBy]);

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('Todos');
    setSortBy('featured');
  };

  return (
    <>
      <Helmet>
        <title>Tienda Jerusalén | Recursos con propósito</title>
        <meta name="description" content="Libros, recursos y productos de la Iglesia Jerusalén. Consulta variantes, disponibilidad y precios por cantidad." />
      </Helmet>

      <main className="relative min-h-screen overflow-hidden bg-slate-50 pb-24 dark:bg-slate-950">
        <section id="store_hero" className="mx-auto max-w-7xl px-4 pt-6 md:px-8 md:pt-8 scroll-mt-28">
          <div className="relative overflow-hidden rounded-3xl bg-[#081630] px-6 py-8 text-white sm:px-10 sm:py-10">
            <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-24 h-80 w-80 rounded-full border-[48px] border-amber-300/5" />
            <div className="relative flex flex-col justify-between gap-6 lg:flex-row lg:items-end lg:gap-12">
              <div className="max-w-2xl">
                <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-amber-300">
                  <Sparkles size={14} aria-hidden="true" /> Tienda Jerusalén
                </p>
                <h1 className="mt-4 font-serif text-4xl font-black leading-[1.08] tracking-tight sm:text-5xl lg:text-6xl">
                  Recursos con propósito.
                </h1>
                <p className="mt-4 max-w-xl text-sm leading-relaxed text-slate-300 sm:text-base">
                  Para crecer en la fe, compartir esperanza y llevar un poco de Jerusalén contigo.
                </p>
              </div>
              <div className="shrink-0 lg:max-w-60">
                <a href="#store_categories" className="inline-flex min-h-11 items-center justify-center gap-3 rounded-xl bg-amber-400 px-5 py-3 text-sm font-bold text-slate-950 transition-colors hover:bg-amber-300 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-amber-300">
                  Explorar catálogo <ArrowRight size={17} aria-hidden="true" />
                </a>
                <p className="mt-3 text-xs leading-relaxed text-slate-300">Cada compra apoya la obra de nuestra iglesia.</p>
              </div>
            </div>
          </div>
        </section>

        <section id="store_categories" className="relative z-10 mx-auto mt-6 max-w-7xl px-4 md:px-8 scroll-mt-28">
          <div id="store_featured" className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-slate-900 md:p-6 scroll-mt-28">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
              <label className="relative flex-1">
                <span className="sr-only">Buscar productos</span>
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Buscar productos, categorías o etiquetas"
                  className="h-13 w-full rounded-2xl border border-slate-200 bg-white/80 pl-11 pr-11 text-sm font-medium text-slate-900 outline-none transition focus:border-amber-400 focus:ring-4 focus:ring-amber-400/10 dark:border-white/10 dark:bg-slate-950/70 dark:text-white"
                />
                {searchQuery && <button onClick={() => setSearchQuery('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-800" aria-label="Limpiar búsqueda"><X size={17} /></button>}
              </label>

              <label className="relative min-w-56">
                <span className="sr-only">Ordenar productos</span>
                <ArrowUpDown className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <select value={sortBy} onChange={(event) => setSortBy(event.target.value as StoreSort)} className="h-13 w-full appearance-none rounded-2xl border border-slate-200 bg-white/80 pl-11 pr-10 text-sm font-bold text-slate-700 outline-none focus-visible:ring-2 focus-visible:ring-amber-500 dark:border-white/10 dark:bg-slate-950/70 dark:text-slate-200">
                  <option value="featured">Destacados</option>
                  <option value="newest">Más recientes</option>
                  <option value="price_asc">Menor precio</option>
                  <option value="price_desc">Mayor precio</option>
                  <option value="name_asc">Nombre A–Z</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              </label>

              <Link to="/cart" aria-label={`Mi carrito${totalCartItems > 0 ? `, ${totalCartItems} productos` : ', vacío'}`} className="relative inline-flex h-13 items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 text-sm font-extrabold text-white transition hover:bg-amber-500 hover:text-slate-950 dark:bg-white dark:text-slate-950">
                <ShoppingBag size={18} /> Mi carrito
                {totalCartItems > 0 && <span className="grid min-w-5 place-items-center rounded-full bg-amber-400 px-1.5 py-0.5 text-[10px] text-slate-950">{totalCartItems}</span>}
              </Link>
            </div>

            <div className="mt-5 flex items-center gap-3 overflow-x-auto border-t border-slate-200/70 pt-5 dark:border-white/10">
              <SlidersHorizontal size={15} className="shrink-0 text-amber-600" />
              {categories.map((category) => (
                <button key={category} aria-pressed={selectedCategory === category} onClick={() => setSelectedCategory(category)} className={`min-h-11 shrink-0 rounded-full px-4 py-2 text-xs font-extrabold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-500 ${selectedCategory === category ? 'bg-amber-500 text-slate-950' : 'border border-slate-200 bg-white/60 text-slate-600 hover:border-amber-300 dark:border-white/10 dark:bg-slate-950/50 dark:text-slate-300'}`}>
                  {category}
                </button>
              ))}
            </div>
            {(searchQuery || selectedCategory !== 'Todos') && <button onClick={resetFilters} className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-lg px-2 text-sm font-semibold text-slate-600 hover:text-amber-700 focus-visible:outline-2 focus-visible:outline-amber-500 dark:text-slate-300"><X size={15} aria-hidden="true" /> Limpiar filtros</button>}
          </div>
        </section>

        <section id="store_catalog" aria-busy={loading} className="relative z-10 mx-auto mt-8 max-w-7xl px-4 md:px-8 scroll-mt-28">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-amber-600 dark:text-amber-400">Catálogo</p>
              <h2 className="mt-2 font-serif text-3xl font-black text-slate-900 dark:text-white">Encuentra algo especial</h2>
            </div>
            {!loading && !loadError && <p role="status" className="text-sm font-medium text-slate-600 dark:text-slate-300">{visibleProducts.length} {visibleProducts.length === 1 ? 'producto' : 'productos'}</p>}
          </div>

          {loading ? (
            <div role="status" className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <span className="sr-only">Cargando catálogo…</span>
              {Array.from({ length: 3 }).map((_, index) => <div key={index} aria-hidden="true" className="h-[28rem] motion-safe:animate-pulse rounded-[2rem] bg-white/70 dark:bg-slate-900/70" />)}
            </div>
          ) : loadError ? (
            <div className="rounded-[2rem] border border-red-200 bg-red-50 p-10 text-center dark:border-red-500/20 dark:bg-red-950/20">
              <h3 className="font-serif text-2xl font-black text-slate-900 dark:text-white">El catálogo no está disponible</h3>
              <p role="alert" className="mx-auto mt-3 max-w-lg text-sm text-slate-600 dark:text-slate-300">No se pudo conectar con el catálogo. Intenta nuevamente en unos instantes.</p>
              <button disabled={isFetching} onClick={() => void refetch()} className="mt-6 rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white disabled:opacity-50">{isFetching ? 'Conectando…' : 'Volver a intentar'}</button>
            </div>
          ) : products.length === 0 ? (
            <div role="status" className="rounded-2xl border border-slate-200 bg-white p-10 text-center dark:border-white/10 dark:bg-slate-900">
              <PackageCheck className="mx-auto text-amber-600" size={36} aria-hidden="true" />
              <h3 className="mt-4 font-serif text-2xl font-bold text-slate-900 dark:text-white">Estamos preparando el catálogo</h3>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Todavía no hay productos publicados. Vuelve pronto para descubrir las novedades.</p>
            </div>
          ) : visibleProducts.length === 0 ? (
            <div className="rounded-[2rem] border border-dashed border-slate-300 bg-white/60 p-12 text-center dark:border-white/15 dark:bg-slate-900/50">
              <ShoppingBag className="mx-auto text-slate-300" size={40} />
              <h3 className="mt-5 font-serif text-2xl font-black text-slate-900 dark:text-white">No encontramos productos</h3>
              <p className="mt-2 text-sm text-slate-500">Prueba con otra búsqueda o limpia los filtros.</p>
              <button onClick={resetFilters} className="mt-6 rounded-xl bg-amber-500 px-5 py-3 text-sm font-extrabold text-slate-950">Ver todo el catálogo</button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {visibleProducts.map((product) => {
                const images = getProductImages(product);
                const price = getCatalogPrice(product);
                const saving = Number(product.price) - getProductBasePrice(product);
                const tiers = getPriceTiers(product);
                const stock = getProductStock(product);

                return (
                  <button key={product.id} onClick={() => setSelectedProduct(product)} className="group flex h-full flex-col overflow-hidden rounded-[2rem] border border-slate-200 bg-white text-left shadow-[0_18px_60px_-38px_rgba(15,23,42,0.45)] transition duration-200 motion-safe:hover:-translate-y-1 hover:shadow-lg focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-400/25 dark:border-white/10 dark:bg-slate-900">
                    <div className="relative aspect-[4/3] overflow-hidden bg-slate-100 dark:bg-slate-800">
                      {images[0] ? <OptimizedMedia src={images[0]} resourceType="image" alt={product.name} width={720} height={540} className="h-full w-full object-cover transition-transform duration-300 motion-safe:group-hover:scale-105" /> : <div className="grid h-full place-items-center"><ShoppingBag size={40} className="text-slate-300" /></div>}
                      <div className="absolute inset-x-0 top-0 flex flex-wrap items-start justify-between gap-2 p-4">
                        <span className="rounded-full border border-white/60 bg-white/85 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-800 backdrop-blur-md">{product.category}</span>
                        {product.promo_tag && <span className="rounded-full bg-amber-500 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-950">{product.promo_tag}</span>}
                      </div>
                      {images.length > 1 && <span className="absolute bottom-4 right-4 rounded-full bg-slate-950/75 px-3 py-1.5 text-[10px] font-bold text-white backdrop-blur-md">+{images.length - 1} fotos</span>}
                    </div>

                    <div className="flex flex-1 flex-col p-5">
                      <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        {isDigitalProduct(product) ? 'Descarga digital' : stock > 0 ? `${stock} disponibles` : 'Agotado'}
                        {stock > 0 && <Check size={12} className="text-emerald-500" />}
                      </div>
                      <h3 className="mt-3 line-clamp-2 font-serif text-xl font-black leading-tight text-slate-900 transition group-hover:text-amber-700 dark:text-white dark:group-hover:text-amber-300">{product.name}</h3>
                      <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400">{product.description || 'Consulta sus opciones y disponibilidad.'}</p>

                      <div className="mt-auto pt-6">
                        {tiers.length > 0 && <p className="mb-2 text-[10px] font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Ahorra comprando por cantidad</p>}
                        <div className="flex items-end justify-between gap-3 border-t border-slate-100 pt-4 dark:border-white/10">
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">{product.product_variants?.length ? 'Desde' : 'Precio'}</span>
                            <p className="text-2xl font-black text-slate-950 dark:text-white">{formatCurrency(price)}</p>
                            {saving > 0 && <p className="text-xs text-slate-500 dark:text-slate-400"><span className="sr-only">Precio anterior: </span><s>{formatCurrency(price + saving)}</s></p>}
                          </div>
                          <span className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-slate-950 px-3 text-xs font-bold text-white transition-colors group-hover:bg-amber-400 group-hover:text-slate-950 dark:bg-white dark:text-slate-950">Ver opciones <ArrowRight size={16} aria-hidden="true" /></span>
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </section>
      </main>

      {selectedProduct && (
        <GlobalErrorBoundary key={selectedProduct.id} fallback={<div role="alert" className="fixed inset-x-4 bottom-24 z-[70] rounded-2xl bg-white p-6 text-slate-900 shadow-xl">No se pudieron cargar los detalles. <button onClick={() => setSelectedProduct(null)} className="underline">Volver al catálogo</button></div>}>
        <Suspense fallback={<div role="status" className="fixed inset-x-4 bottom-24 z-[70] rounded-2xl bg-white p-6 text-slate-900 shadow-xl">Cargando producto… <button onClick={() => setSelectedProduct(null)} className="ml-3 underline">Cancelar</button></div>}>
        <ProductQuickView
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onNext={() => {
            const index = visibleProducts.findIndex((product) => product.id === selectedProduct.id);
            setSelectedProduct(visibleProducts[(index + 1) % visibleProducts.length]);
          }}
          onPrev={() => {
            const index = visibleProducts.findIndex((product) => product.id === selectedProduct.id);
            setSelectedProduct(visibleProducts[(index - 1 + visibleProducts.length) % visibleProducts.length]);
          }}
        />
        </Suspense>
        </GlobalErrorBoundary>
      )}
    </>
  );
};

export default Store;
