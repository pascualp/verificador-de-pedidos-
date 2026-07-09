import fs from 'fs';

let text = fs.readFileSync('src/components/CentralDashboard.tsx', 'utf-8');

const oldBtn = `<button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm(\`¿Cambiar estado de \${driver.name} a \${driver.status === 'Libre' ? 'Repartiendo' : 'Libre'}?\`)) {
                              updateDriver({ ...driver, status: driver.status === 'Libre' ? 'Repartiendo' : 'Libre' });
                            }
                          }}
                          className={\`text-[10px] px-2 py-0.5 rounded-full hover:opacity-80 transition-opacity \${driver.status === 'Libre' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}\`}
                        >
                          {driver.status}
                        </button>`;

const newBtn = `<button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm(\`¿Cambiar estado de \${driver.name} a \${driver.status === 'Libre' ? 'Repartiendo' : 'Libre'}?\`)) {
                              updateDriver({ ...driver, status: driver.status === 'Libre' ? 'Repartiendo' : 'Libre' });
                            }
                          }}
                          className={\`text-[10px] px-2 py-0.5 rounded-full hover:opacity-80 transition-opacity \${driver.status === 'Libre' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}\`}
                        >
                          {driver.status === 'Repartiendo' && orders?.filter(o => o.driverId === driver.id && o.status === 'Asignado').length 
                            ? orders.filter(o => o.driverId === driver.id && o.status === 'Asignado').map(o => '#' + o.orderNumber).join(', ') 
                            : driver.status}
                        </button>`;

text = text.replace(oldBtn, newBtn);
text = text.replace(oldBtn, newBtn);

fs.writeFileSync('src/components/CentralDashboard.tsx', text);
