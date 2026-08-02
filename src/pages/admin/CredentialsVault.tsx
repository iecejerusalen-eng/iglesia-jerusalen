import React from 'react';
import AdminHeader from '../../components/admin/AdminHeader';
import { AnimeFadeUp } from '../../components/animations/AnimeWrappers';
import { ShieldAlert, LockKeyhole } from 'lucide-react';

export default function CredentialsVault() {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-4 sm:p-8 space-y-8">
      <AdminHeader
        title="Bóveda de Credenciales"
        description="Módulo desactivado temporalmente."
      />

      <AnimeFadeUp>
        <div className="bg-red-950/20 border border-red-900/50 rounded-3xl p-12 text-center space-y-6 max-w-2xl mx-auto mt-12">
          <div className="flex justify-center relative">
            <ShieldAlert className="w-20 h-20 text-red-500 animate-pulse" />
            <LockKeyhole className="w-8 h-8 text-slate-300 absolute -bottom-2 -right-2 bg-slate-900 rounded-full p-1 border border-red-500" />
          </div>

          <div className="space-y-3">
            <h2 className="text-2xl font-bold text-slate-100">
              Módulo Desactivado por Seguridad
            </h2>
            <p className="text-slate-400 text-base leading-relaxed">
              La Bóveda de Credenciales ha sido temporalmente deshabilitada como medida de seguridad tras una auditoría reciente. Se está implementando un nuevo sistema de cifrado asimétrico y almacenamiento seguro para garantizar la protección de todas las contraseñas.
            </p>
          </div>

          <div className="bg-slate-900/50 border border-slate-700 rounded-xl p-4 text-sm text-slate-300 text-left space-y-2">
            <p className="font-semibold text-amber-400">¿Qué significa esto?</p>
            <ul className="list-disc list-inside space-y-1 text-slate-400">
              <li>El acceso a las credenciales almacenadas ha sido revocado.</li>
              <li>No es posible crear ni editar nuevos accesos.</li>
              <li>Si necesitas recuperar una contraseña crítica, contacta al administrador del sistema.</li>
            </ul>
          </div>
        </div>
      </AnimeFadeUp>
    </div>
  );
}
