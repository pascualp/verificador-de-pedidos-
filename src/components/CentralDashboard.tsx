import { Driver } from '../types';
import { Package, MapPin, Clock, User, Plus, Edit2, Trash2, Check, X, TreePalm, Pizza, Zap, Eye, EyeOff } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { useState } from 'react';
import { TimeElapsed } from './TimeElapsed';

export function CentralDashboard({ drivers, updateDriver, addDriver, deleteDriver }: { drivers: Driver[], updateDriver: (d: Driver) => void, addDriver: (name: string, restaurantId: string) => void, deleteDriver: (id: string) => void }) {
  const activeDrivers = drivers.filter(d => d.status === 'Repartiendo');
  const totalActiveOrders = activeDrivers.reduce((sum, d) => sum + d.activeOrders, 0);

  const [newDriverName, setNewDriverName] = useState('');
  const [newDriverRestaurant, setNewDriverRestaurant] = useState('restaurant1');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [hiddenRestaurants, setHiddenRestaurants] = useState<Record<string, boolean>>({});

  const toggleVisibility = (restId: string) => {
    setHiddenRestaurants(prev => ({ ...prev, [restId]: !prev[restId] }));
  };

  const handleEditSave = (driver: Driver) => {
    if (editName.trim()) {
      updateDriver({ ...driver, name: editName.trim() });
    }
    setEditingId(null);
  };

  const RestaurantColumn = ({ title, restId, icon: Icon, themeColor }: { title: string, restId: string, icon: any, themeColor: 'orange' | 'rose' }) => {
    const restDrivers = drivers.filter(d => (d.restaurantId === restId) || (!d.restaurantId && restId === 'restaurant1'));
    const active = restDrivers.filter(d => d.status === 'Repartiendo');
    const free = restDrivers.filter(d => d.status === 'Libre');
    const isHidden = hiddenRestaurants[restId];

    const headerColors = {
      orange: "border-orange-600 text-orange-700 bg-orange-50",
      rose: "border-rose-500 text-rose-600 bg-rose-50"
    };

    const containerColors = {
      orange: "bg-orange-50/20",
      rose: "bg-rose-50/20"
    };

    return (
      <div className="flex flex-col gap-6 transition-all duration-300">
        <div className="flex items-center justify-between border-b-2 pb-3" style={{ borderColor: themeColor === 'orange' ? '#ea580c' : '#f43f5e' }}>
          <h2 className={`text-2xl font-black flex items-center gap-3 ${themeColor === 'orange' ? 'text-orange-700' : 'text-rose-600'}`}>
            <div className={`p-2 rounded-xl ${headerColors[themeColor].split(' ')[2]}`}>
              <Icon className="w-6 h-6" />
            </div>
            {title}
          </h2>
          <button 
            onClick={() => toggleVisibility(restId)}
            className={`text-gray-500 hover:text-gray-900 transition-colors p-2 rounded-full ${isHidden ? 'bg-gray-200' : 'bg-gray-100'}`}
            title={isHidden ? "Mostrar" : "Ocultar"}
          >
            {isHidden ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>
        
        <div className={`flex flex-col gap-6 transition-all duration-300 ${isHidden ? 'opacity-40 blur-[1px] grayscale hover:opacity-100 hover:blur-none hover:grayscale-0' : ''}`}>
          <div className={`rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col ${containerColors[themeColor]}`}>
            <div className="bg-blue-50 border-b border-blue-100 p-4">
              <h3 className="font-semibold text-blue-900 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-blue-600" />
                En Ruta ({active.length})
              </h3>
            </div>
            <div className="divide-y divide-gray-100">
              {active.length === 0 ? (
                <div className="p-6 text-center text-gray-500 text-sm bg-white/50">No hay repartidores en ruta.</div>
              ) : (
                active.map(driver => (
                  <div key={driver.id} className="flex flex-col hover:bg-white/80 bg-white/40 transition-colors group border-b border-gray-100 last:border-b-0">
                    <div className="px-4 py-2.5 text-white text-sm font-black tracking-widest uppercase shadow-sm bg-cyan-500">
                      {driver.name}
                    </div>
                    <div className="p-4 flex items-center justify-between">
                      <div className="min-w-0 flex-1">
                        {editingId === driver.id ? (
                          <div className="flex items-center gap-1 mb-1">
                            <input 
                              type="text" 
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              className="border border-gray-300 rounded px-2 py-0.5 text-sm w-32 outline-none focus:border-cyan-500 bg-white"
                              autoFocus
                            />
                            <button onClick={() => handleEditSave(driver)} className="text-green-600 hover:text-green-700 p-1 bg-white rounded shadow-sm"><Check className="w-4 h-4" /></button>
                            <button onClick={() => setEditingId(null)} className="text-gray-400 hover:text-gray-600 p-1 bg-white rounded shadow-sm"><X className="w-4 h-4" /></button>
                          </div>
                        ) : (
                          <div className="font-medium flex items-center gap-2">
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                              <button onClick={() => { setEditingId(driver.id); setEditName(driver.name); }} className="text-gray-400 hover:text-cyan-600 transition-colors" title="Editar"><Edit2 className="w-3.5 h-3.5" /></button>
                              <button onClick={() => { if(window.confirm(`¿Eliminar a ${driver.name}?`)) deleteDriver(driver.id); }} className="text-gray-400 hover:text-red-500 transition-colors" title="Eliminar"><Trash2 className="w-3.5 h-3.5" /></button>
                            </div>
                          </div>
                        )}
                        <div className="text-xs text-gray-500 mt-1 flex items-center gap-2">
                          <span>Historial: {driver.totalOrders || 0} pedidos</span>
                        </div>
                        <div className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                          <Clock className="w-3 h-3" />
                          Salió hace {formatDistanceToNow(new Date(driver.lastUpdated), { locale: es })}
                          <TimeElapsed startTime={driver.lastUpdated} />
                        </div>
                      </div>
                      <div className="flex items-center gap-3 ml-4">
                        <div className="flex flex-col items-end">
                          <span className="text-xl font-bold leading-none">{driver.activeOrders}</span>
                          <span className="text-xs text-gray-500 font-medium">pedidos</span>
                        </div>
                        <div className="bg-blue-100 p-2 rounded-lg bg-opacity-80">
                          <Package className="w-5 h-5 text-blue-700" />
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className={`rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col ${containerColors[themeColor]}`}>
            <div className="bg-green-50 border-b border-green-100 p-4">
              <h3 className="font-semibold text-green-900 flex items-center gap-2">
                <User className="w-5 h-5 text-green-600" />
                Libres ({free.length})
              </h3>
            </div>
            <div className="divide-y divide-gray-100">
              {free.length === 0 ? (
                <div className="p-6 text-center text-gray-500 text-sm bg-white/50">No hay repartidores libres.</div>
              ) : (
                free.map(driver => (
                  <div key={driver.id} className="flex flex-col hover:bg-white/80 bg-white/40 transition-colors group border-b border-gray-100 last:border-b-0">
                    <div className="px-4 py-2.5 text-white text-sm font-black tracking-widest uppercase shadow-sm bg-cyan-500">
                      {driver.name}
                    </div>
                    <div className="p-4 flex items-center justify-between">
                      <div className="min-w-0 flex-1">
                        {editingId === driver.id ? (
                          <div className="flex items-center gap-1 mb-1">
                            <input 
                              type="text" 
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              className="border border-gray-300 rounded px-2 py-0.5 text-sm w-32 outline-none focus:border-cyan-500 bg-white"
                              autoFocus
                            />
                            <button onClick={() => handleEditSave(driver)} className="text-green-600 hover:text-green-700 p-1 bg-white rounded shadow-sm"><Check className="w-4 h-4" /></button>
                            <button onClick={() => setEditingId(null)} className="text-gray-400 hover:text-gray-600 p-1 bg-white rounded shadow-sm"><X className="w-4 h-4" /></button>
                          </div>
                        ) : (
                          <div className="font-medium flex items-center gap-2">
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                              <button onClick={() => { setEditingId(driver.id); setEditName(driver.name); }} className="text-gray-400 hover:text-cyan-600 transition-colors" title="Editar"><Edit2 className="w-3.5 h-3.5" /></button>
                              <button onClick={() => { if(window.confirm(`¿Eliminar a ${driver.name}?`)) deleteDriver(driver.id); }} className="text-gray-400 hover:text-red-500 transition-colors" title="Eliminar"><Trash2 className="w-3.5 h-3.5" /></button>
                            </div>
                          </div>
                        )}
                        <div className="text-xs text-gray-500 mt-1 flex items-center gap-2">
                          <span>Historial: {driver.totalOrders || 0} pedidos entregados</span>
                        </div>
                      </div>
                      <div className="relative ml-4">
                        <div className="absolute inset-0 bg-green-400 rounded-full animate-ping opacity-20"></div>
                        <span className="relative px-3 py-1 bg-green-50 border border-green-200 text-green-700 rounded-full text-xs font-bold shadow-sm flex items-center gap-1.5">
                          <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                          Disponible
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    );
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
          <div className="bg-cyan-500 text-white px-4 py-2 rounded-lg shadow-sm">
            <div className="text-xs text-white/80 font-medium">Total Pedidos en Ruta</div>
            <div className="text-xl font-bold">{totalActiveOrders}</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <RestaurantColumn title="Restaurante Tropical" restId="restaurant1" icon={TreePalm} themeColor="orange" />
        <RestaurantColumn title="Pizzería S^tatua" restId="restaurant2" icon={Pizza} themeColor="rose" />
      </div>

      <div className="bg-gray-50 border-2 border-dashed border-gray-300 p-6 rounded-2xl flex flex-col justify-center items-center text-center max-w-md mx-auto mt-8">
        <form 
          onSubmit={(e) => { 
            e.preventDefault(); 
            if (newDriverName.trim()) { 
              addDriver(newDriverName.trim(), newDriverRestaurant); 
              setNewDriverName(''); 
            } 
          }}
          className="w-full flex flex-col items-center gap-4"
        >
          <div className="bg-white p-3 rounded-full shadow-sm border border-gray-200">
            <Plus className="w-6 h-6 text-gray-500" />
          </div>
          <h3 className="font-bold">Añadir Nuevo Repartidor</h3>
          <input 
            type="text"
            placeholder="Nombre del nuevo repartidor..."
            className="w-full border border-gray-300 rounded-xl px-4 py-3 text-base outline-none focus:border-cyan-500 text-center"
            value={newDriverName}
            onChange={(e) => setNewDriverName(e.target.value)}
          />
          <select
            value={newDriverRestaurant}
            onChange={(e) => setNewDriverRestaurant(e.target.value)}
            className="w-full border border-gray-300 rounded-xl px-4 py-3 text-base outline-none focus:border-cyan-500 text-center bg-white"
          >
            <option value="restaurant1">Restaurante Tropical</option>
            <option value="restaurant2">Pizzería S^tatua</option>
          </select>
          <button type="submit" className="text-sm font-semibold text-cyan-600 hover:underline" disabled={!newDriverName.trim()}>
            Añadir Repartidor
          </button>
        </form>
      </div>
    </div>
  );
}
