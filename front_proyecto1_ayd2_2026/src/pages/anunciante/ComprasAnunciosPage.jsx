import { useEffect, useMemo, useState } from "react";
import { getUser } from "../../auth/authService";
import { getComprasByAnuncianteId } from "../../services/comprasAnuncio.service";

function formatDateTime(dt) {
  if (!dt) return "—";
  const s = String(dt).replace("T", " ");
  return s.length > 16 ? s.slice(0, 16) : s;
}

function EstadoBadge({ estado }) {
  const e = (estado ?? "").toUpperCase();
  const cls =
    e === "ACTIVO" ? "text-bg-success" :
    e === "INACTIVO" ? "text-bg-secondary" :
    e === "EXPIRADO" ? "text-bg-warning" :
    "text-bg-dark";
  return <span className={`badge ${cls}`}>{e || "—"}</span>;
}

export default function ComprasAnunciosPage() {
  const user = getUser();
  const anuncianteId = user?.id;

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

  async function load() {
    setLoading(true);
    try {
      const data = await getComprasByAnuncianteId(anuncianteId);
      setItems(data ?? []);
    } catch (e) {
      console.error(e);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [anuncianteId]);

  const filtered = useMemo(() => {
    const query = (q ?? "").toLowerCase().trim();
    return (items ?? []).filter((c) => {
      if (!query) return true;
      return (
        String(c.id).includes(query) ||
        (c.anuncio?.tipoAnuncio?.codigo ?? "").toLowerCase().includes(query) ||
        (c.precio?.periodoAnuncio?.codigo ?? "").toLowerCase().includes(query)
      );
    });
  }, [items, q]);

  return (
    <div>
      <div className="d-flex align-items-center justify-content-between mb-3">
        <div>
          <h1 className="h4 mb-0">Mis compras de anuncios</h1>
          <div className="text-muted small">Historial de compras y períodos activos.</div>
        </div>
        <button className="btn btn-outline-secondary" onClick={load} disabled={loading}>
          <i className="bi bi-arrow-clockwise me-2" />
          {loading ? "Actualizando..." : "Refrescar"}
        </button>
      </div>

      <div className="card shadow-sm mb-3">
        <div className="card-body">
          <label className="form-label mb-1">Buscar</label>
          <div className="input-group">
            <span className="input-group-text">
              <i className="bi bi-search" />
            </span>
            <input
              className="form-control"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Ej: 12, VIDEO, 1_SEMANA..."
            />
            {q && (
              <button className="btn btn-outline-secondary" onClick={() => setQ("")}>
                Limpiar
              </button>
            )}
          </div>
          <div className="text-muted small mt-2">
            Mostrando <b>{filtered.length}</b> de <b>{items.length}</b>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="alert alert-info d-flex align-items-center gap-2">
          <div className="spinner-border spinner-border-sm" />
          <span>Cargando compras...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="alert alert-secondary">Aún no tenés compras de anuncios.</div>
      ) : (
        <div className="table-responsive">
          <table className="table table-bordered align-middle">
            <thead className="table-light">
              <tr>
                <th>ID</th>
                <th>Estado</th>
                <th>Inicio</th>
                <th>Fin</th>
                <th>Anuncio</th>
                <th>Periodo</th>
                <th>Precio</th>
                <th>Transacción</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id}>
                  <td>{c.id}</td>
                  <td><EstadoBadge estado={c.estado} /></td>
                  <td>{formatDateTime(c.fechaInicio)}</td>
                  <td>{formatDateTime(c.fechaFin)}</td>
                  <td>
                    #{c.anuncio?.id} — {c.anuncio?.tipoAnuncio?.codigo}
                  </td>
                  <td>{c.precio?.periodoAnuncio?.codigo ?? "—"}</td>
                  <td>Q {c.precio?.precio ?? "—"}</td>
                  <td>{c.transaccionId ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}