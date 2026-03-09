import { describe, it, expect, vi, beforeEach } from "vitest";
import http from "../../api/http";
import {
  createCostoDiario,
  getCostoVigente,
  getHistorialCostos,
} from "../../services/costosRevista.service";

vi.mock("../../api/http", () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
  },
}));

describe("costosRevista.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("createCostoDiario hace POST a /v1/costos-revista y retorna data", async () => {
    const payload = {
      revistaId: 3,
      adminId: 1,
      costoPorDia: 25.5,
      fechaInicio: "2026-03-01",
    };

    const mockResponse = {
      id: 10,
      ...payload,
      fechaFin: null,
    };

    http.post.mockResolvedValue({ data: mockResponse });

    const result = await createCostoDiario(payload);

    expect(http.post).toHaveBeenCalledWith("/v1/costos-revista", payload);
    expect(result).toEqual(mockResponse);
  });

  it("getCostoVigente hace GET a /v1/costos-revista/vigente/{revistaId} y retorna data", async () => {
    const revistaId = 5;

    const mockResponse = {
      id: 2,
      revistaId: 5,
      adminId: 1,
      costoPorDia: 30.0,
      fechaInicio: "2026-03-05",
      fechaFin: null,
    };

    http.get.mockResolvedValue({ data: mockResponse });

    const result = await getCostoVigente(revistaId);

    expect(http.get).toHaveBeenCalledWith("/v1/costos-revista/vigente/5");
    expect(result).toEqual(mockResponse);
  });

  it("getHistorialCostos hace GET a /v1/costos-revista/historial/{revistaId} y retorna data", async () => {
    const revistaId = 4;

    const mockResponse = [
      {
        id: 1,
        revistaId: 4,
        adminId: 1,
        costoPorDia: 20.0,
        fechaInicio: "2026-03-01",
        fechaFin: "2026-03-03",
      },
      {
        id: 2,
        revistaId: 4,
        adminId: 1,
        costoPorDia: 24.0,
        fechaInicio: "2026-03-04",
        fechaFin: null,
      },
    ];

    http.get.mockResolvedValue({ data: mockResponse });

    const result = await getHistorialCostos(revistaId);

    expect(http.get).toHaveBeenCalledWith("/v1/costos-revista/historial/4");
    expect(result).toEqual(mockResponse);
  });
});