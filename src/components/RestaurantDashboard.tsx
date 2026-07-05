import { useState, FormEvent } from 'react';
import { Driver, Order } from '../types';
import { User, RotateCcw, Clock, Plus, MapPin, Trash2, FileText, X } from 'lucide-react';
import { TimeRemaining } from './TimeRemaining';

export function RestaurantDashboard({ drivers, updateDriver, themeColor, orders, updateOrder, addOrder, deleteOrder, restaurantId }: { drivers: Driver[], updateDriver: (d: Driver) => void, themeColor: 'orange' | 'rose', orders?: Order[], updateOrder?: (o: Order) => void, addOrder?: (orderNumber: string, customerName: string, customerPhone: string, restaurantId: string, address: string, prepTime?: number) => void, deleteOrder?: (id: string) => void, restaurantId?: string }) {
  // New order form state
  const [newOrderNumber, setNewOrderNumber] = useState('');
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');
  const [newCustomerAddress, setNewCustomerAddress] = useState('');
  const [newPrepTime, setNewPrepTime] = useState('');
  const [isAddingOrder, setIsAddingOrder] = useState(false);
  const [selectedDriverHistory, setSelectedDriverHistory] = useState<Driver | null>(null);
  const [historyDate, setHistoryDate] = useState<string>(() => new Date().toLocaleDateString('en-CA'));

  const handleAddOrder = (e: FormEvent) => {
    e.preventDefault();
    if (restaurantId && addOrder) {
      // Usar número provisto o auto-generar número de pedido
      let generatedOrderNumber = newOrderNumber.trim();
      if (!generatedOrderNumber) {
        const existingNumbers = (orders || []).map(o => parseInt(o.orderNumber, 10)).filter(n => !isNaN(n));
        const nextNumber = existingNumbers.length > 0 ? Math.max(...existingNumbers) + 1 : 1000;
        generatedOrderNumber = nextNumber.toString();
      }

      addOrder(generatedOrderNumber, newCustomerName, newCustomerPhone, restaurantId, newCustomerAddress, newPrepTime ? parseInt(newPrepTime, 10) : undefined);
      setNewOrderNumber('');
      setNewCustomerName('');
      setNewCustomerPhone('');
      setNewCustomerAddress('');
      setNewPrepTime('');
      setIsAddingOrder(false);
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
            <p className="text-gray-500 text-sm mt-1">Gestión de pedidos y repartidores.</p>
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
              <div className="w-24 shrink-0">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">Nº Pedido</label>
                <input 
                  type="text"
                  value={newOrderNumber}
                  onChange={(e) => setNewOrderNumber(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-center font-bold"
                  placeholder="Auto"
                />
              </div>
              <div className="flex-1 w-full">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5">Cliente (Opcional)</label>
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
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5">Dirección (Opcional)</label>
                <input 
                  type="text" 
                  value={newCustomerAddress}
                  onChange={(e) => setNewCustomerAddress(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                  placeholder="Calle, Número, Localidad..."
                />
              </div>
              <div className="w-24 shrink-0">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">T. Prep (min)</label>
                <input 
                  type="number"
                  min="1"
                  value={newPrepTime}
                  onChange={(e) => setNewPrepTime(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-center"
                  placeholder="Ej: 15"
                />
              </div>
              <div className="w-full md:w-auto">
                <button type="submit" className={`w-full md:w-auto px-6 py-2.5 rounded-lg font-bold text-white transition-colors ${themeColor === 'orange' ? 'bg-orange-600 hover:bg-orange-700' : 'bg-rose-600 hover:bg-rose-700'}`}>
                  Generar Pedido
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
                <div key={order.id} className="bg-white p-4 rounded-xl border border-orange-200 shadow-sm relative">
                  {order.prepTime && (
                    <TimeRemaining startTime={order.createdAt} prepTimeMinutes={order.prepTime} />
                  )}
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-black text-lg">#{order.orderNumber}</span>
                    
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
                      <button
                        onClick={() => {
                          if (deleteOrder && window.confirm('¿Estás seguro de eliminar este pedido?')) {
                            deleteOrder(order.id);
                          }
                        }}
                        className="text-red-500 hover:bg-red-50 p-1.5 rounded-lg border border-transparent hover:border-red-200 transition-colors"
                        title="Eliminar Pedido"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
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
                      <button 
                        onClick={() => setSelectedDriverHistory(driver)}
                        className="text-[11px] mt-1 text-cyan-600 hover:text-cyan-700 font-bold flex items-center gap-1 w-fit bg-cyan-50 px-2 py-0.5 rounded transition-colors"
                      >
                        <FileText className="w-3 h-3" />
                        Ver detalle
                      </button>
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
                      {orders && orders.filter(o => o.driverId === driver.id && o.status === 'Asignado').length > 0 && (
                        <div className="text-xs font-bold text-cyan-600 my-0.5">
                          #{orders.filter(o => o.driverId === driver.id && o.status === 'Asignado').map(o => o.orderNumber).join(', #')}
                        </div>
                      )}
                      
                    </div>
                  )}
                  
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


      {/* Driver History Modal */}
      {selectedDriverHistory && (() => {
        const filteredOrders = (orders || []).filter(o => {
          if (o.driverId !== selectedDriverHistory.id || o.status !== 'Entregado') return false;
          const orderDate = new Date(o.assignedAt || o.createdAt).toLocaleDateString('en-CA');
          return orderDate === historyDate;
        });

        return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <div className="flex items-center gap-3">
                <div className="bg-cyan-100 p-2 rounded-lg">
                  <User className="w-5 h-5 text-cyan-600" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-lg">{selectedDriverHistory.name}</h3>
                  <p className="text-xs font-medium text-gray-500">Historial de tickets entregados</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedDriverHistory(null)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="px-5 py-3 border-b border-gray-100 bg-white flex items-center gap-3">
              <span className="text-sm font-bold text-gray-600">Fecha:</span>
              <input 
                type="date" 
                value={historyDate}
                onChange={(e) => setHistoryDate(e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm font-medium outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
              />
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              {filteredOrders.length === 0 ? (
                <div className="text-center py-10">
                  <FileText className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                  <p className="text-gray-500 font-medium">No hay pedidos entregados en esta fecha</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredOrders.map(order => (
                    <div key={order.id} className="border border-gray-100 bg-white p-4 rounded-xl flex flex-col gap-2 shadow-sm hover:border-gray-200 transition-colors">
                      <div className="flex justify-between items-start">
                        <div className="font-black text-lg">#{order.orderNumber}</div>
                        <div className="text-[10px] uppercase tracking-wider font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                          Entregado
                        </div>
                      </div>
                      <div className="flex flex-col gap-1 mt-1">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <User className="w-4 h-4 text-gray-400" />
                          <span className="font-medium">{order.customerName}</span>
                          {order.customerPhone && <span className="text-gray-400 text-xs">({order.customerPhone})</span>}
                        </div>
                        {order.address && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <MapPin className="w-4 h-4 text-gray-400" />
                            <span className="truncate">{order.address}</span>
                          </div>
                        )}
                        {order.assignedAt && (
                          <div className="flex items-center gap-2 text-xs text-gray-400 mt-1 bg-gray-50 p-2 rounded-lg w-fit">
                            <Clock className="w-3.5 h-3.5" />
                            Hora de asignación: {new Date(order.assignedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="p-4 border-t border-gray-100 bg-gray-50/50 flex justify-between items-center">
              <span className="text-sm font-bold text-gray-600">Total Entregados el {new Date(historyDate).toLocaleDateString()}</span>
              <span className="text-xl font-black text-gray-900">
                {filteredOrders.length}
              </span>
            </div>
          </div>
        </div>
        );
      })()}
    </div>
  );
}

