import { useState } from 'react';
import { Driver } from '../types';
import { User, Plus, RotateCcw, Edit2, Trash2, Check, X } from 'lucide-react';

export function RestaurantDashboard({ drivers, updateDriver, addDriver, deleteDriver }: { drivers: Driver[], updateDriver: (d: Driver) => void, addDriver: (name: string) => void, deleteDriver: (id: string) => void }) {
  const [newDriverName, setNewDriverName] = useState('');
  const [orderInputs, setOrderInputs] = useState<Record<string, string>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

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

  const handleEditSave = (driver: Driver) => {
    if (editName.trim()) {
      updateDriver({ ...driver, name: editName.trim() });
    }
    setEditingId(null);
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
                  {editingId === driver.id ? (
                    <div className="flex items-center gap-1">
                      <input 
                        type="text" 
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="border border-gray-300 rounded px-2 py-0.5 text-sm w-24 outline-none focus:border-black"
                        autoFocus
                      />
                      <button onClick={() => handleEditSave(driver)} className="text-green-600 hover:text-green-700 p-1"><Check className="w-4 h-4" /></button>
                      <button onClick={() => setEditingId(null)} className="text-gray-400 hover:text-gray-600 p-1"><X className="w-4 h-4" /></button>
                    </div>
                  ) : (
                    <div className="flex flex-col">
                      <div className="font-semibold text-lg leading-tight truncate flex items-center gap-2">
                        {driver.name}
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                          <button onClick={() => { setEditingId(driver.id); setEditName(driver.name); }} className="text-gray-400 hover:text-black transition-colors" title="Editar"><Edit2 className="w-3.5 h-3.5" /></button>
                          <button onClick={() => { if(window.confirm(`¿Eliminar a ${driver.name}?`)) deleteDriver(driver.id); }} className="text-gray-400 hover:text-red-500 transition-colors" title="Eliminar"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">Historial: {driver.totalOrders || 0} pedidos</div>
                    </div>
                  )}
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
                    className="w-20 border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-black focus:ring-1 focus:ring-black text-center"
                    value={orderInputs[driver.id] || ''}
                    onChange={(e) => setOrderInputs({ ...orderInputs, [driver.id]: e.target.value })}
                  />
                  <button 
                    onClick={() => handleAssign(driver)}
                    disabled={!orderInputs[driver.id] || parseInt(orderInputs[driver.id], 10) < 1}
                    className="flex-1 bg-black text-white px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
                  >
                    Asignar
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded-md text-center">
                    Llevando <strong>{driver.activeOrders}</strong> {driver.activeOrders === 1 ? 'pedido' : 'pedidos'}
                  </div>
                  <button 
                    onClick={() => handleReturn(driver)}
                    className="w-full border-2 border-black text-black px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 flex items-center justify-center gap-2"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Marcar como Libre
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}

        <div className="bg-gray-50 border-2 border-dashed border-gray-300 p-5 rounded-xl flex flex-col justify-center items-center text-center">
          <form 
            onSubmit={(e) => { e.preventDefault(); if (newDriverName.trim()) { addDriver(newDriverName.trim()); setNewDriverName(''); } }}
            className="w-full flex flex-col items-center gap-3"
          >
            <div className="bg-white p-2 rounded-full shadow-sm border border-gray-200">
              <Plus className="w-5 h-5 text-gray-500" />
            </div>
            <input 
              type="text"
              placeholder="Nombre del repartidor..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-black text-center"
              value={newDriverName}
              onChange={(e) => setNewDriverName(e.target.value)}
            />
            <button type="submit" className="text-sm font-medium text-black hover:underline" disabled={!newDriverName.trim()}>
              Añadir Repartidor
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
