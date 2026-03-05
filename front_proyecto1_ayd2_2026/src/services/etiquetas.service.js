import http from "../api/http";

export async function getEtiquetas() {
  const { data } = await http.get("/v1/etiquetas");
  return data; // [{id,nombre}]
}



export async function getEtiquetaById(id) {
  const { data } = await http.get(`/v1/etiquetas/${id}`);
  return data;
}

export async function createEtiqueta(payload) {
  // payload: { nombre }
  const { data } = await http.post("/v1/etiquetas", payload);
  return data;
}

export async function updateEtiqueta(id, payload) {
  // payload: { nombre }
  const { data } = await http.put(`/v1/etiquetas/${id}`, payload);
  return data;
}

export async function deleteEtiqueta(id) {
  await http.delete(`/v1/etiquetas/${id}`);
  return true;
}