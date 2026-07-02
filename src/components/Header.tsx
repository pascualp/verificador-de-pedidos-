import { Store, Building2, LogOut } from 'lucide-react';

export function Header({ role, setRole }: { role: 'restaurant1' | 'restaurant2' | 'central' | null, setRole: (role: 'restaurant1' | 'restaurant2' | 'central' | null) => void }) {
  const handleLogout = () => {
    localStorage.removeItem('delivery_role');
    setRole(null);
  };

  const getRoleLabel = () => {
    if (role === 'restaurant1') return 'Restaurante Tropical';
    if (role === 'restaurant2') return 'Pizzería S^tatua';
    if (role === 'central') return 'Central';
    return '';
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-10 shrink-0">
      <div className="max-w-5xl mx-auto px-8 h-16 flex items-center justify-between w-full">
        <div className="flex items-center gap-3">
          <img src="/logo.svg" alt="Dumoh Delivery" className="h-10 object-contain" />
          {role && (
            <span className="ml-2 text-sm text-gray-500 font-medium px-2 py-1 bg-gray-100 rounded-md">
              {getRoleLabel()}
            </span>
          )}
        </div>
        <div className="flex items-center">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 hover:text-black hover:bg-gray-100 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Cambiar Rol
          </button>
        </div>
      </div>
    </header>
  );
}
