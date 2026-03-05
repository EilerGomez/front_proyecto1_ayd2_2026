import http from "../api/http";
import { Rol } from "../models/rol.model";

export async function getRoles() {
  const { data } = await http.get("/v1/roles");
  return Array.isArray(data) ? data.map(Rol) : [];
}