import fs from 'fs';

let content = fs.readFileSync('src/components/RestaurantDashboard.tsx', 'utf-8');

// Replace conditional logic in RestaurantDashboard for totalCollected
content = content.replace(
  /\{driver\.totalCollected !== undefined && \(\s*<span className="text-\[10px\] bg-emerald-100/g,
  '<span className="text-[10px] bg-emerald-100'
);
content = content.replace(
  /\${driver\.totalCollected\.toFixed\(2\)}\s*<\/span>\s*\)}/g,
  '${(driver.totalCollected || 0).toFixed(2)}\n                        </span>'
);

content = content.replace(
  /\{driver\.totalCollected !== undefined && \(\s*<button/g,
  '<button'
);
content = content.replace(
  /Cerrar Turno \(Caja\)\s*<\/button>\s*\)}/g,
  'Cerrar Turno (Caja)\n                      </button>'
);
content = content.replace(
  /driver\.totalCollected\?\.toFixed\(2\)/g,
  '(driver.totalCollected || 0).toFixed(2)'
);

fs.writeFileSync('src/components/RestaurantDashboard.tsx', content);

let content2 = fs.readFileSync('src/components/CentralDashboard.tsx', 'utf-8');
content2 = content2.replace(
  /\{driver\.totalCollected !== undefined && \(\s*<div className="flex items-center gap-1">/g,
  '<div className="flex items-center gap-1">'
);
content2 = content2.replace(
  /\${driver\.totalCollected\.toFixed\(2\)}/g,
  '${(driver.totalCollected || 0).toFixed(2)}'
);
content2 = content2.replace(
  /<\/button>\s*<\/div>\s*\)}/g,
  '</button>\n                              </div>'
);
content2 = content2.replace(
  /driver\.totalCollected\?\.toFixed\(2\)/g,
  '(driver.totalCollected || 0).toFixed(2)'
);
fs.writeFileSync('src/components/CentralDashboard.tsx', content2);
