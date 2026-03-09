import { describe, it, expect, vi, beforeEach } from "vitest";
import http from "../../api/http";
import {
  getPeriodos,
  getPeriodoById,
  getPeriodoByCodigo,
} from "../../services/periodos.service";

vi.mock("../../api/http", () => ({
  default: {
    get: vi.fn(),
  },
}));

describe("periodos.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("getPeriodos hace GET a /v1/anuncios/periodos y retorna data", async () => {
    const mockResponse = [
      { id: 1, codigo: "DIA", descripcion: "Periodo diario" },
      { id: 2, codigo: "SEMANA", descripcion: "Periodo semanal" },
    ];

    http.get.mockResolvedValue({ data: mockResponse });

    const result = await getPeriodos();

    expect(http.get).toHaveBeenCalledWith("/v1/anuncios/periodos");
    expect(result).toEqual(mockResponse);
  });

  it("getPeriodoById hace GET a /v1/anuncios/periodos/{id}", async () => {
    const id = 3;

    const mockResponse = {
      id: 3,
      codigo: "MES",
      descripcion: "Periodo mensual",
    };

    http.get.mockResolvedValue({ data: mockResponse });

    const result = await getPeriodoById(id);

    expect(http.get).toHaveBeenCalledWith("/v1/anuncios/periodos/3");
    expect(result).toEqual(mockResponse);
  });

  it("getPeriodoByCodigo hace GET a /v1/anuncios/periodos/codigo/{codigo}", async () => {
    const codigo = "SEMANA";

    const mockResponse = {
      id: 2,
      codigo: "SEMANA",
      descripcion: "Periodo semanal",
    };

    http.get.mockResolvedValue({ data: mockResponse });

    const result = await getPeriodoByCodigo(codigo);

    expect(http.get).toHaveBeenCalledWith(
      "/v1/anuncios/periodos/codigo/SEMANA"
    );

    expect(result).toEqual(mockResponse);
  });
});