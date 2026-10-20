import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import OptimizedMedia from '../common/OptimizedMedia';
import { ScrollReveal } from '../animations/MotionWrappers';
import { X, ChevronLeft, ChevronRight, Maximize2, ImageIcon, Play, Pause, ArrowUpRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../config/supabase';

export interface GalleryImage {
  id: string;
  url: string;
  caption?: string;
  category?: string;
  alt?: string;
}

interface MinistryGalleryCollection {
  id: string;
  name: string;
  slug: string;
  category: string;
  coverUrl: string | null;
  images: GalleryImage[];
}

interface ImageGallerySectionProps {
  title: string;
  subtitle: string;
  slides: GalleryImage[];
  showMinistryCollections?: boolean;
}

// Sub-component for individual category card with auto-rotating slideshow background
const CategoryCard = ({ 
  categoryName, 
  images, 
  onClick,
  getImageSrc,
  onImageError,
  count,
  coverUrl,
}: { 
  categoryName: string; 
  images: GalleryImage[]; 
  onClick: () => void; 
  getImageSrc: (image: GalleryImage) => string;
  onImageError: (image: GalleryImage, categoryName: string) => void;
  count?: number;
  coverUrl?: string | null;
}) => {
  const [currentIdx, setCurrentIdx] = useState(0);

  // Auto-rotate slideshow inside the card
  useEffect(() => {
    if (images.length <= 1) return;
    
    // Add a slight random delay offset so they don't rotate simultaneously
    const randomOffset = Math.random() * 1200;
    const intervalId = setInterval(() => {
      setCurrentIdx((prev) => (prev + 1) % images.length);
    }, 4000 + randomOffset);

    return () => clearInterval(intervalId);
  }, [images]);

  const activeImage = images[currentIdx];

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Abrir galería: ${categoryName}`}
      className="relative block rounded-3xl overflow-hidden text-left shadow-md dark:shadow-none bg-slate-950 border border-slate-200 dark:border-white/10 cursor-pointer aspect-[4/3] group transition-all duration-500 w-full h-full hover:shadow-[0_20px_40px_rgba(30,41,59,0.15)] dark:hover:shadow-[0_20px_40px_rgba(255,255,255,0.02)] hover:border-amber-500/40 dark:hover:border-amber-500/30 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-400/50"
    >
      {/* Animated background slides */}
      <div className="absolute inset-0 w-full h-full select-none">
        <AnimatePresence mode="wait">
          {activeImage ? (
            <motion.img
              key={activeImage.id}
              src={getImageSrc(activeImage)}
              onError={() => onImageError(activeImage, categoryName)}
              alt={categoryName}
              initial={{ opacity: 0, scale: 1.02 }}
              animate={{ opacity: 1, scale: 1.06 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.2, ease: 'easeInOut' }}
              className="w-full h-full object-cover transition-transform duration-1000 select-none pointer-events-none"
            />
          ) : coverUrl ? (
            <motion.img key={coverUrl} src={getImageSrc({ id: `cover:${categoryName}`, url: coverUrl, category: categoryName })} onError={() => onImageError({ id: `cover:${categoryName}`, url: coverUrl, category: categoryName }, categoryName)} alt="" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center bg-gradient-to-br from-indigo-950 via-slate-900 to-amber-950/80"><ImageIcon size={42} className="text-white/45" /></div>
          )}
        </AnimatePresence>
      </div>

      {/* Category Overlay Tag */}
      <div className="absolute top-4 left-4 z-10 bg-slate-950/85 dark:bg-slate-900/90 text-amber-500 dark:text-amber-400 text-[10px] font-extrabold uppercase tracking-widest px-3.5 py-1.5 rounded-xl shadow-md border border-white/10 select-none">
        {categoryName === 'General' ? 'Otros Momentos' : categoryName}
      </div>

      {/* Slides Count Badge */}
      <div className="absolute top-4 right-4 z-10 bg-black/60 backdrop-blur-md text-white text-[9px] font-bold px-2.5 py-1.5 rounded-xl border border-white/10 select-none">
        {count ?? images.length} {(count ?? images.length) === 1 ? 'Foto' : 'Fotos'}
      </div>

      {/* Center Interactive Maximize Icon */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none transition-all duration-500 z-10 opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100">
        <div className="w-12 h-12 bg-amber-500 text-white rounded-full flex items-center justify-center shadow-lg border border-amber-400/30">
          <Maximize2 size={20} strokeWidth={2.5} />
        </div>
      </div>

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/25 to-transparent opacity-60 group-hover:opacity-70 transition-opacity duration-500 pointer-events-none" />

      {/* Caption/Description Overlay */}
      <div className="absolute bottom-0 left-0 right-0 p-6 text-left transform-gpu transition-all duration-500 z-10">
        <span className="text-[9px] font-bold text-amber-500 uppercase tracking-widest block mb-1">
          Galería Interactiva
        </span>
        <p className="text-white text-base md:text-lg font-serif font-bold leading-snug drop-shadow-md group-hover:text-amber-400 transition-colors">
          {activeImage?.caption || `Ver galería de ${categoryName}`}
        </p>
      </div>
    </button>
  );
};

export const ImageGallerySection = ({ 
  title, 
  subtitle, 
  slides,
  showMinistryCollections = true,
}: ImageGallerySectionProps) => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number>(0);
  const [direction, setDirection] = useState<number>(0); // -1 = Left, 1 = Right
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [failedImages, setFailedImages] = useState<Record<string, string>>({});
  const [ministryCollections, setMinistryCollections] = useState<MinistryGalleryCollection[]>([]);
  const [collectionsLoading, setCollectionsLoading] = useState(showMinistryCollections);
  const thumbnailContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showMinistryCollections) return;
    let active = true;
    const loadMinistryCollections = async () => {
      const [ministriesResult, photosResult] = await Promise.all([
        supabase.from('ministries').select('id, name, slug, category, image_url').order('name'),
        supabase.from('ministry_gallery_items').select('id, ministry_id, image_url, alt_text, caption, sort_order').order('sort_order').order('created_at', { ascending: false }),
      ]);
      if (!active) return;
      if (ministriesResult.error || photosResult.error) {
        console.error('Error loading public ministry galleries:', ministriesResult.error || photosResult.error);
        setMinistryCollections([]);
        setCollectionsLoading(false);
        return;
      }
      const photos = (photosResult.data || []) as Array<{ id: string; ministry_id: string; image_url: string; alt_text: string; caption: string; sort_order: number }>;
      const items = (ministriesResult.data || []) as Array<{ id: string; name: string; slug: string; category: string; image_url: string | null }>;
      setMinistryCollections(items.map((ministry) => ({
        id: ministry.id,
        name: ministry.name,
        slug: ministry.slug,
        category: ministry.category,
        coverUrl: ministry.image_url,
        images: photos.filter((photo) => photo.ministry_id === ministry.id).map((photo) => ({
          id: photo.id,
          url: photo.image_url,
          caption: photo.caption,
          alt: photo.alt_text,
          category: ministry.name,
        })),
      })));
      setCollectionsLoading(false);
    };
    void loadMinistryCollections();
    return () => { active = false; };
  }, [showMinistryCollections]);

  const getImageFallback = (categoryName: string) => {
    const normalizedCategory = categoryName.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase();
    return normalizedCategory.includes('ensenanza') || normalizedCategory.includes('estudio') || normalizedCategory.includes('palabra')
      ? '/products/biblia-estudio.webp'
      : null;
  };

  const getImageSrc = (image: GalleryImage) =>
    failedImages[image.id] || image.url;

  const handleImageError = (image: GalleryImage, categoryName: string) => {
    const fallback = getImageFallback(categoryName);
    if (!fallback || image.url === fallback) return;
    setFailedImages((current) => current[image.id] ? current : { ...current, [image.id]: fallback });
  };

  // Group slides by category dynamically
  const categoriesMap = useMemo(() => {
    const map: Record<string, GalleryImage[]> = {};
    slides.forEach((slide) => {
      const cat = slide.category?.trim() || 'General';
      if (!map[cat]) {
        map[cat] = [];
      }
      map[cat].push(slide);
    });
    return map;
  }, [slides]);

  const activeCategoryImages = useMemo(() => {
    if (!selectedCategory) return [];
    return categoriesMap[selectedCategory] || ministryCollections.find((item) => `ministry:${item.id}` === selectedCategory)?.images || [];
  }, [selectedCategory, categoriesMap, ministryCollections]);
  const selectedMinistry = ministryCollections.find((item) => `ministry:${item.id}` === selectedCategory);

  // Action handlers defined above useEffect
  const handleOpenCategory = useCallback((catName: string) => {
    setSelectedCategory(catName);
    setLightboxIndex(0);
    setDirection(0);
    setIsPlaying(true);
  }, []);

  const handleClose = useCallback(() => {
    setSelectedCategory(null);
  }, []);

  const handlePrev = useCallback(() => {
    if (activeCategoryImages.length <= 1) return;
    setDirection(-1);
    setLightboxIndex((prev) => (prev === 0 ? activeCategoryImages.length - 1 : prev - 1));
  }, [activeCategoryImages]);

  const handleNext = useCallback(() => {
    if (activeCategoryImages.length <= 1) return;
    setDirection(1);
    setLightboxIndex((prev) => (prev + 1) % activeCategoryImages.length);
  }, [activeCategoryImages]);

  // Autoplay functionality inside the lightbox popup
  useEffect(() => {
    if (!selectedCategory || !isPlaying || activeCategoryImages.length <= 1) return;

    const intervalId = setInterval(() => {
      handleNext();
    }, 5000);

    return () => clearInterval(intervalId);
  }, [selectedCategory, isPlaying, activeCategoryImages, handleNext]);

  // Keyboard navigation for Lightbox popup
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedCategory) return;
      if (e.key === 'Escape') handleClose();
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === ' ') {
        e.preventDefault();
        setIsPlaying(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedCategory, handleClose, handleNext, handlePrev]);

  // Auto-scroll thumbnail bar to active image
  useEffect(() => {
    if (thumbnailContainerRef.current) {
      const activeThumb = thumbnailContainerRef.current.children[lightboxIndex] as HTMLElement;
      if (activeThumb) {
        activeThumb.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'center'
        });
      }
    }
  }, [lightboxIndex]);

  if ((!slides || slides.length === 0) && ministryCollections.length === 0 && !collectionsLoading) return null;

  // Variants for slide animation (left/right sliding)
  const slideVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 160 : dir < 0 ? -160 : 0,
      opacity: 0,
      scale: 0.98
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
      transition: {
        x: { type: 'spring' as const, stiffness: 300, damping: 30 },
        opacity: { duration: 0.25 }
      }
    },
    exit: (dir: number) => ({
      x: dir < 0 ? 160 : dir > 0 ? -160 : 0,
      opacity: 0,
      scale: 0.98,
      transition: {
        x: { type: 'spring' as const, stiffness: 300, damping: 30 },
        opacity: { duration: 0.2 }
      }
    })
  };

  return (
    <>
      <section className="max-w-7xl mx-auto px-4 md:px-8 py-20 space-y-12">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto space-y-4">
          <ScrollReveal direction="up" distance={20} duration={1.3}>
            <span className="inline-flex items-center space-x-2 bg-amber-50 dark:bg-amber-900/25 px-4 py-1.5 rounded-full border border-amber-250 dark:border-amber-700/30 text-amber-800 dark:text-church-gold-bright text-xs font-bold uppercase tracking-widest">
              <ImageIcon className="w-3.5 h-3.5" />
              <span>Galería de Momentos</span>
            </span>
          </ScrollReveal>
          {title && (
            <ScrollReveal direction="up" distance={20} duration={1.3} delay={0.1}>
              <h2 className="text-3xl md:text-4xl font-serif font-bold text-slate-900 dark:text-white">
                {title}
              </h2>
            </ScrollReveal>
          )}
          {subtitle && (
            <ScrollReveal direction="up" distance={20} duration={1.3} delay={0.2}>
              <p className="text-slate-550 dark:text-slate-400 text-sm md:text-base leading-relaxed">
                {subtitle}
              </p>
            </ScrollReveal>
          )}
        </div>

        {/* Grid of Categories */}
        <div className="grid grid-cols-1 gap-6 w-full sm:grid-cols-2 lg:grid-cols-3">
          {Object.keys(categoriesMap).map((catName) => (
            <ScrollReveal key={`category:${catName}`} direction="up" distance={20} duration={1.2}>
              <CategoryCard
                categoryName={catName}
                images={categoriesMap[catName]}
                onClick={() => handleOpenCategory(catName)}
                getImageSrc={getImageSrc}
                onImageError={handleImageError}
              />
            </ScrollReveal>
          ))}
          {ministryCollections.map((collection) => (
            <ScrollReveal key={`ministry:${collection.id}`} direction="up" distance={20} duration={1.2}>
              <CategoryCard
                categoryName={collection.name}
                images={collection.images}
                coverUrl={collection.coverUrl}
                count={collection.images.length}
                onClick={() => handleOpenCategory(`ministry:${collection.id}`)}
                getImageSrc={getImageSrc}
                onImageError={handleImageError}
              />
            </ScrollReveal>
          ))}
          {collectionsLoading && <div className="flex aspect-[4/3] items-center justify-center rounded-3xl border border-slate-200 bg-white/70 text-slate-500 shadow-sm dark:border-white/10 dark:bg-slate-900/60"><span className="inline-flex items-center gap-2 text-sm font-semibold"><ImageIcon size={17} className="animate-pulse" /> Cargando espacios de la comunidad</span></div>}
        </div>
      </section>

      {/* MODERN GLASSMORPH POPUP MODAL */}
      <AnimatePresence>
        {selectedCategory && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 md:p-8"
          >
            {/* Modal Body Container */}
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              transition={{ type: 'spring', stiffness: 260, damping: 26 }}
              className="bg-white/10 dark:bg-slate-950/40 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-[2.5rem] shadow-2xl p-6 md:p-8 relative w-full max-w-5xl h-[85vh] max-h-[85vh] flex flex-col justify-between overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Top header bar inside modal */}
              <div className="flex justify-between items-center pb-4 border-b border-white/10 relative z-10">
                <div className="space-y-0.5 text-left">
                  <span className="text-[10px] font-black text-amber-500 dark:text-church-gold-bright uppercase tracking-widest">
                    Galería de la Iglesia
                  </span>
                  <h3 className="font-serif font-bold text-xl md:text-2xl text-white">
                    {selectedMinistry?.name || (selectedCategory === 'General' ? 'Otros Momentos' : selectedCategory)}
                  </h3>
                </div>

                <div className="flex items-center gap-2">
                  {/* Autoplay toggle button */}
                  {activeCategoryImages.length > 1 && <button
                    onClick={() => setIsPlaying(prev => !prev)}
                    className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-2xl transition-all cursor-pointer border border-white/15"
                    title={isPlaying ? 'Pausar reproducción' : 'Reproducir automáticamente'}
                  >
                    {isPlaying ? <Pause size={16} /> : <Play size={16} />}
                  </button>}
                  {selectedMinistry && <Link to={`/ministerios/${selectedMinistry.slug}`} onClick={handleClose} className="inline-flex items-center gap-1.5 rounded-2xl border border-amber-300/30 bg-amber-400 px-3 py-2.5 text-xs font-black text-slate-950 transition hover:bg-amber-300"><ArrowUpRight size={15} /> Ir al {selectedMinistry.category === 'departamento' ? 'departamento' : 'ministerio'}</Link>}
                  {/* Close button */}
                  <button 
                    onClick={handleClose}
                    className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-2xl transition-all cursor-pointer border border-white/15 hover:rotate-90"
                    title="Cerrar galería"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              {/* Main Slideshow Slider Frame */}
              <div className="flex-grow flex items-center justify-between relative min-h-0 py-6">
                {/* Prev Button */}
                {activeCategoryImages.length > 1 && (
                  <button 
                    onClick={handlePrev}
                    className="absolute left-0 md:-left-4 p-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl border border-white/15 z-20 cursor-pointer shadow-md hover:scale-105 active:scale-95 transition-all select-none"
                    aria-label="Anterior"
                  >
                    <ChevronLeft size={20} />
                  </button>
                )}

                {/* Central slide viewer wrapper */}
                <div className="w-full h-full flex items-center justify-center px-8 md:px-14 relative overflow-hidden select-none">
                  {activeCategoryImages.length === 0 ? (
                    <div className="max-w-md text-center text-white">
                      <ImageIcon size={38} className="mx-auto text-white/60" />
                      <h4 className="mt-4 font-serif text-xl font-bold">Pronto tendremos fotos</h4>
                      <p className="mt-2 text-sm leading-6 text-white/70">Este espacio de la comunidad aún no tiene imágenes publicadas.</p>
                      {selectedMinistry && <Link to={`/ministerios/${selectedMinistry.slug}`} onClick={handleClose} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-bold text-slate-900 transition hover:bg-amber-100">Conocer {selectedMinistry.name}<ArrowUpRight size={15} /></Link>}
                    </div>
                  ) : <AnimatePresence initial={false} custom={direction} mode="wait">
                    <motion.div
                      key={lightboxIndex}
                      custom={direction}
                      variants={slideVariants}
                      initial="enter"
                      animate="center"
                      exit="exit"
                      className="w-full h-full flex flex-col items-center justify-center relative select-none"
                    >
                      <OptimizedMedia
                        src={getImageSrc(activeCategoryImages[lightboxIndex])}
                        alt={activeCategoryImages[lightboxIndex].alt || activeCategoryImages[lightboxIndex].caption || 'Foto de la comunidad'}
                        onError={() => handleImageError(activeCategoryImages[lightboxIndex], activeCategoryImages[lightboxIndex].category || selectedCategory)}
                        className="max-w-full max-h-[42vh] md:max-h-[50vh] object-contain rounded-2xl shadow-xl select-none pointer-events-none border border-white/5"
                      />
                      
                      {activeCategoryImages[lightboxIndex].caption && (
                        <div className="mt-4 bg-black/50 backdrop-blur-md border border-white/15 px-6 py-2.5 rounded-2xl text-center max-w-xl shadow-lg">
                          <p className="text-white text-xs md:text-sm font-serif font-medium leading-relaxed">
                            {activeCategoryImages[lightboxIndex].caption}
                          </p>
                        </div>
                      )}
                    </motion.div>
                  </AnimatePresence>}
                </div>

                {/* Next Button */}
                {activeCategoryImages.length > 1 && (
                  <button 
                    onClick={handleNext}
                    className="absolute right-0 md:-right-4 p-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl border border-white/15 z-20 cursor-pointer shadow-md hover:scale-105 active:scale-95 transition-all select-none"
                    aria-label="Siguiente"
                  >
                    <ChevronRight size={20} />
                  </button>
                )}
              </div>

              {/* Bottom Thumbnail Strip and counter */}
              <div className="border-t border-white/10 pt-4 flex flex-col items-center gap-3 relative z-10">
                {activeCategoryImages.length > 1 && (
                  <div 
                    ref={thumbnailContainerRef}
                    className="flex gap-2.5 overflow-x-auto w-full justify-start md:justify-center no-scrollbar py-1"
                  >
                    {activeCategoryImages.map((img, index) => {
                      const isActive = index === lightboxIndex;
                      return (
                        <div
                          key={img.id}
                          onClick={() => {
                            setDirection(index > lightboxIndex ? 1 : -1);
                            setLightboxIndex(index);
                          }}
                          className={`w-14 h-10 md:w-16 md:h-12 rounded-lg overflow-hidden border cursor-pointer flex-shrink-0 transition-all select-none ${
                            isActive
                              ? 'border-amber-500 scale-105 shadow-md brightness-100 ring-2 ring-amber-500/20'
                              : 'border-white/10 opacity-55 hover:opacity-100 brightness-75'
                          }`}
                        >
                          <img loading="lazy"
                            src={getImageSrc(img)}
                            onError={() => handleImageError(img, selectedCategory)}
                            alt={`Thumbnail ${index + 1}`}
                            className="w-full h-full object-cover pointer-events-none select-none"
                          />
                        </div>
                      );
                    })}
                  </div>
                )}
                
                {/* Status Bar Indicator */}
                {activeCategoryImages.length > 0 && <div className="flex items-center justify-between w-full text-[10px] text-white/55 font-mono px-1">
                  <span>Autoplay: <span className={isPlaying ? 'text-green-400 font-bold' : 'text-red-400 font-bold'}>{isPlaying ? 'Activo' : 'Pausado'}</span></span>
                  <span className="font-bold tracking-widest bg-white/5 border border-white/10 px-3 py-1 rounded-full text-white/70">
                    {lightboxIndex + 1} / {activeCategoryImages.length}
                  </span>
                </div>}
              </div>

            </motion.div>

            {/* Invisible backdrop tap area to close */}
            <div 
              className="absolute inset-0 -z-10"
              onClick={handleClose}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
