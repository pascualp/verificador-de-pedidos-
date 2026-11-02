// Lee un importe escrito a mano en la ventanita de «Editar precio»: acepta «18,60» y «18.60».
// parseFloat a secas cortaba en la coma y guardaba 18 € (visto el 02/11/2026).
export const aNumero = (texto: string | null | undefined) => parseFloat(String(texto ?? '').trim().replace(',', '.'));
