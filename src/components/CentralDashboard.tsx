import { Driver } from '../types';
import { Package, MapPin, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

export function CentralDashboard({ drivers }: { drivers: Driver[] }) {
  const activeDrivers = drivers.filter(d => d.status === 'Repartiendo');
  const freeDrivers = drivers.filter(d => d.status === 'Libre');

  const totalActiveOrders = activeDrivers.reduce((sum, d) => sum + d.activeOrders, 0);

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Panel Central</h1>
          <p className="text-gray-500 text-sm mt-1">Supervisión en tiempo real de la capacidad de la flota.</p>
        </div>
        
        <div className="flex gap-4">
          <div className="bg-white border border-gray-200 px-4 py-2 rounded-lg shadow-sm">
            <div className="text-xs text-gray-500 font-medium">Repartidores Activos</div>
            <div className="text-xl font-bold">{activeDrivers.length} / {drivers.length}</div>
          </div>
          <div className="bg-black text-white px-4 py-2 rounded-lg shadow-sm">
            <div className="text-xs text-gray-400 font-medium">Total Pedidos en Ruta</div>
            <div className="text-xl font-bold">{totalActiveOrders}</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="bg-blue-50 border-b border-blue-100 p-4">
            <h2 className="font-semibold text-blue-900 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-blue-600" />
              En Ruta ({activeDrivers.length})
            </h2>
          </div>
          <div className="divide-y divide-gray-100">
            {activeDrivers.length === 0 ? (
              <div className="p-8 text-center text-gray-500 text-sm">No hay repartidores en ruta.</div>
            ) : (
              activeDrivers.map(driver => (
                <div key={driver.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                  <div>
                    <div className="font-medium text-lg">{driver.name}</div>
                    <div className="text-xs text-gray-500 mt-1">Historial: {driver.totalOrders || 0} pedidos entregados</div>
                    <div className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                      <Clock className="w-3 h-3" />
                      Salió hace {formatDistanceToNow(new Date(driver.lastUpdated), { locale: es })}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col items-end">
                      <span className="text-2xl font-bold leading-none">{driver.activeOrders}</span>
                      <span className="text-xs text-gray-500 font-medium">pedidos</span>
                    </div>
                    <div className="bg-blue-100 p-2 rounded-lg">
                      <Package className="w-5 h-5 text-blue-700" />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="bg-green-50 border-b border-green-100 p-4">
            <h2 className="font-semibold text-green-900 flex items-center gap-2">
              <Clock className="w-5 h-5 text-green-600" />
              Disponibles / Libres ({freeDrivers.length})
            </h2>
          </div>
          <div className="divide-y divide-gray-100">
            {freeDrivers.length === 0 ? (
              <div className="p-8 text-center text-gray-500 text-sm">No hay repartidores libres.</div>
            ) : (
              freeDrivers.map(driver => (
                <div key={driver.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                  <div>
                    <div className="font-medium text-lg">{driver.name}</div>
                    <div className="text-xs text-gray-500 mt-1">Historial: {driver.totalOrders || 0} pedidos entregados</div>
                  </div>
                  <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                    Disponible
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
