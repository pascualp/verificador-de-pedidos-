import fs from 'fs';

let app = fs.readFileSync('src/App.tsx', 'utf-8');

const sanitizeFn = `
const sanitizeForFirestore = <T extends Record<string, any>>(obj: T): T => {
  const sanitized: any = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      sanitized[key] = value;
    }
  }
  return sanitized;
};
`;

app = app.replace("export default function App() {", sanitizeFn + "\nexport default function App() {");

app = app.replace(/await setDoc\(doc\(db, 'orders', newOrder\.id\), newOrder\);/g, "await setDoc(doc(db, 'orders', newOrder.id), sanitizeForFirestore(newOrder));");
app = app.replace(/await setDoc\(doc\(db, 'orders', updatedOrder\.id\), updatedOrder\);/g, "await setDoc(doc(db, 'orders', updatedOrder.id), sanitizeForFirestore(updatedOrder));");
app = app.replace(/await setDoc\(doc\(db, 'drivers', updatedDriver\.id\), updatedDriver\);/g, "await setDoc(doc(db, 'drivers', updatedDriver.id), sanitizeForFirestore(updatedDriver));");
app = app.replace(/await setDoc\(doc\(db, 'drivers', newDriver\.id\), newDriver\);/g, "await setDoc(doc(db, 'drivers', newDriver.id), sanitizeForFirestore(newDriver));");

fs.writeFileSync('src/App.tsx', app);
