import { useCallback, useEffect, useState } from 'react';
import { ArrowDown, ArrowUp, Check, ImagePlus, Images, Loader2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../../../config/supabase';
import MediaUploader from '../../common/MediaUploader';
import { useConfirmStore } from '../../../store/useConfirmStore';

interface GalleryPhoto {
  id: string;
  ministry_id: string;
  image_url: string;
  alt_text: string;
  caption: string;
  sort_order: number;
  created_at: string;
}

interface MinistryGalleryManagerProps {
  ministryId: string;
  ministryName: string;
  ministrySlug: string;
  canEdit: boolean;
}

export default function MinistryGalleryManager({ ministryId, ministryName, ministrySlug, canEdit }: MinistryGalleryManagerProps) {
  const confirm = useConfirmStore((state) => state.confirm);
  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);

  const loadPhotos = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('ministry_gallery_items')
      .select('id, ministry_id, image_url, alt_text, caption, sort_order, created_at')
      .eq('ministry_id', ministryId)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false });
    if (error) {
      console.error('Error loading ministry gallery:', error);
      toast.error('No se pudo cargar la galería. Intenta de nuevo.');
      setPhotos([]);
    } else {
      setPhotos((data || []) as GalleryPhoto[]);
    }
    setLoading(false);
  }, [ministryId]);

  useEffect(() => {
    const timer = window.setTimeout(() => { void loadPhotos(); }, 0);
    return () => window.clearTimeout(timer);
  }, [loadPhotos]);

  const addPhoto = async (url: string) => {
    if (!canEdit) return;
    const { error } = await supabase.from('ministry_gallery_items').insert({
      ministry_id: ministryId,
      image_url: url,
      alt_text: `Foto de ${ministryName}`,
      caption: '',
      sort_order: photos.length * 10,
    });
    if (error) {
      console.error('Error adding ministry gallery photo:', error);
      toast.error('La foto se subió, pero no se pudo agregar a la galería.');
      return;
    }
    toast.success('Foto agregada a la galería.');
    await loadPhotos();
  };

  const updatePhoto = (id: string, field: 'alt_text' | 'caption', value: string) => {
    setPhotos((current) => current.map((photo) => photo.id === id ? { ...photo, [field]: value } : photo));
  };

  const savePhoto = async (photo: GalleryPhoto) => {
    if (!canEdit) return;
    setSavingId(photo.id);
    const { error } = await supabase.from('ministry_gallery_items').update({
      alt_text: photo.alt_text.trim(),
      caption: photo.caption.trim(),
    }).eq('id', photo.id);
    if (error) {
      console.error('Error updating ministry gallery photo:', error);
      toast.error('No se pudieron guardar los cambios.');
    } else {
      toast.success('Cambios guardados.');
    }
    setSavingId(null);
  };

  const removePhoto = async (photo: GalleryPhoto) => {
    if (!canEdit) return;
    const approved = await confirm({
      title: 'Quitar esta foto',
      message: 'La foto dejará de mostrarse en Inicio y en la página del ministerio.',
      confirmText: 'Quitar foto',
      cancelText: 'Conservar',
      variant: 'danger',
    });
    if (!approved) return;
    const { error } = await supabase.from('ministry_gallery_items').delete().eq('id', photo.id);
    if (error) {
      console.error('Error removing ministry gallery photo:', error);
      toast.error('No se pudo quitar la foto.');
      return;
    }
    setPhotos((current) => current.filter((item) => item.id !== photo.id));
    toast.success('Foto quitada de la galería.');
  };

  const movePhoto = async (index: number, direction: -1 | 1) => {
    if (!canEdit) return;
    const target = index + direction;
    if (target < 0 || target >= photos.length) return;
    const next = [...photos];
    [next[index], next[target]] = [next[target], next[index]];
    setPhotos(next);
    const results = await Promise.all(next.map((photo, order) =>
      supabase.from('ministry_gallery_items').update({ sort_order: order * 10 }).eq('id', photo.id),
    ));
    const failed = results.find((result) => result.error);
    if (failed?.error) {
      console.error('Error reordering ministry gallery:', failed.error);
      toast.error('No se pudo guardar el orden de las fotos.');
      await loadPhotos();
    }
  };

  return (
    <section className="space-y-5">
      <header className="flex flex-col gap-4 rounded-3xl border border-indigo-100 bg-gradient-to-r from-indigo-50 via-white to-amber-50 p-5 dark:border-white/10 dark:from-indigo-950/30 dark:via-slate-950 dark:to-amber-950/20 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-indigo-700 dark:text-indigo-300"><Images size={16} /> Fotos de {ministryName}</div>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">Las fotos nuevas aparecen automáticamente en Inicio y en la página de este espacio.</p>
        </div>
        {canEdit && <MediaUploader folder={`ministerios/${ministrySlug}/galeria`} multiple allowedFormats={['jpg', 'jpeg', 'png', 'webp', 'avif']} label="Agregar fotos" className="w-full justify-center sm:w-auto" onUploadSuccess={(url) => { void addPhoto(url); }} />}
      </header>

      {!canEdit && <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-semibold text-amber-900 dark:border-amber-500/20 dark:bg-amber-950/20 dark:text-amber-200">Tienes acceso de lectura a este ministerio.</p>}

      {loading ? <div className="flex min-h-48 items-center justify-center"><Loader2 className="animate-spin text-primary" size={28} /><span className="sr-only">Cargando fotos</span></div> : photos.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white/60 px-5 py-14 text-center dark:border-white/15 dark:bg-white/[0.03]">
          <ImagePlus size={30} className="mx-auto text-slate-400" />
          <h2 className="mt-3 font-serif text-xl font-bold">La galería está lista</h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">{canEdit ? 'Agrega fotos del ministerio y aparecerán en los dos espacios públicos.' : 'Todavía no se han publicado fotos para este ministerio.'}</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {photos.map((photo, index) => (
            <article key={photo.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-slate-900">
              <img src={photo.image_url} alt={photo.alt_text} loading="lazy" className="aspect-[4/3] w-full bg-slate-100 object-cover dark:bg-slate-800" />
              <div className="space-y-3 p-4">
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300">Descripción de la foto<input value={photo.alt_text} maxLength={160} disabled={!canEdit} onChange={(event) => updatePhoto(photo.id, 'alt_text', event.target.value)} placeholder="Qué aparece en la foto" className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-normal outline-none focus:border-indigo-400 disabled:opacity-65 dark:border-white/10 dark:bg-slate-950" /></label>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300">Pie de foto (opcional)<input value={photo.caption} maxLength={180} disabled={!canEdit} onChange={(event) => updatePhoto(photo.id, 'caption', event.target.value)} placeholder="Ej.: Encuentro de jóvenes" className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-normal outline-none focus:border-indigo-400 disabled:opacity-65 dark:border-white/10 dark:bg-slate-950" /></label>
                {canEdit && <div className="flex items-center justify-between border-t border-slate-100 pt-3 dark:border-white/10">
                  <div className="flex gap-1"><button type="button" onClick={() => void movePhoto(index, -1)} disabled={index === 0} aria-label="Mover foto arriba" className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 disabled:opacity-30 dark:hover:bg-white/10"><ArrowUp size={16} /></button><button type="button" onClick={() => void movePhoto(index, 1)} disabled={index === photos.length - 1} aria-label="Mover foto abajo" className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 disabled:opacity-30 dark:hover:bg-white/10"><ArrowDown size={16} /></button><button type="button" onClick={() => void removePhoto(photo)} aria-label="Quitar foto" className="rounded-lg p-2 text-red-500 transition hover:bg-red-50 dark:hover:bg-red-500/10"><Trash2 size={16} /></button></div>
                  <button type="button" onClick={() => void savePhoto(photo)} disabled={savingId === photo.id} className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3 py-2 text-xs font-bold text-white transition hover:bg-primary/90 disabled:opacity-60">{savingId === photo.id ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} Guardar</button>
                </div>}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
