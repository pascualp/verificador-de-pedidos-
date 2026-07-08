import fs from 'fs';
let text = fs.readFileSync('src/components/CentralDashboard.tsx', 'utf-8');
text = text.replace(
  "import { WebhookSettings } from './WebhookSettings';",
  "import { WebhookSettings } from './WebhookSettings';\nimport { RestaurantDashboard } from './RestaurantDashboard';"
);

text = text.replace(
  "const [currentView, setCurrentView] = useState<'dashboard' | 'webhooks'>('dashboard');",
  "const [currentView, setCurrentView] = useState<'dashboard' | 'restaurant1' | 'restaurant2' | 'webhooks'>('dashboard');"
);

fs.writeFileSync('src/components/CentralDashboard.tsx', text);
