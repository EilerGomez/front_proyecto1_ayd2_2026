import http from "../api/http";

export async function getPerfilByUsuarioId(usuarioId) {
  const { data } = await http.get(`/v1/perfiles/usuario/${usuarioId}`);
  return data;
}

export async function updatePerfilByUsuarioId(usuarioId, payload) {
  const { data } = await http.put(`/v1/perfiles/usuario/${usuarioId}`, payload);
  return data;
}