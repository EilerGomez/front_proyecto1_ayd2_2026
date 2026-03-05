import http from "../api/http";

// Crear nuevo precio
export async function createPrecioAnuncio(payload) {
  const { data } = await http.post("/v1/anuncios/precios", payload);
  return data;
}

// Listar todos
export async function getPreciosAnuncio() {
  const { data } = await http.get("/v1/anuncios/precios");
  return data;
}

// Obtener por ID
export async function getPrecioAnuncioById(id) {
  const { data } = await http.get(`/v1/anuncios/precios/${id}`);
  return data;
}

// Desactivar precio
export async function desactivarPrecioAnuncio(id) {
  await http.patch(`/v1/anuncios/precios/${id}/desactivar`);
  return true;
}

// Obtener precios por tipo de anuncio
export async function getPreciosPorTipo(tipoAnuncioId) {
  const { data } = await http.get(
    `/v1/anuncios/precios/tipo/${tipoAnuncioId}`
  );
  return data;
}