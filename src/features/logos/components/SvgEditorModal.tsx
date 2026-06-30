import { useState, useEffect } from 'react';
import DOMPurify from 'dompurify';
import { Palette, X, Loader2, Download, Save, RefreshCw, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../../../config/supabase';
import type { LogoData } from '../types';
import { uploadFileToCloudinary, getStorageUrl } from '../../../lib/cloudinaryService';
import { useQueryClient } from '@tanstack/react-query';

interface SvgEditorModalProps {
  editingLogo: LogoData;
  onClose: () => void;
}

export default function SvgEditorModal({ editingLogo, onClose }: SvgEditorModalProps) {
  const queryClient = useQueryClient();
  const [svgSource, setSvgSource] = useState<string>('');
  const [modifiedSvg, setModifiedSvg] = useState<string>('');
  const [detectedColors, setDetectedColors] = useState<string[]>([]);
  const [colorReplacements, setColorReplacements] = useState<Record<string, string>>({});
  const [fetchingSvg, setFetchingSvg] = useState(false);
  const [savingChanges, setSavingChanges] = useState(false);
  
  const [editorTab, setEditorTab] = useState<'solid' | 'gradient'>('solid');
  const [solidPreset, setSolidPreset] = useState<'custom' | 'white' | 'black'>('custom');
  
  const [gradStartColor, setGradStartColor] = useState('#1E3A8A');
  const [gradEndColor, setGradEndColor] = useState('#EC4899');
  const [gradAngle, setGradAngle] = useState('45');

  const getPublicUrl = (logoPath: string) => {
    return getStorageUrl(logoPath, 'logos');
  };

  useEffect(() => {
    const loadSvgForEditing = async () => {
      setFetchingSvg(true);
      try {
        const publicUrl = getPublicUrl(editingLogo.storage_path);
        const response = await fetch(publicUrl);
        if (!response.ok) throw new Error('No se pudo descargar el archivo SVG');
        const text = await response.text();
        setSvgSource(text);
        setModifiedSvg(text);
        
        const parser = new DOMParser();
        const doc = parser.parseFromString(text, 'image/svg+xml');
        const colors = new Set<string>();
        const elements = doc.querySelectorAll('*');
        
        const cleanColor = (colorStr: string | null) => {
          if (!colorStr) return null;
          const trimmed = colorStr.trim().toLowerCase();
          if (trimmed === 'none' || trimmed === 'transparent' || trimmed.startsWith('url(')) return null;
          return trimmed;
        };

        elements.forEach((el) => {
          const fill = cleanColor(el.getAttribute('fill'));
          const stroke = cleanColor(el.getAttribute('stroke'));
          const stopColor = cleanColor(el.getAttribute('stop-color'));
          if (fill) colors.add(fill);
          if (stroke) colors.add(stroke);
          if (stopColor) colors.add(stopColor);
          
          const style = el.getAttribute('style');
          if (style) {
            const fillMatch = style.match(/fill\s*:\s*([^;}\s]+)/i);
            const strokeMatch = style.match(/stroke\s*:\s*([^;}\s]+)/i);
            const stopColorMatch = style.match(/stop-color\s*:\s*([^;}\s]+)/i);
            if (fillMatch) {
              const c = cleanColor(fillMatch[1]);
              if (c) colors.add(c);
            }
            if (strokeMatch) {
              const c = cleanColor(strokeMatch[1]);
              if (c) colors.add(c);
            }
            if (stopColorMatch) {
              const c = cleanColor(stopColorMatch[1]);
              if (c) colors.add(c);
            }
          }
        });

        const styleElements = doc.querySelectorAll('style');
        styleElements.forEach((styleEl) => {
          const content = styleEl.textContent || '';
          const fillMatches = content.matchAll(/fill\s*:\s*([^;}\s]+)/gi);
          for (const match of fillMatches) {
            const c = cleanColor(match[1]);
            if (c) colors.add(c);
          }
          const strokeMatches = content.matchAll(/stroke\s*:\s*([^;}\s]+)/gi);
          for (const match of strokeMatches) {
            const c = cleanColor(match[1]);
            if (c) colors.add(c);
          }
          const stopColorMatches = content.matchAll(/stop-color\s*:\s*([^;}\s]+)/gi);
          for (const match of stopColorMatches) {
            const c = cleanColor(match[1]);
            if (c) colors.add(c);
          }
        });
        
        const rgbToHex = (rgb: string) => {
          const match = rgb.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*[\d.]+)?\)$/i);
          if (!match) return rgb;
          const r = parseInt(match[1], 10).toString(16).padStart(2, '0');
          const g = parseInt(match[2], 10).toString(16).padStart(2, '0');
          const b = parseInt(match[3], 10).toString(16).padStart(2, '0');
          return `#${r}${g}${b}`;
        };

        const detectedList = Array.from(colors);
        setDetectedColors(detectedList);
        
        const initialReplacements: Record<string, string> = {};
        detectedList.forEach((c) => {
          let normalized = c;
          if (c.startsWith('rgb')) {
            normalized = rgbToHex(c);
          } else if (c.startsWith('#')) {
            if (c.length === 4) {
              normalized = `#${c[1]}${c[1]}${c[2]}${c[2]}${c[3]}${c[3]}`;
            }
          } else if (c === 'white') {
            normalized = '#ffffff';
          } else if (c === 'black') {
            normalized = '#000000';
          }
          initialReplacements[c] = normalized;
        });
        setColorReplacements(initialReplacements);
        
      } catch (err: any) {
        console.error('Error loading SVG:', err);
        toast.error('Error al abrir el editor de SVG: ' + err.message);
        onClose();
      } finally {
        setFetchingSvg(false);
      }
    };
    loadSvgForEditing();
  }, [editingLogo, onClose]);

  useEffect(() => {
    if (!svgSource) return;
    
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(svgSource, 'image/svg+xml');
      const elements = doc.querySelectorAll('*');
      const styleElements = doc.querySelectorAll('style');
      
      if (editorTab === 'solid') {
        if (solidPreset === 'white' || solidPreset === 'black') {
          const presetColor = solidPreset === 'white' ? '#ffffff' : '#000000';
          
          elements.forEach((el) => {
            if (el.hasAttribute('fill') && el.getAttribute('fill') !== 'none' && el.getAttribute('fill') !== 'transparent') {
              el.setAttribute('fill', presetColor);
            }
            if (el.hasAttribute('stroke') && el.getAttribute('stroke') !== 'none' && el.getAttribute('stroke') !== 'transparent') {
              el.setAttribute('stroke', presetColor);
            }
            if (el.hasAttribute('stop-color') && el.getAttribute('stop-color') !== 'none' && el.getAttribute('stop-color') !== 'transparent') {
              el.setAttribute('stop-color', presetColor);
            }
            const style = el.getAttribute('style');
            if (style) {
              let newStyle = style;
              newStyle = newStyle.replace(/(fill\s*:\s*)(?!none\b|transparent\b)([^;}\s]+)/gi, `$1${presetColor}`);
              newStyle = newStyle.replace(/(stroke\s*:\s*)(?!none\b|transparent\b)([^;}\s]+)/gi, `$1${presetColor}`);
              newStyle = newStyle.replace(/(stop-color\s*:\s*)(?!none\b|transparent\b)([^;}\s]+)/gi, `$1${presetColor}`);
              el.setAttribute('style', newStyle);
            }
          });

          styleElements.forEach((styleEl) => {
            let content = styleEl.textContent || '';
            content = content.replace(/(fill\s*:\s*)(?!none\b|transparent\b)([^;}\s]+)/gi, `$1${presetColor}`);
            content = content.replace(/(stroke\s*:\s*)(?!none\b|transparent\b)([^;}\s]+)/gi, `$1${presetColor}`);
            content = content.replace(/(stop-color\s*:\s*)(?!none\b|transparent\b)([^;}\s]+)/gi, `$1${presetColor}`);
            styleEl.textContent = content;
          });
        } else {
          elements.forEach((el) => {
            const fill = el.getAttribute('fill')?.trim().toLowerCase();
            const stroke = el.getAttribute('stroke')?.trim().toLowerCase();
            const stopColor = el.getAttribute('stop-color')?.trim().toLowerCase();
            
            if (fill && colorReplacements[fill]) {
              el.setAttribute('fill', colorReplacements[fill]);
            }
            if (stroke && colorReplacements[stroke]) {
              el.setAttribute('stroke', colorReplacements[stroke]);
            }
            if (stopColor && colorReplacements[stopColor]) {
              el.setAttribute('stop-color', colorReplacements[stopColor]);
            }
            
            const style = el.getAttribute('style');
            if (style) {
              let newStyle = style;
              Object.entries(colorReplacements).forEach(([orig, repl]) => {
                const escapedOrig = orig.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
                const fillRegex = new RegExp(`(fill\\s*:\\s*)${escapedOrig}(?=[;}\\s]|$)`, 'gi');
                const strokeRegex = new RegExp(`(stroke\\s*:\\s*)${escapedOrig}(?=[;}\\s]|$)`, 'gi');
                const stopColorRegex = new RegExp(`(stop-color\\s*:\\s*)${escapedOrig}(?=[;}\\s]|$)`, 'gi');
                newStyle = newStyle.replace(fillRegex, `$1${repl}`)
                                   .replace(strokeRegex, `$1${repl}`)
                                   .replace(stopColorRegex, `$1${repl}`);
              });
              el.setAttribute('style', newStyle);
            }
          });

          styleElements.forEach((styleEl) => {
            let content = styleEl.textContent || '';
            Object.entries(colorReplacements).forEach(([orig, repl]) => {
              const escapedOrig = orig.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
              const fillRegex = new RegExp(`(fill\\s*:\\s*)${escapedOrig}(?=[;}\\s]|$)`, 'gi');
              const strokeRegex = new RegExp(`(stroke\\s*:\\s*)${escapedOrig}(?=[;}\\s]|$)`, 'gi');
              const stopColorRegex = new RegExp(`(stop-color\\s*:\\s*)${escapedOrig}(?=[;}\\s]|$)`, 'gi');
              content = content.replace(fillRegex, `$1${repl}`)
                               .replace(strokeRegex, `$1${repl}`)
                               .replace(stopColorRegex, `$1${repl}`);
            });
            styleEl.textContent = content;
          });
        }
      } else {
        const svgEl = doc.documentElement;
        let defs = svgEl.querySelector('defs');
        if (!defs) {
          defs = doc.createElementNS('http://www.w3.org/2000/svg', 'defs');
          svgEl.insertBefore(defs, svgEl.firstChild);
        }
        
        let grad = defs.querySelector('#custom-svg-editor-grad');
        if (grad) grad.remove();
        
        grad = doc.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
        grad.setAttribute('id', 'custom-svg-editor-grad');
        
        const angleRad = (parseFloat(gradAngle) * Math.PI) / 180;
        const x1 = Math.round(50 - Math.cos(angleRad) * 50) + '%';
        const y1 = Math.round(50 + Math.sin(angleRad) * 50) + '%';
        const x2 = Math.round(50 + Math.cos(angleRad) * 50) + '%';
        const y2 = Math.round(50 - Math.sin(angleRad) * 50) + '%';
        
        grad.setAttribute('x1', x1);
        grad.setAttribute('y1', y1);
        grad.setAttribute('x2', x2);
        grad.setAttribute('y2', y2);
        
        grad.innerHTML = `
          <stop offset="0%" stop-color="${gradStartColor}" />
          <stop offset="100%" stop-color="${gradEndColor}" />
        `;
        defs.appendChild(grad);
        
        elements.forEach((el) => {
          if (el.hasAttribute('fill') && el.getAttribute('fill') !== 'none' && el.getAttribute('fill') !== 'transparent') {
            el.setAttribute('fill', 'url(#custom-svg-editor-grad)');
          }
          const style = el.getAttribute('style');
          if (style) {
            let newStyle = style;
            newStyle = newStyle.replace(/(fill\s*:\s*)(?!none\b|transparent\b)([^;}\s]+)/gi, '$1url(#custom-svg-editor-grad)');
            el.setAttribute('style', newStyle);
          }
        });

        styleElements.forEach((styleEl) => {
          let content = styleEl.textContent || '';
          content = content.replace(/(fill\s*:\s*)(?!none\b|transparent\b)([^;}\s]+)/gi, '$1url(#custom-svg-editor-grad)');
          styleEl.textContent = content;
        });
      }
      
      const serialized = new XMLSerializer().serializeToString(doc);
      setModifiedSvg(serialized);
    } catch (e) {
      console.error('Error applying SVG edits:', e);
    }
  }, [svgSource, editorTab, solidPreset, colorReplacements, gradStartColor, gradEndColor, gradAngle]);

  const handleColorChange = (origColor: string, newColor: string) => {
    setColorReplacements(prev => ({
      ...prev,
      [origColor]: newColor
    }));
  };

  const handleDownloadEditedSvg = () => {
    if (!modifiedSvg) return;
    const blob = new Blob([modifiedSvg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    
    let suffix = 'editado';
    if (editorTab === 'solid') {
      if (solidPreset === 'white') suffix = 'blanco';
      else if (solidPreset === 'black') suffix = 'negro';
    } else {
      suffix = 'degradado';
    }
    
    link.download = `logo_${editingLogo.variant}_${suffix}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('Descarga de SVG modificado iniciada con éxito.');
  };

  const handleSaveEditedSvg = async (mode: 'overwrite' | 'new') => {
    if (!modifiedSvg) return;
    setSavingChanges(true);
    
    try {
      const blob = new Blob([modifiedSvg], { type: 'image/svg+xml' });
      const file = new File([blob], `logo_editado_${Date.now()}.svg`, { type: 'image/svg+xml' });
      
      if (mode === 'new') {
        let newColorMode = editingLogo.color_mode;
        if (editorTab === 'solid') {
          if (solidPreset === 'white') newColorMode = 'blanco_solido';
          else if (solidPreset === 'black') newColorMode = 'negro_solido';
        }
        
        // Subir a Cloudinary (resourceType 'image')
        const fileUrl = await uploadFileToCloudinary(file, 'logos', 'image');
        
        const { error: dbError } = await supabase
          .from('logos')
          .insert({
            ministry_id: editingLogo.ministry_id,
            variant: editingLogo.variant,
            color_mode: newColorMode,
            format: 'svg',
            storage_path: fileUrl
          });
          
        if (dbError) {
          throw dbError;
        }
        
        toast.success('Variante guardada con éxito en la base de datos.');
      } else {
        const fileUrl = await uploadFileToCloudinary(file, 'logos', 'image');
        
        const { error: dbError } = await supabase
          .from('logos')
          .update({ storage_path: fileUrl })
          .eq('id', editingLogo.id);
          
        if (dbError) throw dbError;
        toast.success('Logo original sobreescrito con éxito.');
      }
      
      queryClient.invalidateQueries({ queryKey: ['logos'] });
      onClose();
    } catch (err: any) {
      console.error('Error saving edited SVG:', err);
      toast.error('Error al guardar cambios del logo: ' + err.message);
    } finally {
      setSavingChanges(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 w-full max-w-5xl rounded-3xl border border-gray-200 dark:border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-scaleIn">
        
        <div className="p-5 border-b border-gray-150 dark:border-white/10 flex items-center justify-between bg-primary text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-lg">
              <Palette size={18} />
            </div>
            <div>
              <h3 className="font-serif font-bold text-base">
                Editor de Colores SVG Inteligente
              </h3>
              <p className="text-[10px] text-gray-300 font-mono mt-0.5">
                Modificando variante {editingLogo.variant} ({editingLogo.color_mode})
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1 hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {fetchingSvg ? (
          <div className="p-20 flex flex-col items-center justify-center gap-3 text-gray-550 dark:text-gray-400">
            <Loader2 className="animate-spin text-primary" size={36} />
            <span className="text-xs font-semibold">Descargando código del logo SVG...</span>
          </div>
        ) : (
          <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-5 min-h-0">
            
            <div className="lg:col-span-3 bg-gray-100 p-6 flex flex-col items-center justify-center min-h-[300px] border-r border-gray-150 dark:border-white/10 relative overflow-auto">
              <div className="absolute top-4 left-4 bg-black/55 text-white text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded select-none z-10">
                Vista Previa en Tiempo Real
              </div>
              
              <div 
                className="max-w-full max-h-[40vh] lg:max-h-[55vh] aspect-square rounded-2xl border border-gray-200 dark:border-white/10 shadow-inner flex items-center justify-center p-8 overflow-hidden relative"
                style={{
                  backgroundImage: 'linear-gradient(45deg, #f1f5f9 25%, transparent 25%), linear-gradient(-45deg, #f1f5f9 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #f1f5f9 75%), linear-gradient(-45deg, transparent 75%, #f1f5f9 75%)',
                  backgroundSize: '16px 16px',
                  backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0px',
                  backgroundColor: '#ffffff'
                }}
              >
                {modifiedSvg ? (
                  <div 
                    className="w-full h-full flex items-center justify-center [&>svg]:w-full [&>svg]:h-full [&>svg]:max-w-full [&>svg]:max-h-full [&>svg]:object-contain [&>svg]:block"
                    dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(modifiedSvg, { USE_PROFILES: { svg: true } }) }}
                  />
                ) : (
                  <span className="text-xs text-gray-400">Sin vista previa disponible</span>
                )}
              </div>
            </div>

            <div className="lg:col-span-2 p-6 overflow-y-auto space-y-6 flex flex-col justify-between h-full min-h-0 bg-slate-50 dark:bg-slate-950">
              <div className="space-y-5">
                
                <div className="flex border-b border-gray-200 dark:border-white/10">
                  <button
                    type="button"
                    onClick={() => setEditorTab('solid')}
                    className={`flex-1 pb-2 font-bold text-xs uppercase tracking-wider border-b-2 text-center transition-colors cursor-pointer ${
                      editorTab === 'solid' ? 'border-primary text-primary' : 'border-transparent text-gray-400 hover:text-gray-650'
                    }`}
                  >
                    Color Sólido
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditorTab('gradient')}
                    className={`flex-1 pb-2 font-bold text-xs uppercase tracking-wider border-b-2 text-center transition-colors cursor-pointer ${
                      editorTab === 'gradient' ? 'border-primary text-primary' : 'border-transparent text-gray-400 hover:text-gray-650'
                    }`}
                  >
                    Degradado
                  </button>
                </div>

                {editorTab === 'solid' ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Preajustes Rápidos</label>
                      <div className="grid grid-cols-3 gap-2">
                        <button
                          type="button"
                          onClick={() => setSolidPreset('custom')}
                          className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                            solidPreset === 'custom' ? 'bg-primary text-white border-primary shadow-sm' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                          }`}
                        >
                          Personalizado
                        </button>
                        <button
                          type="button"
                          onClick={() => setSolidPreset('white')}
                          className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                            solidPreset === 'white' ? 'bg-primary text-white border-primary shadow-sm' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                          }`}
                        >
                          Blanco Sólido
                        </button>
                        <button
                          type="button"
                          onClick={() => setSolidPreset('black')}
                          className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                            solidPreset === 'black' ? 'bg-primary text-white border-primary shadow-sm' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                          }`}
                        >
                          Negro Sólido
                        </button>
                      </div>
                    </div>

                    {solidPreset === 'custom' && (
                      <div className="space-y-3">
                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest">Colores del Logotipo Detectados</label>
                        {detectedColors.length === 0 ? (
                          <p className="text-xs text-gray-400 italic">No se detectaron colores vectoriales editables.</p>
                        ) : (
                          <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
                            {detectedColors.map((color, idx) => (
                              <div key={idx} className="flex items-center justify-between p-2.5 bg-white dark:bg-slate-900 border border-gray-150 dark:border-white/10 rounded-xl shadow-2xs">
                                <div className="flex items-center gap-2">
                                  <div 
                                    className="w-5 h-5 rounded-md border border-gray-200 dark:border-white/10 flex-shrink-0"
                                    style={{ backgroundColor: color }}
                                  />
                                  <span className="text-xs font-mono font-semibold text-gray-600 dark:text-gray-400">{color}</span>
                                </div>
                                <span className="text-gray-300">→</span>
                                <div className="flex items-center gap-2">
                                  <input 
                                    type="color" 
                                    value={colorReplacements[color] || color}
                                    onChange={(e) => handleColorChange(color, e.target.value)}
                                    className="w-8 h-8 rounded border border-gray-200 dark:border-white/10 cursor-pointer p-0 bg-transparent"
                                  />
                                  <input 
                                    type="text" 
                                    value={colorReplacements[color] || color}
                                    onChange={(e) => handleColorChange(color, e.target.value)}
                                    className="w-20 px-2 py-1 border border-gray-200 dark:border-white/10 rounded-lg text-xs font-mono uppercase focus:outline-none text-gray-700 dark:text-gray-300"
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest">Configuración de Degradado</label>
                    
                    <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-900 border border-gray-150 dark:border-white/10 rounded-xl shadow-2xs">
                      <span className="text-xs font-bold text-gray-600 dark:text-gray-400">Color Inicial:</span>
                      <div className="flex items-center gap-2">
                        <input 
                          type="color" 
                          value={gradStartColor}
                          onChange={(e) => setGradStartColor(e.target.value)}
                          className="w-8 h-8 rounded border border-gray-200 dark:border-white/10 cursor-pointer p-0 bg-transparent"
                        />
                        <input 
                          type="text" 
                          value={gradStartColor}
                          onChange={(e) => setGradStartColor(e.target.value)}
                          className="w-20 px-2 py-1 border border-gray-200 dark:border-white/10 rounded-lg text-xs font-mono uppercase focus:outline-none text-gray-750 font-bold"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-900 border border-gray-150 dark:border-white/10 rounded-xl shadow-2xs">
                      <span className="text-xs font-bold text-gray-600 dark:text-gray-400">Color Final:</span>
                      <div className="flex items-center gap-2">
                        <input 
                          type="color" 
                          value={gradEndColor}
                          onChange={(e) => setGradEndColor(e.target.value)}
                          className="w-8 h-8 rounded border border-gray-200 dark:border-white/10 cursor-pointer p-0 bg-transparent"
                        />
                        <input 
                          type="text" 
                          value={gradEndColor}
                          onChange={(e) => setGradEndColor(e.target.value)}
                          className="w-20 px-2 py-1 border border-gray-200 dark:border-white/10 rounded-lg text-xs font-mono uppercase focus:outline-none text-gray-750 font-bold"
                        />
                      </div>
                    </div>

                    <div className="p-3 bg-white dark:bg-slate-900 border border-gray-150 dark:border-white/10 rounded-xl shadow-2xs space-y-2">
                      <div className="flex justify-between text-xs font-bold text-gray-600 dark:text-gray-400">
                        <span>Ángulo del Degradado:</span>
                        <span className="font-mono text-primary">{gradAngle}°</span>
                      </div>
                      <input 
                        type="range" 
                        min="-180" 
                        max="180" 
                        value={gradAngle}
                        onChange={(e) => setGradAngle(e.target.value)}
                        className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

          </div>
        )}

        {!fetchingSvg && (
          <div className="p-5 bg-gray-50 dark:bg-slate-950 border-t border-gray-150 dark:border-white/10 flex flex-wrap justify-between items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 hover:bg-gray-100 border border-gray-250 rounded-xl text-xs font-semibold text-gray-500 dark:text-gray-450 cursor-pointer"
              disabled={savingChanges}
            >
              Cerrar
            </button>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleDownloadEditedSvg}
                className="flex items-center gap-1.5 px-4 py-2 bg-white dark:bg-slate-900 hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-white/10 font-bold rounded-xl text-xs shadow-2xs cursor-pointer transition-colors"
                disabled={savingChanges}
              >
                <Download size={14} />
                Descargar SVG
              </button>

              <button
                type="button"
                onClick={() => handleSaveEditedSvg('overwrite')}
                className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl text-xs shadow-sm cursor-pointer transition-colors"
                disabled={savingChanges}
              >
                {savingChanges ? <RefreshCw className="animate-spin" size={14} /> : <Save size={14} />}
                Sobreescribir Original
              </button>

              <button
                type="button"
                onClick={() => handleSaveEditedSvg('new')}
                className="flex items-center gap-1.5 px-5 py-2 bg-primary hover:bg-blue-900 text-white font-bold rounded-xl text-xs shadow-sm cursor-pointer transition-colors"
                disabled={savingChanges}
              >
                {savingChanges ? <Loader2 className="animate-spin" size={14} /> : <Plus size={14} />}
                Guardar Nueva Variante
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
