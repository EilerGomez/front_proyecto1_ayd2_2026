import http from "../api/http";
//ESTE ES DEL EDITOR
// GET: pagos por revista
export async function getPagosByRevistaId(revistaId) {
  const { data } = await http.get(`/v1/pagos-revista/revista/${revistaId}`);
  return data; // PagoRevistaResponse[]
}

// GET: pagos por editor (todas sus revistas)
export async function getPagosByEditorId(editorId) {
  const { data } = await http.get(`/v1/pagos-revista/editor/${editorId}`);
  return data; // PagoRevistaResponse[]
}

// POST: procesar pago (requiere carteraId como query param)
export async function procesarPagoRevista(payload, carteraId) {
  // payload: PagoRevistaRequest { revistaId, editorId, monto, periodoInicio, periodoFin }
  const { data } = await http.post(`/v1/pagos-revista/procesar?carteraId=${carteraId}`, payload);
  return data; // PagoRevistaResponse
}

// PATCH: actualizar fecha fin de un pago
export async function updatePagoRevistaFechaFin(pagoId, fechaFin) {
  // fechaFin: "YYYY-MM-DD"
  const { data } = await http.patch(`/v1/pagos-revista/${pagoId}/fecha-fin`, null, {
    params: { fechaFin },
  });
  return data; // PagoRevistaResponse
}