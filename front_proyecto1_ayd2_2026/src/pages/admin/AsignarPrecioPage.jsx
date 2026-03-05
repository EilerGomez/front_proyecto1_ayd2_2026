import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { getUser } from "../../auth/authService";
import { getTiposAnuncio } from "../../services/tiposAnuncio.service";
import { getPeriodos } from "../../services/periodos.service";
import {
  getPreciosPorTipo,
  createPrecioAnuncio,
  desactivarPrecioAnuncio,
} from "../../services/preciosAnuncio.service";

export default function AsignarPrecioPage() {
  const navigate = useNavigate();

  // ✅ Si vienes desde PeriodosPage con:
  // /app/admin/precios/periodo/:periodoId
  const { periodoId: periodoFromUrl } = useParams();

  const adminId = getUser()?.id;

  const [tipos, setTipos] = useState([]);
  const [periodos, setPeriodos] = useState([]);

  const [tipoId, setTipoId] = useState("");
  const [periodoId, setPeriodoId] = useState(periodoFromUrl ? Number(periodoFromUrl) : "");
  const [nuevoPrecio, setNuevoPrecio] = useState("");

  const [precios, setPrecios] = useState([]);
  const [loading, setLoading] = useState(false);

  const tipoSeleccionado = useMemo(
    () => tipos.find((t) => t.id === Number(tipoId)),
    [tipos, tipoId]
  );

  const periodoSeleccionado = useMemo(
    () => periodos.find((p) => p.id === Number(periodoId)),
    [periodos, periodoId]
  );

  // 1) cargar combos
  useEffect(() => {
    (async () => {
      try {
        const [t, p] = await Promise.all([getTiposAnuncio(), getPeriodos()]);
        setTipos(t);
        setPeriodos(p);
      } catch (e) {
        console.error(e);
        alert("No se pudieron cargar tipos o periodos.");
      }
    })();
  }, []);

  // 2) cuando cambia tipo, traer precios de ese tipo
  useEffect(() => {
    if (!tipoId) {
      setPrecios([]);
      return;
    }
    loadPreciosPorTipo(tipoId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tipoId]);

  async function loadPreciosPorTipo(tid) {
    setLoading(true);
    try {
      const data = await getPreciosPorTipo(tid);
      setPrecios(data ?? []);
    } catch (e) {
      console.error(e);
      alert("No se pudieron cargar los precios para el tipo seleccionado.");
      setPrecios([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleCrearPrecio() {
    if (!adminId) {
      alert("No se encontró el adminId en sesión. Vuelve a iniciar sesión.");
      return;
    }
    if (!tipoId) {
      alert("Selecciona un tipo de anuncio.");
      return;
    }
    if (!periodoId) {
      alert("Selecciona un período.");
      return;
    }
    if (!nuevoPrecio || Number(nuevoPrecio) <= 0) {
      alert("Ingresa un precio válido.");
      return;
    }

    const payload = {
      tipoAnuncioId: Number(tipoId),
      periodoId: Number(periodoId),
      precio: Number(nuevoPrecio),
      adminId: Number(adminId),
    };

    try {
      await createPrecioAnuncio(payload);
      setNuevoPrecio("");
      await loadPreciosPorTipo(tipoId);
      alert("Precio creado correctamente.");
    } catch (e) {
      console.error(e);
      alert("No se pudo crear el precio. Revisa consola / backend.");
    }
  }

  async function handleDesactivar(id) {
    if (!window.confirm("¿Seguro que deseas desactivar este precio?")) return;
    try {
      await desactivarPrecioAnuncio(id);
      await loadPreciosPorTipo(tipoId);
    } catch (e) {
      console.error(e);
      alert("No se pudo desactivar el precio.");
    }
  }

  return (
    <div className="container mt-4">
      {/* REGRESAR */}
      <button
        className="btn btn-outline-secondary mb-3"
        onClick={() => navigate("/app/admin/periodos")}
      >
        <i className="bi bi-arrow-left me-2"></i>
        Regresar
      </button>

      <h2 className="mb-3">
        Asignar precio{" "}
        {tipoSeleccionado ? `— ${tipoSeleccionado.codigo}` : ""}
        {periodoSeleccionado ? ` — ${periodoSeleccionado.codigo}` : ""}
      </h2>

      {/* FORM */}
      <div className="card p-3 mb-4">
        <div className="row g-3 align-items-end">
          <div className="col-12 col-md-4">
            <label className="form-label">Tipo de anuncio</label>
            <select
              className="form-select"
              value={tipoId}
              onChange={(e) => setTipoId(e.target.value ? Number(e.target.value) : "")}
            >
              <option value="">-- Selecciona --</option>
              {tipos.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.codigo} - {t.descripcion}
                </option>
              ))}
            </select>
          </div>

          <div className="col-12 col-md-4">
            <label className="form-label">Período</label>
            <select
              className="form-select"
              value={periodoId}
              onChange={(e) => setPeriodoId(e.target.value ? Number(e.target.value) : "")}
              disabled
            >
              <option value="">-- Selecciona --</option>
              {periodos.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.codigo} ({p.dias} días)
                </option>
              ))}
            </select>
            {periodoFromUrl && (
              <div className="form-text">
                Período precargado desde la lista.
              </div>
            )}
          </div>

          <div className="col-12 col-md-2">
            <label className="form-label">Precio (Q)</label>
            <input
              type="number"
              className="form-control"
              min="0"
              step="0.01"
              placeholder="Ej: 25.00"
              value={nuevoPrecio}
              onChange={(e) => setNuevoPrecio(e.target.value)}
            />
          </div>

          <div className="col-12 col-md-2 d-grid">
            <button className="btn btn-primary" onClick={handleCrearPrecio}>
              <i className="bi bi-save me-2"></i>
              Guardar
            </button>
          </div>
        </div>
      </div>

      {/* TABLA */}
      <h4 className="mb-2">
        Historial de precios {tipoSeleccionado ? `— ${tipoSeleccionado.codigo}` : ""}
      </h4>

      {loading ? (
        <p>Cargando precios...</p>
      ) : (
        <table className="table table-bordered align-middle">
          <thead className="table-light">
            <tr>
              <th>ID</th>
              <th>Periodo</th>
              <th>Precio</th>
              <th>Activo</th>
              <th style={{ width: 160 }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {precios.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center text-muted">
                  Selecciona un tipo de anuncio para ver precios.
                </td>
              </tr>
            ) : (
              precios.map((p) => (
                <tr key={p.id}>
                  <td>{p.id}</td>
                  <td>{p.periodoAnuncio?.codigo ?? "—"}</td>
                  <td>Q {p.precio}</td>
                  <td>
                    {p.activo ? (
                      <span className="badge bg-success">Vigente</span>
                    ) : (
                      <span className="badge bg-secondary">Inactivo</span>
                    )}
                  </td>
                  <td>
                    {p.activo ? (
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() => handleDesactivar(p.id)}
                      >
                        Desactivar
                      </button>
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}