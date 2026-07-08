import fs from 'fs';
let text = fs.readFileSync('src/components/CentralDashboard.tsx', 'utf-8');

const oldRender = `{currentView === 'webhooks' ? (
        <WebhookSettings config={appConfig} onUpdate={updateAppConfig} />
      ) : (
        <>
          {showAddForm && (`;

const newRender = `{currentView === 'webhooks' ? (
        <WebhookSettings config={appConfig} onUpdate={updateAppConfig} />
      ) : currentView === 'restaurant1' || currentView === 'restaurant2' ? (
        <RestaurantDashboard
            drivers={drivers.filter(d => (d.restaurantId === currentView || d.restaurantId === 'ambos' || (!d.restaurantId && currentView === 'restaurant1')) && !d.isHidden)} 
            updateDriver={updateDriver} 
            themeColor={currentView === 'restaurant1' ? 'orange' : 'rose'}
            orders={orders?.filter(o => o.restaurantId === currentView)}
            updateOrder={updateOrder}
            deleteOrder={deleteOrder}
            addOrder={addOrder ? (orderNumber, customerName, customerPhone, address, prepTime) => addOrder(orderNumber, customerName, customerPhone, currentView, address, prepTime) : undefined}
            restaurantName={currentView === 'restaurant1' ? 'Restaurante Tropical' : "s'Estatua"}
        />
      ) : (
        <>
          {showAddForm && (`;

text = text.replace(oldRender, newRender);

fs.writeFileSync('src/components/CentralDashboard.tsx', text);
