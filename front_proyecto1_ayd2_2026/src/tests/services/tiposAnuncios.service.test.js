import { describe, it, expect, vi, beforeEach } from "vitest";
import http from "../../api/http";
import {
  getTiposAnuncio,
  getTipoAnuncioById,
  getTipoAnuncioByCodigo,
} from "../../services/tiposAnuncio.service";

vi.mock("../../api/http", () => ({
  default: {
    get: vi.fn(),
  },
}));

describe("tiposAnuncios.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("getTiposAnuncio hace GET a /v1/anuncios/tipos y retorna data", async () => {
    const mockResponse = [
      { id: 1, codigo: "TEXTO", descripcion: "Anuncios de texto" },
      { id: 2, codigo: "IMAGEN_TEXTO", descripcion: "Anuncios con imagen y texto" },
      { id: 3, codigo: "VIDEO", descripcion: "Anuncios en video" },
    ];

    http.get.mockResolvedValue({ data: mockResponse });

    const result = await getTiposAnuncio();

    expect(http.get).toHaveBeenCalledWith("/v1/anuncios/tipos");
    expect(result).toEqual(mockResponse);
  });

  it("getTipoAnuncioById hace GET a /v1/anuncios/tipos/{id} y retorna data", async () => {
    const id = 2;
    const mockResponse = {
      id: 2,
      codigo: "IMAGEN_TEXTO",
      descripcion: "Anuncios con imagen y texto",
    };

    http.get.mockResolvedValue({ data: mockResponse });

    const result = await getTipoAnuncioById(id);

    expect(http.get).toHaveBeenCalledWith("/v1/anuncios/tipos/2");
    expect(result).toEqual(mockResponse);
  });

  it("getTipoAnuncioByCodigo hace GET a /v1/anuncios/tipos/codigo/{codigo} y retorna data", async () => {
    const codigo = "VIDEO";
    const mockResponse = {
      id: 3,
      codigo: "VIDEO",
      descripcion: "Anuncios en video",
    };

    http.get.mockResolvedValue({ data: mockResponse });

    const result = await getTipoAnuncioByCodigo(codigo);

    expect(http.get).toHaveBeenCalledWith("/v1/anuncios/tipos/codigo/VIDEO");
    expect(result).toEqual(mockResponse);
  });
});