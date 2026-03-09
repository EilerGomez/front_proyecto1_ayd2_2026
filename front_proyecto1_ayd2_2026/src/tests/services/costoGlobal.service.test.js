import { describe, it, expect, vi, beforeEach } from "vitest";
import http from "../../api/http";
import {
  getCostoGlobal,
  updateCostoGlobal,
} from "../../services/costoGlobal.service";

vi.mock("../../api/http", () => ({
  default: {
    get: vi.fn(),
    put: vi.fn(),
  },
}));

describe("costoGlobal.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("getCostoGlobal hace GET a /v1/costo-global y retorna data", async () => {
    const mockResponse = {
      id: 1,
      monto: 25.5,
    };

    http.get.mockResolvedValue({ data: mockResponse });

    const result = await getCostoGlobal();

    expect(http.get).toHaveBeenCalledWith("/v1/costo-global");
    expect(result).toEqual(mockResponse);
  });

  it("updateCostoGlobal hace PUT a /v1/costo-global y retorna data", async () => {
    const payload = {
      monto: 30.0,
    };

    const mockResponse = {
      id: 1,
      monto: 30.0,
    };

    http.put.mockResolvedValue({ data: mockResponse });

    const result = await updateCostoGlobal(payload);

    expect(http.put).toHaveBeenCalledWith("/v1/costo-global", payload);
    expect(result).toEqual(mockResponse);
  });
});