import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { CALLES_LLUCMAJOR } from "./_lib/calles-llucmajor.js";

// Lee la foto del ticket / papel escrito a mano de s'Estatua y devuelve teléfono, dirección, importe, nombre
// y el número rojo del talonario (la app lo usa como número del pedido, para unir el papel con el pedido asignado).
// Solo lee: la foto la guarda la app en Firestore (config/ticket_<pedido>), no esta función.
// La clave va en la variable ANTHROPIC_API_KEY de Vercel; sin ella responde 503 "sin_clave" y la app sigue a mano.

// Comparado el 2/11/2026 con 11 fotos reales de la noche del 1/11 (scratchpad comparar_modelos.py):
// Haiku 5.5 acertaba 5-7 de 10 teléfonos; Sonnet 5.5 (esfuerzo low, con las copias giradas) 9 de 10 y no se inventa calles.
// Unos 0,01-0,02 $ por foto.
const MODELO = "claude-sonnet-5-5";
const ESFUERZO = "low";
// En las versiones de prueba (no en producción) se puede pedir otro modelo y esfuerzo, para comparar con fotos reales
const MODELOS_PRUEBA = ["claude-haiku-5-5", "claude-sonnet-5-5", "claude-opus-5-5"];
const ESFUERZOS_PRUEBA = ["low", "medium", "high"];
const TELEFONO_PIZZERIA = "971660088"; // sale impreso en el ticket de caja

const Lectura = z.object({
  telefono: z.string().nullable(),
  direccion: z.string().nullable(),
  piso: z.string().nullable(),
  importe: z.number().nullable(),
  nombre: z.string().nullable(),
  numero: z.string().nullable(),
  dudas: z.string().nullable(),
});

