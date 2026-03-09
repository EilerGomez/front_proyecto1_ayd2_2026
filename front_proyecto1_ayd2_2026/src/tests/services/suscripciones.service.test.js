import { describe, it, expect, vi, beforeEach } from "vitest";
import http from "../../api/http";
import {
  suscribirse,
  getSuscripcionesByUsuarioId,
  getSuscripcionesByRevistaId,
  cancelarSuscripcion,
} from "../../services/suscripciones.service";

vi.mock("../../api/http", () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
    delete: vi.fn(),
  },
}));

describe("suscripciones.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("suscribirse hace POST a /v1/suscripciones y retorna data", async () => {
    const payload = {
      revistaId: 3,
      usuarioId: 8,
      fechaSuscripcion: "2026-03-08",
      activa: true,
    };

    const mockResponse = {
      id: 12,
      ...payload,
    };

    http.post.mockResolvedValue({ data: mockResponse });

    const result = await suscribirse(payload);

    expect(http.post).toHaveBeenCalledWith("/v1/suscripciones", payload);
    expect(result).toEqual(mockResponse);
  });

  it("getSuscripcionesByUsuarioId hace GET a /v1/suscripciones/usuario/{usuarioId} y retorna data", async () => {
    const usuarioId = 5;

    const mockResponse = [
      {
        id: 1,
        usuarioId: 5,
        revistaId: 3,
        activa: true,
      },
      {
        id: 2,
        usuarioId: 5,
        revistaId: 4,
        activa: true,
      },
    ];

    http.get.mockResolvedValue({ data: mockResponse });

    const result = await getSuscripcionesByUsuarioId(usuarioId);

    expect(http.get).toHaveBeenCalledWith("/v1/suscripciones/usuario/5");
    expect(result).toEqual(mockResponse);
  });

  it("getSuscripcionesByRevistaId hace GET a /v1/suscripciones/revista/{revistaId} y retorna data", async () => {
    const revistaId = 3;

    const mockResponse = [
      {
        id: 1,
        usuarioId: 7,
        revistaId: 3,
        activa: true,
      },
      {
        id: 2,
        usuarioId: 8,
        revistaId: 3,
        activa: false,
      },
    ];

    http.get.mockResolvedValue({ data: mockResponse });

    const result = await getSuscripcionesByRevistaId(revistaId);

    expect(http.get).toHaveBeenCalledWith("/v1/suscripciones/revista/3");
    expect(result).toEqual(mockResponse);
  });

  it("cancelarSuscripcion hace DELETE a /v1/suscripciones/{id} y retorna data", async () => {
    const id = 9;

    http.delete.mockResolvedValue({ data: null });

    const result = await cancelarSuscripcion(id);

    expect(http.delete).toHaveBeenCalledWith("/v1/suscripciones/9");
    expect(result).toBeNull();
  });
});