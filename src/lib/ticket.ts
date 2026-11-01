import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

// Foto del ticket de s'Estatua. Se guarda aparte del pedido (config/ticket_<id>) para que la lista
// de pedidos, que la app escucha entera, no cargue fotos. Las reglas de Firestore ya permiten "config".
export const RESTAURANTE_CON_TICKET = 'restaurant2';

const MAX_LADO = 1568; // el lado más largo que aprovecha la IA al leer; la letra a mano necesita resolución
const MAX_CARACTERES = 900_000; // un documento de Firestore admite como mucho 1 MiB

export interface LecturaTicket {
  telefono: string | null;
  direccion: string | null;
  importe: number | null;
  nombre: string | null;
  dudas: string | null; // lo que la IA no está segura de haber leído bien
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

export async function guardarTicket(orderId: string, imagen: string, datos: { orderNumber: string; restaurantId: string }) {
  await setDoc(doc(db, 'config', `ticket_${orderId}`), {
    imagen,
    orderId,
    orderNumber: datos.orderNumber,
    restaurantId: datos.restaurantId,
    guardadoEn: new Date().toISOString(),
  });
}

export async function cargarTicket(orderId: string): Promise<string | null> {
  const snap = await getDoc(doc(db, 'config', `ticket_${orderId}`));
  return snap.exists() ? (snap.data().imagen as string) : null;
}

// Pide a la IA (api/leer-ticket) que lea teléfono, dirección, importe y nombre de la foto.
export async function leerTicket(imagen: string): Promise<LecturaTicket | { error: string }> {
  try {
    const r = await fetch('/api/leer-ticket', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imagen }),
    });
    const datos = await r.json().catch(() => ({ error: 'Respuesta no válida' }));
    return r.ok ? datos : { error: datos.error || `Error ${r.status}` };
  } catch {
    return { error: 'Sin conexión' };
  }
}

// Todas las entregas de s'Estatua son en Llucmajor: si el papel no lo dice, se añade para que
// Google Maps y Waze no lleven a una calle con el mismo nombre en otro pueblo.
export function direccionCompleta(address: string, restaurantId?: string): string {
  if (restaurantId !== RESTAURANTE_CON_TICKET) return address;
  const sinTildes = address.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  return sinTildes.includes('llucmajor') ? address : `${address}, Llucmajor, Illes Balears`;
}

export const enlaceGoogleMaps = (address: string, restaurantId?: string) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(direccionCompleta(address, restaurantId))}`;

export const enlaceWaze = (address: string, restaurantId?: string) =>
  `https://waze.com/ul?q=${encodeURIComponent(direccionCompleta(address, restaurantId))}&navigate=yes`;
