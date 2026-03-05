import { useEffect, useState } from "react";
import { getUser, updateCarteraInStorage, getCartera } from "../auth/authService";
import { getCarteraByUsuarioId, recargarCartera } from "../services/cartera.service";

export default function BilleteraPage() {
  const user = getUser();
  const usuarioId = user?.id;

  const carteraLS = getCartera();

  const [cartera, setCartera] = useState(carteraLS);
  const [loading, setLoading] = useState(true);

  const [monto, setMonto] = useState("");
  const [saving, setSaving] = useState(false);

  const [msg, setMsg] = useState({ type: "", text: "" });

  async function refresh() {
    if (!usuarioId) return;
    setMsg({ type: "", text: "" });
    setLoading(true);
    try {
      const data = await getCarteraByUsuarioId(usuarioId);
      setCartera(data);
      updateCarteraInStorage(data);
    } catch (e) {
      console.log(e);
      setMsg({ type: "warning", text: "No se pudo cargar la billetera desde el servidor." });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usuarioId]);

  async function onRecargar(e) {
    e.preventDefault();
    setMsg({ type: "", text: "" });

    const n = Number(monto);
    if (!n || n <= 0) {
      setMsg({ type: "danger", text: "Ingresá un monto válido (mayor a 0)." });
      return;
    }

    setSaving(true);
    try {
      await recargarCartera(usuarioId, n);
      setMonto("");
      await refresh();
      setMsg({ type: "success", text: "Recarga aplicada. Billetera actualizada." });
    } catch (e) {
      console.log(e);
      setMsg({ type: "danger", text: "No se pudo recargar. Revisá permisos o el servidor." });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="d-flex align-items-center justify-content-between mb-3">
        <div>
          <h1 className="h4 mb-0">Billetera</h1>
          <div className="text-muted small">Saldo disponible y recargas</div>
        </div>

        <button className="btn btn-outline-primary btn-sm" onClick={refresh} disabled={loading}>
          <i className="bi bi-arrow-repeat me-1"></i>
          Actualizar
        </button>
      </div>

      {msg.text && <div className={`alert alert-${msg.type}`}>{msg.text}</div>}

      {loading ? (
        <div className="alert alert-info d-flex align-items-center gap-2">
          <div className="spinner-border spinner-border-sm" />
          <span>Cargando billetera...</span>
        </div>
      ) : (
        <div className="row g-3">
          <div className="col-12 col-lg-6">
            <div className="card shadow-sm">
              <div className="card-body">
                <div className="d-flex align-items-center justify-content-between">
                  <div>
                    <div className="text-muted small">Saldo</div>
                    <div className="display-6 fw-bold mb-0">
                      {Number(cartera?.saldo ?? 0).toFixed(2)}{" "}
                      <span className="fs-5 text-muted">{cartera?.moneda ?? "GTQ"}</span>
                    </div>
                  </div>
                  <div className="rounded-circle bg-light border d-flex align-items-center justify-content-center"
                       style={{ width: 56, height: 56 }}>
                    <i className="bi bi-wallet2" style={{ fontSize: 26 }}></i>
                  </div>
                </div>

                <hr />

                <div className="text-muted small">
                  Usuario: <span className="fw-semibold">{user?.username ?? "-"}</span>
                </div>
                <div className="text-muted small">
                  Creación: <span className="fw-semibold">{cartera?.fechaCreacion ?? "-"}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="col-12 col-lg-6">
            <form className="card shadow-sm" onSubmit={onRecargar}>
              <div className="card-body">
                <h2 className="h6">Recargar</h2>
                <div className="text-muted small mb-3">
                  Enviar un monto para aumentar el saldo.
                </div>

                <label className="form-label">Monto</label>
                <input
                  className="form-control"
                  inputMode="decimal"
                  placeholder="Ej: 100.00"
                  value={monto}
                  onChange={(e) => setMonto(e.target.value)}
                />

                <div className="d-flex justify-content-end mt-3">
                  <button className="btn btn-primary" disabled={saving}>
                    {saving ? "Procesando..." : "Recargar"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}