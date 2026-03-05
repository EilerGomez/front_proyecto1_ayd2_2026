import http from "../api/http";

// Listar todos los periodos
export async function getPeriodos() {
  const { data } = await http.get("/v1/anuncios/periodos");
  return data;
}

// Obtener periodo por id
export async function getPeriodoById(id) {
  const { data } = await http.get(`/v1/anuncios/periodos/${id}`);
  return data;
}

// Obtener por código
export async function getPeriodoByCodigo(codigo) {
  const { data } = await http.get(`/v1/anuncios/periodos/codigo/${codigo}`);
  return data;
}