import React, { useState, useEffect } from 'react';
import {
  Activity, AlertTriangle, Sparkles, User, PhoneCall
} from 'lucide-react';
import AdminHeader from '../../components/admin/AdminHeader';
import { competitiveService } from '../../features/competitive/services/competitiveService';
import type { MemberEngagementScore } from '../../features/competitive/types';
import { toast } from 'sonner';

export const PredictiveEngagementDashboard = () => {
  const [scores, setScores] = useState<MemberEngagementScore[]>([]);

  useEffect(() => {
    let isMounted = true;
    const fetchScores = async () => {
      const data = await competitiveService.getEngagementScores();
      if (isMounted) setScores(data);
    };
    void fetchScores();
    return () => { isMounted = false; };
  }, []);

  const handleContactMember = (member: MemberEngagementScore) => {
    toast.info(`Iniciando llamada de cuidado pastoral a ${member.member_name}`);
  };

  return (
    <div className="space-y-6">
      <AdminHeader
        title="Salud Pastoral y Analíticas Predictivas (Predictive Engagement)"
        description="Algoritmo inteligente de detección temprana de desvincularse (decay), scoring de retención y alertas pastorales"
      />

      {/* OVERVIEW STATS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-slate-900/80 rounded-2xl border border-white/10 p-6 space-y-2 backdrop-blur-md">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Índice Promedio de Salud</span>
            <Activity className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-3xl font-extrabold text-white">78/100</p>
          <p className="text-[11px] text-emerald-400">↑ 4% comparado con el mes anterior</p>
        </div>

        <div className="bg-slate-900/80 rounded-2xl border border-white/10 p-6 space-y-2 backdrop-blur-md">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Miembros en Riesgo Alto (Decay)</span>
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          </div>
          <p className="text-3xl font-extrabold text-rose-400">1</p>
          <p className="text-[11px] text-slate-400">Requiere llamada o visita esta semana</p>
        </div>

        <div className="bg-slate-900/80 rounded-2xl border border-white/10 p-6 space-y-2 backdrop-blur-md">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Potenciales Líderes Identificados</span>
            <Sparkles className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-3xl font-extrabold text-amber-300">1</p>
          <p className="text-[11px] text-amber-400/80">Listos para desarrollo ministerial</p>
        </div>
      </div>

      {/* MEMBERS TABLE */}
      <div className="bg-slate-900/80 rounded-2xl border border-white/10 p-6 space-y-4 shadow-xl backdrop-blur-md">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Activity className="w-4 h-4 text-amber-400" /> Scoring Espiritual y Evaluación por Miembro
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider text-[11px] border-b border-white/10">
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
            <tbody className="divide-y divide-white/5">
              {scores.map(sc => (
                <tr key={sc.member_id} className="hover:bg-slate-800/50 transition">
                  <td className="py-3.5 px-4 font-bold text-white flex items-center gap-2">
                    <User className="w-4 h-4 text-slate-500" />
                    <div>
                      <div>{sc.member_name}</div>
                      <div className="text-[11px] text-slate-500 font-normal">{sc.email}</div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 font-mono">{sc.attendance_score}%</td>
                  <td className="py-3.5 px-4 font-mono">{sc.giving_score}%</td>
                  <td className="py-3.5 px-4 font-mono">{sc.group_score}%</td>
                  <td className="py-3.5 px-4 font-mono font-bold text-amber-300">{sc.overall_health_score}/100</td>
                  <td className="py-3.5 px-4">
                    {sc.risk_level === 'high_decay' && (
                      <span className="px-2.5 py-1 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[11px] font-bold">
                        ⚠️ ALTO RIESGO
                      </span>
                    )}
                    {sc.risk_level === 'moderate' && (
                      <span className="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[11px] font-medium">
                        🟡 MODERADO
                      </span>
                    )}
                    {sc.risk_level === 'low' && (
                      <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[11px] font-medium">
                        🟢 SALUDABLE
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-slate-400 text-[11px] max-w-xs">{sc.recommendation}</td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => handleContactMember(sc)}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded-lg text-xs flex items-center gap-1.5 ml-auto transition font-semibold"
                    >
                      <PhoneCall className="w-3.5 h-3.5" /> Contactar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
export default PredictiveEngagementDashboard;
