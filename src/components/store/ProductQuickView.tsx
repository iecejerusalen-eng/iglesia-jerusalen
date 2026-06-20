import { useState, useEffect } from 'react';
import { useCartStore } from '../../store/useCartStore';
import type { Product } from '../../types';
import { 
  ShoppingBag, Plus, Minus,
  ChevronRight, Star, X, ChevronLeft
} from 'lucide-react';
import OptimizedMedia from '../common/OptimizedMedia';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import BlockLessonRenderer from '../public/BlockLessonRenderer';
import MagneticButton from '../animations/MagneticButton';

interface ProductQuickViewProps {
  product: Product;
  onClose: () => void;
  onNext?: () => void;
  onPrev?: () => void;
}

const ProductQuickView = ({ product, onClose, onNext, onPrev }: ProductQuickViewProps) => {
  const addItem = useCartStore((state) => state.addItem);
  
  const [added, setAdded] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  // Variant states
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState<string | null>(null);

  useEffect(() => {
    if (product) {
      const variants = product.product_variants || [];
      const availableColors = Array.from(new Map(variants.filter(v => v.color_name).map(v => [v.color_name, v])).values());
      const availableSizes = Array.from(new Set(variants.filter(v => v.size).map(v => v.size)));
      
      if (availableColors.length > 0) {
        setSelectedColor(availableColors[0].color_name);
      } else {
        setSelectedColor(null);
      }
      
      if (availableSizes.length > 0) {
        setSelectedSize(availableSizes[0]);
      } else {
        setSelectedSize(null);
      }
      
      setQuantity(1);
      setActiveImage(product.cover_image_url || product.image_url || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=600');
    }
  }, [product]);

  const variants = product.product_variants || [];
  const availableColors = Array.from(new Map(variants.filter(v => v.color_name).map(v => [v.color_name, v])).values());
  const availableSizes = Array.from(new Set(variants.filter(v => v.size).map(v => v.size)));

  const currentVariant = variants.find(v => {
    const colorMatch = !selectedColor || v.color_name === selectedColor;
    const sizeMatch = !selectedSize || v.size === selectedSize;
    return colorMatch && sizeMatch;
  }) || null;

  const matchedVariant = currentVariant || variants.find(v => !selectedColor || v.color_name === selectedColor) || null;

  const finalPrice = Number(product.price) + (matchedVariant?.price_adjustment ? Number(matchedVariant.price_adjustment) : 0);
  const finalStock = matchedVariant ? matchedVariant.stock : (product.stock || 0);

  let featuresList: string[] = [];
  if (Array.isArray(product.features)) {
    featuresList = product.features.map(f => typeof f === 'string' ? f : JSON.stringify(f));
  } else if (typeof product.features === 'string') {
    try {
      featuresList = JSON.parse(product.features);
    } catch {
      featuresList = [product.features];
    }
  }

  const handleAddToCart = () => {
    if (finalStock <= 0) return;
    addItem(product, matchedVariant, quantity);
    setAdded(true);
    toast.success(`${product.name} agregado al carrito`);
    setTimeout(() => {
      setAdded(false);
      onClose();
    }, 1500);
  };

  const baseImage = product.cover_image_url || product.image_url || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=600';
  const galleryImages = [
    baseImage,
    ...variants.map(v => v.cloudinary_image_url).filter((url): url is string => !!url)
  ].filter((value, index, self) => self.indexOf(value) === index);

  const variantImage = matchedVariant?.cloudinary_image_url;
  const displayImage = variantImage || activeImage || baseImage;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, y: 20, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.95, y: 20, opacity: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="bg-white dark:bg-slate-900 w-full max-w-5xl max-h-[90vh] rounded-3xl overflow-hidden shadow-2xl relative flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Options */}
        <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
          <button
            onClick={onClose}
            className="w-10 h-10 bg-white/80 dark:bg-slate-800/80 hover:bg-white dark:hover:bg-slate-700 backdrop-blur-md text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white rounded-full flex items-center justify-center transition-all shadow-sm focus-visible:outline-none"
            aria-label="Cerrar"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation Arrows */}
        {onPrev && (
          <button
            onClick={onPrev}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 bg-white/90 dark:bg-slate-800/90 hover:bg-white dark:hover:bg-slate-700 text-primary dark:text-white rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-105 hidden md:flex focus-visible:outline-none"
          >
            <ChevronLeft size={24} />
          </button>
        )}
        {onNext && (
          <button
            onClick={onNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 bg-white/90 dark:bg-slate-800/90 hover:bg-white dark:hover:bg-slate-700 text-primary dark:text-white rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-105 hidden md:flex focus-visible:outline-none"
          >
            <ChevronRight size={24} />
          </button>
        )}

        {/* Content Area - Scrollable */}
        <div className="overflow-y-auto flex-1 p-6 md:p-10 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
            
            {/* Left Column: Media Gallery */}
            <div className="lg:col-span-5 xl:col-span-6 space-y-4">
              <div className="relative bg-slate-50 dark:bg-slate-800/50 rounded-3xl overflow-hidden shadow-md border border-slate-200/50 dark:border-white/10 flex items-center justify-center min-h-[300px] max-h-[500px] group">
                <button 
                  type="button"
                  onClick={() => setIsLightboxOpen(true)}
                  className="w-full h-full flex items-center justify-center cursor-zoom-in focus-visible:outline-none"
                >
                  <OptimizedMedia
                    src={displayImage}
                    alt={product.name}
                    className="w-full h-auto max-h-[500px] object-contain transition-transform duration-300 group-hover:scale-[1.02]"
                  />
                </button>
                
                {product.type === 'digital' && (
                  <span className="absolute bottom-4 left-4 bg-purple-600 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg shadow-sm z-10 pointer-events-none">
                    Recurso Digital
                  </span>
                )}
              </div>

              {/* Thumbnails Gallery */}
              {galleryImages.length > 1 && (
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none justify-center">
                  {galleryImages.map((imgUrl, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveImage(imgUrl)}
                      className={`w-16 h-16 rounded-xl overflow-hidden border-2 shrink-0 transition-all ${
                        displayImage === imgUrl ? 'border-primary dark:border-blue-500 scale-95 shadow-sm' : 'border-slate-200 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-500'
                      }`}
                    >
                      <img src={imgUrl} alt={`Vista ${idx + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Right Column: Product Detail & Configurator */}
            <div className="lg:col-span-7 xl:col-span-6 space-y-6 text-left">
              
              {/* Header Info */}
              <div className="space-y-2">
                <div className="flex items-center justify-between flex-wrap gap-2 pr-12">
                  <span className="text-sm font-bold uppercase tracking-wider text-primary dark:text-blue-300 bg-blue-50 dark:bg-blue-950/20 px-2.5 py-1 rounded-md border border-blue-200/50 dark:border-blue-900/30">
                    {product.category}
                  </span>

                  <div className="flex items-center gap-0.5 text-yellow-500">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} size={14} fill="currentColor" className="stroke-none" />
                    ))}
                    <span className="text-xs text-slate-500 dark:text-slate-400 ml-1.5 font-bold">(5.0)</span>
                  </div>
                </div>

                <h1 className="text-2xl md:text-3xl font-extrabold text-primary dark:text-white leading-tight font-serif">
                  {product.name}
                </h1>
              </div>

              {/* Description */}
              <div className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed font-light">
                <BlockLessonRenderer content={product.description || ''} lessonId={product.id} />
              </div>

              {/* Listado de Características Adicionales */}
              {featuresList.length > 0 && (
                <div className="space-y-2 pt-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 font-sans">Características</h4>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {featuresList.map((feat, idx) => (
                      <li key={idx} className="text-xs text-slate-600 dark:text-slate-300 flex items-start gap-2.5 font-medium bg-slate-50 dark:bg-slate-800/50 p-2 rounded-xl border border-slate-200/40 dark:border-white/10">
                        <span className="text-primary dark:text-white mt-0.5">•</span>
                        <span className="leading-normal">{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Configuración de Compra */}
              <div className="pt-4 border-t border-slate-200/60 space-y-5">
                {variants.length > 0 && (
                  <div className="space-y-4">
                    {/* Grind Option / Color Selection */}
                    {availableColors.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 font-sans">Variante: {selectedColor}</h4>
                        <div className="flex flex-wrap gap-2">
                          {availableColors.map((col) => (
                            <button
                              key={col.id}
                              onClick={() => setSelectedColor(col.color_name)}
                              className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 focus-visible:outline-none ${
                                  selectedColor === col.color_name
                                    ? 'bg-blue-50 dark:bg-blue-950/30 border-primary dark:border-blue-500 text-primary dark:text-white shadow-sm font-bold'
                                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                                }`}
                            >
                              <span 
                                className="w-3.5 h-3.5 rounded-full border border-slate-300 inline-block shrink-0" 
                                style={{ backgroundColor: col.color_hex || '#CCC' }} 
                              />
                              {col.color_name}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Size Options */}
                    {availableSizes.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 font-sans">Tamaño</h4>
                        <div className="flex gap-2.5">
                          {availableSizes.map((size) => (
                            <button
                              key={size}
                              onClick={() => setSelectedSize(size)}
                              className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all focus-visible:outline-none ${
                                  selectedSize === size
                                    ? 'bg-primary dark:bg-blue-650 text-white border-primary dark:border-blue-650 shadow-xs font-bold'
                                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                                }`}
                            >
                              {size}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Availability */}
                <div className="flex items-center justify-between text-xs pt-2">
                  <span className="text-slate-500 dark:text-slate-400 font-bold">Disponibilidad</span>
                  <span className={`font-bold px-2.5 py-1 rounded-md text-[10px] uppercase tracking-wider ${
                    finalStock > 0 
                      ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800' 
                      : 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800'
                  }`}>
                    {finalStock > 0 
                      ? product.type === 'digital' ? 'Acceso Instantáneo' : 'En Stock'
                      : 'Agotado'}
                  </span>
                </div>

                {/* Bottom Actions Bar */}
                <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-white/10 rounded-3xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
                  <div className="flex flex-col text-left self-start sm:self-center">
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Total</span>
                    <span className="text-2xl font-extrabold text-primary dark:text-white tracking-tight">
                      ${(finalPrice * quantity).toFixed(2)}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    {/* Quantity Controls */}
                    {finalStock > 0 && product.type !== 'digital' && (
                      <div className="flex items-center border border-slate-300 dark:border-white/10 rounded-2xl bg-white dark:bg-slate-900 shrink-0">
                        <button
                          onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
                          className="p-3 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors focus-visible:outline-none"
                        >
                          <Minus size={14} />
                        </button>
                        <span className="w-8 text-center text-xs font-extrabold text-slate-800 dark:text-slate-200">{quantity}</span>
                        <button
                          onClick={() => setQuantity(prev => Math.min(finalStock, prev + 1))}
                          className="p-3 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors focus-visible:outline-none"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    )}

                    {/* Add to Cart Button */}
                    <MagneticButton>
                      <button
                        onClick={handleAddToCart}
                        disabled={finalStock <= 0}
                        className={`flex-grow sm:flex-grow-0 px-6 py-3.5 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md focus-visible:outline-none overflow-hidden relative ${
                          finalStock <= 0
                            ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed shadow-none border border-slate-200 dark:border-white/5'
                            : added
                            ? 'bg-green-600 text-white shadow-green-150'
                            : 'bg-primary dark:bg-blue-600 dark:hover:bg-blue-700 hover:bg-blue-900 text-white shadow-blue-150 hover:shadow-lg'
                        }`}
                      >
                        {finalStock <= 0 ? (
                          <>
                            <ShoppingBag size={14} />
                            Agotado
                          </>
                        ) : added ? (
                          <motion.div 
                            initial={{ opacity: 0, scale: 0.5 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="flex items-center gap-2"
                          >
                            <svg viewBox="0 0 24 24" className="w-4 h-4 text-white" fill="none" stroke="currentColor">
                              <motion.path
                                d="M20 6L9 17l-5-5"
                                strokeWidth="3"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                initial={{ pathLength: 0 }}
                                animate={{ pathLength: 1 }}
                                transition={{ duration: 0.4, ease: "easeOut" }}
                              />
                            </svg>
                            ¡Agregado!
                          </motion.div>
                        ) : (
                          <>
                            <ShoppingBag size={14} />
                            Añadir
                          </>
                        )}
                      </button>
                    </MagneticButton>
                  </div>
                </div>

                {/* Mobile Navigation Arrows */}
                <div className="flex justify-between items-center md:hidden pt-4 border-t border-slate-200/50 dark:border-white/10">
                   {onPrev ? (
                    <button onClick={onPrev} className="text-primary dark:text-white flex items-center gap-1 text-xs font-bold px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl">
                      <ChevronLeft size={16} /> Anterior
                    </button>
                   ) : <div/>}
                   {onNext ? (
                    <button onClick={onNext} className="text-primary dark:text-white flex items-center gap-1 text-xs font-bold px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl">
                      Siguiente <ChevronRight size={16} />
                    </button>
                   ) : <div/>}
                </div>

              </div>
            </div>

          </div>
        </div>
      </motion.div>

      {/* Lightbox Overlay */}
      <AnimatePresence>
        {isLightboxOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] bg-slate-950/95 backdrop-blur-sm flex items-center justify-center"
            onClick={(e) => {
              e.stopPropagation();
              setIsLightboxOpen(false);
            }}
          >
            <button
              onClick={() => setIsLightboxOpen(false)}
              className="absolute top-4 right-4 sm:top-6 sm:right-6 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-full transition-colors z-50 focus-visible:outline-none"
            >
              <X size={24} />
            </button>
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="w-full h-full flex items-center justify-center p-4 sm:p-12 cursor-zoom-out"
            >
              <img
                src={displayImage}
                alt={product.name}
                className="max-w-full max-h-full object-contain shadow-2xl drop-shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default ProductQuickView;
