import { useState } from 'react';
import { toast } from 'sonner';
import type { Widget } from '../types';

export function useNLP() {
  const [searchQuery, setSearchQuery] = useState('');
  const [parsedNLP, setParsedNLP] = useState<Omit<Widget, 'id'> | null>(null);

  const handleNLPSearch = (e: React.FormEvent, forceQuery?: string) => {
    e.preventDefault();
    const query = (forceQuery || searchQuery).toLowerCase();
    
    if (!query.trim()) {
      toast.error('Por favor escribe una consulta para analizar.');
      return;
    }

    toast.info('Analizando lenguaje natural con Asistente Inteligente...', { id: 'nlp' });

    let source: Widget['source'] = 'members';
    let dimension = 'month';
    let metric = 'Conteo';
    let aggregation: Widget['aggregation'] = 'count';
    let targetField = '';
    let chartType: Widget['chartType'] = 'bar';
    let title = query.charAt(0).toUpperCase() + query.slice(1);

    setTimeout(() => {
      if (query.includes('diezmo') || query.includes('ofrenda') || query.includes('ingreso') || query.includes('donacion')) {
        source = 'donations';
        aggregation = 'sum';
        targetField = 'amount';
        metric = 'Total ($)';
        chartType = 'area';
        if (query.includes('mes')) dimension = 'month';
        else if (query.includes('metodo') || query.includes('pago')) dimension = 'payment_method';
        else if (query.includes('estado')) dimension = 'status';
        else if (query.includes('categoria')) dimension = 'category';
        
        if (query.includes('promedio')) {
          aggregation = 'avg';
          metric = 'Promedio ($)';
        }
      } 
      else if (query.includes('inventario') || query.includes('equipo') || query.includes('activo')) {
        source = 'inventory';
        chartType = 'pie';
        if (query.includes('estado')) dimension = 'status';
        else if (query.includes('categoria')) dimension = 'category';
        
        if (query.includes('valor')) {
          aggregation = 'sum';
          targetField = 'price * quantity';
          metric = 'Valor Total ($)';
          chartType = 'bar';
        }
      }
      else if (query.includes('cuestionario') || query.includes('form') || query.includes('nota')) {
        source = 'form_responses';
        chartType = 'bar';
        if (query.includes('mes')) dimension = 'month';
        else if (query.includes('bloque') || query.includes('cuestionario')) dimension = 'block_id';
        
        if (query.includes('promedio') || query.includes('calificacion')) {
          aggregation = 'avg';
          targetField = 'score';
          metric = 'Nota Promedio';
          dimension = 'block_id';
        }
      }
      else if (query.includes('peticion') || query.includes('oracion')) {
        source = 'petitions';
        chartType = 'pie';
        dimension = 'status';
        if (query.includes('mes')) {
          dimension = 'month';
          chartType = 'area';
        }
      }
      else if (query.includes('pedido') || query.includes('tienda')) {
        source = 'orders';
        aggregation = 'sum';
        targetField = 'total';
        chartType = 'bar';
        dimension = 'status';
        if (query.includes('mes')) dimension = 'month';
        if (query.includes('metodo') || query.includes('pago')) dimension = 'payment_method';
      }
      else if (query.includes('alabanza') || query.includes('cancion') || query.includes('himno') || query.includes('musica')) {
        source = 'songs';
        dimension = 'artist';
        chartType = 'bar';
        if (query.includes('bpm') || query.includes('tempo')) {
          dimension = 'bpm_range';
          chartType = 'pie';
        }
      }
      else if (query.includes('evento') || query.includes('calendario')) {
        source = 'events';
        dimension = 'recurrence_type';
        chartType = 'pie';
        if (query.includes('mes')) {
          dimension = 'month';
          chartType = 'line';
        }
      }
      else {
        source = 'members';
        if (query.includes('genero') || query.includes('sexo')) {
          dimension = 'gender';
          chartType = 'pie';
        }
        else if (query.includes('edad') || query.includes('rango')) {
          dimension = 'age_group';
          chartType = 'bar';
        }
        else if (query.includes('rol') || query.includes('lider')) {
          dimension = 'leadership_role';
          chartType = 'pie';
        }
        else if (query.includes('mes') || query.includes('crecimiento')) {
          dimension = 'month';
          chartType = 'line';
        }
      }

      if (query.includes('kpi') || query.includes('total') || query.includes('tarjeta')) {
        chartType = 'kpi';
      }
      if (query.includes('tabla')) {
        chartType = 'table';
      }

      setParsedNLP({
        title,
        source,
        dimension,
        metric,
        aggregation,
        targetField,
        chartType
      });
      
      toast.success('Consulta analizada. Previsualizando resultados.', { id: 'nlp' });
    }, 1500);
  };

  return {
    searchQuery,
    setSearchQuery,
    parsedNLP,
    setParsedNLP,
    handleNLPSearch
  };
}
