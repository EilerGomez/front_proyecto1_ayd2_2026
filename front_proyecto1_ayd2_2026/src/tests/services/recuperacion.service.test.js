import { describe, it, expect, vi, beforeEach } from "vitest";
import http from "../../api/http";
import {
  solicitarRecuperacion,
  validarCodigoRecuperacion,
  cambiarContraseniaRecuperacion,
} from "../../services/recuperacion.service";

vi.mock("../../api/http", () => ({
  default: {
    post: vi.fn(),
    patch: vi.fn(),
  },
}));

describe("recuperacion.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("solicitarRecuperacion hace POST a /v1/auth/recuperacion/solicitar con params", async () => {
    const identificador = "usuario@email.com";
    const mockResponse = "Se envió un código de recuperación";

    http.post.mockResolvedValue({ data: mockResponse });

    const result = await solicitarRecuperacion(identificador);

    expect(http.post).toHaveBeenCalledWith(
      "/v1/auth/recuperacion/solicitar",
      null,
      {
        params: { identificador: "usuario@email.com" },
      }
    );

    expect(result).toBe(mockResponse);
  });

  it("validarCodigoRecuperacion hace POST a /v1/auth/recuperacion/validar", async () => {
    const payload = {
      correo: "usuario@email.com",
      codigo: "123456",
    };

    http.post.mockResolvedValue({ data: true });

    const result = await validarCodigoRecuperacion(payload);

    expect(http.post).toHaveBeenCalledWith(
      "/v1/auth/recuperacion/validar",
      payload
    );

    expect(result).toBe(true);
  });

  it("cambiarContraseniaRecuperacion hace PATCH a /v1/auth/recuperacion/cambiar", async () => {
    const payload = {
      correo: "usuario@email.com",
      codigo: "123456",
      nuevaPassword: "NuevaPassword123",
    };

    const mockResponse = "Contraseña actualizada correctamente";

    http.patch.mockResolvedValue({ data: mockResponse });

    const result = await cambiarContraseniaRecuperacion(payload);

    expect(http.patch).toHaveBeenCalledWith(
      "/v1/auth/recuperacion/cambiar",
      payload
    );

    expect(result).toBe(mockResponse);
  });
});