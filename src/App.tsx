import { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { RestaurantDashboard } from './components/RestaurantDashboard';
import { CentralDashboard } from './components/CentralDashboard';
import { Driver } from './types';
import { Store, Building2, Lock, ArrowRight, X } from 'lucide-react';
import { db } from './firebase';
import { collection, onSnapshot, doc, setDoc, deleteDoc } from 'firebase/firestore';

export default function App() {
  const [role, setRole] = useState<'restaurant' | 'central' | null>(null);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [isReady, setIsReady] = useState(false);
  const [pendingRole, setPendingRole] = useState<'restaurant' | 'central' | null>(null);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const savedRole = localStorage.getItem('delivery_role') as 'restaurant' | 'central' | null;
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

  const addDriver = async (name: string) => {
    const newDriver: Driver = {
      id: crypto.randomUUID(),
      name,
      status: 'Libre',
      activeOrders: 0,
      totalOrders: 0,
      lastUpdated: new Date().toISOString()
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
    if (pendingRole === 'restaurant' && password === 'restaurante') {
      localStorage.setItem('delivery_role', 'restaurant');
      setRole('restaurant');
      setPendingRole(null);
    } else if (pendingRole === 'central' && password === 'central') {
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
                <input
                  type="password"
                  placeholder="Contraseña"
                  autoFocus
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(''); }}
                  className={`w-full border ${error ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-black focus:border-black'} rounded-lg px-4 py-3 outline-none text-center tracking-widest`}
                />
                {error && <p className="text-red-500 text-xs mt-2 text-center font-medium">{error}</p>}
              </div>
              <button 
                type="submit"
                disabled={!password}
                className="bg-black text-white py-3 rounded-lg font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-50"
              >
                Ingresar
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        ) : (
          <>
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold tracking-tight mb-2">DELIVERY-SYNC</h1>
              <p className="text-gray-500">Selecciona tu rol para continuar</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full max-w-2xl">
              <button 
                onClick={() => handleSelectRoleClick('restaurant')}
                className="bg-white border border-gray-200 p-8 rounded-2xl shadow-sm hover:shadow-md transition-all flex flex-col items-center justify-center gap-4 group"
              >
                <div className="bg-gray-100 p-4 rounded-full group-hover:bg-black group-hover:text-white transition-colors">
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
                <div className="bg-gray-100 p-4 rounded-full group-hover:bg-black group-hover:text-white transition-colors">
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
        {role === 'restaurant' ? (
          <RestaurantDashboard drivers={drivers} updateDriver={updateDriver} addDriver={addDriver} deleteDriver={deleteDriver} />
        ) : (
          <CentralDashboard drivers={drivers} />
        )}
      </main>
    </div>
  );
}
