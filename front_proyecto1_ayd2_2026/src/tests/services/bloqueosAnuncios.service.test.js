import { describe, it, expect, vi, beforeEach } from "vitest";
import http from "../../api/http";
import {
  contratarBloqueo,
  getBloqueoActivoByRevistaId,
  getHistorialBloqueosByRevistaId,
  actualizarFechaFinBloqueo,
} from "../../services/bloqueosAnuncios.service";

vi.mock("../../api/http", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
  },
}));

describe("bloqueosAnuncios.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("contratarBloqueo hace POST a /v1/anuncios/bloqueos/contratar y retorna data", async () => {
    const payload = {
      revistaId: 3,
      fechaInicio: "2026-03-08",
      fechaFin: "2026-03-15",
      monto: 150,
    };

    const mockResponse = {
      id: 12,
      ...payload,
      estado: "ACTIVO",
    };

    http.post.mockResolvedValue({ data: mockResponse });

    const result = await contratarBloqueo(payload);

    expect(http.post).toHaveBeenCalledWith(
      "/v1/anuncios/bloqueos/contratar",
      payload
    );
    expect(result).toEqual(mockResponse);
  });

  it("getBloqueoActivoByRevistaId hace GET a /v1/anuncios/bloqueos/activo/revista/{revistaId}", async () => {
    const revistaId = 5;
    const mockResponse = {
      id: 2,
      revistaId,
      estado: "ACTIVO",
    };

    http.get.mockResolvedValue({ data: mockResponse });

    const result = await getBloqueoActivoByRevistaId(revistaId);

    expect(http.get).toHaveBeenCalledWith(
      "/v1/anuncios/bloqueos/activo/revista/5"
    );
    expect(result).toEqual(mockResponse);
  });

  it("getHistorialBloqueosByRevistaId hace GET a /v1/anuncios/bloqueos/historial/revista/{revistaId}", async () => {
    const revistaId = 4;
    const mockResponse = [
      { id: 1, revistaId, estado: "FINALIZADO" },
      { id: 2, revistaId, estado: "ACTIVO" },
    ];

    http.get.mockResolvedValue({ data: mockResponse });

    const result = await getHistorialBloqueosByRevistaId(revistaId);

    expect(http.get).toHaveBeenCalledWith(
      "/v1/anuncios/bloqueos/historial/revista/4"
    );
    expect(result).toEqual(mockResponse);
  });

  it("actualizarFechaFinBloqueo hace PATCH a /v1/anuncios/bloqueos/{id}/fecha-fin con params y retorna data", async () => {
    const id = 7;
    const fechaFin = "2026-03-20";

    const mockResponse = {
      id,
      fechaFin,
      estado: "ACTUALIZADO",
    };

    http.patch.mockResolvedValue({ data: mockResponse });

    const result = await actualizarFechaFinBloqueo(id, fechaFin);

    expect(http.patch).toHaveBeenCalledWith(
      "/v1/anuncios/bloqueos/7/fecha-fin",
      null,
      {
        params: { fechaFin: "2026-03-20" },
      }
    );
    expect(result).toEqual(mockResponse);
  });
});