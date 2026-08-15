import { useMemo, useState, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  BookOpenCheck,
  Clock3,
  GraduationCap,
  Loader2,
  LockKeyhole,
  RefreshCw,
  School,
  Send,
  ShieldCheck,
  UsersRound,
} from 'lucide-react';
import { toast } from 'sonner';
import { useSchoolPortal, type SchoolPortalMode, type SchoolPortalSchool } from '../hooks/useSchoolPortal';

interface SchoolPortalGateProps {
  mode: SchoolPortalMode;
  children: (school: SchoolPortalSchool, leaveSchool: () => void) => ReactNode;
}

function schoolModelLabel(type: SchoolPortalSchool['school_type']) {
  if (type === 'age_based') return 'Organización por edades';
  if (type === 'rank_based') return 'Formación por rangos';
  return 'Modelo académico configurable';
}

export function SchoolPortalGate({ mode, children }: SchoolPortalGateProps) {
  const { schools, isLoading, error, refetch, requestAccess } = useSchoolPortal(mode);
  const [selectedSchoolId, setSelectedSchoolId] = useState<string | null>(null);
  const [enteredSchoolId, setEnteredSchoolId] = useState<string | null>(null);
  const [message, setMessage] = useState('');

  const selectedSchool = useMemo(
    () => schools.find((school) => school.id === selectedSchoolId) ?? null,
    [schools, selectedSchoolId],
  );
  const enteredSchool = useMemo(
    () => schools.find((school) => school.id === enteredSchoolId) ?? null,
    [schools, enteredSchoolId],
  );

  if (enteredSchool) {
    return <>{children(enteredSchool, () => setEnteredSchoolId(null))}</>;
  }

  const sendRequest = async () => {
    if (!selectedSchool) return;
    try {
      await requestAccess.mutateAsync({ schoolId: selectedSchool.id, message });
      setMessage('');
      toast.success('Solicitud enviada. Te avisaremos cuando sea revisada.');
    } catch (requestError) {
      console.error('Error requesting LMS school access:', requestError);
      toast.error(requestError instanceof Error ? requestError.message : 'No se pudo enviar la solicitud.');
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[75vh] items-center justify-center bg-slate-950 px-4 pt-24 text-white">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-center shadow-2xl backdrop-blur-xl">
          <Loader2 className="mx-auto mb-4 animate-spin text-amber-300" size={34} />
          <p className="font-semibold text-slate-300">Verificando tus escuelas...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[75vh] items-center justify-center bg-slate-950 px-4 pt-24 text-white">
        <div className="w-full max-w-xl rounded-[2rem] border border-rose-400/20 bg-rose-500/10 p-8 text-center backdrop-blur-xl">
          <LockKeyhole className="mx-auto mb-4 text-rose-300" size={36} />
          <h1 className="font-sans text-2xl font-bold">No pudimos verificar tu acceso</h1>
          <p className="mt-2 text-sm text-rose-100/80">{error instanceof Error ? error.message : 'Ocurrió un error al consultar las escuelas.'}</p>
          <button type="button" onClick={() => void refetch()} className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-slate-950">
            <RefreshCw size={16} /> Intentar nuevamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#050918] px-4 pb-20 pt-28 text-white sm:px-6">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[-12rem] top-20 size-[28rem] rounded-full bg-indigo-600/20 blur-[120px]" />
        <div className="absolute right-[-10rem] top-[-5rem] size-[26rem] rounded-full bg-amber-400/10 blur-[120px]" />
      </div>

      <main className="relative mx-auto max-w-7xl">
        <header className="mx-auto max-w-3xl text-center">
          <span className="mx-auto flex size-14 items-center justify-center rounded-2xl border border-amber-300/20 bg-amber-300/10 text-amber-300 shadow-xl shadow-amber-500/10 backdrop-blur-xl">
            {mode === 'teacher' ? <BookOpenCheck size={26} /> : <GraduationCap size={27} />}
          </span>
          <p className="mt-5 text-xs font-black uppercase tracking-[0.28em] text-amber-300">Aula Virtual Jerusalén</p>
          <h1 className="mt-3 font-sans text-4xl font-black tracking-tight sm:text-5xl">
            {mode === 'teacher' ? '¿En qué escuela enseñarás hoy?' : 'Elige tu escuela para continuar'}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
            Primero verificamos tu vínculo con la escuela. Así cada persona ve únicamente sus clases, estudiantes y herramientas autorizadas.
          </p>
        </header>

        {schools.length === 0 ? (
          <section className="mx-auto mt-10 max-w-xl rounded-[2rem] border border-white/10 bg-white/5 p-8 text-center backdrop-blur-xl">
            <School className="mx-auto text-slate-400" size={34} />
            <h2 className="mt-4 text-xl font-bold">Aún no hay escuelas activas</h2>
            <p className="mt-2 text-sm text-slate-400">Un administrador debe crear o activar una escuela desde la administración académica.</p>
          </section>
        ) : (
          <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {schools.map((school, index) => {
              const selected = selectedSchoolId === school.id;
              const Icon = school.school_type === 'rank_based' ? ShieldCheck : UsersRound;
              return (
                <motion.button
                  key={school.id}
                  type="button"
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => setSelectedSchoolId(school.id)}
                  className={`group relative min-h-64 overflow-hidden rounded-[2rem] border p-6 text-left transition focus:outline-none focus:ring-4 focus:ring-indigo-500/30 ${selected ? 'border-amber-300/60 bg-white/12 shadow-2xl shadow-indigo-950' : 'border-white/10 bg-white/[0.055] hover:border-white/20 hover:bg-white/[0.08]'}`}
                >
                  {school.cover_image_url && <img src={school.cover_image_url} alt="" className="absolute inset-0 size-full object-cover opacity-15 transition duration-500 group-hover:scale-105" />}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#070b1b] via-[#070b1b]/80 to-transparent" />
                  <div className="relative flex h-full flex-col">
                    <div className="flex items-start justify-between gap-4">
                      <span className="flex size-12 items-center justify-center rounded-2xl border border-white/10 bg-white/10" style={{ color: school.color || '#D4AF37' }}><Icon size={23} /></span>
                      <span className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-wider ${school.accessStatus === 'granted' ? 'border-emerald-400/25 bg-emerald-400/10 text-emerald-300' : school.accessStatus === 'pending' ? 'border-amber-300/25 bg-amber-300/10 text-amber-200' : 'border-white/10 bg-white/5 text-slate-400'}`}>
                        {school.accessStatus === 'granted' ? 'Acceso activo' : school.accessStatus === 'pending' ? 'En revisión' : 'Requiere solicitud'}
                      </span>
                    </div>
                    <div className="mt-auto pt-10">
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-400">{schoolModelLabel(school.school_type)}</p>
                      <h2 className="mt-2 font-sans text-2xl font-black">{school.name}</h2>
                      <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-300">{school.description || 'Formación y acompañamiento para nuestra comunidad.'}</p>
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </div>
        )}

        <AnimatePresence mode="wait">
          {selectedSchool && (
            <motion.section key={selectedSchool.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mx-auto mt-6 max-w-3xl rounded-[2rem] border border-white/10 bg-white/[0.07] p-5 shadow-2xl backdrop-blur-2xl sm:p-7">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-wider text-amber-300">Escuela seleccionada</p>
                  <h3 className="mt-1 text-xl font-bold">{selectedSchool.name}</h3>
                </div>

                {selectedSchool.accessStatus === 'granted' && (
                  <button type="button" onClick={() => setEnteredSchoolId(selectedSchool.id)} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-300 to-amber-500 px-6 py-3 text-sm font-black text-slate-950 shadow-lg shadow-amber-500/20 transition hover:-translate-y-0.5">
                    Entrar a la escuela <ArrowRight size={17} />
                  </button>
                )}
              </div>

              {selectedSchool.accessStatus === 'pending' && (
                <div className="mt-5 flex gap-3 rounded-2xl border border-amber-300/20 bg-amber-300/10 p-4 text-amber-100">
                  <Clock3 className="mt-0.5 shrink-0" size={19} />
                  <div><p className="font-bold">Tu solicitud está siendo revisada</p><p className="mt-1 text-sm text-amber-100/70">Los responsables de la escuela podrán aprobarla desde el panel académico.</p></div>
                </div>
              )}

              {selectedSchool.accessStatus === 'rejected' && (
                <div className="mt-5 rounded-2xl border border-rose-300/20 bg-rose-400/10 p-4 text-sm text-rose-100">
                  La solicitud anterior no fue aprobada. Contacta a un coordinador para revisar tu inscripción.
                </div>
              )}

              {selectedSchool.accessStatus === 'none' && (
                <div className="mt-5 border-t border-white/10 pt-5">
                  <label htmlFor="school-request-message" className="text-sm font-bold text-slate-200">Mensaje para los encargados <span className="font-normal text-slate-500">(opcional)</span></label>
                  <textarea id="school-request-message" value={message} onChange={(event) => setMessage(event.target.value)} maxLength={500} rows={3} placeholder={mode === 'teacher' ? 'Cuéntanos en qué clase o rango colaborarás...' : 'Cuéntanos por qué deseas ingresar o a qué clase perteneces...'} className="mt-2 w-full resize-none rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10" />
                  <button type="button" disabled={requestAccess.isPending} onClick={() => void sendRequest()} className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-xl bg-indigo-500 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-60">
                    {requestAccess.isPending ? <Loader2 className="animate-spin" size={16} /> : <Send size={16} />} Enviar solicitud
                  </button>
                </div>
              )}

            </motion.section>
          )}
        </AnimatePresence>

        {selectedSchool && (
          <button type="button" onClick={() => setSelectedSchoolId(null)} className="mx-auto mt-5 flex items-center gap-2 text-sm font-semibold text-slate-400 hover:text-white"><ArrowLeft size={15} /> Cambiar selección</button>
        )}
      </main>
    </div>
  );
}
