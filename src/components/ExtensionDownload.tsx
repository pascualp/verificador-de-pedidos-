import JSZip from 'jszip';
import { Download } from 'lucide-react';

export function ExtensionDownload() {
  const handleDownload = async () => {
    const zip = new JSZip();
    
    const manifest = {
      manifest_version: 3,
      name: "WSP ProcessTracker Capture",
      version: "1.0",
      description: "Captura chats de WhatsApp Web",
      permissions: ["activeTab", "scripting"],
      host_permissions: ["https://web.whatsapp.com/*"],
      action: {
        default_popup: "popup.html"
      }
    };

    const popupHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { width: 280px; font-family: sans-serif; padding: 16px; margin: 0; }
    h3 { margin-top: 0; font-size: 16px; color: #1a1a1a; }
    button { 
      width: 100%; 
      padding: 10px; 
      background: black; 
      color: white; 
      border: none; 
      border-radius: 6px; 
      cursor: pointer; 
      font-weight: bold;
      margin-bottom: 10px;
    }
    button:hover { opacity: 0.9; }
    #status { font-size: 12px; color: #666; min-height: 20px; }
    .input-group { margin-bottom: 12px; }
    label { font-size: 11px; font-weight: bold; color: #666; display: block; margin-bottom: 4px; }
    input { width: 100%; padding: 6px; box-sizing: border-box; border: 1px solid #ccc; border-radius: 4px; font-size: 12px; }
  </style>
</head>
<body>
  <h3>WSP ProcessTracker</h3>
  <p style="font-size: 12px; color: #666; margin-bottom: 12px;">Entra a un chat de WhatsApp Web, presiona capturar y luego pégalo en la aplicación.</p>
  
  <div class="input-group">
    <label>URL de la Aplicación de Destino</label>
    <input type="text" id="appUrl" placeholder="Pega aquí la URL de la app">
  </div>

  <button id="captureBtn">Capturar Chat Actual</button>
  <p id="status"></p>
  <script src="popup.js"></script>
</body>
</html>`;

    const popupJs = `
document.addEventListener('DOMContentLoaded', () => {
  const savedUrl = localStorage.getItem('targetAppUrl');
  if (savedUrl) {
    document.getElementById('appUrl').value = savedUrl;
  }
});

document.getElementById('appUrl').addEventListener('input', (e) => {
  localStorage.setItem('targetAppUrl', e.target.value);
});

document.getElementById('captureBtn').addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
  if (!tab.url.includes("web.whatsapp.com")) {
    document.getElementById('status').innerText = "❌ Abre WhatsApp Web primero.";
    return;
  }

  document.getElementById('status').innerText = "Capturando...";

  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    function: captureWhatsAppChat,
  }, (results) => {
    if (results && results[0] && results[0].result) {
      const chatText = results[0].result;
      
      const textArea = document.createElement("textarea");
      textArea.value = chatText;
      document.body.appendChild(textArea);
      textArea.select();
      
      try {
        document.execCommand('copy');
        document.getElementById('status').innerText = "✅ ¡Copiado! Abriendo app...";
        
        const urlToOpen = document.getElementById('appUrl').value.trim();
        if (urlToOpen) {
          setTimeout(() => {
            chrome.tabs.create({ url: urlToOpen });
          }, 1000);
        } else {
          document.getElementById('status').innerText = "✅ ¡Copiado! (No hay URL guardada para abrir)";
        }
      } catch (err) {
        document.getElementById('status').innerText = "❌ Error al copiar.";
      }
      document.body.removeChild(textArea);
      
    } else {
      document.getElementById('status').innerText = "❌ No se encontró ningún chat o está vacío.";
    }
  });
});

function captureWhatsAppChat() {
  const messages = document.querySelectorAll('[role="row"]');
  let chatText = "";
  messages.forEach(msg => {
    const textNode = msg.querySelector('.copyable-text');
    if (textNode) {
      const meta = textNode.getAttribute('data-pre-plain-text') || "";
      const textSpan = textNode.querySelector('span.selectable-text');
      const text = textSpan ? textSpan.innerText : "";
      if (text) {
        chatText += meta + text + "\\n";
      }
    }
  });
  return chatText;
}
`;

    zip.file("manifest.json", JSON.stringify(manifest, null, 2));
    zip.file("popup.html", popupHtml);
    zip.file("popup.js", popupJs);

    const content = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(content);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'whatsapp-capture-extension.zip';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 flex items-center justify-between shadow-sm">
      <div>
        <h3 className="font-semibold text-sm text-[#1A1A1A]">Extensión de Chrome</h3>
        <p className="text-xs text-gray-500 mt-1">Descarga la extensión para capturar chats directamente desde WhatsApp Web.</p>
      </div>
      <button 
        onClick={handleDownload}
        className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-semibold py-2 px-4 rounded-lg transition-colors"
      >
        <Download className="w-4 h-4" />
        Descargar ZIP
      </button>
    </div>
  );
}
