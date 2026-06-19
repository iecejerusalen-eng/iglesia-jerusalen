import { useState, useEffect } from 'react';
import { supabase } from '../../config/supabase';

import type { Product } from '../../types';
import { Search, Filter, Sparkles } from 'lucide-react';
import OptimizedMedia from '../../components/common/OptimizedMedia';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import ProductQuickView from '../../components/store/ProductQuickView';
import MagneticButton from '../../components/animations/MagneticButton';

const MOCK_PRODUCTS: Product[] = [
  {
    id: 'mock-1',
    name: 'Camiseta Oficial Iglesia Jerusalén',
    description: 'Camiseta de algodón premium con el logo bordado de nuestra iglesia. Ideal para eventos y ministerios.',
    price: 15.00,
    image_url: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&q=80&w=600',
    stock: 30,
    category: 'Ropa',
    type: 'physical',
    cover_image_url: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&q=80&w=600',
    features: ['100% Algodón orgánico', 'Logo bordado de alta definición', 'Bordes reforzados'],
    created_at: new Date().toISOString(),
    product_variants: [
      {
        id: 'mock-var-1',
        product_id: 'mock-1',
        color_name: 'Blanco',
        color_hex: '#FFFFFF',
        size: 'M',
        cloudinary_image_url: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&q=80&w=600',
        stock: 10,
        price_adjustment: 0
      },
      {
        id: 'mock-var-2',
        product_id: 'mock-1',
        color_name: 'Blanco',
        color_hex: '#FFFFFF',
        size: 'L',
        cloudinary_image_url: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&q=80&w=600',
        stock: 10,
        price_adjustment: 2.00
      },
      {
        id: 'mock-var-3',
        product_id: 'mock-1',
        color_name: 'Azul Marino',
        color_hex: '#1E3A8A',
        size: 'M',
        cloudinary_image_url: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&q=80&w=600',
        stock: 5,
        price_adjustment: 1.00
      },
      {
        id: 'mock-var-4',
        product_id: 'mock-1',
        color_name: 'Azul Marino',
        color_hex: '#1E3A8A',
        size: 'L',
        cloudinary_image_url: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&q=80&w=600',
        stock: 5,
        price_adjustment: 3.00
      }
    ]
  },
  {
    id: 'mock-2',
    name: 'Biblia de Estudio Jerusalén',
    description: 'Edición especial con notas exegéticas, mapas a color y guías de lectura devocional para el crecimiento espiritual.',
    price: 35.00,
    image_url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=600',
    stock: 15,
    category: 'Libros',
    type: 'physical',
    cover_image_url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=600',
    features: ['Notas de estudio exegéticas', 'Mapas históricos a color', 'Tapa de cuero sintético'],
    created_at: new Date().toISOString(),
    product_variants: []
  },
  {
    id: 'mock-3',
    name: 'E-Book: Manual de Teología Práctica',
    description: 'Guía digital para maestros y líderes de ministerios, detallando técnicas de enseñanza y fundamentos bíblicos.',
    price: 8.50,
    image_url: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&q=80&w=600',
    stock: 999,
    category: 'Recursos Digitales',
    type: 'digital',
    cover_image_url: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&q=80&w=600',
    features: ['Formato PDF y ePUB', 'Descarga instantánea segura', 'Compatible con celulares y tablets'],
    created_at: new Date().toISOString(),
    product_variants: []
  }
];

const staggerContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

