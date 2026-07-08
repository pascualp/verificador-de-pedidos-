import fs from 'fs';

let text = fs.readFileSync('src/components/DriverDashboard.tsx', 'utf-8');

// Import CreditCard (or similar) from lucide-react if not present, we will add CreditCard and Banknote
if (!text.includes('CreditCard')) {
  text = text.replace('RotateCcw, ArrowLeft }', 'RotateCcw, ArrowLeft, CreditCard, Banknote }');
}

// Add state
const stateDeclaration = "const [completingOrderId, setCompletingOrderId] = useState<string | null>(null);\n";
text = text.replace("const [loginError, setLoginError] = useState('');", "const [loginError, setLoginError] = useState('');\n  " + stateDeclaration);

// Add handler
const handlerCode = `
  const handleCompleteIndividualOrder = (order: Order, paymentMethod: 'efectivo' | 'tarjeta' | 'pagado') => {
    const isEfectivo = paymentMethod === 'efectivo';
    const amount = isEfectivo ? (order.price || 0) : 0;
    
    if (updateOrder) {
      updateOrder({
        ...order,
        status: 'Entregado',
        paymentMethod: paymentMethod === 'pagado' ? undefined : paymentMethod
      });
    }

    if (updateDriver && selectedDriver) {
      const remainingActive = (orders || []).filter(o => o.driverId === selectedDriver.id && o.status === 'Asignado' && o.id !== order.id).length;
      updateDriver({
        ...selectedDriver,
        status: remainingActive === 0 ? 'Libre' : 'Repartiendo',
        activeOrders: remainingActive,
        totalOrders: (selectedDriver.totalOrders || 0) + 1,
        totalCollected: (selectedDriver.totalCollected || 0) + amount,
        lastUpdated: new Date().toISOString()
      });
    }

    setCompletingOrderId(null);
  };
`;
text = text.replace("const handleMarkAsFree = (driver: Driver) => {", handlerCode + "\n  const handleMarkAsFree = (driver: Driver) => {");

// Replace order card mapping to include completion buttons
const oldOrderRender = `                        {order.address && (
                          <div className="flex flex-col gap-2 mt-1 border-t border-gray-50 pt-3">
                            <div className="flex items-start gap-2 text-sm text-gray-700 font-medium">
                              <MapPin className="w-4 h-4 text-rose-500 mt-0.5 shrink-0" />
                              {order.address}
                            </div>
                            <a 
                              href={\`https://www.google.com/maps/search/?api=1&query=\${encodeURIComponent(order.address)}\`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="w-full bg-rose-50 text-rose-600 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 hover:bg-rose-100 transition-colors border border-rose-100"
                            >
                              <MapPin className="w-4 h-4" />
                              VER EN GPS
                            </a>
                          </div>
                        )}`;

const newOrderRender = `                        {order.address && (
                          <div className="flex flex-col gap-2 mt-1 border-t border-gray-50 pt-3">
                            <div className="flex items-start gap-2 text-sm text-gray-700 font-medium">
                              <MapPin className="w-4 h-4 text-rose-500 mt-0.5 shrink-0" />
                              {order.address}
                            </div>
                            <a 
                              href={\`https://www.google.com/maps/search/?api=1&query=\${encodeURIComponent(order.address)}\`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="w-full bg-rose-50 text-rose-600 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 hover:bg-rose-100 transition-colors border border-rose-100"
                            >
                              <MapPin className="w-4 h-4" />
                              VER EN GPS
                            </a>
                          </div>
                        )}
                        
                        <div className="mt-2 pt-3 border-t border-gray-100">
                          {completingOrderId === order.id ? (
                            <div className="flex flex-col gap-2">
                              <p className="text-sm font-bold text-gray-800 text-center mb-1">¿Cómo se pagó?</p>
                              {order.price === 0 ? (
                                <button
                                  onClick={() => handleCompleteIndividualOrder(order, 'pagado')}
                                  className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-2 rounded-lg font-bold flex items-center justify-center gap-2"
                                >
                                  <CheckCircle className="w-5 h-5" /> Confirmar Entrega
                                </button>
                              ) : (
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handleCompleteIndividualOrder(order, 'efectivo')}
                                    className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white py-2 rounded-lg font-bold flex flex-col items-center justify-center gap-1"
                                  >
                                    <Banknote className="w-5 h-5" /> Efectivo
                                  </button>
                                  <button
                                    onClick={() => handleCompleteIndividualOrder(order, 'tarjeta')}
                                    className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg font-bold flex flex-col items-center justify-center gap-1"
                                  >
                                    <CreditCard className="w-5 h-5" /> Tarjeta
                                  </button>
                                </div>
                              )}
                              <button
                                onClick={() => setCompletingOrderId(null)}
                                className="w-full text-gray-500 text-sm mt-1 py-1 font-medium hover:text-gray-800"
                              >
                                Cancelar
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setCompletingOrderId(order.id)}
                              className="w-full border-2 border-emerald-500 text-emerald-600 hover:bg-emerald-50 py-2.5 rounded-lg font-black text-sm uppercase tracking-wide flex items-center justify-center gap-2 transition-colors"
                            >
                              <CheckCircle className="w-5 h-5" /> Marcar Entregado
                            </button>
                          )}
                        </div>`;

text = text.replace(oldOrderRender, newOrderRender);

// Remove the global "TERMINAR REPARTO" button as it's no longer needed if we do them individually.
// Or we can keep it for an "All at once" fallback? The user said "ya que ahora se finaliza una vez has repartido todo". We should remove the global one.
const oldGlobalButton = `<button
                onClick={() => handleMarkAsFree(selectedDriver)}
                className="w-full bg-green-500 hover:bg-green-600 text-white py-5 rounded-2xl text-xl font-black shadow-lg shadow-green-200 transition-all flex items-center justify-center gap-3 transform active:scale-95"
              >
                <CheckCircle className="w-7 h-7" />
                TERMINAR REPARTO
              </button>`;

text = text.replace(oldGlobalButton, "");

fs.writeFileSync('src/components/DriverDashboard.tsx', text);
