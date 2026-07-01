import { useAuth } from '../AuthContext';
import { LogOut, MessageSquare } from 'lucide-react';

export function Header() {
  const { user, login, logout } = useAuth();

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-10 shrink-0">
      <div className="max-w-5xl mx-auto px-8 h-16 flex items-center justify-between w-full">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
            <MessageSquare className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-lg tracking-tight text-[#1A1A1A]">WHATS-LOG</span>
        </div>
        <div className="flex items-center gap-6">
          {user ? (
            <>
              <div className="hidden md:flex items-center gap-2 text-sm text-gray-500">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                Sincronizado
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-600 hidden md:block">{user.email}</span>
                <button 
                  onClick={logout}
                  className="flex items-center gap-2 text-sm text-gray-600 hover:text-black transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Salir
                </button>
              </div>
            </>
          ) : (
            <button 
              onClick={login}
              className="bg-black text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              Iniciar Sesión
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
