import { describe, it, expect, vi, beforeEach } from "vitest";
import http from "../../api/http";
import {
  getLikesByRevistaId,
  existsLike,
  darLike,
  quitarLike,
} from "../../services/likes.service";

vi.mock("../../api/http", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  },
}));

describe("likes.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("getLikesByRevistaId hace GET a /v1/likes/revista/{revistaId} y retorna data", async () => {
    const revistaId = 3;

    const mockResponse = [
      {
        id: 1,
        revistaId: 3,
        usuarioId: 5,
        fechaCreacion: "2026-03-05T00:00:41",
      },
      {
        id: 2,
        revistaId: 3,
        usuarioId: 6,
        fechaCreacion: "2026-03-05T04:07:29",
      },
    ];

    http.get.mockResolvedValue({ data: mockResponse });

    const result = await getLikesByRevistaId(revistaId);

    expect(http.get).toHaveBeenCalledWith("/v1/likes/revista/3");
    expect(result).toEqual(mockResponse);
  });

  it("existsLike hace GET a /v1/likes/revista/{revistaId}/usuario/{usuarioId}/existe y retorna true", async () => {
    http.get.mockResolvedValue({ data: true });

    const result = await existsLike(4, 7);

    expect(http.get).toHaveBeenCalledWith(
      "/v1/likes/revista/4/usuario/7/existe"
    );
    expect(result).toBe(true);
  });

  it("existsLike retorna false cuando el backend devuelve false", async () => {
    http.get.mockResolvedValue({ data: false });

    const result = await existsLike(4, 7);

    expect(result).toBe(false);
  });

  it("existsLike retorna false cuando el backend devuelve null", async () => {
    http.get.mockResolvedValue({ data: null });

    const result = await existsLike(4, 7);

    expect(result).toBe(false);
  });

  it("darLike hace POST a /v1/likes y retorna data", async () => {
    const payload = {
      revistaId: 5,
      usuarioId: 9,
    };

    const mockResponse = {
      id: 12,
      ...payload,
      fechaCreacion: "2026-03-08T10:30:00",
    };

    http.post.mockResolvedValue({ data: mockResponse });

    const result = await darLike(payload);

    expect(http.post).toHaveBeenCalledWith("/v1/likes", payload);
    expect(result).toEqual(mockResponse);
  });

  it("quitarLike hace DELETE a /v1/likes/revista/{revistaId}/usuario/{usuarioId}", async () => {
    http.delete.mockResolvedValue({ data: null });

    const result = await quitarLike(3, 8);

    expect(http.delete).toHaveBeenCalledWith(
      "/v1/likes/revista/3/usuario/8"
    );
    expect(result).toBeNull();
  });
});