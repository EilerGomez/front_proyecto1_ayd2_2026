import http from "../api/http";
//ESTE ES DEL ADMINISTRADOR
// POST /v1/costos-revista
export async function createCostoDiario(payload) {
  const { data } = await http.post("/v1/costos-revista", payload);
  return data;
}

// GET /v1/costos-revista/vigente/{revistaId}
export async function getCostoVigente(revistaId) {
  const { data } = await http.get(`/v1/costos-revista/vigente/${revistaId}`);
  return data;
}

// GET /v1/costos-revista/historial/{revistaId}
export async function getHistorialCostos(revistaId) {
  const { data } = await http.get(`/v1/costos-revista/historial/${revistaId}`);
  return data;
}