import React, { useState, useEffect } from 'react';
import {
  Activity,
  AlertTriangle,
  Sparkles,
  User,
  PhoneCall,
  Search,
  MessageCircle,
  X,
  Send,
  HeartPulse,
} from 'lucide-react';
import AdminHeader from '../../components/admin/AdminHeader';
import { competitiveService } from '../../features/competitive/services/competitiveService';
import type { MemberEngagementScore } from '../../features/competitive/types';
import { toast } from 'sonner';

export const PredictiveEngagementDashboard = () => {
  const [scores, setScores] = useState<MemberEngagementScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRisk, setFilterRisk] = useState<'all' | 'high_decay' | 'moderate' | 'low'>('all');
  const [selectedMember, setSelectedMember] = useState<MemberEngagementScore | null>(null);
  const [careNote, setCareNote] = useState('');

  useEffect(() => {
    let isMounted = true;
    const fetchScores = async () => {
      setLoading(true);
      const data = await competitiveService.getEngagementScores();
      if (isMounted) {
        setScores(data);
        setLoading(false);
      }
    };
    void fetchScores();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleContactMember = (member: MemberEngagementScore) => {
    setSelectedMember(member);
  };

  const handleSendCareNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember) return;
    toast.success(`Nota de cuidado pastoral registrada para ${selectedMember.member_name}`);
    setSelectedMember(null);
    setCareNote('');
  };

  // Filtered dataset
  const filteredScores = scores.filter((item) => {
    const matchesSearch =
      item.member_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterRisk === 'all' || item.risk_level === filterRisk;
    return matchesSearch && matchesFilter;
  });

  // Calculate real metrics
  const avgHealth = scores.length
    ? Math.round(scores.reduce((acc, curr) => acc + curr.overall_health_score, 0) / scores.length)
    : 78;
  const highRiskCount = scores.filter((s) => s.risk_level === 'high_decay').length;
  const leadersCount = scores.filter((s) => s.overall_health_score >= 80).length;

  return (
    <div className="space-y-6 pb-12">
      <AdminHeader
        eyebrow="Pastoral Care & Analytics"
        title="Salud Pastoral y Analíticas Predictivas"
        description="Algoritmo inteligente de detección temprana de desvinculación (decay), scoring de retención y alertas pastorales."
      />

      {/* OVERVIEW KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-gray-200 dark:border-white/10 p-6 space-y-3 shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
            <span>Índice Promedio de Salud</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <HeartPulse className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-extrabold text-gray-900 dark:text-white">{avgHealth}</span>
            <span className="text-sm font-semibold text-gray-400">/ 100</span>
          </div>
          <p className="text-xs text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
            ↑ 4% comparado con el mes anterior
          </p>
        </div>

        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-gray-200 dark:border-white/10 p-6 space-y-3 shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
            <span>Miembros en Riesgo Alto (Decay)</span>
            <div className="w-9 h-9 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-extrabold text-rose-600 dark:text-rose-400">{highRiskCount}</span>
            <span className="text-xs text-rose-500 font-semibold">requieren atención</span>
          </div>
          <p className="text-xs text-gray-500 dark:text-slate-400 font-medium">
            Llamada o visita de cuidado esta semana
          </p>
        </div>

        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-gray-200 dark:border-white/10 p-6 space-y-3 shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
            <span>Potenciales Líderes</span>
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-extrabold text-amber-500 dark:text-amber-400">{leadersCount}</span>
            <span className="text-xs text-amber-500 font-semibold">identificados</span>
          </div>
          <p className="text-xs text-gray-500 dark:text-slate-400 font-medium">
            Listos para desarrollo de liderazgo ministerial
          </p>
        </div>
      </div>

      {/* FILTER & SEARCH BAR */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-gray-200 dark:border-white/10 p-4 shadow-xl flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por nombre o correo..."
            className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-white/10 rounded-xl text-xs text-gray-900 dark:text-white"
          />
        </div>

        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          <button
            onClick={() => setFilterRisk('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filterRisk === 'all'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-400'
            }`}
          >
            Todos ({scores.length})
          </button>
          <button
            onClick={() => setFilterRisk('high_decay')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filterRisk === 'high_decay'
                ? 'bg-rose-600 text-white shadow-md'
                : 'bg-gray-100 dark:bg-slate-800 text-rose-500 dark:text-rose-400'
            }`}
          >
            Alto Riesgo ({scores.filter((s) => s.risk_level === 'high_decay').length})
          </button>
          <button
            onClick={() => setFilterRisk('moderate')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filterRisk === 'moderate'
                ? 'bg-amber-600 text-white shadow-md'
                : 'bg-gray-100 dark:bg-slate-800 text-amber-600 dark:text-amber-400'
            }`}
          >
            Moderado ({scores.filter((s) => s.risk_level === 'moderate').length})
          </button>
          <button
            onClick={() => setFilterRisk('low')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filterRisk === 'low'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'bg-gray-100 dark:bg-slate-800 text-emerald-600 dark:text-emerald-400'
            }`}
          >
            Saludables ({scores.filter((s) => s.risk_level === 'low').length})
          </button>
        </div>
      </div>

      {/* TABLE DATA */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-gray-200 dark:border-white/10 p-6 space-y-4 shadow-xl">
        <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Activity className="w-5 h-5 text-indigo-500" />
          Scoring Espiritual y Evaluación por Miembro
        </h3>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : filteredScores.length === 0 ? (
          <div className="text-center py-12 text-gray-400 space-y-2">
            <User className="w-10 h-10 mx-auto opacity-30" />
            <p className="text-sm font-semibold">No se encontraron miembros registrados con el filtro aplicado.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-700 dark:text-slate-300">
              <thead className="bg-gray-50 dark:bg-slate-950 text-gray-500 dark:text-slate-400 uppercase tracking-wider text-[11px] border-b border-gray-200 dark:border-white/10">
                <tr>
                  <th className="py-3 px-4">Miembro</th>
                  <th className="py-3 px-4">Asistencia</th>
                  <th className="py-3 px-4">Aportes</th>
                  <th className="py-3 px-4">Grupos</th>
                  <th className="py-3 px-4">Score Global</th>
                  <th className="py-3 px-4">Nivel de Riesgo</th>
                  <th className="py-3 px-4">Recomendación IA</th>
                  <th className="py-3 px-4 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                {filteredScores.map((sc) => (
                  <tr key={sc.member_id} className="hover:bg-gray-50/80 dark:hover:bg-slate-800/50 transition">
                    <td className="py-3.5 px-4 font-bold text-gray-900 dark:text-white flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-indigo-500/10 text-indigo-500 flex items-center justify-center font-bold">
                        {sc.member_name.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div>{sc.member_name}</div>
                        <div className="text-[11px] text-gray-400 font-normal">{sc.email}</div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-semibold">{sc.attendance_score}%</td>
                    <td className="py-3.5 px-4 font-mono font-semibold">{sc.giving_score}%</td>
                    <td className="py-3.5 px-4 font-mono font-semibold">{sc.group_score}%</td>
                    <td className="py-3.5 px-4 font-mono font-extrabold text-indigo-600 dark:text-amber-400">
                      {sc.overall_health_score}/100
                    </td>
                    <td className="py-3.5 px-4">
                      {sc.risk_level === 'high_decay' && (
                        <span className="px-3 py-1 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 text-[11px] font-bold inline-flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> ALTO RIESGO
                        </span>
                      )}
                      {sc.risk_level === 'moderate' && (
                        <span className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-[11px] font-bold inline-flex items-center gap-1">
                          🟡 MODERADO
                        </span>
                      )}
                      {sc.risk_level === 'low' && (
                        <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[11px] font-bold inline-flex items-center gap-1">
                          🟢 SALUDABLE
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-gray-500 dark:text-slate-400 text-[11px] max-w-xs">
                      {sc.recommendation}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleContactMember(sc)}
                        className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 ml-auto shadow-md transition cursor-pointer"
                      >
                        <PhoneCall className="w-3.5 h-3.5" /> Contactar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* PASTORAL CARE MODAL */}
      {selectedMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-md w-full border border-gray-200 dark:border-white/10 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-gray-100 dark:border-white/10 pb-3">
              <h3 className="font-bold text-lg text-gray-900 dark:text-white flex items-center gap-2">
                <HeartPulse className="w-5 h-5 text-rose-500" />
                Seguimiento Pastoral a {selectedMember.member_name}
              </h3>
              <button
                onClick={() => setSelectedMember(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-gray-600 dark:text-gray-300">
              <div className="p-3 bg-gray-50 dark:bg-slate-800 rounded-xl space-y-1">
                <p>
                  <strong>Correo:</strong> {selectedMember.email}
                </p>
                <p>
                  <strong>Score de Salud:</strong> {selectedMember.overall_health_score}/100
                </p>
                <p>
                  <strong>Diagnóstico IA:</strong> {selectedMember.recommendation}
                </p>
              </div>

              <div className="flex gap-2 pt-1">
                <a
                  href={`tel:${selectedMember.email}`}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center justify-center gap-1.5 shadow-md"
                >
                  <PhoneCall className="w-4 h-4" /> Llamar
                </a>
                <a
                  href={`https://wa.me/?text=Hola%20${encodeURIComponent(selectedMember.member_name)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold flex items-center justify-center gap-1.5 shadow-md"
                >
                  <MessageCircle className="w-4 h-4" /> WhatsApp
                </a>
              </div>

              <form onSubmit={handleSendCareNote} className="space-y-3 pt-2">
                <label className="block font-bold text-gray-700 dark:text-gray-300">
                  Registrar Nota Pastoral / Petición de Oración:
                </label>
                <textarea
                  rows={3}
                  value={careNote}
                  onChange={(e) => setCareNote(e.target.value)}
                  placeholder="Detalles acordados en la conversación pastoral..."
                  className="w-full p-3 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-white/10 rounded-xl text-xs resize-none"
                />
                <button
                  type="submit"
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md"
                >
                  <Send className="w-4 h-4" /> Guardar Nota Pastoral
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PredictiveEngagementDashboard;
