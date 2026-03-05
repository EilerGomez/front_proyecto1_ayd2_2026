import http from "../api/http";

export async function getTiposAnuncio() {
  const { data } = await http.get("/v1/anuncios/tipos");
  return data; // [{id,codigo,descripcion}]
}

export async function getTipoAnuncioById(id) {
  const { data } = await http.get(`/v1/anuncios/tipos/${id}`);
  return data;
}

export async function getTipoAnuncioByCodigo(codigo) {
  const { data } = await http.get(`/v1/anuncios/tipos/codigo/${codigo}`);
  return data;
}