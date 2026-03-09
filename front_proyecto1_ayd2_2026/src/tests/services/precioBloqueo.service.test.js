import { describe, it, expect, vi, beforeEach } from "vitest";
import http from "../../api/http";
import {
  getPrecioBloqueoByRevistaId,
  upsertPrecioBloqueo,
  deletePrecioBloqueo,
} from "../../services/precioBloqueo.service";

vi.mock("../../api/http", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  },
}));

describe("precioBloqueo.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("getPrecioBloqueoByRevistaId hace GET a /v1/anuncios/precios-bloqueo/revista/{revistaId}", async () => {
    const revistaId = 4;

    const mockResponse = {
      id: 3,
      revistaId: 4,
      costoPorDia: 50.0,
      adminId: 1,
    };

    http.get.mockResolvedValue({ data: mockResponse });

    const result = await getPrecioBloqueoByRevistaId(revistaId);

    expect(http.get).toHaveBeenCalledWith(
      "/v1/anuncios/precios-bloqueo/revista/4"
    );
    expect(result).toEqual(mockResponse);
  });

  it("upsertPrecioBloqueo hace POST a /v1/anuncios/precios-bloqueo", async () => {
    const payload = {
      revistaId: 5,
      costoPorDia: 75,
      adminId: 2,
    };

    const mockResponse = {
      id: 10,
      ...payload,
    };

    http.post.mockResolvedValue({ data: mockResponse });

    const result = await upsertPrecioBloqueo(payload);

    expect(http.post).toHaveBeenCalledWith(
      "/v1/anuncios/precios-bloqueo",
      payload
    );
    expect(result).toEqual(mockResponse);
  });

  it("deletePrecioBloqueo hace DELETE a /v1/anuncios/precios-bloqueo/{id} y retorna true", async () => {
    const id = 6;

    http.delete.mockResolvedValue({});

    const result = await deletePrecioBloqueo(id);

    expect(http.delete).toHaveBeenCalledWith(
      "/v1/anuncios/precios-bloqueo/6"
    );
    expect(result).toBe(true);
  });
});