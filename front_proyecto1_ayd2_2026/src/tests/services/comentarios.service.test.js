import { describe, it, expect, vi, beforeEach } from "vitest";
import http from "../../api/http";
import {
  getComentariosByRevistaId,
  createComentario,
  deleteComentario,
} from "../../services/comentarios.service";

vi.mock("../../api/http", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  },
}));

describe("comentarios.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("getComentariosByRevistaId hace GET a /v1/comentarios/revista/{revistaId} y retorna data", async () => {
    const revistaId = 3;

    const mockResponse = [
      {
        id: 1,
        username: "usuario1",
        contenido: "Buen artículo",
        fechaCreacion: "2026-03-01T10:00:00",
      },
      {
        id: 2,
        username: "usuario2",
        contenido: "Muy interesante",
        fechaCreacion: "2026-03-02T12:30:00",
      },
    ];

    http.get.mockResolvedValue({ data: mockResponse });

    const result = await getComentariosByRevistaId(revistaId);

    expect(http.get).toHaveBeenCalledWith("/v1/comentarios/revista/3");
    expect(result).toEqual(mockResponse);
  });

  it("createComentario hace POST a /v1/comentarios y retorna data", async () => {
    const payload = {
      revistaId: 3,
      usuarioId: 5,
      contenido: "Excelente revista",
    };

    const mockResponse = {
      id: 10,
      ...payload,
      fechaCreacion: "2026-03-08T15:00:00",
    };

    http.post.mockResolvedValue({ data: mockResponse });

    const result = await createComentario(payload);

    expect(http.post).toHaveBeenCalledWith("/v1/comentarios", payload);
    expect(result).toEqual(mockResponse);
  });

  it("deleteComentario hace DELETE a /v1/comentarios/{id}", async () => {
    const id = 7;

    http.delete.mockResolvedValue({ data: null });

    const result = await deleteComentario(id);

    expect(http.delete).toHaveBeenCalledWith("/v1/comentarios/7");
    expect(result).toBeNull();
  });
});