import { useRef, useState } from 'react';
import { Camera, Loader2, Receipt, X } from 'lucide-react';
import { Order } from '../types';
import { cargarTicket, comprimirFoto, guardarTicket } from '../lib/ticket';

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

// Muestra la foto guardada del pedido. Solo la descarga cuando alguien la abre.
export function VerTicket({ orderId, orderNumber, className }: { orderId: string; orderNumber: string; className?: string }) {
  const [abierto, setAbierto] = useState(false);
  const [foto, setFoto] = useState<string | null | undefined>(undefined); // undefined = aún cargando

  const abrir = async () => {
    setAbierto(true);
    if (foto === undefined) {
      try {
        setFoto(await cargarTicket(orderId));
      } catch {
        setFoto(null);
      }
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
          <div className="w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between text-white mb-2">
              <span className="font-bold">Ticket del pedido #{orderNumber}</span>
              <button type="button" onClick={() => setAbierto(false)} className="p-2 rounded-full hover:bg-white/10" aria-label="Cerrar">
                <X className="w-5 h-5" />
              </button>
            </div>
            {foto === undefined ? (
              <p className="text-white text-center py-10">Cargando la foto…</p>
            ) : foto ? (
              <img src={foto} alt={`Ticket del pedido ${orderNumber}`} className="w-full max-h-[80vh] object-contain rounded-lg bg-white" />
            ) : (
              <p className="text-white text-center py-10">Este pedido no tiene foto guardada.</p>
            )}
          </div>
        </div>
      )}
    </>
  );
}

// Para un pedido ya creado sin foto: sacarla ahora y dejarla guardada con el pedido.
export function AdjuntarTicket({ order, updateOrder, className }: { order: Order; updateOrder: (o: Order) => void; className?: string }) {
  const [guardando, setGuardando] = useState(false);
  return (
    <BotonCamara
      texto={guardando ? 'Guardando…' : 'Foto ticket'}
      className={className ?? 'text-[10px] bg-gray-50 text-gray-600 px-2 py-1 rounded border border-dashed border-gray-300 hover:bg-amber-50 hover:text-amber-700 transition-colors w-fit flex items-center gap-1'}
      onFoto={async (foto) => {
        setGuardando(true);
        try {
          await guardarTicket(order.id, foto, order);
          updateOrder({ ...order, hasTicket: true, ticketAt: new Date().toISOString() });
        } catch {
          alert('No se pudo guardar la foto. Inténtalo otra vez.');
        } finally {
          setGuardando(false);
        }
      }}
    />
  );
}
