import { useState, useEffect } from 'react';
import { Webhook, Save, Globe, Info, CheckCircle2, AlertCircle, Copy, Plus, RefreshCw, Eye, TreePalm, Pizza, Code, Check } from 'lucide-react';
import { AppConfig } from '../types';

interface WebhookSettingsProps {
  config: AppConfig;
  onUpdate: (config: AppConfig) => void;
}

interface WebhookLogItem {
  id?: string;
  timestamp: string;
  endpoint: string;
  method: string;
  ip: string;
  restaurantId?: string;
  restaurantName?: string;
  orderNumber?: string;
  customerName?: string;
  address?: string;
  price?: number;
  isPaid?: boolean;
  status: 'success' | 'error';
  error?: string;
  rawBody?: any;
}

export function WebhookSettings({ config, onUpdate }: WebhookSettingsProps) {
  const [url, setUrl] = useState(config.webhookUrl || '');
  const [enabled, setEnabled] = useState(config.webhookEnabled);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [testStatus, setTestStatus] = useState<{ success?: boolean; message?: string } | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  const [logs, setLogs] = useState<WebhookLogItem[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [selectedLogPayload, setSelectedLogPayload] = useState<any | null>(null);

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
    } catch {
      setTestStatus({ success: false, message: 'Error al conectar con el servidor.' });
    } finally {
      setIsTesting(false);
    }
  };

  // The public URL to give external webhook providers (ais-pre instead of ais-dev)
  const baseUrl = window.location.origin.includes('ais-dev') 
    ? window.location.origin.replace('ais-dev', 'ais-pre')
    : window.location.origin;
    
  const tropicalWebhookUrl = `${baseUrl}/api/webhook/tropical`;
  const generalWebhookUrl = `${baseUrl}/api/webhook/orders`;
  const statuaWebhookUrl = `${baseUrl}/api/webhook/statua`;

  const [isSendingTest, setIsSendingTest] = useState(false);
  const [testOrderResult, setTestOrderResult] = useState<{ success: boolean; message: string } | null>(null);

  const fetchLogs = async () => {
    setLoadingLogs(true);
    try {
      const res = await fetch('/api/webhook/logs');
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
      }
    } catch (e) {
      console.warn("Could not fetch webhook logs", e);
    } finally {
      setLoadingLogs(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const sendTestOrder = async (target: 'tropical' | 'statua' | 'orders') => {
    setIsSendingTest(true);
    setTestOrderResult(null);
    try {
      const endpoint = target === 'tropical' ? '/api/webhook/tropical' : target === 'statua' ? '/api/webhook/statua' : '/api/webhook/orders';
      const orderNum = Math.floor(1000 + Math.random() * 9000).toString();
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderNumber: orderNum,
          customerName: target === 'tropical' ? "Cliente Tropical Prueba" : "Cliente s'Estatua Prueba",
          customerPhone: "612345678",
          address: "Calle de Prueba 45, 1A",
          restaurantId: target === 'tropical' ? "restaurant1" : target === 'statua' ? "restaurant2" : undefined,
          price: 18.50,
          isPaid: false
        })
      });
      const data = await response.json();
      if (data.success) {
        setTestOrderResult({ 
          success: true, 
          message: `¡Pedido #${orderNum} enviado con éxito! Asignado a: ${data.restaurant}` 
        });
        fetchLogs();
      } else {
        setTestOrderResult({ success: false, message: 'Error: ' + (data.error || 'Desconocido') });
      }
    } catch {
      setTestOrderResult({ success: false, message: 'Error al conectar con el servidor.' });
    } finally {
      setIsSendingTest(false);
      setTimeout(() => setTestOrderResult(null), 6000);
    }
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden space-y-6">
      <div className="bg-cyan-600 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Webhook className="w-6 h-6 text-white" />
          <div>
            <h3 className="text-lg font-bold text-white">Configuración y Diagnóstico de Webhooks</h3>
            <p className="text-cyan-100 text-xs">Recepción automática de pedidos desde e-commerce, web o TPV externo</p>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-emerald-500/20 text-white border border-emerald-300/30 px-3 py-1 rounded-full text-xs font-bold w-fit">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          Endpoint Público Activo
        </div>
      </div>
      
      <div className="p-6 space-y-8">
        {/* Solution Notice */}
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div className="text-xs text-emerald-900 space-y-1">
            <p className="font-bold text-sm">✅ Webhooks desbloqueados y optimizados para Restaurante Tropical</p>
            <p className="text-emerald-700">
              Se ha habilitado acceso público directo para los endpoints <code className="bg-emerald-100 px-1 rounded font-mono font-bold">/api/webhook/*</code> (sin bloqueos de autenticación 302 de Google) y se añadieron rutas dedicadas y tolerancia a diferentes formatos de JSON (WooCommerce, TPV, GloriFood, etc.).
            </p>
          </div>
        </div>

        {/* Inbound Webhook URLs */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-gray-900 font-bold">
            <Globe className="w-5 h-5 text-cyan-600" />
            <h4 className="text-base font-bold">URLs de Entrada (Para que el sistema externo envíe los pedidos)</h4>
          </div>
          
          <div className="grid grid-cols-1 gap-3">
            {/* Tropical dedicated URL */}
            <div className="p-4 bg-orange-50/60 border border-orange-200 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TreePalm className="w-5 h-5 text-orange-600" />
                  <span className="font-black text-xs text-orange-800 uppercase tracking-wider">URL Exclusiva para Restaurante Tropical (Recomendada)</span>
                </div>
                <span className="text-[10px] bg-orange-200 text-orange-900 px-2 py-0.5 rounded font-black">Asigna a Tropical automáticamente</span>
              </div>
              <p className="text-xs text-orange-700">
                Usa esta URL en la tienda o webhook de Tropical. Asigna todos los pedidos automáticamente al panel de Tropical, incluso si el payload no incluye el ID de restaurante.
              </p>
              <div className="flex gap-2">
                <div className="flex-1 bg-white border border-orange-200 rounded-lg px-4 py-2 text-xs font-mono text-gray-800 break-all select-all shadow-sm">
                  {tropicalWebhookUrl}
                </div>
                <button 
                  onClick={() => copyToClipboard(tropicalWebhookUrl, 'tropical')}
                  className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors flex items-center gap-1.5 text-xs font-bold shrink-0 shadow-sm"
                >
                  {copiedKey === 'tropical' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copiedKey === 'tropical' ? 'Copiado' : 'Copiar'}
                </button>
              </div>
            </div>

            {/* General URL */}
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-gray-700 uppercase tracking-wider">URL General (Multirrestaurante)</span>
                <span className="text-[10px] bg-gray-200 text-gray-700 px-2 py-0.5 rounded font-bold">Requiere especificar restaurante</span>
              </div>
              <p className="text-xs text-gray-500">
                Acepta <code className="bg-gray-200 px-1 rounded font-mono">restaurantId: "restaurant1"</code> (o "tropical") y <code className="bg-gray-200 px-1 rounded font-mono">restaurantId: "restaurant2"</code> (o "statua").
              </p>
              <div className="flex gap-2">
                <div className="flex-1 bg-white border border-gray-200 rounded-lg px-4 py-2 text-xs font-mono text-gray-700 break-all select-all">
                  {generalWebhookUrl}
                </div>
                <button 
                  onClick={() => copyToClipboard(generalWebhookUrl, 'general')}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-bold shrink-0"
                >
                  {copiedKey === 'general' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copiedKey === 'general' ? 'Copiado' : 'Copiar'}
                </button>
              </div>
            </div>

            {/* Statua dedicated URL */}
            <div className="p-4 bg-rose-50/50 border border-rose-200 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Pizza className="w-5 h-5 text-rose-600" />
                  <span className="font-bold text-xs text-rose-800 uppercase tracking-wider">URL Exclusiva para s'Estatua</span>
                </div>
                <span className="text-[10px] bg-rose-200 text-rose-900 px-2 py-0.5 rounded font-black">Asigna a s'Estatua</span>
              </div>
              <div className="flex gap-2">
                <div className="flex-1 bg-white border border-rose-200 rounded-lg px-4 py-2 text-xs font-mono text-gray-800 break-all select-all">
                  {statuaWebhookUrl}
                </div>
                <button 
                  onClick={() => copyToClipboard(statuaWebhookUrl, 'statua')}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition-colors flex items-center gap-1.5 text-xs font-bold shrink-0"
                >
                  {copiedKey === 'statua' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copiedKey === 'statua' ? 'Copiado' : 'Copiar'}
                </button>
              </div>
            </div>
          </div>

          {/* Test buttons */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
            <h5 className="font-bold text-xs uppercase tracking-wider text-slate-700">Pruebas en Vivo de Entrada</h5>
            <div className="flex flex-wrap gap-3">
              <button 
                onClick={() => sendTestOrder('tropical')}
                disabled={isSendingTest}
                className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg font-bold hover:bg-orange-600 transition-colors disabled:opacity-50 text-xs shadow-sm"
              >
                <Plus className="w-4 h-4" />
                {isSendingTest ? 'Enviando...' : 'Simular Pedido Entrante Tropical'}
              </button>
              <button 
                onClick={() => sendTestOrder('statua')}
                disabled={isSendingTest}
                className="flex items-center gap-2 px-4 py-2 bg-rose-500 text-white rounded-lg font-bold hover:bg-rose-600 transition-colors disabled:opacity-50 text-xs shadow-sm"
              >
                <Plus className="w-4 h-4" />
                {isSendingTest ? 'Enviando...' : "Simular Pedido Entrante s'Estatua"}
              </button>
            </div>
            {testOrderResult && (
              <div className={`p-3 rounded-lg text-xs font-bold ${testOrderResult.success ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                {testOrderResult.message}
              </div>
            )}
          </div>

          {/* JSON Format Guide */}
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-3">
            <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
            <div className="text-xs text-blue-700 space-y-2 w-full">
              <p className="font-bold text-sm">Compatibilidad de Campos Aceptados:</p>
              <p>El sistema ahora acepta automáticamente cualquiera de estas variantes en el cuerpo JSON del POST:</p>
              <ul className="list-disc ml-5 space-y-1 font-mono text-[11px]">
                <li><strong>Número</strong>: <code>orderNumber</code>, <code>order_id</code>, <code>numero</code>, <code>numero_pedido</code>, <code>ticket</code>, <code>id</code></li>
                <li><strong>Restaurante</strong>: <code>restaurantId</code> ("restaurant1", "tropical"), <code>restaurante</code>, <code>store</code>, <code>tienda</code> (o usa la URL directa de Tropical)</li>
                <li><strong>Cliente</strong>: <code>customerName</code>, <code>nombre</code>, <code>cliente</code>, <code>name</code>, <code>billing.first_name</code></li>
                <li><strong>Teléfono</strong>: <code>customerPhone</code>, <code>telefono</code>, <code>phone</code>, <code>celular</code></li>
                <li><strong>Dirección</strong>: <code>address</code>, <code>direccion</code>, <code>shipping_address</code>, <code>calle</code>, <code>domicilio</code></li>
                <li><strong>Precio</strong>: <code>price</code>, <code>importe</code>, <code>total</code>, <code>monto</code> (admite números o strings tipo "24.50" o "24,50 €")</li>
                <li><strong>Pagado</strong>: <code>isPaid</code>, <code>pagado</code>, <code>paid</code> (true/false) o <code>payment_method: "tarjeta"</code></li>
              </ul>
            </div>
          </div>
        </section>

        <hr className="border-gray-100" />

        {/* Live Received Webhooks History */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-gray-900 font-bold">
              <Code className="w-5 h-5 text-indigo-600" />
              <h4 className="text-base font-bold">Registro de Webhooks Recibidos en Vivo</h4>
            </div>
            <button 
              onClick={fetchLogs} 
              disabled={loadingLogs}
              className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-bold bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingLogs ? 'animate-spin' : ''}`} />
              Actualizar
            </button>
          </div>

          <p className="text-xs text-gray-500">
            Aquí puedes ver exactamente cada petición HTTP que llega desde los sistemas externos en tiempo real para verificar si Tropical está conectando.
          </p>

          {logs.length === 0 ? (
            <div className="bg-gray-50 border border-dashed border-gray-200 rounded-xl p-8 text-center text-xs text-gray-400">
              No hay registros de webhooks recientes. Envía un pedido de prueba o realiza una venta en Tropical para ver la petición aquí.
            </div>
          ) : (
            <div className="overflow-x-auto border border-gray-200 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 text-gray-500 uppercase tracking-wider font-bold border-b border-gray-200">
                  <tr>
                    <th className="py-2.5 px-3">Hora</th>
                    <th className="py-2.5 px-3">Ruta</th>
                    <th className="py-2.5 px-3">Restaurante</th>
                    <th className="py-2.5 px-3">Pedido #</th>
                    <th className="py-2.5 px-3">Cliente</th>
                    <th className="py-2.5 px-3">Importe</th>
                    <th className="py-2.5 px-3">Estado</th>
                    <th className="py-2.5 px-3 text-right">Detalle</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {logs.map((log, idx) => (
                    <tr key={idx} className="hover:bg-gray-50/80 transition-colors">
                      <td className="py-2 px-3 font-mono text-[11px] text-gray-500 whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </td>
                      <td className="py-2 px-3 font-mono text-[11px] text-gray-600 whitespace-nowrap">
                        {log.endpoint}
                      </td>
                      <td className="py-2 px-3 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${log.restaurantId === 'restaurant1' ? 'bg-orange-100 text-orange-800' : 'bg-rose-100 text-rose-800'}`}>
                          {log.restaurantName || log.restaurantId || 'N/A'}
                        </span>
                      </td>
                      <td className="py-2 px-3 font-bold text-gray-900 whitespace-nowrap">
                        #{log.orderNumber || '-'}
                      </td>
                      <td className="py-2 px-3 text-gray-700 truncate max-w-[120px]">
                        {log.customerName || '-'}
                      </td>
                      <td className="py-2 px-3 font-bold whitespace-nowrap">
                        {log.price !== undefined ? `$${log.price.toFixed(2)}` : '-'}
                      </td>
                      <td className="py-2 px-3 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${log.status === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {log.status === 'success' ? 'Guardado' : 'Error'}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-right whitespace-nowrap">
                        <button 
                          onClick={() => setSelectedLogPayload(log)}
                          className="text-indigo-600 hover:text-indigo-800 font-bold text-[11px] flex items-center gap-1 ml-auto"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          JSON
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Modal Payload View */}
        {selectedLogPayload && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-4 max-h-[85vh] flex flex-col">
              <div className="flex items-center justify-between border-b pb-3">
                <h4 className="font-bold text-base text-gray-900">
                  Detalle del Webhook #{selectedLogPayload.orderNumber || ''}
                </h4>
                <button 
                  onClick={() => setSelectedLogPayload(null)} 
                  className="text-gray-400 hover:text-gray-700 font-bold"
                >
                  ✕
                </button>
              </div>
              <div className="text-xs text-gray-600 space-y-1">
                <p><strong>Fecha:</strong> {new Date(selectedLogPayload.timestamp).toLocaleString()}</p>
                <p><strong>Ruta:</strong> {selectedLogPayload.endpoint}</p>
                <p><strong>IP de origen:</strong> {selectedLogPayload.ip}</p>
                <p><strong>Restaurante asignado:</strong> {selectedLogPayload.restaurantName} ({selectedLogPayload.restaurantId})</p>
                {selectedLogPayload.error && <p className="text-red-600 font-bold"><strong>Error:</strong> {selectedLogPayload.error}</p>}
              </div>
              <div className="flex-1 overflow-auto bg-slate-900 text-emerald-400 p-4 rounded-xl font-mono text-xs">
                <pre>{JSON.stringify(selectedLogPayload.rawBody || selectedLogPayload, null, 2)}</pre>
              </div>
              <button 
                onClick={() => setSelectedLogPayload(null)}
                className="w-full py-2 bg-gray-100 hover:bg-gray-200 rounded-xl font-bold text-xs text-gray-700"
              >
                Cerrar
              </button>
            </div>
          </div>
        )}

        <hr className="border-gray-100" />

        {/* Outbound Webhook Config */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-gray-900 font-bold">
              <Globe className="w-5 h-5 text-rose-500" />
              <h4 className="text-base font-bold">Webhook de Salida (Notificaciones a tu servidor)</h4>
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
            Envía una notificación POST a tu propio servidor cuando un pedido cambie de estado (ej: Asignado, Entregado).
          </p>

          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">URL de Destino</label>
            <input 
              type="url"
              placeholder="https://tu-servidor.com/webhook"
              className="w-full border border-gray-300 rounded-xl px-4 py-2 outline-none focus:border-rose-500 text-sm"
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
              className="px-4 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-lg transition-colors disabled:opacity-50"
            >
              {isTesting ? 'Probando...' : 'Probar Notificación de Salida'}
            </button>
            <button 
              onClick={handleSave}
              className="flex items-center gap-2 px-6 py-2 bg-gray-900 text-white rounded-xl font-bold hover:bg-gray-800 transition-colors shadow-sm text-xs"
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
