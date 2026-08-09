import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
  ArrowRight,
  ArrowUpDown,
  Check,
  ChevronDown,
  PackageCheck,
  Search,
  ShieldCheck,
  ShoppingBag,
  SlidersHorizontal,
  Sparkles,
  Truck,
  X,
} from 'lucide-react';
import { supabase } from '../../config/supabase';
import type { Product } from '../../types';
import OptimizedMedia from '../../components/common/OptimizedMedia';
import ProductQuickView from '../../components/store/ProductQuickView';
import { AnimeFadeUp, AnimeStaggerGrid } from '../../components/animations/AnimeWrappers';
import { getPriceTiers, getProductBasePrice, getProductImages } from '../../features/store/pricing';
import { useCartStore } from '../../store/useCartStore';

type StoreSort = 'featured' | 'newest' | 'price_asc' | 'price_desc' | 'name_asc';

const formatCurrency = (value: number) => new Intl.NumberFormat('es-EC', {
  style: 'currency',
  currency: 'USD',
}).format(value);

const Store = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [sortBy, setSortBy] = useState<StoreSort>('featured');
  const totalCartItems = useCartStore((state) => state.getTotalItems());

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      setLoadError(null);

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

      if (error) {
        console.error('No se pudo cargar el catálogo de la tienda:', error);
        setLoadError('No pudimos cargar el catálogo. Intenta nuevamente en unos minutos.');
        setProducts([]);
      } else {
        const realProducts = (data || []) as Product[];
        setProducts(realProducts.filter((product) => product.is_active !== false));
      }
      setLoading(false);
    };

    void fetchProducts();
  }, []);

  const categories = useMemo(
    () => ['Todos', ...new Set(products.map((product) => product.category).filter(Boolean))],
    [products],
  );

  const visibleProducts = useMemo(() => {
    const normalizedSearch = searchQuery.trim().toLocaleLowerCase('es');
    const filtered = products.filter((product) => {
      const tags = product.metadata?.tags?.join(' ') || '';
      const searchableText = `${product.name} ${product.description || ''} ${product.category} ${tags}`
        .toLocaleLowerCase('es');
      const matchesSearch = !normalizedSearch || searchableText.includes(normalizedSearch);
      const matchesCategory = selectedCategory === 'Todos' || product.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });

    return [...filtered].sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      if (sortBy === 'price_asc') return getProductBasePrice(a) - getProductBasePrice(b);
      if (sortBy === 'price_desc') return getProductBasePrice(b) - getProductBasePrice(a);
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
        <div aria-hidden="true" className="pointer-events-none absolute -left-48 top-36 h-96 w-96 rounded-full bg-amber-300/15 blur-[120px] dark:bg-amber-500/5" />
        <div aria-hidden="true" className="pointer-events-none absolute -right-48 top-[44rem] h-[30rem] w-[30rem] rounded-full bg-indigo-300/15 blur-[130px] dark:bg-indigo-500/5" />

        <section id="store_hero" className="px-4 pt-8 md:px-8 md:pt-12">
          <AnimeFadeUp className="relative mx-auto grid max-w-7xl overflow-hidden rounded-[2.5rem] border border-white/15 bg-[#081630] shadow-2xl lg:grid-cols-[1.25fr_0.75fr]">
            <div className="relative z-10 p-8 text-white md:p-14 lg:p-16">
              <span className="inline-flex items-center gap-2 rounded-full border border-amber-300/25 bg-amber-400/10 px-4 py-2 text-[10px] font-extrabold uppercase tracking-[0.2em] text-amber-300">
                <Sparkles size={13} /> Recursos con propósito
              </span>
              <h1 className="mt-7 max-w-3xl font-serif text-5xl font-black leading-[0.98] tracking-[-0.035em] md:text-7xl">
                Fe que también se lleva contigo.
              </h1>
              <p className="mt-6 max-w-xl text-base font-medium leading-relaxed text-slate-300 md:text-lg">
                Explora productos seleccionados para crecer, aprender y compartir. Cada compra apoya la obra de nuestra iglesia.
              </p>
              <div className="mt-8 flex flex-wrap gap-3 text-xs font-bold text-slate-200">
                <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2"><ShieldCheck size={15} className="text-emerald-300" /> Datos protegidos</span>
                <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2"><PackageCheck size={15} className="text-amber-300" /> Stock verificable</span>
                <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2"><Truck size={15} className="text-blue-300" /> Retiro o envío</span>
              </div>
            </div>

            <div className="relative hidden min-h-[26rem] lg:block">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(245,158,11,0.24),transparent_62%)]" />
              <div className="absolute inset-8 rotate-6 rounded-[2.5rem] border border-white/10 bg-white/5 backdrop-blur-xl" />
              <div className="absolute inset-16 -rotate-3 rounded-[2rem] border border-white/15 bg-white/10 p-8 backdrop-blur-2xl">
                <div className="flex h-full flex-col justify-between">
                  <div className="grid h-14 w-14 place-items-center rounded-2xl bg-amber-400 text-slate-950"><ShoppingBag size={25} /></div>
                  <div>
                    <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-amber-300">Tienda Jerusalén</p>
                    <p className="mt-3 font-serif text-3xl font-black text-white">Compra mejor. Apoya una misión.</p>
                  </div>
                </div>
              </div>
            </div>
          </AnimeFadeUp>
        </section>

        <section id="store_categories" className="relative z-10 mx-auto mt-8 max-w-7xl px-4 md:px-8">
          <div className="rounded-[2rem] border border-white/70 bg-white/75 p-4 shadow-[0_24px_80px_-40px_rgba(15,23,42,0.35)] backdrop-blur-2xl dark:border-white/10 dark:bg-slate-900/75 md:p-6">
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
                <select value={sortBy} onChange={(event) => setSortBy(event.target.value as StoreSort)} className="h-13 w-full appearance-none rounded-2xl border border-slate-200 bg-white/80 pl-11 pr-10 text-sm font-bold text-slate-700 outline-none dark:border-white/10 dark:bg-slate-950/70 dark:text-slate-200">
                  <option value="featured">Destacados</option>
                  <option value="newest">Más recientes</option>
                  <option value="price_asc">Menor precio</option>
                  <option value="price_desc">Mayor precio</option>
                  <option value="name_asc">Nombre A–Z</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              </label>

              <Link to="/cart" className="relative inline-flex h-13 items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 text-sm font-extrabold text-white transition hover:bg-amber-500 hover:text-slate-950 dark:bg-white dark:text-slate-950">
                <ShoppingBag size={18} /> Mi carrito
                {totalCartItems > 0 && <span className="grid min-w-5 place-items-center rounded-full bg-amber-400 px-1.5 py-0.5 text-[10px] text-slate-950">{totalCartItems}</span>}
              </Link>
            </div>

            <div className="mt-5 flex items-center gap-3 overflow-x-auto border-t border-slate-200/70 pt-5 dark:border-white/10">
              <SlidersHorizontal size={15} className="shrink-0 text-amber-600" />
              {categories.map((category) => (
                <button key={category} onClick={() => setSelectedCategory(category)} className={`shrink-0 rounded-full px-4 py-2 text-xs font-extrabold transition ${selectedCategory === category ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/15' : 'border border-slate-200 bg-white/60 text-slate-600 hover:border-amber-300 dark:border-white/10 dark:bg-slate-950/50 dark:text-slate-300'}`}>
                  {category}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section id="store_catalog" aria-live="polite" className="relative z-10 mx-auto mt-12 max-w-7xl px-4 md:px-8">
          <div className="mb-7 flex items-end justify-between gap-4">
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-amber-600 dark:text-amber-400">Catálogo</p>
              <h2 className="mt-2 font-serif text-3xl font-black text-slate-900 dark:text-white">Encuentra algo especial</h2>
            </div>
            {!loading && !loadError && <p className="text-xs font-bold text-slate-500">{visibleProducts.length} {visibleProducts.length === 1 ? 'producto' : 'productos'}</p>}
          </div>

          {loading ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, index) => <div key={index} className="h-[28rem] animate-pulse rounded-[2rem] bg-white/70 dark:bg-slate-900/70" />)}
            </div>
          ) : loadError ? (
            <div className="rounded-[2rem] border border-red-200 bg-red-50 p-10 text-center dark:border-red-500/20 dark:bg-red-950/20">
              <h3 className="font-serif text-2xl font-black text-slate-900 dark:text-white">El catálogo no está disponible</h3>
              <p className="mx-auto mt-3 max-w-lg text-sm text-slate-600 dark:text-slate-300">{loadError}</p>
              <button onClick={() => window.location.reload()} className="mt-6 rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white">Volver a intentar</button>
            </div>
          ) : visibleProducts.length === 0 ? (
            <div className="rounded-[2rem] border border-dashed border-slate-300 bg-white/60 p-12 text-center dark:border-white/15 dark:bg-slate-900/50">
              <ShoppingBag className="mx-auto text-slate-300" size={40} />
              <h3 className="mt-5 font-serif text-2xl font-black text-slate-900 dark:text-white">No encontramos productos</h3>
              <p className="mt-2 text-sm text-slate-500">Prueba con otra búsqueda o limpia los filtros.</p>
              <button onClick={resetFilters} className="mt-6 rounded-xl bg-amber-500 px-5 py-3 text-sm font-extrabold text-slate-950">Ver todo el catálogo</button>
            </div>
          ) : (
            <AnimeStaggerGrid className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {visibleProducts.map((product) => {
                const images = getProductImages(product);
                const price = getProductBasePrice(product);
                const tiers = getPriceTiers(product);
                const stock = product.product_variants?.length
                  ? product.product_variants.reduce((total, variant) => total + Number(variant.stock || 0), 0)
                  : Number(product.stock || 0);

                return (
                  <button key={product.id} onClick={() => setSelectedProduct(product)} className="group flex h-full flex-col overflow-hidden rounded-[2rem] border border-white/70 bg-white/80 text-left shadow-[0_18px_60px_-38px_rgba(15,23,42,0.45)] backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:shadow-xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-400/25 dark:border-white/10 dark:bg-slate-900/75">
                    <div className="relative aspect-[4/3] overflow-hidden bg-slate-100 dark:bg-slate-800">
                      {images[0] ? <OptimizedMedia src={images[0]} alt={product.name} className="h-full w-full object-cover transition duration-700 group-hover:scale-105" /> : <div className="grid h-full place-items-center"><ShoppingBag size={40} className="text-slate-300" /></div>}
                      <div className="absolute inset-x-0 top-0 flex items-start justify-between p-4">
                        <span className="rounded-full border border-white/60 bg-white/85 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-800 backdrop-blur-md">{product.category}</span>
                        {product.promo_tag && <span className="rounded-full bg-amber-500 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-950">{product.promo_tag}</span>}
                      </div>
                      {images.length > 1 && <span className="absolute bottom-4 right-4 rounded-full bg-slate-950/75 px-3 py-1.5 text-[10px] font-bold text-white backdrop-blur-md">+{images.length - 1} fotos</span>}
                    </div>

                    <div className="flex flex-1 flex-col p-5">
                      <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        {product.type === 'digital' ? 'Descarga digital' : stock > 0 ? `${stock} disponibles` : 'Agotado'}
                        {stock > 0 && <Check size={12} className="text-emerald-500" />}
                      </div>
                      <h3 className="mt-3 line-clamp-2 font-serif text-xl font-black leading-tight text-slate-900 transition group-hover:text-amber-700 dark:text-white dark:group-hover:text-amber-300">{product.name}</h3>
                      <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400">{product.description || 'Consulta sus opciones y disponibilidad.'}</p>

                      <div className="mt-auto pt-6">
                        {tiers.length > 0 && <p className="mb-2 text-[10px] font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Ahorra comprando por cantidad</p>}
                        <div className="flex items-end justify-between gap-3 border-t border-slate-100 pt-4 dark:border-white/10">
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{product.product_variants?.length ? 'Desde' : 'Precio'}</span>
                            <p className="text-2xl font-black text-slate-950 dark:text-white">{formatCurrency(price)}</p>
                          </div>
                          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-slate-950 text-white transition group-hover:bg-amber-500 group-hover:text-slate-950 dark:bg-white dark:text-slate-950"><ArrowRight size={18} /></span>
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </AnimeStaggerGrid>
          )}
        </section>
      </main>

      {selectedProduct && (
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
      )}
    </>
  );
};

export default Store;
