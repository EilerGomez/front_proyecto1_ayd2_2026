import { describe, it, expect, vi, beforeEach } from "vitest";
import http from "../../api/http";
import {
  getRevistasByEditorId,
  getRevistaById,
  createRevista,
  asignarEtiquetas,
  updateRevista,
  getRevistasAll,
  changeEstadoRevista,
  getRevistasActivas,
} from "../../services/revistas.service";

vi.mock("../../api/http", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
  },
}));

describe("revistas.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("getRevistasByEditorId hace GET a /v1/revistas/editor/{editorId}", async () => {
    const editorId = 4;
    const mockResponse = [
      { id: 3, titulo: "Motocros En Santa Barbara" },
      { id: 5, titulo: "Uso de telemetría..." },
    ];

    http.get.mockResolvedValue({ data: mockResponse });

    const result = await getRevistasByEditorId(editorId);

    expect(http.get).toHaveBeenCalledWith("/v1/revistas/editor/4");
    expect(result).toEqual(mockResponse);
  });

  it("getRevistaById hace GET a /v1/revistas/{id}", async () => {
    const id = 3;
    const mockResponse = { id: 3, titulo: "Motocros En Santa Barbara" };

    http.get.mockResolvedValue({ data: mockResponse });

    const result = await getRevistaById(id);

    expect(http.get).toHaveBeenCalledWith("/v1/revistas/3");
    expect(result).toEqual(mockResponse);
  });

  it("createRevista hace POST a /v1/revistas", async () => {
    const payload = {
      editorId: 4,
      titulo: "Nueva Revista",
      descripcion: "Descripción",
      categoriaId: 2,
    };

    const mockResponse = { id: 10, ...payload };

    http.post.mockResolvedValue({ data: mockResponse });

    const result = await createRevista(payload);

    expect(http.post).toHaveBeenCalledWith("/v1/revistas", payload);
    expect(result).toEqual(mockResponse);
  });

  it("asignarEtiquetas hace POST a /v1/revistas/asignar-etiquetas", async () => {
    const payload = {
      idRevista: 3,
      etiquetasIds: [1, 2, 3],
    };

    http.post.mockResolvedValue({ data: "OK" });

    const result = await asignarEtiquetas(payload);

    expect(http.post).toHaveBeenCalledWith(
      "/v1/revistas/asignar-etiquetas",
      payload
    );
    expect(result).toBe("OK");
  });

  it("updateRevista hace PUT a /v1/revistas/{id}", async () => {
    const id = 6;
    const payload = {
      titulo: "Revista actualizada",
      descripcion: "Nueva descripción",
    };

    const mockResponse = { id, ...payload };

    http.put.mockResolvedValue({ data: mockResponse });

    const result = await updateRevista(id, payload);

    expect(http.put).toHaveBeenCalledWith("/v1/revistas/6", payload);
    expect(result).toEqual(mockResponse);
  });

  it("getRevistasAll hace GET a /v1/revistas", async () => {
    const mockResponse = [
      { id: 1, titulo: "Journal de Tecnología Aplicada" },
      { id: 2, titulo: "Proyecto de la Nasa" },
    ];

    http.get.mockResolvedValue({ data: mockResponse });

    const result = await getRevistasAll();

    expect(http.get).toHaveBeenCalledWith("/v1/revistas");
    expect(result).toEqual(mockResponse);
  });

  it("changeEstadoRevista hace PATCH a /v1/revistas/{id}/estado?estado={estado}", async () => {
    const id = 5;
    const estado = "INACTIVA";

    const mockResponse = {
      id: 5,
      estado: "INACTIVA",
    };

    http.patch.mockResolvedValue({ data: mockResponse });

    const result = await changeEstadoRevista(id, estado);

    expect(http.patch).toHaveBeenCalledWith(
      "/v1/revistas/5/estado?estado=INACTIVA"
    );
    expect(result).toEqual(mockResponse);
  });

  it("getRevistasActivas hace GET a /v1/revistas/activas", async () => {
    const mockResponse = [
      { id: 3, titulo: "Motocros En Santa Barbara", activa: true },
      { id: 5, titulo: "Uso de telemetría...", activa: true },
    ];

    http.get.mockResolvedValue({ data: mockResponse });

    const result = await getRevistasActivas();

    expect(http.get).toHaveBeenCalledWith("/v1/revistas/activas");
    expect(result).toEqual(mockResponse);
  });
});