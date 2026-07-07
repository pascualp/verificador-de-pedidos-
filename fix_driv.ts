import fs from 'fs';
let driv = fs.readFileSync('src/components/DriverDashboard.tsx', 'utf-8');
driv = driv.replace(/\$\{(\s*)order\.price === 0/g, '{$1order.price === 0');
fs.writeFileSync('src/components/DriverDashboard.tsx', driv);
