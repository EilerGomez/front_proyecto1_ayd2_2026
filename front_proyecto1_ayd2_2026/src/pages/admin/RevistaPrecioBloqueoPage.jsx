// src/pages/admin/RevistaPrecioBloqueoPage.jsx
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getUser } from "../../auth/authService";
import {
  getPrecioBloqueoByRevistaId,
  upsertPrecioBloqueo,
  deletePrecioBloqueo,
} from "../../services/precioBloqueo.service";

export default function RevistaPrecioBloqueoPage() {
  const { id } = useParams(); // /app/admin/revistas/:id/precio-bloqueo
  const revistaId = Number(id);
  const navigate = useNavigate();

  const admin = getUser();
  const adminId = admin?.id;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [actual, setActual] = useState(null); // {id, revistaId, costoPorDia, adminId}
  const [costoPorDia, setCostoPorDia] = useState(""); // input
  const [msg, setMsg] = useState({ type: "", text: "" });

  async function load() {
    setLoading(true);
    setMsg({ type: "", text: "" });

    try {
      const data = await getPrecioBloqueoByRevistaId(revistaId);
      setActual(data ?? null);
      setCostoPorDia(data?.costoPorDia != null ? String(data.costoPorDia) : "");
    } catch (e) {
      // si tu backend tira 404 cuando no existe, aquí solo lo dejamos en null
      console.log(e);
      setActual(null);
      setCostoPorDia("");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!revistaId) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [revistaId]);

  async function onSave(e) {
    e.preventDefault();
    setMsg({ type: "", text: "" });

    if (!adminId) {
      setMsg({ type: "danger", text: "No se detectó adminId (sesión)." });
      return;
    }

    const val = Number(costoPorDia);
    if (!costoPorDia || Number.isNaN(val) || val <= 0) {
      setMsg({ type: "warning", text: "Ingresá un costo por día válido (> 0)." });
      return;
    }

    setSaving(true);
    try {
      const res = await upsertPrecioBloqueo({
        revistaId,
        adminId,
        costoPorDia: val,
      });
      setActual(res);
      setMsg({ type: "success", text: "Precio por bloqueo guardado correctamente." });
    } catch (e) {
      console.log(e);
      setMsg({ type: "danger", text: "No se pudo guardar el precio por bloqueo." });
    } finally {
      setSaving(false);
    }
  }

  async function onDelete() {
    if (!actual?.id) return;

    const ok = window.confirm("¿Seguro que deseas eliminar el precio actual de bloqueo?");
    if (!ok) return;

    setDeleting(true);
    setMsg({ type: "", text: "" });
    try {
      await deletePrecioBloqueo(actual.id);
      setActual(null);
      setCostoPorDia("");
      setMsg({ type: "success", text: "Precio eliminado correctamente." });
    } catch (e) {
      console.log(e);
      setMsg({ type: "danger", text: "No se pudo eliminar el precio." });
    } finally {
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div className="alert alert-info d-flex align-items-center gap-2">
        <div className="spinner-border spinner-border-sm" />
        <span>Cargando precio por bloqueo...</span>
      </div>
    );
  }

  return (
    <div className="container-fluid p-0" style={{ maxWidth: 900 }}>
      <div className="d-flex align-items-start justify-content-between mb-3">
        <div>
          <h1 className="h5 mb-0">Precio por bloqueo de anuncios</h1>
          <div className="text-muted small">
            Revista ID: <b>#{revistaId}</b>
          </div>
        </div>

        <div className="d-flex gap-2">
          <button className="btn btn-outline-secondary" onClick={() => navigate(-1)}>
            <i className="bi bi-arrow-left me-1" />
            Volver
          </button>
          <button className="btn btn-outline-secondary" onClick={load}>
            <i className="bi bi-arrow-clockwise me-1" />
            Refrescar
          </button>
        </div>
      </div>

      {msg.text && <div className={`alert alert-${msg.type}`}>{msg.text}</div>}

      {/* Estado actual */}
      <div className="card shadow-sm mb-3">
        <div className="card-body">
          <div className="d-flex justify-content-between align-items-center gap-2 flex-wrap">
            <div className="fw-semibold">
              <i className="bi bi-shield-lock me-2" />
              Precio actual
            </div>

            {actual ? (
              <span className="badge text-bg-success">
                <i className="bi bi-check-circle me-1" />
                ASIGNADO
              </span>
            ) : (
              <span className="badge text-bg-secondary">
                <i className="bi bi-slash-circle me-1" />
                NO ASIGNADO
              </span>
            )}
          </div>

          <div className="mt-2">
            {actual ? (
              <div className="d-flex flex-wrap gap-2 align-items-center">
                <span className="badge text-bg-light border">
                  <b>Q {Number(actual.costoPorDia ?? 0).toFixed(2)}</b> / día
                </span>
                <span className="text-muted small">Admin ID: {actual.adminId}</span>
                <span className="text-muted small">Precio ID: {actual.id}</span>
              </div>
            ) : (
              <div className="text-muted">Aún no hay precio configurado para esta revista.</div>
            )}
          </div>

          {actual && (
            <div className="mt-3">
              <button className="btn btn-outline-danger" onClick={onDelete} disabled={deleting}>
                {deleting ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" />
                    Eliminando...
                  </>
                ) : (
                  <>
                    <i className="bi bi-trash me-2" />
                    Eliminar precio
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Form asignar/actualizar */}
      <div className="card shadow-sm">
        <div className="card-body">
          <div className="fw-semibold mb-2">
            <i className="bi bi-pencil-square me-2" />
            {actual ? "Actualizar precio" : "Asignar precio"}
          </div>

          <form className="row g-3" onSubmit={onSave}>
            <div className="col-12 col-md-6">
              <label className="form-label">Costo por día (Q)</label>
              <input
                className="form-control"
                type="number"
                step="0.01"
                min="0"
                value={costoPorDia}
                onChange={(e) => setCostoPorDia(e.target.value)}
                placeholder="Ej: 10.00"
                required
              />
              <div className="form-text">
                Este precio es el que paga el editor cuando bloquea anuncios en esta revista.
              </div>
            </div>

            <div className="col-12 col-md-6 d-flex align-items-end justify-content-end">
              <button className="btn btn-primary" disabled={saving}>
                {saving ? "Guardando..." : actual ? "Actualizar" : "Asignar"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}