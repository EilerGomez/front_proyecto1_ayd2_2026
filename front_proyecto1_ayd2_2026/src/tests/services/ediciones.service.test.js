import { describe, it, expect, vi, beforeEach } from "vitest";
import http from "../../api/http";
import {
  getEdicionesByRevistaId,
  createEdicion,
  deleteEdicion,
} from "../../services/ediciones.service";

vi.mock("../../api/http", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  },
}));

describe("ediciones.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("getEdicionesByRevistaId hace GET a /v1/ediciones/revista/{revistaId} y retorna data", async () => {
    const revistaId = 3;

    const mockResponse = [
      {
        id: 1,
        revistaId: 3,
        numeroEdicion: "1era Edición",
        titulo: "Edición inicial",
        pdfUrl: "https://ejemplo.com/edicion1.pdf",
        fechaPublicacion: "2026-03-01T10:00:00",
      },
      {
        id: 2,
        revistaId: 3,
        numeroEdicion: "2da Edición",
        titulo: "Edición más reciente",
        pdfUrl: "https://ejemplo.com/edicion2.pdf",
        fechaPublicacion: "2026-03-05T12:00:00",
      },
    ];

    http.get.mockResolvedValue({ data: mockResponse });

    const result = await getEdicionesByRevistaId(revistaId);

    expect(http.get).toHaveBeenCalledWith("/v1/ediciones/revista/3");
    expect(result).toEqual(mockResponse);
  });

  it("createEdicion hace POST a /v1/ediciones y retorna data", async () => {
    const payload = {
      revistaId: 3,
      numeroEdicion: "3era Edición",
      titulo: "Nueva edición",
      pdfUrl: "https://ejemplo.com/edicion3.pdf",
    };

    const mockResponse = {
      id: 7,
      ...payload,
      fechaPublicacion: "2026-03-08T14:00:00",
    };

    http.post.mockResolvedValue({ data: mockResponse });

    const result = await createEdicion(payload);

    expect(http.post).toHaveBeenCalledWith("/v1/ediciones", payload);
    expect(result).toEqual(mockResponse);
  });

  it("deleteEdicion hace DELETE a /v1/ediciones/{id}", async () => {
    const id = 9;

    http.delete.mockResolvedValue({});

    const result = await deleteEdicion(id);

    expect(http.delete).toHaveBeenCalledWith("/v1/ediciones/9");
    expect(result).toBeUndefined();
  });
});