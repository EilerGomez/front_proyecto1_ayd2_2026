import http from "../api/http";

// GET /v1/costo-global
export async function getCostoGlobal() {
  const { data } = await http.get("/v1/costo-global");
  return data; // { id, monto }
}

// PUT /v1/costo-global  (ADMIN)
export async function updateCostoGlobal(payload) {
  const { data } = await http.put("/v1/costo-global", payload);
  return data; // { id, monto }
}