const INSTRUCCIONES = `Esta foto es de un pedido a domicilio de la pizzería s'Estatua, en Llucmajor (Mallorca).
Puede ser la comanda de talonario escrita a mano, el ticket impreso de caja, o los dos juntos en la misma foto
(a menudo el ticket va encima de la comanda y tapa una parte: lee lo que se vea de cada uno).
La foto puede estar de lado o del revés: lee cada papel en la orientación en que se entienda.

OJO con lo que se TRANSPARENTA: el talonario es de papel fino y a veces se ve, flojo y sin tinta, lo que se escribió
en la hoja de encima, que es OTRO pedido. Solo cuenta lo escrito con trazo de bolígrafo en ESTA hoja.

El ticket impreso de caja solo sirve para el PRECIO: el importe es la línea TOTAL (no la BASE ni el IVA).
Ese ticket es de la propia pizzería: lleva el nombre "PIZZERIA S'ESTATUA", SU dirección (Passeig Jaume III nº 2),
SU teléfono (971 660 088), el CIF, el número de factura (FRA), la fecha y la mesa. NADA de eso es del cliente: nunca lo devuelvas como teléfono, dirección ni número.

Cómo escriben la comanda a mano (de ahí salen el teléfono y la dirección del cliente):
- El TELÉFONO del cliente va a menudo EN VERTICAL, de lado, en el margen izquierdo (gira la lectura para leerlo), y otras veces abajo. Un móvil español empieza por 6 o 7.
- La DIRECCIÓN va debajo de los productos: el nombre de la calle abreviado y el número, a menudo sin "Carrer" y con faltas (por ejemplo "Mijorn 12b" es "Migjorn 12B", "Born 33" es "Carrer d'es Born 33"). Al lado o debajo puede llevar el piso o la puerta en pequeño ("1º", "bajos", "1º piso").
- En el centro van los productos (pizzas, bebidas): no son ni la dirección ni el teléfono.
- El número impreso en ROJO abajo a la derecha (unas 7 cifras, por ejemplo 6921815) es el número del talonario: NUNCA es el teléfono, pero sí identifica el pedido.
- Los recuadros de arriba (comensales, mesa, camarero) tampoco son ni el teléfono ni el importe.

Devuelve:
- telefono: el teléfono del cliente, solo las cifras (quita el +34 si lo lleva). Un teléfono español tiene 9 cifras: el móvil empieza por 6 o 7 y el fijo por 9 (971 en Mallorca).
  Lee cifra por cifra y cuéntalas. Cuidado con las cifras escritas a mano que se parecen (1 y 7, 3 y 8, 0 y 6, 2 y 7, 5 y 6) y con dos cifras pegadas (un "10" escrito junto cuenta como dos).
  Si cuentas 8 o 10 cifras, vuelve a mirar el número entero antes de responder; si sigue sin cuadrar, devuelve lo que leas y dilo en "dudas".
  Un número tachado no vale: usa el que no está tachado. null si no hay teléfono.
- direccion: SOLO la calle y el número de la casa (es lo que necesita el GPS para llegar). El piso y la puerta NO van aquí.
  La calle tiene que ser una de la LISTA DE CALLES DE LLUCMAJOR de abajo: escribe su nombre tal como sale en la lista y detrás el número de la casa, por ejemplo "Carrer d'es Born 33" o "Ronda de Migjorn 12B".
  El número de la casa a veces va con "Nº", "n" o "nº" delante ("San Pere Nº 9" es "Carrer de Sant Pere 9").
  Busca en la lista la calle que corresponde a lo escrito ("Union 35" es "Carrer de la Unió 35", "Guillem Terrer 34" es "Carrer de Guillem Terrassa 34", "Vall 139" es "Carrer d'es Vall 139").
  Si lo escrito no se parece claramente a ninguna calle de la lista, devuelve lo escrito tal cual y dilo en "dudas". Si no lleva número de casa, devuelve solo la calle y dilo en "dudas".
  Si la dirección no se lee con seguridad, devuelve null y dilo en "dudas": NUNCA elijas una calle de la lista solo porque se parece un poco,
  porque mandaría al repartidor a otra calle. Los productos (Menor, Perrito, Purgatori, Cola...) no son calles.
  Si ves dos escrituras superpuestas, una de bolígrafo y otra floja marcada sin tinta, la floja es de la hoja de encima (otro pedido): ignórala.
  No añadas ciudad ni código postal: todas las entregas son en Llucmajor. null si no hay dirección.
  OJO con la dirección: sale SOLO de lo escrito a mano en la comanda. Si el ticket u otra cosa tapa una parte, NO completes ni adivines lo tapado: devuelve solo lo que se ve y escribe en "dudas" que la dirección está tapada o incompleta.
- piso: el piso, la puerta o la escalera si lo escriben (suele ir pequeño al lado o encima del número de la casa, como "2h", "3º B" o "bajos"), tal como se lee. No lo confundas con el número de la casa. null si no hay.
- importe: el total a cobrar, en euros, como número (por ejemplo 17.05), solo si sale claro en un ticket impreso o escrito como total. null si no.
- nombre: el nombre del cliente si está escrito. null si no.
- numero: el número rojo impreso del talonario de la comanda, solo las cifras. Si alguna cifra está tapada o no se lee segura, devuelve lo que leas y dilo en "dudas". null si en la foto no sale la comanda o no se ve ese número.
- dudas: una frase corta con lo que no estés seguro de haber leído bien (una cifra, la calle, el piso). null si todo está claro.

No inventes nada: si no se puede leer un dato, pon null en ese dato.

LISTA DE CALLES DE LLUCMAJOR:
${CALLES_LLUCMAJOR.join("\n")}`;

