import { AppConfig, Driver, Order } from '../types';
import { Package, MapPin, Clock, User, Plus, Edit2, Trash2, Check, X, TreePalm, Pizza, Zap, Eye, EyeOff, Webhook, RotateCcw } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { useState } from 'react';
import { TimeRemaining } from './TimeRemaining';
import { WebhookSettings } from './WebhookSettings';

export function CentralDashboard({ 
  drivers, 
  updateDriver, 
  addDriver, 
  deleteDriver, 
  orders, 
  updateOrder,
  appConfig,
  updateAppConfig
}: { 
  drivers: Driver[], 
  updateDriver: (d: Driver) => void, 
  addDriver: (name: string, restaurantId: string, password?: string) => void, 
  deleteDriver: (id: string) => void, 
  orders?: Order[], 
  updateOrder?: (o: Order) => void,
  appConfig: AppConfig,
  updateAppConfig: (config: AppConfig) => void
}) {
  const activeDrivers = drivers.filter(d => d.status === 'Repartiendo');
  const totalActiveOrders = activeDrivers.reduce((sum, d) => sum + d.activeOrders, 0);

  const [newDriverName, setNewDriverName] = useState('');
  const [newDriverRestaurant, setNewDriverRestaurant] = useState('restaurant1');
  const [newDriverPassword, setNewDriverPassword] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [hiddenRestaurants, setHiddenRestaurants] = useState<Record<string, boolean>>({});
  const [currentView, setCurrentView] = useState<'dashboard' | 'webhooks'>('dashboard');

  const toggleVisibility = (restId: string) => {
    setHiddenRestaurants(prev => ({ ...prev, [restId]: !prev[restId] }));
  };

  
  const getDriverTotal = (driver: Driver) => {
    const delivered = driver.totalCollected || 0;
    const active = orders.filter(o => o.driverId === driver.id && o.status === 'Asignado').reduce((sum, o) => sum + (o.price || 0), 0);
    return delivered + active;
  };

  const handleEditSave = (driver: Driver) => {
    if (editName.trim()) {
      updateDriver({ 
        ...driver, 
        name: editName.trim(), 
        password: editPassword.trim() || undefined 
      });
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
            <div className="bg-orange-50 border-b border-orange-100 p-4">
              <h3 className="font-semibold text-orange-900 flex items-center gap-2">
                <Clock className="w-5 h-5 text-orange-600" />
                En Cola ({orders?.filter(o => o.restaurantId === restId && o.status === 'En Cola').length || 0})
              </h3>
            </div>
            <div className="divide-y divide-gray-100">
              {(!orders || orders.filter(o => o.restaurantId === restId && o.status === 'En Cola').length === 0) ? (
                <div className="p-6 text-center text-gray-500 text-sm bg-white/50">No hay pedidos en cola.</div>
              ) : (
                <div className="p-4 grid grid-cols-2 gap-3 bg-white/40">
                  {orders.filter(o => o.restaurantId === restId && o.status === 'En Cola').map(order => (
                    <div key={order.id} className="bg-white p-3 rounded-xl border border-orange-200 shadow-sm relative flex flex-col">
                      {order.prepTime && (
                        <TimeRemaining startTime={order.createdAt} prepTimeMinutes={order.prepTime} />
                      )}
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex flex-col gap-1">
                          <span className="font-black text-lg text-gray-800">#{order.orderNumber}</span>
                          {order.price !== undefined ? (
                            <div className="flex items-center gap-1 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100 w-fit">
                              <span className="text-emerald-700 font-bold text-xs">{order.price === 0 ? "Pagado" : "$" + order.price.toFixed(2)}</span>
                              <button 
                                onClick={() => {
                                  const newPriceStr = window.prompt('Editar precio:', order.price?.toString());
                                  if (newPriceStr !== null) {
                                    const newPrice = parseFloat(newPriceStr) || 0;
                                    const diff = newPrice - (order.price || 0);
                                    updateOrder({ ...order, price: newPrice });
                                    
                                    // If delivered, update driver's total collected
                                    if (order.status === 'Entregado' && order.driverId) {
                                      const driver = drivers.find(d => d.id === order.driverId);
                                      if (driver) {
                                        updateDriver({
                                          ...driver,
                                          totalCollected: (driver.totalCollected || 0) + diff
                                        });
                                      }
                                    }
                                  }
                                }}
                                className="text-emerald-400 hover:text-emerald-600"
                              >
                                <Edit2 className="w-2.5 h-2.5" />
                              </button>
                            </div>
                          ) : (
                            <button 
                              onClick={() => {
                                const newPriceStr = window.prompt('Asignar precio:');
                                if (newPriceStr !== null) {
                                  const newPrice = parseFloat(newPriceStr) || 0;
                                  updateOrder({ ...order, price: newPrice });
                                  
                                  // If delivered, update driver's total collected
                                  if (order.status === 'Entregado' && order.driverId) {
                                    const driver = drivers.find(d => d.id === order.driverId);
                                    if (driver) {
                                      updateDriver({
                                        ...driver,
                                        totalCollected: (driver.totalCollected || 0) + newPrice
                                      });
                                    }
                                  }
                                }
                              }}
                              className="text-[10px] bg-gray-50 text-gray-400 px-1.5 py-0.5 rounded border border-dashed border-gray-200 hover:bg-emerald-50 hover:text-emerald-600 transition-colors w-fit"
                            >
                              + Precio
                            </button>
                          )}
                        </div>
                      </div>
                      {order.customerName && (
                        <div className="text-sm font-medium text-gray-700 truncate">{order.customerName}</div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

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
                  <div key={driver.id} className={`flex flex-col hover:bg-white/80 transition-colors group border-b border-gray-100 last:border-b-0 ${driver.isHidden ? 'bg-gray-50' : 'bg-white/40'}`}>
                    <div className={`px-4 py-2.5 text-white text-sm font-black tracking-widest uppercase shadow-sm flex items-center justify-between ${driver.isHidden ? 'bg-gray-400' : 'bg-cyan-500'}`}>
                      <div className="flex items-center gap-2">
                        <span>{driver.name}</span>
                        {driver.password && <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded border border-white/30 lowercase tracking-normal font-medium" title="Contraseña">🔑 {driver.password}</span>}
                      </div>
                      {driver.isHidden && <span className="text-[10px] bg-black/20 px-2 py-0.5 rounded-full flex items-center gap-1"><EyeOff className="w-3 h-3" /> Oculto a Restaurantes</span>}
                    </div>
                    <div className="p-4">
                      <div className="flex items-center justify-between">
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
                                <button onClick={() => updateDriver({ ...driver, isHidden: !driver.isHidden })} className={`transition-colors ${driver.isHidden ? 'text-gray-400 hover:text-gray-600' : 'text-gray-400 hover:text-cyan-600'}`} title={driver.isHidden ? "Mostrar a restaurantes" : "Ocultar a restaurantes"}>
                                  {driver.isHidden ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                </button>
                                <button onClick={() => { if(window.confirm(`¿Eliminar a ${driver.name}?`)) deleteDriver(driver.id); }} className="text-gray-400 hover:text-red-500 transition-colors" title="Eliminar"><Trash2 className="w-3.5 h-3.5" /></button>
                              </div>
                            </div>
                          )}
                          <div className="text-xs text-gray-500 mt-1 flex items-center gap-2 flex-wrap">
                            <span>Historial: {driver.totalOrders || 0} pedidos</span>
                            <div className="flex items-center gap-1">
                                <span className="bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded font-black border border-emerald-200">
                                  ${getDriverTotal(driver).toFixed(2)}
                                </span>
                                <button 
                                  onClick={() => {
                                    if(window.confirm(`¿Cerrar turno de ${driver.name}?\nTotal: $${getDriverTotal(driver).toFixed(2)}`)) {
                                      updateDriver({ ...driver, totalCollected: 0, lastUpdated: new Date().toISOString() });
                                    }
                                  }}
                                  className="text-gray-400 hover:text-emerald-600 transition-colors"
                                  title="Cerrar Turno (Caja)"
                                >
                                  <RotateCcw className="w-3.5 h-3.5" />
                                </button>
                              </div>
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
                      
                      {orders && orders.filter(o => o.driverId === driver.id && o.status === 'Asignado').length > 0 && (
                        <div className="mt-3 pt-3 border-t border-gray-100/50">
                          <div className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Pedidos Asignados:</div>
                          <div className="flex flex-wrap gap-2">
                            {orders.filter(o => o.driverId === driver.id && o.status === 'Asignado').map(o => (
                              <div key={o.id} className="bg-white px-2.5 py-1 rounded-md shadow-sm border border-gray-200 text-xs flex items-center gap-2">
                                <span className="font-bold text-gray-700">#{o.orderNumber}</span>
                                <span className="text-gray-500">{o.customerName}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
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
                  <div key={driver.id} className={`flex flex-col hover:bg-white/80 transition-colors group border-b border-gray-100 last:border-b-0 ${driver.isHidden ? 'bg-gray-50' : 'bg-white/40'}`}>
                    <div className={`px-4 py-2.5 text-white text-sm font-black tracking-widest uppercase shadow-sm flex items-center justify-between ${driver.isHidden ? 'bg-gray-400' : 'bg-cyan-500'}`}>
                      <div className="flex items-center gap-2">
                        <span>{driver.name}</span>
                        {driver.password && <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded border border-white/30 lowercase tracking-normal font-medium" title="Contraseña">🔑 {driver.password}</span>}
                      </div>
                      {driver.isHidden && <span className="text-[10px] bg-black/20 px-2 py-0.5 rounded-full flex items-center gap-1"><EyeOff className="w-3 h-3" /> Oculto a Restaurantes</span>}
                    </div>
                    <div className="p-4 flex items-center justify-between">
                      <div className="min-w-0 flex-1">
                        {editingId === driver.id ? (
                          <div className="flex flex-col gap-2 mb-2 w-full max-w-sm">
                            <div className="flex items-center gap-1">
                              <input 
                                type="text" 
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                className="border border-gray-300 rounded px-2 py-1 text-sm flex-1 outline-none focus:border-cyan-500 bg-white"
                                placeholder="Nombre"
                                autoFocus
                              />
                              <input 
                                type="text" 
                                value={editPassword}
                                onChange={(e) => setEditPassword(e.target.value)}
                                className="border border-gray-300 rounded px-2 py-1 text-sm w-24 outline-none focus:border-cyan-500 bg-white"
                                placeholder="Contraseña"
                              />
                            </div>
                            <div className="flex items-center gap-2">
                              <button onClick={() => handleEditSave(driver)} className="text-white bg-green-500 hover:bg-green-600 px-3 py-1 text-xs font-bold rounded shadow-sm flex items-center gap-1"><Check className="w-3.5 h-3.5" /> Guardar</button>
                              <button onClick={() => setEditingId(null)} className="text-gray-600 bg-gray-200 hover:bg-gray-300 px-3 py-1 text-xs font-bold rounded shadow-sm flex items-center gap-1"><X className="w-3.5 h-3.5" /> Cancelar</button>
                            </div>
                          </div>
                        ) : (
                          <div className="font-medium flex items-center gap-2">
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                              <button onClick={() => { setEditingId(driver.id); setEditName(driver.name); setEditPassword(driver.password || ''); }} className="text-gray-400 hover:text-cyan-600 transition-colors" title="Editar"><Edit2 className="w-3.5 h-3.5" /></button>
                              <button onClick={() => updateDriver({ ...driver, isHidden: !driver.isHidden })} className={`transition-colors ${driver.isHidden ? 'text-gray-400 hover:text-gray-600' : 'text-gray-400 hover:text-cyan-600'}`} title={driver.isHidden ? "Mostrar a restaurantes" : "Ocultar a restaurantes"}>
                                {driver.isHidden ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                              </button>
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

  const [showAddForm, setShowAddForm] = useState(false);

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Panel Central</h1>
          <p className="text-gray-500 text-sm mt-1">Supervisión de flota y gestión de repartidores.</p>
        </div>
        
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex bg-white border border-gray-200 p-1 rounded-xl shadow-sm h-[42px] items-center">
            <button 
              onClick={() => setCurrentView('dashboard')}
              className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${currentView === 'dashboard' ? 'bg-cyan-500 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Dashboard
            </button>
            <button 
              onClick={() => setCurrentView('webhooks')}
              className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${currentView === 'webhooks' ? 'bg-cyan-500 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <Webhook className="w-4 h-4" />
              Webhooks
            </button>
          </div>
          
          <div className="bg-white border border-gray-200 px-4 py-2 rounded-lg shadow-sm h-[42px] flex flex-col justify-center">
            <div className="text-[10px] text-gray-500 font-medium uppercase tracking-wider leading-tight">Repartidores Activos</div>
            <div className="text-lg font-black leading-tight">{activeDrivers.length} / {drivers.length}</div>
          </div>
          
          {currentView === 'dashboard' && (
            <button 
              onClick={() => setShowAddForm(!showAddForm)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition-all shadow-sm h-[42px] ${showAddForm ? 'bg-gray-800 text-white hover:bg-gray-900' : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'}`}
            >
              {showAddForm ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
              {showAddForm ? 'Cerrar' : 'Añadir Repartidor'}
            </button>
          )}
        </div>
      </div>

      {currentView === 'webhooks' ? (
        <WebhookSettings config={appConfig} onUpdate={updateAppConfig} />
      ) : (
        <>
          {showAddForm && (
        <div className="bg-white border-2 border-cyan-100 p-6 rounded-2xl shadow-md animate-in fade-in slide-in-from-top-4 duration-300">
          <form 
            onSubmit={(e) => { 
              e.preventDefault(); 
              if (newDriverName.trim()) { 
                addDriver(newDriverName.trim(), newDriverRestaurant, newDriverPassword.trim()); 
                setNewDriverName(''); 
                setNewDriverPassword('');
                setShowAddForm(false);
              } 
            }}
            className="flex flex-col md:flex-row items-end gap-4"
          >
            <div className="flex-1 w-full">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5">Nombre del Repartidor</label>
              <input 
                type="text"
                placeholder="Nombre del nuevo repartidor..."
                className="w-full border border-gray-300 rounded-xl px-4 py-2 text-base outline-none focus:border-cyan-500"
                value={newDriverName}
                onChange={(e) => setNewDriverName(e.target.value)}
                autoFocus
              />
            </div>
            <div className="flex-1 w-full max-w-[150px]">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5">Contraseña</label>
              <input 
                type="text"
                placeholder="Opcional"
                className="w-full border border-gray-300 rounded-xl px-4 py-2 text-base outline-none focus:border-cyan-500"
                value={newDriverPassword}
                onChange={(e) => setNewDriverPassword(e.target.value)}
              />
            </div>
            <div className="flex-1 w-full">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5">Asignar a Restaurante</label>
              <select
                value={newDriverRestaurant}
                onChange={(e) => setNewDriverRestaurant(e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-4 py-2 text-base outline-none focus:border-cyan-500 bg-white"
              >
                <option value="restaurant1">Restaurante Tropical</option>
                <option value="restaurant2">Pizzería S^tatua</option>
              </select>
            </div>
            <button 
              type="submit" 
              className="w-full md:w-auto bg-cyan-600 text-white px-8 py-2 rounded-xl font-bold hover:bg-cyan-700 transition-colors"
              disabled={!newDriverName.trim()}
            >
              Guardar Repartidor
            </button>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <RestaurantColumn title="Restaurante Tropical" restId="restaurant1" icon={TreePalm} themeColor="orange" />
        <RestaurantColumn title="Pizzería S^tatua" restId="restaurant2" icon={Pizza} themeColor="rose" />
      </div>

      {orders && orders.filter(o => o.status === 'En Cola').length > 0 && (
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm mt-8">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></div>
            Total Pedidos en Cola ({orders.filter(o => o.status === 'En Cola').length})
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {orders.filter(o => o.status === 'En Cola').map(order => (
              <div key={order.id} className="border border-orange-100 bg-orange-50/30 p-4 rounded-xl">
                <div className="flex justify-between mb-1">
                  <div className="flex flex-col gap-1">
                    <span className="font-bold">#{order.orderNumber}</span>
                    {order.price !== undefined ? (
                      <div className="flex items-center gap-1 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100 w-fit">
                        <span className="text-emerald-700 font-black text-xs">{order.price === 0 ? "Pagado" : "$" + order.price.toFixed(2)}</span>
                        <button 
                          onClick={() => {
                            const newPrice = window.prompt('Editar precio:', order.price?.toString());
                            if (newPrice !== null) {
                              updateOrder({ ...order, price: parseFloat(newPrice) || 0 });
                            }
                          }}
                          className="text-emerald-400 hover:text-emerald-600"
                        >
                          <Edit2 className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    ) : (
                      <button 
                        onClick={() => {
                          const newPrice = window.prompt('Asignar precio:');
                          if (newPrice !== null) {
                            updateOrder({ ...order, price: parseFloat(newPrice) || 0 });
                          }
                        }}
                        className="text-[10px] bg-gray-50 text-gray-400 px-1.5 py-0.5 rounded border border-dashed border-gray-200 hover:bg-emerald-50 hover:text-emerald-600 transition-colors w-fit"
                      >
                        + Precio
                      </button>
                    )}
                  </div>
                  <span className="text-xs text-gray-500 bg-white px-2 py-0.5 rounded-full border border-gray-100 h-fit">
                    {order.restaurantId === 'restaurant1' ? 'Tropical' : 'S^tatua'}
                  </span>
                </div>
                <div className="text-sm font-medium">{order.customerName}</div>
                
              </div>
            ))}
          </div>
        </div>
      )}
      </>
      )}
    </div>
  );
}
