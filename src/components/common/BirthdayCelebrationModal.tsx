import { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { supabase } from '../../config/supabase';
import { useWindowSize } from 'react-use';
import Confetti from 'react-confetti';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Gift, Heart, X } from 'lucide-react';

const VERSES = [
  {
    text: "Jehová te bendiga, y te guarde; Jehová haga resplandecer su rostro sobre ti, y tenga de ti misericordia; Jehová alce sobre ti su rostro, y ponga en ti paz.",
    reference: "Números 6:24-26"
  },
  {
    text: "Porque yo sé los pensamientos que tengo acerca de vosotros, dice Jehová, pensamientos de paz, y no de mal, para daros el fin que esperáis.",
    reference: "Jeremías 29:11"
  },
  {
    text: "Te dé conforme a tu corazón, y cumpla todo tu consejo.",
    reference: "Salmo 20:4"
  },
  {
    text: "Deléitate asimismo en Jehová, y él te concederá las peticiones de tu corazón.",
    reference: "Salmo 37:4"
  }
];

export default function BirthdayCelebrationModal() {
  const { user, memberId, firstName, lastName } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);
  const [verse, setVerse] = useState(VERSES[0]);
  const { width, height } = useWindowSize();
  const [isConfettiActive, setIsConfettiActive] = useState(false);

  useEffect(() => {
    if (!user || !memberId) return;

    const checkBirthday = async () => {
      try {
        const today = new Date();
        const currentMonth = today.getMonth() + 1; // 1-indexed
        const currentDay = today.getDate();
        const currentYear = today.getFullYear();
        
        const storageKey = `birthday_celebration_${user.id}_${currentYear}`;
        const alreadyCelebrated = localStorage.getItem(storageKey);

        if (alreadyCelebrated === 'true') return;

        // Query member birth date
        const { data, error } = await supabase
          .from('members')
          .select('birth_date')
          .eq('id', memberId)
          .single();

        if (error || !data || !data.birth_date) return;

        const [, bMonth, bDay] = data.birth_date.split('-').map(Number);

        if (bMonth === currentMonth && bDay === currentDay) {
          // Select a random verse
          const randomIndex = Math.floor(Math.random() * VERSES.length);
          setVerse(VERSES[randomIndex]);
          
          // Trigger birthday modal and confetti
          setIsOpen(true);
          setIsConfettiActive(true);
          
          // Auto-disable confetti recycling after 12 seconds
          setTimeout(() => {
            setIsConfettiActive(false);
          }, 12000);
        }
      } catch (err) {
        console.error('Error checking birthday celebration:', err);
      }
    };

    checkBirthday();
  }, [user, memberId]);

  const handleDismiss = () => {
    setIsOpen(false);
    setIsConfettiActive(false);
    if (user) {
      const currentYear = new Date().getFullYear();
      localStorage.setItem(`birthday_celebration_${user.id}_${currentYear}`, 'true');
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
        {/* Backdrop overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleDismiss}
          className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
        />

        {/* Confetti Layer */}
        {isConfettiActive && (
          <div className="absolute inset-0 pointer-events-none z-[310]">
            <Confetti
              width={width}
              height={height}
              numberOfPieces={300}
              recycle={true}
              gravity={0.1}
            />
          </div>
        )}

        {/* Modal Card Content */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: "spring", duration: 0.5 }}
          className="bg-gradient-to-b from-slate-900 to-indigo-950 border border-gold/40 text-white rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl relative z-[320] overflow-hidden"
        >
          {/* Gold Glowing Borders/Accents */}
          <div className="absolute -top-12 -left-12 w-24 h-24 bg-gold/10 rounded-full blur-xl" />
          <div className="absolute -bottom-12 -right-12 w-24 h-24 bg-primary/20 rounded-full blur-xl" />

          {/* Close button */}
          <button
            onClick={handleDismiss}
            className="absolute top-4 right-4 text-gray-400 hover:text-white transition p-1.5 rounded-full hover:bg-white/5 cursor-pointer"
          >
            <X size={18} />
          </button>

          {/* Content */}
          <div className="text-center space-y-6">
            <div className="flex justify-center">
              <motion.div
                animate={{ rotate: [0, -10, 10, -10, 10, 0], scale: [1, 1.1, 1.1, 1] }}
                transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 2 }}
                className="inline-flex p-4 bg-gold/15 text-gold rounded-full border border-gold/30 shadow-lg shadow-gold/5"
              >
                <Gift size={40} />
              </motion.div>
            </div>

            <div className="space-y-2">
              <span className="text-xxs font-extrabold tracking-widest text-gold uppercase flex items-center justify-center gap-1.5">
                <Sparkles size={10} className="animate-spin" /> ¡FELIZ CUMPLEAÑOS! <Sparkles size={10} className="animate-spin" />
              </span>
              <h2 className="text-2xl md:text-3xl font-serif font-bold text-transparent bg-clip-text bg-gradient-to-r from-gold via-yellow-200 to-gold tracking-tight">
                {firstName || user?.email?.split('@')[0]} {lastName || ''}
              </h2>
              <p className="text-xs text-indigo-200 font-medium">
                Hoy la Iglesia Jerusalén celebra tu vida y agradece a Dios por ti.
              </p>
            </div>

            {/* Scripture Verse Box */}
            <div className="p-5 bg-slate-950/40 border border-gold/20 rounded-2xl relative shadow-inner">
              <div className="absolute -top-3 left-4 px-2 py-0.5 bg-indigo-950 border border-gold/20 text-[9px] font-extrabold text-gold tracking-wider rounded-md uppercase">
                Promesa de Dios
              </div>
              <blockquote className="text-sm md:text-base italic font-serif text-slate-100 leading-relaxed pt-1.5">
                "{verse.text}"
              </blockquote>
              <cite className="block text-xxs font-extrabold text-gold uppercase tracking-wider mt-2.5 not-italic">
                — {verse.reference}
              </cite>
            </div>

            <div className="text-xxs text-gray-400 leading-relaxed px-2 font-medium">
              Oramos para que este nuevo año de vida esté lleno del favor divino, sabiduría, salud, paz y que veas cumplidos los propósitos eternos que el Señor ha trazado para ti.
            </div>

            {/* Action button */}
            <button
              onClick={handleDismiss}
              className="w-full bg-gradient-to-r from-gold to-yellow-500 hover:from-yellow-500 hover:to-gold text-slate-950 font-bold py-3 px-6 rounded-2xl text-xs uppercase tracking-wider transition-all duration-350 shadow-md shadow-gold/10 hover:shadow-lg hover:shadow-gold/20 transform hover:-translate-y-0.5 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Heart size={14} className="fill-current" />
              <span>Amén, ¡Muchas Gracias! 🎉</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
