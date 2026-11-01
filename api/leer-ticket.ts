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
});

const INSTRUCCIONES = `Esta foto es de un pedido a domicilio de la pizzería s'Estatua, en Llucmajor (Mallorca).
Puede salir un ticket impreso con el importe y/o un papel escrito a mano con la dirección y el teléfono del cliente.

Devuelve:
- telefono: el teléfono del cliente, solo las cifras (en España son 9; quita el +34 si lo lleva). null si no se lee con seguridad.
- direccion: la dirección tal como está escrita (calle, número, piso, puerta, urbanización). No añadas ciudad ni código postal: todas las entregas son en Llucmajor. null si no hay dirección.
- importe: el total a cobrar del ticket impreso, en euros, como número (por ejemplo 17.05). null si no aparece.
- nombre: el nombre del cliente si está escrito. null si no.

No inventes nada: si dudas de una cifra o de una palabra, pon null en ese dato.`;

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
