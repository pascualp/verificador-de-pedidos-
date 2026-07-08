import fs from 'fs';

let app = fs.readFileSync('src/App.tsx', 'utf-8');
app = app.replace(
  "drivers={drivers.filter(d => (d.restaurantId === role || (!d.restaurantId && role === 'restaurant1')) && !d.isHidden)}",
  "drivers={drivers.filter(d => (d.restaurantId === role || d.restaurantId === 'ambos' || (!d.restaurantId && role === 'restaurant1')) && !d.isHidden)}"
);
fs.writeFileSync('src/App.tsx', app);
