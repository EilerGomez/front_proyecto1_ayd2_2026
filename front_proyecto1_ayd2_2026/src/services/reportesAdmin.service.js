import http from "../api/http";

// GET /v1/reportes-admin/ganancias?inicio=...&fin=...
export async function getReporteGanancias(params = {}) {
  const { inicio, fin } = params;

  const queryParams = {};
  if (inicio) queryParams.inicio = inicio;
  if (fin) queryParams.fin = fin;

  const { data } = await http.get("/v1/reportes-admin/ganancias", {
    params: queryParams,
  });

  return data;
}

// GET /v1/reportes-admin/anuncios-comprados?tipo=...&inicio=...&fin=...
export async function getReporteAnunciosComprados(params = {}) {
  const { tipo, inicio, fin } = params;

  const queryParams = {};
  if (tipo) queryParams.tipo = tipo;
  if (inicio) queryParams.inicio = inicio;
  if (fin) queryParams.fin = fin;

  const { data } = await http.get("/v1/reportes-admin/anuncios-comprados", {
    params: queryParams,
  });

  return data;
}

// GET /v1/reportes-admin/ganancias-anunciantes?anuncianteId=...&inicio=...&fin=...
export async function getReporteGananciasAnunciantes(params = {}) {
  const { anuncianteId, inicio, fin } = params;

  const queryParams = {};
  if (anuncianteId !== undefined && anuncianteId !== null && anuncianteId !== "") {
    queryParams.anuncianteId = anuncianteId;
  }
  if (inicio) queryParams.inicio = inicio;
  if (fin) queryParams.fin = fin;

  const { data } = await http.get("/v1/reportes-admin/ganancias-anunciantes", {
    params: queryParams,
  });

  return data;
}

// GET /v1/reportes-admin/top-revistas?inicio=...&fin=...
export async function getReporteTopRevistas(params = {}) {
  const { inicio, fin } = params;

  const queryParams = {};
  if (inicio) queryParams.inicio = inicio;
  if (fin) queryParams.fin = fin;

  const { data } = await http.get("/v1/reportes-admin/top-revistas", {
    params: queryParams,
  });

  return data;
}

// GET /v1/reportes-admin/top-comentadas?inicio=...&fin=...
export async function getReporteTopComentadas(params = {}) {
  const { inicio, fin } = params;

  const queryParams = {};
  if (inicio) queryParams.inicio = inicio;
  if (fin) queryParams.fin = fin;

  const { data } = await http.get("/v1/reportes-admin/top-comentadas", {
    params: queryParams,
  });

  return data;
}

// GET /v1/reportes-admin/efectividad-anuncios?inicio=...&fin=...
export async function getReporteEfectividadAnuncios(params = {}) {
  const { inicio, fin } = params;

  const queryParams = {};
  if (inicio) queryParams.inicio = inicio;
  if (fin) queryParams.fin = fin;

  const { data } = await http.get("/v1/reportes-admin/efectividad-anuncios", {
    params: queryParams,
  });

  return data;
}