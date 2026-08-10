import { useCallback, useEffect, useMemo, useState } from 'react';
import { Command } from 'cmdk';
import { ArrowRight, CalendarDays, ExternalLink, Phone, Search, ShieldCheck, UserRound, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ADMIN_MODULES, MODULE_GROUPS, getAdminModulePermission } from '../../config/adminModules';
import { supabase } from '../../config/supabase';
import { usePermissions } from '../../hooks/usePermissions';
import { formatWhatsAppLink } from '../../utils/whatsapp';

interface MemberSearchResult {
  id: string;
  first_name: string;
  last_name: string;
  photo_url: string | null;
  phone: string | null;
  phone_country_code: string | null;
  birth_date: string | null;
  member_emails: Array<{ email: string }> | null;
}

export default function CommandMenu() {
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();
  const [open, setOpen] = useState(false);
  const [members, setMembers] = useState<MemberSearchResult[]>([]);
  const [selectedMember, setSelectedMember] = useState<MemberSearchResult | null>(null);
  const [loadingMembers, setLoadingMembers] = useState(false);

  const visibleModules = useMemo(() => ADMIN_MODULES.filter((module) => module.available !== false && hasPermission(getAdminModulePermission(module), 'view')), [hasPermission]);
  const visibleGroups = useMemo(() => MODULE_GROUPS.map((group) => ({ ...group, items: visibleModules.filter((module) => module.group === group.key) })).filter((group) => group.items.length), [visibleModules]);
  const canSearchMembers = hasPermission('members', 'view');

  const fetchMembers = useCallback(async () => {
    if (!canSearchMembers) return;
    setLoadingMembers(true);
    const { data, error } = await supabase.from('members').select('id,first_name,last_name,photo_url,phone,phone_country_code,birth_date,member_emails(email)').is('deleted_at', null).order('last_name').limit(120);
    setLoadingMembers(false);
    if (error) { console.error('No se pudo cargar el buscador de miembros.', error); toast.error('No se pudo actualizar el buscador del CRM.'); return; }
    setMembers((data ?? []) as MemberSearchResult[]);
  }, [canSearchMembers]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === 'k' && (event.metaKey || event.ctrlKey)) { event.preventDefault(); setOpen((current) => !current); }
      if (event.key === 'Escape') { setSelectedMember(null); setOpen(false); }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  useEffect(() => {
    const openMenu = () => setOpen(true);
    window.addEventListener('admin-command-menu:open', openMenu);
    return () => window.removeEventListener('admin-command-menu:open', openMenu);
  }, []);

  useEffect(() => {
    if (!open || !canSearchMembers || members.length) return;
    const timer = window.setTimeout(() => { void fetchMembers(); }, 0);
    return () => window.clearTimeout(timer);
  }, [canSearchMembers, fetchMembers, members.length, open]);

  const goTo = (path: string) => { navigate(path); setSelectedMember(null); setOpen(false); };
  const displayDate = (date: string | null) => date ? new Date(`${date}T12:00:00`).toLocaleDateString('es-EC', { day: 'numeric', month: 'long' }) : 'No registrada';

  if (!open) return null;
  return <div className="fixed inset-0 z-[160] flex items-start justify-center bg-slate-950/65 p-3 pt-[8vh] backdrop-blur-md sm:p-6" onMouseDown={() => { setSelectedMember(null); setOpen(false); }}><div className="w-full max-w-3xl overflow-hidden rounded-[1.75rem] border border-white/10 bg-[#08142d]/95 text-white shadow-[0_35px_100px_rgba(0,0,0,.55)] backdrop-blur-2xl" onMouseDown={(event) => event.stopPropagation()} role="dialog" aria-modal="true" aria-label="Buscar herramientas del panel">
    {selectedMember ? <section className="p-5 sm:p-7"><button type="button" onClick={() => setSelectedMember(null)} className="text-xs font-bold text-slate-400 hover:text-white">← Volver a resultados</button><div className="mt-6 flex flex-col gap-6 sm:flex-row sm:items-start"><div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white/10 text-xl font-black">{selectedMember.photo_url ? <img src={selectedMember.photo_url} alt="" className="h-full w-full object-cover" /> : `${selectedMember.first_name[0] ?? ''}${selectedMember.last_name[0] ?? ''}`}</div><div className="min-w-0 flex-1"><span className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[.18em] text-amber-300"><ShieldCheck size={13} /> Dato real del CRM</span><h2 className="mt-2 font-serif text-3xl font-bold">{selectedMember.first_name} {selectedMember.last_name}</h2><div className="mt-5 grid gap-3 sm:grid-cols-2"><Info icon={Phone} label="Teléfono" value={selectedMember.phone || 'No registrado'} /><Info icon={CalendarDays} label="Cumpleaños" value={displayDate(selectedMember.birth_date)} /></div><div className="mt-5 flex flex-wrap gap-2">{selectedMember.phone && <a href={formatWhatsAppLink(selectedMember.phone, selectedMember.phone_country_code)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-3 text-xs font-bold text-white">Abrir WhatsApp <ExternalLink size={14} /></a>}<button type="button" onClick={() => goTo('/admin/miembros')} className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-xs font-bold">Abrir CRM <ArrowRight size={14} /></button></div></div></div></section> : <Command label="Buscador global del panel" className="w-full"><div className="flex items-center gap-3 border-b border-white/10 px-4 sm:px-5"><Search size={19} className="shrink-0 text-slate-400" /><Command.Input autoFocus placeholder="Busca una herramienta o miembro…" className="h-16 min-w-0 flex-1 bg-transparent text-sm font-semibold text-white outline-none placeholder:text-slate-500" /><kbd className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-[10px] text-slate-400">ESC</kbd><button type="button" onClick={() => setOpen(false)} className="rounded-lg p-2 text-slate-400 hover:bg-white/10 hover:text-white" aria-label="Cerrar"><X size={17} /></button></div><Command.List className="max-h-[min(68vh,38rem)] overflow-y-auto p-3"><Command.Empty className="p-10 text-center text-sm text-slate-400">No encontramos una herramienta disponible para tu rol.</Command.Empty>{visibleGroups.map((group) => <Command.Group key={group.key} heading={group.label} className="mb-3 [&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-2 [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:font-black [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-[.16em] [&_[cmdk-group-heading]]:text-slate-500">{group.items.map((module) => <Command.Item key={module.id} value={`${module.name} ${module.label} ${group.label}`} onSelect={() => goTo(module.path)} className="group flex min-h-12 cursor-pointer items-center gap-3 rounded-xl px-3 text-sm text-slate-300 outline-none data-[selected=true]:bg-white/10 data-[selected=true]:text-white"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 text-amber-300"><module.icon size={17} /></span><span className="min-w-0 flex-1 truncate font-semibold">{module.name}</span><ArrowRight size={15} className="opacity-0 transition group-data-[selected=true]:opacity-100" /></Command.Item>)}</Command.Group>)}{canSearchMembers && <Command.Group heading="Miembros del CRM" className="[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-2 [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:font-black [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-[.16em] [&_[cmdk-group-heading]]:text-slate-500">{loadingMembers ? <div className="p-5 text-center text-xs text-slate-500">Actualizando miembros…</div> : members.map((member) => <Command.Item key={member.id} value={`${member.first_name} ${member.last_name} ${member.phone ?? ''} ${member.member_emails?.[0]?.email ?? ''}`} onSelect={() => setSelectedMember(member)} className="flex min-h-12 cursor-pointer items-center gap-3 rounded-xl px-3 text-sm text-slate-300 outline-none data-[selected=true]:bg-white/10 data-[selected=true]:text-white"><span className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl bg-blue-400/10 text-xs font-black text-blue-300">{member.photo_url ? <img src={member.photo_url} alt="" className="h-full w-full object-cover" /> : `${member.first_name[0] ?? ''}${member.last_name[0] ?? ''}`}</span><span className="min-w-0 flex-1"><strong className="block truncate text-xs">{member.first_name} {member.last_name}</strong><span className="block truncate text-[10px] text-slate-500">{member.phone || member.member_emails?.[0]?.email || 'Sin contacto registrado'}</span></span><UserRound size={15} /></Command.Item>)}</Command.Group>}</Command.List></Command>}
  </div></div>;
}

function Info({ icon: Icon, label, value }: { icon: typeof Phone; label: string; value: string }) { return <div className="rounded-xl border border-white/10 bg-white/5 p-4"><span className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-slate-500"><Icon size={13} />{label}</span><strong className="mt-2 block text-sm">{value}</strong></div>; }
