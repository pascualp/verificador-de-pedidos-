import React, { useState } from 'react';
import { Driver, Order } from '../types';
import { User, CheckCircle, Clock, MapPin, Package, RotateCcw, ArrowLeft, CreditCard, Banknote, Pizza, TreePalm } from 'lucide-react';
import { TimeRemaining } from './TimeRemaining';

export function DriverDashboard({ drivers, updateDriver, orders, updateOrder, onBack }: { drivers: Driver[], updateDriver: (d: Driver) => void, orders?: Order[], updateOrder?: (o: Order) => void, onBack: () => void }) {
  const [selectedDriverId, setSelectedDriverId] = useState<string | null>(() => {
    return localStorage.getItem('dumoh_selected_driver_v2') || null;
  });
  const [driverPasswordInput, setDriverPasswordInput] = useState('');
  const [loginError, setLoginError] = useState('');
  const [completingOrderId, setCompletingOrderId] = useState<string | null>(null);


  const handleSelectDriver = (id: string | null) => {
    setSelectedDriverId(id);
    if (id) {
      localStorage.setItem('dumoh_selected_driver_v2', id);
    } else {
      localStorage.removeItem('dumoh_selected_driver_v2');
    }
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const pw = driverPasswordInput.trim();
    if (!pw) return;
    
    const matchedDriver = drivers.find(d => d.password && String(d.password).trim() === pw);
    if (matchedDriver) {
      handleSelectDriver(matchedDriver.id);
      setDriverPasswordInput('');
      setLoginError('');
    } else {
      setLoginError('Código incorrecto o no encontrado.');
    }
  };

  const selectedDriver = drivers.find(d => d.id === selectedDriverId);

  const getDriverTotal = (driver: Driver) => {
    const delivered = driver.totalCollected || 0;
    const active = (orders || []).filter(o => o.driverId === driver.id && o.status === 'Asignado').reduce((sum, o) => sum + (o.price || 0), 0);
    return delivered + active;
  };

  
  const handleCompleteIndividualOrder = (order: Order, paymentMethod: 'efectivo' | 'tarjeta' | 'pagado') => {
    const isEfectivo = paymentMethod === 'efectivo';
    const amount = isEfectivo ? (order.price || 0) : 0;
    
    if (updateOrder) {
      updateOrder({
        ...order,
        status: 'Entregado',
        paymentMethod: paymentMethod === 'pagado' ? undefined : paymentMethod
      });
    }

    if (updateDriver && selectedDriver) {
      const remainingActive = (orders || []).filter(o => o.driverId === selectedDriver.id && o.status === 'Asignado' && o.id !== order.id).length;
      updateDriver({
        ...selectedDriver,
        status: remainingActive === 0 ? 'Libre' : 'Repartiendo',
        activeOrders: remainingActive,
        totalOrders: (selectedDriver.totalOrders || 0) + 1,
        totalCollected: (selectedDriver.totalCollected || 0) + amount,
        lastUpdated: new Date().toISOString()
      });
    }

    setCompletingOrderId(null);
  };

  const handleMarkAsFree = (driver: Driver) => {
    const assignedOrders = orders?.filter(o => o.driverId === driver.id && o.status === 'Asignado') || [];
    const shiftTotal = assignedOrders.reduce((sum, o) => {
      // Only sum up orders that are not marked as paid and have a price
      if (o.isPaid || o.price === 0) return sum;
      return sum + (o.price || 0);
    }, 0);

    updateDriver({
      ...driver,
      status: 'Libre',
      activeOrders: 0,
      totalOrders: (driver.totalOrders || 0) + driver.activeOrders,
      totalCollected: (driver.totalCollected || 0) + shiftTotal,
      lastUpdated: new Date().toISOString()
    });
    
    if (orders && updateOrder) {
      assignedOrders.forEach(o => {
        updateOrder({
          ...o,
          status: 'Entregado'
        });
      });
    }
  };

  const handleCloseShift = (driver: Driver) => {
    const total = getDriverTotal(driver);
    
    let breakdownStr = '';
    if (orders) {
      const shiftOrders = orders.filter(o => 
        o.driverId === driver.id && 
        o.status === 'Entregado' &&
        (!driver.shiftStartedAt || new Date(o.assignedAt || o.createdAt) >= new Date(driver.shiftStartedAt))
      );
      
      const cashCount = shiftOrders.filter(o => o.paymentMethod === 'efectivo' && (o.price || 0) > 0).length;
      const cardCount = shiftOrders.filter(o => o.paymentMethod === 'tarjeta').length;
      const paidCount = shiftOrders.filter(o => !o.paymentMethod || o.price === 0).length;
      
      breakdownStr = `\n\nDesglose de entregas:\n- Efectivo: ${cashCount}\n- Tarjeta: ${cardCount}\n- Ya Pagado: ${paidCount}`;
    }

    if (window.confirm(`¿Cerrar turno de ${driver.name}?\nTotal recaudado: $${total.toFixed(2)}${breakdownStr}\n\nEsta acción reiniciará la caja a $0.00.`)) {
      updateDriver({
        ...driver,
        totalCollected: 0,
        shiftStartedAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString()
      });
    }
  };

  if (!selectedDriverId) {
    const driversWithoutPassword = drivers.filter(d => !d.password);
    
    return (
      <div className="flex flex-col gap-6 max-w-md mx-auto">
        <button 
          onClick={onBack}
          className="text-gray-500 text-sm font-medium flex items-center gap-1 hover:text-gray-900 w-fit"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver
        </button>
        <div className="text-center">
          <h2 className="text-2xl font-black text-gray-900">Panel de Repartidor</h2>
          <p className="text-gray-500 mt-1">Ingresa tu código de acceso para continuar</p>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <form onSubmit={handleLoginSubmit} className="flex flex-col gap-4">
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5">Código de Acceso</label>
              <input 
                type="password"
                value={driverPasswordInput}
                onChange={(e) => setDriverPasswordInput(e.target.value)}
                placeholder="Ingresa tu contraseña..."
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-lg text-center font-black tracking-widest outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
              />
              {loginError && <p className="text-red-500 text-sm mt-2 font-medium text-center">{loginError}</p>}
            </div>
            <button 
              type="submit"
              className="bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-3 rounded-lg transition-colors w-full"
            >
              Entrar
            </button>
          </form>
        </div>

        {driversWithoutPassword.length > 0 && (
          <>
            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-gray-200"></div>
              <span className="flex-shrink-0 mx-4 text-gray-400 text-xs font-bold uppercase">o selecciona (sin código)</span>
              <div className="flex-grow border-t border-gray-200"></div>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {driversWithoutPassword.map(driver => (
                <button
                  key={driver.id}
                  onClick={() => handleSelectDriver(driver.id)}
                  className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between hover:border-cyan-500 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="bg-gray-100 p-2 rounded-full group-hover:bg-cyan-50 group-hover:text-cyan-600">
                      <User className="w-5 h-5" />
                    </div>
                    <span className="font-bold text-lg">{driver.name}</span>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-bold ${driver.status === 'Libre' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                    {driver.status}
                  </span>
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    );
  }

  if (!selectedDriver) {
    if (drivers.length === 0) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500 mx-auto mb-4"></div>
            <p className="text-gray-500 text-sm">Cargando repartidores...</p>
          </div>
        </div>
      );
    }

    return (
      <div className="flex flex-col gap-6 max-w-md mx-auto text-center py-12 px-4">
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col items-center gap-4">
          <div className="bg-red-50 p-3 rounded-full text-red-500">
            <User className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-gray-900">Sesión Expirada o Repartidor Eliminado</h3>
          <p className="text-gray-500 text-sm">
            El repartidor con el que habías iniciado sesión ya no existe en el sistema o fue eliminado por el administrador.
          </p>
          <button
            onClick={() => {
              localStorage.removeItem('dumoh_selected_driver_v2');
              setSelectedDriverId(null);
            }}
            className="w-full bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-3 rounded-xl transition-colors shadow-sm"
          >
            Volver a la selección de repartidores
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-md mx-auto">
      <button 
        onClick={() => {
          handleSelectDriver(null);
          onBack();
        }}
        className="text-gray-500 text-sm font-medium flex items-center gap-1 hover:text-gray-900"
      >
        <RotateCcw className="w-4 h-4" />
        Cerrar Sesión
      </button>

      <div className="bg-white rounded-2xl border-2 border-gray-100 shadow-xl overflow-hidden flex flex-col">
        <div className="bg-gray-800 p-6 text-white text-center">
          <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-3 border-2 border-gray-600">
            <User className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black">{selectedDriver.name}</h2>
          <div className="inline-flex items-center gap-2 mt-2 px-3 py-1 bg-gray-700 rounded-full text-xs font-bold uppercase tracking-widest text-gray-300">
            {orders && orders.some(o => o.driverId === selectedDriver.id && o.status === 'Asignado') ? 'Repartiendo' : selectedDriver.status}
          </div>
        </div>

        <div className="p-6 flex flex-col gap-6">
          {selectedDriver.status === 'Repartiendo' || (orders && orders.some(o => o.driverId === selectedDriver.id && o.status === 'Asignado')) ? (
            <>
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-5 flex items-center gap-4">
                <div className="bg-blue-100 p-3 rounded-lg">
                  <Package className="w-8 h-8 text-blue-600" />
                </div>
                <div>
                  <div className="text-2xl font-black text-blue-900">
                    {orders ? orders.filter(o => o.driverId === selectedDriver.id && o.status === 'Asignado').length : selectedDriver.activeOrders}
                  </div>
                  <div className="text-sm text-blue-700 font-medium uppercase tracking-wide">Pedidos activos</div>
                </div>
              </div>

              

              {orders && orders.filter(o => o.driverId === selectedDriver.id && o.status === 'Asignado').length > 0 && (
                <div className="mt-2 border-t border-gray-100 pt-4">
                  <h3 className="text-sm font-bold text-gray-900 mb-3">Detalle de Pedidos:</h3>
                  <div className="flex flex-col gap-3">
                    {orders.filter(o => o.driverId === selectedDriver.id && o.status === 'Asignado').map(order => (
                      <div key={order.id} className="bg-white border border-gray-200 p-4 rounded-xl shadow-sm flex flex-col gap-3">
                        <div className="flex justify-between items-start">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                              <span className="font-black text-xl text-gray-900">#{order.orderNumber}</span>
                              {order.restaurantId === 'restaurant1' ? (
                                <span className="inline-flex items-center gap-1 bg-orange-50 text-orange-700 text-xs px-2 py-0.5 rounded-full font-bold border border-orange-100">
                                  <TreePalm className="w-3 h-3 text-orange-500" />
                                  Tropical
                                </span>
                              ) : order.restaurantId === 'restaurant2' ? (
                                <span className="inline-flex items-center gap-1 bg-rose-50 text-rose-700 text-xs px-2 py-0.5 rounded-full font-bold border border-rose-100">
                                  <Pizza className="w-3 h-3 text-rose-500" />
                                  s'Estatua
                                </span>
                              ) : null}
                            </div>
                          </div>
                          {order.price !== undefined && (
                            <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-lg font-black text-lg shadow-sm border border-emerald-200">
                              {(order.price === 0 || order.isPaid) ? "Pagado" : "$" + order.price.toFixed(2)}
                            </span>
                          )}
                        </div>
                        
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2 text-gray-800 font-bold">
                            <User className="w-4 h-4 text-gray-400" />
                            {order.customerName}
                          </div>
                          {order.customerPhone && (
                            <a href={`tel:${order.customerPhone}`} className="flex items-center gap-2 text-cyan-600 font-medium text-sm hover:underline">
                              <span className="bg-cyan-50 p-1 rounded-full">
                                <RotateCcw className="w-3 h-3 -rotate-90" /> {/* Using RotateCcw as a phone-ish icon placeholder or similar if needed, but better just text */}
                              </span>
                              {order.customerPhone}
                            </a>
                          )}
                        </div>

                        {order.address && (
                          <div className="flex flex-col gap-2 mt-1 border-t border-gray-50 pt-3">
                            <div className="flex items-start gap-2 text-sm text-gray-700 font-medium">
                              <MapPin className="w-4 h-4 text-rose-500 mt-0.5 shrink-0" />
                              {order.address}
                            </div>
                            <a 
                              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.address)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="w-full bg-rose-50 text-rose-600 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 hover:bg-rose-100 transition-colors border border-rose-100"
                            >
                              <MapPin className="w-4 h-4" />
                              VER EN GPS
                            </a>
                          </div>
                        )}
                        
                        <div className="mt-2 pt-3 border-t border-gray-100">
                          {completingOrderId === order.id ? (
                            <div className="flex flex-col gap-2">
                              <p className="text-sm font-bold text-gray-800 text-center mb-1">¿Cómo se pagó?</p>
                              {(order.price === 0 || order.isPaid) ? (
                                <button
                                  onClick={() => handleCompleteIndividualOrder(order, 'pagado')}
                                  className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-2 rounded-lg font-bold flex items-center justify-center gap-2"
                                >
                                  <CheckCircle className="w-5 h-5" /> Confirmar Entrega
                                </button>
                              ) : (
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handleCompleteIndividualOrder(order, 'efectivo')}
                                    className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white py-2 rounded-lg font-bold flex flex-col items-center justify-center gap-1"
                                  >
                                    <Banknote className="w-5 h-5" /> Efectivo
                                  </button>
                                  <button
                                    onClick={() => handleCompleteIndividualOrder(order, 'tarjeta')}
                                    className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg font-bold flex flex-col items-center justify-center gap-1"
                                  >
                                    <CreditCard className="w-5 h-5" /> Tarjeta
                                  </button>
                                </div>
                              )}
                              <button
                                onClick={() => setCompletingOrderId(null)}
                                className="w-full text-gray-500 text-sm mt-1 py-1 font-medium hover:text-gray-800"
                              >
                                Cancelar
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setCompletingOrderId(order.id)}
                              className="w-full border-2 border-emerald-500 text-emerald-600 hover:bg-emerald-50 py-2.5 rounded-lg font-black text-sm uppercase tracking-wide flex items-center justify-center gap-2 transition-colors"
                            >
                              <CheckCircle className="w-5 h-5" /> Marcar Entregado
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              
            </>
          ) : (
            <div className="text-center py-12 flex flex-col items-center gap-4">
              <div className="bg-green-100 p-4 rounded-full">
                <CheckCircle className="w-12 h-12 text-green-500" />
              </div>
              <div>
                <h3 className="text-xl font-black text-gray-900">¡Estás disponible!</h3>
                <p className="text-gray-500 mt-1">Espera a que el restaurante te asigne nuevos pedidos.</p>
              </div>
              
              <div className="mt-8 w-full border-t border-gray-100 pt-8">
                <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-6">
                  <div className="text-sm font-bold text-emerald-700 uppercase tracking-widest mb-1 text-center">Efectivo en Caja</div>
                  <div className="text-4xl font-black text-emerald-900 text-center">${getDriverTotal(selectedDriver).toFixed(2)}</div>
                  <p className="text-[10px] text-emerald-600 text-center mt-2 font-medium">El cierre de caja debe ser realizado por el restaurante.</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {selectedDriver.canSeePendingOrders && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden flex flex-col mt-6">
          <div className="bg-amber-500/10 border-b border-amber-500/20 p-4 flex items-center justify-between">
            <h3 className="font-bold text-amber-950 flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-600 animate-pulse" />
              Pedidos en Cola / Preparación
            </h3>
            <span className="bg-amber-100 text-amber-800 text-xs font-black px-2.5 py-0.5 rounded-full border border-amber-200">
              {orders ? orders.filter(o => o.status === 'En Cola' && (selectedDriver.restaurantId === 'ambos' || o.restaurantId === selectedDriver.restaurantId)).length : 0} pendientes
            </span>
          </div>
          
          <div className="p-4 flex flex-col gap-3">
            {(!orders || orders.filter(o => o.status === 'En Cola' && (selectedDriver.restaurantId === 'ambos' || o.restaurantId === selectedDriver.restaurantId)).length === 0) ? (
              <div className="text-center py-6 text-gray-500 text-sm font-medium">
                No hay pedidos en cola en este momento.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3.5">
                {orders
                  .filter(o => o.status === 'En Cola' && (selectedDriver.restaurantId === 'ambos' || o.restaurantId === selectedDriver.restaurantId))
                  .map(order => (
                    <div key={order.id} className="bg-gray-50/50 p-4 rounded-xl border border-gray-200 shadow-sm relative flex flex-col gap-1.5 hover:bg-gray-50 transition-colors">
                      {order.prepTime && (
                        <TimeRemaining startTime={order.createdAt} prepTimeMinutes={order.prepTime} />
                      )}
                      
                      <div className="flex items-center gap-2">
                        <span className="font-black text-lg text-gray-900">#{order.orderNumber}</span>
                        {order.restaurantId === 'restaurant1' ? (
                          <span className="inline-flex items-center gap-1 bg-orange-50 text-orange-700 text-xs px-2 py-0.5 rounded-full font-bold border border-orange-100">
                            <TreePalm className="w-3 h-3 text-orange-500" />
                            Tropical
                          </span>
                        ) : order.restaurantId === 'restaurant2' ? (
                          <span className="inline-flex items-center gap-1 bg-rose-50 text-rose-700 text-xs px-2 py-0.5 rounded-full font-bold border border-rose-100">
                            <Pizza className="w-3 h-3 text-rose-500" />
                            s'Estatua
                          </span>
                        ) : null}
                      </div>

                      <div className="text-sm font-bold text-gray-800 flex items-center gap-2">
                        <User className="w-3.5 h-3.5 text-gray-400" />
                        {order.customerName}
                      </div>

                      {order.address && (
                        <div className="text-xs text-gray-600 font-medium flex items-start gap-1.5 mt-0.5">
                          <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0 mt-0.5" />
                          <span className="line-clamp-2">{order.address}</span>
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      )}
      
      <div className="text-center text-gray-400 text-xs mt-4">
        Historial total: {selectedDriver.totalOrders || 0} pedidos entregados
      </div>
    </div>
  );
}
