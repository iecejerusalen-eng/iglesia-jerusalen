import type { FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, Save, Video } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../../../config/supabase';

interface IntegrationsTabProps {
  selectedCourseId: string;
}

type IntegrationProvider = 'zoom' | 'teams' | 'google_classroom';

interface IntegrationRow {
  provider: IntegrationProvider;
  credentials: unknown;
  is_active: boolean;
}

function credentialUrl(value: unknown): string {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return '';
  const url = (value as Record<string, unknown>).url;
  return typeof url === 'string' ? url : '';
}

export function IntegrationsTab({ selectedCourseId }: IntegrationsTabProps) {
  const queryClient = useQueryClient();
  const queryKey = ['course-integrations', selectedCourseId] as const;
  const { data: integrations = [], isLoading, error } = useQuery({
    queryKey,
    queryFn: async () => {
      const { data, error: queryError } = await supabase
        .from('lms_course_integrations')
        .select('provider, credentials, is_active')
        .eq('course_id', selectedCourseId);
      if (queryError) throw queryError;
      return (data || []) as IntegrationRow[];
    },
    enabled: Boolean(selectedCourseId),
  });

  const saveMutation = useMutation({
    mutationFn: async (values: { zoom: string; teams: string; classroom: boolean }) => {
      const payload = [
        { course_id: selectedCourseId, provider: 'zoom' as const, credentials: { url: values.zoom }, is_active: Boolean(values.zoom) },
        { course_id: selectedCourseId, provider: 'teams' as const, credentials: { url: values.teams }, is_active: Boolean(values.teams) },
        { course_id: selectedCourseId, provider: 'google_classroom' as const, credentials: {}, is_active: values.classroom },
      ];
      const { error: saveError } = await supabase
        .from('lms_course_integrations')
        .upsert(payload, { onConflict: 'course_id,provider' });
      if (saveError) throw saveError;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey });
      toast.success('Integraciones guardadas');
    },
    onError: (mutationError) => {
      console.error('Error saving course integrations:', mutationError);
      toast.error('No se pudieron guardar las integraciones');
    },
  });

  const byProvider = new Map(integrations.map((integration) => [integration.provider, integration]));

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    saveMutation.mutate({
      zoom: String(form.get('zoom') || '').trim(),
      teams: String(form.get('teams') || '').trim(),
      classroom: form.get('google_classroom') === 'on',
    });
  };

  if (isLoading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-gold" /></div>;
  if (error) return <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">No se pudieron cargar las integraciones del curso.</div>;

  return (
    <form key={`${selectedCourseId}-${integrations.length}`} onSubmit={handleSubmit} className="max-w-2xl space-y-5 rounded-3xl border border-slate-200 bg-white/85 p-5 text-left shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-white/5 sm:p-7">
      <div className="flex items-center gap-3">
        <span className="flex size-11 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-300"><Video size={20} /></span>
        <div><h3 className="font-serif text-lg font-bold text-slate-900 dark:text-white">Clases y plataformas externas</h3><p className="text-xs text-slate-500">Configuración real y compartida para este curso.</p></div>
      </div>

      <div className="space-y-4">
        <label className="block space-y-1.5 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
          Enlace de Zoom
          <input name="zoom" type="url" defaultValue={credentialUrl(byProvider.get('zoom')?.credentials)} className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-normal normal-case tracking-normal outline-none focus:border-gold dark:border-white/10 dark:bg-slate-900" placeholder="https://zoom.us/j/..." />
        </label>
        <label className="block space-y-1.5 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
          Enlace de Microsoft Teams
          <input name="teams" type="url" defaultValue={credentialUrl(byProvider.get('teams')?.credentials)} className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-normal normal-case tracking-normal outline-none focus:border-gold dark:border-white/10 dark:bg-slate-900" placeholder="https://teams.microsoft.com/..." />
        </label>
        <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-slate-950/30">
          <input name="google_classroom" type="checkbox" defaultChecked={byProvider.get('google_classroom')?.is_active || false} className="mt-0.5 size-4 accent-emerald-500" />
          <span><strong className="block text-sm text-slate-900 dark:text-white">Habilitar Google Classroom</strong><span className="mt-1 block text-xs text-slate-500">Deja preparada la integración del curso; la sincronización requiere credenciales institucionales.</span></span>
        </label>
      </div>

      <div className="flex justify-end border-t border-slate-200 pt-4 dark:border-white/10">
        <button type="submit" disabled={saveMutation.isPending} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-gold px-5 py-2 font-bold text-white shadow transition hover:bg-yellow-600 disabled:opacity-60">
          {saveMutation.isPending ? <Loader2 className="animate-spin" size={15} /> : <Save size={15} />} Guardar configuración
        </button>
      </div>
    </form>
  );
}
