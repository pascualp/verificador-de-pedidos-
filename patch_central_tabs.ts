import fs from 'fs';
let text = fs.readFileSync('src/components/CentralDashboard.tsx', 'utf-8');

const oldTabs = `<button 
              onClick={() => setCurrentView('dashboard')}
              className={\`px-4 py-1.5 rounded-lg text-sm font-bold transition-all \${currentView === 'dashboard' ? 'bg-cyan-500 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}\`}
            >
              Dashboard
            </button>
            <button 
              onClick={() => setCurrentView('webhooks')}
              className={\`px-4 py-1.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2 \${currentView === 'webhooks' ? 'bg-cyan-500 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}\`}
            >
              <Webhook className="w-4 h-4" />
              Webhooks
            </button>`;

const newTabs = `<button 
              onClick={() => setCurrentView('dashboard')}
              className={\`px-4 py-1.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2 \${currentView === 'dashboard' ? 'bg-cyan-500 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}\`}
            >
              Dashboard
            </button>
            <button 
              onClick={() => setCurrentView('restaurant1')}
              className={\`px-4 py-1.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2 \${currentView === 'restaurant1' ? 'bg-orange-500 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}\`}
            >
              <TreePalm className="w-4 h-4" />
              Tropical
            </button>
            <button 
              onClick={() => setCurrentView('restaurant2')}
              className={\`px-4 py-1.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2 \${currentView === 'restaurant2' ? 'bg-rose-500 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}\`}
            >
              <Pizza className="w-4 h-4" />
              s'Estatua
            </button>
            <button 
              onClick={() => setCurrentView('webhooks')}
              className={\`px-4 py-1.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2 \${currentView === 'webhooks' ? 'bg-cyan-500 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}\`}
            >
              <Webhook className="w-4 h-4" />
              Webhooks
            </button>`;

text = text.replace(oldTabs, newTabs);

fs.writeFileSync('src/components/CentralDashboard.tsx', text);
