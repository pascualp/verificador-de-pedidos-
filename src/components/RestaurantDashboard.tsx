import { useState } from 'react';
import { Driver } from '../types';
import { User, RotateCcw, Clock } from 'lucide-react';
import { TimeElapsed } from './TimeElapsed';

export function RestaurantDashboard({ drivers, updateDriver }: { drivers: Driver[], updateDriver: (d: Driver) => void }) {
  const [orderInputs, setOrderInputs] = useState<Record<string, string>>({});

  const handleAssign = (driver: Driver) => {
    const orders = parseInt(orderInputs[driver.id] || '0', 10);
    if (orders > 0) {
      updateDriver({
        ...driver,
        status: 'Repartiendo',
        activeOrders: orders,
        lastUpdated: new Date().toISOString()
      });
      setOrderInputs({ ...orderInputs, [driver.id]: '' });
    }
  };

  const handleReturn = (driver: Driver) => {
    updateDriver({
      ...driver,
      status: 'Libre',
      totalOrders: (driver.totalOrders || 0) + driver.activeOrders,
      activeOrders: 0,
      lastUpdated: new Date().toISOString()
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Panel de Restaurante</h1>
          <p className="text-gray-500 text-sm mt-1">Asigna pedidos a los repartidores y marca cuando regresan.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {drivers.map(driver => (
          <div key={driver.id} className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col relative group">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className="bg-gray-100 p-2.5 rounded-full shrink-0">
                  <User className="w-5 h-5 text-gray-700" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-col">
                    <div className="font-semibold text-lg leading-tight truncate flex items-center gap-2">
                      {driver.name}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">Historial: {driver.totalOrders || 0} pedidos</div>
                    {driver.scheduledDays && driver.scheduledDays.length > 0 && (
                      <div className="text-[10px] text-gray-400 mt-1 uppercase tracking-wider font-semibold">
                        Días: {driver.scheduledDays.map(d => d.slice(0,3)).join(', ')}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="shrink-0 ml-2">
                <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${driver.status === 'Libre' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                  {driver.status}
                </span>
              </div>
            </div>

            <div className="flex-grow flex flex-col justify-end mt-2 border-t border-gray-100 pt-4">
              {driver.status === 'Libre' ? (
                <div className="flex gap-2 items-center">
                  <input 
                    type="number"
                    min="1"
                    placeholder="Pedidos"
                    className="w-20 border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-center"
                    value={orderInputs[driver.id] || ''}
                    onChange={(e) => setOrderInputs({ ...orderInputs, [driver.id]: e.target.value })}
                  />
                  <button 
                    onClick={() => handleAssign(driver)}
                    disabled={!orderInputs[driver.id] || parseInt(orderInputs[driver.id], 10) < 1}
                    className="flex-1 bg-cyan-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-cyan-600 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Asignar
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded-md text-center flex flex-col items-center justify-center gap-1">
                    <div>Llevando <strong>{driver.activeOrders}</strong> {driver.activeOrders === 1 ? 'pedido' : 'pedidos'}</div>
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Clock className="w-3 h-3" />
                      Hace: <TimeElapsed startTime={driver.lastUpdated} />
                    </div>
                  </div>
                  <button 
                    onClick={() => handleReturn(driver)}
                    className="w-full border-2 border-cyan-500 text-cyan-500 px-4 py-2 rounded-lg text-sm font-medium hover:bg-cyan-50 flex items-center justify-center gap-2 transition-colors"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Marcar como Libre
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
