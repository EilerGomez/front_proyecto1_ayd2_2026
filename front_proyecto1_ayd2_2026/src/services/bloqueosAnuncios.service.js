// src/services/bloqueosAnuncios.service.js
import http from "../api/http";

// POST /v1/anuncios/bloqueos/contratar
export async function contratarBloqueo(payload) {
  const { data } = await http.post("/v1/anuncios/bloqueos/contratar", payload);
  return data;
}

// GET /v1/anuncios/bloqueos/activo/revista/{revistaId}
export async function getBloqueoActivoByRevistaId(revistaId) {
  const { data } = await http.get(`/v1/anuncios/bloqueos/activo/revista/${revistaId}`);
  return data;
}

// GET /v1/anuncios/bloqueos/historial/revista/{revistaId}
export async function getHistorialBloqueosByRevistaId(revistaId) {
  const { data } = await http.get(`/v1/anuncios/bloqueos/historial/revista/${revistaId}`);
  return data;
}
// PATCH /v1/anuncios/bloqueos/{id}/fecha-fin?fechaFin=...
export async function actualizarFechaFinBloqueo(id, fechaFin) {
  const { data } = await http.patch(`/v1/anuncios/bloqueos/${id}/fecha-fin`, null, {
    params: { fechaFin },
  });
  return data;
}