// src/services/comprasAnuncio.service.js
import http from "../api/http";

/** Helpers */
function toLocalDateTimeString(dt) {
  // input datetime-local: YYYY-MM-DDTHH:mm
  // Spring LocalDateTime:  YYYY-MM-DDTHH:mm:ss
  if (!dt) return null;
  return dt.length === 16 ? `${dt}:00` : dt;
}

/** POST: comprar anuncio */
export async function comprarAnuncio(payload) {
  const { data } = await http.post("/v1/anuncios/compras", payload);
  return data;
}

/** GET: compras por anunciante */
export async function getComprasByAnuncianteId(anuncianteId) {
  const { data } = await http.get(`/v1/anuncios/compras/anunciante/${anuncianteId}`);
  return data;
}

/** GET: listar compras por estado (ACTIVO, INACTIVO, etc.) */
export async function getComprasByEstado(estado) {
  const { data } = await http.get(`/v1/anuncios/compras/estado/${estado}`);
  return data;
}

/** GET: listar compras desactivadas por (ADMIN, ANUNCIANTE, SISTEMA, etc.) */
export async function getComprasByDesactivadoPor(quien) {
  const { data } = await http.get(`/v1/anuncios/compras/desactivado-por/${quien}`);
  return data;
}

/**
 * PATCH: desactivar compra manualmente
 * PATCH /v1/anuncios/compras/{id}/desactivar?responsable=...&fecha=...
 * fecha debe ir ISO (LocalDateTime): YYYY-MM-DDTHH:mm:ss
 */
export async function desactivarCompra(id, { responsable, fecha }) {
  const fechaISO = toLocalDateTimeString(fecha);
  const { data } = await http.patch(
    `/v1/anuncios/compras/${id}/desactivar`,
    null,
    { params: { responsable, fecha: fechaISO } }
  );
  return data;
}

/**
 * PATCH: cambiar fecha fin
 * PATCH /v1/anuncios/compras/{id}/fecha-fin?fechaFin=YYYY-MM-DDTHH:mm:ss
 */
export async function actualizarFechaFinCompra(id, fechaFinDTLocal) {
  const fechaFin = toLocalDateTimeString(fechaFinDTLocal);
  const { data } = await http.patch(
    `/v1/anuncios/compras/${id}/fecha-fin`,
    null,
    { params: { fechaFin } }
  );
  return data;
}