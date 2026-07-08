import fs from 'fs';

let text = fs.readFileSync('src/components/CentralDashboard.tsx', 'utf-8');

text = text.replace(
  /button onClick=\{\(\) => \{ setEditingId\(driver\.id\); setEditName\(driver\.name\); \}\} className="text-gray-400/g,
  'button onClick={() => { setEditingId(driver.id); setEditName(driver.name); setEditPassword(driver.password || ""); setEditRestaurantId(driver.restaurantId || "restaurant1"); }} className="text-gray-400'
);

const oldEditDiv = `<input 
                                type="text" 
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                className="border border-gray-300 rounded px-2 py-0.5 text-sm w-32 outline-none focus:border-cyan-500 bg-white"
                                autoFocus
                              />
                              <button onClick={() => handleEditSave(driver)} className="text-green-600 hover:text-green-700 p-1 bg-white rounded shadow-sm"><Check className="w-4 h-4" /></button>
                              <button onClick={() => setEditingId(null)} className="text-gray-400 hover:text-gray-600 p-1 bg-white rounded shadow-sm"><X className="w-4 h-4" /></button>`;

const newEditDiv = `<input 
                                type="text" 
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                className="border border-gray-300 rounded px-2 py-0.5 text-sm w-full outline-none focus:border-cyan-500 bg-white mb-1"
                                placeholder="Nombre"
                                autoFocus
                              />
                              <div className="flex gap-1 mb-1">
                                <input 
                                  type="text" 
                                  value={editPassword}
                                  onChange={(e) => setEditPassword(e.target.value)}
                                  className="border border-gray-300 rounded px-2 py-0.5 text-sm w-24 outline-none focus:border-cyan-500 bg-white"
                                  placeholder="Clave"
                                />
                                <select value={editRestaurantId} onChange={(e) => setEditRestaurantId(e.target.value)} className="border border-gray-300 rounded px-2 py-0.5 text-xs flex-1 outline-none focus:border-cyan-500 bg-white">
                                  <option value="restaurant1">Tropical</option>
                                  <option value="restaurant2">s'Estatua</option>
                                  <option value="ambos">Ambos</option>
                                </select>
                              </div>
                              <div className="flex gap-1">
                                <button onClick={() => handleEditSave(driver)} className="text-white bg-green-500 hover:bg-green-600 px-2 py-0.5 text-xs font-bold rounded shadow-sm flex items-center gap-1"><Check className="w-3 h-3" /> Guardar</button>
                                <button onClick={() => setEditingId(null)} className="text-gray-600 bg-gray-200 hover:bg-gray-300 px-2 py-0.5 text-xs font-bold rounded shadow-sm flex items-center gap-1"><X className="w-3 h-3" /> Cancelar</button>
                              </div>`;

text = text.replace(oldEditDiv, newEditDiv);

fs.writeFileSync('src/components/CentralDashboard.tsx', text);
