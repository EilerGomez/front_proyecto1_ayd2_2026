// src/services/precioBloqueo.service.js
import http from "../api/http";

// GET /v1/anuncios/precios-bloqueo/revista/{revistaId}
export async function getPrecioBloqueoByRevistaId(revistaId) {
  const { data } = await http.get(`/v1/anuncios/precios-bloqueo/revista/${revistaId}`);
  return data;
}

// POST /v1/anuncios/precios-bloqueo  (ADMIN)
// body: { revistaId, costoPorDia, adminId }
export async function upsertPrecioBloqueo(payload) {
  const { data } = await http.post(`/v1/anuncios/precios-bloqueo`, payload);
  return data;
}

// DELETE /v1/anuncios/precios-bloqueo/{id}  (ADMIN)
export async function deletePrecioBloqueo(id) {
  await http.delete(`/v1/anuncios/precios-bloqueo/${id}`);
  return true;
}