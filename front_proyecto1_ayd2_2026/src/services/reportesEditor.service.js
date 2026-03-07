import http from "../api/http";

// GET /v1/reportes-editor/comentarios/{editorId}?revistaId=...&inicio=...&fin=...
export async function getReporteComentariosEditor(editorId, params = {}) {
  const { revistaId, inicio, fin } = params;

  const queryParams = {};
  if (revistaId !== undefined && revistaId !== null && revistaId !== "") {
    queryParams.revistaId = revistaId;
  }
  if (inicio) queryParams.inicio = inicio;
  if (fin) queryParams.fin = fin;

  const { data } = await http.get(`/v1/reportes-editor/comentarios/${editorId}`, {
    params: queryParams,
  });

  return data;
}

// GET /v1/reportes-editor/suscripciones/{editorId}?revistaId=...&inicio=...&fin=...
export async function getReporteSuscripcionesEditor(editorId, params = {}) {
  const { revistaId, inicio, fin } = params;

  const queryParams = {};
  if (revistaId !== undefined && revistaId !== null && revistaId !== "") {
    queryParams.revistaId = revistaId;
  }
  if (inicio) queryParams.inicio = inicio;
  if (fin) queryParams.fin = fin;

  const { data } = await http.get(`/v1/reportes-editor/suscripciones/${editorId}`, {
    params: queryParams,
  });

  return data;
}

// GET /v1/reportes-editor/likes-top/{editorId}?revistaId=...&inicio=...&fin=...
export async function getReporteLikesTopEditor(editorId, params = {}) {
  const { revistaId, inicio, fin } = params;

  const queryParams = {};
  if (revistaId !== undefined && revistaId !== null && revistaId !== "") {
    queryParams.revistaId = revistaId;
  }
  if (inicio) queryParams.inicio = inicio;
  if (fin) queryParams.fin = fin;

  const { data } = await http.get(`/v1/reportes-editor/likes-top/${editorId}`, {
    params: queryParams,
  });

  return data;
}

// GET /v1/reportes-editor/pagos/{editorId}?revistaId=...&inicio=...&fin=...
export async function getReportePagosEditor(editorId, params = {}) {
  const { revistaId, inicio, fin } = params;

  const queryParams = {};
  if (revistaId !== undefined && revistaId !== null && revistaId !== "") {
    queryParams.revistaId = revistaId;
  }
  if (inicio) queryParams.inicio = inicio;
  if (fin) queryParams.fin = fin;

  const { data } = await http.get(`/v1/reportes-editor/pagos/${editorId}`, {
    params: queryParams,
  });

  return data;
}