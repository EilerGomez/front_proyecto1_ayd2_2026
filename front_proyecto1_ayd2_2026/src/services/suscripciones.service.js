import http from "../api/http";

// POST /v1/suscripciones
export async function suscribirse(payload) {
  // payload: { revistaId, usuarioId, fechaSuscripcion, activa }
  const { data } = await http.post(`/v1/suscripciones`, payload);
  return data; // SuscricpionResponseByRevistaId
}

// GET /v1/suscripciones/usuario/{usuarioId}
export async function getSuscripcionesByUsuarioId(usuarioId) {
  const { data } = await http.get(`/v1/suscripciones/usuario/${usuarioId}`);
  return data; // dtoRevistasPorSuscripcionByUsuarioResponse[]
}

// GET /v1/suscripciones/revista/{revistaId}
export async function getSuscripcionesByRevistaId(revistaId) {
  const { data } = await http.get(`/v1/suscripciones/revista/${revistaId}`);
  return data; // SuscricpionResponseByRevistaId[]
}

// DELETE /v1/suscripciones/{id}
export async function cancelarSuscripcion(id) {
  const { data } = await http.delete(`/v1/suscripciones/${id}`);
  return data; // void
}