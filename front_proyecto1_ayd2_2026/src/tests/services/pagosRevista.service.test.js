import { describe, it, expect, vi, beforeEach } from "vitest";
import http from "../../api/http";
import {
  getPagosByRevistaId,
  getPagosByEditorId,
  procesarPagoRevista,
  updatePagoRevistaFechaFin,
} from "../../services/pagosRevista.service";

vi.mock("../../api/http", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
  },
}));

describe("pagosRevista.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("getPagosByRevistaId hace GET a /v1/pagos-revista/revista/{revistaId} y retorna data", async () => {
    const revistaId = 3;

    const mockResponse = [
      {
        id: 1,
        revistaId: 3,
        editorId: 4,
        monto: 22.0,
        fechaPago: "2026-03-05",
        periodoInicio: "2026-03-03",
        periodoFin: "2026-03-04",
      },
    ];

    http.get.mockResolvedValue({ data: mockResponse });

    const result = await getPagosByRevistaId(revistaId);

    expect(http.get).toHaveBeenCalledWith("/v1/pagos-revista/revista/3");
    expect(result).toEqual(mockResponse);
  });

  it("getPagosByEditorId hace GET a /v1/pagos-revista/editor/{editorId} y retorna data", async () => {
    const editorId = 4;

    const mockResponse = [
      {
        id: 1,
        revistaId: 3,
        editorId: 4,
        monto: 22.0,
      },
      {
        id: 2,
        revistaId: 5,
        editorId: 4,
        monto: 150.0,
      },
    ];

    http.get.mockResolvedValue({ data: mockResponse });

    const result = await getPagosByEditorId(editorId);

    expect(http.get).toHaveBeenCalledWith("/v1/pagos-revista/editor/4");
    expect(result).toEqual(mockResponse);
  });

  it("procesarPagoRevista hace POST a /v1/pagos-revista/procesar?carteraId={carteraId} y retorna data", async () => {
    const carteraId = 9;

    const payload = {
      revistaId: 3,
      editorId: 4,
      monto: 60.5,
      periodoInicio: "2026-03-02",
      periodoFin: "2026-03-03",
    };

    const mockResponse = {
      id: 10,
      ...payload,
      fechaPago: "2026-03-08",
    };

    http.post.mockResolvedValue({ data: mockResponse });

    const result = await procesarPagoRevista(payload, carteraId);

    expect(http.post).toHaveBeenCalledWith(
      "/v1/pagos-revista/procesar?carteraId=9",
      payload
    );
    expect(result).toEqual(mockResponse);
  });

  it("updatePagoRevistaFechaFin hace PATCH a /v1/pagos-revista/{pagoId}/fecha-fin con params y retorna data", async () => {
    const pagoId = 7;
    const fechaFin = "2026-03-20";

    const mockResponse = {
      id: 7,
      fechaFin: "2026-03-20",
    };

    http.patch.mockResolvedValue({ data: mockResponse });

    const result = await updatePagoRevistaFechaFin(pagoId, fechaFin);

    expect(http.patch).toHaveBeenCalledWith(
      "/v1/pagos-revista/7/fecha-fin",
      null,
      {
        params: { fechaFin: "2026-03-20" },
      }
    );
    expect(result).toEqual(mockResponse);
  });
});