const Store = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todas');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*, product_variants(*)')
        .order('name', { ascending: true });

      if (error) throw error;

      if (data && data.length > 0) {
        setProducts(data as Product[]);
      } else {
        setProducts(MOCK_PRODUCTS);
      }
    } catch (err) {
      console.error('Error al cargar productos de Supabase, usando mocks:', err);
      setProducts(MOCK_PRODUCTS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProducts();
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (product.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
    const matchesCategory = selectedCategory === 'Todas' || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = ['Todas', ...Array.from(new Set(products.map((p) => p.category)))];

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-10">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-primary to-blue-900 rounded-2xl p-8 md:p-12 text-white mb-10 shadow-lg relative overflow-hidden">
        <div className="absolute right-0 bottom-0 top-0 w-1/3 opacity-10 flex items-center justify-center">
          <Sparkles size={200} className="text-white" />
        </div>
        <div className="relative z-10 max-w-2xl">
          <span className="bg-gold/20 text-gold border border-gold/30 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider">
            Librería & Recursos
          </span>
          <h1 className="text-4xl md:text-5xl font-serif font-bold mt-4 mb-4">Tienda Jerusalén</h1>
          <p className="text-gray-200 text-base md:text-lg leading-relaxed">
            Adquiere materiales de estudio, literatura cristiana, recursos de alabanza y entradas a nuestros próximos eventos de forma segura.
          </p>
        </div>
      </div>

      {/* Buscador y Filtros */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center mb-8">
        <div className="relative w-full md:w-96">
          <label htmlFor="search_store" className="sr-only">Buscar recursos, libros, Biblias...</label>
          <input
            id="search_store"
            type="text"
            placeholder="Buscar recursos, libros, Biblias..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-primary transition-all text-sm bg-white dark:bg-slate-900 dark:text-white"
          />
          <Search className="absolute left-3.5 top-3 text-slate-500" size={18} />
        </div>

        {/* Categorías */}
        <div className="flex gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-none">
          <div className="flex gap-2">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition-all whitespace-nowrap ${
                    selectedCategory === category
                      ? 'bg-primary text-white shadow-md'
                      : 'bg-white dark:bg-slate-900 border border-gray-150 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800'
                  }`}
              >
                {category === 'Todas' && <Filter size={14} />}
                {category}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid de Productos */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : (
        <motion.div 
          variants={staggerContainer}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {filteredProducts.map((product) => (
              <motion.div
                variants={fadeInUp}
                key={product.id}
                onClick={() => setSelectedProduct(product)}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-150 dark:border-white/10 overflow-hidden shadow-sm dark:shadow-none hover:shadow-md dark:hover:shadow-none transition-all flex flex-col group h-full cursor-pointer relative focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter') setSelectedProduct(product) }}
              >
                {/* Contenedor Imagen */}
                <div className="relative pt-[70%] bg-gray-50 dark:bg-slate-800 overflow-hidden">
                  <motion.div 
                    layoutId={`product-image-${product.id}`}
                    className="absolute inset-0 w-full h-full"
                  >
                    <OptimizedMedia
                      src={product.cover_image_url || product.image_url || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=600'}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </motion.div>
                  <div className="absolute top-3 left-3 flex flex-col gap-2">
                      <span className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm px-2.5 py-1 rounded-lg text-xs font-semibold text-primary dark:text-white border border-gray-100 dark:border-white/10 shadow-2xs z-10">
                        {product.category}
                      </span>
                    {product.type === 'digital' && (
                      <span className="bg-purple-600/90 backdrop-blur-sm px-2.5 py-1 rounded-lg text-xs font-bold text-white shadow-2xs z-10">
                        Digital / Descargable
                      </span>
                    )}
                  </div>
                </div>

                {/* Contenido */}
                <div className="p-5 flex flex-col flex-grow">
                  <h3 className="font-serif font-bold text-lg text-slate-800 dark:text-white mb-2 line-clamp-1">
                    {product.name}
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400 text-xs line-clamp-2 leading-relaxed mb-4 flex-grow font-medium">
                    {product.description}
                  </p>

                  <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-100 dark:border-white/10" onClick={(e) => e.stopPropagation()}>
                    <div>
                      <span className="text-xs text-slate-600 dark:text-slate-400 block font-bold">Desde</span>
                      <span className="text-xl font-bold text-slate-800 dark:text-white">${Number(product.price).toFixed(2)}</span>
                    </div>

                    <MagneticButton>
                      <button
                        onClick={() => setSelectedProduct(product)}
                        className="px-4 py-2 rounded-xl text-xs font-semibold bg-primary hover:bg-blue-900 text-white transition-all shadow-sm shadow-blue-100 flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
                      >
                        Ver Opciones
                      </button>
                    </MagneticButton>
                  </div>
                </div>
              </motion.div>
          ))}
          {filteredProducts.length === 0 && (
            <div className="col-span-full">
              <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                <Search size={48} className="mx-auto text-slate-300 dark:text-slate-600 mb-4" />
                <h3 className="text-lg font-serif font-bold text-slate-800 dark:text-white">No se encontraron productos</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Prueba con otra palabra clave o categoría.</p>
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* Modal Detallado de Producto */}
      <AnimatePresence>
        {selectedProduct && (
          <ProductQuickView 
            product={selectedProduct} 
            onClose={() => setSelectedProduct(null)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Store;
