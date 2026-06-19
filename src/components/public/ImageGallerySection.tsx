import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Play, Pause } from 'lucide-react';
import OptimizedMedia from '../common/OptimizedMedia';

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
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);

  useEffect(() => {
    if (!isPlaying || !slides || slides.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [isPlaying, slides]);

  if (!slides || slides.length === 0) return null;

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % slides.length);
  };

  return (
    <section className="max-w-7xl mx-auto px-4 md:px-8 space-y-8 animate-fadeIn">
      <div className="text-center max-w-2xl mx-auto space-y-3">
        {title && <h2 className="text-3xl md:text-4xl font-serif font-bold text-primary">{title}</h2>}
        {subtitle && <p className="text-gray-500 text-sm md:text-base leading-relaxed">{subtitle}</p>}
      </div>

      <div className="relative w-full h-[50vh] md:h-[65vh] rounded-3xl overflow-hidden shadow-lg border border-gray-100 group bg-slate-950">
        {/* Slides */}
        <div className="absolute inset-0 w-full h-full">
          <AnimatePresence mode="popLayout">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, scale: 1.05 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8 }}
              className="absolute inset-0 w-full h-full"
            >
              <OptimizedMedia
                src={slides[currentIndex].url}
                alt={slides[currentIndex].caption || "Galería"}
                className="w-full h-full object-cover select-none"
              />
              {/* Overlay gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent"></div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Caption */}
        {slides[currentIndex].caption && (
          <div className="absolute bottom-6 left-6 right-6 md:bottom-10 md:left-10 md:right-10 z-10 text-left max-w-xl">
            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-white text-base md:text-xl font-serif font-bold drop-shadow-md"
            >
              {slides[currentIndex].caption}
            </motion.p>
          </div>
        )}

        {/* Navigation Arrows */}
        {slides.length > 1 && (
          <>
            <button
              onClick={handlePrev}
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white p-3 rounded-full backdrop-blur-xs transition-all opacity-0 group-hover:opacity-100 border border-white/15 z-10 cursor-pointer"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={handleNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white p-3 rounded-full backdrop-blur-xs transition-all opacity-0 group-hover:opacity-100 border border-white/15 z-10 cursor-pointer"
            >
              <ChevronRight size={20} />
            </button>
          </>
        )}

        {/* Controls Overlay */}
        <div className="absolute bottom-6 right-6 md:bottom-10 md:right-10 z-10 flex items-center gap-3">
          {slides.length > 1 && (
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="bg-white/10 hover:bg-white/20 text-white p-2 rounded-xl backdrop-blur-xs border border-white/15 transition-all cursor-pointer"
              title={isPlaying ? "Pausar carrusel" : "Reproducir carrusel"}
            >
              {isPlaying ? <Pause size={14} /> : <Play size={14} className="fill-current" />}
            </button>
          )}

          {/* Dots Indicator */}
          {slides.length > 1 && (
            <div className="flex gap-1.5 p-2 bg-black/35 rounded-full backdrop-blur-xs border border-white/5">
              {slides.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentIndex(idx)}
                  className={`h-1.5 rounded-full transition-all cursor-pointer ${
                    currentIndex === idx ? 'w-5 bg-gold shadow-xs' : 'w-1.5 bg-white/40 hover:bg-white/60'
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
