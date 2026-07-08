import fs from 'fs';
let text = fs.readFileSync('src/App.tsx', 'utf-8');
text = text.replace(
  /appConfig=\{appConfig\}\n            updateAppConfig=\{updateAppConfig\}\n          \/>/g,
  "appConfig={appConfig}\n            updateAppConfig={updateAppConfig}\n            deleteOrder={deleteOrder}\n            addOrder={addOrder}\n          />"
);
fs.writeFileSync('src/App.tsx', text);
