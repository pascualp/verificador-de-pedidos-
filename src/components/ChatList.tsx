import { useState, useEffect } from 'react';
import { ChatRecord } from '../types';
import { Search } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

function renderContent(content: string) {
  if (content.includes('\t') && content.includes('\n')) {
    const lines = content.trim().split('\n');
    return (
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="w-full text-left border-collapse min-w-max">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              {lines[0].split('\t').map((header, i) => (
                <th key={i} className="px-4 py-2 text-[11px] font-bold text-gray-500 uppercase tracking-wider">{header}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {lines.slice(1).map((line, i) => (
              <tr key={i} className="hover:bg-gray-50 bg-white">
                {line.split('\t').map((cell, j) => (
                  <td key={j} className="px-4 py-2 text-sm text-gray-700">{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }
  return <div className="text-gray-700 text-sm whitespace-pre-wrap">{content}</div>;
}

export function ChatList() {
  const [chats, setChats] = useState<ChatRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    const existingData = localStorage.getItem('whats_log_chats');
    if (existingData) {
      const records: ChatRecord[] = JSON.parse(existingData);
      
      const today = format(new Date(), 'yyyy-MM-dd');
      const toKeep: ChatRecord[] = [];

      records.forEach(record => {
        if (record.date >= today) {
          toKeep.push(record);
        }
      });

      // Update localStorage if we deleted old records
      if (toKeep.length !== records.length) {
        localStorage.setItem('whats_log_chats', JSON.stringify(toKeep));
      }

      toKeep.sort((a, b) => {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        return dateB - dateA;
      });
      
      setChats(toKeep);
    }
  }, []);

  const filteredChats = chats.filter(chat => {
    const matchesSearch = 
      chat.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      chat.processingMethod.toLowerCase().includes(searchTerm.toLowerCase()) ||
      chat.processedContent.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (chat.keywords && chat.keywords.some(k => k.toLowerCase().includes(searchTerm.toLowerCase())));
      
    const matchesDate = dateFilter ? chat.date === dateFilter : true;
    
    return matchesSearch && matchesDate;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 font-light" />
          <input 
            type="text" 
            placeholder="Buscar por cliente, método, palabra clave..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-black"
          />
        </div>
        <div className="relative">
          <input 
            type="date" 
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="w-full md:w-auto px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-black text-gray-700"
          />
          {dateFilter && (
            <button 
              onClick={() => setDateFilter('')}
              className="absolute -right-2 -top-2 bg-gray-200 hover:bg-gray-300 text-gray-600 rounded-full w-5 h-5 flex items-center justify-center text-xs"
            >
              x
            </button>
          )}
        </div>
      </div>

      {filteredChats.length === 0 ? (
        <div className="bg-white p-10 rounded-2xl border border-gray-200 text-center text-gray-500 shadow-sm">
          No se encontraron registros.
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="flex flex-col divide-y divide-gray-100">
            {filteredChats.map(chat => {
              const isExpanded = expandedId === chat.id;
              
              return (
                <div key={chat.id} className={`p-6 transition-colors ${isExpanded ? 'bg-gray-50' : 'hover:bg-gray-50 bg-white'}`}>
                  <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4 mb-4">
                    <div>
                      <h3 className="font-semibold text-sm text-[#1A1A1A]">{chat.clientName}</h3>
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        {chat.date ? format(parseISO(chat.date), "dd MMM, yyyy", { locale: es }) : ''}
                      </p>
                    </div>
                    <div className="flex gap-2 items-center flex-wrap justify-end">
                      <span className="text-xs font-mono bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded">
                        {chat.processingMethod.toUpperCase()}
                      </span>
                      <span className="flex items-center gap-1.5 text-xs text-green-600 font-medium ml-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span> Procesado
                      </span>
                      <button 
                        onClick={() => setExpandedId(isExpanded ? null : chat.id)}
                        className="ml-4 text-xs font-semibold bg-white border border-gray-200 hover:bg-gray-100 text-gray-700 px-3 py-1.5 rounded transition-colors"
                      >
                        {isExpanded ? 'Cerrar Cotejo' : 'Cotejar Pedido'}
                      </button>
                    </div>
                  </div>
                  
                  {!isExpanded ? (
                    <div className="mt-4 opacity-70 cursor-pointer" onClick={() => setExpandedId(chat.id)}>
                      {renderContent(chat.processedContent)}
                    </div>
                  ) : (
                    <div className="mt-6 border-t border-gray-200 pt-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
                      <div>
                        <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">1. Chat Original</h4>
                        {chat.originalChatImage ? (
                          <div className="bg-white border border-gray-200 rounded-lg p-2 flex justify-center">
                            <img src={chat.originalChatImage} alt="Chat original" className="max-w-full rounded" />
                          </div>
                        ) : chat.originalChatText ? (
                          <div className="bg-white border border-gray-200 rounded-lg p-4 text-sm text-gray-700 font-sans whitespace-pre-wrap max-h-[500px] overflow-y-auto">
                            {chat.originalChatText}
                          </div>
                        ) : (
                          <div className="bg-gray-100 text-gray-400 p-4 rounded-lg text-sm text-center italic">
                            No se adjuntó chat original.
                          </div>
                        )}
                      </div>
                      <div>
                        <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">2. Pedido Procesado</h4>
                        <div className="bg-white shadow-sm max-h-[500px] overflow-y-auto rounded-lg">
                          {renderContent(chat.processedContent)}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {chat.keywords && chat.keywords.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-4">
                      {chat.keywords.map((kw, i) => (
                        <span key={i} className="text-[10px] text-gray-500 italic">
                          {kw}{i < chat.keywords!.length - 1 ? ', ' : ''}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
