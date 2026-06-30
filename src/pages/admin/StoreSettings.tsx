import { useEffect, useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { supabase } from '../../config/supabase';
import { toast } from 'sonner';
import { AnimeFadeUp } from '../../components/animations/AnimeWrappers';
import AdminHeader from '../../components/admin/AdminHeader';
import { CreditCard, Truck, Plus, Trash2, Save, Loader2 } from 'lucide-react';
import type { StorePaymentMethod, StoreShippingMethod } from '../../types';

interface StoreSettingsForm {
  payment_methods: StorePaymentMethod[];
  shipping_methods: StoreShippingMethod[];
}

const StoreSettings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const { register, control, handleSubmit, reset } = useForm<StoreSettingsForm>({
    defaultValues: {
      payment_methods: [],
      shipping_methods: []
    }
  });

  const { 
    fields: paymentFields, 
    append: appendPayment, 
    remove: removePayment 
  } = useFieldArray({ control, name: 'payment_methods' });

  const { 
    fields: shippingFields, 
    append: appendShipping, 
    remove: removeShipping 
  } = useFieldArray({ control, name: 'shipping_methods' });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('church_settings')
        .select('payment_methods, shipping_methods')
        .eq('id', 1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        reset({
          payment_methods: data.payment_methods || [],
          shipping_methods: data.shipping_methods || []
        });
      }
    } catch (err: any) {
      console.error('Error fetching store settings:', err);
      toast.error('Error al cargar la configuración de tienda: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: StoreSettingsForm) => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('church_settings')
        .upsert({
          id: 1,
          payment_methods: data.payment_methods,
          shipping_methods: data.shipping_methods,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;
      toast.success('Configuración de tienda guardada correctamente.');
    } catch (err: any) {
      console.error('Error saving store settings:', err);
      toast.error('No se pudo guardar la configuración: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  return (
    <AnimeFadeUp className="space-y-6 max-w-5xl pb-20">
      <AdminHeader 
        title="Pagos y Envíos" 
        description="Configura los métodos de pago con sus respectivas comisiones porcentuales y los métodos de envío de la tienda."
      />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        
        {/* Payment Methods */}
        <section className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-100 dark:border-white/5 p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-gray-100 dark:border-white/5 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg">
                <CreditCard size={20} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-800 dark:text-white">Métodos de Pago</h2>
                <p className="text-sm text-gray-500">Agrega o modifica los porcentajes de recargo que asume el cliente.</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => appendPayment({ id: `custom_${Date.now()}`, name: '', active: true, fee_percent: 0 })}
              className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg text-sm font-semibold hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
            >
              <Plus size={16} /> Añadir Método
            </button>
          </div>

          <div className="space-y-4">
            {paymentFields.map((field, index) => (
              <div key={field.id} className="flex flex-col sm:flex-row gap-4 items-start sm:items-center bg-gray-50 dark:bg-slate-800/50 p-4 rounded-xl border border-gray-100 dark:border-white/5">
                <div className="flex-1 w-full">
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Nombre del Método</label>
                  <input
                    {...register(`payment_methods.${index}.name`, { required: true })}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-white/10 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:outline-none"
                    placeholder="Ej. Tarjeta de Crédito"
                  />
                </div>
                <div className="w-full sm:w-32">
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">ID (Sistema)</label>
                  <input
                    {...register(`payment_methods.${index}.id`, { required: true })}
                    className="w-full px-3 py-2 bg-gray-100 dark:bg-slate-700/50 border border-gray-200 dark:border-white/10 rounded-lg text-sm text-gray-500"
                    placeholder="id_unico"
                    readOnly
                  />
                </div>
                <div className="w-full sm:w-32">
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Comisión (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    {...register(`payment_methods.${index}.fee_percent`, { valueAsNumber: true, min: 0, max: 100 })}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-white/10 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:outline-none"
                    placeholder="0.00"
                  />
                </div>
                <div className="flex items-center gap-2 pt-5">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      {...register(`payment_methods.${index}.active`)}
                      className="w-5 h-5 rounded text-primary focus:ring-primary border-gray-300 dark:border-white/10 bg-white dark:bg-slate-800"
                    />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Activo</span>
                  </label>
                  
                  <button
                    type="button"
                    onClick={() => removePayment(index)}
                    className="ml-2 p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                    title="Eliminar"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
            {paymentFields.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-4">No hay métodos de pago configurados.</p>
            )}
          </div>
        </section>

        {/* Shipping Methods */}
        <section className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-100 dark:border-white/5 p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-gray-100 dark:border-white/5 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-lg">
                <Truck size={20} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-800 dark:text-white">Métodos de Envío</h2>
                <p className="text-sm text-gray-500">Configura opciones de entrega o retiro.</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => appendShipping({ id: `shipping_${Date.now()}`, name: '', active: true, base_cost: 0, description: '' })}
              className="flex items-center gap-2 px-3 py-1.5 bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-lg text-sm font-semibold hover:bg-green-100 dark:hover:bg-green-900/50 transition-colors"
            >
              <Plus size={16} /> Añadir Método
            </button>
          </div>

          <div className="space-y-4">
            {shippingFields.map((field, index) => (
              <div key={field.id} className="flex flex-col gap-4 bg-gray-50 dark:bg-slate-800/50 p-4 rounded-xl border border-gray-100 dark:border-white/5">
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                  <div className="flex-1 w-full">
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Nombre</label>
                    <input
                      {...register(`shipping_methods.${index}.name`, { required: true })}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-white/10 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:outline-none"
                      placeholder="Ej. Envío a Domicilio"
                    />
                  </div>
                  <div className="w-full sm:w-32">
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Costo Base ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      {...register(`shipping_methods.${index}.base_cost`, { valueAsNumber: true, min: 0 })}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-white/10 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:outline-none"
                      placeholder="0.00"
                    />
                  </div>
                  <div className="flex items-center gap-2 pt-5">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        {...register(`shipping_methods.${index}.active`)}
                        className="w-5 h-5 rounded text-primary focus:ring-primary border-gray-300 dark:border-white/10 bg-white dark:bg-slate-800"
                      />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Activo</span>
                    </label>
                    
                    <button
                      type="button"
                      onClick={() => removeShipping(index)}
                      className="ml-2 p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                      title="Eliminar"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
                <div className="w-full">
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Descripción Corta (Opcional)</label>
                  <input
                    {...register(`shipping_methods.${index}.description`)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-white/10 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:outline-none"
                    placeholder="Ej. Recibe tu pedido de 2 a 3 días laborables"
                  />
                </div>
              </div>
            ))}
            {shippingFields.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-4">No hay métodos de envío configurados.</p>
            )}
          </div>
        </section>

        {/* Submit Actions */}
        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary-dark text-white rounded-xl font-bold transition-all shadow-md hover:shadow-lg disabled:opacity-50"
          >
            {saving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
            {saving ? 'Guardando...' : 'Guardar Configuración'}
          </button>
        </div>
      </form>
    </AnimeFadeUp>
  );
};

export default StoreSettings;
