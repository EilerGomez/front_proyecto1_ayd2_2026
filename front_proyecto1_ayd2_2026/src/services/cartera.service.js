import http from "../api/http";

/**
 * GET /v1/carteras/usuario/{usuarioId}
 */
export async function getCarteraByUsuarioId(usuarioId) {
  const { data } = await http.get(`/v1/carteras/usuario/${usuarioId}`);
  return data; // {id, usuarioId, saldo, moneda, fechaCreacion}
}

/**
 * POST /v1/carteras/recargar
 * body: { usuarioId, monto }
 */
export async function recargarCartera(usuarioId, monto) {
  const { data } = await http.post(`/v1/carteras/recargar`, {
    usuarioId,
    monto: Number(monto),
  });
  return data;
}