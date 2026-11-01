import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";

// Lee la foto del ticket / papel escrito a mano de s'Estatua y devuelve teléfono, dirección, importe, nombre
// y el número rojo del talonario (la app lo usa como número del pedido, para unir el papel con el pedido asignado).
// Solo lee: la foto la guarda la app en Firestore (config/ticket_<pedido>), no esta función.
// La clave va en la variable ANTHROPIC_API_KEY de Vercel; sin ella responde 503 "sin_clave" y la app sigue a mano.

const MODELO = "claude-haiku-5-5"; // el barato; si lee mal la letra a mano, subir a claude-sonnet-5-5
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

El ticket impreso de caja solo sirve para el PRECIO: el importe es la línea TOTAL (no la BASE ni el IVA).
Ese ticket es de la propia pizzería: lleva el nombre "PIZZERIA S'ESTATUA", SU dirección (Passeig Jaume III nº 2),
SU teléfono (971 660 088), el CIF, el número de factura (FRA), la fecha y la mesa. NADA de eso es del cliente: nunca lo devuelvas como teléfono, dirección ni número.

Cómo escriben la comanda a mano (de ahí salen el teléfono y la dirección del cliente):
- El TELÉFONO del cliente va a menudo EN VERTICAL, de lado, en el margen izquierdo (gira la lectura para leerlo), y otras veces abajo. Un móvil español empieza por 6 o 7.
- La DIRECCIÓN va abajo, en el último recuadro: solo el nombre de la calle y el número, a menudo sin "Carrer" y con faltas (por ejemplo "Mijorn 12b" es "Migjorn 12B"). Al lado puede llevar el piso o la puerta en pequeño.
- En el centro van los productos (pizzas, bebidas): no son ni la dirección ni el teléfono.
- El número impreso en ROJO abajo a la derecha (unas 7 cifras, por ejemplo 6921815) es el número del talonario: NUNCA es el teléfono, pero sí identifica el pedido.
- Los recuadros de arriba (comensales, mesa, camarero) tampoco son ni el teléfono ni el importe.

Devuelve:
- telefono: el teléfono del cliente, solo las cifras (quita el +34 si lo lleva). Si lees menos o más de 9 cifras, devuelve lo que leas y explícalo en "dudas". null si no hay teléfono.
- direccion: SOLO la calle y el número de la casa, por ejemplo "Migjorn 12B" (es lo que necesita el GPS para llegar). El piso y la puerta NO van aquí. Corrige solo la ortografía evidente del nombre de la calle (en catalán o castellano, como se llama en Llucmajor) y no añadas ciudad ni código postal: todas las entregas son en Llucmajor. null si no hay dirección.
  OJO con la dirección: sale SOLO de lo escrito a mano en la comanda. Si el ticket u otra cosa tapa una parte, NO completes ni adivines lo tapado: devuelve solo lo que se ve y escribe en "dudas" que la dirección está tapada o incompleta.
- piso: el piso, la puerta o la escalera si lo escriben (suele ir pequeño al lado o encima del número de la casa, como "2h", "3º B" o "bajos"), tal como se lee. No lo confundas con el número de la casa. null si no hay.
- importe: el total a cobrar, en euros, como número (por ejemplo 17.05), solo si sale claro en un ticket impreso o escrito como total. null si no.
- nombre: el nombre del cliente si está escrito. null si no.
- numero: el número rojo impreso del talonario de la comanda, solo las cifras. Si alguna cifra está tapada o no se lee segura, devuelve lo que leas y dilo en "dudas". null si en la foto no sale la comanda o no se ve ese número.
- dudas: una frase corta con lo que no estés seguro de haber leído bien (una cifra, la calle, el piso). null si todo está claro.

No inventes nada: si no se puede leer un dato, pon null en ese dato.`;

type TipoImagen = "image/jpeg" | "image/png" | "image/webp";

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") return res.status(405).json({ error: "Usa POST" });
  if (!process.env.ANTHROPIC_API_KEY) return res.status(503).json({ error: "sin_clave" });

  // La app manda la foto y, detrás, la misma girada a cada lado (imagenes); las versiones viejas mandaban solo "imagen".
  const recibidas: string[] = Array.isArray(req.body?.imagenes) ? req.body.imagenes.slice(0, 3) : [req.body?.imagen || ""];
  const fotos = recibidas.map((x) => /^data:(image\/(?:jpeg|png|webp));base64,(.+)$/.exec(String(x)));
  if (!fotos.length || fotos.some((f) => !f)) return res.status(400).json({ error: "Falta la foto" });
  if (fotos.reduce((n, f) => n + f![2].length, 0) > 4_000_000) return res.status(413).json({ error: "La foto es demasiado grande" });
  const nota = fotos.length > 1
    ? `\n\nLa imagen 1 es la foto. Las siguientes son LA MISMA foto girada 90° a cada lado, para leer de frente lo escrito en vertical (el teléfono del margen): usa la que se lea mejor.`
    : "";

  try {
    const client = new Anthropic();
    const respuesta = await client.messages.parse({
      model: MODELO,
      max_tokens: 4000,
      output_config: { effort: "low", format: zodOutputFormat(Lectura) },
      messages: [
        {
          role: "user",
          content: [
            ...fotos.map((f) => ({ type: "image" as const, source: { type: "base64" as const, media_type: f![1] as TipoImagen, data: f![2] } })),
            { type: "text", text: INSTRUCCIONES + nota },
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
    return res.status(200).json(lectura);
  } catch (e) {
    if (e instanceof Anthropic.AuthenticationError) return res.status(503).json({ error: "sin_clave" });
    if (e instanceof Anthropic.RateLimitError) return res.status(429).json({ error: "Demasiadas fotos seguidas: espera unos segundos" });
    if (e instanceof Anthropic.APIError) return res.status(502).json({ error: `La IA no respondió (${e.status})` });
    console.error("leer-ticket:", e);
    return res.status(500).json({ error: "Error leyendo la foto" });
  }
}
