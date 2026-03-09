import { describe, it, expect, vi, beforeEach } from "vitest";
import http from "../../api/http";
import { getRoles } from "../../services/roles.service";
import { Rol } from "../../models/rol.model";

vi.mock("../../api/http", () => ({
  default: {
    get: vi.fn(),
  },
}));

vi.mock("../../models/rol.model", () => ({
  Rol: vi.fn(),
}));

describe("roles.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("getRoles hace GET a /v1/roles y mapea cada elemento con Rol", async () => {
    const mockApiResponse = [
      { id: 1, nombre: "ADMIN" },
      { id: 2, nombre: "EDITOR" },
    ];

    Rol.mockImplementation((item) => ({
      ...item,
      nombreFormateado: item.nombre.toLowerCase(),
    }));

    http.get.mockResolvedValue({ data: mockApiResponse });

    const result = await getRoles();

    expect(http.get).toHaveBeenCalledWith("/v1/roles");
    expect(Rol).toHaveBeenCalledTimes(2);

    expect(Rol).toHaveBeenNthCalledWith(
      1,
      { id: 1, nombre: "ADMIN" },
      0,
      mockApiResponse
    );

    expect(Rol).toHaveBeenNthCalledWith(
      2,
      { id: 2, nombre: "EDITOR" },
      1,
      mockApiResponse
    );

    expect(result).toEqual([
      { id: 1, nombre: "ADMIN", nombreFormateado: "admin" },
      { id: 2, nombre: "EDITOR", nombreFormateado: "editor" },
    ]);
  });

  it("getRoles retorna [] si data no es un arreglo", async () => {
    http.get.mockResolvedValue({ data: null });

    const result = await getRoles();

    expect(http.get).toHaveBeenCalledWith("/v1/roles");
    expect(Rol).not.toHaveBeenCalled();
    expect(result).toEqual([]);
  });

  it("getRoles retorna [] si data viene como objeto", async () => {
    http.get.mockResolvedValue({ data: { id: 1, nombre: "ADMIN" } });

    const result = await getRoles();

    expect(Rol).not.toHaveBeenCalled();
    expect(result).toEqual([]);
  });

  it("getRoles retorna [] si data viene como arreglo vacío", async () => {
    http.get.mockResolvedValue({ data: [] });

    const result = await getRoles();

    expect(Rol).not.toHaveBeenCalled();
    expect(result).toEqual([]);
  });
});