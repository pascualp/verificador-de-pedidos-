import fs from 'fs';

let text = fs.readFileSync('src/components/CentralDashboard.tsx', 'utf-8');

// Add "Ambos" to new driver form
text = text.replace(
  /<option value="restaurant2">s'Estatua<\/option>/g,
  '<option value="restaurant2">s\'Estatua</option>\n                <option value="ambos">Ambos Restaurantes</option>'
);

// Update filtering in RestaurantColumn
text = text.replace(
  /const restDrivers = drivers.filter\(d => \(d\.restaurantId === restId\) \|\| \(!d\.restaurantId && restId === 'restaurant1'\)\);/g,
  "const restDrivers = drivers.filter(d => (d.restaurantId === restId) || (d.restaurantId === 'ambos') || (!d.restaurantId && restId === 'restaurant1'));"
);

// Add editRestaurantId state
text = text.replace(
  "const [editPassword, setEditPassword] = useState('');",
  "const [editPassword, setEditPassword] = useState('');\n  const [editRestaurantId, setEditRestaurantId] = useState('restaurant1');"
);

// Update handleEditSave
text = text.replace(
  /password: editPassword\.trim\(\) \|\| undefined\n      \}\);/g,
  "password: editPassword.trim() || undefined,\n        restaurantId: editRestaurantId\n      });"
);

// Update edit mode button to initialize editRestaurantId
text = text.replace(
  /setEditPassword\(driver\.password \|\| ''\);/g,
  "setEditPassword(driver.password || ''); setEditRestaurantId(driver.restaurantId || 'restaurant1');"
);

// Update inline edit mode in List View
text = text.replace(
  /<input \n                                type="text" \n                                value=\{editPassword\}\n                                onChange=\{\(e\) => setEditPassword\(e\.target\.value\)\}\n                                className="border border-gray-300 rounded px-2 py-1 text-sm w-24 outline-none focus:border-cyan-500 bg-white"\n                                placeholder="Contraseña"\n                              \/>/g,
  `<input \n                                type="text" \n                                value={editPassword}\n                                onChange={(e) => setEditPassword(e.target.value)}\n                                className="border border-gray-300 rounded px-2 py-1 text-sm w-24 outline-none focus:border-cyan-500 bg-white"\n                                placeholder="Contraseña"\n                              />\n                              <select value={editRestaurantId} onChange={(e) => setEditRestaurantId(e.target.value)} className="border border-gray-300 rounded px-2 py-1 text-sm flex-1 outline-none focus:border-cyan-500 bg-white">\n                                <option value="restaurant1">Tropical</option>\n                                <option value="restaurant2">s'Estatua</option>\n                                <option value="ambos">Ambos</option>\n                              </select>`
);

fs.writeFileSync('src/components/CentralDashboard.tsx', text);
