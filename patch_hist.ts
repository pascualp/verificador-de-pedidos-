import fs from 'fs';
let rest = fs.readFileSync('src/components/RestaurantDashboard.tsx', 'utf-8');
rest = rest.replace(
  /<span className="text-xl font-black text-gray-900">\s*\{filteredOrders\.length\}\s*<\/span>/,
  '<div className="flex flex-col items-end">' +
  '\n                <span className="text-xl font-black text-gray-900">{filteredOrders.length} {filteredOrders.length === 1 ? "pedido" : "pedidos"}</span>' +
  '\n                <span className="text-emerald-700 font-bold">${filteredOrders.reduce((sum, o) => sum + (o.price || 0), 0).toFixed(2)}</span>' +
  '\n              </div>'
);
fs.writeFileSync('src/components/RestaurantDashboard.tsx', rest);
