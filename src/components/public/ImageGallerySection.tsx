import { useState, useEffect } from 'react';
import OptimizedMedia from '../common/OptimizedMedia';
import { AnimeFadeUp } from '../animations/AnimeWrappers';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

interface GalleryImage {
  id: string;
  url: string;
  caption?: string;
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
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  // Close lightbox on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedIndex(null);
      if (e.key === 'ArrowRight' && selectedIndex !== null) handleNext();
      if (e.key === 'ArrowLeft' && selectedIndex !== null) handlePrev();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIndex]);

  if (!slides || slides.length === 0) return null;

  const handlePrev = () => {
    setSelectedIndex((prev) => (prev === null ? null : prev === 0 ? slides.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setSelectedIndex((prev) => (prev === null ? null : prev === slides.length - 1 ? 0 : prev + 1));
  };

  // Curate sizes/heights to simulate different masonry columns
  const getMasonryHeightClass = (index: number) => {
    const heights = ['h-64', 'h-80', 'h-96', 'h-72', 'h-80', 'h-96'];
    return heights[index % heights.length];
  };

  return (
    <>
      <section className="max-w-7xl mx-auto px-4 md:px-8 py-20 space-y-12">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto space-y-4">
          <AnimeFadeUp>
            <span className="text-xs font-bold text-amber-600 dark:text-amber-500 uppercase tracking-widest bg-amber-100 dark:bg-amber-950/45 px-4 py-1.5 rounded-full">
              Galería
            </span>
          </AnimeFadeUp>
          {title && (
            <AnimeFadeUp delay={100}>
              <h2 className="text-3xl md:text-4xl font-serif font-bold text-slate-900 dark:text-white">
                {title}
              </h2>
            </AnimeFadeUp>
          )}
          {subtitle && (
            <AnimeFadeUp delay={200}>
              <p className="text-slate-500 dark:text-slate-400 text-sm md:text-base leading-relaxed">
                {subtitle}
              </p>
            </AnimeFadeUp>
          )}
        </div>

        {/* Masonry Layout Grid using CSS columns */}
        <div 
          className="columns-1 sm:columns-2 lg:columns-3 gap-6 space-y-6 w-full"
          onMouseLeave={() => setHoveredId(null)}
        >
          {slides.map((image, idx) => {
            const isDimmed = hoveredId !== null && hoveredId !== image.id;
            const isHovered = hoveredId === image.id;

            return (
              <div
                key={image.id}
                onClick={() => setSelectedIndex(idx)}
                className={`break-inside-avoid relative rounded-3xl overflow-hidden shadow-md bg-slate-950 border border-slate-200 dark:border-white/10 cursor-pointer ${getMasonryHeightClass(idx)} transition-all duration-500`}
                style={{
                  filter: isDimmed ? 'brightness(0.55) blur(1px)' : 'brightness(1) blur(0px)',
                  opacity: isDimmed ? 0.55 : 1,
                  transform: isHovered ? 'scale(1.025)' : 'scale(1)'
                }}
                onMouseEnter={() => setHoveredId(image.id)}
              >
                <OptimizedMedia
                  src={image.url}
                  alt={image.caption || 'Foto de la Galería'}
                  className="w-full h-full object-cover transition-transform duration-700 select-none scale-110"
                />
                
                {/* Overlay Gradient on Hover */}
                <div className={`absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent transition-opacity duration-300 ${isHovered ? 'opacity-90' : 'opacity-60'}`} />

                {/* Caption Overlay */}
                {image.caption && (
                  <div className={`absolute bottom-0 left-0 right-0 p-6 text-left transform-gpu transition-all duration-300 ${isHovered ? 'translate-y-0' : 'translate-y-2'}`}>
                    <p className="text-white text-sm md:text-base font-serif font-semibold leading-snug drop-shadow-md">
                      {image.caption}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Lightbox Modal */}
      {selectedIndex !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/95 backdrop-blur-sm transition-opacity">
          {/* Close Button */}
          <button 
            onClick={() => setSelectedIndex(null)}
            className="absolute top-6 right-6 p-2 bg-white/10 hover:bg-white/20 text-white rounded-full backdrop-blur-md transition-all z-50 cursor-pointer"
          >
            <X size={24} />
          </button>

          {/* Prev Button */}
          <button 
            onClick={(e) => { e.stopPropagation(); handlePrev(); }}
            className="absolute left-4 p-3 bg-white/5 hover:bg-white/20 text-white rounded-full backdrop-blur-md transition-all z-50 cursor-pointer hover:scale-110"
          >
            <ChevronLeft size={32} />
          </button>

          {/* Main Content */}
          <div className="w-full max-w-5xl max-h-[85vh] flex flex-col items-center justify-center px-12 relative animate-fadeUp">
            <OptimizedMedia
              src={slides[selectedIndex].url}
              alt={slides[selectedIndex].caption || 'Galería Lightbox'}
              className="max-w-full max-h-[75vh] object-contain rounded-lg shadow-2xl"
            />
            
            {slides[selectedIndex].caption && (
              <div className="mt-6 bg-slate-900/80 backdrop-blur-md border border-white/10 px-6 py-3 rounded-2xl text-center max-w-2xl">
                <p className="text-white text-base md:text-lg font-serif">
                  {slides[selectedIndex].caption}
                </p>
              </div>
            )}
            
            {/* Image Counter */}
            <div className="absolute -bottom-10 text-slate-400 font-mono text-xs font-bold tracking-widest">
              {selectedIndex + 1} / {slides.length}
            </div>
          </div>

          {/* Next Button */}
          <button 
            onClick={(e) => { e.stopPropagation(); handleNext(); }}
            className="absolute right-4 p-3 bg-white/5 hover:bg-white/20 text-white rounded-full backdrop-blur-md transition-all z-50 cursor-pointer hover:scale-110"
          >
            <ChevronRight size={32} />
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

