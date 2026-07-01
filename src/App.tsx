import { useState } from 'react';
import { AuthProvider, useAuth } from './AuthContext';
import { Header } from './components/Header';
import { ChatForm } from './components/ChatForm';
import { ChatList } from './components/ChatList';
import { ExtensionDownload } from './components/ExtensionDownload';

function AppContent() {
  const { user, loading } = useAuth();
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] text-[#1A1A1A] font-sans flex items-center justify-center">
        <p className="text-gray-500 text-sm">Cargando...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] text-[#1A1A1A] font-sans flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200 max-w-md w-full text-center">
          <h2 className="text-2xl font-bold tracking-tight mb-2">Bienvenido</h2>
          <p className="text-gray-500 text-sm mb-6">Inicia sesión para guardar y gestionar los registros de tus chats procesados de WhatsApp.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#1A1A1A] font-sans pb-12">
      <main className="max-w-5xl mx-auto px-8 pt-8 space-y-10">
        <ExtensionDownload />
        <ChatForm onSave={() => setRefreshTrigger(prev => prev + 1)} />
        <div>
          <h2 className="text-xl font-semibold mb-4 text-gray-900">Historial de Registros</h2>
          <ChatList key={refreshTrigger} />
        </div>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Header />
      <AppContent />
    </AuthProvider>
  );
}
