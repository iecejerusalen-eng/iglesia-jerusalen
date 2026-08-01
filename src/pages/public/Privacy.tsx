import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { fadeInUp, staggerContainer } from '../../utils/animations';
import { Shield, Lock, Database, Eye } from 'lucide-react';

export const Privacy = () => {
  return (
    <>
      <Helmet>
        <title>Políticas de Privacidad | Iglesia Jerusalén</title>
        <meta name="description" content="Políticas de privacidad y protección de datos de la Iglesia Jerusalén." />
      </Helmet>

      <div className="pt-32 pb-20 min-h-screen bg-slate-50 dark:bg-slate-900/50 transition-colors duration-500">
        <div className="max-w-4xl mx-auto px-4 md:px-8">
          <motion.div 
            initial="initial"
            animate="animate"
            variants={staggerContainer}
            className="bg-white dark:bg-slate-800 rounded-3xl p-8 md:p-12 shadow-sm border border-slate-200 dark:border-slate-700/50 relative overflow-hidden"
          >
            {/* Background elements */}
            <div className="absolute bottom-0 left-0 w-80 h-80 bg-emerald-50 dark:bg-emerald-900/10 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4 pointer-events-none" />
            
            <motion.div variants={fadeInUp} className="relative z-10 mb-12 border-b border-slate-100 dark:border-slate-700/50 pb-8">
              <div className="inline-flex items-center justify-center p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-2xl mb-6">
                <Shield className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h1 className="text-3xl md:text-5xl font-serif font-bold text-slate-900 dark:text-white mb-4">
                Políticas de Privacidad
              </h1>
              <p className="text-slate-500 dark:text-slate-400">
                Su privacidad y confianza son nuestra prioridad.
              </p>
            </motion.div>

            <motion.div variants={fadeInUp} className="prose prose-slate dark:prose-invert prose-emerald max-w-none relative z-10 prose-headings:font-serif prose-headings:font-bold">
              
              <p className="lead text-lg">
                En la Iglesia del Evangelio Cuadrangular Jerusalén, nos tomamos muy en serio la protección de los datos personales de nuestra congregación y visitantes. Esta política explica cómo recopilamos, usamos y protegemos su información.
              </p>

              <div className="my-8 p-6 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-700/50">
                <h3 className="flex items-center gap-2 mt-0 mb-4 text-slate-900 dark:text-white">
                  <Database className="w-5 h-5 text-emerald-500" />
                  1. Información que Recopilamos
                </h3>
                <ul className="mb-0 text-sm md:text-base text-slate-600 dark:text-slate-300 space-y-2">
                  <li><strong>Información de Registro:</strong> Al crear una cuenta para el Aula Virtual, Tienda o para administrar sus diezmos, recopilamos su nombre, correo electrónico y número de teléfono.</li>
                  <li><strong>Información Espiritual/Pastoral:</strong> Las peticiones de oración enviadas pueden contener información personal o sensible, la cual tratamos con sumo respeto y confidencialidad.</li>
                  <li><strong>Datos de Transacción:</strong> Al realizar donaciones o compras, procesamos información de pago a través de pasarelas seguras (no almacenamos números de tarjetas de crédito).</li>
                </ul>
              </div>

              <h3 className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-emerald-500" />
                2. Uso de la Información
              </h3>
              <p>
                Utilizamos sus datos personales exclusivamente para los siguientes propósitos:
              </p>
              <ul>
                <li>Proveer acceso al Aula Virtual (LMS) y seguimiento académico.</li>
                <li>Procesar sus donaciones, diezmos y compras en la Tienda, enviando los recibos correspondientes.</li>
                <li>Mantenerle informado sobre eventos, sermones y noticias de la iglesia.</li>
                <li>Orar por sus peticiones (si decide compartirlas públicamente, serán visibles para la comunidad).</li>
              </ul>

              <div className="my-8 p-6 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-700/50">
                <h3 className="flex items-center gap-2 mt-0 mb-4 text-slate-900 dark:text-white">
                  <Lock className="w-5 h-5 text-emerald-500" />
                  3. Protección y Seguridad
                </h3>
                <p className="mb-0 text-sm md:text-base text-slate-600 dark:text-slate-300">
                  Implementamos medidas de seguridad técnicas y organizativas, incluyendo el uso de bases de datos seguras (Supabase) y cifrado en tránsito (HTTPS), para proteger su información contra accesos no autorizados, alteración, divulgación o destrucción. 
                  <br/><br/>
                  <strong>No vendemos, alquilamos ni compartimos su información personal con terceros</strong> con fines comerciales.
                </p>
              </div>

              <h3>4. Retención de Datos</h3>
              <p>
                Mantendremos su información personal mientras su cuenta esté activa o según sea necesario para proporcionarle nuestros servicios, cumplir con nuestras obligaciones legales, resolver disputas y hacer cumplir nuestros acuerdos.
              </p>

              <h3>5. Sus Derechos</h3>
              <p>
                Usted tiene el derecho de solicitar el acceso, corrección o eliminación de sus datos personales almacenados en nuestra plataforma en cualquier momento. Puede ejercer estos derechos contactando a la administración.
              </p>

              <hr className="my-10 border-slate-200 dark:border-slate-700/50" />
              
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Para consultas sobre el manejo de sus datos personales, por favor comuníquese a <em>iece_jerusalen@hotmail.com</em>.
              </p>

            </motion.div>
          </motion.div>
        </div>
      </div>
    </>
  );
};
