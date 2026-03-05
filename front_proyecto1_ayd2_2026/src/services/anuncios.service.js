import http from "../api/http";

// CRUD anuncios
export async function createAnuncio(payload) {
  const { data } = await http.post("/v1/anuncios", payload);
  return data;
}

export async function getAnuncioById(id) {
  const { data } = await http.get(`/v1/anuncios/${id}`);
  return data;
}

export async function getAnunciosByAnuncianteId(anuncianteId) {
  const { data } = await http.get(`/v1/anuncios/anunciante/${anuncianteId}`);
  return data;
}

export async function getAnunciosByEstado(estado) {
  const { data } = await http.get(`/v1/anuncios/estado/${estado}`);
  return data;
}

export async function changeEstadoAnuncio(id, nuevoEstado) {
  await http.patch(`/v1/anuncios/${id}/estado`, null, {
    params: { nuevoEstado },
  });
  return true;
}

export async function updateAnuncio(id, payload) {
  const { data } = await http.put(`/v1/anuncios/${id}`, payload);
  return data;
}


export async function getAnunciosParaRevista(revistaId) {
  const { data } = await http.get(`/v1/anuncios/para-revista/${revistaId}`);
  return data;
}