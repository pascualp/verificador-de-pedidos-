import React, { useState } from 'react';
import { Driver } from '../types';
import { User, CheckCircle, Clock, MapPin, Package, RotateCcw } from 'lucide-react';
import { TimeElapsed } from './TimeElapsed';

export function DriverDashboard({ drivers, updateDriver }: { drivers: Driver[], updateDriver: (d: Driver) => void }) {
  const [selectedDriverId, setSelectedDriverId] = useState<string | null>(null);

  const selectedDriver = drivers.find(d => d.id === selectedDriverId);

  const handleMarkAsFree = (driver: Driver) => {
    updateDriver({
      ...driver,
      status: 'Libre',
      activeOrders: 0,
      totalOrders: (driver.totalOrders || 0) + driver.activeOrders,
      lastUpdated: new Date().toISOString()
    });
  };

  if (!selectedDriverId) {
    return (
      <div className="flex flex-col gap-6 max-w-md mx-auto">
        <div className="text-center">
          <h2 className="text-2xl font-black text-gray-900">Panel de Repartidor</h2>
          <p className="text-gray-500 mt-1">Selecciona tu nombre para continuar</p>
        </div>

        <div className="grid grid-cols-1 gap-3">
          {drivers.map(driver => (
            <button
              key={driver.id}
              onClick={() => setSelectedDriverId(driver.id)}
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
      </div>
    );
  }

  if (!selectedDriver) return null;

  return (
    <div className="flex flex-col gap-6 max-w-md mx-auto">
      <button 
        onClick={() => setSelectedDriverId(null)}
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
