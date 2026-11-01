import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";

// Lee la foto del ticket / papel escrito a mano de s'Estatua y devuelve teléfono, dirección, importe y nombre.
// Solo lee: la foto la guarda la app en Firestore (config/ticket_<pedido>), no esta función.
// La clave va en la variable ANTHROPIC_API_KEY de Vercel; sin ella responde 503 "sin_clave" y la app sigue a mano.

const MODELO = "claude-haiku-5-5"; // el barato; si lee mal la letra a mano, subir a claude-sonnet-5-5

const Lectura = z.object({
  telefono: z.string().nullable(),
  direccion: z.string().nullable(),
  importe: z.number().nullable(),
  nombre: z.string().nullable(),
  dudas: z.string().nullable(),
});

const INSTRUCCIONES = `Esta foto es de un pedido a domicilio de la pizzería s'Estatua, en Llucmajor (Mallorca).
Suele ser una comanda de talonario escrita a mano, a veces junto a un ticket impreso de caja.

Cómo la escriben:
- El TELÉFONO del cliente va casi siempre escrito EN VERTICAL, de lado, en el margen izquierdo. Gira la lectura para leerlo.
- La DIRECCIÓN va abajo, en el último recuadro: solo el nombre de la calle y el número, a menudo sin "Carrer" y con faltas (por ejemplo "Mijorn 12b" es "Migjorn 12B"). Al lado puede llevar el piso o la puerta en pequeño.
- En el centro van los productos (pizzas, bebidas): no son ni la dirección ni el teléfono.
- El número impreso en ROJO abajo a la derecha es el número del talonario: NUNCA es el teléfono.
- Los recuadros de arriba (comensales, mesa, camarero) tampoco son ni el teléfono ni el importe.

Devuelve:
- telefono: el teléfono del cliente, solo las cifras (quita el +34 si lo lleva). Si lees menos o más de 9 cifras, devuelve lo que leas y explícalo en "dudas". null si no hay teléfono.
- direccion: la calle con el número y el piso o puerta si los hay. Corrige solo la ortografía evidente del nombre de la calle (en catalán o castellano, como se llama en Llucmajor) y no añadas ciudad ni código postal: todas las entregas son en Llucmajor. null si no hay dirección.
- importe: el total a cobrar, en euros, como número (por ejemplo 17.05), solo si sale claro en un ticket impreso o escrito como total. null si no.
- nombre: el nombre del cliente si está escrito. null si no.
- dudas: una frase corta con lo que no estés seguro de haber leído bien (una cifra, la calle, el piso). null si todo está claro.

No inventes nada: si no se puede leer un dato, pon null en ese dato.`;

type TipoImagen = "image/jpeg" | "image/png" | "image/webp";

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") return res.status(405).json({ error: "Usa POST" });
  if (!process.env.ANTHROPIC_API_KEY) return res.status(503).json({ error: "sin_clave" });

  const imagen: string = req.body?.imagen || "";
  const partes = /^data:(image\/(?:jpeg|png|webp));base64,(.+)$/.exec(imagen);
  if (!partes) return res.status(400).json({ error: "Falta la foto" });
  if (partes[2].length > 4_000_000) return res.status(413).json({ error: "La foto es demasiado grande" });

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
            { type: "image", source: { type: "base64", media_type: partes[1] as TipoImagen, data: partes[2] } },
            { type: "text", text: INSTRUCCIONES },
          ],
        },
      ],
    });
    if (respuesta.stop_reason === "refusal" || !respuesta.parsed_output) {
      return res.status(422).json({ error: "No se pudo leer la foto" });
    }
    return res.status(200).json(respuesta.parsed_output);
  } catch (e) {
    if (e instanceof Anthropic.AuthenticationError) return res.status(503).json({ error: "sin_clave" });
    if (e instanceof Anthropic.RateLimitError) return res.status(429).json({ error: "Demasiadas fotos seguidas: espera unos segundos" });
    if (e instanceof Anthropic.APIError) return res.status(502).json({ error: `La IA no respondió (${e.status})` });
    console.error("leer-ticket:", e);
    return res.status(500).json({ error: "Error leyendo la foto" });
  }
}
