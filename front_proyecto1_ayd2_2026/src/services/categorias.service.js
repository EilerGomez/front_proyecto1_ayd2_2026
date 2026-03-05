import http from "../api/http";

export async function getCategorias() {
  const { data } = await http.get("/v1/categorias");
  return data; // [{id,nombre,descripcion}]
}


export async function getCategoriaById(id) {
  const { data } = await http.get(`/v1/categorias/${id}`);
  return data;
}

export async function createCategoria(payload) {
  // payload: { nombre, descripcion }
  const { data } = await http.post("/v1/categorias", payload);
  return data;
}

export async function updateCategoria(id, payload) {
  // payload: { nombre, descripcion }
  const { data } = await http.put(`/v1/categorias/${id}`, payload);
  return data;
}

export async function deleteCategoria(id) {
  await http.delete(`/v1/categorias/${id}`);
  return true;
}