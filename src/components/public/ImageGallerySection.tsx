import { useState, useEffect, useMemo } from 'react';
import OptimizedMedia from '../common/OptimizedMedia';
import { ScrollReveal, StaggerContainer, StaggerItem, HoverCard } from '../animations/MotionWrappers';
import { X, ChevronLeft, ChevronRight, Maximize2 } from 'lucide-react';

interface GalleryImage {
  id: string;
  url: string;
  caption?: string;
  category?: string;
}

interface ImageGallerySectionProps {
  title: string;
  subtitle: string;
  slides: GalleryImage[];
}

export const ImageGallerySection = ({ 
  title, 
  subtitle, 
  slides 
}: ImageGallerySectionProps) => {
  const [activeCategory, setActiveCategory] = useState<string>('Todos');
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  // Extract unique categories from slides
  const categories = useMemo(() => {
    const list = new Set<string>();
    slides.forEach((slide) => {
      if (slide.category) {
        list.add(slide.category);
      }
    });
    return ['Todos', ...Array.from(list)];
  }, [slides]);

  // Filter slides based on active category
  const filteredSlides = useMemo(() => {
    if (activeCategory === 'Todos') return slides;
    return slides.filter((slide) => slide.category === activeCategory);
  }, [slides, activeCategory]);

  // Close lightbox on Escape and support arrow keys
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedIndex(null);
      if (e.key === 'ArrowRight' && selectedIndex !== null) handleNext();
      if (e.key === 'ArrowLeft' && selectedIndex !== null) handlePrev();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIndex, filteredSlides]);

  if (!slides || slides.length === 0) return null;

  const handlePrev = () => {
    setSelectedIndex((prev) => (prev === null ? null : prev === 0 ? filteredSlides.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setSelectedIndex((prev) => (prev === null ? null : prev === filteredSlides.length - 1 ? 0 : prev + 1));
  };

  return (
    <>
      <section className="max-w-7xl mx-auto px-4 md:px-8 py-20 space-y-12">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto space-y-4">
          <ScrollReveal direction="up" distance={20} duration={1.3}>
            <span className="text-xs font-bold text-amber-600 dark:text-amber-500 uppercase tracking-widest bg-amber-100 dark:bg-amber-950/45 px-4 py-1.5 rounded-full">
              Galería
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

        {/* Filter Tabs */}
        {categories.length > 1 && (
          <ScrollReveal direction="up" distance={20} duration={1.3} delay={0.3} className="flex flex-wrap justify-center gap-3">
            {categories.map((category) => {
              const isActive = activeCategory === category;
              return (
                <button
                  key={category}
                  onClick={() => {
                    setActiveCategory(category);
                    setSelectedIndex(null); // Reset lightbox selection
                  }}
                  className={`px-5 py-2 rounded-full text-xs font-bold transition-all duration-300 cursor-pointer shadow-xs border ${
                    isActive
                      ? 'bg-amber-500 hover:bg-amber-600 text-white border-amber-500 shadow-md shadow-amber-500/20'
                      : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-amber-500/50 dark:hover:border-amber-500/40 hover:bg-amber-500/5 dark:hover:bg-amber-500/5'
                  }`}
                >
                  {category === 'Todos' ? 'Todos los Momentos' : category}
                </button>
              );
            })}
          </ScrollReveal>
        )}

        {/* Grid Layout with Stagger reveal */}
        <div onMouseLeave={() => setHoveredId(null)}>
          <StaggerContainer 
            key={activeCategory} // Force re-render animation when category changes
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 w-full"
          >
            {filteredSlides.map((image, idx) => {
              const isDimmed = hoveredId !== null && hoveredId !== image.id;
              const isHovered = hoveredId === image.id;

              return (
                <StaggerItem key={image.id} className="h-full">
                  <HoverCard
                    onClick={() => setSelectedIndex(idx)}
                    className="h-full"
                  >
                    <div
                      className="relative rounded-3xl overflow-hidden shadow-lg bg-slate-950 border border-slate-200 dark:border-white/10 cursor-pointer aspect-[4/3] group transition-all duration-500 w-full h-full"
                      style={{
                        filter: isDimmed ? 'brightness(0.6) blur(0.5px)' : 'brightness(1) blur(0px)',
                        opacity: isDimmed ? 0.6 : 1,
                      }}
                      onMouseEnter={() => setHoveredId(image.id)}
                    >
                      <OptimizedMedia
                        src={image.url}
                        alt={image.caption || 'Foto de la Galería'}
                        className="w-full h-full object-cover transition-transform duration-1000 select-none scale-100 group-hover:scale-108"
                      />
                      
                      {/* Category Tag Overlay */}
                      {image.category && (
                        <div className="absolute top-4 left-4 z-10 bg-slate-950/85 dark:bg-slate-900/90 text-amber-500 dark:text-amber-400 text-[10px] font-extrabold uppercase tracking-widest px-3.5 py-1.5 rounded-xl shadow-md border border-white/10 select-none">
                          {image.category}
                        </div>
                      )}

                      {/* Play/Zoom Interactive Center Icon */}
                      <div className={`absolute inset-0 flex items-center justify-center pointer-events-none transition-all duration-500 z-10 ${isHovered ? 'opacity-100 scale-100' : 'opacity-0 scale-75'}`}>
                        <div className="w-12 h-12 bg-amber-500 text-white rounded-full flex items-center justify-center shadow-lg border border-amber-400/30">
                          <Maximize2 size={20} strokeWidth={2.5} />
                        </div>
                      </div>

                      {/* Gradient Overlay */}
                      <div className={`absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent transition-opacity duration-500 pointer-events-none ${isHovered ? 'opacity-90' : 'opacity-65'}`} />

                      {/* Caption Overlay */}
                      {image.caption && (
                        <div className={`absolute bottom-0 left-0 right-0 p-6 text-left transform-gpu transition-all duration-500 z-10 ${isHovered ? 'translate-y-0' : 'translate-y-1'}`}>
                          <p className="text-white text-base font-serif font-semibold leading-snug drop-shadow-md group-hover:text-amber-400 transition-colors">
                            {image.caption}
                          </p>
                        </div>
                      )}
                    </div>
                  </HoverCard>
                </StaggerItem>
              );
            })}
          </StaggerContainer>
        </div>
      </section>

      {/* Lightbox Modal */}
      {selectedIndex !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/98 backdrop-blur-md transition-all duration-300">
          {/* Close Button */}
          <button 
            onClick={() => setSelectedIndex(null)}
            className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full backdrop-blur-md transition-all z-50 cursor-pointer shadow-md hover:scale-105 active:scale-95"
            aria-label="Cerrar"
          >
            <X size={20} />
          </button>

          {/* Prev Button */}
          <button 
            onClick={(e) => { e.stopPropagation(); handlePrev(); }}
            className="absolute left-6 p-4 bg-white/5 hover:bg-white/20 text-white rounded-full backdrop-blur-md transition-all z-50 cursor-pointer hover:scale-110 active:scale-90"
            aria-label="Anterior"
          >
            <ChevronLeft size={28} />
          </button>

          {/* Main Content */}
          <div className="w-full max-w-5xl max-h-[85vh] flex flex-col items-center justify-center px-12 relative animate-fadeIn">
            <OptimizedMedia
              src={filteredSlides[selectedIndex].url}
              alt={filteredSlides[selectedIndex].caption || 'Galería Lightbox'}
              className="max-w-full max-h-[72vh] object-contain rounded-2xl shadow-2xl select-none"
            />
            
            {filteredSlides[selectedIndex].caption && (
              <div className="mt-6 bg-slate-900/90 dark:bg-slate-900/90 backdrop-blur-md border border-white/10 px-8 py-3.5 rounded-2xl text-center max-w-2xl shadow-xl">
                {filteredSlides[selectedIndex].category && (
                  <span className="text-[9px] font-bold text-amber-500 uppercase tracking-widest block mb-1">
                    {filteredSlides[selectedIndex].category}
                  </span>
                )}
                <p className="text-white text-base md:text-lg font-serif font-medium">
                  {filteredSlides[selectedIndex].caption}
                </p>
              </div>
            )}
            
            {/* Image Counter */}
            <div className="absolute -bottom-10 text-slate-400 font-mono text-xs font-bold tracking-widest">
              {selectedIndex + 1} / {filteredSlides.length}
            </div>
          </div>

          {/* Next Button */}
          <button 
            onClick={(e) => { e.stopPropagation(); handleNext(); }}
            className="absolute right-6 p-4 bg-white/5 hover:bg-white/20 text-white rounded-full backdrop-blur-md transition-all z-50 cursor-pointer hover:scale-110 active:scale-90"
            aria-label="Siguiente"
          >
            <ChevronRight size={28} />
          </button>

          {/* Invisible backdrop click area */}
          <div 
            className="absolute inset-0 -z-10"
            onClick={() => setSelectedIndex(null)}
          />
        </div>
      )}
    </>
  );
};
