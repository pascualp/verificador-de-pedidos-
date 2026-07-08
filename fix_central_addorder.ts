import fs from 'fs';
let text = fs.readFileSync('src/components/CentralDashboard.tsx', 'utf-8');
text = text.replace(
  "addOrder={addOrder ? (orderNumber, customerName, customerPhone, address, prepTime) => addOrder(orderNumber, customerName, customerPhone, currentView, address, prepTime) : undefined}",
  "addOrder={addOrder}\n            restaurantId={currentView}"
);
fs.writeFileSync('src/components/CentralDashboard.tsx', text);
