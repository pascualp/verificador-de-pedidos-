import fs from 'fs';

let cent = fs.readFileSync('src/components/CentralDashboard.tsx', 'utf-8');
const centHelper = `
  const getDriverTotal = (driver: Driver) => {
    const delivered = driver.totalCollected || 0;
    const active = orders.filter(o => o.driverId === driver.id && o.status === 'Asignado').reduce((sum, o) => sum + (o.price || 0), 0);
    return delivered + active;
  };
`;
cent = cent.replace(/const handleEditSave = \(driver: Driver\) => \{/, match => centHelper + '\n  ' + match);
fs.writeFileSync('src/components/CentralDashboard.tsx', cent);
