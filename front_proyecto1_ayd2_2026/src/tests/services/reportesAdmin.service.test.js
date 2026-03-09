import { describe, it, expect, vi, beforeEach } from "vitest";
import http from "../../api/http";
import {
  getReporteGanancias,
  getReporteAnunciosComprados,
  getReporteGananciasAnunciantes,
  getReporteTopRevistas,
  getReporteTopComentadas,
  getReporteEfectividadAnuncios,
} from "../../services/reportesAdmin.service";

vi.mock("../../api/http", () => ({
  default: {
    get: vi.fn(),
  },
}));

describe("reportesAdmin.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("getReporteGanancias hace GET a /v1/reportes-admin/ganancias con params", async () => {
    const mockResponse = { totalGanancias: 1000 };
    http.get.mockResolvedValue({ data: mockResponse });

    const result = await getReporteGanancias({
      inicio: "2026-03-01",
      fin: "2026-03-08",
    });

    expect(http.get).toHaveBeenCalledWith("/v1/reportes-admin/ganancias", {
      params: {
        inicio: "2026-03-01",
        fin: "2026-03-08",
      },
    });
    expect(result).toEqual(mockResponse);
  });

  it("getReporteGanancias omite params vacíos", async () => {
    http.get.mockResolvedValue({ data: {} });

    await getReporteGanancias({});

    expect(http.get).toHaveBeenCalledWith("/v1/reportes-admin/ganancias", {
      params: {},
    });
  });

  it("getReporteAnunciosComprados hace GET con tipo, inicio y fin", async () => {
    const mockResponse = [{ id: 1 }];
    http.get.mockResolvedValue({ data: mockResponse });

    const result = await getReporteAnunciosComprados({
      tipo: "VIDEO",
      inicio: "2026-03-01T00:00:00",
      fin: "2026-03-08T23:59:59",
    });

    expect(http.get).toHaveBeenCalledWith("/v1/reportes-admin/anuncios-comprados", {
      params: {
        tipo: "VIDEO",
        inicio: "2026-03-01T00:00:00",
        fin: "2026-03-08T23:59:59",
      },
    });
    expect(result).toEqual(mockResponse);
  });

  it("getReporteGananciasAnunciantes hace GET con anuncianteId, inicio y fin", async () => {
    const mockResponse = { totalGeneralIngresos: 398 };
    http.get.mockResolvedValue({ data: mockResponse });

    const result = await getReporteGananciasAnunciantes({
      anuncianteId: 5,
      inicio: "2026-03-01T00:00:00",
      fin: "2026-03-08T23:59:59",
    });

    expect(http.get).toHaveBeenCalledWith("/v1/reportes-admin/ganancias-anunciantes", {
      params: {
        anuncianteId: 5,
        inicio: "2026-03-01T00:00:00",
        fin: "2026-03-08T23:59:59",
      },
    });
    expect(result).toEqual(mockResponse);
  });

  it("getReporteGananciasAnunciantes no manda anuncianteId si viene vacío", async () => {
    http.get.mockResolvedValue({ data: {} });

    await getReporteGananciasAnunciantes({
      anuncianteId: "",
      inicio: "2026-03-01T00:00:00",
    });

    expect(http.get).toHaveBeenCalledWith("/v1/reportes-admin/ganancias-anunciantes", {
      params: {
        inicio: "2026-03-01T00:00:00",
      },
    });
  });

  it("getReporteTopRevistas hace GET a /v1/reportes-admin/top-revistas con params", async () => {
    const mockResponse = { topRevistas: [] };
    http.get.mockResolvedValue({ data: mockResponse });

    const result = await getReporteTopRevistas({
      inicio: "2026-03-01",
      fin: "2026-03-08",
    });

    expect(http.get).toHaveBeenCalledWith("/v1/reportes-admin/top-revistas", {
      params: {
        inicio: "2026-03-01",
        fin: "2026-03-08",
      },
    });
    expect(result).toEqual(mockResponse);
  });

  it("getReporteTopComentadas hace GET a /v1/reportes-admin/top-comentadas con params", async () => {
    const mockResponse = { topRevistas: [] };
    http.get.mockResolvedValue({ data: mockResponse });

    const result = await getReporteTopComentadas({
      inicio: "2026-03-01T00:00:00",
      fin: "2026-03-08T23:59:59",
    });

    expect(http.get).toHaveBeenCalledWith("/v1/reportes-admin/top-comentadas", {
      params: {
        inicio: "2026-03-01T00:00:00",
        fin: "2026-03-08T23:59:59",
      },
    });
    expect(result).toEqual(mockResponse);
  });

  it("getReporteEfectividadAnuncios hace GET a /v1/reportes-admin/efectividad-anuncios con params", async () => {
    const mockResponse = { anunciantes: [] };
    http.get.mockResolvedValue({ data: mockResponse });

    const result = await getReporteEfectividadAnuncios({
      inicio: "2026-03-01T00:00:00",
      fin: "2026-03-08T23:59:59",
    });

    expect(http.get).toHaveBeenCalledWith("/v1/reportes-admin/efectividad-anuncios", {
      params: {
        inicio: "2026-03-01T00:00:00",
        fin: "2026-03-08T23:59:59",
      },
    });
    expect(result).toEqual(mockResponse);
  });
});