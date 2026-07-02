import { Store, Building2, LogOut } from 'lucide-react';

export function Header({ role, setRole }: { role: 'restaurant' | 'central', setRole: (role: 'restaurant' | 'central' | null) => void }) {
  const handleLogout = () => {
    localStorage.removeItem('delivery_role');
    setRole(null);
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-10 shrink-0">
      <div className="max-w-5xl mx-auto px-8 h-16 flex items-center justify-between w-full">
        <div className="flex items-center gap-3">
          <div className="bg-black p-2 rounded-lg flex items-center justify-center">
            {role === 'restaurant' ? <Store className="w-5 h-5 text-white" /> : <Building2 className="w-5 h-5 text-white" />}
          </div>
          <span className="font-bold text-lg tracking-tight text-[#1A1A1A]">DELIVERY-SYNC</span>
          <span className="ml-2 text-sm text-gray-500 font-medium px-2 py-1 bg-gray-100 rounded-md">
            {role === 'restaurant' ? 'Restaurante' : 'Central'}
          </span>
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
