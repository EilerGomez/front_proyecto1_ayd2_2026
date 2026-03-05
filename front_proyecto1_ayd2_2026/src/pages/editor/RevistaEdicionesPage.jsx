import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {getRole} from "../../auth/authService";
import { getRevistaById } from "../../services/revistas.service";
import { getEdicionesByRevistaId, createEdicion, deleteEdicion } from "../../services/ediciones.service";

export default function RevistaEdicionesPage() {
  const { id } = useParams();
  const revistaId = Number(id);
  const navigate = useNavigate();
  const rol = getRole();

  const [revista, setRevista] = useState(null);
  const [ediciones, setEdiciones] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });

  const [form, setForm] = useState({
    revistaId,
    titulo: "",
    pdfUrl: "",
  });

  useEffect(() => {
    setForm((p) => ({ ...p, revistaId }));
  }, [revistaId]);

  async function load() {
    setLoading(true);
    setMsg({ type: "", text: "" });

    try {
      const [r, eds] = await Promise.all([
        getRevistaById(revistaId),
        getEdicionesByRevistaId(revistaId),
      ]);

      setRevista(r);
      setEdiciones(eds ?? []);
    } catch (e) {
      console.log(e);
      setMsg({ type: "danger", text: "No se pudieron cargar las ediciones." });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!revistaId) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [revistaId]);

  function onChange(e) {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  }

  async function onCreate(e) {
    e.preventDefault();
    setSaving(true);
    setMsg({ type: "", text: "" });

    try {
      await createEdicion({
        revistaId,
        titulo: form.titulo,
        pdfUrl: form.pdfUrl,
      });

      setMsg({ type: "success", text: "Edición creada." });
      setForm({ revistaId, titulo: "", pdfUrl: "" });

      const eds = await getEdicionesByRevistaId(revistaId);
      setEdiciones(eds ?? []);
    } catch (e) {
      console.log(e);
      setMsg({ type: "danger", text: "No se pudo crear la edición." });
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(edicionId) {
    const ok = confirm("¿Eliminar esta edición?");
    if (!ok) return;

    setMsg({ type: "", text: "" });

    try {
      await deleteEdicion(edicionId);
      setMsg({ type: "success", text: "Edición eliminada." });

      const eds = await getEdicionesByRevistaId(revistaId);
      setEdiciones(eds ?? []);
    } catch (e) {
      console.log(e);
      setMsg({ type: "danger", text: "No se pudo eliminar la edición." });
    }
  }

  if (loading) {
    return (
      <div className="alert alert-info d-flex align-items-center gap-2">
        <div className="spinner-border spinner-border-sm" />
        <span>Cargando ediciones...</span>
      </div>
    );
  }

  return (
    <div className="container-fluid p-0" style={{ maxWidth: 1100 }}>
      <div className="d-flex align-items-start justify-content-between mb-3">
        <div>
          <h1 className="h5 mb-0">Ediciones</h1>
          <div className="text-muted small">
            Revista: <b>{revista?.titulo ?? `#${revistaId}`}</b>
          </div>
        </div>

        <button className="btn btn-outline-secondary" onClick={() => navigate(-1)}>
          <i className="bi bi-arrow-left me-1"></i>
          Volver
        </button>
      </div>

      {msg.text && <div className={`alert alert-${msg.type}`}>{msg.text}</div>}

      {/* Crear */}
      {rol === "EDITOR" && (
        <div className="card shadow-sm mb-3">
          <div className="card-body">
            <h2 className="h6 mb-2">Agregar nueva edición</h2>

            <form className="row g-3" onSubmit={onCreate}>
              <div className="col-12 col-md-6">
                <label className="form-label">Título</label>
                <input
                  className="form-control"
                  name="titulo"
                  value={form.titulo}
                  onChange={onChange}
                  placeholder="Ej: Edición Marzo 2026"
                  required
                />
              </div>

              <div className="col-12 col-md-6">
                <label className="form-label">URL PDF</label>
                <input
                  className="form-control"
                  name="pdfUrl"
                  value={form.pdfUrl}
                  onChange={onChange}
                  placeholder="https://..."
                />
              </div>

              <div className="col-12 d-flex justify-content-end">
                <button className="btn btn-primary" disabled={saving}>
                  {saving ? "Guardando..." : "Crear edición"}
                </button>
              </div>
            </form>

            <div className="form-text mt-2"></div>
          </div>
        </div>
      )}

      {/* Listado publicaciones */}
      {ediciones.length === 0 ? (
        <div className="alert alert-secondary">No hay ediciones todavía.</div>
      ) : (
        <div className="list-group">
          {ediciones.map((e) => (
            <div key={e.id} className="list-group-item py-3">
              <div className="d-flex align-items-start justify-content-between gap-3">
                <div className="flex-grow-1">
                  <div className="d-flex align-items-center gap-2 flex-wrap">
                    <h5 className="mb-0">{e.titulo}</h5>

                    <span className="badge text-bg-light border">
                      <i className="bi bi-hash me-1"></i>ID: {e.id}
                    </span>

                    {e.numeroEdicion ? (
                      <span className="badge text-bg-primary">
                        <i className="bi bi-journal-text me-1"></i>
                        No. {e.numeroEdicion}
                      </span>
                    ) : null}

                    {e.fechaPublicacion ? (
                      <span className="badge text-bg-light border">
                        <i className="bi bi-calendar-event me-1"></i>
                        {e.fechaPublicacion.replace("T", " ").slice(0, 16)}
                      </span>
                    ) : null}
                  </div>

                  <div className="mt-3">
                    {e.pdfUrl ? (
                      <>
                        <div className="ratio ratio-16x9 border rounded">
                          <iframe
                            src={e.pdfUrl}
                            title={`PDF ${e.titulo}`}
                            style={{ border: 0 }}
                            loading="lazy"
                          />
                        </div>

                        <div className="mt-2">
                          <a href={e.pdfUrl} target="_blank" rel="noreferrer">
                            Abrir en nueva pestaña{" "}
                            <i className="bi bi-box-arrow-up-right ms-1"></i>
                          </a>
                        </div>
                      </>
                    ) : (
                      <div className="text-muted">Sin PDF.</div>
                    )}
                  </div>
                </div>

                <div className="text-end">
                  <button
                    className="btn btn-outline-danger btn-sm"
                    onClick={() => onDelete(e.id)}
                    title="Eliminar"
                  >
                    <i className="bi bi-trash"></i>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}