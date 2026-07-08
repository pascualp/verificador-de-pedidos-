import fs from 'fs';

let app = fs.readFileSync('src/App.tsx', 'utf-8');
app = app.replace(/pw === 's'estatua' \|\| pw === 'pizzeria s'estatua'/g, 'pw === "s\'estatua" || pw === "pizzeria s\'estatua"');
app = app.replace(/setError\('Contraseña incorrecta\. Usa "tropical" o "s'estatua"\.'\);/g, 'setError(`Contraseña incorrecta. Usa "tropical" o "s\'estatua".`);');
fs.writeFileSync('src/App.tsx', app);

let hdr = fs.readFileSync('src/components/Header.tsx', 'utf-8');
hdr = hdr.replace(/return 'Pizzería s'Estatua';/g, 'return "Pizzería s\'Estatua";');
fs.writeFileSync('src/components/Header.tsx', hdr);

