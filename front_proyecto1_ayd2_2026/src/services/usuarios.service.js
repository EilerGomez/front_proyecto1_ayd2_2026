import http from "../api/http";
import { mapUsuariosList, UsuarioItem } from "../models/usuario.model";

export async function getUsuarios() {
  const { data } = await http.get("/v1/usuarios");
  return mapUsuariosList(data);
}

// { nombre, username, apellido, correo, password, estado, id_rol }
export async function createUsuario(payload) {
  const { data } = await http.post("/v1/usuarios", payload);
  return UsuarioItem(data);
}


export async function getUsuarioById(id) {
  const { data } = await http.get(`/v1/usuarios/${id}`);
  return UsuarioItem(data);
}

export async function updateUsuario(id, payload) {
  const { data } = await http.put(`/v1/usuarios/${id}`, payload);
  return UsuarioItem(data);
}