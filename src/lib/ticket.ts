import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';

// Foto del ticket de s'Estatua. Se guarda aparte del pedido (config/ticket_<id>) para que la lista
// de pedidos, que la app escucha entera, no cargue fotos. Las reglas de Firestore ya permiten "config".
export const RESTAURANTE_CON_TICKET = 'restaurant2';

const MAX_LADO = 1568; // el lado más largo que aprovecha la IA al leer; la letra a mano necesita resolución
const MAX_CARACTERES = 900_000; // un documento de Firestore admite como mucho 1 MiB

export interface LecturaTicket {
  telefono: string | null;
  direccion: string | null; // solo la calle y el número de la casa
  piso: string | null; // piso, puerta o escalera, aparte: al GPS no le sirve
  importe: number | null;
  nombre: string | null;
  numero: string | null; // el número rojo del talonario de la comanda
  dudas: string | null; // lo que la IA no está segura de haber leído bien
}

// Los pedidos de s'Estatua llevan de número el del talonario (unas 7 cifras); los que numera la app van de 1000 en adelante.
export const esNumeroTalonario = (numero: string) => /^\d{6,}$/.test(numero);

// La dirección del pedido es la calle con el número de la casa; el piso va detrás entre paréntesis,
// "Migjorn 12B (2h)", para que el repartidor lo vea y Google Maps y Waze no lo reciban (ver direccionCompleta).
export const direccionConPiso = (direccion: string, piso?: string | null) => (piso ? `${direccion} (${piso})` : direccion);

// Junta lo leído en varias fotos del mismo pedido (la comanda y el ticket, o los dos papeles en una sola foto).
// La dirección se toma de la lectura más larga: donde el ticket tapa parte de la comanda, sale cortada.
export function unirLecturas(lecturas: LecturaTicket[]): LecturaTicket {
  const primera = <K extends keyof LecturaTicket>(campo: K) => lecturas.find((r) => r[campo] != null)?.[campo] ?? null;
  const direcciones = lecturas.map((r) => r.direccion).filter((d): d is string => !!d);
  return {
    telefono: primera('telefono'),
    direccion: direcciones.sort((a, b) => b.length - a.length)[0] ?? null,
    piso: primera('piso'),
    importe: primera('importe'),
    nombre: primera('nombre'),
    numero: primera('numero'),
    dudas: lecturas.map((r) => r.dudas).filter(Boolean).join('; ') || null,
  };
}

async function aDataUrl(archivo: File, lado: number, calidad: number): Promise<string> {
  const bitmap = await createImageBitmap(archivo); // respeta la orientación de la cámara
  const escala = Math.min(1, lado / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * escala);
  canvas.height = Math.round(bitmap.height * escala);
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return canvas.toDataURL('image/jpeg', calidad);
}

// Achica la foto del móvil (varios MB) a un JPEG que quepa en un documento.
export async function comprimirFoto(archivo: File): Promise<string> {
  let foto = await aDataUrl(archivo, MAX_LADO, 0.7);
  if (foto.length > MAX_CARACTERES) foto = await aDataUrl(archivo, 1000, 0.55);
  if (foto.length > MAX_CARACTERES) throw new Error('La foto es demasiado grande');
  return foto;
}

// Hasta dos fotos por pedido: la comanda escrita a mano (dirección y teléfono) y el ticket impreso (precio).
// Cada foto va en su propio documento (ticket_<id> y ticket_<id>_2) porque dos juntas pueden pasar de 1 MiB.
export const MAX_FOTOS = 2;
const idFoto = (orderId: string, i: number) => (i === 0 ? `ticket_${orderId}` : `ticket_${orderId}_${i + 1}`);

// desde: posición de la primera foto (1 para añadir el ticket del precio a un pedido que ya tiene la comanda)
export async function guardarTicket(orderId: string, imagenes: string[], datos: { orderNumber: string; restaurantId: string }, desde = 0) {
  await Promise.all(imagenes.slice(0, MAX_FOTOS - desde).map((imagen, i) =>
    setDoc(doc(db, 'config', idFoto(orderId, i + desde)), {
      imagen,
      orderId,
      orderNumber: datos.orderNumber,
      restaurantId: datos.restaurantId,
      guardadoEn: new Date().toISOString(),
    })
  ));
}

export async function cargarTicket(orderId: string): Promise<string[]> {
  const snaps = await Promise.all(Array.from({ length: MAX_FOTOS }, (_, i) => getDoc(doc(db, 'config', idFoto(orderId, i)))));
  return snaps.filter((s) => s.exists()).map((s) => s.data()!.imagen as string);
}

// Escribe SOLO estos campos del pedido (merge). La lectura tarda unos segundos y el pedido puede haber
// cambiado mientras tanto: reescribir el pedido entero con una copia vieja borraría esos cambios.
export async function rellenarPedido(orderId: string, campos: { address?: string; customerPhone?: string; orderNumber?: string }) {
  if (Object.keys(campos).length) await updateDoc(doc(db, 'orders', orderId), campos);
}

// La misma foto girada 90° (grados = 90 o -90), más pequeña: el teléfono suele ir escrito de lado
// en el margen y la IA lo lee mejor de frente. Si el navegador no puede girarla, se manda solo la original.
async function girar(dataUrl: string, grados: 90 | -90, lado = 1200): Promise<string | null> {
  try {
    const img = new Image();
    img.src = dataUrl;
    await img.decode();
    const escala = Math.min(1, lado / Math.max(img.width, img.height));
    const w = Math.round(img.width * escala), h = Math.round(img.height * escala);
    const canvas = document.createElement('canvas');
    canvas.width = h;
    canvas.height = w;
    const ctx = canvas.getContext('2d')!;
    ctx.translate(h / 2, w / 2);
    ctx.rotate((grados * Math.PI) / 180);
    ctx.drawImage(img, -w / 2, -h / 2, w, h);
    return canvas.toDataURL('image/jpeg', 0.7);
  } catch {
    return null;
  }
}

// Pide a la IA (api/leer-ticket) que lea teléfono, dirección, importe y nombre de la foto.
export async function leerTicket(imagen: string): Promise<LecturaTicket | { error: string }> {
  try {
    const giradas = (await Promise.all([girar(imagen, 90), girar(imagen, -90)])).filter((x): x is string => !!x);
    const r = await fetch('/api/leer-ticket', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imagenes: [imagen, ...giradas] }),
    });
    const datos = await r.json().catch(() => ({ error: 'Respuesta no válida' }));
    return r.ok ? datos : { error: datos.error || `Error ${r.status}` };
  } catch {
    return { error: 'Sin conexión' };
  }
}

// Todas las entregas de s'Estatua son en Llucmajor: si el papel no lo dice, se añade para que
// Google Maps y Waze no lleven a una calle con el mismo nombre en otro pueblo.
// Lo que va entre paréntesis (el piso o la puerta) se quita: el GPS solo necesita la calle y el número de la casa.
export function direccionCompleta(address: string, restaurantId?: string): string {
  if (restaurantId !== RESTAURANTE_CON_TICKET) return address;
  const calle = address.replace(/\s*\([^)]*\)/g, '').trim() || address;
  const sinTildes = calle.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  return sinTildes.includes('llucmajor') ? calle : `${calle}, Llucmajor, Illes Balears`;
}

export const enlaceGoogleMaps = (address: string, restaurantId?: string) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(direccionCompleta(address, restaurantId))}`;

export const enlaceWaze = (address: string, restaurantId?: string) =>
  `https://waze.com/ul?q=${encodeURIComponent(direccionCompleta(address, restaurantId))}&navigate=yes`;
