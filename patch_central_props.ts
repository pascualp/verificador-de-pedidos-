import fs from 'fs';
let text = fs.readFileSync('src/components/CentralDashboard.tsx', 'utf-8');

text = text.replace(
  "  updateAppConfig\n}: {",
  "  updateAppConfig,\n  deleteOrder,\n  addOrder\n}: {"
);
text = text.replace(
  "  updateAppConfig: (config: AppConfig) => void\n}) {",
  "  updateAppConfig: (config: AppConfig) => void,\n  deleteOrder?: (id: string) => void,\n  addOrder?: (orderNumber: string, customerName: string, customerPhone: string, restaurantId: string, address: string, prepTime?: number, price?: number) => void\n}) {"
);
fs.writeFileSync('src/components/CentralDashboard.tsx', text);
