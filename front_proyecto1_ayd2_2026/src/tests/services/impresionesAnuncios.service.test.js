import { describe, it, expect, vi, beforeEach } from "vitest";
import http from "../../api/http";
import {
  registrarImpresion,
  getTotalVistasByAnuncioId,
  getImpresionesByRevistaId,
} from "../../services/impresionesAnuncios.service";

vi.mock("../../api/http", () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
  },
}));

describe("impresionesAnuncios.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("registrarImpresion hace POST a /v1/anuncios/impresiones/registrar", async () => {
    const payload = {
      anuncioId: 4,
      revistaId: 3,
      urlPagina: "/app/suscriptor/revistas/3/ediciones",
    };

    http.post.mockResolvedValue({ data: undefined });

    const result = await registrarImpresion(payload);

    expect(http.post).toHaveBeenCalledWith(
      "/v1/anuncios/impresiones/registrar",
      payload
    );

    expect(result).toBeUndefined();
  });

  it("getTotalVistasByAnuncioId hace GET a /v1/anuncios/impresiones/total-vistas/{anuncioId}", async () => {
    const anuncioId = 7;
    const mockResponse = 25;

    http.get.mockResolvedValue({ data: mockResponse });

    const result = await getTotalVistasByAnuncioId(anuncioId);

    expect(http.get).toHaveBeenCalledWith(
      "/v1/anuncios/impresiones/total-vistas/7"
    );

    expect(result).toBe(mockResponse);
  });

  it("getImpresionesByRevistaId hace GET a /v1/anuncios/impresiones/revista/{revistaId}", async () => {
    const revistaId = 5;

    const mockResponse = [
      {
        anuncioId: 1,
        revistaId: 5,
        urlPagina: "/app/suscriptor/revistas/5/ediciones",
        fechaImpresion: "2026-03-08T10:30:00",
      },
      {
        anuncioId: 2,
        revistaId: 5,
        urlPagina: "/app/suscriptor/revistas/5/ediciones",
        fechaImpresion: "2026-03-08T10:35:00",
      },
    ];

    http.get.mockResolvedValue({ data: mockResponse });

    const result = await getImpresionesByRevistaId(revistaId);

    expect(http.get).toHaveBeenCalledWith(
      "/v1/anuncios/impresiones/revista/5"
    );

    expect(result).toEqual(mockResponse);
  });
});