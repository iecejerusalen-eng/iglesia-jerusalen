import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Book, Users, Map, X, Search, ChevronRight, Info } from 'lucide-react';
import { bibleBooks, bibleCharacters, biblePlaces } from '../../../config/bibleIndexesData';
import type { BibleCharacter, BiblePlace, BibleBookInfo } from '../../../config/bibleIndexesData';

type TabType = 'books' | 'characters' | 'locations';
type BibleIndexItem = Partial<BibleCharacter> & Partial<BiblePlace> & Partial<BibleBookInfo> & { id: string, name: string, description?: string };

interface BibleIndexesProps {
  onClose: () => void;
  onNavigateToBible: (bookId: string, chapter: number) => void;
}

export default function BibleIndexes({ onClose, onNavigateToBible }: BibleIndexesProps) {
  const [activeTab, setActiveTab] = useState<TabType>('books');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItem, setSelectedItem] = useState<BibleIndexItem | null>(null);

  const getActiveData = (): BibleIndexItem[] => {
    switch (activeTab) {
      case 'books': return bibleBooks;
      case 'characters': return bibleCharacters;
      case 'locations': return biblePlaces;
      default: return [];
    }
  };

  const getBookColor = (group: string) => {
    const colors: Record<string, string> = {
      'Pentateuco': 'from-blue-500/40 to-blue-900/40 border-blue-500/30',
      'Históricos': 'from-emerald-500/40 to-emerald-900/40 border-emerald-500/30',
      'Poéticos': 'from-purple-500/40 to-purple-900/40 border-purple-500/30',
      'Profetas Mayores': 'from-red-500/40 to-red-900/40 border-red-500/30',
      'Profetas Menores': 'from-orange-500/40 to-orange-900/40 border-orange-500/30',
      'Evangelios': 'from-amber-500/40 to-amber-900/40 border-amber-500/30',
      'Historia': 'from-teal-500/40 to-teal-900/40 border-teal-500/30',
      'Cartas Paulinas': 'from-indigo-500/40 to-indigo-900/40 border-indigo-500/30',
      'Cartas Generales': 'from-pink-500/40 to-pink-900/40 border-pink-500/30',
      'Profético': 'from-rose-500/40 to-rose-900/40 border-rose-500/30',
    };
    return colors[group] || 'from-gray-500/40 to-gray-900/40 border-gray-500/30';
  };

  const filteredData = getActiveData().filter((item: BibleIndexItem) => {
    const context = 'historicalContext' in item ? item.historicalContext : 'significance' in item ? item.significance : '';
    const searchTarget = (item.name + ' ' + context).toLowerCase();
    return searchTarget.includes(searchTerm.toLowerCase());
  });

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6"
    >
      {/* Immersive Background Blur */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-2xl" onClick={onClose} />

      <div className="bg-white/5 border border-white/10 rounded-3xl w-full max-w-6xl h-[90vh] flex flex-col overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] relative z-10 backdrop-blur-3xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10 bg-gradient-to-b from-white/10 to-transparent">
          <div>
            <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-amber-200 to-amber-500 drop-shadow-sm">
              Enciclopedia Bíblica
            </h2>
            <p className="text-white/60 text-sm mt-1">Explora contextos, personajes y lugares</p>
          </div>
          <button 
            onClick={onClose}
            className="p-3 bg-white/5 hover:bg-white/20 rounded-full transition-all text-white/70 hover:text-white"
          >
            <X size={24} />
          </button>
        </div>

        {/* Navigation & Search */}
        <div className="px-6 py-4 flex flex-col sm:flex-row gap-4 justify-between items-center bg-black/20 border-b border-white/5">
          <div className="flex bg-black/40 rounded-full p-1 border border-white/10">
            <TabButton 
              active={activeTab === 'books'} 
              onClick={() => { setActiveTab('books'); setSelectedItem(null); setSearchTerm(''); }}
              icon={<Book size={18} />}
              label="Libros"
            />
            <TabButton 
              active={activeTab === 'characters'} 
              onClick={() => { setActiveTab('characters'); setSelectedItem(null); setSearchTerm(''); }}
              icon={<Users size={18} />}
              label="Personajes"
            />
            <TabButton 
              active={activeTab === 'locations'} 
              onClick={() => { setActiveTab('locations'); setSelectedItem(null); setSearchTerm(''); }}
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
              className="w-full bg-black/40 border border-white/10 rounded-full py-2.5 pl-11 pr-4 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all"
            />
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden flex relative">
          <div className="flex-1 overflow-y-auto p-6 custom-scrollbar grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 content-start h-full pb-24">
            <AnimatePresence mode="popLayout">
              {filteredData.length === 0 ? (
                <motion.div 
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="col-span-full flex flex-col items-center justify-center h-64 text-white/40"
                >
                  <Search size={48} className="mb-4 opacity-50" />
                  <p className="text-xl">No se encontraron resultados para "{searchTerm}"</p>
                </motion.div>
              ) : (
                filteredData.map((item: BibleIndexItem) => (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    onClick={() => setSelectedItem(item)}
                    className={`group relative overflow-hidden rounded-2xl cursor-pointer transition-all duration-500 hover:scale-[1.03] hover:-translate-y-2 hover:shadow-[0_20px_40px_-15px_rgba(245,158,11,0.2)] flex flex-col ${
                      activeTab === 'books' 
                        ? `bg-gradient-to-br ${getBookColor(item.group || '')} border shadow-lg` 
                        : 'bg-black/40 border border-white/10 hover:border-amber-500/30 hover:bg-black/60 shadow-xl'
                    }`}
                    style={activeTab === 'books' ? {
                      boxShadow: 'inset 4px 0 10px rgba(255,255,255,0.1), inset -1px 0 5px rgba(0,0,0,0.5), 0 10px 20px rgba(0,0,0,0.4)',
                    } : {}}
                  >
                    {/* Glass highlight */}
                    <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none" />
                    
                    {/* Book spine line */}
                    {activeTab === 'books' && (
                      <div className="absolute left-0 top-0 bottom-0 w-6 bg-gradient-to-r from-black/60 via-black/20 to-transparent border-r border-white/10 pointer-events-none z-10" />
                    )}

                    {item.imageUrl ? (
                      <div className="h-56 overflow-hidden relative">
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent z-10" />
                        <img 
                          src={item.imageUrl} 
                          alt={item.name} 
                          className="w-full h-full object-cover group-hover:scale-110 group-hover:rotate-1 transition-transform duration-700 ease-out"
                        />
                        <div className="absolute bottom-4 left-4 right-4 z-20">
                          <h3 className="text-2xl font-black text-white drop-shadow-md leading-tight">{item.name}</h3>
                          <p className="text-amber-400/90 text-xs font-bold uppercase tracking-widest mt-1 truncate">
                            {item.meaning || item.location}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className={`p-6 pb-4 relative z-20 ${activeTab === 'books' ? 'pl-10' : ''}`}>
                         {activeTab === 'books' && (
                           <div className="absolute top-4 right-4 bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10 text-[10px] uppercase font-bold tracking-widest text-white/80 shadow-sm">
                             {item.testament === 'Antiguo Testamento' ? 'AT' : 'NT'}
                           </div>
                         )}
                         <h3 className="text-3xl font-black text-white mb-2 leading-none">{item.name}</h3>
                         {activeTab === 'books' && (
                           <p className="text-white/70 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                             <span className="w-2 h-2 rounded-full bg-white/40"></span> {item.group}
                           </p>
                         )}
                      </div>
                    )}
                    
                    <div className={`p-5 pt-4 relative z-20 flex-1 flex flex-col justify-between bg-gradient-to-b from-transparent to-black/60 ${activeTab === 'books' ? 'pl-10' : ''}`}>
                      <p className="text-white/70 text-sm line-clamp-3 mb-6 leading-relaxed">
                        {item.historicalContext || item.significance || item.description}
                      </p>
                      <div className="flex items-center text-amber-400 text-sm font-bold uppercase tracking-wider opacity-70 group-hover:opacity-100 transition-opacity mt-auto">
                        Explorar <ChevronRight size={16} className="ml-1 group-hover:translate-x-1.5 transition-transform" />
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
              <>
                {/* Backdrop for mobile */}
                <motion.div 
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-black/60 z-20 md:hidden"
                  onClick={() => setSelectedItem(null)}
                />
                <motion.div 
                  initial={{ x: '100%', opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: '100%', opacity: 0 }}
                  transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                  className="absolute inset-y-0 right-0 w-full md:w-[450px] lg:w-[500px] bg-black/80 backdrop-blur-3xl border-l border-white/10 flex flex-col z-30 shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden"
                >
                  {/* Blurred Header Background Image */}
                  {selectedItem.imageUrl && (
                    <div className="absolute top-0 left-0 right-0 h-64 overflow-hidden -z-10 opacity-30">
                      <img src={selectedItem.imageUrl} className="w-full h-full object-cover blur-3xl scale-125" alt="" />
                      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black" />
                    </div>
                  )}

                  <div className="p-4 flex justify-between items-center absolute top-0 left-0 right-0 z-40 bg-gradient-to-b from-black/80 to-transparent">
                    <button onClick={() => setSelectedItem(null)} className="p-2 text-white/60 hover:text-white bg-black/50 backdrop-blur-md rounded-full border border-white/10 ml-auto">
                      <X size={20} />
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto custom-scrollbar relative z-20">
                    {selectedItem.imageUrl && (
                      <div className="h-72 w-full relative">
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent z-10" />
                        <img src={selectedItem.imageUrl} alt={selectedItem.name} className="w-full h-full object-cover" />
                        <div className="absolute bottom-6 left-6 z-20">
                           <h2 className="text-4xl font-black text-white drop-shadow-lg">{selectedItem.name}</h2>
                           <p className="text-amber-400 font-medium text-sm mt-1">{selectedItem.meaning || selectedItem.location}</p>
                        </div>
                      </div>
                    )}

                    <div className={`p-8 ${!selectedItem.imageUrl ? 'pt-16' : 'pt-2'} space-y-8`}>
                      {!selectedItem.imageUrl && (
                        <div>
                          <h2 className="text-4xl font-black text-white">{selectedItem.name}</h2>
                          {(selectedItem.group || selectedItem.author) && (
                            <p className="text-amber-400 font-medium mt-2">
                              {selectedItem.group} • {selectedItem.testament === 'Antiguo Testamento' ? 'AT' : 'NT'} • Por {selectedItem.author}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Main Description / Historical Context */}
                      <div className="bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-sm">
                        <div className="flex items-center gap-2 text-amber-500 mb-2">
                          <Info size={18} />
                          <h4 className="font-bold text-sm uppercase tracking-wider">Contexto Histórico</h4>
                        </div>
                        <p className="text-white/80 leading-relaxed text-sm">
                          {selectedItem.historicalContext || selectedItem.significance || selectedItem.description}
                        </p>
                      </div>

                      {/* Dynamic Fields */}
                      <div className="space-y-6">
                        {Object.entries(selectedItem).map(([key, value]) => {
                          if (['id', 'name', 'description', 'imageUrl', 'historicalContext', 'significance', 'meaning', 'location', 'testament', 'group', 'author'].includes(key)) return null;
                          if (!value || (Array.isArray(value) && value.length === 0)) return null;
                          
                          const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                          
                          return (
                            <div key={key}>
                              <h4 className="text-white/50 text-xs font-bold uppercase tracking-widest mb-3">{label}</h4>
                              {Array.isArray(value) ? (
                                <ul className="space-y-2">
                                  {value.map((v, i) => (
                                    <li key={i} className="flex gap-3 text-sm text-white/80 items-start">
                                      <span className="text-amber-500/50 mt-0.5">•</span> {v}
                                    </li>
                                  ))}
                                </ul>
                              ) : (
                                <p className="text-sm text-white/80">{value as string}</p>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {activeTab === 'books' && (
                         <button
                           onClick={() => {
                             onNavigateToBible(selectedItem.id, 1);
                             onClose();
                           }}
                           className="w-full mt-8 py-4 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-black font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(245,158,11,0.3)] hover:shadow-[0_0_30px_rgba(245,158,11,0.5)] hover:scale-[1.02] flex items-center justify-center gap-2"
                         >
                           <Book size={18} /> Leer {selectedItem.name}
                         </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              </>
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
          ? 'bg-gradient-to-r from-white to-white/90 text-black shadow-lg shadow-white/10' 
          : 'text-white/60 hover:text-white hover:bg-white/10'
      }`}
    >
      {icon} {label}
    </button>
  );
}

