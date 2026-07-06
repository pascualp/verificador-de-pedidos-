import fs from 'fs';

let content = fs.readFileSync('src/components/RestaurantDashboard.tsx', 'utf-8');
content = content.replace(/driver\.totalCollected !== undefined && driver\.totalCollected > 0/g, 'driver.totalCollected !== undefined');
fs.writeFileSync('src/components/RestaurantDashboard.tsx', content);

let content2 = fs.readFileSync('src/components/CentralDashboard.tsx', 'utf-8');
content2 = content2.replace(/driver\.totalCollected !== undefined && driver\.totalCollected > 0/g, 'driver.totalCollected !== undefined');
fs.writeFileSync('src/components/CentralDashboard.tsx', content2);
