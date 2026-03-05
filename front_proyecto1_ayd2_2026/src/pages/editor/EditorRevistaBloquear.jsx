// src/pages/editor/EditorRevistaBloqueosPage.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getUser, getCartera } from "../../auth/authService";

import {
  getBloqueoActivoByRevistaId,
  getHistorialBloqueosByRevistaId,
  contratarBloqueo,
  actualizarFechaFinBloqueo,
} from "../../services/bloqueosAnuncios.service";

import { getPrecioBloqueoByRevistaId } from "../../services/precioBloqueo.service";

/* ---------------- helpers ---------------- */

function formatDateTime(dt) {
  if (!dt) return "—";
  const s = String(dt).replace("T", " ");
  return s.length > 16 ? s.slice(0, 16) : s;
}

/**
 * Convierte input datetime-local ("YYYY-MM-DDTHH:mm") a query param LocalDateTime ("YYYY-MM-DDTHH:mm:ss")
 * (Spring suele aceptar ambos, pero esto es lo más compatible)
 */
function toLocalDateTimeParam(dtLocal) {
  if (!dtLocal) return "";
  // si viene sin segundos, agregarlos
  return dtLocal.length === 16 ? `${dtLocal}:00` : dtLocal;
}

function parseDTLocal(dtLocal) {
  // dtLocal: "YYYY-MM-DDTHH:mm" (o con segundos)
  if (!dtLocal) return null;
  const d = new Date(dtLocal);
  return Number.isNaN(d.getTime()) ? null : d;
}

/**
 * Calcula días "cobrables" a partir de datetime-local.
 * Regla: cualquier fracción de día cuenta como 1 día (ceil).
 * Ej:
 *  - 1 hora => 1 día
 *  - 1.1 días => 2 días
 */
function calcDiasDesdeHastaDT(desdeDT, hastaDT) {
  const d1 = parseDTLocal(desdeDT);
  const d2 = parseDTLocal(hastaDT);
  if (!d1 || !d2) return 0;

  const ms = d2.getTime() - d1.getTime();
  if (ms <= 0) return 0;

  const days = ms / (1000 * 60 * 60 * 24);
  return Math.max(1, Math.ceil(days));
}

