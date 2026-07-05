import React, { useState } from 'react';
import { Driver, Order } from '../types';
import { User, CheckCircle, Clock, MapPin, Package, RotateCcw, ArrowLeft } from 'lucide-react';
import { TimeElapsed } from './TimeElapsed';

export function DriverDashboard({ drivers, updateDriver, orders, updateOrder, onBack }: { drivers: Driver[], updateDriver: (d: Driver) => void, orders?: Order[], updateOrder?: (o: Order) => void, onBack: () => void }) {
  const [selectedDriverId, setSelectedDriverId] = useState<string | null>(() => {
    return localStorage.getItem('dumoh_selected_driver_v2') || null;
  });
  const [driverPasswordInput, setDriverPasswordInput] = useState('');
  const [loginError, setLoginError] = useState('');

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
    
    const matchedDriver = drivers.find(d => d.password && d.password === pw);
    if (matchedDriver) {
      handleSelectDriver(matchedDriver.id);
      setDriverPasswordInput('');
      setLoginError('');
    } else {
      setLoginError('Código incorrecto o no encontrado.');
    }
  };

  const selectedDriver = drivers.find(d => d.id === selectedDriverId);

  const handleMarkAsFree = (driver: Driver) => {
    updateDriver({
      ...driver,
      status: 'Libre',
      activeOrders: 0,
      totalOrders: (driver.totalOrders || 0) + driver.activeOrders,
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

  if (!selectedDriver) return null;

  return (
    <div className="flex flex-col gap-6 max-w-md mx-auto">
      <button 
        onClick={() => handleSelectDriver(null)}
        className="text-gray-500 text-sm font-medium flex items-center gap-1 hover:text-gray-900"
      >
        <RotateCcw className="w-4 h-4" />
        Cambiar de repartidor
      </button>

      <div className="bg-white rounded-2xl border-2 border-gray-100 shadow-xl overflow-hidden flex flex-col">
        <div className="bg-gray-800 p-6 text-white text-center">
          <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-3 border-2 border-gray-600">
            <User className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black">{selectedDriver.name}</h2>
          <div className="inline-flex items-center gap-2 mt-2 px-3 py-1 bg-gray-700 rounded-full text-xs font-bold uppercase tracking-widest text-gray-300">
            {selectedDriver.status}
          </div>
        </div>

        <div className="p-6 flex flex-col gap-6">
          {selectedDriver.status === 'Repartiendo' ? (
            <>
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-5 flex items-center gap-4">
                <div className="bg-blue-100 p-3 rounded-lg">
                  <Package className="w-8 h-8 text-blue-600" />
                </div>
                <div>
                  <div className="text-2xl font-black text-blue-900">{selectedDriver.activeOrders}</div>
                  <div className="text-sm text-blue-700 font-medium uppercase tracking-wide">Pedidos activos</div>
                </div>
              </div>

              <div className="flex items-start gap-3 text-gray-600 bg-gray-50 p-4 rounded-xl">
                <Clock className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <div className="text-sm font-bold">Tiempo en ruta</div>
                  <div className="text-lg font-medium text-gray-900">
                    <TimeElapsed startTime={selectedDriver.lastUpdated} />
                  </div>
                </div>
              </div>

              {orders && orders.filter(o => o.driverId === selectedDriver.id && o.status === 'Asignado').length > 0 && (
                <div className="mt-2 border-t border-gray-100 pt-4">
                  <h3 className="text-sm font-bold text-gray-900 mb-3">Detalle de Pedidos:</h3>
                  <div className="flex flex-col gap-3">
                    {orders.filter(o => o.driverId === selectedDriver.id && o.status === 'Asignado').map(order => (
                      <div key={order.id} className="bg-white border border-gray-200 p-4 rounded-xl shadow-sm flex flex-col gap-3">
                        <div className="flex justify-between items-start">
                          <span className="font-black text-xl text-gray-900">#{order.orderNumber}</span>
                          <span className="text-xs text-gray-500 font-medium bg-gray-100 px-2 py-1 rounded">
                            <TimeElapsed startTime={order.assignedAt || order.createdAt} />
                          </span>
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
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button
                onClick={() => handleMarkAsFree(selectedDriver)}
                className="w-full bg-green-500 hover:bg-green-600 text-white py-5 rounded-2xl text-xl font-black shadow-lg shadow-green-200 transition-all flex items-center justify-center gap-3 transform active:scale-95"
              >
                <CheckCircle className="w-7 h-7" />
                TERMINAR REPARTO
              </button>
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
            </div>
          )}
        </div>
      </div>
      
      <div className="text-center text-gray-400 text-xs mt-4">
        Historial total: {selectedDriver.totalOrders || 0} pedidos entregados
      </div>
    </div>
  );
}
