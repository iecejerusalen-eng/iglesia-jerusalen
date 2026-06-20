import { useState } from 'react';
import OptimizedMedia from '../common/OptimizedMedia';
import { AnimeFadeUp } from '../animations/AnimeWrappers';

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

  if (!slides || slides.length === 0) return null;

  // Curate sizes/heights to simulate different masonry columns
  const getMasonryHeightClass = (index: number) => {
    const heights = ['h-64', 'h-80', 'h-96', 'h-72', 'h-80', 'h-96'];
    return heights[index % heights.length];
  };

  return (
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
  );
};
