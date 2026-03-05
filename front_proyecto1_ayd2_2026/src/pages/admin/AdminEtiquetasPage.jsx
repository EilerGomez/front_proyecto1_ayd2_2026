// src/pages/admin/AdminEtiquetasPage.jsx
import { useEffect, useMemo, useState } from "react";
import {
  getEtiquetas,
  createEtiqueta,
  updateEtiqueta,
  deleteEtiqueta,
} from "../../services/etiquetas.service";

export default function AdminEtiquetasPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState({ type: "", text: "" });

  const [q, setQ] = useState("");

  // form
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [nombre, setNombre] = useState("");
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    setMsg({ type: "", text: "" });
    try {
      const data = await getEtiquetas();
      setItems(data ?? []);
    } catch (e) {
      console.log(e);
      setMsg({ type: "danger", text: "No se pudieron cargar las etiquetas." });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const query = (q ?? "").toLowerCase().trim();
    return (items ?? []).filter((t) => {
      if (!query) return true;
      return (t.nombre ?? "").toLowerCase().includes(query);
    });
  }, [items, q]);

  function openCreate() {
    setEditing(null);
    setNombre("");
    setFormOpen(true);
    setMsg({ type: "", text: "" });
  }

  function openEdit(t) {
    setEditing(t);
    setNombre(t?.nombre ?? "");
    setFormOpen(true);
    setMsg({ type: "", text: "" });
  }

  function closeForm() {
    setFormOpen(false);
    setEditing(null);
    setNombre("");
  }

  async function onSubmit(e) {
    e.preventDefault();
    const n = (nombre ?? "").trim();
    if (!n) {
      setMsg({ type: "warning", text: "El nombre es obligatorio." });
      return;
    }

    setSaving(true);
    setMsg({ type: "", text: "" });

    try {
      if (editing?.id) {
        const updated = await updateEtiqueta(editing.id, { nombre: n });
        setItems((prev) => prev.map((x) => (x.id === editing.id ? { ...x, ...updated } : x)));
        setMsg({ type: "success", text: "Etiqueta actualizada." });
      } else {
        const created = await createEtiqueta({ nombre: n });
        setItems((prev) => [created, ...(prev ?? [])]);
        setMsg({ type: "success", text: "Etiqueta creada." });
      }
      closeForm();
    } catch (e) {
      console.log(e);
      setMsg({ type: "danger", text: "No se pudo guardar la etiqueta (¿duplicada?)." });
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(t) {
    const ok = confirm(`¿Eliminar la etiqueta "${t?.nombre}"?`);
    if (!ok) return;

    setMsg({ type: "", text: "" });
    try {
      await deleteEtiqueta(t.id);
      setItems((prev) => prev.filter((x) => x.id !== t.id));
      setMsg({ type: "success", text: "Etiqueta eliminada." });
    } catch (e) {
      console.log(e);
      setMsg({ type: "danger", text: "No se pudo eliminar la etiqueta." });
    }
  }

  return (
    <div>
      <div className="d-flex align-items-center justify-content-between mb-3">
        <div>
          <h1 className="h4 mb-0">Etiquetas (Admin)</h1>
          <div className="text-muted small">Crear, editar y eliminar etiquetas.</div>
        </div>

        <div className="d-flex gap-2">
          <button className="btn btn-outline-secondary" onClick={load} disabled={loading}>
            <i className="bi bi-arrow-clockwise me-2"></i>
            {loading ? "Actualizando..." : "Refrescar"}
          </button>

          <button className="btn btn-primary" onClick={openCreate}>
            <i className="bi bi-plus-lg me-2"></i>
            Nueva etiqueta
          </button>
        </div>
      </div>

      <div className="card shadow-sm mb-3">
        <div className="card-body">
          <label className="form-label mb-1">Buscar</label>
          <div className="input-group">
            <span className="input-group-text">
              <i className="bi bi-search"></i>
            </span>
            <input
              className="form-control"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Nombre de etiqueta..."
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

      {msg.text && <div className={`alert alert-${msg.type}`}>{msg.text}</div>}

      {loading && (
        <div className="alert alert-info d-flex align-items-center gap-2">
          <div className="spinner-border spinner-border-sm" />
          <span>Cargando etiquetas...</span>
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div className="alert alert-secondary">No hay etiquetas para mostrar.</div>
      )}

      {!loading && filtered.length > 0 && (
        <div className="card shadow-sm">
          <div className="table-responsive">
            <table className="table table-hover mb-0 align-middle">
              <thead className="table-light">
                <tr>
                  <th style={{ width: 90 }}>ID</th>
                  <th>Nombre</th>
                  <th style={{ width: 180 }} className="text-end">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((t) => (
                  <tr key={t.id}>
                    <td className="text-muted">{t.id}</td>
                    <td className="fw-semibold">#{t.nombre}</td>
                    <td className="text-end">
                      <div className="btn-group">
                        <button className="btn btn-sm btn-outline-primary" onClick={() => openEdit(t)}>
                          <i className="bi bi-pencil-square me-1"></i> Editar
                        </button>
                        <button className="btn btn-sm btn-outline-danger" onClick={() => onDelete(t)}>
                          <i className="bi bi-trash me-1"></i> Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal simple */}
      {formOpen && (
        <>
          <div className="offcanvas-backdrop fade show" style={{ zIndex: 1040 }} onClick={closeForm} />
          <div
            className="card shadow-lg"
            style={{
              position: "fixed",
              top: "15%",
              left: "50%",
              transform: "translateX(-50%)",
              width: "min(640px, 92vw)",
              zIndex: 1050,
            }}
          >
            <div className="card-header bg-white d-flex justify-content-between align-items-center">
              <div className="fw-semibold">
                {editing ? `Editar etiqueta #${editing.id}` : "Nueva etiqueta"}
              </div>
              <button className="btn-close" onClick={closeForm} />
            </div>

            <form onSubmit={onSubmit}>
              <div className="card-body">
                <label className="form-label">Nombre *</label>
                <input
                  className="form-control"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Ej: Startups"
                />
                <div className="text-muted small mt-2">Se mostrará como: <b>#{nombre || "etiqueta"}</b></div>
              </div>

              <div className="card-footer bg-white d-flex justify-content-end gap-2">
                <button type="button" className="btn btn-outline-secondary" onClick={closeForm} disabled={saving}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? "Guardando..." : editing ? "Guardar cambios" : "Crear etiqueta"}
                </button>
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  );
}