import { create } from 'zustand';
import { supabase } from '../config/supabase';

interface PluginItem {
  id: string;
  name: string;
  type: 'activity' | 'block' | 'theme' | 'filter';
  status: 'active' | 'inactive';
  settings: Record<string, any>;
  version: string;
}

interface PluginState {
  plugins: PluginItem[];
  isLoading: boolean;
  fetchPlugins: () => Promise<void>;
  isPluginActive: (name: string) => boolean;
  cleanContent: (text: string) => string;
}

const DEFAULT_OFFENSIVE_WORDS = [
  // English
  'fuck', 'shit', 'bitch', 'asshole', 'cunt', 'dick', 'bastard', 'crap', 'piss', 'motherfucker', 'cocksucker',
  // Spanish
  'mierda', 'puta', 'puto', 'pendejo', 'pendeja', 'culero', 'culera', 'maricon', 'maricón', 
  'joder', 'verga', 'carajo', 'cabron', 'cabrón', 'hijo de puta', 'malparido', 'gonorrea', 'hijueputa', 'coño'
];

export const usePluginStore = create<PluginState>((set, get) => ({
  plugins: [],
  isLoading: false,

  fetchPlugins: async () => {
    set({ isLoading: true });
    try {
      const { data, error } = await supabase
        .from('system_plugins')
        .select('*');

      if (error) throw error;
      set({ plugins: data || [], isLoading: false });
    } catch (err) {
      console.error('Error fetching plugins:', err);
      set({ isLoading: false });
    }
  },

  isPluginActive: (name: string) => {
    const plugin = get().plugins.find(p => p.name === name);
    return plugin ? plugin.status === 'active' : false;
  },

  cleanContent: (text: string) => {
    if (!text) return text;

    // Check if "Filtro de Contenido Ofensivo" is active
    const filterPlugin = get().plugins.find(p => p.name === 'Filtro de Contenido Ofensivo');
    const isActive = filterPlugin ? filterPlugin.status === 'active' : false;

    if (!isActive) return text;

    const settings = filterPlugin?.settings || {};
    const customWords = Array.isArray(settings.words) ? settings.words : [];
    const customReplacement = typeof settings.replacement === 'string' ? settings.replacement : '*';

    // Combine default words with custom ones from settings
    const allWords = Array.from(new Set([
      ...DEFAULT_OFFENSIVE_WORDS,
      ...customWords.map((w: string) => w.trim().toLowerCase())
    ])).filter(Boolean);

    let censoredText = text;

    for (const word of allWords) {
      try {
        const escapedWord = word.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
        // Word boundary regex safe for Spanish accents
        const regex = new RegExp(`(?<=^|[^a-záéíóúüñA-ZÁÉÍÓÚÜÑ])${escapedWord}(?=$|[^a-záéíóúüñA-ZÁÉÍÓÚÜÑ])`, 'gi');
        
        censoredText = censoredText.replace(regex, (match) => {
          if (customReplacement === '*') {
            return '*'.repeat(match.length);
          }
          return customReplacement;
        });
      } catch (e) {
        console.error('Error processing word filter:', word, e);
      }
    }

    return censoredText;
  }
}));