type TipoImagen = "image/jpeg" | "image/png" | "image/webp";

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") return res.status(405).json({ error: "Usa POST" });
  if (!process.env.ANTHROPIC_API_KEY) return res.status(503).json({ error: "sin_clave" });

  // La app manda la foto y, detrás, la misma girada a cada lado (imagenes); las versiones viejas mandaban solo "imagen".
  const recibidas: string[] = Array.isArray(req.body?.imagenes) ? req.body.imagenes.slice(0, 3) : [req.body?.imagen || ""];
  const fotos = recibidas.map((x) => /^data:(image\/(?:jpeg|png|webp));base64,(.+)$/.exec(String(x)));
  if (!fotos.length || fotos.some((f) => !f)) return res.status(400).json({ error: "Falta la foto" });
  if (fotos.reduce((n, f) => n + f![2].length, 0) > 4_000_000) return res.status(413).json({ error: "La foto es demasiado grande" });
  const prueba = process.env.VERCEL_ENV !== "production";
  const modelo = prueba && MODELOS_PRUEBA.includes(req.body?.modelo) ? req.body.modelo : MODELO;
  const esfuerzo = prueba && ESFUERZOS_PRUEBA.includes(req.body?.esfuerzo) ? req.body.esfuerzo : ESFUERZO;
  if (prueba && req.body?.giradas === false) fotos.splice(1); // para comparar: solo la foto, sin las copias giradas
  const nota = fotos.length > 1
    ? `\n\nLa imagen 1 es la foto. Las siguientes son LA MISMA foto girada 90° a cada lado, para leer de frente lo escrito en vertical (el teléfono del margen): usa la que se lea mejor.`
    : "";

  try {
    // 8/11/2026: tiempo máximo y un solo reintento, para que si la API va lenta o se queda sin saldo la app reciba
    // un error claro enseguida (y siga funcionando con los datos a mano) en vez de quedarse esperando.
    const client = new Anthropic({ timeout: 40_000, maxRetries: 1 });
    const respuesta = await client.messages.parse({
      model: modelo,
      max_tokens: 8000,
      output_config: { effort: esfuerzo, format: zodOutputFormat(Lectura) },
      // Las instrucciones y la lista de calles son siempre iguales: se guardan en la caché de la API y salen más baratas
      system: [{ type: "text", text: INSTRUCCIONES, cache_control: { type: "ephemeral" } }],
      messages: [
        {
          role: "user",
          content: [
            ...fotos.map((f) => ({ type: "image" as const, source: { type: "base64" as const, media_type: f![1] as TipoImagen, data: f![2] } })),
            { type: "text", text: "Lee esta foto." + nota },
          ],
        },
      ],
    });
    if (respuesta.stop_reason === "refusal" || !respuesta.parsed_output) {
      return res.status(422).json({ error: "No se pudo leer la foto" });
    }
    const lectura = { ...respuesta.parsed_output };
    lectura.numero = lectura.numero?.replace(/\D/g, "") || null; // el número del talonario va solo con cifras
    // Freno: el teléfono impreso en el ticket es el de la pizzería, nunca el del cliente
    if (lectura.telefono && lectura.telefono.replace(/\D/g, "").endsWith(TELEFONO_PIZZERIA)) {
      lectura.telefono = null;
      lectura.dudas = [lectura.dudas, "el único teléfono que se ve es el de la pizzería (971 660 088): falta el del cliente"].filter(Boolean).join("; ");
    }
    // Igual con la dirección impresa de la pizzería (Passeig Jaume III nº 2)
    if (lectura.direccion && /jaume\s*(iii|3)\b/i.test(lectura.direccion)) {
      lectura.direccion = null;
      lectura.dudas = [lectura.dudas, "la única dirección que se ve es la de la pizzería: falta la del cliente"].filter(Boolean).join("; ");
    }
    // En las pruebas se devuelve también el modelo y el gasto, para comparar
    return res.status(200).json(prueba ? { ...lectura, _modelo: modelo, _esfuerzo: esfuerzo, _uso: respuesta.usage } : lectura);
  } catch (e) {
    if (e instanceof Anthropic.AuthenticationError) return res.status(503).json({ error: "sin_clave" });
    if (e instanceof Anthropic.APIConnectionTimeoutError) return res.status(504).json({ error: "La IA tardó demasiado: escribe los datos a mano" });
    if (e instanceof Anthropic.RateLimitError) return res.status(429).json({ error: "Demasiadas fotos seguidas: espera unos segundos" });
    if (e instanceof Anthropic.APIError) return res.status(502).json({ error: `La IA no respondió (${e.status})` });
    console.error("leer-ticket:", e);
    return res.status(500).json({ error: "Error leyendo la foto" });
  }
}
