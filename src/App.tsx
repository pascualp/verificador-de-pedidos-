import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { RestaurantDashboard } from './components/RestaurantDashboard';
import { CentralDashboard } from './components/CentralDashboard';
import { DriverDashboard } from './components/DriverDashboard';
import { Driver, Order, AppConfig, OperationType, FirestoreErrorInfo } from './types';
import { Store, Building2, Lock, ArrowRight, X, Eye, EyeOff, Bike, Download } from 'lucide-react';
import { db } from './firebase';
import { collection, onSnapshot, doc, setDoc, deleteDoc, getDocFromServer } from 'firebase/firestore';

export default function App() {
  const handleFirestoreError = (error: unknown, operationType: OperationType, path: string | null) => {
    const errInfo: FirestoreErrorInfo = {
      error: error instanceof Error ? error.message : String(error),
      authInfo: {
        userId: null, // Auth not implemented yet
        email: null,
        emailVerified: null,
        isAnonymous: null,
        tenantId: null,
        providerInfo: []
      },
      operationType,
      path
    };
    console.error('Firestore Error: ', JSON.stringify(errInfo));
    // We don't throw here to avoid crashing the app, but we log it for AI diagnosis
  };

  const [role, setRole] = useState<'restaurant1' | 'restaurant2' | 'central' | 'driver' | null>(null);
  const [appMode, setAppMode] = useState<'restaurant' | 'central' | 'driver' | null>(null);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [appConfig, setAppConfig] = useState<AppConfig>({ webhookEnabled: false });

  useEffect(() => {
    const testConnection = async () => {
      try {
        await getDocFromServer(doc(db, 'config', 'connection_test'));
      } catch (error) {
        if (error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration.");
        }
      }
    };
    testConnection();

    const unsubscribeConfig = onSnapshot(doc(db, 'config', 'general'), (doc) => {
      if (doc.exists()) {
        setAppConfig(doc.data() as AppConfig);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'config/general');
    });
    return () => unsubscribeConfig();
  }, []);

  const updateAppConfig = async (newConfig: AppConfig) => {
    try {
      await setDoc(doc(db, 'config', 'general'), newConfig);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'config/general');
    }
  };
  const [isReady, setIsReady] = useState(false);
  const [pendingRole, setPendingRole] = useState<'restaurant' | 'central' | 'driver' | null>(null);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    const savedRole = localStorage.getItem('delivery_role') as 'restaurant1' | 'restaurant2' | 'central' | 'driver' | null;
    if (savedRole) {
      setRole(savedRole);
    }
    const savedAppMode = localStorage.getItem('dumoh_app_mode') as 'restaurant' | 'central' | 'driver' | null;
    if (savedAppMode) {
      setAppMode(savedAppMode);
    }
    setIsReady(true);

    setIsMobile(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent));
    
    const checkStandalone = () => {
      const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone || document.referrer.includes('android-app://');
      setIsStandalone(!!isStandaloneMode);
    };
    checkStandalone();
    window.matchMedia('(display-mode: standalone)').addEventListener('change', checkStandalone);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    const unsubscribeDrivers = onSnapshot(collection(db, 'drivers'), (snapshot) => {
      const driversData: Driver[] = [];
      snapshot.forEach((doc) => {
        driversData.push(doc.data() as Driver);
      });
      setDrivers(driversData);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'drivers');
    });

    const unsubscribeOrders = onSnapshot(collection(db, 'orders'), (snapshot) => {
      const ordersData: Order[] = [];
      snapshot.forEach((doc) => {
        ordersData.push(doc.data() as Order);
      });
      setOrders(ordersData);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'orders');
    });

    return () => {
      unsubscribeDrivers();
      unsubscribeOrders();
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    } else {
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
      if (isIOS) {
        alert("En iPhone/iPad, Apple bloquea la instalación directa mediante botones. Debes presionar 'Compartir' en Safari (el ícono del cuadrado con flecha) y luego 'Agregar a inicio'.");
      } else {
        alert("La aplicación ya está instalada o tu navegador no permite instalarla automáticamente.");
      }
    }
  };

  const updateDriver = async (updatedDriver: Driver) => {
    try {
      await setDoc(doc(db, 'drivers', updatedDriver.id), updatedDriver);
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, `drivers/${updatedDriver.id}`);
    }
  };

  const updateOrder = async (updatedOrder: Order) => {
    try {
      await setDoc(doc(db, 'orders', updatedOrder.id), updatedOrder);
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, `orders/${updatedOrder.id}`);
    }
  };

  const deleteOrder = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'orders', id));
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `orders/${id}`);
    }
  };

  const deleteDriver = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'drivers', id));
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `drivers/${id}`);
    }
  };

  const addDriver = async (name: string, restaurantId: string = 'restaurant1', password?: string) => {
    const newDriver: Driver = {
      id: crypto.randomUUID(),
      name,
      status: 'Libre',
      activeOrders: 0,
      totalOrders: 0,
      lastUpdated: new Date().toISOString(),
      restaurantId,
      password: password || undefined
    };
    try {
      await setDoc(doc(db, 'drivers', newDriver.id), newDriver);
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, `drivers/${newDriver.id}`);
    }
  };

  const addOrder = async (orderNumber: string, customerName: string, customerPhone: string, restaurantId: string, address: string = '', prepTime?: number, price?: number) => {
    const newOrder: Order = {
      id: crypto.randomUUID(),
      orderNumber,
      customerName,
      customerPhone,
      restaurantId,
      address,
      status: 'En Cola',
      createdAt: new Date().toISOString(),
      prepTime,
      price
    };
    try {
      await setDoc(doc(db, 'orders', newOrder.id), newOrder);
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, `orders/${newOrder.id}`);
    }
  };

  const handleSelectRoleClick = (selectedRole: 'restaurant' | 'central' | 'driver') => {
    setPendingRole(selectedRole);
    setPassword('');
    setError('');
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const pw = password.toLowerCase().trim();
    const roleToCheck = (appMode && appMode !== 'central') ? appMode : pendingRole;

    if (roleToCheck === 'restaurant') {
      if (pw === 'tropical' || pw === 'restaurante1') {
        localStorage.setItem('delivery_role', 'restaurant1');
        localStorage.setItem('dumoh_app_mode', 'restaurant');
        setRole('restaurant1');
        setAppMode('restaurant');
        setPendingRole(null);
      } else if (pw === 'statua' || pw === 'pizzeria s^tatua' || pw === 'restaurante2') {
        localStorage.setItem('delivery_role', 'restaurant2');
        localStorage.setItem('dumoh_app_mode', 'restaurant');
        setRole('restaurant2');
        setAppMode('restaurant');
        setPendingRole(null);
      } else {
        setError('Contraseña incorrecta. Usa "tropical" o "statua".');
      }
    } else if (roleToCheck === 'driver') {
      const matchedDriver = drivers.find(d => d.password && String(d.password).trim() === password.trim());
      if (matchedDriver) {
        localStorage.setItem('delivery_role', 'driver');
        localStorage.setItem('dumoh_app_mode', 'driver');
        localStorage.setItem('dumoh_selected_driver_v2', matchedDriver.id);
        setRole('driver');
        setAppMode('driver');
        setPendingRole(null);
      } else {
        setError('Contraseña de repartidor incorrecta.');
      }
    } else if (roleToCheck === 'central' && pw === 'central') {
      localStorage.setItem('delivery_role', 'central');
      localStorage.removeItem('dumoh_app_mode');
      setRole('central');
      setAppMode(null);
      setPendingRole(null);
    } else {
      setError('Contraseña incorrecta');
    }
  };

  if (!isReady) {
    return <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center">Cargando...</div>;
  }

  if (!role) {
    const activePendingRole = (appMode && appMode !== 'central') ? appMode : pendingRole;

    return (
      <div className="min-h-screen bg-[#F8F9FA] flex flex-col items-center justify-center p-4 font-sans text-[#1A1A1A]">
        {activePendingRole ? (
          <div className="bg-white border border-gray-200 p-8 rounded-2xl shadow-sm max-w-sm w-full relative">
            {!appMode && (
              <button 
                onClick={() => setPendingRole(null)}
                className="absolute top-4 right-4 text-gray-400 hover:text-black"
              >
                <X className="w-5 h-5" />
              </button>
            )}
            <div className="flex flex-col items-center mb-6">
              <div className="bg-gray-100 p-4 rounded-full mb-4">
                <Lock className="w-6 h-6 text-black" />
              </div>
              <h2 className="text-xl font-bold">
                Ingresar a {activePendingRole === 'restaurant' ? 'Restaurante' : activePendingRole === 'driver' ? 'Repartidor' : 'Central'}
              </h2>
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
            {isMobile && !isStandalone && deferredPrompt && activePendingRole === 'driver' && (
              <div className="mt-4 pt-4 border-t border-gray-100 text-center">
                <button 
                  type="button"
                  onClick={handleInstallClick}
                  className="flex items-center justify-center gap-2 w-full bg-white border border-gray-200 text-gray-700 py-2.5 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Anclar App al Inicio
                </button>
              </div>
            )}
            {appMode && (
              <div className="mt-4 text-center">
                <button 
                  type="button"
                  onClick={() => {
                    localStorage.removeItem('dumoh_app_mode');
                    setAppMode(null);
                    setPendingRole(null);
                  }}
                  className="text-xs text-gray-400 hover:text-gray-600 underline"
                >
                  Cambiar vista de aplicación
                </button>
              </div>
            )}
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
                  <p className="text-sm text-gray-500">Gestiona y asigna pedidos</p>
                </div>
              </button>

              <button 
                onClick={() => handleSelectRoleClick('driver')}
                className="bg-white border border-gray-200 p-8 rounded-2xl shadow-sm hover:shadow-md transition-all flex flex-col items-center justify-center gap-4 group"
              >
                <div className="bg-gray-100 p-4 rounded-full group-hover:bg-cyan-500 group-hover:text-white transition-colors">
                  <Bike className="w-8 h-8" />
                </div>
                <div className="text-center">
                  <h2 className="text-xl font-bold mb-1">Soy Repartidor</h2>
                  <p className="text-sm text-gray-500">Actualiza tu estado desde el móvil</p>
                </div>
              </button>

              <button 
                onClick={() => handleSelectRoleClick('central')}
                className="bg-white border border-gray-200 p-8 rounded-2xl shadow-sm hover:shadow-md transition-all flex flex-col items-center justify-center gap-4 group sm:col-span-2"
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
      {role !== 'driver' && <Header role={role} setRole={setRole} />}
      <main className={role === 'driver' ? 'w-full max-w-md mx-auto px-4 pt-4 pb-20' : 'max-w-5xl mx-auto px-8 pt-8'}>
        {role === 'driver' ? (
          <DriverDashboard 
            drivers={drivers} 
            updateDriver={updateDriver} 
            orders={orders} 
            updateOrder={updateOrder} 
            onBack={() => {
              localStorage.removeItem('delivery_role');
              setRole(null);
            }}
          />
        ) : role === 'restaurant1' || role === 'restaurant2' ? (
          <RestaurantDashboard 
            drivers={drivers.filter(d => (d.restaurantId === role || (!d.restaurantId && role === 'restaurant1')) && !d.isHidden)} 
            updateDriver={updateDriver} 
            themeColor={role === 'restaurant1' ? 'orange' : 'rose'}
            orders={orders.filter(o => o.restaurantId === role)}
            updateOrder={updateOrder}
            addOrder={addOrder}
            deleteOrder={deleteOrder}
            restaurantId={role}
          />
        ) : (
          <CentralDashboard 
            drivers={drivers} 
            updateDriver={updateDriver} 
            addDriver={addDriver} 
            deleteDriver={deleteDriver} 
            orders={orders} 
            updateOrder={updateOrder}
            appConfig={appConfig}
            updateAppConfig={updateAppConfig}
          />
        )}
      </main>
      
      {isMobile && !isStandalone && role === 'driver' && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 shadow-lg z-50">
          <div className="max-w-md mx-auto">
            <button 
              type="button"
              onClick={handleInstallClick}
              className="flex items-center justify-center gap-2 w-full bg-cyan-500 text-white py-3 rounded-xl font-bold hover:bg-cyan-600 transition-colors shadow-sm"
            >
              <Download className="w-5 h-5" />
              Anclar App al Inicio
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
