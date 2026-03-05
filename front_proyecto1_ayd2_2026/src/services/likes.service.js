import http from "../api/http";

// GET /v1/likes/revista/{revistaId}
export async function getLikesByRevistaId(revistaId) {
  const { data } = await http.get(`/v1/likes/revista/${revistaId}`);
  return data; // LikeResponse[]
}

// GET /v1/likes/revista/{revistaId}/usuario/{usuarioId}/existe
export async function existsLike(revistaId, usuarioId) {
  const { data } = await http.get(`/v1/likes/revista/${revistaId}/usuario/${usuarioId}/existe`);
  return !!data; // boolean
}

// POST /v1/likes
export async function darLike(payload) {
  // payload: { revistaId, usuarioId }
  const { data } = await http.post(`/v1/likes`, payload);
  return data; // LikeResponse
}

// DELETE /v1/likes/revista/{revistaId}/usuario/{usuarioId}
export async function quitarLike(revistaId, usuarioId) {
  const { data } = await http.delete(`/v1/likes/revista/${revistaId}/usuario/${usuarioId}`);
  return data; // void
}