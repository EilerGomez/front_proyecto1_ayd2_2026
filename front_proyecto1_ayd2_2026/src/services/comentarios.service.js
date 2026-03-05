import http from "../api/http";

// GET /v1/comentarios/revista/{revistaId}
export async function getComentariosByRevistaId(revistaId) {
  const { data } = await http.get(`/v1/comentarios/revista/${revistaId}`);
  return data; // ComentarioResponse[]
}

// POST /v1/comentarios
export async function createComentario(payload) {
  // payload: { revistaId, usuarioId, contenido }
  const { data } = await http.post(`/v1/comentarios`, payload);
  return data; // ComentarioResponse
}

// DELETE /v1/comentarios/{id}
export async function deleteComentario(id) {
  const { data } = await http.delete(`/v1/comentarios/${id}`);
  return data; // void
}