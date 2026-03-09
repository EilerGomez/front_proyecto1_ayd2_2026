import { describe, it, expect, vi, beforeEach } from "vitest";
import http from "../../api/http";
import {
  getEtiquetas,
  getEtiquetaById,
  createEtiqueta,
  updateEtiqueta,
  deleteEtiqueta,
} from "../../services/etiquetas.service";

vi.mock("../../api/http", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

describe("etiquetas.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("getEtiquetas hace GET a /v1/etiquetas y retorna data", async () => {
    const mockResponse = [
      { id: 1, nombre: "Tecnología" },
      { id: 2, nombre: "Deportes" },
    ];

    http.get.mockResolvedValue({ data: mockResponse });

    const result = await getEtiquetas();

    expect(http.get).toHaveBeenCalledWith("/v1/etiquetas");
    expect(result).toEqual(mockResponse);
  });

  it("getEtiquetaById hace GET a /v1/etiquetas/{id}", async () => {
    const id = 3;

    const mockResponse = {
      id: 3,
      nombre: "Historia",
    };

    http.get.mockResolvedValue({ data: mockResponse });

    const result = await getEtiquetaById(id);

    expect(http.get).toHaveBeenCalledWith("/v1/etiquetas/3");
    expect(result).toEqual(mockResponse);
  });

  it("createEtiqueta hace POST a /v1/etiquetas", async () => {
    const payload = { nombre: "Ciencia" };

    const mockResponse = {
      id: 5,
      nombre: "Ciencia",
    };

    http.post.mockResolvedValue({ data: mockResponse });

    const result = await createEtiqueta(payload);

    expect(http.post).toHaveBeenCalledWith("/v1/etiquetas", payload);
    expect(result).toEqual(mockResponse);
  });

  it("updateEtiqueta hace PUT a /v1/etiquetas/{id}", async () => {
    const id = 4;

    const payload = { nombre: "Arte" };

    const mockResponse = {
      id: 4,
      nombre: "Arte",
    };

    http.put.mockResolvedValue({ data: mockResponse });

    const result = await updateEtiqueta(id, payload);

    expect(http.put).toHaveBeenCalledWith("/v1/etiquetas/4", payload);
    expect(result).toEqual(mockResponse);
  });

  it("deleteEtiqueta hace DELETE a /v1/etiquetas/{id} y retorna true", async () => {
    const id = 7;

    http.delete.mockResolvedValue({});

    const result = await deleteEtiqueta(id);

    expect(http.delete).toHaveBeenCalledWith("/v1/etiquetas/7");
    expect(result).toBe(true);
  });
});