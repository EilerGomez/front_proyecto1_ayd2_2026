import { describe, it, expect, vi, beforeEach } from "vitest";
import http from "../../api/http";
import {
  createAnuncio,
  getAnuncioById,
  getAnunciosByAnuncianteId,
  getAnunciosByEstado,
  changeEstadoAnuncio,
  updateAnuncio,
  getAnunciosParaRevista,
} from "../../services/anuncios.service";

vi.mock("../../api/http", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    put: vi.fn(),
  },
}));

describe("anuncios.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("createAnuncio hace POST a /v1/anuncios y retorna data", async () => {
    const payload = {
      texto: "Anuncio de prueba",
      urlDestino: "https://ejemplo.com",
      tipoAnuncioId: 1,
      anuncianteId: 5,
    };

    const mockResponse = { id: 10, ...payload };
    http.post.mockResolvedValue({ data: mockResponse });

    const result = await createAnuncio(payload);

    expect(http.post).toHaveBeenCalledWith("/v1/anuncios", payload);
    expect(result).toEqual(mockResponse);
  });

  it("getAnuncioById hace GET a /v1/anuncios/{id} y retorna data", async () => {
    const id = 7;
    const mockResponse = { id, texto: "Anuncio 7" };
    http.get.mockResolvedValue({ data: mockResponse });

    const result = await getAnuncioById(id);

    expect(http.get).toHaveBeenCalledWith("/v1/anuncios/7");
    expect(result).toEqual(mockResponse);
  });

  it("getAnunciosByAnuncianteId hace GET a /v1/anuncios/anunciante/{anuncianteId}", async () => {
    const anuncianteId = 5;
    const mockResponse = [
      { id: 1, anuncianteId },
      { id: 2, anuncianteId },
    ];
    http.get.mockResolvedValue({ data: mockResponse });

    const result = await getAnunciosByAnuncianteId(anuncianteId);

    expect(http.get).toHaveBeenCalledWith("/v1/anuncios/anunciante/5");
    expect(result).toEqual(mockResponse);
  });

  it("getAnunciosByEstado hace GET a /v1/anuncios/estado/{estado}", async () => {
    const estado = "ACTIVO";
    const mockResponse = [
      { id: 1, estado: "ACTIVO" },
      { id: 2, estado: "ACTIVO" },
    ];
    http.get.mockResolvedValue({ data: mockResponse });

    const result = await getAnunciosByEstado(estado);

    expect(http.get).toHaveBeenCalledWith("/v1/anuncios/estado/ACTIVO");
    expect(result).toEqual(mockResponse);
  });

  it("changeEstadoAnuncio hace PATCH a /v1/anuncios/{id}/estado con params y retorna true", async () => {
    const id = 4;
    const nuevoEstado = "INACTIVO";
    http.patch.mockResolvedValue({});

    const result = await changeEstadoAnuncio(id, nuevoEstado);

    expect(http.patch).toHaveBeenCalledWith(
      "/v1/anuncios/4/estado",
      null,
      {
        params: { nuevoEstado: "INACTIVO" },
      }
    );
    expect(result).toBe(true);
  });

  it("updateAnuncio hace PUT a /v1/anuncios/{id} y retorna data", async () => {
    const id = 9;
    const payload = {
      texto: "Texto actualizado",
      urlDestino: "https://nuevo.com",
    };
    const mockResponse = { id, ...payload };

    http.put.mockResolvedValue({ data: mockResponse });

    const result = await updateAnuncio(id, payload);

    expect(http.put).toHaveBeenCalledWith("/v1/anuncios/9", payload);
    expect(result).toEqual(mockResponse);
  });

  it("getAnunciosParaRevista hace GET a /v1/anuncios/para-revista/{revistaId}", async () => {
    const revistaId = 3;
    const mockResponse = [
      { id: 1, revistaId },
      { id: 2, revistaId },
    ];

    http.get.mockResolvedValue({ data: mockResponse });

    const result = await getAnunciosParaRevista(revistaId);

    expect(http.get).toHaveBeenCalledWith("/v1/anuncios/para-revista/3");
    expect(result).toEqual(mockResponse);
  });
});