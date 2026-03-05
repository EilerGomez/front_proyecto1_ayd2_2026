import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getPeriodoById } from "../../services/periodos.service";
import { getPreciosAnuncio } from "../../services/preciosAnuncio.service";

export default function PeriodoDetallePage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [periodo, setPeriodo] = useState(null);

  const [precios, setPrecios] = useState([]);
  const [loadingPrecios, setLoadingPrecios] = useState(false);
  const [errorPrecios, setErrorPrecios] = useState("");

  useEffect(() => {
    loadPeriodo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function loadPeriodo() {
    const data = await getPeriodoById(id);
    setPeriodo(data);
  }

  useEffect(() => {
    if (!periodo?.id) return;
    loadPrecios();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [periodo?.id]);

  async function loadPrecios() {
    setLoadingPrecios(true);
    setErrorPrecios("");
    try {
      const all = await getPreciosAnuncio();
      setPrecios(all ?? []);
    } catch (e) {
      console.error(e);
      setErrorPrecios("No se pudieron cargar los precios.");
    } finally {
      setLoadingPrecios(false);
    }
  }

  const preciosDelPeriodo = useMemo(() => {
    const pid = Number(periodo?.id);
    return (precios ?? []).filter((p) => Number(p?.periodoAnuncio?.id) === pid);
  }, [precios, periodo]);

  if (!periodo) return <p className="mt-4 container">Cargando...</p>;

  return (
    <div className="container mt-4">
      {/* BOTÓN REGRESAR */}
      <button
        className="btn btn-outline-secondary mb-3"
        onClick={() => navigate(-1)}
      >
        <i className="bi bi-arrow-left me-2"></i>
        Regresar
      </button>

      <h3>Detalle del Período</h3>

      <div className="card p-3 mb-4">
        <p>
          <strong>ID:</strong> {periodo.id}
        </p>
        <p>
          <strong>Código:</strong> {periodo.codigo}
        </p>
        <p>
          <strong>Días:</strong> {periodo.dias}
        </p>
      </div>

      <h4 className="mb-2">Precios de este período</h4>

      {loadingPrecios ? (
        <p>Cargando precios...</p>
      ) : errorPrecios ? (
        <div className="alert alert-danger">{errorPrecios}</div>
      ) : (
        <table className="table table-bordered align-middle">
          <thead className="table-light">
            <tr>
              <th>ID</th>
              <th>Tipo anuncio</th>
              <th>Precio</th>
              <th>Activo</th>
              <th>Admin</th>
            </tr>
          </thead>
          <tbody>
            {preciosDelPeriodo.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center text-muted">
                  No hay precios registrados para este período.
                </td>
              </tr>
            ) : (
              preciosDelPeriodo.map((p) => (
                <tr key={p.id}>
                  <td>{p.id}</td>
                  <td>
                    {p.tipoAnuncio?.codigo ?? "—"}{" "}
                    <span className="text-muted">
                      {p.tipoAnuncio?.descripcion ? `- ${p.tipoAnuncio.descripcion}` : ""}
                    </span>
                  </td>
                  <td>Q {p.precio}</td>
                  <td>
                    {p.activo ? (
                      <span className="badge bg-success">Vigente</span>
                    ) : (
                      <span className="badge bg-secondary">Inactivo</span>
                    )}
                  </td>
                  <td>{p.admin?.nombre ?? "—"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}