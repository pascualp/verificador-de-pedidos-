import { useEffect, useState } from 'react';
import { collection, onSnapshot, orderBy, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import { Order } from '../types';

// La app solo tiene en vivo los últimos 500 pedidos. Para el historial se piden a la base
// los de las fechas elegidas, solo mientras se está mirando. No se mezclan con la lista
// general para no tocar las cajas ni la numeración.
export function useHistorial(enVivo: Order[] | undefined, desde: string, hasta: string, activo: boolean): Order[] {
  const [antiguos, setAntiguos] = useState<Order[]>([]);

  useEffect(() => {
    setAntiguos([]);
    if (!activo || !desde || !hasta) return;
    // Margen: el historial cuenta por el día de asignación, que puede ser posterior al de creación
    const inicio = new Date(`${desde}T00:00:00`);
    const fin = new Date(`${hasta}T23:59:59`);
    if (isNaN(inicio.getTime()) || isNaN(fin.getTime()) || inicio > fin) return;
    inicio.setDate(inicio.getDate() - 2);
    fin.setDate(fin.getDate() + 1);
    const consulta = query(
      collection(db, 'orders'),
      where('createdAt', '>=', inicio.toISOString()),
      where('createdAt', '<=', fin.toISOString()),
      orderBy('createdAt', 'desc')
    );
    return onSnapshot(consulta, (snapshot) => {
      setAntiguos(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Order)));
    }, (error) => console.error('No se pudo cargar el historial', error));
  }, [desde, hasta, activo]);

  const porId = new Map<string, Order>();
  antiguos.forEach(o => porId.set(o.id, o));
  (enVivo || []).forEach(o => porId.set(o.id, o));
  return Array.from(porId.values());
}