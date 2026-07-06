import fs from 'fs';

let driv = fs.readFileSync('src/components/DriverDashboard.tsx', 'utf-8');

const drivHelper = `
  const getDriverTotal = (driver: Driver) => {
    const delivered = driver.totalCollected || 0;
    const active = (orders || []).filter(o => o.driverId === driver.id && o.status === 'Asignado').reduce((sum, o) => sum + (o.price || 0), 0);
    return delivered + active;
  };
`;

driv = driv.replace(/const selectedDriver = drivers\.find\(d => d\.id === selectedDriverId\);\n/, match => match + drivHelper);

driv = driv.replace(/const total = driver\.totalCollected \|\| 0;/g, 'const total = getDriverTotal(driver);');
driv = driv.replace(/\$\{\(selectedDriver\.totalCollected \|\| 0\)\.toFixed\(2\)\}/g, '${getDriverTotal(selectedDriver).toFixed(2)}');

fs.writeFileSync('src/components/DriverDashboard.tsx', driv);
