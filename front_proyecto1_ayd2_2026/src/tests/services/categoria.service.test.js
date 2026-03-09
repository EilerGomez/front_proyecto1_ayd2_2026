import { describe, it, expect, vi, beforeEach } from "vitest";
import http from "../../api/http";
import {
  getCategorias,
  getCategoriaById,
  createCategoria,
  updateCategoria,
  deleteCategoria,
} from "../../services/categorias.service";

vi.mock("../../api/http", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

describe("categoria.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("getCategorias hace GET a /v1/categorias y retorna data", async () => {
    const mockResponse = [
      { id: 1, nombre: "Tecnología", descripcion: "Revistas tech" },
      { id: 2, nombre: "Deportes", descripcion: "Revistas deportivas" },
    ];

    http.get.mockResolvedValue({ data: mockResponse });

    const result = await getCategorias();

    expect(http.get).toHaveBeenCalledWith("/v1/categorias");
    expect(result).toEqual(mockResponse);
  });

  it("getCategoriaById hace GET a /v1/categorias/{id} y retorna data", async () => {
    const id = 3;
    const mockResponse = {
      id: 3,
      nombre: "Historia",
      descripcion: "Historia y arqueología",
    };

    http.get.mockResolvedValue({ data: mockResponse });

    const result = await getCategoriaById(id);

    expect(http.get).toHaveBeenCalledWith("/v1/categorias/3");
    expect(result).toEqual(mockResponse);
  });

  it("createCategoria hace POST a /v1/categorias y retorna data", async () => {
    const payload = {
      nombre: "Ciencia",
      descripcion: "Contenido científico",
    };

    const mockResponse = {
      id: 10,
      ...payload,
    };

    http.post.mockResolvedValue({ data: mockResponse });

    const result = await createCategoria(payload);

    expect(http.post).toHaveBeenCalledWith("/v1/categorias", payload);
    expect(result).toEqual(mockResponse);
  });

  it("updateCategoria hace PUT a /v1/categorias/{id} y retorna data", async () => {
    const id = 6;
    const payload = {
      nombre: "Arte",
      descripcion: "Revistas de arte y cultura",
    };

    const mockResponse = {
      id,
      ...payload,
    };

    http.put.mockResolvedValue({ data: mockResponse });

    const result = await updateCategoria(id, payload);

    expect(http.put).toHaveBeenCalledWith("/v1/categorias/6", payload);
    expect(result).toEqual(mockResponse);
  });

  it("deleteCategoria hace DELETE a /v1/categorias/{id} y retorna true", async () => {
    const id = 8;

    http.delete.mockResolvedValue({});

    const result = await deleteCategoria(id);

    expect(http.delete).toHaveBeenCalledWith("/v1/categorias/8");
    expect(result).toBe(true);
  });
});