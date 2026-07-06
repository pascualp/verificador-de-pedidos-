import fs from 'fs';

// RestaurantDashboard.tsx
let rest = fs.readFileSync('src/components/RestaurantDashboard.tsx', 'utf-8');
const restHelper = `
  const getDriverTotal = (driver: Driver) => {
    const delivered = driver.totalCollected || 0;
    const active = (orders || []).filter(o => o.driverId === driver.id && o.status === 'Asignado').reduce((sum, o) => sum + (o.price || 0), 0);
    return delivered + active;
  };
`;
// Insert helper after handleReturn
rest = rest.replace(/const handleReturn = \(driver: Driver\) => \{[\s\S]*?  \};\n/, match => match + restHelper);

// Replace (driver.totalCollected || 0) with getDriverTotal(driver) for display
rest = rest.replace(/\$\{\(driver\.totalCollected \|\| 0\)\.toFixed\(2\)\}/g, '${getDriverTotal(driver).toFixed(2)}');
fs.writeFileSync('src/components/RestaurantDashboard.tsx', rest);

// CentralDashboard.tsx
let cent = fs.readFileSync('src/components/CentralDashboard.tsx', 'utf-8');
const centHelper = `
  const getDriverTotal = (driver: Driver) => {
    const delivered = driver.totalCollected || 0;
    const active = orders.filter(o => o.driverId === driver.id && o.status === 'Asignado').reduce((sum, o) => sum + (o.price || 0), 0);
    return delivered + active;
  };
`;
// Insert helper after handleAssign
cent = cent.replace(/const handleAssign = \(driver: Driver\) => \{[\s\S]*?  \};\n/, match => match + centHelper);

// Replace (driver.totalCollected || 0) with getDriverTotal(driver) for display
cent = cent.replace(/\$\{\(driver\.totalCollected \|\| 0\)\.toFixed\(2\)\}/g, '${getDriverTotal(driver).toFixed(2)}');
fs.writeFileSync('src/components/CentralDashboard.tsx', cent);

