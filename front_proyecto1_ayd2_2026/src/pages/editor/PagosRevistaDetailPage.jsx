// src/pages/editor/PagosRevistaDetailPage.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getUser, getCartera, updateCarteraInStorage } from "../../auth/authService";

import { getRevistaById } from "../../services/revistas.service";
import {
  getPagosByRevistaId,
  procesarPagoRevista,
  updatePagoRevistaFechaFin,
} from "../../services/pagosRevista.service";
import { getCostoVigente } from "../../services/costosRevista.service";
import { getCarteraByUsuarioId } from "../../services/cartera.service";

function formatDate(d) {
  if (!d) return "";
  return String(d).slice(0, 10);
}

function daysBetweenInclusive(startStr, endStr) {
  const s = new Date(startStr + "T00:00:00");
  const e = new Date(endStr + "T00:00:00");
  const ms = e.getTime() - s.getTime();
  const days = Math.floor(ms / (1000 * 60 * 60 * 24)) + 1;
  return Math.max(0, days);
}

export default function PagosRevistaDetailPage() {
  const { id } = useParams(); // /app/editor/pagos-revistas/revista/:id
  const revistaId = Number(id);
  const navigate = useNavigate();

  const user = getUser();
  const editorId = user?.id;

  const carteraLS = getCartera(); // { id, saldo, moneda, ... }
  const carteraId = carteraLS?.id;

  const [revista, setRevista] = useState(null);
  const [pagos, setPagos] = useState([]);
  const [costoVigente, setCostoVigente] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });

  const [form, setForm] = useState({
    periodoInicio: "",
    periodoFin: "",
  });

  const [editFinId, setEditFinId] = useState(null);
  const [editFinValue, setEditFinValue] = useState(""); // YYYY-MM-DD
  const [savingFin, setSavingFin] = useState(false);

  async function load() {
    setLoading(true);
    setMsg({ type: "", text: "" });

    try {
      const [r, p, c] = await Promise.all([
        getRevistaById(revistaId),
        getPagosByRevistaId(revistaId),
        getCostoVigente(revistaId),
      ]);

      setRevista(r);
      setPagos(p ?? []);
      setCostoVigente(c ?? null);

      // defaults fechas: hoy y hoy
      const today = new Date();
      const yyyy = today.getFullYear();
      const mm = String(today.getMonth() + 1).padStart(2, "0");
      const dd = String(today.getDate()).padStart(2, "0");
      const nowStr = `${yyyy}-${mm}-${dd}`;

      setForm((f) => ({
        ...f,
        periodoInicio: f.periodoInicio || nowStr,
        periodoFin: f.periodoFin || nowStr,
      }));
    } catch (e) {
      console.log(e);
      setMsg({ type: "danger", text: "No se pudo cargar la información de pagos." });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!revistaId) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [revistaId]);

  const montoCalculado = useMemo(() => {
    const costo = Number(costoVigente?.costoPorDia ?? 0);
    const ini = form.periodoInicio;
    const fin = form.periodoFin;
    if (!costo || !ini || !fin) return 0;

    const days = daysBetweenInclusive(ini, fin);
    return Number((days * costo).toFixed(2));
  }, [costoVigente, form.periodoInicio, form.periodoFin]);

  function onChange(e) {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  }

  async function refreshCarteraAfterPago() {
    if (!editorId) return;
    try {
      const data = await getCarteraByUsuarioId(editorId);
      updateCarteraInStorage(data);
    } catch (e) {
      console.log("No se pudo refrescar cartera:", e);
    }
  }

  async function onProcesarPago(e) {
    e.preventDefault();
    setMsg({ type: "", text: "" });

    if (!editorId) {
      setMsg({ type: "danger", text: "No se detectó el editorId." });
      return;
    }
    if (!carteraId) {
      setMsg({ type: "danger", text: "No se detectó carteraId en tu sesión." });
      return;
    }
    if (!costoVigente?.costoPorDia) {
      setMsg({
        type: "danger",
        text: "Esta revista no tiene costo vigente asignado por el administrador.",
      });
      return;
    }
    if (!form.periodoInicio || !form.periodoFin) {
      setMsg({ type: "danger", text: "Seleccioná periodo inicio y fin." });
      return;
    }
    if (new Date(form.periodoFin) < new Date(form.periodoInicio)) {
      setMsg({ type: "danger", text: "El periodo fin no puede ser menor que el inicio." });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        revistaId,
        editorId,
        monto: montoCalculado,
        periodoInicio: form.periodoInicio,
        periodoFin: form.periodoFin,
      };

      await procesarPagoRevista(payload, carteraId);

      setMsg({ type: "success", text: "Pago procesado correctamente." });

      const p = await getPagosByRevistaId(revistaId);
      setPagos(p ?? []);
      await refreshCarteraAfterPago();
    } catch (e) {
      console.log(e);
      setMsg({
        type: "danger",
        text: "No se pudo procesar el pago. Revisá saldo/cartera o permisos.",
      });
    } finally {
      setSaving(false);
    }
  }

  function startEditFechaFin(p) {
    setEditFinId(p.id);
    setEditFinValue(p.fechaFin ? String(p.fechaFin).slice(0, 10) : "");
  }

  function cancelEditFechaFin() {
    setEditFinId(null);
    setEditFinValue("");
  }

  async function saveFechaFin(pago) {
    setMsg({ type: "", text: "" });

    if (!editFinValue) {
      setMsg({ type: "warning", text: "Seleccioná una fecha fin." });
      return;
    }

    // validación: fecha fin >= periodoInicio
    if (pago?.periodoInicio && new Date(editFinValue) < new Date(pago.periodoInicio)) {
      setMsg({ type: "danger", text: "La fecha fin no puede ser menor que el periodo inicio." });
      return;
    }

    setSavingFin(true);
    try {
      const updated = await updatePagoRevistaFechaFin(pago.id, editFinValue);

      setPagos((prev) => prev.map((x) => (x.id === pago.id ? { ...x, ...updated } : x)));

      setMsg({ type: "success", text: "Fecha fin actualizada correctamente." });
      cancelEditFechaFin();
    } catch (e) {
      console.log(e);
      setMsg({ type: "danger", text: "No se pudo actualizar la fecha fin." });
    } finally {
      setSavingFin(false);
    }
  }

  if (loading) {
    return (
      <div className="alert alert-info d-flex align-items-center gap-2">
        <div className="spinner-border spinner-border-sm" />
        <span>Cargando pagos...</span>
      </div>
    );
  }

  return (
    <div className="container-fluid p-0" style={{ maxWidth: 1200 }}>
      <div className="d-flex align-items-start justify-content-between mb-3">
        <div>
          <h1 className="h5 mb-0">Pagos de revista</h1>
          <div className="text-muted small">
            Revista: <b>{revista?.titulo ?? `#${revistaId}`}</b>
          </div>
        </div>

        <div className="d-flex gap-2">
          <button className="btn btn-outline-secondary" onClick={() => navigate(-1)}>
            <i className="bi bi-arrow-left me-1"></i>
            Volver
          </button>
          <button className="btn btn-outline-secondary" onClick={load}>
            <i className="bi bi-arrow-clockwise me-1"></i>
            Refrescar
          </button>
        </div>
      </div>

      {msg.text && <div className={`alert alert-${msg.type}`}>{msg.text}</div>}

      <div className="row g-3">
        {/* formulario */}
        <div className="col-12 col-lg-4">
          <div className="card shadow-sm">
            <div className="card-body">
              <div className="fw-semibold mb-1">Procesar nuevo pago</div>
              <div className="text-muted small mb-3">
                Se calcula con el <b>costo vigente</b> por día asignado por Admin.
              </div>

              <div className="alert alert-light border py-2">
                <div className="d-flex justify-content-between">
                  <span className="text-muted">Costo vigente/día</span>
                  <b>
                    {costoVigente?.costoPorDia != null
                      ? Number(costoVigente.costoPorDia).toFixed(2)
                      : "—"}{" "}
                    {carteraLS?.moneda ?? "GTQ"}
                  </b>
                </div>
                <div className="d-flex justify-content-between">
                  <span className="text-muted">Cartera ID</span>
                  <b>{carteraId ?? "—"}</b>
                </div>
              </div>

              {!costoVigente?.costoPorDia && (
                <div className="alert alert-warning">
                  Esta revista no tiene costo vigente. Pedile al administrador que asigne el costo por día.
                </div>
              )}

              <form onSubmit={onProcesarPago} className="mt-3">
                <div className="mb-3">
                  <label className="form-label">Periodo inicio</label>
                  <input
                    type="date"
                    name="periodoInicio"
                    value={formatDate(form.periodoInicio)}
                    onChange={onChange}
                    className="form-control"
                    required
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label">Periodo fin</label>
                  <input
                    type="date"
                    name="periodoFin"
                    value={formatDate(form.periodoFin)}
                    onChange={onChange}
                    className="form-control"
                    required
                  />
                </div>

                <div className="alert alert-light border">
                  <div className="d-flex justify-content-between">
                    <span className="text-muted">Monto calculado</span>
                    <b>
                      {Number(montoCalculado).toFixed(2)} {carteraLS?.moneda ?? "GTQ"}
                    </b>
                  </div>
                  <div className="text-muted small mt-1">
                    Días:{" "}
                    <b>
                      {form.periodoInicio && form.periodoFin
                        ? daysBetweenInclusive(form.periodoInicio, form.periodoFin)
                        : 0}
                    </b>
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary w-100"
                  disabled={saving || !costoVigente?.costoPorDia}
                >
                  {saving ? "Procesando..." : "Procesar pago"}
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* tabla pagos */}
        <div className="col-12 col-lg-8">
          <div className="card shadow-sm">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between mb-2">
                <div className="fw-semibold">Historial de pagos</div>
                <span className="text-muted small">Total: {pagos.length}</span>
              </div>

              <div className="table-responsive">
                <table className="table table-sm align-middle">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Fecha pago</th>
                      <th>Periodo</th>
                      <th className="text-end">Monto</th>
                      <th className="text-end">Transacción</th>

                      <th>Fecha fin</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagos.map((p) => (
                      <tr key={p.id}>
                        <td className="fw-semibold">{p.id}</td>
                        <td className="text-muted">{formatDate(p.fechaPago)}</td>
                        <td className="text-muted">
                          {formatDate(p.periodoInicio)} <span className="mx-1">→</span>{" "}
                          {formatDate(p.periodoFin)}
                        </td>
                        <td className="text-end fw-semibold">
                          {Number(p.monto ?? 0).toFixed(2)} {carteraLS?.moneda ?? "GTQ"}
                        </td>


                        <td className="text-end text-muted">{p.transaccionId ?? ""}</td>
                        <td>
                          {editFinId === p.id ? (
                            <div className="d-flex gap-2 align-items-center">
                              <input
                                type="date"
                                className="form-control form-control-sm"
                                value={editFinValue}
                                onChange={(e) => setEditFinValue(e.target.value)}
                                style={{ minWidth: 150 }}
                              />

                              <button
                                className="btn btn-sm btn-primary"
                                onClick={() => saveFechaFin(p)}
                                disabled={savingFin}
                                title="Guardar"
                              >
                                {savingFin ? (
                                  <span className="spinner-border spinner-border-sm" />
                                ) : (
                                  <i className="bi bi-check2" />
                                )}
                              </button>

                              <button
                                className="btn btn-sm btn-outline-secondary"
                                onClick={cancelEditFechaFin}
                                disabled={savingFin}
                                title="Cancelar"
                              >
                                <i className="bi bi-x" />
                              </button>
                            </div>
                          ) : (
                            <div className="d-flex align-items-center justify-content-between gap-2">
                              <span className="text-muted">{p.periodoFin ? formatDate(p.periodoFin) : "—"}</span>

                              <button
                                className="btn btn-sm btn-outline-primary"
                                onClick={() => startEditFechaFin(p)}
                                title="Editar fecha fin"
                              >
                                <i className="bi bi-pencil" />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}

                    {pagos.length === 0 && (
                      <tr>
                        <td colSpan={6} className="text-muted">
                          No hay pagos registrados para esta revista.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {pagos.length > 0 && (
                <div className="text-muted small mt-2">
                  Total pagado:{" "}
                  <b>
                    {pagos.reduce((acc, x) => acc + Number(x.monto ?? 0), 0).toFixed(2)}{" "}
                    {carteraLS?.moneda ?? "GTQ"}
                  </b>
                </div>
              )}

              <div className="form-text mt-2">
                Nota: “Fecha fin” es el cierre/expiración del pago (lo actualizás con el botón de editar).
              </div>—
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}