import { useState, FormEvent } from 'react';
import { Driver, Order } from '../types';
import { User, RotateCcw, Clock, Plus, MapPin } from 'lucide-react';
import { TimeElapsed } from './TimeElapsed';

export function RestaurantDashboard({ drivers, updateDriver, themeColor, orders, updateOrder, addOrder, restaurantId }: { drivers: Driver[], updateDriver: (d: Driver) => void, themeColor: 'orange' | 'rose', orders?: Order[], updateOrder?: (o: Order) => void, addOrder?: (orderNumber: string, customerName: string, customerPhone: string, restaurantId: string, address: string) => void, restaurantId?: string }) {
  const [orderInputs, setOrderInputs] = useState<Record<string, string>>({});
  
  // New order form state
  const [newOrderNumber, setNewOrderNumber] = useState('');
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');
  const [newCustomerAddress, setNewCustomerAddress] = useState('');
  const [isAddingOrder, setIsAddingOrder] = useState(false);

  const handleAddOrder = (e: FormEvent) => {
    e.preventDefault();
    if (newOrderNumber && restaurantId && addOrder) {
      addOrder(newOrderNumber, newCustomerName, newCustomerPhone, restaurantId, newCustomerAddress);
      setNewOrderNumber('');
      setNewCustomerName('');
      setNewCustomerPhone('');
      setNewCustomerAddress('');
      setIsAddingOrder(false);
    }
  };

  const handleAssign = (driver: Driver) => {
    const ordersToAssign = parseInt(orderInputs[driver.id] || '0', 10);
    if (ordersToAssign > 0) {
      updateDriver({
        ...driver,
        status: 'Repartiendo',
        activeOrders: (driver.activeOrders || 0) + ordersToAssign,
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
    
    if (orders && updateOrder) {
      orders.filter(o => o.driverId === driver.id && o.status === 'Asignado').forEach(o => {
        updateOrder({
          ...o,
          status: 'Entregado'
        });
      });
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <div className="flex justify-between items-start md:items-end mb-4 flex-col md:flex-row gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Panel de Restaurante</h1>
            <p className="text-gray-500 text-sm mt-1">Ingresa nuevos pedidos y asígnalos a los repartidores.</p>
          </div>
          <button
            onClick={() => setIsAddingOrder(!isAddingOrder)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition-colors ${themeColor === 'orange' ? 'bg-orange-500 hover:bg-orange-600 text-white' : 'bg-rose-500 hover:bg-rose-600 text-white'}`}
          >
            <Plus className="w-5 h-5" />
            Nuevo Pedido
          </button>
        </div>

        {isAddingOrder && (
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm mb-8 animate-in fade-in slide-in-from-top-4 duration-300">
            <h3 className="text-lg font-bold mb-4">Ingresar Nuevo Pedido</h3>
            <form onSubmit={handleAddOrder} className="flex flex-col md:flex-row gap-4 items-end">
              <div className="flex-1 w-full">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5">Número de Pedido *</label>
                <input 
                  type="text" 
                  required
                  value={newOrderNumber}
                  onChange={(e) => setNewOrderNumber(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                  placeholder="Ej: 145"
                />
              </div>
              <div className="flex-1 w-full">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5">Cliente</label>
                <input 
                  type="text" 
                  value={newCustomerName}
                  onChange={(e) => setNewCustomerName(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                  placeholder="Nombre del cliente"
                />
              </div>
              <div className="flex-1 w-full">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5">Teléfono</label>
                <input 
                  type="text" 
                  value={newCustomerPhone}
                  onChange={(e) => setNewCustomerPhone(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                  placeholder="Teléfono (opcional)"
                />
              </div>
              <div className="flex-[2] w-full">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5">Dirección</label>
                <input 
                  type="text" 
                  value={newCustomerAddress}
                  onChange={(e) => setNewCustomerAddress(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                  placeholder="Calle, Número, Localidad..."
                />
              </div>
              <div className="w-full md:w-auto">
                <button type="submit" className={`w-full md:w-auto px-6 py-2.5 rounded-lg font-bold text-white transition-colors ${themeColor === 'orange' ? 'bg-orange-600 hover:bg-orange-700' : 'bg-rose-600 hover:bg-rose-700'}`}>
                  Guardar Pedido
                </button>
              </div>
            </form>
          </div>
        )}

        {orders && orders.filter(o => o.status === 'En Cola').length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></div>
              Pedidos en Cola ({orders.filter(o => o.status === 'En Cola').length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {orders.filter(o => o.status === 'En Cola').map(order => (
                <div key={order.id} className="bg-white p-4 rounded-xl border border-orange-200 shadow-sm">
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-black text-lg">#{order.orderNumber}</span>
                    <span className="text-xs text-gray-500"><TimeElapsed startTime={order.createdAt} /></span>
                  </div>
                  <div className="text-sm text-gray-700 mb-1 font-medium">{order.customerName}</div>
                  {order.customerPhone && <div className="text-xs text-gray-500 mb-1">{order.customerPhone}</div>}
                  {order.address && (
                    <div className="text-xs text-cyan-600 bg-cyan-50 p-1.5 rounded border border-cyan-100 mb-3 flex items-start gap-1.5 mt-1">
                      <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                      <span className="line-clamp-2">{order.address}</span>
                    </div>
                  )}
                  
                  <div className="mt-3">
                    <label className="text-xs text-gray-500 block mb-1">Asignar a:</label>
                    <div className="flex gap-2">
                      <select 
                        className="flex-1 border border-gray-300 rounded-lg px-2 py-1.5 text-sm"
                        onChange={(e) => {
                          const driverId = e.target.value;
                          if (driverId && updateOrder && updateDriver) {
                            const driver = drivers.find(d => d.id === driverId);
                            if (driver) {
                              updateOrder({
                                ...order,
                                status: 'Asignado',
                                driverId: driver.id,
                                assignedAt: new Date().toISOString()
                              });
                              updateDriver({
                                ...driver,
                                status: 'Repartiendo',
                                activeOrders: driver.activeOrders + 1,
                                lastUpdated: new Date().toISOString()
                              });
                            }
                            e.target.value = '';
                          }
                        }}
                        defaultValue=""
                      >
                        <option value="" disabled>Seleccionar...</option>
                        {drivers.map(d => (
                          <option key={d.id} value={d.id}>{d.name} {d.status === 'Repartiendo' ? `(${d.activeOrders} en curso)` : ''}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {drivers.map(driver => (
          <div key={driver.id} className="bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col relative group overflow-hidden">
            <div className="px-4 py-2.5 text-white text-sm font-black tracking-widest uppercase shadow-sm bg-cyan-500">
              {driver.name}
            </div>
            <div className="p-5 flex flex-col relative flex-grow">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="bg-gray-100 p-2.5 rounded-full shrink-0">
                    <User className="w-5 h-5 text-gray-700" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-col">
                      <div className="text-xs text-gray-500 mt-0.5 font-medium">Historial: {driver.totalOrders || 0} pedidos</div>
                      {driver.scheduledDays && driver.scheduledDays.length > 0 && (
                        <div className="text-[10px] text-gray-400 mt-1 uppercase tracking-wider font-semibold">
                          Días: {driver.scheduledDays.map(d => d.slice(0,3)).join(', ')}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="shrink-0 ml-2">
                  <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${driver.status === 'Libre' ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-blue-100 text-blue-700 border border-blue-200'}`}>
                    {driver.status}
                  </span>
                </div>
              </div>

              <div className="flex-grow flex flex-col justify-end mt-2 border-t border-gray-100 pt-4">
                <div className="flex flex-col gap-3">
                  {driver.status === 'Repartiendo' && (
                    <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded-md text-center flex flex-col items-center justify-center gap-1 mb-1">
                      <div>Llevando <strong>{driver.activeOrders}</strong> {driver.activeOrders === 1 ? 'pedido' : 'pedidos'}</div>
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Clock className="w-3 h-3" />
                        Hace: <TimeElapsed startTime={driver.lastUpdated} />
                      </div>
                    </div>
                  )}
                  
                  <div className="flex gap-2 items-center">
                    <input 
                      type="number"
                      min="1"
                      placeholder="+"
                      className="w-16 border border-gray-300 rounded-lg px-2 py-2 text-sm outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-center"
                      value={orderInputs[driver.id] || ''}
                      onChange={(e) => setOrderInputs({ ...orderInputs, [driver.id]: e.target.value })}
                    />
                    <button 
                      onClick={() => handleAssign(driver)}
                      disabled={!orderInputs[driver.id] || parseInt(orderInputs[driver.id], 10) < 1}
                      className="flex-1 bg-cyan-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-cyan-600 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {driver.status === 'Repartiendo' ? 'Añadir' : 'Asignar'}
                    </button>
                  </div>

                  {driver.status === 'Repartiendo' && (
                    <button 
                      onClick={() => handleReturn(driver)}
                      className="w-full border-2 border-cyan-500 text-cyan-500 px-4 py-2 rounded-lg text-sm font-medium hover:bg-cyan-50 flex items-center justify-center gap-2 transition-colors mt-1"
                    >
                      <RotateCcw className="w-4 h-4" />
                      Marcar como Libre
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
