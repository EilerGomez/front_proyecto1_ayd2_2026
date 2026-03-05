export function Rol(dto = {}) {
  return {
    id: dto.id ?? null,
    nombre: dto.nombre ?? "",
  };
}

export function isRol(x) {
  return x && typeof x.id === "number" && typeof x.nombre === "string";
}