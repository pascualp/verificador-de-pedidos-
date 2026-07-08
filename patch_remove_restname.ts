import fs from 'fs';

let app = fs.readFileSync('src/App.tsx', 'utf-8');
app = app.replace(/\s*restaurantName=\{role === 'restaurant1' \? 'Restaurante Tropical' : "s'Estatua"\}/, '');
fs.writeFileSync('src/App.tsx', app);

let central = fs.readFileSync('src/components/CentralDashboard.tsx', 'utf-8');
central = central.replace(/\s*restaurantName=\{currentView === 'restaurant1' \? 'Restaurante Tropical' : "s'Estatua"\}/, '');
fs.writeFileSync('src/components/CentralDashboard.tsx', central);
