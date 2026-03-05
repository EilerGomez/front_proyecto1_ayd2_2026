// src/services/impresionesAnuncios.service.js
import http from "../api/http";

// POST /v1/anuncios/impresiones/registrar
export async function registrarImpresion(payload) {
  // payload: { anuncioId, revistaId, urlPagina }
  const { data } = await http.post("/v1/anuncios/impresiones/registrar", payload);
  return data; // el backend devuelve void -> normalmente data será undefined
}

// GET /v1/anuncios/impresiones/total-vistas/{anuncioId}
export async function getTotalVistasByAnuncioId(anuncioId) {
  const { data } = await http.get(`/v1/anuncios/impresiones/total-vistas/${anuncioId}`);
  return data; // Long
}

// GET /v1/anuncios/impresiones/revista/{revistaId}
export async function getImpresionesByRevistaId(revistaId) {
  const { data } = await http.get(`/v1/anuncios/impresiones/revista/${revistaId}`);
  return data; // List<ImpresionAnuncioResponse>
}