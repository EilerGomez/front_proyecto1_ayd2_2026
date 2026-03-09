import { describe, it, expect, vi, beforeEach } from "vitest";
import http from "../../api/http";
import {
  getCarteraByUsuarioId,
  recargarCartera,
} from "../../services/cartera.service";

vi.mock("../../api/http", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

describe("cartera.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("getCarteraByUsuarioId hace GET a /v1/carteras/usuario/{usuarioId} y retorna data", async () => {
    const usuarioId = 5;
    const mockResponse = {
      id: 1,
      usuarioId: 5,
      saldo: 250.5,
      moneda: "GTQ",
      fechaCreacion: "2026-03-01T10:00:00",
    };

    http.get.mockResolvedValue({ data: mockResponse });

    const result = await getCarteraByUsuarioId(usuarioId);

    expect(http.get).toHaveBeenCalledWith("/v1/carteras/usuario/5");
    expect(result).toEqual(mockResponse);
  });

  it("recargarCartera hace POST a /v1/carteras/recargar con usuarioId y monto numérico", async () => {
    const usuarioId = 5;
    const monto = "100.75";

    const mockResponse = {
      id: 1,
      usuarioId: 5,
      saldo: 351.25,
      moneda: "GTQ",
      fechaCreacion: "2026-03-01T10:00:00",
    };

    http.post.mockResolvedValue({ data: mockResponse });

    const result = await recargarCartera(usuarioId, monto);

    expect(http.post).toHaveBeenCalledWith("/v1/carteras/recargar", {
      usuarioId: 5,
      monto: 100.75,
    });
    expect(result).toEqual(mockResponse);
  });

  it("recargarCartera también convierte monto entero a Number", async () => {
    const usuarioId = 8;
    const monto = "50";

    http.post.mockResolvedValue({ data: { ok: true } });

    await recargarCartera(usuarioId, monto);

    expect(http.post).toHaveBeenCalledWith("/v1/carteras/recargar", {
      usuarioId: 8,
      monto: 50,
    });
  });
});