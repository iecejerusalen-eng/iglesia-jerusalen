import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../config/supabase';
import { 
  Upload, 
  Trash2, 
  Loader2, 
  Image as ImageIcon, 
  Copy, 
  ExternalLink, 
  Check, 
  FileCode, 
  Filter, 
  FolderHeart,
  Plus,
  Palette,
  X,
  Download,
  Save,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import { useConfirmStore } from '../../store/useConfirmStore';

interface MinistryOption {
  id: string;
  name: string;
}

interface LogoData {
  id: string;
  ministry_id: string | null;
  variant: 'cuadrado' | 'circular' | 'vertical' | 'horizontal';
  color_mode: 'color' | 'blanco_y_negro' | 'blanco_solido' | 'negro_solido';
  format: string;
  storage_path: string;
  created_at: string;
  ministries: { name: string } | null;
}

export default function LogosManager() {
  const confirm = useConfirmStore((state) => state.confirm);
  // States
  const [logos, setLogos] = useState<LogoData[]>([]);
  const [ministries, setMinistries] = useState<MinistryOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Form states
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [ministryId, setMinistryId] = useState<string>(''); // empty string means General Church (null)
  const [variant, setVariant] = useState<'cuadrado' | 'circular' | 'vertical' | 'horizontal'>('cuadrado');
  const [colorMode, setColorMode] = useState<'color' | 'blanco_y_negro' | 'blanco_solido' | 'negro_solido'>('color');

  // Filter states
  const [filterMinistry, setFilterMinistry] = useState<string>('all');
  const [filterVariant, setFilterVariant] = useState<string>('all');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Estados del Editor SVG inteligente
  const [editingLogo, setEditingLogo] = useState<LogoData | null>(null);
  const [svgSource, setSvgSource] = useState<string>('');
  const [modifiedSvg, setModifiedSvg] = useState<string>('');
  const [detectedColors, setDetectedColors] = useState<string[]>([]);
  const [colorReplacements, setColorReplacements] = useState<Record<string, string>>({});
  const [fetchingSvg, setFetchingSvg] = useState(false);
  const [savingChanges, setSavingChanges] = useState(false);
  
  // Opciones de edición
  const [editorTab, setEditorTab] = useState<'solid' | 'gradient'>('solid');
  const [solidPreset, setSolidPreset] = useState<'custom' | 'white' | 'black'>('custom');
  
  // Estados de Degradado
  const [gradStartColor, setGradStartColor] = useState('#1E3A8A');
  const [gradEndColor, setGradEndColor] = useState('#EC4899');
  const [gradAngle, setGradAngle] = useState('45');

  // Cargar SVG y detectar colores únicos
  const loadSvgForEditing = async (logo: LogoData) => {
    setFetchingSvg(true);
    setEditingLogo(logo);
    setSvgSource('');
    setModifiedSvg('');
    setDetectedColors([]);
    setColorReplacements({});
    setSolidPreset('custom');
    setEditorTab('solid');
    
    try {
      const publicUrl = getPublicUrl(logo.storage_path);
      const response = await fetch(publicUrl);
      if (!response.ok) throw new Error('No se pudo descargar el archivo SVG');
      const text = await response.text();
      setSvgSource(text);
      setModifiedSvg(text);
      
      // Parsear SVG para extraer colores
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
        
        // Extraer de estilos inline
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

      // Extraer de etiquetas <style>
      const styleElements = doc.querySelectorAll('style');
      styleElements.forEach((styleEl) => {
        const content = styleEl.textContent || '';
        // Buscar fill: ...
        const fillMatches = content.matchAll(/fill\s*:\s*([^;}\s]+)/gi);
        for (const match of fillMatches) {
          const c = cleanColor(match[1]);
          if (c) colors.add(c);
        }
        // Buscar stroke: ...
        const strokeMatches = content.matchAll(/stroke\s*:\s*([^;}\s]+)/gi);
        for (const match of strokeMatches) {
          const c = cleanColor(match[1]);
          if (c) colors.add(c);
        }
        // Buscar stop-color: ...
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
      
      // Inicializar mapeo de reemplazos
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
      setEditingLogo(null);
    } finally {
      setFetchingSvg(false);
    }
  };

  // Re-aplicar cambios cuando cambien las variables del editor
  const applySvgChanges = () => {
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
          // Reemplazos de color personalizados
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
        // Modo Degradado
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
        
        // Calcular ángulo vectorial
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
        
        // Aplicar a los elementos con fill
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
  };

  useEffect(() => {
    applySvgChanges();
  }, [svgSource, editorTab, solidPreset, colorReplacements, gradStartColor, gradEndColor, gradAngle]);

  const handleColorChange = (origColor: string, newColor: string) => {
    setColorReplacements(prev => ({
      ...prev,
      [origColor]: newColor
    }));
  };

  const handleDownloadEditedSvg = () => {
    if (!modifiedSvg || !editingLogo) return;
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
    if (!editingLogo || !modifiedSvg) return;
    setSavingChanges(true);
    
    try {
      const blob = new Blob([modifiedSvg], { type: 'image/svg+xml' });
      const file = new File([blob], `logo_editado_${Date.now()}.svg`, { type: 'image/svg+xml' });
      
      let storagePath = editingLogo.storage_path;
      
      if (mode === 'new') {
        const folder = editingLogo.ministry_id ? editingLogo.ministry_id : 'general';
        const filePrefix = editingLogo.ministry_id ? `ministry_${editingLogo.ministry_id}` : 'church_general';
        const timestamp = Date.now();
        
        let newColorMode = editingLogo.color_mode;
        if (editorTab === 'solid') {
          if (solidPreset === 'white') newColorMode = 'blanco_solido';
          else if (solidPreset === 'black') newColorMode = 'negro_solido';
        }
        
        const filename = `${filePrefix}_${editingLogo.variant}_${newColorMode}_edit_${timestamp}.svg`;
        storagePath = `${folder}/${filename}`;
        
        // 1. Subir al storage bucket
        const { error: uploadError } = await supabase.storage
          .from('logos')
          .upload(storagePath, file, { cacheControl: '31536000', upsert: false });
          
        if (uploadError) throw uploadError;
        
        // 2. Registrar en la BD
        const { error: dbError } = await supabase
          .from('logos')
          .insert({
            ministry_id: editingLogo.ministry_id,
            variant: editingLogo.variant,
            color_mode: newColorMode,
            format: 'svg',
            storage_path: storagePath
          });
          
        if (dbError) {
          await supabase.storage.from('logos').remove([storagePath]);
          throw dbError;
        }
        
        toast.success('Variante guardada con éxito en la base de datos.');
      } else {
        // Sobreescribir
        const { error: uploadError } = await supabase.storage
          .from('logos')
          .upload(storagePath, file, { cacheControl: '31536000', upsert: true });
          
        if (uploadError) throw uploadError;
        toast.success('Logo original sobreescrito con éxito.');
      }
      
      setEditingLogo(null);
      fetchLogos();
    } catch (err: any) {
      console.error('Error saving edited SVG:', err);
      toast.error('Error al guardar cambios del logo: ' + err.message);
    } finally {
      setSavingChanges(false);
    }
  };

  // Fetch initial data
  useEffect(() => {
    fetchMinistries();
    fetchLogos();
  }, []);

  const fetchMinistries = async () => {
    try {
      const { data, error } = await supabase
        .from('ministries')
        .select('id, name')
        .order('name');
      if (error) throw error;
      setMinistries(data || []);
    } catch (err: any) {
      console.error('Error fetching ministries:', err);
      toast.error('No se pudieron cargar los ministerios: ' + err.message);
    }
  };

  const fetchLogos = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('logos')
        .select('*, ministries(name)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setLogos(data as LogoData[] || []);
    } catch (err: any) {
      console.error('Error fetching logos:', err);
      toast.error('No se pudieron cargar los logos: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      toast.error('Por favor, selecciona un archivo de imagen o logo.');
      return;
    }

    setUploading(true);
    try {
      const fileExt = selectedFile.name.split('.').pop()?.toLowerCase() || 'png';
      const filePrefix = ministryId ? `ministry_${ministryId}` : 'church_general';
      const timestamp = Date.now();
      const uniqueFileName = `${filePrefix}_${variant}_${colorMode}_${timestamp}.${fileExt}`;
      
      // Organizar en carpetas en el storage
      const folderPath = ministryId ? ministryId : 'general';
      const storagePath = `${folderPath}/${uniqueFileName}`;

      // 1. Subir al storage bucket "logos"
      const { error: uploadError } = await supabase.storage
        .from('logos')
        .upload(storagePath, selectedFile, {
          cacheControl: '31536000',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // 2. Registrar metadatos en la tabla "logos"
      const { error: dbError } = await supabase
        .from('logos')
        .insert({
          ministry_id: ministryId || null,
          variant,
          color_mode: colorMode,
          format: fileExt,
          storage_path: storagePath
        });

      if (dbError) {
        // Intentar limpiar el archivo subido si falla el registro en la BD
        await supabase.storage.from('logos').remove([storagePath]);
        throw dbError;
      }

      toast.success('Logo subido y registrado con éxito.');
      setSelectedFile(null);
      setMinistryId('');
      setVariant('cuadrado');
      setColorMode('color');
      if (fileInputRef.current) fileInputRef.current.value = '';
      
      // Recargar la lista
      fetchLogos();
    } catch (err: any) {
      console.error('Error uploading logo:', err);
      toast.error('Error al subir el logo: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (logo: LogoData) => {
    const confirmed = await confirm({
      title: 'Eliminar logo',
      message: '¿Estás seguro de que deseas eliminar este logo?\n\nSe borrará del almacenamiento permanentemente.',
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      variant: 'danger',
    });
    if (!confirmed) return;

    setDeletingId(logo.id);
    try {
      // 1. Borrar de Supabase Storage
      const { error: storageError } = await supabase.storage
        .from('logos')
        .remove([logo.storage_path]);

      if (storageError) {
        console.warn('Advertencia al borrar del storage:', storageError);
      }

      // 2. Borrar de la tabla logos
      const { error: dbError } = await supabase
        .from('logos')
        .delete()
        .eq('id', logo.id);

      if (dbError) throw dbError;

      toast.success('Logo eliminado correctamente.');
      setLogos(prev => prev.filter(l => l.id !== logo.id));
    } catch (err: any) {
      console.error('Error deleting logo:', err);
      toast.error('Error al eliminar el logo: ' + err.message);
    } finally {
      setDeletingId(null);
    }
  };

  const copyToClipboard = (logoPath: string, logoId: string) => {
    const { data } = supabase.storage.from('logos').getPublicUrl(logoPath);
    if (data?.publicUrl) {
      navigator.clipboard.writeText(data.publicUrl);
      setCopiedId(logoId);
      toast.success('URL del logo copiada al portapapeles.');
      setTimeout(() => setCopiedId(null), 2000);
    } else {
      toast.error('No se pudo generar la URL pública del logo.');
    }
  };

  const getPublicUrl = (logoPath: string) => {
    return supabase.storage.from('logos').getPublicUrl(logoPath).data.publicUrl;
  };

  // Filter logic
  const filteredLogos = logos.filter(logo => {
    const matchesMinistry = filterMinistry === 'all' || 
      (filterMinistry === 'general' && logo.ministry_id === null) ||
      (logo.ministry_id === filterMinistry);
    
    const matchesVariant = filterVariant === 'all' || logo.variant === filterVariant;

    return matchesMinistry && matchesVariant;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-serif font-bold text-primary">Catálogo de Logos</h1>
        <p className="text-gray-500 text-sm">Administra la identidad visual de la iglesia y sus ministerios en un solo lugar.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulario de Subida (Column 1) */}
        <div className="lg:col-span-1 bg-white rounded-2xl border border-gray-150 shadow-sm p-6 self-start space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
            <Plus className="text-gold" size={20} />
            <h2 className="font-serif font-bold text-gray-800 text-lg">Subir Nuevo Logo</h2>
          </div>

          <form onSubmit={handleUpload} className="space-y-4">
            {/* File Input */}
            <div>
              <label htmlFor="logo_file" className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Archivo de Logo</label>
              <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/50 hover:bg-gray-50 transition-colors cursor-pointer relative">
                <input
                  id="logo_file"
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".png,.svg,.webp,.jpg,.jpeg,.ai"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  disabled={uploading}
                />
                <Upload className="text-gray-400 mb-2" size={24} />
                <span className="text-xs font-medium text-gray-650 text-center">
                  {selectedFile ? selectedFile.name : 'Seleccionar o arrastrar archivo'}
                </span>
                <span className="text-[10px] text-gray-400 mt-1 block">
                  Formatos aceptados: PNG, SVG, WEBP, JPG, AI
                </span>
              </div>
            </div>

            {/* Ministry Owner */}
            <div>
              <label htmlFor="logo_ministry" className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Pertenece a</label>
              <select
                id="logo_ministry"
                value={ministryId}
                onChange={(e) => setMinistryId(e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-primary/20 focus:outline-none"
                disabled={uploading}
              >
                <option value="">Iglesia General (Nacional)</option>
                {ministries.map((min) => (
                  <option key={min.id} value={min.id}>
                    {min.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Variant Type */}
            <div>
              <label htmlFor="logo_variant" className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Variante / Orientación</label>
              <select
                id="logo_variant"
                value={variant}
                onChange={(e) => setVariant(e.target.value as any)}
                className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-primary/20 focus:outline-none"
                disabled={uploading}
              >
                <option value="cuadrado">Cuadrado (1:1)</option>
                <option value="circular">Circular</option>
                <option value="vertical">Vertical / Apilado</option>
                <option value="horizontal">Horizontal / Isologo</option>
              </select>
            </div>

            {/* Color Mode */}
            <div>
              <label htmlFor="logo_color_mode" className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Modo de Color</label>
              <select
                id="logo_color_mode"
                value={colorMode}
                onChange={(e) => setColorMode(e.target.value as any)}
                className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-primary/20 focus:outline-none"
                disabled={uploading}
              >
                <option value="color">Full Color</option>
                <option value="blanco_y_negro">Blanco y Negro (Escala de Grises)</option>
                <option value="blanco_solido">Blanco Sólido (Para fondos oscuros)</option>
                <option value="negro_solido">Negro Sólido (Monocromático oscuro)</option>
              </select>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={uploading || !selectedFile}
              className="w-full bg-primary hover:bg-blue-900 disabled:bg-gray-150 disabled:text-gray-400 text-white py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer border border-transparent"
            >
              {uploading ? (
                <>
                  <Loader2 className="animate-spin" size={16} />
                  Subiendo...
                </>
              ) : (
                <>
                  <Upload size={16} />
                  Subir y Registrar Logo
                </>
              )}
            </button>
          </form>
        </div>

        {/* Galería / Listado (Columns 2 & 3) */}
        <div className="lg:col-span-2 space-y-4">
          {/* Barra de Filtros */}
          <div className="bg-white rounded-2xl border border-gray-150 shadow-sm p-4 flex flex-wrap items-center gap-4 justify-between">
            <div className="flex items-center gap-2">
              <Filter className="text-gray-400" size={18} />
              <span className="text-sm font-semibold text-gray-700">Filtros:</span>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Ministry Filter */}
              <div>
                <label htmlFor="filter_ministry" className="sr-only">Filtrar por Ministerio</label>
                <select
                  id="filter_ministry"
                  value={filterMinistry}
                  onChange={(e) => setFilterMinistry(e.target.value)}
                  className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs bg-white focus:outline-none"
                >
                  <option value="all">Todos los Propietarios</option>
                  <option value="general">Iglesia General</option>
                  {ministries.map((min) => (
                    <option key={min.id} value={min.id}>
                      {min.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Variant Filter */}
              <div>
                <label htmlFor="filter_variant" className="sr-only">Filtrar por Variante</label>
                <select
                  id="filter_variant"
                  value={filterVariant}
                  onChange={(e) => setFilterVariant(e.target.value)}
                  className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs bg-white focus:outline-none"
                >
                  <option value="all">Todas las Variantes</option>
                  <option value="cuadrado">Cuadrados</option>
                  <option value="circular">Circulares</option>
                  <option value="vertical">Verticales</option>
                  <option value="horizontal">Horizontales</option>
                </select>
              </div>
            </div>
          </div>

          {/* Grilla de Logos */}
          {loading ? (
            <div className="flex justify-center items-center py-20 bg-white rounded-2xl border border-gray-150 shadow-sm">
              <Loader2 className="animate-spin text-primary" size={32} />
            </div>
          ) : filteredLogos.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredLogos.map((logo) => {
                const publicUrl = getPublicUrl(logo.storage_path);
                const isRenderable = ['png', 'svg', 'webp', 'jpg', 'jpeg'].includes(logo.format.toLowerCase());
                
                // Color mode text display mapping
                const colorModeLabels = {
                  color: 'Color',
                  blanco_y_negro: 'B&N',
                  blanco_solido: 'Blanco Sólido',
                  negro_solido: 'Negro Sólido'
                };

                // Variant text display mapping
                const variantLabels = {
                  cuadrado: 'Cuadrado',
                  circular: 'Circular',
                  vertical: 'Vertical',
                  horizontal: 'Horizontal'
                };

                return (
                  <div 
                    key={logo.id} 
                    className="group bg-white rounded-2xl border border-gray-150 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col"
                  >
                    {/* Visual Container */}
                    <div className="h-44 bg-gray-50 flex items-center justify-center p-6 border-b border-gray-100 relative overflow-hidden">
                      {isRenderable ? (
                        <img 
                          src={publicUrl} 
                          alt={`Logo ${logo.variant}`}
                          className="max-w-full max-h-full object-contain drop-shadow-xs transition-transform duration-200 group-hover:scale-105"
                          loading="lazy"
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center text-gray-400">
                          <FileCode size={48} className="text-gold mb-2" />
                          <span className="font-mono text-sm uppercase font-bold">{logo.format}</span>
                          <span className="text-[10px] text-gray-400 mt-1">Archivo de Diseño Vectorial</span>
                        </div>
                      )}

                      {/* Floating Actions on Hover */}
                      <div className="absolute inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => copyToClipboard(logo.storage_path, logo.id)}
                          className="bg-white hover:bg-gray-100 text-gray-800 p-2 rounded-xl shadow-sm transition-transform hover:scale-105 flex items-center gap-1 text-xs font-semibold cursor-pointer"
                          title="Copiar Enlace público"
                        >
                          {copiedId === logo.id ? (
                            <Check size={16} className="text-green-600" />
                          ) : (
                            <Copy size={16} />
                          )}
                          <span>Copiar URL</span>
                        </button>
                        
                        {logo.format.toLowerCase() === 'svg' && (
                          <button
                            onClick={() => loadSvgForEditing(logo)}
                            className="bg-white hover:bg-gray-100 text-gray-800 p-2 rounded-xl shadow-sm transition-transform hover:scale-105 flex items-center gap-1 text-xs font-semibold cursor-pointer"
                            title="Editar colores del SVG"
                          >
                            <Palette size={16} className="text-primary" />
                            <span>Editar</span>
                          </button>
                        )}

                        <a
                          href={publicUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-white hover:bg-gray-100 text-gray-800 p-2 rounded-xl shadow-sm transition-transform hover:scale-105 flex items-center gap-1 text-xs font-semibold"
                        >
                          <ExternalLink size={16} />
                          <span>Ver</span>
                        </a>
                      </div>
                    </div>

                    {/* Metadata Details */}
                    <div className="p-4 flex-grow flex flex-col justify-between space-y-2">
                      <div>
                        {/* Title / Ministry Owner */}
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <FolderHeart size={14} className="text-gold flex-shrink-0" />
                          <span className="font-serif font-bold text-gray-800 text-sm truncate">
                            {logo.ministries?.name || 'Iglesia General'}
                          </span>
                        </div>

                        {/* Badges Grid */}
                        <div className="flex flex-wrap gap-1.5">
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-blue-50 text-blue-600 border border-blue-100">
                            {variantLabels[logo.variant]}
                          </span>
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-amber-50 text-amber-700 border border-amber-100">
                            {colorModeLabels[logo.color_mode]}
                          </span>
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase bg-gray-100 text-gray-600">
                            {logo.format}
                          </span>
                        </div>
                      </div>

                      {/* Card Footer Delete Button */}
                      <div className="pt-2 border-t border-gray-50 flex justify-end">
                        <button
                          onClick={() => handleDelete(logo)}
                          disabled={deletingId === logo.id}
                          className="text-gray-400 hover:text-accent-red p-1.5 rounded-lg hover:bg-red-50 transition-colors flex items-center gap-1 text-xs font-medium cursor-pointer"
                          title="Eliminar Logo"
                        >
                          {deletingId === logo.id ? (
                            <Loader2 className="animate-spin text-red-500" size={14} />
                          ) : (
                            <Trash2 size={14} />
                          )}
                          <span>Eliminar</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-200">
              <ImageIcon className="mx-auto text-gray-300 mb-4" size={48} />
              <h3 className="text-lg font-serif font-bold text-gray-700">No se encontraron logos</h3>
              <p className="text-gray-400 text-sm mt-1">Sube el primer logo o ajusta los filtros de búsqueda.</p>
            </div>
          )}
        </div>
      </div>

      {/* MODAL DEL EDITOR SVG INTELIGENTE */}
      {editingLogo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white w-full max-w-5xl rounded-3xl border border-gray-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-scaleIn">
            
            {/* Cabecera del Modal */}
            <div className="p-5 border-b border-gray-150 flex items-center justify-between bg-primary text-white">
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
                onClick={() => setEditingLogo(null)}
                className="p-1 hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Cuerpo del Modal */}
            {fetchingSvg ? (
              <div className="p-20 flex flex-col items-center justify-center gap-3 text-gray-550">
                <Loader2 className="animate-spin text-primary" size={36} />
                <span className="text-xs font-semibold">Descargando código del logo SVG...</span>
              </div>
            ) : (
              <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-5 min-h-0">
                
                {/* Panel Izquierdo: Previsualización con Fondo de Transparencia */}
                <div className="lg:col-span-3 bg-gray-100 p-6 flex flex-col items-center justify-center min-h-[300px] border-r border-gray-150 relative overflow-auto">
                  <div className="absolute top-4 left-4 bg-black/55 text-white text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded select-none z-10">
                    Vista Previa en Tiempo Real
                  </div>
                  
                  {/* Contenedor SVG con cuadrícula checkerboard */}
                  <div 
                    className="max-w-full max-h-[40vh] lg:max-h-[55vh] aspect-square rounded-2xl border border-gray-200 shadow-inner flex items-center justify-center p-8 overflow-hidden relative"
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
                        dangerouslySetInnerHTML={{ __html: modifiedSvg }}
                      />
                    ) : (
                      <span className="text-xs text-gray-400">Sin vista previa disponible</span>
                    )}
                  </div>
                </div>

                {/* Panel Derecho: Controles del Editor */}
                <div className="lg:col-span-2 p-6 overflow-y-auto space-y-6 flex flex-col justify-between h-full min-h-0 bg-slate-50">
                  <div className="space-y-5">
                    
                    {/* Selectores de Pestañas (Sólido vs Degradado) */}
                    <div className="flex border-b border-gray-200">
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
                        {/* Presets Sólidos */}
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

                        {/* Colores Detectados */}
                        {solidPreset === 'custom' && (
                          <div className="space-y-3">
                            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest">Colores del Logotipo Detectados</label>
                            {detectedColors.length === 0 ? (
                              <p className="text-xs text-gray-400 italic">No se detectaron colores vectoriales editables.</p>
                            ) : (
                              <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
                                {detectedColors.map((color, idx) => (
                                  <div key={idx} className="flex items-center justify-between p-2.5 bg-white border border-gray-150 rounded-xl shadow-2xs">
                                    <div className="flex items-center gap-2">
                                      <div 
                                        className="w-5 h-5 rounded-md border border-gray-200 flex-shrink-0"
                                        style={{ backgroundColor: color }}
                                      />
                                      <span className="text-xs font-mono font-semibold text-gray-600">{color}</span>
                                    </div>
                                    <span className="text-gray-300">→</span>
                                    <div className="flex items-center gap-2">
                                      <input 
                                        type="color" 
                                        value={colorReplacements[color] || color}
                                        onChange={(e) => handleColorChange(color, e.target.value)}
                                        className="w-8 h-8 rounded border border-gray-200 cursor-pointer p-0 bg-transparent"
                                      />
                                      <input 
                                        type="text" 
                                        value={colorReplacements[color] || color}
                                        onChange={(e) => handleColorChange(color, e.target.value)}
                                        className="w-20 px-2 py-1 border border-gray-200 rounded-lg text-xs font-mono uppercase focus:outline-none text-gray-700"
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
                        
                        {/* Selector de Color de Inicio */}
                        <div className="flex items-center justify-between p-3 bg-white border border-gray-150 rounded-xl shadow-2xs">
                          <span className="text-xs font-bold text-gray-600">Color Inicial:</span>
                          <div className="flex items-center gap-2">
                            <input 
                              type="color" 
                              value={gradStartColor}
                              onChange={(e) => setGradStartColor(e.target.value)}
                              className="w-8 h-8 rounded border border-gray-200 cursor-pointer p-0 bg-transparent"
                            />
                            <input 
                              type="text" 
                              value={gradStartColor}
                              onChange={(e) => setGradStartColor(e.target.value)}
                              className="w-20 px-2 py-1 border border-gray-200 rounded-lg text-xs font-mono uppercase focus:outline-none text-gray-750 font-bold"
                            />
                          </div>
                        </div>

                        {/* Selector de Color de Fin */}
                        <div className="flex items-center justify-between p-3 bg-white border border-gray-150 rounded-xl shadow-2xs">
                          <span className="text-xs font-bold text-gray-600">Color Final:</span>
                          <div className="flex items-center gap-2">
                            <input 
                              type="color" 
                              value={gradEndColor}
                              onChange={(e) => setGradEndColor(e.target.value)}
                              className="w-8 h-8 rounded border border-gray-200 cursor-pointer p-0 bg-transparent"
                            />
                            <input 
                              type="text" 
                              value={gradEndColor}
                              onChange={(e) => setGradEndColor(e.target.value)}
                              className="w-20 px-2 py-1 border border-gray-200 rounded-lg text-xs font-mono uppercase focus:outline-none text-gray-750 font-bold"
                            />
                          </div>
                        </div>

                        {/* Slider de Ángulo */}
                        <div className="p-3 bg-white border border-gray-150 rounded-xl shadow-2xs space-y-2">
                          <div className="flex justify-between text-xs font-bold text-gray-600">
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

            {/* Pie del Modal */}
            {!fetchingSvg && (
              <div className="p-5 bg-gray-50 border-t border-gray-150 flex flex-wrap justify-between items-center gap-3">
                <button
                  type="button"
                  onClick={() => setEditingLogo(null)}
                  className="px-4 py-2 hover:bg-gray-100 border border-gray-250 rounded-xl text-xs font-semibold text-gray-500 cursor-pointer"
                  disabled={savingChanges}
                >
                  Cerrar
                </button>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleDownloadEditedSvg}
                    className="flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 font-bold rounded-xl text-xs shadow-2xs cursor-pointer transition-colors"
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
      )}
    </div>
  );
}
