import { describe, it, expect, vi, beforeEach } from "vitest";
import http from "../../api/http";
import {
  getPerfilByUsuarioId,
  updatePerfilByUsuarioId,
} from "../../services/perfil.service";

vi.mock("../../api/http", () => ({
  default: {
    get: vi.fn(),
    put: vi.fn(),
  },
}));

describe("perfil.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("getPerfilByUsuarioId hace GET a /v1/perfiles/usuario/{usuarioId} y retorna data", async () => {
    const usuarioId = 5;

    const mockResponse = {
      id: 2,
      usuarioId: 5,
      nombre: "Eugenio",
      apellido: "Sandoval",
      correo: "eilerg@gmail.com",
      perfilUrl: "https://foto.com/perfil.jpg",
    };

    http.get.mockResolvedValue({ data: mockResponse });

    const result = await getPerfilByUsuarioId(usuarioId);

    expect(http.get).toHaveBeenCalledWith("/v1/perfiles/usuario/5");
    expect(result).toEqual(mockResponse);
  });

  it("updatePerfilByUsuarioId hace PUT a /v1/perfiles/usuario/{usuarioId} y retorna data", async () => {
    const usuarioId = 5;

    const payload = {
      nombre: "Eugenio Dario",
      apellido: "Sandoval",
      perfilUrl: "https://foto.com/nueva.jpg",
    };

    const mockResponse = {
      usuarioId: 5,
      ...payload,
    };

    http.put.mockResolvedValue({ data: mockResponse });

    const result = await updatePerfilByUsuarioId(usuarioId, payload);

    expect(http.put).toHaveBeenCalledWith(
      "/v1/perfiles/usuario/5",
      payload
    );

    expect(result).toEqual(mockResponse);
  });
});