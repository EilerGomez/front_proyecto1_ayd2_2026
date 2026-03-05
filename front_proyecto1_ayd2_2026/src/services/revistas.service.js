import http from "../api/http";

export async function getRevistasByEditorId(editorId) {
  const { data } = await http.get(`/v1/revistas/editor/${editorId}`);
  return data; // RevistaResponse[]
}

export async function getRevistaById(id) {
  const { data } = await http.get(`/v1/revistas/${id}`);
  return data; // RevistaResponse
}

export async function createRevista(payload) {
  // payload: RevistaRequest
  const { data } = await http.post("/v1/revistas", payload);
  return data; // RevistaResponse (revista creada)
}

export async function asignarEtiquetas(payload) {
  // payload: { idRevista, etiquetasIds: [] }
  const { data } = await http.post("/v1/revistas/asignar-etiquetas", payload);
  return data; // "OK"
}
export async function updateRevista(id, payload) {
  const { data } = await http.put(`/v1/revistas/${id}`, payload);
  return data;
}


// ADMIN: listar todas
export async function getRevistasAll() {
  const { data } = await http.get("/v1/revistas");
  return data;
}
export async function changeEstadoRevista(id, estado) {
  const { data } = await http.patch(`/v1/revistas/${id}/estado?estado=${estado}`);
  return data; // RevistaResponse
}

export async function getRevistasActivas() {
  const { data } = await http.get("/v1/revistas/activas");
  console.log(data)
  return data; // RevistaResponse[]
}