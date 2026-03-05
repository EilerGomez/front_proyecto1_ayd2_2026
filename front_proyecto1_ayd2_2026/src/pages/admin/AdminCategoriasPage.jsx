// src/pages/admin/AdminCategoriasPage.jsx
import { useEffect, useMemo, useState } from "react";
import {
  getCategorias,
  createCategoria,
  updateCategoria,
  deleteCategoria,
} from "../../services/categorias.service";

export default function AdminCategoriasPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState({ type: "", text: "" });

  const [q, setQ] = useState("");

  // form (crear/editar)
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null); // categoria o null
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    setMsg({ type: "", text: "" });
    try {
      const data = await getCategorias();
      setItems(data ?? []);
    } catch (e) {
      console.log(e);
      setMsg({ type: "danger", text: "No se pudieron cargar las categorías." });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const query = (q ?? "").toLowerCase().trim();
    return (items ?? []).filter((c) => {
      if (!query) return true;
      return (
        (c.nombre ?? "").toLowerCase().includes(query) ||
        (c.descripcion ?? "").toLowerCase().includes(query)
      );
    });
  }, [items, q]);

  function openCreate() {
    setEditing(null);
    setNombre("");
    setDescripcion("");
    setFormOpen(true);
    setMsg({ type: "", text: "" });
  }

  function openEdit(c) {
    setEditing(c);
    setNombre(c?.nombre ?? "");
    setDescripcion(c?.descripcion ?? "");
    setFormOpen(true);
    setMsg({ type: "", text: "" });
  }

  function closeForm() {
    setFormOpen(false);
    setEditing(null);
    setNombre("");
    setDescripcion("");
  }

  async function onSubmit(e) {
    e.preventDefault();
    const n = (nombre ?? "").trim();
    const d = (descripcion ?? "").trim();

    if (!n) {
      setMsg({ type: "warning", text: "El nombre es obligatorio." });
      return;
    }

    setSaving(true);
    setMsg({ type: "", text: "" });

    try {
      if (editing?.id) {
        const updated = await updateCategoria(editing.id, { nombre: n, descripcion: d });
        setItems((prev) => prev.map((x) => (x.id === editing.id ? { ...x, ...updated } : x)));
        setMsg({ type: "success", text: "Categoría actualizada." });
      } else {
        const created = await createCategoria({ nombre: n, descripcion: d });
        setItems((prev) => [created, ...(prev ?? [])]);
        setMsg({ type: "success", text: "Categoría creada." });
      }
      closeForm();
    } catch (e) {
      console.log(e);
      // si tu backend manda mensaje de duplicado, podés leer e.response?.data?.message
      setMsg({ type: "danger", text: "No se pudo guardar la categoría (¿duplicada?)." });
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(c) {
    const ok = confirm(`¿Eliminar la categoría "${c?.nombre}"?`);
    if (!ok) return;

    setMsg({ type: "", text: "" });
    try {
      await deleteCategoria(c.id);
      setItems((prev) => prev.filter((x) => x.id !== c.id));
      setMsg({ type: "success", text: "Categoría eliminada." });
    } catch (e) {
      console.log(e);
      setMsg({ type: "danger", text: "No se pudo eliminar la categoría." });
    }
  }

  return (
    <div>
      <div className="d-flex align-items-center justify-content-between mb-3">
        <div>
          <h1 className="h4 mb-0">Categorías (Admin)</h1>
          <div className="text-muted small">Crear, editar y eliminar categorías.</div>
        </div>

        <div className="d-flex gap-2">
          <button className="btn btn-outline-secondary" onClick={load} disabled={loading}>
            <i className="bi bi-arrow-clockwise me-2"></i>
            {loading ? "Actualizando..." : "Refrescar"}
          </button>

          <button className="btn btn-primary" onClick={openCreate}>
            <i className="bi bi-plus-lg me-2"></i>
            Nueva categoría
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
              placeholder="Nombre o descripción..."
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
          <span>Cargando categorías...</span>
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div className="alert alert-secondary">No hay categorías para mostrar.</div>
      )}

      {!loading && filtered.length > 0 && (
        <div className="card shadow-sm">
          <div className="table-responsive">
            <table className="table table-hover mb-0 align-middle">
              <thead className="table-light">
                <tr>
                  <th style={{ width: 90 }}>ID</th>
                  <th>Nombre</th>
                  <th>Descripción</th>
                  <th style={{ width: 180 }} className="text-end">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr key={c.id}>
                    <td className="text-muted">{c.id}</td>
                    <td className="fw-semibold">{c.nombre}</td>
                    <td className="text-muted">{c.descripcion || "—"}</td>
                    <td className="text-end">
                      <div className="btn-group">
                        <button className="btn btn-sm btn-outline-primary" onClick={() => openEdit(c)}>
                          <i className="bi bi-pencil-square me-1"></i> Editar
                        </button>
                        <button className="btn btn-sm btn-outline-danger" onClick={() => onDelete(c)}>
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
              top: "12%",
              left: "50%",
              transform: "translateX(-50%)",
              width: "min(720px, 92vw)",
              zIndex: 1050,
            }}
          >
            <div className="card-header bg-white d-flex justify-content-between align-items-center">
              <div className="fw-semibold">
                {editing ? `Editar categoría #${editing.id}` : "Nueva categoría"}
              </div>
              <button className="btn-close" onClick={closeForm} />
            </div>

            <form onSubmit={onSubmit}>
              <div className="card-body">
                <div className="mb-3">
                  <label className="form-label">Nombre *</label>
                  <input
                    className="form-control"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    placeholder="Ej: Tecnología"
                  />
                </div>

                <div className="mb-0">
                  <label className="form-label">Descripción</label>
                  <textarea
                    className="form-control"
                    rows={3}
                    value={descripcion}
                    onChange={(e) => setDescripcion(e.target.value)}
                    placeholder="Descripción opcional..."
                  />
                </div>
              </div>

              <div className="card-footer bg-white d-flex justify-content-end gap-2">
                <button type="button" className="btn btn-outline-secondary" onClick={closeForm} disabled={saving}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? "Guardando..." : editing ? "Guardar cambios" : "Crear categoría"}
                </button>
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  );
}