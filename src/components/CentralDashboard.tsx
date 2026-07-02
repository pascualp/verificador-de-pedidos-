import { Driver } from '../types';
import { Package, MapPin, Clock, User, Plus, Edit2, Trash2, Check, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { useState } from 'react';

export function CentralDashboard({ drivers, updateDriver, addDriver, deleteDriver }: { drivers: Driver[], updateDriver: (d: Driver) => void, addDriver: (name: string) => void, deleteDriver: (id: string) => void }) {
  const activeDrivers = drivers.filter(d => d.status === 'Repartiendo');
  const freeDrivers = drivers.filter(d => d.status === 'Libre');

  const totalActiveOrders = activeDrivers.reduce((sum, d) => sum + d.activeOrders, 0);

  const [newDriverName, setNewDriverName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const handleEditSave = (driver: Driver) => {
    if (editName.trim()) {
      updateDriver({ ...driver, name: editName.trim() });
    }
    setEditingId(null);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Panel Central</h1>
          <p className="text-gray-500 text-sm mt-1">Supervisión de flota y gestión de repartidores.</p>
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
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
          <div className="bg-blue-50 border-b border-blue-100 p-4">
            <h2 className="font-semibold text-blue-900 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-blue-600" />
              En Ruta ({activeDrivers.length})
            </h2>
          </div>
          <div className="divide-y divide-gray-100 flex-grow">
            {activeDrivers.length === 0 ? (
              <div className="p-8 text-center text-gray-500 text-sm">No hay repartidores en ruta.</div>
            ) : (
              activeDrivers.map(driver => (
                <div key={driver.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors group">
                  <div className="min-w-0 flex-1">
                    {editingId === driver.id ? (
                      <div className="flex items-center gap-1 mb-1">
                        <input 
                          type="text" 
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="border border-gray-300 rounded px-2 py-0.5 text-sm w-32 outline-none focus:border-black"
                          autoFocus
                        />
                        <button onClick={() => handleEditSave(driver)} className="text-green-600 hover:text-green-700 p-1"><Check className="w-4 h-4" /></button>
                        <button onClick={() => setEditingId(null)} className="text-gray-400 hover:text-gray-600 p-1"><X className="w-4 h-4" /></button>
                      </div>
                    ) : (
                      <div className="font-medium text-lg flex items-center gap-2">
                        {driver.name}
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                          <button onClick={() => { setEditingId(driver.id); setEditName(driver.name); }} className="text-gray-400 hover:text-black transition-colors" title="Editar"><Edit2 className="w-3.5 h-3.5" /></button>
                          <button onClick={() => { if(window.confirm(`¿Eliminar a ${driver.name}?`)) deleteDriver(driver.id); }} className="text-gray-400 hover:text-red-500 transition-colors" title="Eliminar"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      </div>
                    )}
                    <div className="text-xs text-gray-500 mt-1">Historial: {driver.totalOrders || 0} pedidos entregados</div>
                    <div className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                      <Clock className="w-3 h-3" />
                      Salió hace {formatDistanceToNow(new Date(driver.lastUpdated), { locale: es })}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 ml-4">
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

        <div className="flex flex-col gap-8">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex-grow">
            <div className="bg-green-50 border-b border-green-100 p-4">
              <h2 className="font-semibold text-green-900 flex items-center gap-2">
                <User className="w-5 h-5 text-green-600" />
                Disponibles / Libres ({freeDrivers.length})
              </h2>
            </div>
            <div className="divide-y divide-gray-100">
              {freeDrivers.length === 0 ? (
                <div className="p-8 text-center text-gray-500 text-sm">No hay repartidores libres.</div>
              ) : (
                freeDrivers.map(driver => (
                  <div key={driver.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors group">
                    <div className="min-w-0 flex-1">
                      {editingId === driver.id ? (
                        <div className="flex items-center gap-1 mb-1">
                          <input 
                            type="text" 
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="border border-gray-300 rounded px-2 py-0.5 text-sm w-32 outline-none focus:border-black"
                            autoFocus
                          />
                          <button onClick={() => handleEditSave(driver)} className="text-green-600 hover:text-green-700 p-1"><Check className="w-4 h-4" /></button>
                          <button onClick={() => setEditingId(null)} className="text-gray-400 hover:text-gray-600 p-1"><X className="w-4 h-4" /></button>
                        </div>
                      ) : (
                        <div className="font-medium text-lg flex items-center gap-2">
                          {driver.name}
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                            <button onClick={() => { setEditingId(driver.id); setEditName(driver.name); }} className="text-gray-400 hover:text-black transition-colors" title="Editar"><Edit2 className="w-3.5 h-3.5" /></button>
                            <button onClick={() => { if(window.confirm(`¿Eliminar a ${driver.name}?`)) deleteDriver(driver.id); }} className="text-gray-400 hover:text-red-500 transition-colors" title="Eliminar"><Trash2 className="w-3.5 h-3.5" /></button>
                          </div>
                        </div>
                      )}
                      <div className="text-xs text-gray-500 mt-1">Historial: {driver.totalOrders || 0} pedidos entregados</div>
                    </div>
                    <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold ml-4">
                      Disponible
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-gray-50 border-2 border-dashed border-gray-300 p-6 rounded-2xl flex flex-col justify-center items-center text-center">
            <form 
              onSubmit={(e) => { e.preventDefault(); if (newDriverName.trim()) { addDriver(newDriverName.trim()); setNewDriverName(''); } }}
              className="w-full flex flex-col items-center gap-4"
            >
              <div className="bg-white p-3 rounded-full shadow-sm border border-gray-200">
                <Plus className="w-6 h-6 text-gray-500" />
              </div>
              <input 
                type="text"
                placeholder="Nombre del nuevo repartidor..."
                className="w-full border border-gray-300 rounded-xl px-4 py-3 text-base outline-none focus:border-black text-center"
                value={newDriverName}
                onChange={(e) => setNewDriverName(e.target.value)}
              />
              <button type="submit" className="text-sm font-semibold text-black hover:underline" disabled={!newDriverName.trim()}>
                Añadir Repartidor
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
