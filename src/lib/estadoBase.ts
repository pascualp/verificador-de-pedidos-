import config from '../../firebase-applet-config.json';

// Cuando la base de datos gratuita agota sus lecturas del día, Firebase no avisa: los listeners se quedan
// reintentando y la app parece colgada. Esta comprobación pregunta directamente por la API REST:
// una lectura (o nada, si está bloqueada: una petición rechazada no gasta cuota).
export type EstadoBase = 'ok' | 'cuota' | 'otro';

export async function comprobarBase(): Promise<EstadoBase> {
  const url = `https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/${config.firestoreDatabaseId}/documents/config/general?key=${config.apiKey}`;
  try {
    const r = await fetch(url, { cache: 'no-store' });
    if (r.ok || r.status === 404) return 'ok';
    const texto = await r.text();
    return r.status === 429 && /quota/i.test(texto) ? 'cuota' : 'otro';
  } catch {
    return 'otro'; // sin conexión
  }
}
