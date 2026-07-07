import fs from 'fs';

let cent = fs.readFileSync('src/components/CentralDashboard.tsx', 'utf-8');
cent = cent.replace(/\$\{order\.price\.toFixed\(2\)\}/g, '${order.price === 0 ? "Pagado" : "$" + order.price.toFixed(2)}');
// Fix the hardcoded $ sign which was outside the template literal in the JSX
cent = cent.replace(/>\$\{\s*order\.price/g, '>{order.price');
fs.writeFileSync('src/components/CentralDashboard.tsx', cent);

let rest = fs.readFileSync('src/components/RestaurantDashboard.tsx', 'utf-8');
rest = rest.replace(/\$\{order\.price\.toFixed\(2\)\}/g, '${order.price === 0 ? "Pagado" : "$" + order.price.toFixed(2)}');
rest = rest.replace(/>\$\{\s*order\.price/g, '>{order.price');
fs.writeFileSync('src/components/RestaurantDashboard.tsx', rest);

let driv = fs.readFileSync('src/components/DriverDashboard.tsx', 'utf-8');
driv = driv.replace(/\$\{order\.price\.toFixed\(2\)\}/g, '${order.price === 0 ? "Pagado" : "$" + order.price.toFixed(2)}');
driv = driv.replace(/>\$\{\s*order\.price/g, '>{order.price');
fs.writeFileSync('src/components/DriverDashboard.tsx', driv);

