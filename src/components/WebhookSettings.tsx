import React, { useState } from 'react';
import { Webhook, Save, Globe, Info, CheckCircle2, AlertCircle, Copy, Plus } from 'lucide-react';
import { AppConfig } from '../types';

interface WebhookSettingsProps {
  config: AppConfig;
  onUpdate: (config: AppConfig) => void;
}

export function WebhookSettings({ config, onUpdate }: WebhookSettingsProps) {
  const [url, setUrl] = useState(config.webhookUrl || '');
  const [enabled, setEnabled] = useState(config.webhookEnabled);
  const [copied, setCopied] = useState(false);
  const [testStatus, setTestStatus] = useState<{ success?: boolean; message?: string } | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  const handleSave = () => {
    onUpdate({
      webhookUrl: url,
      webhookEnabled: enabled
    });
  };

  const handleTest = async () => {
    if (!url) return;
    setIsTesting(true);
    setTestStatus(null);
    try {
      const response = await fetch('/api/webhook/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });
      const data = await response.json();
      setTestStatus(data);
    } catch (error) {
      setTestStatus({ success: false, message: 'Error al conectar con el servidor.' });
    } finally {
      setIsTesting(false);
    }
  };

  const inboundUrl = `${window.location.origin}/api/webhook/orders`;
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [testOrderResult, setTestOrderResult] = useState<{ success: boolean; message: string } | null>(null);

  const sendTestOrder = async () => {
    setIsSendingTest(true);
    setTestOrderResult(null);
    try {
      const response = await fetch('/api/webhook/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderNumber: Math.floor(1000 + Math.random() * 9000).toString(),
          customerName: "Pedido Tropical de Prueba",
          customerPhone: "123456789",
          address: "Calle Tropical 123",
          restaurantId: "restaurant1"
        })
      });
      const data = await response.json();
      if (data.success) {
        setTestOrderResult({ success: true, message: '¡Pedido enviado con éxito! Revisa el panel de Restaurante Tropical.' });
      } else {
        setTestOrderResult({ success: false, message: 'Error: ' + (data.error || 'Desconocido') });
      }
    } catch (error) {
      setTestOrderResult({ success: false, message: 'Error al conectar con el servidor.' });
    } finally {
      setIsSendingTest(false);
      setTimeout(() => setTestOrderResult(null), 5000);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(inboundUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
      <div className="bg-cyan-600 px-6 py-4 flex items-center gap-3">
        <Webhook className="w-6 h-6 text-white" />
        <h3 className="text-lg font-bold text-white">Configuración de Webhooks</h3>
      </div>
      
      <div className="p-6 space-y-8">
        {/* Inbound Webhook Info */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-gray-900 font-bold">
            <Globe className="w-5 h-5 text-cyan-600" />
            <h4>Webhook de Entrada (Recibir Pedidos)</h4>
          </div>
          <p className="text-sm text-gray-600">
            Usa esta URL para enviar pedidos desde sistemas externos (POS, E-commerce).
          </p>
          
          <div className="flex gap-2">
            <div className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-sm font-mono text-gray-700 truncate">
              {inboundUrl}
            </div>
            <button 
              onClick={copyToClipboard}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors flex items-center gap-2 text-sm font-medium"
            >
              {copied ? <CheckCircle2 className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copiado' : 'Copiar'}
            </button>
          </div>

          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-3">
            <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
            <div className="text-xs text-blue-700 space-y-4 w-full">
              <div>
                <p className="font-bold mb-1">Instrucciones de integración:</p>
                <p>Configura tu sitio web para enviar un <strong>POST JSON</strong> a la URL de arriba cada vez que recibas un pedido. Asegúrate de incluir el ID del restaurante correspondiente.</p>
              </div>

              <div className="space-y-2">
                <p className="font-bold">Formato JSON esperado:</p>
                <pre className="bg-white/50 p-3 rounded border border-blue-200 overflow-x-auto text-[10px]">
{`{
  "orderNumber": "1234",
  "customerName": "Juan Perez",
  "customerPhone": "1122334455",
  "address": "Calle Falsa 123",
  "restaurantId": "restaurant1"
}`}
                </pre>
              </div>

              <div className="pt-2">
                <button 
                  onClick={sendTestOrder}
                  disabled={isSendingTest}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-colors disabled:opacity-50 text-sm"
                >
                  <Plus className="w-4 h-4" />
                  {isSendingTest ? 'Enviando...' : 'Enviar Pedido de Prueba'}
                </button>
                {testOrderResult && (
                  <p className={`mt-2 font-medium ${testOrderResult.success ? 'text-green-600' : 'text-red-600'}`}>
                    {testOrderResult.message}
                  </p>
                )}
              </div>
            </div>
          </div>
        </section>

        <hr className="border-gray-100" />

        {/* Outbound Webhook Config */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-gray-900 font-bold">
              <Globe className="w-5 h-5 text-rose-500" />
              <h4>Webhook de Salida (Notificaciones)</h4>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                checked={enabled} 
                onChange={(e) => setEnabled(e.target.checked)}
                className="sr-only peer" 
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-500"></div>
            </label>
          </div>
          
          <p className="text-sm text-gray-600">
            Envía una notificación POST a tu servidor cuando un pedido cambie de estado.
          </p>

          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">URL de Destino</label>
            <input 
              type="url"
              placeholder="https://tu-servidor.com/webhook"
              className="w-full border border-gray-300 rounded-xl px-4 py-2 outline-none focus:border-rose-500"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={!enabled}
            />
          </div>

          {testStatus && (
            <div className={`p-3 rounded-lg flex items-center gap-2 text-sm ${testStatus.success ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
              {testStatus.success ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              {testStatus.message}
            </div>
          )}

          <div className="flex justify-between items-center pt-2">
            <button 
              onClick={handleTest}
              disabled={!enabled || !url || isTesting}
              className="px-4 py-2 text-sm font-bold text-rose-600 hover:bg-rose-50 rounded-lg transition-colors disabled:opacity-50"
            >
              {isTesting ? 'Probando...' : 'Probar Conexión'}
            </button>
            <button 
              onClick={handleSave}
              className="flex items-center gap-2 px-6 py-2 bg-gray-900 text-white rounded-xl font-bold hover:bg-gray-800 transition-colors shadow-sm"
            >
              <Save className="w-4 h-4" />
              Guardar Configuración
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
