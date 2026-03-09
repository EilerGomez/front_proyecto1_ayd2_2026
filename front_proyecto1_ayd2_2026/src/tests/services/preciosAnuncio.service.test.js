import { describe, it, expect, vi, beforeEach } from "vitest";
import http from "../../api/http";
import {
  createPrecioAnuncio,
  getPreciosAnuncio,
  getPrecioAnuncioById,
  desactivarPrecioAnuncio,
  getPreciosPorTipo,
} from "../../services/preciosAnuncio.service";

vi.mock("../../api/http", () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
    patch: vi.fn(),
  },
}));

describe("preciosAnuncio.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("createPrecioAnuncio hace POST a /v1/anuncios/precios y retorna data", async () => {
    const payload = {
      tipoAnuncioId: 2,
      precio: 65.0,
      activo: true,
    };

    const mockResponse = {
      id: 10,
      ...payload,
    };

    http.post.mockResolvedValue({ data: mockResponse });

    const result = await createPrecioAnuncio(payload);

    expect(http.post).toHaveBeenCalledWith("/v1/anuncios/precios", payload);
    expect(result).toEqual(mockResponse);
  });

  it("getPreciosAnuncio hace GET a /v1/anuncios/precios y retorna data", async () => {
    const mockResponse = [
      { id: 1, tipoAnuncioId: 1, precio: 50.0, activo: true },
      { id: 2, tipoAnuncioId: 2, precio: 65.0, activo: true },
    ];

    http.get.mockResolvedValue({ data: mockResponse });

    const result = await getPreciosAnuncio();

    expect(http.get).toHaveBeenCalledWith("/v1/anuncios/precios");
    expect(result).toEqual(mockResponse);
  });

  it("getPrecioAnuncioById hace GET a /v1/anuncios/precios/{id} y retorna data", async () => {
    const id = 3;
    const mockResponse = {
      id: 3,
      tipoAnuncioId: 3,
      precio: 70.0,
      activo: true,
    };

    http.get.mockResolvedValue({ data: mockResponse });

    const result = await getPrecioAnuncioById(id);

    expect(http.get).toHaveBeenCalledWith("/v1/anuncios/precios/3");
    expect(result).toEqual(mockResponse);
  });

  it("desactivarPrecioAnuncio hace PATCH a /v1/anuncios/precios/{id}/desactivar y retorna true", async () => {
    const id = 5;

    http.patch.mockResolvedValue({});

    const result = await desactivarPrecioAnuncio(id);

    expect(http.patch).toHaveBeenCalledWith(
      "/v1/anuncios/precios/5/desactivar"
    );
    expect(result).toBe(true);
  });

  it("getPreciosPorTipo hace GET a /v1/anuncios/precios/tipo/{tipoAnuncioId} y retorna data", async () => {
    const tipoAnuncioId = 2;

    const mockResponse = [
      { id: 2, tipoAnuncioId: 2, precio: 65.0, activo: true },
      { id: 4, tipoAnuncioId: 2, precio: 70.0, activo: false },
    ];

    http.get.mockResolvedValue({ data: mockResponse });

    const result = await getPreciosPorTipo(tipoAnuncioId);

    expect(http.get).toHaveBeenCalledWith(
      "/v1/anuncios/precios/tipo/2"
    );
    expect(result).toEqual(mockResponse);
  });
});