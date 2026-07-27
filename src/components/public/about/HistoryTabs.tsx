import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import InternationalHistory from './InternationalHistory';
import NationalHistory from './NationalHistory';
import { Globe, MapPin } from 'lucide-react';

const HistoryTabs = () => {
  const [activeTab, setActiveTab] = useState<'international' | 'national'>('international');

  return (
    <section className="py-20 relative">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        
        {/* Tabs Navigation */}
        <div className="flex justify-center mb-12">
          <div className="inline-flex bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl shadow-sm border border-slate-200 dark:border-white/10 relative">
            
            <button
              onClick={() => setActiveTab('international')}
              className={`relative px-6 md:px-10 py-3 rounded-xl font-semibold text-sm md:text-base transition-colors z-10 flex items-center gap-2 ${
                activeTab === 'international' ? 'text-white' : 'text-slate-600 dark:text-slate-400 hover:text-primary dark:hover:text-white'
              }`}
            >
              <Globe size={18} />
              Historia Internacional
              {activeTab === 'international' && (
                <motion.div
                  layoutId="activeTabBackground"
                  className="absolute inset-0 bg-primary rounded-xl -z-10 shadow-lg shadow-primary/30"
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                />
              )}
            </button>

            <button
              onClick={() => setActiveTab('national')}
              className={`relative px-6 md:px-10 py-3 rounded-xl font-semibold text-sm md:text-base transition-colors z-10 flex items-center gap-2 ${
                activeTab === 'national' ? 'text-white' : 'text-slate-600 dark:text-slate-400 hover:text-primary dark:hover:text-white'
              }`}
            >
              <MapPin size={18} />
              Historia en Ecuador
              {activeTab === 'national' && (
                <motion.div
                  layoutId="activeTabBackground"
                  className="absolute inset-0 bg-primary rounded-xl -z-10 shadow-lg shadow-primary/30"
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                />
              )}
            </button>
            
          </div>
        </div>

        {/* Tab Content */}
        <div className="relative min-h-[600px]">
          <AnimatePresence mode="wait">
            {activeTab === 'international' ? (
              <motion.div
                key="international"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
              >
                <InternationalHistory />
              </motion.div>
            ) : (
              <motion.div
                key="national"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
              >
                <NationalHistory />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>
    </section>
  );
};

export default HistoryTabs;
 
