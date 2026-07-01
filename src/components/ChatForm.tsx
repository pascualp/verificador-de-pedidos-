import { useState } from 'react';
import { collection, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { handleFirestoreError, OperationType } from '../errorUtils';
import { useAuth } from '../AuthContext';
import { format } from 'date-fns';
import { Image as ImageIcon, X } from 'lucide-react';

export function ChatForm({ onSave }: { onSave: () => void }) {
  const { user } = useAuth();
  const [clientName, setClientName] = useState('');
  const [processingMethod, setProcessingMethod] = useState('Pedido Tabular');
  const [processedContent, setProcessedContent] = useState('');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [keywordsInput, setKeywordsInput] = useState('');
  const [originalChatText, setOriginalChatText] = useState('');
  const [originalChatImage, setOriginalChatImage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);

    try {
      const chatRef = doc(collection(db, 'chats'));
      const keywords = keywordsInput.split(',').map(k => k.trim()).filter(k => k);
      
      const data: any = {
        clientName,
        processingMethod,
        processedContent,
        date,
        keywords: keywords.length > 0 ? keywords : [],
        userId: user.uid,
        createdAt: serverTimestamp(),
      };

      if (originalChatImage) data.originalChatImage = originalChatImage;
      if (originalChatText) data.originalChatText = originalChatText;

      await setDoc(chatRef, data);
      
      setClientName('');
      setProcessedContent('');
      setKeywordsInput('');
      setOriginalChatText('');
      setOriginalChatImage('');
      onSave();
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'chats');
    } finally {
      setLoading(false);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const blob = items[i].getAsFile();
        if (blob) {
          const reader = new FileReader();
          reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
              const canvas = document.createElement('canvas');
              let width = img.width;
              let height = img.height;
              const maxDim = 1000;
              if (width > maxDim || height > maxDim) {
                if (width > height) {
                  height = Math.round((height * maxDim) / width);
                  width = maxDim;
                } else {
                  width = Math.round((width * maxDim) / height);
                  height = maxDim;
                }
              }
              canvas.width = width;
              canvas.height = height;
              const ctx = canvas.getContext('2d');
              ctx?.drawImage(img, 0, 0, width, height);
              const dataUrl = canvas.toDataURL('image/jpeg', 0.6);
              setOriginalChatImage(dataUrl);
            };
            img.src = event.target?.result as string;
          };
          reader.readAsDataURL(blob);
          e.preventDefault(); 
        }
      }
    }
  };

  return (
    <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm">
      <h2 className="text-xl font-bold tracking-tight mb-4">Registrar Nuevo Chat</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-[11px] font-semibold text-gray-600 mb-1 uppercase tracking-wider">Nombre del Cliente</label>
            <input 
              required
              type="text" 
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              className="w-full border border-gray-200 rounded-md p-2 text-sm focus:ring-1 focus:ring-black outline-none transition-shadow"
              placeholder="Ej. Juan Pérez"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-gray-600 mb-1 uppercase tracking-wider">Fecha</label>
            <input 
              required
              type="date" 
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full border border-gray-200 rounded-md p-2 text-sm focus:ring-1 focus:ring-black outline-none transition-shadow"
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          <div>
            <label className="flex items-center gap-2 text-[11px] font-semibold text-gray-600 mb-2 uppercase tracking-wider">
              <ImageIcon className="w-3 h-3" /> Chat Original de WhatsApp
            </label>
            <div className="relative h-[220px]">
              <textarea 
                value={originalChatText}
                onPaste={handlePaste}
                onChange={(e) => setOriginalChatText(e.target.value)}
                className="w-full h-full border border-gray-200 rounded-md p-3 text-sm focus:ring-1 focus:ring-black outline-none transition-shadow font-sans resize-none"
                placeholder="Pega aquí el texto o la captura de pantalla del chat..."
              ></textarea>
              {originalChatImage && (
                <div className="absolute inset-0 bg-gray-50 border border-gray-200 rounded-md p-2 flex flex-col items-center justify-center">
                  <button 
                    type="button"
                    onClick={() => setOriginalChatImage('')}
                    className="absolute top-2 right-2 bg-white shadow-sm border border-gray-200 hover:bg-gray-50 rounded-full p-1.5 transition-colors"
                  >
                    <X className="w-3 h-3 text-gray-600" />
                  </button>
                  <img src={originalChatImage} alt="Captura de chat" className="max-h-full max-w-full object-contain rounded" />
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-gray-600 mb-2 uppercase tracking-wider">Contenido Procesado (Pegar Tabla)</label>
            <textarea 
              required
              value={processedContent}
              onChange={(e) => setProcessedContent(e.target.value)}
              className="w-full h-[220px] border border-gray-200 rounded-md p-3 text-sm focus:ring-1 focus:ring-black outline-none transition-shadow font-mono whitespace-pre resize-none"
              placeholder="Pedido Original&#9;COD&#9;Descripción BD&#9;Cant.&#9;Unidad&#9;Notas..."
            ></textarea>
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-gray-600 mb-1 uppercase tracking-wider">Palabras Clave (separadas por coma)</label>
          <input 
            type="text" 
            value={keywordsInput}
            onChange={(e) => setKeywordsInput(e.target.value)}
            className="w-full border border-gray-200 rounded-md p-2 text-sm focus:ring-1 focus:ring-black outline-none transition-shadow"
            placeholder="urgente, ventas, soporte..."
          />
        </div>

        <div className="flex justify-end pt-2">
          <button 
            type="submit" 
            disabled={loading}
            className="bg-black text-white font-semibold py-2.5 px-5 rounded-lg text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading ? 'Guardando...' : '+ Nuevo Proceso'}
          </button>
        </div>
      </form>
    </div>
  );
}
