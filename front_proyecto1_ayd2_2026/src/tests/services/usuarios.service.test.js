import { describe, it, expect, vi, beforeEach } from "vitest";
import http from "../../api/http";
import {
  getUsuarios,
  createUsuario,
  getUsuarioById,
  updateUsuario,
} from "../../services/usuarios.service";
import { mapUsuariosList, UsuarioItem } from "../../models/usuario.model";

vi.mock("../../api/http", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
  },
}));

vi.mock("../../models/usuario.model", () => ({
  mapUsuariosList: vi.fn(),
  UsuarioItem: vi.fn(),
}));

describe("usuarios.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("getUsuarios hace GET a /v1/usuarios y usa mapUsuariosList", async () => {
    const mockApiResponse = [
      { id: 1, username: "admin1" },
      { id: 2, username: "editor1" },
    ];

    const mappedResponse = [
      { id: 1, username: "admin1", rol: "ADMIN" },
      { id: 2, username: "editor1", rol: "EDITOR" },
    ];

    http.get.mockResolvedValue({ data: mockApiResponse });
    mapUsuariosList.mockReturnValue(mappedResponse);

    const result = await getUsuarios();

    expect(http.get).toHaveBeenCalledWith("/v1/usuarios");
    expect(mapUsuariosList).toHaveBeenCalledWith(mockApiResponse);
    expect(result).toEqual(mappedResponse);
  });

  it("createUsuario hace POST a /v1/usuarios y usa UsuarioItem", async () => {
    const payload = {
      nombre: "Juan",
      apellido: "Perez",
      username: "juanp",
      correo: "juan@mail.com",
      password: "1234",
      estado: "ACTIVO",
      id_rol: 2,
    };

    const apiResponse = {
      id: 10,
      ...payload,
    };

    const mappedUsuario = {
      id: 10,
      username: "juanp",
      nombreCompleto: "Juan Perez",
    };

    http.post.mockResolvedValue({ data: apiResponse });
    UsuarioItem.mockReturnValue(mappedUsuario);

    const result = await createUsuario(payload);

    expect(http.post).toHaveBeenCalledWith("/v1/usuarios", payload);
    expect(UsuarioItem).toHaveBeenCalledWith(apiResponse);
    expect(result).toEqual(mappedUsuario);
  });

  it("getUsuarioById hace GET a /v1/usuarios/{id} y usa UsuarioItem", async () => {
    const apiResponse = {
      id: 5,
      username: "editor1",
    };

    const mappedUsuario = {
      id: 5,
      username: "editor1",
      rol: "EDITOR",
    };

    http.get.mockResolvedValue({ data: apiResponse });
    UsuarioItem.mockReturnValue(mappedUsuario);

    const result = await getUsuarioById(5);

    expect(http.get).toHaveBeenCalledWith("/v1/usuarios/5");
    expect(UsuarioItem).toHaveBeenCalledWith(apiResponse);
    expect(result).toEqual(mappedUsuario);
  });

  it("updateUsuario hace PUT a /v1/usuarios/{id} y usa UsuarioItem", async () => {
    const payload = {
      nombre: "Carlos",
      apellido: "Lopez",
    };

    const apiResponse = {
      id: 7,
      username: "carlosl",
      ...payload,
    };

    const mappedUsuario = {
      id: 7,
      username: "carlosl",
      nombreCompleto: "Carlos Lopez",
    };

    http.put.mockResolvedValue({ data: apiResponse });
    UsuarioItem.mockReturnValue(mappedUsuario);

    const result = await updateUsuario(7, payload);

    expect(http.put).toHaveBeenCalledWith("/v1/usuarios/7", payload);
    expect(UsuarioItem).toHaveBeenCalledWith(apiResponse);
    expect(result).toEqual(mappedUsuario);
  });
});