import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { fadeInUp, staggerContainer } from '../../utils/animations';
import { ShieldCheck, Scale, CreditCard, BookOpen } from 'lucide-react';

export const Terms = () => {
  return (
    <>
      <Helmet>
        <title>Términos y Condiciones | Iglesia Jerusalén</title>
        <meta name="description" content="Términos y condiciones de uso de la plataforma web de la Iglesia Jerusalén." />
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
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 dark:bg-indigo-900/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
            
            <motion.div variants={fadeInUp} className="relative z-10 mb-12 border-b border-slate-100 dark:border-slate-700/50 pb-8">
              <div className="inline-flex items-center justify-center p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-2xl mb-6">
                <Scale className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
              </div>
              <h1 className="text-3xl md:text-5xl font-serif font-bold text-slate-900 dark:text-white mb-4">
                Términos y Condiciones
              </h1>
              <p className="text-slate-500 dark:text-slate-400">
                Última actualización: Agosto de 2026
              </p>
            </motion.div>

            <motion.div variants={fadeInUp} className="prose prose-slate dark:prose-invert prose-indigo max-w-none relative z-10 prose-headings:font-serif prose-headings:font-bold">
              
              <h3>1. Aceptación de los Términos</h3>
              <p>
                Al acceder y utilizar el portal web de la Iglesia del Evangelio Cuadrangular Jerusalén, usted acepta estar sujeto a estos Términos y Condiciones. Si no está de acuerdo con alguna parte de estos términos, le rogamos que no utilice nuestra plataforma.
              </p>

              <div className="my-8 p-6 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-700/50">
                <h3 className="flex items-center gap-2 mt-0 mb-4 text-slate-900 dark:text-white">
                  <BookOpen className="w-5 h-5 text-indigo-500" />
                  2. Uso del Aula Virtual y Recursos
                </h3>
                <p className="mb-0 text-sm md:text-base text-slate-600 dark:text-slate-300">
                  Todo el contenido educativo, estudios bíblicos, juegos interactivos y sermones compartidos en nuestra plataforma son propiedad intelectual de la iglesia o de sus respectivos autores. Estos recursos se proporcionan de forma gratuita (a menos que se especifique lo contrario en la Tienda) y su uso es exclusivamente para la edificación personal, familiar y comunitaria. Queda prohibida su venta o reproducción comercial sin autorización escrita.
                </p>
              </div>

              <h3>3. Muro de Peticiones</h3>
              <p>
                El muro de oración es un espacio público y sagrado para la comunidad. Nos reservamos el derecho de moderar, editar o eliminar peticiones que contengan lenguaje ofensivo, que violen la privacidad de terceros o que tengan intenciones comerciales (spam). Al publicar una petición en modo público, usted consiente que esta sea visible para otros miembros de la congregación.
              </p>

              <div className="my-8 p-6 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-700/50">
                <h3 className="flex items-center gap-2 mt-0 mb-4 text-slate-900 dark:text-white">
                  <CreditCard className="w-5 h-5 text-emerald-500" />
                  4. Diezmos, Ofrendas y Tienda
                </h3>
                <p className="mb-0 text-sm md:text-base text-slate-600 dark:text-slate-300">
                  Todas las donaciones (diezmos, ofrendas, siembras) realizadas a través de nuestra plataforma son procesadas de manera segura y son de carácter voluntario y no reembolsable. Las adquisiciones en la Tienda de Recursos están sujetas a disponibilidad física o digital. Al realizar una transacción, usted garantiza que está autorizado a utilizar el método de pago seleccionado.
                </p>
              </div>

              <h3 className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-indigo-500" />
                5. Conducta del Usuario
              </h3>
              <p>
                Se espera que todos los usuarios mantengan un comportamiento respetuoso, reflejando los valores cristianos de nuestra congregación. Cualquier forma de acoso, discriminación o comportamiento perjudicial dentro de los espacios interactivos (foros del Aula Virtual, comentarios) resultará en la suspensión inmediata de la cuenta.
              </p>

              <h3>6. Modificaciones a los Términos</h3>
              <p>
                Nos reservamos el derecho de actualizar o modificar estos Términos y Condiciones en cualquier momento sin previo aviso. Los cambios entrarán en vigencia inmediatamente después de su publicación en esta página. Es responsabilidad del usuario revisar periódicamente esta sección.
              </p>

              <hr className="my-10 border-slate-200 dark:border-slate-700/50" />
              
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Si tiene alguna pregunta o inquietud sobre estos Términos, por favor comuníquese con nuestra administración a través de la sección de <strong>Contacto</strong> o escribiendo a <em>iece_jerusalen@hotmail.com</em>.
              </p>

            </motion.div>
          </motion.div>
        </div>
      </div>
    </>
  );
};
