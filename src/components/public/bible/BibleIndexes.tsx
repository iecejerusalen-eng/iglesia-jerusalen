import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Book, Users, Map, X, Search, ChevronRight } from 'lucide-react';
import { booksData, charactersData, locationsData } from '../../../config/bibleIndexesData';

type TabType = 'books' | 'characters' | 'locations';

interface BibleIndexesProps {
  onClose: () => void;
  onNavigateToBible: (bookId: string, chapter: number) => void;
}

export default function BibleIndexes({ onClose, onNavigateToBible }: BibleIndexesProps) {
  const [activeTab, setActiveTab] = useState<TabType>('books');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItem, setSelectedItem] = useState<any | null>(null);

  const getActiveData = () => {
    switch (activeTab) {
      case 'books': return booksData;
      case 'characters': return charactersData;
      case 'locations': return locationsData;
      default: return [];
    }
  };

  const filteredData = getActiveData().filter(item => 
    item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-xl p-4 sm:p-6"
    >
      <div className="bg-white/10 dark:bg-black/40 border border-white/20 dark:border-white/10 rounded-3xl w-full max-w-6xl h-[90vh] flex flex-col overflow-hidden shadow-2xl relative">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div>
            <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-amber-400 to-amber-200">
              Enciclopedia Bíblica
            </h2>
            <p className="text-white/60 text-sm mt-1">Explora contextos, personajes y lugares</p>
          </div>
          <button 
            onClick={onClose}
            className="p-3 bg-white/5 hover:bg-white/10 rounded-full transition-colors text-white"
          >
            <X size={24} />
          </button>
        </div>

        {/* Navigation & Search */}
        <div className="px-6 py-4 flex flex-col sm:flex-row gap-4 justify-between items-center bg-black/20">
          <div className="flex bg-white/5 rounded-full p-1 backdrop-blur-md">
            <TabButton 
              active={activeTab === 'books'} 
              onClick={() => { setActiveTab('books'); setSelectedItem(null); }}
              icon={<Book size={18} />}
              label="Libros"
            />
            <TabButton 
              active={activeTab === 'characters'} 
              onClick={() => { setActiveTab('characters'); setSelectedItem(null); }}
              icon={<Users size={18} />}
              label="Personajes"
            />
            <TabButton 
              active={activeTab === 'locations'} 
              onClick={() => { setActiveTab('locations'); setSelectedItem(null); }}
              icon={<Map size={18} />}
              label="Lugares"
            />
          </div>

          <div className="relative w-full sm:w-72">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
            <input 
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar..."
              className="w-full bg-white/5 border border-white/10 rounded-full py-2.5 pl-11 pr-4 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
            />
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden flex relative">
          <div className="flex-1 overflow-y-auto p-6 custom-scrollbar grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 h-full">
            <AnimatePresence mode="popLayout">
              {filteredData.length === 0 ? (
                <div className="col-span-full flex flex-col items-center justify-center h-64 text-white/40">
                  <Book size={48} className="mb-4 opacity-50" />
                  <p>No se encontraron resultados (Datos en carga...)</p>
                </div>
              ) : (
                filteredData.map((item, idx) => (
                  <motion.div
                    key={item.id || idx}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    onClick={() => setSelectedItem(item)}
                    className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden cursor-pointer hover:bg-white/10 hover:border-amber-500/30 transition-all group"
                  >
                    {item.imageUrl && (
                      <div className="h-48 overflow-hidden relative">
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent z-10" />
                        <img 
                          src={item.imageUrl} 
                          alt={item.name} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <h3 className="absolute bottom-4 left-4 z-20 text-xl font-bold text-white">{item.name}</h3>
                      </div>
                    )}
                    {!item.imageUrl && (
                      <div className="p-6 pb-2">
                         <h3 className="text-xl font-bold text-white">{item.name}</h3>
                      </div>
                    )}
                    <div className="p-4 pt-2">
                      <p className="text-white/60 text-sm line-clamp-3 mb-4">{item.description}</p>
                      <div className="flex items-center text-amber-400 text-sm font-medium">
                        Leer más <ChevronRight size={16} className="ml-1" />
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>

          {/* Detail Panel */}
          <AnimatePresence>
            {selectedItem && (
              <motion.div 
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="absolute inset-y-0 right-0 w-full md:w-1/2 lg:w-1/3 bg-slate-900/95 backdrop-blur-3xl border-l border-white/10 flex flex-col z-20 shadow-2xl"
              >
                <div className="p-4 border-b border-white/10 flex justify-between items-center bg-black/20">
                  <h3 className="text-lg font-bold text-white">{selectedItem.name}</h3>
                  <button onClick={() => setSelectedItem(null)} className="p-2 text-white/60 hover:text-white bg-white/5 rounded-full">
                    <X size={20} />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar space-y-6 text-white/80 text-sm">
                  {selectedItem.imageUrl && (
                    <img src={selectedItem.imageUrl} alt={selectedItem.name} className="w-full h-48 object-cover rounded-xl shadow-lg border border-white/5" />
                  )}
                  
                  <div className="prose prose-invert prose-sm max-w-none">
                    <p className="text-lg text-white font-medium leading-relaxed">{selectedItem.description}</p>
                    
                    {/* Render specific fields dynamically based on the object structure */}
                    {Object.entries(selectedItem).map(([key, value]) => {
                      if (['id', 'name', 'description', 'imageUrl', 'bookId'].includes(key)) return null;
                      if (!value) return null;
                      
                      const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                      
                      return (
                        <div key={key} className="mt-4">
                          <h4 className="text-amber-400 font-bold mb-1">{label}</h4>
                          <p>{value as string}</p>
                        </div>
                      );
                    })}
                  </div>

                  {selectedItem.bookId && (
                     <button
                       onClick={() => {
                         onNavigateToBible(selectedItem.bookId, 1);
                         onClose();
                       }}
                       className="w-full mt-6 py-3 bg-amber-500 hover:bg-amber-600 text-black font-bold rounded-xl transition-colors flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20"
                     >
                       <Book size={18} /> Leer Libro
                     </button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

function TabButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-6 py-2.5 rounded-full font-medium transition-all duration-300 ${
        active 
          ? 'bg-white text-black shadow-lg shadow-white/20' 
          : 'text-white/60 hover:text-white hover:bg-white/10'
      }`}
    >
      {icon} {label}
    </button>
  );
}
