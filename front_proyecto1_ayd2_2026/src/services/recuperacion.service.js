// src/services/recuperacion.service.js
import http from "../api/http";

// POST /v1/auth/recuperacion/solicitar?identificador=...
export async function solicitarRecuperacion(identificador) {
  const { data } = await http.post(
    `/v1/auth/recuperacion/solicitar`,
    null,
    { params: { identificador } }
  );
  return data; // string mensaje
}

// POST /v1/auth/recuperacion/validar  body: { correo, codigo }
export async function validarCodigoRecuperacion({ correo, codigo }) {
  const { data } = await http.post(`/v1/auth/recuperacion/validar`, {
    correo,
    codigo,
  });
  return data; // boolean
}

// PATCH /v1/auth/recuperacion/cambiar body: { correo, codigo, nuevaPassword }
export async function cambiarContraseniaRecuperacion({ correo, codigo, nuevaPassword }) {
  const { data } = await http.patch(`/v1/auth/recuperacion/cambiar`, {
    correo,
    codigo,
    nuevaPassword,
  });
  return data; // string mensaje
}