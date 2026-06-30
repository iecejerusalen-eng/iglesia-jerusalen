import { useState } from 'react';
import { motion } from 'framer-motion';
import { ShoppingBag, Landmark, WifiOff, Banknote, ChevronRight, Package, CheckCircle, Clock, XCircle } from 'lucide-react';

const productSteps = [
  { n: '1', title: 'Ir a Tienda Admin', desc: 'En Panel Admin → Tienda → Gestor de Productos. Haz clic en "+ Nuevo Producto".' },
  { n: '2', title: 'Datos del Producto', desc: 'Escribe el nombre, descripción, categoría (Libros, Recursos, Ropa) y el precio en la moneda local configurada.' },
  { n: '3', title: 'Imagen y Stock', desc: 'Sube la imagen desde Cloudinary. Define el stock inicial (ej. 50 unidades). El sistema descuenta automáticamente al confirmar cada venta.' },
  { n: '4', title: 'Publicar', desc: 'Activa el botón "Visible al público" y el producto aparecerá en la tienda inmediatamente.' },
];

const orders = [
  { name: 'María G.', product: 'Biblia de Estudio', status: 'Completada', color: 'text-green-600 dark:text-green-400', icon: <CheckCircle className="w-4 h-4" /> },
  { name: 'Carlos R.', product: 'Libro de Liderazgo', status: 'Pendiente', color: 'text-yellow-600 dark:text-yellow-400', icon: <Clock className="w-4 h-4" /> },
  { name: 'Ana M.', product: 'Camiseta Iglesia', status: 'Cancelada', color: 'text-red-600 dark:text-red-400', icon: <XCircle className="w-4 h-4" /> },
];

export default function Section6StoreFinance({ onNext }: { onNext: () => void }) {
  const [activeStep, setActiveStep] = useState(0);

  return (
    <div className="w-full h-full flex flex-col p-6 md:p-10 overflow-y-auto custom-scrollbar scrollable-content">

      {/* Header */}
      <div className="max-w-6xl w-full mb-10">
        <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 mb-4 font-semibold text-sm">
          <Landmark className="w-5 h-5" /> Comercio y Tesorería
        </div>
        <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white mb-4">Gestión de Tienda y Finanzas</h2>
        <p className="text-lg text-gray-600 dark:text-gray-400 max-w-3xl">
          Desde vender libros de estudio hasta registrar diezmos y generar reportes mensuales para la junta, 
          todo el manejo económico de la iglesia está centralizado en dos módulos dedicados.
        </p>
      </div>

      {/* Product creation guide */}
      <div className="w-full max-w-6xl mb-12">
        <div className="flex items-center gap-3 mb-2">
          <Package className="w-6 h-6 text-green-500" />
          <h3 className="text-2xl font-bold dark:text-white">Guía: Crear un Producto en la Tienda</h3>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Para el Administrador de Tienda.</p>
        <div className="grid grid-cols-4 gap-3 mb-6">
          {productSteps.map((s, i) => (
            <button key={i} onClick={() => setActiveStep(i)}
              className={`p-3 rounded-xl text-left transition-all ${activeStep === i ? 'bg-green-600 text-white shadow-lg' : 'glass-panel hover:scale-105'}`}>
              <div className={`text-lg font-black mb-1 ${activeStep === i ? 'text-white' : 'text-gray-400 dark:text-slate-500'}`}>0{s.n}</div>
              <div className={`text-xs font-bold leading-tight ${activeStep === i ? 'text-white' : 'dark:text-gray-200'}`}>{s.title}</div>
            </button>
          ))}
        </div>
        <motion.div key={activeStep} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
          className="glass-panel p-6 rounded-2xl border-l-4 border-l-green-500">
          <h4 className="font-bold text-lg dark:text-white mb-2">Paso {productSteps[activeStep].n}: {productSteps[activeStep].title}</h4>
          <p className="text-gray-600 dark:text-gray-300">{productSteps[activeStep].desc}</p>
        </motion.div>
      </div>

      {/* Orders management + Offline First */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12 w-full max-w-6xl">

        {/* Orders Table */}
        <div className="glass-card p-6 rounded-3xl">
          <h3 className="text-xl font-bold dark:text-white mb-2 flex items-center gap-2"><ShoppingBag className="w-5 h-5 text-green-500" /> Gestión de Órdenes</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Cuando un cliente sube su comprobante de pago, el administrador recibe una alerta y puede cambiar el estado de la orden.
          </p>
          <div className="rounded-xl overflow-hidden border border-gray-200 dark:border-slate-700">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-slate-800">
                <tr>
                  <th className="text-left px-4 py-2 text-xs text-gray-500 font-bold">Cliente</th>
                  <th className="text-left px-4 py-2 text-xs text-gray-500 font-bold">Producto</th>
                  <th className="text-left px-4 py-2 text-xs text-gray-500 font-bold">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                {orders.map((o, i) => (
                  <tr key={i} className="hover:bg-gray-50 dark:hover:bg-slate-800/40">
                    <td className="px-4 py-3 font-medium dark:text-white">{o.name}</td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{o.product}</td>
                    <td className={`px-4 py-3 font-bold flex items-center gap-1 ${o.color}`}>{o.icon}{o.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">Al marcar una orden como "Completada", el sistema descuenta el stock automáticamente y notifica al comprador.</p>
        </div>

        {/* Finance Dashboard */}
        <div className="flex flex-col gap-5">
          <div className="glass-card p-6 rounded-3xl border-t-4 border-t-emerald-500">
            <div className="flex items-center gap-3 mb-4">
              <Banknote className="w-7 h-7 text-emerald-500" />
              <h3 className="text-xl font-bold dark:text-white">Dashboard del Tesorero</h3>
            </div>
            <ul className="space-y-3">
              {[
                'Registrar diezmos, ofrendas y donaciones especiales con descripción.',
                'Ver el historial completo de ingresos filtrado por mes, tipo o donante.',
                'Generar reportes en PDF o Excel para la junta directiva.',
                'Los congregantes pueden subir comprobantes de transferencia bancaria.',
              ].map((item, i) => (
                <li key={i} className="flex gap-3 text-sm text-gray-600 dark:text-gray-300">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0" />{item}
                </li>
              ))}
            </ul>
          </div>

          <div className="glass-card p-6 rounded-3xl">
            <div className="flex items-center gap-3 mb-3">
              <WifiOff className="w-6 h-6 text-gray-400" />
              <h3 className="text-lg font-bold dark:text-white">Tienda Offline-First</h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              El carrito de compras usa Zustand con persistencia en Local Storage. Si el usuario pierde 
              conexión a internet, el carrito sobrevive. Al recuperar señal, los datos se sincronizan 
              automáticamente con la base de datos de Supabase.
            </p>
          </div>
        </div>
      </div>

      <motion.button onClick={onNext} className="mb-20 self-start flex items-center gap-2 px-8 py-4 rounded-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold hover:shadow-xl transition-all">
        Ver Herramientas de Diseño <ChevronRight className="w-5 h-5" />
      </motion.button>
    </div>
  );
}
