import { useRef, useState } from 'react';
import { Camera, Loader2, Receipt, X } from 'lucide-react';
import { Order } from '../types';
import { cargarTicket, comprimirFoto, guardarTicket, leerTicket, MAX_FOTOS, rellenarPedido } from '../lib/ticket';

// Cuántas fotos tiene guardadas un pedido (los primeros pedidos con foto no llevaban ticketFotos).
export const fotosDe = (order: Order) => order.ticketFotos ?? (order.hasTicket ? 1 : 0);

// Abre la cámara trasera del móvil (en el ordenador, el selector de fotos) y devuelve la foto ya comprimida.
export function BotonCamara({ onFoto, texto, className }: { onFoto: (foto: string) => void; texto: string; className?: string }) {
  const entrada = useRef<HTMLInputElement>(null);
  const [ocupado, setOcupado] = useState(false);
  return (
    <>
      <input
        ref={entrada}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={async (e) => {
          const archivo = e.target.files?.[0];
          e.target.value = '';
          if (!archivo) return;
          setOcupado(true);
          try {
            onFoto(await comprimirFoto(archivo));
          } catch {
            alert('No se pudo usar esa foto. Prueba a sacarla otra vez.');
          } finally {
            setOcupado(false);
          }
        }}
      />
      <button type="button" onClick={() => entrada.current?.click()} disabled={ocupado} className={className}>
        {ocupado ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
        {texto}
      </button>
    </>
  );
}

// Muestra las fotos guardadas del pedido (comanda y ticket). Solo las descarga cuando alguien las abre.
export function VerTicket({ orderId, orderNumber, className }: { orderId: string; orderNumber: string; className?: string }) {
  const [abierto, setAbierto] = useState(false);
  const [fotos, setFotos] = useState<string[] | undefined>(undefined); // undefined = aún cargando

  const abrir = async () => {
    setAbierto(true);
    try {
      setFotos(await cargarTicket(orderId)); // se vuelve a cargar por si se añadió el ticket del precio
    } catch {
      setFotos((f) => f ?? []);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={abrir}
        className={className ?? 'text-[10px] bg-amber-50 text-amber-700 px-2 py-1 rounded border border-amber-200 hover:bg-amber-100 transition-colors w-fit flex items-center gap-1 font-bold'}
      >
        <Receipt className="w-3 h-3" /> Ver ticket
      </button>
      {abierto && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setAbierto(false)}>
          <div className="w-full max-w-lg max-h-full overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between text-white mb-2">
              <span className="font-bold">Pedido #{orderNumber}</span>
              <button type="button" onClick={() => setAbierto(false)} className="p-2 rounded-full hover:bg-white/10" aria-label="Cerrar">
                <X className="w-5 h-5" />
              </button>
            </div>
            {fotos === undefined ? (
              <p className="text-white text-center py-10">Cargando las fotos…</p>
            ) : fotos.length ? (
              <div className="flex flex-col gap-3">
                {fotos.map((foto, i) => (
                  <img key={i} src={foto} alt={`Foto ${i + 1} del pedido ${orderNumber}`} className="w-full max-h-[80vh] object-contain rounded-lg bg-white" />
                ))}
              </div>
            ) : (
              <p className="text-white text-center py-10">Este pedido no tiene fotos guardadas.</p>
            )}
          </div>
        </div>
      )}
    </>
  );
}

// Para un pedido ya creado: sacar la foto que falta (la comanda, o después el ticket del precio) y guardarla.
// leerDatos (app del repartidor): si al pedido le falta la dirección o el teléfono, la IA los saca de la foto.
// El precio nunca se toca desde aquí, para no descuadrar la caja del repartidor.
export function AdjuntarTicket({ order, updateOrder, className, leerDatos = false }: { order: Order; updateOrder: (o: Order) => void; className?: string; leerDatos?: boolean }) {
  const [estado, setEstado] = useState<'' | 'guardando' | 'leyendo'>('');
  const yaTiene = fotosDe(order);
  if (yaTiene >= MAX_FOTOS) return null;
  return (
    <BotonCamara
      texto={estado === 'guardando' ? 'Guardando…' : estado === 'leyendo' ? 'Leyendo la dirección…' : yaTiene === 0 ? 'Foto ticket' : 'Añadir ticket precio'}
      className={className ?? 'text-[10px] bg-gray-50 text-gray-600 px-2 py-1 rounded border border-dashed border-gray-300 hover:bg-amber-50 hover:text-amber-700 transition-colors w-fit flex items-center gap-1'}
      onFoto={async (foto) => {
        setEstado('guardando');
        try {
          await guardarTicket(order.id, [foto], order, yaTiene);
          updateOrder({ ...order, hasTicket: true, ticketAt: new Date().toISOString(), ticketFotos: yaTiene + 1 });
        } catch {
          alert('No se pudo guardar la foto. Inténtalo otra vez.');
          setEstado('');
          return;
        }
        if (leerDatos && (!order.address || !order.customerPhone)) {
          setEstado('leyendo');
          const r = await leerTicket(foto);
          if (!('error' in r)) {
            await rellenarPedido(order.id, {
              ...(!order.address && r.direccion ? { address: r.direccion } : {}),
              ...(!order.customerPhone && r.telefono ? { customerPhone: r.telefono } : {}),
            }).catch(() => alert('La foto se guardó, pero no se pudo apuntar la dirección leída.'));
            if (r.dudas) alert(`Revisa la dirección y el teléfono: ${r.dudas}`);
          }
        }
        setEstado('');
      }}
    />
  );
}
