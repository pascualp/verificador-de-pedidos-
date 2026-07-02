import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { RestaurantDashboard } from './components/RestaurantDashboard';
import { CentralDashboard } from './components/CentralDashboard';
import { Driver } from './types';
import { Store, Building2, Lock, ArrowRight, X, Eye, EyeOff } from 'lucide-react';
import { db } from './firebase';
import { collection, onSnapshot, doc, setDoc, deleteDoc } from 'firebase/firestore';

export default function App() {
  const [role, setRole] = useState<'restaurant1' | 'restaurant2' | 'central' | null>(null);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [isReady, setIsReady] = useState(false);
  const [pendingRole, setPendingRole] = useState<'restaurant' | 'central' | null>(null);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const savedRole = localStorage.getItem('delivery_role') as 'restaurant1' | 'restaurant2' | 'central' | null;
    if (savedRole) {
      setRole(savedRole);
    }
    setIsReady(true);

    const unsubscribe = onSnapshot(collection(db, 'drivers'), (snapshot) => {
      const driversData: Driver[] = [];
      snapshot.forEach((doc) => {
        driversData.push(doc.data() as Driver);
      });
      setDrivers(driversData);
    }, (error) => {
      console.error("Firestore error in snapshot listener:", error);
      const errInfo = {
        error: error instanceof Error ? error.message : String(error),
        operationType: 'list',
        path: 'drivers',
        authInfo: {}
      };
      console.error('Firestore Error: ', JSON.stringify(errInfo));
    });

    return () => unsubscribe();
  }, []);

  const updateDriver = async (updatedDriver: Driver) => {
    try {
      await setDoc(doc(db, 'drivers', updatedDriver.id), updatedDriver);
    } catch (e) {
      console.error("Error updating driver: ", e);
    }
  };

  const deleteDriver = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'drivers', id));
    } catch (e) {
      console.error("Error deleting driver: ", e);
    }
  };

  const addDriver = async (name: string, restaurantId: string = 'restaurant1') => {
    const newDriver: Driver = {
      id: crypto.randomUUID(),
      name,
      status: 'Libre',
      activeOrders: 0,
      totalOrders: 0,
      lastUpdated: new Date().toISOString(),
      restaurantId
    };
    try {
      await setDoc(doc(db, 'drivers', newDriver.id), newDriver);
    } catch (e) {
      console.error("Error adding driver: ", e);
    }
  };

  const handleSelectRoleClick = (selectedRole: 'restaurant' | 'central') => {
    setPendingRole(selectedRole);
    setPassword('');
    setError('');
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const pw = password.toLowerCase().trim();
    if (pendingRole === 'restaurant') {
      if (pw === 'tropical' || pw === 'restaurante1') {
        localStorage.setItem('delivery_role', 'restaurant1');
        setRole('restaurant1');
        setPendingRole(null);
      } else if (pw === 'statua' || pw === 'pizzeria s^tatua' || pw === 'restaurante2') {
        localStorage.setItem('delivery_role', 'restaurant2');
        setRole('restaurant2');
        setPendingRole(null);
      } else {
        setError('Contraseña incorrecta. Usa "tropical" o "statua".');
      }
    } else if (pendingRole === 'central' && pw === 'central') {
      localStorage.setItem('delivery_role', 'central');
      setRole('central');
      setPendingRole(null);
    } else {
      setError('Contraseña incorrecta');
    }
  };

  if (!isReady) {
    return <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center">Cargando...</div>;
  }

  if (!role) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex flex-col items-center justify-center p-4 font-sans text-[#1A1A1A]">
        {pendingRole ? (
          <div className="bg-white border border-gray-200 p-8 rounded-2xl shadow-sm max-w-sm w-full relative">
            <button 
              onClick={() => setPendingRole(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-black"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex flex-col items-center mb-6">
              <div className="bg-gray-100 p-4 rounded-full mb-4">
                <Lock className="w-6 h-6 text-black" />
              </div>
              <h2 className="text-xl font-bold">Ingresar a {pendingRole === 'restaurant' ? 'Restaurante' : 'Central'}</h2>
              <p className="text-sm text-gray-500 mt-1">Introduce la contraseña de acceso</p>
            </div>
            <form onSubmit={handleLogin} className="flex flex-col gap-4">
              <div>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Contraseña"
                    autoFocus
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setError(''); }}
                    className={`w-full border ${error ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-cyan-500 focus:border-cyan-500'} rounded-lg px-4 py-3 outline-none tracking-widest pr-12`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {error && <p className="text-red-500 text-xs mt-2 text-center font-medium">{error}</p>}
              </div>
              <button 
                type="submit"
                disabled={!password}
                className="bg-cyan-500 text-white py-3 rounded-lg font-medium hover:bg-cyan-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                Ingresar
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        ) : (
          <>
            <div className="flex flex-col items-center justify-center text-center mb-8">
              <img src="/logo.svg" alt="Dumoh Delivery" className="h-16 object-contain mb-4" />
              <p className="text-gray-500">Selecciona tu rol para continuar</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full max-w-2xl">
              <button 
                onClick={() => handleSelectRoleClick('restaurant')}
                className="bg-white border border-gray-200 p-8 rounded-2xl shadow-sm hover:shadow-md transition-all flex flex-col items-center justify-center gap-4 group"
              >
                <div className="bg-gray-100 p-4 rounded-full group-hover:bg-cyan-500 group-hover:text-white transition-colors">
                  <Store className="w-8 h-8" />
                </div>
                <div className="text-center">
                  <h2 className="text-xl font-bold mb-1">Restaurante</h2>
                  <p className="text-sm text-gray-500">Gestiona repartidores y asigna pedidos</p>
                </div>
              </button>

              <button 
                onClick={() => handleSelectRoleClick('central')}
                className="bg-white border border-gray-200 p-8 rounded-2xl shadow-sm hover:shadow-md transition-all flex flex-col items-center justify-center gap-4 group"
              >
                <div className="bg-gray-100 p-4 rounded-full group-hover:bg-cyan-500 group-hover:text-white transition-colors">
                  <Building2 className="w-8 h-8" />
                </div>
                <div className="text-center">
                  <h2 className="text-xl font-bold mb-1">Central</h2>
                  <p className="text-sm text-gray-500">Supervisa la flota en tiempo real</p>
                </div>
              </button>
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#1A1A1A] font-sans pb-12">
      <Header role={role} setRole={setRole} />
      <main className="max-w-5xl mx-auto px-8 pt-8">
        {role === 'restaurant1' || role === 'restaurant2' ? (
          <RestaurantDashboard 
            drivers={drivers.filter(d => d.restaurantId === role || (!d.restaurantId && role === 'restaurant1'))} 
            updateDriver={updateDriver} 
          />
        ) : (
          <CentralDashboard drivers={drivers} updateDriver={updateDriver} addDriver={addDriver} deleteDriver={deleteDriver} />
        )}
      </main>
    </div>
  );
}
