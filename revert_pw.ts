import fs from 'fs';

let app = fs.readFileSync('src/App.tsx', 'utf-8');
app = app.replace(/pw === "s'estatua"/g, 'pw === "statua"');
app = app.replace(/pw === "pizzeria s'estatua"/g, 'pw === "pizzeria s^tatua"');
app = app.replace(/setError\(\`Contraseña incorrecta\. Usa "tropical" o "s'estatua"\.\`\);/g, "setError(`Contraseña incorrecta. Usa \"tropical\" o \"statua\".`);");
fs.writeFileSync('src/App.tsx', app);
