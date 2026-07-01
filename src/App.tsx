import { useState } from 'react';
import { Header } from './components/Header';
import { ChatForm } from './components/ChatForm';
import { ChatList } from './components/ChatList';
import { ExtensionDownload } from './components/ExtensionDownload';

export default function App() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#1A1A1A] font-sans pb-12">
      <Header />
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
