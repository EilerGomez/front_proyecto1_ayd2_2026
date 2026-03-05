import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getUser } from "../../auth/authService";
import {
  getCostoVigente,
  getHistorialCostos,
  createCostoDiario,
} from "../../services/costosRevista.service";

import { getCostoGlobal, updateCostoGlobal } from "../../services/costoGlobal.service";

function EstadoVigenciaBadge({ fechaFin }) {
  const vigente = !fechaFin;
  return (
    <span className={`badge ${vigente ? "text-bg-success" : "text-bg-secondary"}`}>
      <i className={`bi ${vigente ? "bi-check-circle" : "bi-clock-history"} me-1`}></i>
      {vigente ? "VIGENTE" : "NO VIGENTE"}
    </span>
  );
}

function toISODateInput(d) {
  return d ?? "";
}

export default function RevistaCostosPage() {
  const { id } = useParams();
  const revistaId = Number(id);
  const navigate = useNavigate();

  const admin = getUser();
  const adminId = admin?.id;

  const [vigente, setVigente] = useState(null);
  const [historial, setHistorial] = useState([]);

  const [costoGlobal, setCostoGlobal] = useState(null); // {id,monto}
  const [globalMonto, setGlobalMonto] = useState("");   // input del modal
  const [savingGlobal, setSavingGlobal] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });

  // filtros
  const [fVigencia, setFVigencia] = useState("ALL");
  const [fDesde, setFDesde] = useState("");
  const [fHasta, setFHasta] = useState("");

  // form nuevo costo
  const [form, setForm] = useState({
    costoPorDia: "",
    fechaInicio: "",
  });

  async function load() {
    setLoading(true);
    setMsg({ type: "", text: "" });

    try {
      const [v, h, g] = await Promise.all([
        getCostoVigente(revistaId).catch(() => null),
        getHistorialCostos(revistaId),
        getCostoGlobal().catch(() => null),
      ]);

      setVigente(v);
      setHistorial(h ?? []);

      setCostoGlobal(g);
      const gm = g?.monto != null ? String(g.monto) : "";
      setGlobalMonto(gm);

      // sugerir costo global en el input del costo diario (solo si está vacío)
      if (!form.costoPorDia && gm) {
        setForm((p) => ({ ...p, costoPorDia: gm }));
      }
    } catch (e) {
      console.log(e);
      setMsg({ type: "danger", text: "No se pudo cargar el historial de costos." });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!revistaId) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [revistaId]);

  const filtered = useMemo(() => {
    let arr = [...(historial ?? [])];

    if (fVigencia === "VIGENTE") arr = arr.filter((x) => !x.fechaFin);
    if (fVigencia === "NO_VIGENTE") arr = arr.filter((x) => !!x.fechaFin);

    if (fDesde) arr = arr.filter((x) => (x.fechaInicio ?? "") >= fDesde);
    if (fHasta) arr = arr.filter((x) => (x.fechaInicio ?? "") <= fHasta);

    arr.sort((a, b) => {
      const fa = a.fechaInicio ?? "";
      const fb = b.fechaInicio ?? "";
      if (fa !== fb) return fb.localeCompare(fa);
      return (b.id ?? 0) - (a.id ?? 0);
    });

    return arr;
  }, [historial, fVigencia, fDesde, fHasta]);

  function onFormChange(e) {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  }

  async function onCreate(e) {
    e.preventDefault();
    setMsg({ type: "", text: "" });

    if (!adminId) return setMsg({ type: "danger", text: "No se detectó adminId (sesión)." });
    if (!form.costoPorDia || Number(form.costoPorDia) <= 0)
      return setMsg({ type: "warning", text: "Ingresá un costo por día válido." });
    if (!form.fechaInicio) return setMsg({ type: "warning", text: "Seleccioná fecha de inicio." });

    setSaving(true);
    try {
      await createCostoDiario({
        revistaId,
        adminId,
        costoPorDia: Number(form.costoPorDia),
        fechaInicio: form.fechaInicio,
      });

      setMsg({ type: "success", text: "Costo diario asignado correctamente." });
      setForm((p) => ({ ...p, costoPorDia: "", fechaInicio: "" }));
      await load();
    } catch (e) {
      console.log(e);
      setMsg({ type: "danger", text: "No se pudo asignar el nuevo costo." });
    } finally {
      setSaving(false);
    }
  }

  async function onUpdateGlobal() {
    setMsg({ type: "", text: "" });

    if (!adminId) {
      setMsg({ type: "danger", text: "No se detectó adminId (sesión)." });
      return;
    }
    if (!globalMonto || Number(globalMonto) <= 0) {
      setMsg({ type: "warning", text: "Ingresá un monto global válido." });
      return;
    }

    setSavingGlobal(true);
    try {
      const updated = await updateCostoGlobal({ monto: Number(globalMonto) });
      setCostoGlobal(updated);
      setMsg({ type: "success", text: "Costo global actualizado correctamente." });

      // sugerirlo también para costo por día
      setForm((p) => ({ ...p, costoPorDia: String(updated?.monto ?? globalMonto) }));

      // cerrar modal sin librerías extra (si bootstrap está cargado)
      const el = document.getElementById("modalCostoGlobal");
      if (el) {
        const evt = new Event("hide.bs.modal");
        el.dispatchEvent(evt);
      }

      // cierre seguro:
      const btnClose = document.getElementById("closeModalCostoGlobal");
      if (btnClose) btnClose.click();
    } catch (e) {
      console.log(e);
      setMsg({ type: "danger", text: "No se pudo actualizar el costo global." });
    } finally {
      setSavingGlobal(false);
    }
  }

  function usarSugerido() {
    const sug = costoGlobal?.monto;
    if (sug == null) return;
    setForm((p) => ({ ...p, costoPorDia: String(sug) }));
  }

  function openGlobalModal() {
    // cuando abre el modal, precarga el input con el valor actual
    const gm = costoGlobal?.monto != null ? String(costoGlobal.monto) : "";
    setGlobalMonto(gm);
  }

  if (loading) {
    return (
      <div className="alert alert-info d-flex align-items-center gap-2">
        <div className="spinner-border spinner-border-sm" />
        <span>Cargando costos...</span>
      </div>
    );
  }

  return (
    <div className="container-fluid p-0" style={{ maxWidth: 1100 }}>
      <div className="d-flex align-items-start justify-content-between mb-3">
        <div>
          <h1 className="h5 mb-0">Precios por día</h1>
          <div className="text-muted small">
            Revista ID: <b>#{revistaId}</b>
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

      {/* ✅ TARJETA RESUMIDA (sin form) */}
      <div className="card shadow-sm mb-3">
        <div className="card-body">
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
            <div className="fw-semibold">
              <i className="bi bi-globe-americas me-2"></i>
              Costo global sugerido
            </div>

            <div className="d-flex align-items-center gap-2">
              <span className="badge text-bg-light border">
                {costoGlobal?.monto != null ? (
                  <b>Q {Number(costoGlobal.monto).toFixed(2)}</b>
                ) : (
                  <span className="text-muted">No definido</span>
                )}
              </span>

              <button
                className="btn btn-sm btn-outline-primary"
                data-bs-toggle="modal"
                data-bs-target="#modalCostoGlobal"
                onClick={openGlobalModal}
              >
                <i className="bi bi-pencil-square me-1"></i>
                Cambiar
              </button>

              
            </div>
          </div>

          <div className="form-text mt-2">
            Este costo global solo es una <b>sugerencia</b> para llenar rápido el costo por día.
          </div>
        </div>
      </div>

      <div className="modal fade" id="modalCostoGlobal" tabIndex="-1" aria-hidden="true">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">
                <i className="bi bi-globe-americas me-2"></i>
                Actualizar costo global
              </h5>
              <button
                id="closeModalCostoGlobal"
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
                aria-label="Cerrar"
              />
            </div>

            <div className="modal-body">
              <label className="form-label">Monto global (Q)</label>
              <input
                className="form-control"
                type="number"
                step="0.01"
                min="0"
                value={globalMonto}
                onChange={(e) => setGlobalMonto(e.target.value)}
                placeholder="Ej: 5.00"
              />
            </div>

            <div className="modal-footer">
              <button className="btn btn-outline-secondary" data-bs-dismiss="modal" disabled={savingGlobal}>
                Cancelar
              </button>
              <button className="btn btn-primary" onClick={onUpdateGlobal} disabled={savingGlobal}>
                {savingGlobal ? "Guardando..." : "Guardar cambios"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Vigente */}
      <div className="card shadow-sm mb-3">
        <div className="card-body">
          <div className="d-flex align-items-center justify-content-between gap-2">
            <div className="fw-semibold">
              <i className="bi bi-cash-coin me-2"></i>
              Costo vigente
            </div>
            <EstadoVigenciaBadge fechaFin={null} />
          </div>

          <div className="mt-2">
            {vigente ? (
              <div className="d-flex flex-wrap gap-2 align-items-center">
                <span className="badge text-bg-light border">
                  <b>Q {Number(vigente.costoPorDia ?? 0).toFixed(2)}</b> / día
                </span>
                <span className="text-muted small">
                  Inicio: {vigente.fechaInicio ?? "—"} • Admin ID: {vigente.adminId ?? "—"}
                </span>
              </div>
            ) : (
              <div className="text-muted">No hay costo vigente registrado.</div>
            )}
          </div>
        </div>
      </div>

      {/* Crear nuevo */}
      <div className="card shadow-sm mb-3">
        <div className="card-body">
          <div className="fw-semibold mb-2">
            <i className="bi bi-plus-circle me-2"></i>
            Asignar nuevo costo diario
          </div>

          <form className="row g-3" onSubmit={onCreate}>
            <div className="col-12 col-md-4">
              <label className="form-label">Costo por día (Q)</label>
              <input
                className="form-control"
                name="costoPorDia"
                type="number"
                step="0.01"
                min="0"
                value={form.costoPorDia}
                onChange={onFormChange}
                placeholder={
                  costoGlobal?.monto != null ? `Sugerido: Q ${Number(costoGlobal.monto).toFixed(2)}` : "Ej: 5.00"
                }
                required
              />
              {costoGlobal?.monto != null && (
                <div className="form-text">
                  Sugerido global: <b>Q {Number(costoGlobal.monto).toFixed(2)}</b>
                </div>
              )}
            </div>

            <div className="col-12 col-md-4">
              <label className="form-label">Fecha inicio</label>
              <input
                className="form-control"
                name="fechaInicio"
                type="date"
                value={form.fechaInicio}
                onChange={onFormChange}
                required
              />
            </div>

            <div className="col-12 col-md-4 d-flex align-items-end justify-content-end gap-2">
              {costoGlobal?.monto != null && (
                <button type="button" className="btn btn-outline-secondary" onClick={usarSugerido}>
                  <i className="bi bi-lightning-charge me-1"></i>
                  Usar sugerido
                </button>
              )}

              <button className="btn btn-primary" disabled={saving}>
                {saving ? "Guardando..." : "Crear costo"}
              </button>
            </div>

            <div className="col-12">
              <div className="form-text">
                Regla: al crear un nuevo costo, el anterior se marca con fecha fin y el nuevo queda vigente.
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Filtros */}
      <div className="card shadow-sm mb-3">
        <div className="card-body">
          <div className="fw-semibold mb-2">
            <i className="bi bi-funnel me-2"></i>
            Filtros
          </div>

          <div className="row g-3">
            <div className="col-12 col-md-4">
              <label className="form-label">Vigencia</label>
              <select className="form-select" value={fVigencia} onChange={(e) => setFVigencia(e.target.value)}>
                <option value="ALL">Todos</option>
                <option value="VIGENTE">Solo vigente</option>
                <option value="NO_VIGENTE">Solo no vigentes</option>
              </select>
            </div>

            <div className="col-12 col-md-4">
              <label className="form-label">Desde (fecha inicio)</label>
              <input className="form-control" type="date" value={fDesde} onChange={(e) => setFDesde(e.target.value)} />
            </div>

            <div className="col-12 col-md-4">
              <label className="form-label">Hasta (fecha inicio)</label>
              <input className="form-control" type="date" value={fHasta} onChange={(e) => setFHasta(e.target.value)} />
            </div>
          </div>
        </div>
      </div>

      {/* Historial */}
      <div className="card shadow-sm">
        <div className="card-body">
          <div className="d-flex align-items-center justify-content-between mb-2">
            <div className="fw-semibold">
              <i className="bi bi-clock-history me-2"></i>
              Historial de costos
            </div>
            <div className="text-muted small">Resultados: {filtered.length}</div>
          </div>

          <div className="table-responsive">
            <table className="table table-sm align-middle">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Costo/día</th>
                  <th>Inicio</th>
                  <th>Fin</th>
                  <th>Admin</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((h) => {
                  const isVigente = !h.fechaFin;
                  return (
                    <tr key={h.id}>
                      <td>{h.id}</td>
                      <td className="fw-semibold">Q {Number(h.costoPorDia ?? 0).toFixed(2)}</td>
                      <td>{toISODateInput(h.fechaInicio)}</td>
                      <td>{toISODateInput(h.fechaFin) || "—"}</td>
                      <td>{h.adminId}</td>
                      <td>
                        <span className={`badge ${isVigente ? "text-bg-success" : "text-bg-secondary"}`}>
                          {isVigente ? "VIGENTE" : "NO VIGENTE"}
                        </span>
                      </td>
                    </tr>
                  );
                })}

                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-muted">
                      No hay registros con esos filtros.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="form-text">
            Regla: si <code>Fecha fin</code> no existe es porque el costo es el vigente.
          </div>
        </div>
      </div>
    </div>
  );
}