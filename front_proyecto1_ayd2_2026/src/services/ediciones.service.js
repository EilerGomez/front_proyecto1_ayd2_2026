import http from "../api/http";

export async function getEdicionesByRevistaId(revistaId) {
  const { data } = await http.get(`/v1/ediciones/revista/${revistaId}`);
  return data; // EdicionResponse[]
}

export async function createEdicion(payload) {
  // OJO: tu EdicionRequest no lo pegaste, ajustá nombres si cambia
  // Ejemplo típico: { revistaId, numeroEdicion, titulo, pdfUrl, fechaPublicacion }
  const { data } = await http.post("/v1/ediciones", payload);
  return data;
}

export async function deleteEdicion(id) {
  await http.delete(`/v1/ediciones/${id}`);
}