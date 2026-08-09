import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, Clock3, Loader2, Search, UserPlus, UsersRound, X } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../../../config/supabase';

interface SchoolAccessRequestsManagerProps {
  schoolId: string;
}

interface AccessRequestRow {
  id: string;
  school_id: string;
  user_id: string;
  requested_role: 'student' | 'teacher';
  requested_level_id: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  message: string | null;
  created_at: string;
  lms_schools: { name: string } | null;
  lms_levels: { name: string } | null;
  profile: { first_name: string | null; last_name: string | null; email: string | null } | null;
}

interface ProfileOption {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
}

interface LevelOption {
  id: string;
  school_id: string;
  name: string;
  parallel_code: string | null;
}

export function SchoolAccessRequestsManager({ schoolId }: SchoolAccessRequestsManagerProps) {
  const queryClient = useQueryClient();
  const [showManualForm, setShowManualForm] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedRole, setSelectedRole] = useState<'student' | 'teacher'>('student');
  const [selectedLevelId, setSelectedLevelId] = useState('');

  const requestsQuery = useQuery({
    queryKey: ['lms-school-access-requests', schoolId],
    queryFn: async (): Promise<AccessRequestRow[]> => {
      let requestQuery = supabase
        .from('lms_school_access_requests')
        .select('id, school_id, user_id, requested_role, requested_level_id, status, message, created_at, lms_schools(name), lms_levels(name)')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
      if (schoolId !== 'all') requestQuery = requestQuery.eq('school_id', schoolId);
      const { data: requests, error: requestsError } = await requestQuery;
      if (requestsError) throw requestsError;
      if (!requests?.length) return [];

      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email')
        .in('id', [...new Set(requests.map((request) => request.user_id))]);
      if (profilesError) throw profilesError;

      return requests.map((request) => ({
        ...request,
        lms_schools: Array.isArray(request.lms_schools) ? request.lms_schools[0] ?? null : request.lms_schools,
        lms_levels: Array.isArray(request.lms_levels) ? request.lms_levels[0] ?? null : request.lms_levels,
        profile: profiles?.find((profile) => profile.id === request.user_id) ?? null,
      })) as AccessRequestRow[];
    },
  });

  const directoryQuery = useQuery({
    queryKey: ['lms-school-access-directory', schoolId],
    enabled: showManualForm,
    queryFn: async () => {
      const [profilesResult, levelsResult] = await Promise.all([
        supabase.from('profiles').select('id, first_name, last_name, email').order('first_name').limit(200),
        schoolId === 'all'
          ? Promise.resolve({ data: [] as LevelOption[], error: null })
          : supabase.from('lms_levels').select('id, school_id, name, parallel_code').eq('school_id', schoolId).order('sort_order'),
      ]);
      if (profilesResult.error) throw profilesResult.error;
      if (levelsResult.error) throw levelsResult.error;
      return { profiles: (profilesResult.data ?? []) as ProfileOption[], levels: (levelsResult.data ?? []) as LevelOption[] };
    },
  });

  const processRequest = useMutation({
    mutationFn: async ({ requestId, approve }: { requestId: string; approve: boolean }) => {
      const { error } = await supabase.rpc('process_lms_school_access_request', {
        p_request_id: requestId,
        p_approve: approve,
        p_decision_note: approve ? 'Solicitud aprobada desde Administración Académica.' : 'Solicitud no aprobada desde Administración Académica.',
      });
      if (error) throw error;
    },
    onSuccess: async (_, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['lms-school-access-requests'] }),
        queryClient.invalidateQueries({ queryKey: ['lms-school-portal'] }),
      ]);
      toast.success(variables.approve ? 'Acceso a la escuela aprobado.' : 'Solicitud rechazada.');
    },
    onError: (error) => {
      console.error('Error processing school request:', error);
      toast.error(error instanceof Error ? error.message : 'No se pudo procesar la solicitud.');
    },
  });

  const addMembership = useMutation({
    mutationFn: async () => {
      if (schoolId === 'all') throw new Error('Selecciona una escuela antes de agregar participantes.');
      if (!selectedUserId) throw new Error('Selecciona una persona.');
      const { error } = await supabase.from('lms_school_memberships').upsert({
        school_id: schoolId,
        user_id: selectedUserId,
        role: selectedRole,
        status: 'active',
        level_id: selectedLevelId || null,
      }, { onConflict: 'school_id,user_id,role' });
      if (error) throw error;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['lms-school-memberships'] });
      setSelectedUserId('');
      setSelectedLevelId('');
      setShowManualForm(false);
      toast.success('Participante agregado a la escuela.');
    },
    onError: (error) => {
      console.error('Error adding school membership:', error);
      toast.error(error instanceof Error ? error.message : 'No se pudo agregar a la persona.');
    },
  });

  const filteredProfiles = useMemo(() => {
    const term = search.trim().toLocaleLowerCase('es');
    if (!term) return directoryQuery.data?.profiles ?? [];
    return (directoryQuery.data?.profiles ?? []).filter((profile) =>
      `${profile.first_name ?? ''} ${profile.last_name ?? ''} ${profile.email ?? ''}`.toLocaleLowerCase('es').includes(term),
    );
  }, [directoryQuery.data?.profiles, search]);

  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-4 rounded-[1.75rem] border border-slate-200/70 bg-white/80 p-5 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.045] sm:flex-row sm:items-center sm:justify-between">
        <div><p className="text-xs font-black uppercase tracking-[0.16em] text-indigo-500">Acceso inicial</p><h2 className="mt-1 font-serif text-2xl font-black text-slate-900 dark:text-white">Solicitudes por escuela</h2><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Aprueba solicitudes antes de matricular a la persona en una clase específica.</p></div>
        <button type="button" disabled={schoolId === 'all'} onClick={() => setShowManualForm((value) => !value)} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 text-sm font-bold text-white shadow-lg shadow-indigo-600/20 disabled:cursor-not-allowed disabled:opacity-50"><UserPlus size={17} /> Agregar manualmente</button>
      </div>

      {showManualForm && (
        <div className="rounded-[1.75rem] border border-indigo-200 bg-indigo-50/80 p-5 dark:border-indigo-400/15 dark:bg-indigo-500/10">
          <div className="flex items-center justify-between"><h3 className="font-bold text-slate-900 dark:text-white">Nuevo participante de la escuela</h3><button type="button" onClick={() => setShowManualForm(false)} aria-label="Cerrar"><X size={18} /></button></div>
          <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_1fr_180px_180px_auto]">
            <label className="relative lg:col-span-1"><Search className="absolute left-3 top-3 text-slate-400" size={16} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar persona..." className="min-h-11 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-sm outline-none dark:border-white/10 dark:bg-slate-950" /></label>
            <select value={selectedUserId} onChange={(event) => setSelectedUserId(event.target.value)} className="min-h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm dark:border-white/10 dark:bg-slate-950"><option value="">Selecciona una persona</option>{filteredProfiles.map((profile) => <option key={profile.id} value={profile.id}>{`${profile.first_name ?? ''} ${profile.last_name ?? ''}`.trim() || profile.email || 'Sin nombre'}</option>)}</select>
            <select value={selectedRole} onChange={(event) => setSelectedRole(event.target.value as 'student' | 'teacher')} className="min-h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm dark:border-white/10 dark:bg-slate-950"><option value="student">Estudiante</option><option value="teacher">Docente</option></select>
            <select value={selectedLevelId} onChange={(event) => setSelectedLevelId(event.target.value)} className="min-h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm dark:border-white/10 dark:bg-slate-950"><option value="">Nivel por asignar</option>{directoryQuery.data?.levels.map((level) => <option key={level.id} value={level.id}>{level.name}{level.parallel_code ? ` ${level.parallel_code}` : ''}</option>)}</select>
            <button type="button" disabled={addMembership.isPending || directoryQuery.isLoading} onClick={() => addMembership.mutate()} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 text-sm font-bold text-white dark:bg-white dark:text-slate-950">{addMembership.isPending ? <Loader2 className="animate-spin" size={16} /> : <Check size={16} />} Agregar</button>
          </div>
        </div>
      )}

      {requestsQuery.isLoading ? (
        <div className="flex justify-center rounded-[1.75rem] border border-slate-200 bg-white p-14 dark:border-white/10 dark:bg-slate-900"><Loader2 className="animate-spin text-indigo-500" size={28} /></div>
      ) : requestsQuery.error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-700 dark:border-rose-400/20 dark:bg-rose-500/10 dark:text-rose-200">{requestsQuery.error instanceof Error ? requestsQuery.error.message : 'No se pudieron cargar las solicitudes.'}</div>
      ) : requestsQuery.data?.length === 0 ? (
        <div className="rounded-[1.75rem] border border-dashed border-slate-300 bg-white/70 p-12 text-center dark:border-white/10 dark:bg-white/[0.03]"><UsersRound className="mx-auto text-slate-300 dark:text-slate-600" size={38} /><h3 className="mt-4 font-bold text-slate-800 dark:text-white">No hay solicitudes pendientes</h3><p className="mt-1 text-sm text-slate-500">Las nuevas solicitudes de ingreso aparecerán aquí.</p></div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {requestsQuery.data?.map((request) => {
            const name = `${request.profile?.first_name ?? ''} ${request.profile?.last_name ?? ''}`.trim() || request.profile?.email || 'Persona sin nombre';
            return <article key={request.id} className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-slate-900"><div className="flex items-start gap-3"><span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-400/10 dark:text-amber-300"><Clock3 size={20} /></span><div className="min-w-0"><h3 className="truncate font-bold text-slate-900 dark:text-white">{name}</h3><p className="truncate text-xs text-slate-500">{request.profile?.email}</p><div className="mt-2 flex flex-wrap gap-2 text-[10px] font-bold uppercase tracking-wider"><span className="rounded-full bg-indigo-50 px-2.5 py-1 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300">{request.lms_schools?.name}</span>{request.lms_levels?.name && <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-600 dark:bg-white/5 dark:text-slate-300">{request.lms_levels.name}</span>}</div></div></div>{request.message && <p className="mt-4 rounded-xl bg-slate-50 p-3 text-sm italic text-slate-600 dark:bg-slate-950/60 dark:text-slate-300">“{request.message}”</p>}<div className="mt-5 grid grid-cols-2 gap-2"><button type="button" disabled={processRequest.isPending} onClick={() => processRequest.mutate({ requestId: request.id, approve: true })} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-emerald-600 text-sm font-bold text-white"><Check size={16} /> Aprobar</button><button type="button" disabled={processRequest.isPending} onClick={() => processRequest.mutate({ requestId: request.id, approve: false })} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-rose-50 text-sm font-bold text-rose-700 dark:bg-rose-500/10 dark:text-rose-300"><X size={16} /> Rechazar</button></div></article>;
          })}
        </div>
      )}
    </section>
  );
}
