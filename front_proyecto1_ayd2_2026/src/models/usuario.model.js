import { Rol } from "./rol.model";

export function UsuarioCore(dto = {}) {
  return {
    id: dto.id ?? null,
    nombre: dto.nombre ?? "",
    username: dto.username ?? "",
    apellido: dto.apellido ?? "",
    correo: dto.correo ?? "",
    estado: dto.estado ?? "",
  };
}

export function Perfil(dto = {}) {
  return {
    usuarioId: dto.usuarioId ?? null,
    foto_url: dto.foto_url ?? null,
    hobbies: dto.hobbies ?? null,
    intereses: dto.intereses ?? null,
    descripcion: dto.descripcion ?? null,
    gustos: dto.gustos ?? null,
  };
}

export function Cartera(dto = {}) {
  return {
    id: dto.id ?? null,
    usuarioId: dto.usuarioId ?? null,
    saldo: dto.saldo ?? 0,
    moneda: dto.moneda ?? "GTQ",
    fechaCreacion: dto.fechaCreacion ?? null,
  };
}

export function UsuarioItem(dto = {}) {
  return {
    usuario: UsuarioCore(dto.usuario),
    perfil: Perfil(dto.perfil),
    rol: Rol(dto.rol),
    cartera: Cartera(dto.cartera),
  };
}

export function mapUsuariosList(arr = []) {
  return Array.isArray(arr) ? arr.map(UsuarioItem) : [];
}