import type { Driver, Order } from '../types';

// Caja de los repartidores separada por restaurante.
// Un repartidor puede trabajar en "ambos" restaurantes: antes tenía una sola caja y cerrar turno en uno
// la reiniciaba también para el otro. Ahora cada restaurante lleva y cierra la suya.
//  - driver.totalCollected          = total general (se mantiene como siempre)
//  - driver.collectedByRestaurant   = parte de ese total que pertenece a cada restaurante
//  - driver.shiftStartedAtByRestaurant = inicio de turno de cada restaurante

const REST_DEFAULT = 'restaurant1';

export const restOf = (o: Pick<Order, 'restaurantId'>) => o.restaurantId || REST_DEFAULT;

const sum = (r?: Record<string, number>) => Object.values(r || {}).reduce((a, b) => a + (b || 0), 0);

// Dinero cobrado antes de existir esta separación (no está asignado a ningún restaurante)
const legacyOf = (d: Driver) => (d.totalCollected || 0) - sum(d.collectedByRestaurant);

/** Efectivo cobrado y aún en caja. Sin restaurante = total general del repartidor. */
export function collectedFor(d: Driver, restId?: string): number {
  if (!restId) return d.totalCollected || 0;
  const own = d.collectedByRestaurant?.[restId] || 0;
  const legacy = legacyOf(d);
  // El dinero anterior a la separación se atribuye al restaurante del repartidor; si es de "ambos",
  // se muestra en los dos hasta el primer cierre (que lo liquida).
  const applies = legacy !== 0 && (d.restaurantId === 'ambos' || (d.restaurantId || REST_DEFAULT) === restId);
  return own + (applies ? legacy : 0);
}

/** Importe de los pedidos que lleva ahora mismo (Asignado), opcionalmente solo de un restaurante. */
export function activeFor(orders: Order[] | undefined, d: Driver, restId?: string): number {
  return (orders || [])
    .filter(o => o.driverId === d.id && o.status === 'Asignado' && (!restId || restOf(o) === restId))
    .reduce((s, o) => s + (o.price || 0), 0);
}

export const driverTotal = (orders: Order[] | undefined, d: Driver, restId?: string) =>
  collectedFor(d, restId) + activeFor(orders, d, restId);

/** Suma dinero a la caja de un restaurante (y al total general). Devuelve los campos a guardar. */
export function addCollected(d: Driver, restId: string, amount: number): Pick<Driver, 'totalCollected' | 'collectedByRestaurant'> {
  const by = { ...(d.collectedByRestaurant || {}) };
  by[restId] = (by[restId] || 0) + amount;
  return { totalCollected: (d.totalCollected || 0) + amount, collectedByRestaurant: by };
}

/** Igual que addCollected pero para varias entradas a la vez. */
export function addCollectedBatch(d: Driver, items: { restId: string; amount: number }[]): Pick<Driver, 'totalCollected' | 'collectedByRestaurant'> {
  const by = { ...(d.collectedByRestaurant || {}) };
  let total = d.totalCollected || 0;
  items.forEach(i => { by[i.restId] = (by[i.restId] || 0) + i.amount; total += i.amount; });
  return { totalCollected: total, collectedByRestaurant: by };
}

/** Inicio del turno de un restaurante (si no tiene propio, el general de siempre). */
export const shiftStartFor = (d: Driver, restId?: string) =>
  (restId && d.shiftStartedAtByRestaurant?.[restId]) || d.shiftStartedAt;

/**
 * Cierre de turno. Con restaurante: solo se reinicia la caja de ese restaurante; la del otro no se toca.
 * Sin restaurante: cierre general (como antes).
 */
export function closeShiftPatch(d: Driver, restId?: string): Partial<Driver> {
  const now = new Date().toISOString();
  if (!restId) {
    return { totalCollected: 0, collectedByRestaurant: {}, shiftStartedAt: now, shiftStartedAtByRestaurant: {} };
  }
  const by = { ...(d.collectedByRestaurant || {}), [restId]: 0 };
  // totalCollected pasa a ser lo que queda en los otros restaurantes (el dinero antiguo sin asignar se liquida en este cierre)
  return {
    collectedByRestaurant: by,
    totalCollected: sum(by),
    shiftStartedAtByRestaurant: { ...(d.shiftStartedAtByRestaurant || {}), [restId]: now },
  };
}

/** Entregas del turno (para el desglose del cierre), solo del restaurante indicado. */
export function shiftOrdersFor(orders: Order[] | undefined, d: Driver, restId?: string): Order[] {
  const start = shiftStartFor(d, restId);
  return (orders || []).filter(o =>
    o.driverId === d.id &&
    o.status === 'Entregado' &&
    (!restId || restOf(o) === restId) &&
    (!start || new Date(o.assignedAt || o.createdAt) >= new Date(start))
  );
}
