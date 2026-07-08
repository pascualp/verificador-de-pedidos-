import fs from 'fs';

let rest = fs.readFileSync('src/components/RestaurantDashboard.tsx', 'utf-8');

const oldBlock = `{orders && orders.filter(o => o.driverId === driver.id && o.status === 'Asignado').length > 0 && (
                        <div className="text-xs font-bold text-cyan-600 my-0.5">
                          #{orders.filter(o => o.driverId === driver.id && o.status === 'Asignado').map(o => o.orderNumber).join(', #')}
                        </div>
                      )}`;

const newBlock = `{orders && orders.filter(o => o.driverId === driver.id && o.status === 'Asignado').length > 0 && (
                        <div className="flex flex-col gap-2 w-full mt-2">
                          {orders.filter(o => o.driverId === driver.id && o.status === 'Asignado').map(o => (
                            <div key={o.id} className="flex flex-col text-left bg-white border border-gray-200 rounded p-1.5 w-full">
                              <span className="text-xs font-bold text-cyan-700">#{o.orderNumber} {o.customerName ? '- ' + o.customerName : ''}</span>
                              <select
                                className="mt-1 border border-gray-300 rounded text-[10px] p-1 w-full"
                                value={driver.id}
                                onChange={(e) => {
                                  const newDriverId = e.target.value;
                                  if (newDriverId !== driver.id && updateOrder && updateDriver) {
                                    // Update old driver
                                    const oldDriver = driver;
                                    const oldActive = Math.max(0, oldDriver.activeOrders - 1);
                                    updateDriver({
                                      ...oldDriver,
                                      activeOrders: oldActive,
                                      status: oldActive === 0 ? 'Libre' : 'Repartiendo',
                                      lastUpdated: new Date().toISOString()
                                    });

                                    if (newDriverId === 'unassign') {
                                      updateOrder({
                                        ...o,
                                        driverId: undefined,
                                        status: 'En Cola',
                                        assignedAt: undefined
                                      });
                                    } else {
                                      const newDriver = drivers.find(d => d.id === newDriverId);
                                      if (newDriver) {
                                        updateDriver({
                                          ...newDriver,
                                          activeOrders: (newDriver.activeOrders || 0) + 1,
                                          status: 'Repartiendo',
                                          lastUpdated: new Date().toISOString()
                                        });
                                        updateOrder({
                                          ...o,
                                          driverId: newDriverId,
                                          assignedAt: new Date().toISOString()
                                        });
                                      }
                                    }
                                  }
                                }}
                              >
                                <option value={driver.id}>{driver.name}</option>
                                <option value="unassign">-- Desasignar --</option>
                                {drivers.filter(d => d.id !== driver.id).map(d => (
                                  <option key={d.id} value={d.id}>{d.name}</option>
                                ))}
                              </select>
                            </div>
                          ))}
                        </div>
                      )}`;

rest = rest.replace(oldBlock, newBlock);

fs.writeFileSync('src/components/RestaurantDashboard.tsx', rest);