export default function EditorRevistaBloqueosPage() {
  const { id } = useParams(); // /app/editor/revistas/:id/bloqueos
  const revistaId = Number(id);
  const navigate = useNavigate();

  const user = getUser();
  const editorId = user?.id;

  const cartera = getCartera();
  const carteraEditorId = cartera?.id;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });

  const [precio, setPrecio] = useState(null); // {id, revistaId, costoPorDia, adminId}
  const [activo, setActivo] = useState(null); // BloqueoAnuncioResponse o null
  const [historial, setHistorial] = useState([]);

  // form compra (datetime-local)
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");

  async function load() {
    setLoading(true);
    setMsg({ type: "", text: "" });

    try {
      const [p, a, h] = await Promise.all([
        getPrecioBloqueoByRevistaId(revistaId).catch(() => null),
        getBloqueoActivoByRevistaId(revistaId).catch(() => null),
        getHistorialBloqueosByRevistaId(revistaId).catch(() => []),
      ]);

      setPrecio(p);
      setActivo(a);
      setHistorial(h ?? []);
    } catch (e) {
      console.log(e);
      setMsg({ type: "danger", text: "No se pudo cargar la información de bloqueos." });
      setPrecio(null);
      setActivo(null);
      setHistorial([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!revistaId) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [revistaId]);

  const dias = useMemo(() => calcDiasDesdeHastaDT(desde, hasta), [desde, hasta]);

  const montoEstimado = useMemo(() => {
    const cp = Number(precio?.costoPorDia ?? 0);
    return cp > 0 ? cp * dias : 0;
  }, [precio, dias]);

  const sortedHistorial = useMemo(() => {
    const arr = [...(historial ?? [])];
    arr.sort((a, b) => (b.id ?? 0) - (a.id ?? 0));
    return arr;
  }, [historial]);

  async function onComprar(e) {
    e.preventDefault();
    setMsg({ type: "", text: "" });

    if (!editorId) {
      setMsg({ type: "danger", text: "No se detectó editorId (sesión)." });
      return;
    }

    if (!carteraEditorId) {
      setMsg({
        type: "warning",
        text: "No se detectó carteraEditorId. Guardá la cartera en sesión o traela por API.",
      });
      return;
    }

    if (!precio?.costoPorDia) {
      setMsg({
        type: "warning",
        text:
          "No podés comprar el bloqueo porque el Administrador aún no asignó el precio por día. " +
          "Comunicáte con él para que lo configure.",
      });
      return;
    }

    if (!desde || !hasta) {
      setMsg({ type: "warning", text: "Seleccioná fecha desde y fecha hasta." });
      return;
    }

    const d1 = parseDTLocal(desde);
    const d2 = parseDTLocal(hasta);
    if (!d1 || !d2) {
      setMsg({ type: "warning", text: "Fechas inválidas. Revisá el formato." });
      return;
    }
    if (d2.getTime() <= d1.getTime()) {
      setMsg({ type: "warning", text: "La fecha 'hasta' debe ser mayor que la fecha 'desde'." });
      return;
    }

    if (dias <= 0) {
      setMsg({
        type: "warning",
        text: "El rango debe ser mayor a 0. (Elegí un 'hasta' mayor que 'desde').",
      });
      return;
    }

    const ok = window.confirm(
      `¿Confirmás comprar bloqueo por ${dias} día(s)? Total estimado: Q ${montoEstimado.toFixed(2)}`
    );
    if (!ok) return;

    setSaving(true);
    try {
      await contratarBloqueo({
        revistaId,
        editorId,
        dias,
        carteraEditorId,
      });

      setMsg({ type: "success", text: "Bloqueo contratado correctamente." });
      setDesde("");
      setHasta("");
      await load();
    } catch (e) {
      console.log(e);
      setMsg({ type: "danger", text: "No se pudo contratar el bloqueo." });
    } finally {
      setSaving(false);
    }
  }

  async function onEditarFechaFin(bloqueo) {
    const actual = String(bloqueo?.fechaFin ?? "").slice(0, 16); // "YYYY-MM-DDTHH:mm"
    const nueva = window.prompt("Nueva fecha fin (YYYY-MM-DDTHH:mm)", actual);
    if (!nueva) return;

    if (nueva.length < 16 || !nueva.includes("T")) {
      setMsg({ type: "warning", text: "Formato inválido. Usá: YYYY-MM-DDTHH:mm" });
      return;
    }

    const dIni = new Date(String(bloqueo?.fechaInicio ?? ""));
    const dFin = new Date(nueva);
    if (!Number.isNaN(dIni.getTime()) && !Number.isNaN(dFin.getTime())) {
      if (dFin.getTime() <= dIni.getTime()) {
        setMsg({ type: "warning", text: "La fecha fin debe ser mayor a la fecha inicio." });
        return;
      }
    }

    const ok = window.confirm(`¿Actualizar fecha fin a ${nueva.replace("T", " ")}?`);
    if (!ok) return;

    setSaving(true);
    setMsg({ type: "", text: "" });

    try {
      await actualizarFechaFinBloqueo(bloqueo.id, toLocalDateTimeParam(nueva));
      setMsg({ type: "success", text: "Fecha fin actualizada." });
      await load();
    } catch (e) {
      console.log(e);
      setMsg({ type: "danger", text: "No se pudo actualizar la fecha fin." });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="alert alert-info d-flex align-items-center gap-2">
        <div className="spinner-border spinner-border-sm" />
        <span>Cargando bloqueos...</span>
      </div>
    );
  }

  const hayPrecio = !!precio?.costoPorDia;
  const libre = !!activo; // si hay bloqueo activo => libre anuncios

  return (
    <div className="container-fluid p-0" style={{ maxWidth: 1100 }}>
      <div className="d-flex align-items-start justify-content-between mb-3">
        <div>
          <h1 className="h5 mb-0">Pagos de bloqueos de anuncios</h1>
          <div className="text-muted small">
            Revista ID: <b>#{revistaId}</b> • Estado:{" "}
            <span className={`badge ${libre ? "text-bg-dark" : "text-bg-warning"}`}>
              {libre ? "LIBRE DE ANUNCIOS" : "CONTIENE ANUNCIOS"}
            </span>
          </div>
        </div>

        <div className="d-flex gap-2">
          <button className="btn btn-outline-secondary" onClick={() => navigate(-1)}>
            <i className="bi bi-arrow-left me-1" />
            Volver
          </button>
          <button className="btn btn-outline-secondary" onClick={load} disabled={saving}>
            <i className="bi bi-arrow-clockwise me-1" />
            Refrescar
          </button>
        </div>
      </div>

      {msg.text && <div className={`alert alert-${msg.type}`}>{msg.text}</div>}

      {/* Precio por día */}
      <div className="card shadow-sm mb-3">
        <div className="card-body">
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
            <div className="fw-semibold">
              <i className="bi bi-cash-coin me-2" />
              Precio de bloqueo por día
            </div>

            {hayPrecio ? (
              <span className="badge text-bg-success">Q {Number(precio.costoPorDia).toFixed(2)} / día</span>
            ) : (
              <span className="badge text-bg-secondary">No configurado</span>
            )}
          </div>

          {!hayPrecio && (
            <div className="alert alert-warning mt-3 mb-0">
              No podés comprar el bloqueo porque el <b>Administrador</b> aún no configuró el precio por día.
              <br />
              Comunicate con él para que lo asigne en la revista.
            </div>
          )}
        </div>
      </div>

      {/* Bloqueo activo */}
      <div className="card shadow-sm mb-3">
        <div className="card-body">
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
            <div className="fw-semibold">
              <i className="bi bi-shield-check me-2" />
              Bloqueo activo
            </div>

            {activo ? <span className="badge text-bg-dark">LIBRE DE ANUNCIOS</span> : <span className="badge text-bg-warning">CONTIENE ANUNCIOS</span>}
          </div>

          <div className="mt-2">
            {activo ? (
              <div className="d-flex flex-wrap gap-2 align-items-center">
                <span className="badge text-bg-light border">
                  <b>{activo.dias}</b> día(s)
                </span>
                <span className="badge text-bg-light border">
                  Monto: <b>Q {Number(activo.monto ?? 0).toFixed(2)}</b>
                </span>
                <span className="text-muted small">
                  Inicio: {formatDateTime(activo.fechaInicio)} • Fin: {formatDateTime(activo.fechaFin)}
                </span>
              </div>
            ) : (
              <div className="text-muted">No hay un bloqueo activo en este momento.</div>
            )}
          </div>
        </div>
      </div>

      {/* Comprar bloqueo */}
      <div className="card shadow-sm mb-3">
        <div className="card-body">
          <div className="fw-semibold mb-2">
            <i className="bi bi-bag-check me-2" />
            Comprar bloqueo de anuncios
          </div>

          <form className="row g-3" onSubmit={onComprar}>
            <div className="col-12 col-md-4">
              <label className="form-label">Desde</label>
              <input
                className="form-control"
                type="datetime-local"
                value={desde}
                onChange={(e) => setDesde(e.target.value)}
              />
            </div>

            <div className="col-12 col-md-4">
              <label className="form-label">Hasta</label>
              <input
                className="form-control"
                type="datetime-local"
                value={hasta}
                onChange={(e) => setHasta(e.target.value)}
              />
              {desde && hasta && parseDTLocal(desde) && parseDTLocal(hasta) && parseDTLocal(hasta).getTime() <= parseDTLocal(desde).getTime() && (
                <div className="form-text text-danger">La fecha "hasta" debe ser mayor que "desde".</div>
              )}
            </div>

            <div className="col-12 col-md-4 d-flex align-items-end justify-content-end">
              <button
                className="btn btn-primary"
                disabled={saving || !hayPrecio || !desde || !hasta || dias <= 0}
              >
                {saving ? "Procesando..." : "Comprar bloqueo"}
              </button>
            </div>

            <div className="col-12">
              <div className="d-flex flex-wrap gap-2 align-items-center">
                <span className="badge text-bg-light border">
                  Días calculados: <b>{dias}</b>
                </span>

                <span className="badge text-bg-light border">
                  Total estimado: <b>Q {Number(montoEstimado).toFixed(2)}</b>
                </span>

                <span className="text-muted small">
                  (Se cobra por día: cualquier fracción cuenta como 1 día.)
                </span>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Historial */}
      <div className="card shadow-sm">
        <div className="card-body">
          <div className="d-flex align-items-center justify-content-between mb-2">
            <div className="fw-semibold">
              <i className="bi bi-clock-history me-2" />
              Historial de bloqueos
            </div>
            <div className="text-muted small">Registros: {sortedHistorial.length}</div>
          </div>

          <div className="table-responsive">
            <table className="table table-sm align-middle">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Días</th>
                  <th>Inicio</th>
                  <th>Fin</th>
                  <th>Monto</th>
                  <th>Estado</th>
                  <th>Transacción</th>
                  <th className="text-end">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {sortedHistorial.map((b) => (
                  <tr key={b.id}>
                    <td>{b.id}</td>
                    <td className="fw-semibold">{b.dias}</td>
                    <td>{formatDateTime(b.fechaInicio)}</td>
                    <td>{formatDateTime(b.fechaFin)}</td>
                    <td>Q {Number(b.monto ?? 0).toFixed(2)}</td>
                    <td>
                      <span
                        className={`badge ${
                          String(b.estado ?? "").toUpperCase() === "ACTIVO" ? "text-bg-success" : "text-bg-secondary"
                        }`}
                      >
                        {String(b.estado ?? "—").toUpperCase()}
                      </span>
                    </td>
                    <td>{b.transaccionId ?? "—"}</td>

                    <td className="text-end">
                      {String(b.estado ?? "").toUpperCase() === "ACTIVO" ? (
                        <button
                          className="btn btn-sm btn-outline-primary"
                          onClick={() => onEditarFechaFin(b)}
                          disabled={saving}
                          title="Editar fecha fin"
                        >
                          <i className="bi bi-pencil-square me-1"></i>
                          Editar fin
                        </button>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </td>
                  </tr>
                ))}

                {sortedHistorial.length === 0 && (
                  <tr>
                    <td colSpan={8} className="text-muted">
                      No hay bloqueos registrados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="form-text">
            Si existe un bloqueo con estado <code>ACTIVO</code>, la revista se considera <b>LIBRE DE ANUNCIOS</b>.
          </div>
        </div>
      </div>
    </div>
  );
}