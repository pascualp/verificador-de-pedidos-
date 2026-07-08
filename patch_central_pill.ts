import fs from 'fs';

let text = fs.readFileSync('src/components/CentralDashboard.tsx', 'utf-8');

const oldHeader = `                      <div className="flex items-center gap-2">
                        <span>{driver.name}</span>
                        {driver.password && <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded border border-white/30 lowercase tracking-normal font-medium" title="Contraseña">🔑 {driver.password}</span>}
                      </div>
                      {driver.isHidden && <span className="text-[10px] bg-black/20 px-2 py-0.5 rounded-full flex items-center gap-1"><EyeOff className="w-3 h-3" /> Oculto a Restaurantes</span>}`;

const newHeader = `                      <div className="flex items-center gap-2">
                        <span>{driver.name}</span>
                        {driver.password && <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded border border-white/30 lowercase tracking-normal font-medium" title="Contraseña">🔑 {driver.password}</span>}
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm(\`¿Cambiar estado de \${driver.name} a \${driver.status === 'Libre' ? 'Repartiendo' : 'Libre'}?\`)) {
                              updateDriver({ ...driver, status: driver.status === 'Libre' ? 'Repartiendo' : 'Libre' });
                            }
                          }}
                          className={\`text-[10px] px-2 py-0.5 rounded-full hover:opacity-80 transition-opacity \${driver.status === 'Libre' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}\`}
                        >
                          {driver.status}
                        </button>
                        {driver.isHidden && <span className="text-[10px] bg-black/20 px-2 py-0.5 rounded-full flex items-center gap-1"><EyeOff className="w-3 h-3" /> Oculto a Restaurantes</span>}
                      </div>`;

text = text.replace(oldHeader, newHeader);
text = text.replace(oldHeader, newHeader);

fs.writeFileSync('src/components/CentralDashboard.tsx', text);
