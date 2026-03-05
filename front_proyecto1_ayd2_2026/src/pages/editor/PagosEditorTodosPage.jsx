import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getUser, getCartera } from "../../auth/authService";
import { getPagosByEditorId } from "../../services/pagosRevista.service";

function formatDate(d) {
  if (!d) return "";
  return String(d).slice(0, 10);
}

export default function PagosEditorTodosPage() {
  const navigate = useNavigate();
  const user = getUser();
  const editorId = user?.id;
  const carteraLS = getCartera();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState({ type: "", text: "" });

  const [revistaId, setRevistaId] = useState("");
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");

  async function load() {
    setLoading(true);
    setMsg({ type: "", text: "" });

    try {
      if (!editorId) return;
      const data = await getPagosByEditorId(editorId);
      setItems(data ?? []);
    } catch (e) {
      console.log(e);
      setMsg({ type: "danger", text: "No se pudieron cargar los pagos del editor." });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editorId]);

  const filtered = useMemo(() => {
    const rid = revistaId ? Number(revistaId) : null;
    const d1 = desde ? new Date(desde + "T00:00:00").getTime() : null;
    const d2 = hasta ? new Date(hasta + "T23:59:59").getTime() : null;

    return (items ?? []).filter((p) => {
      const matchRevista = !rid || Number(p.revistaId) === rid;

      const fp = p.fechaPago ? new Date(formatDate(p.fechaPago) + "T00:00:00").getTime() : null;
      const matchDesde = !d1 || (fp != null && fp >= d1);
      const matchHasta = !d2 || (fp != null && fp <= d2);

      return matchRevista && matchDesde && matchHasta;
    });
  }, [items, revistaId, desde, hasta]);

  const total = useMemo(() => {
    return filtered.reduce((acc, x) => acc + Number(x.monto ?? 0), 0);
  }, [filtered]);

  return (
    <div className="container-fluid p-0" style={{ maxWidth: 1200 }}>
      <div className="d-flex align-items-start justify-content-between mb-3">
        <div>
          <h1 className="h5 mb-0">Todos mis pagos</h1>
          <div className="text-muted small">Pagos procesados en todas tus revistas.</div>
        </div>

        <div className="d-flex gap-2">
          <button className="btn btn-outline-secondary" onClick={() => navigate(-1)}>
            <i className="bi bi-arrow-left me-1"></i>Volver
          </button>
          <button className="btn btn-outline-secondary" onClick={load} disabled={loading}>
            <i className="bi bi-arrow-clockwise me-1"></i>
            {loading ? "Actualizando..." : "Refrescar"}
          </button>
        </div>
      </div>

      {/* filtros */}
      <div className="card shadow-sm mb-3">
        <div className="card-body">
          <div className="row g-2 align-items-end">
            <div className="col-12 col-md-3">
              <label className="form-label mb-1">Revista ID</label>
              <input
                className="form-control"
                value={revistaId}
                onChange={(e) => setRevistaId(e.target.value)}
                placeholder="Ej: 12"
              />
            </div>

            <div className="col-12 col-md-3">
              <label className="form-label mb-1">Desde</label>
              <input
                type="date"
                className="form-control"
                value={desde}
                onChange={(e) => setDesde(e.target.value)}
              />
            </div>

            <div className="col-12 col-md-3">
              <label className="form-label mb-1">Hasta</label>
              <input
                type="date"
                className="form-control"
                value={hasta}
                onChange={(e) => setHasta(e.target.value)}
              />
            </div>

            <div className="col-12 col-md-3 d-flex gap-2">
              <button
                className="btn btn-outline-secondary w-100"
                onClick={() => {
                  setRevistaId("");
                  setDesde("");
                  setHasta("");
                }}
              >
                <i className="bi bi-x-circle me-1"></i>
                Reset
              </button>
            </div>
          </div>

          <div className="text-muted small mt-2">
            Mostrando <b>{filtered.length}</b> de <b>{items.length}</b> • Total:{" "}
            <b>{total.toFixed(2)} {carteraLS?.moneda ?? "GTQ"}</b>
          </div>
        </div>
      </div>

      {loading && (
        <div className="alert alert-info d-flex align-items-center gap-2">
          <div className="spinner-border spinner-border-sm" />
          <span>Cargando pagos...</span>
        </div>
      )}

      {msg.text && <div className={`alert alert-${msg.type}`}>{msg.text}</div>}

      {!loading && !msg.text && items.length === 0 && (
        <div className="alert alert-secondary">No hay pagos registrados.</div>
      )}

      {!loading && !msg.text && items.length > 0 && filtered.length === 0 && (
        <div className="alert alert-secondary">No hay resultados con esos filtros.</div>
      )}

      {!loading && filtered.length > 0 && (
        <div className="card shadow-sm">
          <div className="card-body">
            <div className="table-responsive">
              <table className="table table-sm align-middle">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Revista</th>
                    <th>Fecha pago</th>
                    <th>Periodo</th>
                    <th className="text-end">Monto</th>
                    <th className="text-end">Transacción</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((p) => (
                    <tr key={p.id}>
                      <td className="fw-semibold">{p.id}</td>
                      <td>
                        <span className="badge text-bg-light border">#{p.revistaId}</span>
                      </td>
                      <td className="text-muted">{formatDate(p.fechaPago)}</td>
                      <td className="text-muted">
                        {formatDate(p.periodoInicio)} <span className="mx-1">→</span>{" "}
                        {formatDate(p.periodoFin)}
                      </td>
                      <td className="text-end fw-semibold">
                        {Number(p.monto ?? 0).toFixed(2)} {carteraLS?.moneda ?? "GTQ"}
                      </td>
                      <td className="text-end text-muted">{p.transaccionId ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="text-muted small mt-2">
              Total filtrado: <b>{total.toFixed(2)} {carteraLS?.moneda ?? "GTQ"}</b>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}