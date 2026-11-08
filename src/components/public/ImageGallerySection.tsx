import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import OptimizedMedia from '../common/OptimizedMedia';
import { ScrollReveal } from '../animations/MotionWrappers';
import { X, ChevronLeft, ChevronRight, ImageIcon, Play, Pause, ArrowUpRight } from 'lucide-react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { supabase } from '../../config/supabase';
import type { ReactNode } from 'react';

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

type GalleryFilter = 'all' | 'moments' | 'ministries';

const GalleryReveal = ({
  children,
  delay = 0,
  className = '',
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) => {
  const prefersReducedMotion = useReducedMotion();
  if (prefersReducedMotion) return <div className={className}>{children}</div>;
  return <ScrollReveal className={className} direction="up" distance={16} duration={0.75} delay={delay}>{children}</ScrollReveal>;
};

// Sub-component for an individual collection card.
const CategoryCard = ({ 
  categoryName, 
  images, 
  collectionType,
  onClick,
  getImageSrc,
  onImageError,
  count,
  coverUrl,
}: { 
  categoryName: string; 
  images: GalleryImage[]; 
  collectionType: 'moment' | 'ministry';
  onClick: () => void; 
  getImageSrc: (image: GalleryImage) => string;
  onImageError: (image: GalleryImage, categoryName: string) => void;
  count?: number;
  coverUrl?: string | null;
}) => {
  const [currentIdx, setCurrentIdx] = useState(0);
  const prefersReducedMotion = useReducedMotion();
  const imageCount = images.length;

  // Keep the cover still for people who prefer reduced motion.
  useEffect(() => {
    if (imageCount <= 1 || prefersReducedMotion) return;
    const intervalId = setInterval(() => {
      setCurrentIdx((prev) => (prev + 1) % imageCount);
    }, 5200);

    return () => clearInterval(intervalId);
  }, [imageCount, prefersReducedMotion]);

  const activeImage = imageCount > 0 ? images[currentIdx % imageCount] : undefined;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Abrir galería ${categoryName}, ${count ?? images.length} ${(count ?? images.length) === 1 ? 'foto' : 'fotos'}`}
      className="group relative block aspect-[1.12/1] h-full w-full cursor-pointer overflow-hidden rounded-[1.75rem] border border-white/60 bg-slate-950 text-left shadow-[0_16px_38px_rgba(15,23,42,0.12)] transition duration-500 motion-safe:hover:-translate-y-1 hover:shadow-[0_24px_52px_rgba(15,23,42,0.2)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-400/70 dark:border-white/10 dark:shadow-none motion-reduce:transition-none sm:aspect-[4/3] lg:aspect-auto"
    >
      {/* Animated background slides */}
      <div className="absolute inset-0 w-full h-full select-none">
        <AnimatePresence mode="wait">
          {activeImage ? (
            <motion.img
              key={activeImage.id}
              src={getImageSrc(activeImage)}
              onError={() => onImageError(activeImage, categoryName)}
              alt={activeImage.alt || activeImage.caption || `Fotografía de ${categoryName}`}
              loading="lazy"
              decoding="async"
              initial={prefersReducedMotion ? false : { opacity: 0, scale: 1.02 }}
              animate={{ opacity: 1, scale: prefersReducedMotion ? 1 : 1.06 }}
              exit={{ opacity: 0 }}
              transition={{ duration: prefersReducedMotion ? 0 : 1.2, ease: 'easeInOut' }}
              className="pointer-events-none h-full w-full select-none object-cover transition-transform duration-700 motion-safe:group-hover:scale-[1.08] motion-reduce:transition-none"
            />
          ) : coverUrl ? (
            <motion.img key={coverUrl} src={getImageSrc({ id: `cover:${categoryName}`, url: coverUrl, category: categoryName })} onError={() => onImageError({ id: `cover:${categoryName}`, url: coverUrl, category: categoryName }, categoryName)} alt="" loading="lazy" decoding="async" initial={prefersReducedMotion ? false : { opacity: 0 }} animate={{ opacity: 1 }} className="h-full w-full object-cover" />
          ) : (
            <div className="relative flex h-full items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_75%_20%,rgba(199,157,63,0.28),transparent_30%),linear-gradient(135deg,#0b1736,#172554_60%,#7c4a16)]"><div aria-hidden="true" className="absolute -right-12 -top-12 size-48 rounded-full border border-white/10" /><div aria-hidden="true" className="absolute -right-3 -top-3 size-28 rounded-full border border-white/10" /><ImageIcon size={42} className="text-white/50" /></div>
          )}
        </AnimatePresence>
      </div>

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/35 to-slate-950/5 opacity-90 transition-opacity duration-300 group-hover:opacity-100" />

      <div className="absolute inset-x-0 top-0 z-10 flex items-start justify-between gap-2 p-3 sm:p-4">
        <span className="max-w-[68%] truncate rounded-full border border-white/15 bg-slate-950/65 px-3 py-1.5 text-[9px] font-extrabold uppercase tracking-[0.14em] text-amber-300 shadow-lg backdrop-blur-md sm:text-[10px]">
          {categoryName === 'General' ? 'Otros momentos' : categoryName}
        </span>
        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-white/15 bg-slate-950/60 px-2.5 py-1.5 text-[10px] font-bold text-white/90 shadow-lg backdrop-blur-md sm:text-[11px]">
          <ImageIcon size={12} aria-hidden="true" />
          {count ?? images.length} {((count ?? images.length) === 1) ? 'foto' : 'fotos'}
        </span>
      </div>

      <div className="absolute inset-x-0 bottom-0 z-10 flex items-end justify-between gap-3 p-4 text-left sm:p-5 md:p-6">
        <div className="min-w-0">
          <span className="mb-1.5 block text-[9px] font-bold uppercase tracking-[0.18em] text-amber-300/95 sm:text-[10px]">
            {collectionType === 'moment' ? 'Momentos compartidos' : 'Vida de comunidad'}
          </span>
          <p className="line-clamp-2 font-serif text-base font-bold leading-snug text-white drop-shadow-md transition-colors group-hover:text-amber-100 sm:text-lg md:text-xl">
          {activeImage?.caption || `Ver galería de ${categoryName}`}
          </p>
        </div>
          <span aria-hidden="true" className="grid size-10 shrink-0 translate-y-1 place-items-center rounded-full border border-white/25 bg-white/10 text-white opacity-85 backdrop-blur-md transition duration-300 motion-safe:group-hover:translate-y-0 group-hover:border-amber-200/60 group-hover:bg-amber-300 group-hover:text-slate-950 group-focus-visible:translate-y-0 group-focus-visible:border-amber-200/60 group-focus-visible:bg-amber-300 group-focus-visible:text-slate-950 motion-reduce:translate-y-0 motion-reduce:transition-none sm:size-11">
          <ArrowUpRight size={18} />
        </span>
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
  const [galleryFilter, setGalleryFilter] = useState<GalleryFilter>('all');
  const [lightboxIndex, setLightboxIndex] = useState<number>(0);
  const [direction, setDirection] = useState<number>(0); // -1 = Left, 1 = Right
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [failedImages, setFailedImages] = useState<Record<string, string>>({});
  const [ministryCollections, setMinistryCollections] = useState<MinistryGalleryCollection[]>([]);
  const [collectionsLoading, setCollectionsLoading] = useState(showMinistryCollections);
  const thumbnailContainerRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const prefersReducedMotion = useReducedMotion();

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

  const galleryCards = useMemo(() => [
    ...Object.entries(categoriesMap).map(([categoryName, images]) => ({
      key: `category:${categoryName}`,
      selectionKey: categoryName,
      categoryName,
      images,
      count: images.length,
      collectionType: 'moment' as const,
      coverUrl: null,
    })),
    ...ministryCollections.map((collection) => ({
      key: `ministry:${collection.id}`,
      selectionKey: `ministry:${collection.id}`,
      categoryName: collection.name,
      images: collection.images,
      count: collection.images.length,
      collectionType: 'ministry' as const,
      coverUrl: collection.coverUrl,
    })),
  ], [categoriesMap, ministryCollections]);

  const visibleGalleryCards = useMemo(() => galleryCards.filter((card) => (
    galleryFilter === 'all' ||
    (galleryFilter === 'moments' && card.collectionType === 'moment') ||
    (galleryFilter === 'ministries' && card.collectionType === 'ministry')
  )), [galleryCards, galleryFilter]);
  const momentsCount = galleryCards.filter((card) => card.collectionType === 'moment').length;
  const ministriesCount = galleryCards.length - momentsCount;
  const totalPhotoCount = galleryCards.reduce((total, card) => total + card.count, 0);

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
    setIsPlaying(false);
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
    if (!selectedCategory || !isPlaying || prefersReducedMotion || activeCategoryImages.length <= 1) return;

    const intervalId = setInterval(() => {
      handleNext();
    }, 5000);

    return () => clearInterval(intervalId);
  }, [selectedCategory, isPlaying, prefersReducedMotion, activeCategoryImages, handleNext]);

  // Keyboard navigation for Lightbox popup
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedCategory) return;
      if (e.key === 'Escape') handleClose();
      if (e.key === 'ArrowRight') { e.preventDefault(); handleNext(); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); handlePrev(); }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedCategory, handleClose, handleNext, handlePrev]);

  useEffect(() => {
    if (!selectedCategory) return;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    previousFocusRef.current = previousFocus;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const focusFrame = window.requestAnimationFrame(() => closeButtonRef.current?.focus());

    const handleTabKey = (event: KeyboardEvent) => {
      if (event.key !== 'Tab' || !dialogRef.current) return;
      const focusable = Array.from(dialogRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])'
      )).filter((element) => element.getClientRects().length > 0);
      if (focusable.length === 0) {
        event.preventDefault();
        dialogRef.current.focus();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && (document.activeElement === first || !dialogRef.current.contains(document.activeElement))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (document.activeElement === last || !dialogRef.current.contains(document.activeElement))) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener('keydown', handleTabKey);
    return () => {
      window.cancelAnimationFrame(focusFrame);
      window.removeEventListener('keydown', handleTabKey);
      document.body.style.overflow = previousOverflow;
      window.requestAnimationFrame(() => previousFocusRef.current?.focus());
    };
  }, [selectedCategory]);

  // Auto-scroll thumbnail bar to active image
  useEffect(() => {
    if (thumbnailContainerRef.current) {
      const activeThumb = thumbnailContainerRef.current.children[lightboxIndex] as HTMLElement;
      if (activeThumb) {
        activeThumb.scrollIntoView({
          behavior: prefersReducedMotion ? 'auto' : 'smooth',
          block: 'nearest',
          inline: 'center'
        });
      }
    }
  }, [lightboxIndex, prefersReducedMotion]);

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
      <section className="relative mx-auto max-w-7xl overflow-hidden px-4 py-14 md:px-8 md:py-20 lg:py-24">
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-8 top-24 -z-10 h-72 bg-[radial-gradient(circle_at_12%_20%,rgba(199,157,63,0.12),transparent_34%),radial-gradient(circle_at_88%_4%,rgba(30,58,138,0.1),transparent_38%)] blur-2xl" />
        <div className="space-y-8 md:space-y-10">
          <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_auto] md:items-end md:gap-10">
            <div className="mx-auto max-w-3xl space-y-3 text-center md:mx-0 md:text-left">
              <GalleryReveal>
                <span className="inline-flex items-center gap-2 rounded-full border border-amber-700/20 bg-amber-50/90 px-3.5 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.18em] text-amber-800 shadow-sm dark:border-amber-300/20 dark:bg-amber-400/10 dark:text-church-gold-bright sm:text-[11px]">
                  <ImageIcon className="size-3.5" aria-hidden="true" />
                  Comunidad · Galería
                </span>
              </GalleryReveal>
              {title && (
                <GalleryReveal delay={0.08}>
                  <h2 className="font-serif text-3xl font-bold leading-tight tracking-tight text-slate-950 dark:text-white sm:text-4xl lg:text-[2.7rem]">
                    {title}
                  </h2>
                </GalleryReveal>
              )}
              {subtitle && (
                <GalleryReveal delay={0.14}>
                  <p className="max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300 sm:text-base sm:leading-7">
                    {subtitle}
                  </p>
                </GalleryReveal>
              )}
            </div>

            <div aria-live="polite" className="mx-auto flex w-fit items-center gap-4 rounded-2xl border border-slate-200/80 bg-white/75 px-4 py-3 shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-slate-950/50 md:mx-0 md:mb-1 md:gap-5">
              <div className="text-center">
                <p className="font-serif text-2xl font-bold leading-none text-slate-950 dark:text-white">{galleryCards.length}</p>
                <p className="mt-1 text-[9px] font-bold uppercase tracking-[0.15em] text-slate-500 dark:text-slate-400 sm:text-[10px]">colecciones</p>
              </div>
              <span aria-hidden="true" className="h-8 w-px bg-slate-200 dark:bg-white/15" />
              <div className="text-center">
                <p className="font-serif text-2xl font-bold leading-none text-slate-950 dark:text-white">{totalPhotoCount}</p>
                <p className="mt-1 text-[9px] font-bold uppercase tracking-[0.15em] text-slate-500 dark:text-slate-400 sm:text-[10px]">fotografías</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-4 border-y border-slate-200/80 py-4 dark:border-white/10 sm:flex-row sm:items-center sm:justify-between">
            <div role="group" aria-label="Filtrar colecciones por momentos o áreas ministeriales" className="flex w-full gap-1.5 overflow-x-auto rounded-full bg-slate-100/80 p-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden dark:bg-white/5 sm:w-fit">
              {([
                { id: 'all', label: 'Todo', count: galleryCards.length },
                { id: 'moments', label: 'Momentos', count: momentsCount },
                { id: 'ministries', label: 'Áreas', count: ministriesCount },
              ] as const).filter((option) => option.id === 'all' || option.count > 0 || collectionsLoading).map((option) => {
                const isActive = galleryFilter === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    aria-pressed={isActive}
                    onClick={() => setGalleryFilter(option.id)}
                    className={`inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-full px-4 text-xs font-bold transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-950 sm:px-5 ${isActive ? 'bg-white text-blue-900 shadow-sm dark:bg-slate-800 dark:text-white' : 'text-slate-600 hover:bg-white/70 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white'}`}
                  >
                    {option.label}
                    <span className={`min-w-5 rounded-full px-1.5 py-0.5 text-[10px] tabular-nums ${isActive ? 'bg-blue-900/8 text-blue-900 dark:bg-white/10 dark:text-white' : 'bg-slate-200/80 text-slate-500 dark:bg-white/10 dark:text-slate-400'}`}>
                      {option.count}
                    </span>
                  </button>
                );
              })}
            </div>
            <p className="text-center text-[11px] font-medium text-slate-500 dark:text-slate-400 sm:text-right">
              {collectionsLoading ? 'Cargando espacios de la comunidad…' : `${visibleGalleryCards.length} ${visibleGalleryCards.length === 1 ? 'colección' : 'colecciones'} para explorar`}
            </p>
          </div>

          <p className="flex items-center justify-center gap-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400 sm:hidden">
            <span>Desliza para explorar</span><ChevronRight size={14} aria-hidden="true" />
          </p>

          {visibleGalleryCards.length > 0 ? (
            <div className="flex w-full snap-x snap-mandatory gap-4 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:grid sm:grid-cols-2 sm:gap-5 sm:overflow-visible lg:auto-rows-[15rem] lg:grid-cols-3 lg:gap-6">
              {visibleGalleryCards.map((card, index) => (
                <div key={card.key} className={`h-full min-w-[84%] max-w-[22rem] snap-center sm:min-w-0 sm:max-w-none ${index === 0 ? 'lg:col-span-2 lg:row-span-2' : ''}`}>
                  <GalleryReveal className="h-full">
                    <CategoryCard
                      categoryName={card.categoryName}
                      images={card.images}
                      collectionType={card.collectionType}
                      coverUrl={card.coverUrl}
                      count={card.count}
                      onClick={() => handleOpenCategory(card.selectionKey)}
                      getImageSrc={getImageSrc}
                      onImageError={handleImageError}
                    />
                  </GalleryReveal>
                </div>
              ))}
            </div>
          ) : collectionsLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-label="Cargando galerías" aria-busy="true">
              {[0, 1, 2].map((item) => <div key={item} className="aspect-[4/3] animate-pulse rounded-[1.75rem] bg-slate-200/70 dark:bg-white/10" />)}
            </div>
          ) : (
            <div className="rounded-[1.75rem] border border-dashed border-slate-300 bg-white/50 px-6 py-12 text-center dark:border-white/15 dark:bg-slate-950/30">
              <ImageIcon className="mx-auto size-8 text-slate-400 dark:text-slate-500" aria-hidden="true" />
              <p className="mt-3 font-serif text-xl font-bold text-slate-900 dark:text-white">Aún no hay colecciones en esta vista</p>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Elige otra categoría para seguir explorando la vida de la comunidad.</p>
              <button type="button" onClick={() => setGalleryFilter('all')} className="mt-5 min-h-11 rounded-full bg-blue-900 px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-blue-950/15 transition hover:bg-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2 dark:bg-blue-700 dark:hover:bg-blue-600">
                Ver todas las colecciones
              </button>
            </div>
          )}
        </div>
      </section>

      {/* MODERN GLASSMORPH POPUP MODAL */}
      <AnimatePresence>
        {selectedCategory && (
          <motion.div
            initial={prefersReducedMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 md:p-8"
            onMouseDown={(event) => { if (event.target === event.currentTarget) handleClose(); }}
          >
            {/* Modal Body Container */}
            <motion.div
              ref={dialogRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby="image-gallery-dialog-title"
              tabIndex={-1}
              initial={prefersReducedMotion ? false : { scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={prefersReducedMotion ? undefined : { scale: 0.95, y: 15 }}
              transition={prefersReducedMotion ? { duration: 0 } : { type: 'spring', stiffness: 260, damping: 26 }}
              className="relative flex h-[min(88dvh,52rem)] max-h-[calc(100dvh-2rem)] w-full max-w-5xl flex-col justify-between overflow-hidden rounded-[1.75rem] border border-white/20 bg-white/10 p-4 shadow-2xl backdrop-blur-xl focus:outline-none dark:border-white/10 dark:bg-slate-950/40 sm:rounded-[2rem] sm:p-6 md:p-8"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Top header bar inside modal */}
              <div className="flex justify-between items-center pb-4 border-b border-white/10 relative z-10">
                <div className="min-w-0 flex-1 space-y-0.5 pr-3 text-left">
                  <span className="text-[10px] font-black text-amber-500 dark:text-church-gold-bright uppercase tracking-widest">
                    Galería de la Iglesia
                  </span>
                  <h3 id="image-gallery-dialog-title" className="line-clamp-2 font-serif text-lg font-bold text-white sm:text-xl md:text-2xl">
                    {selectedMinistry?.name || (selectedCategory === 'General' ? 'Otros Momentos' : selectedCategory)}
                  </h3>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  {/* Autoplay toggle button */}
                  {activeCategoryImages.length > 1 && !prefersReducedMotion && <button
                    type="button"
                    onClick={() => setIsPlaying(prev => !prev)}
                    aria-label={isPlaying ? 'Pausar reproducción automática' : 'Reproducir automáticamente'}
                    aria-pressed={isPlaying}
                    className="grid size-10 place-items-center rounded-xl border border-white/15 bg-white/10 text-white transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
                  >
                    {isPlaying ? <Pause size={16} /> : <Play size={16} />}
                  </button>}
                  {selectedMinistry && <Link to={`/ministerios/${selectedMinistry.slug}`} onClick={handleClose} aria-label={`Ver ${selectedMinistry.category === 'departamento' ? 'departamento' : 'ministerio'} ${selectedMinistry.name}`} className="inline-flex size-10 shrink-0 items-center justify-center gap-1.5 rounded-xl border border-amber-300/30 bg-amber-400 text-xs font-black text-slate-950 transition hover:bg-amber-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200 sm:h-10 sm:w-auto sm:px-3"><ArrowUpRight size={15} /><span className="sr-only sm:not-sr-only">Ver {selectedMinistry.category === 'departamento' ? 'departamento' : 'ministerio'}</span></Link>}
                  {/* Close button */}
                  <button 
                    ref={closeButtonRef}
                    type="button"
                    onClick={handleClose}
                    aria-label="Cerrar galería"
                    className="grid size-10 place-items-center rounded-xl border border-white/15 bg-white/10 text-white transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 motion-safe:hover:rotate-90 motion-reduce:transition-none"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              {/* Main Slideshow Slider Frame */}
              <div className="relative flex min-h-0 flex-1 items-center justify-between py-4 sm:py-6">
                {/* Prev Button */}
                {activeCategoryImages.length > 1 && (
                  <button 
                    onClick={handlePrev}
                    type="button"
                    className="absolute left-0 z-20 grid size-10 place-items-center rounded-xl border border-white/15 bg-slate-950/70 text-white shadow-md transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 active:scale-95 motion-safe:hover:scale-105 motion-reduce:transition-none sm:-left-1 sm:size-11 md:-left-4"
                    aria-label="Foto anterior"
                  >
                    <ChevronLeft size={20} />
                  </button>
                )}

                {/* Central slide viewer wrapper */}
                <div className="relative flex h-full w-full select-none items-center justify-center overflow-hidden px-10 sm:px-12 md:px-14">
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
                      initial={prefersReducedMotion ? false : 'enter'}
                      animate={prefersReducedMotion ? { opacity: 1 } : 'center'}
                      exit={prefersReducedMotion ? undefined : 'exit'}
                      className="relative flex h-full w-full select-none flex-col items-center justify-center"
                    >
                      <OptimizedMedia
                        src={getImageSrc(activeCategoryImages[lightboxIndex])}
                        alt={activeCategoryImages[lightboxIndex].alt || activeCategoryImages[lightboxIndex].caption || 'Foto de la comunidad'}
                        onError={() => handleImageError(activeCategoryImages[lightboxIndex], activeCategoryImages[lightboxIndex].category || selectedCategory)}
                        className="pointer-events-none max-h-[48dvh] max-w-full select-none rounded-2xl border border-white/5 object-contain shadow-xl sm:max-h-[54dvh]"
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
                    type="button"
                    className="absolute right-0 z-20 grid size-10 place-items-center rounded-xl border border-white/15 bg-slate-950/70 text-white shadow-md transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 active:scale-95 motion-safe:hover:scale-105 motion-reduce:transition-none sm:-right-1 sm:size-11 md:-right-4"
                    aria-label="Foto siguiente"
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
                        <button
                          key={img.id}
                          type="button"
                          onClick={() => {
                            setDirection(index > lightboxIndex ? 1 : -1);
                            setLightboxIndex(index);
                          }}
                          aria-label={`Ver foto ${index + 1}: ${img.caption || selectedCategory}`}
                          aria-current={isActive ? 'true' : undefined}
                          className={`h-12 w-16 flex-shrink-0 overflow-hidden rounded-lg border transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 ${
                            isActive
                              ? 'border-amber-400 shadow-md ring-2 ring-amber-400/30 motion-safe:scale-105'
                              : 'border-white/15 opacity-65 hover:opacity-100 sm:brightness-75 sm:hover:brightness-100'
                          }`}
                        >
                          <img loading="lazy"
                            src={getImageSrc(img)}
                            onError={() => handleImageError(img, selectedCategory)}
                            alt=""
                            className="pointer-events-none h-full w-full select-none object-cover"
                          />
                        </button>
                      );
                    })}
                  </div>
                )}
                
                {/* Status Bar Indicator */}
                {activeCategoryImages.length > 0 && <div className="flex items-center justify-between w-full text-[10px] text-white/55 font-mono px-1">
                  <span>{activeCategoryImages.length <= 1 ? 'Galería de una foto' : prefersReducedMotion ? 'Movimiento automático desactivado' : isPlaying ? 'Reproducción automática activa' : 'Reproducción pausada'}</span>
                  <span aria-live="polite" className="rounded-full border border-white/10 bg-white/5 px-3 py-1 font-bold tracking-widest text-white/80">
                    {lightboxIndex + 1} / {activeCategoryImages.length}
                  </span>
                </div>}
              </div>

            </motion.div>

          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
