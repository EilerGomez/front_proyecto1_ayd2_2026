import { describe, it, expect, vi, beforeEach } from "vitest";
import http from "../../api/http";
import {
  getReporteComentariosEditor,
  getReporteSuscripcionesEditor,
  getReporteLikesTopEditor,
  getReportePagosEditor,
} from "../../services/reportesEditor.service";

vi.mock("../../api/http", () => ({
  default: {
    get: vi.fn(),
  },
}));

describe("reportesEditor.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("getReporteComentariosEditor hace GET correcto con params", async () => {
    const mockResponse = [{ totalComentarios: 5 }];
    http.get.mockResolvedValue({ data: mockResponse });

    const result = await getReporteComentariosEditor(4, {
      revistaId: 3,
      inicio: "2026-03-01T00:00:00",
      fin: "2026-03-08T23:59:59",
    });

    expect(http.get).toHaveBeenCalledWith("/v1/reportes-editor/comentarios/4", {
      params: {
        revistaId: 3,
        inicio: "2026-03-01T00:00:00",
        fin: "2026-03-08T23:59:59",
      },
    });
    expect(result).toEqual(mockResponse);
  });

  it("getReporteComentariosEditor omite revistaId si viene vacío", async () => {
    http.get.mockResolvedValue({ data: [] });

    await getReporteComentariosEditor(4, {
      revistaId: "",
      inicio: "2026-03-01T00:00:00",
    });

    expect(http.get).toHaveBeenCalledWith("/v1/reportes-editor/comentarios/4", {
      params: {
        inicio: "2026-03-01T00:00:00",
      },
    });
  });

  it("getReporteSuscripcionesEditor hace GET correcto con params", async () => {
    const mockResponse = [{ totalSuscripciones: 2 }];
    http.get.mockResolvedValue({ data: mockResponse });

    const result = await getReporteSuscripcionesEditor(4, {
      revistaId: 5,
      inicio: "2026-03-01",
      fin: "2026-03-08",
    });

    expect(http.get).toHaveBeenCalledWith("/v1/reportes-editor/suscripciones/4", {
      params: {
        revistaId: 5,
        inicio: "2026-03-01",
        fin: "2026-03-08",
      },
    });
    expect(result).toEqual(mockResponse);
  });

  it("getReporteSuscripcionesEditor omite params vacíos", async () => {
    http.get.mockResolvedValue({ data: [] });

    await getReporteSuscripcionesEditor(4, {});

    expect(http.get).toHaveBeenCalledWith("/v1/reportes-editor/suscripciones/4", {
      params: {},
    });
  });

  it("getReporteLikesTopEditor hace GET correcto con params", async () => {
    const mockResponse = [{ totalLikes: 4 }];
    http.get.mockResolvedValue({ data: mockResponse });

    const result = await getReporteLikesTopEditor(4, {
      revistaId: 3,
      inicio: "2026-03-01T00:00:00",
      fin: "2026-03-08T23:59:59",
    });

    expect(http.get).toHaveBeenCalledWith("/v1/reportes-editor/likes-top/4", {
      params: {
        revistaId: 3,
        inicio: "2026-03-01T00:00:00",
        fin: "2026-03-08T23:59:59",
      },
    });
    expect(result).toEqual(mockResponse);
  });

  it("getReportePagosEditor hace GET correcto con params", async () => {
    const mockResponse = [{ sumaMontoTotal: 137.5 }];
    http.get.mockResolvedValue({ data: mockResponse });

    const result = await getReportePagosEditor(4, {
      revistaId: 6,
      inicio: "2026-03-01",
      fin: "2026-03-08",
    });

    expect(http.get).toHaveBeenCalledWith("/v1/reportes-editor/pagos/4", {
      params: {
        revistaId: 6,
        inicio: "2026-03-01",
        fin: "2026-03-08",
      },
    });
    expect(result).toEqual(mockResponse);
  });

  it("getReportePagosEditor omite revistaId si es null", async () => {
    http.get.mockResolvedValue({ data: [] });

    await getReportePagosEditor(4, {
      revistaId: null,
      fin: "2026-03-08",
    });

    expect(http.get).toHaveBeenCalledWith("/v1/reportes-editor/pagos/4", {
      params: {
        fin: "2026-03-08",
      },
    });
  });
});