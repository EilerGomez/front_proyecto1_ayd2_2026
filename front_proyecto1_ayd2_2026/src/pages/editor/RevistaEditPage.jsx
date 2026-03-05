import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getRevistaById, updateRevista } from "../../services/revistas.service";
import { getCategorias } from "../../services/categorias.service";
import { getUser } from "../../auth/authService";

export default function RevistaEditPage() {
  const { id } = useParams();
  const revistaId = Number(id);
  const navigate = useNavigate();

  const user = getUser();

  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });

  const [form, setForm] = useState({
    editorId: user?.id ?? null,
    titulo: "",
    descripcion: "",
    categoriaId: null,
    fechaCreacion: "", // tu backend lo acepta, si no lo usás igual se manda vacío
    permiteLikes: true,
    permiteSuscripciones: true,
    permiteComentarios: true,
  });

  useEffect(() => {
    async function load() {
      setLoading(true);
      setMsg({ type: "", text: "" });

      try {
        const [r, cats] = await Promise.all([
          getRevistaById(revistaId),
          getCategorias(),
        ]);

        setCategorias(cats ?? []);

        setForm({
          editorId: r?.editor?.id ?? user?.id ?? null,
          titulo: r?.titulo ?? "",
          descripcion: r?.descripcion ?? "",
          categoriaId: r?.categoria?.id ?? (cats?.[0]?.id ?? null),
          fechaCreacion: "", // si tu API la requiere, llenala
          permiteLikes: !!r?.permiteLikes,
          permiteSuscripciones: !!r?.permiteSuscripciones,
          permiteComentarios: !!r?.permiteComentarios,
        });
      } catch (e) {
        console.log(e);
        setMsg({ type: "danger", text: "No se pudo cargar la revista para editar." });
      } finally {
        setLoading(false);
      }
    }

    if (revistaId) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [revistaId]);

  function onChange(e) {
    const { name, value, type, checked } = e.target;

    setForm((p) => ({
      ...p,
      [name]:
        type === "checkbox"
          ? checked
          : name === "categoriaId" || name === "editorId"
          ? Number(value)
          : value,
    }));
  }

  async function onSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setMsg({ type: "", text: "" });

    try {
      const payload = {
        editorId: form.editorId,
        titulo: form.titulo,
        descripcion: form.descripcion,
        categoriaId: form.categoriaId,
        fechaCreacion: form.fechaCreacion, // si no aplica, podés mandar "" o null
        permiteLikes: !!form.permiteLikes,
        permiteSuscripciones: !!form.permiteSuscripciones,
        permiteComentarios: !!form.permiteComentarios,
      };

      await updateRevista(revistaId, payload);

      setMsg({ type: "success", text: "Revista actualizada correctamente." });
      setTimeout(() => navigate(`/app/editor/revistas/${revistaId}`), 600);
    } catch (e) {
      console.log(e);
      setMsg({ type: "danger", text: "No se pudo actualizar la revista." });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="alert alert-info d-flex align-items-center gap-2">
        <div className="spinner-border spinner-border-sm" />
        <span>Cargando...</span>
      </div>
    );
  }

  return (
    <div className="container-fluid p-0" style={{ maxWidth: 900 }}>
      <div className="d-flex align-items-center justify-content-between mb-3">
        <div>
          <h1 className="h4 mb-0">Editar revista</h1>
          <div className="text-muted small">Actualizá los datos principales y permisos.</div>
        </div>

        <button className="btn btn-outline-secondary" onClick={() => navigate(-1)}>
          <i className="bi bi-arrow-left me-1"></i>
          Volver
        </button>
      </div>

      {msg.text && <div className={`alert alert-${msg.type}`}>{msg.text}</div>}

      <form onSubmit={onSubmit} className="card shadow-sm">
        <div className="card-body">
          <div className="row g-3">
            <div className="col-12">
              <label className="form-label">Título</label>
              <input
                className="form-control"
                name="titulo"
                value={form.titulo}
                onChange={onChange}
                required
              />
            </div>

            <div className="col-12">
              <label className="form-label">Descripción</label>
              <textarea
                className="form-control"
                name="descripcion"
                value={form.descripcion}
                onChange={onChange}
                rows={4}
              />
            </div>

            <div className="col-12 col-md-6">
              <label className="form-label">Categoría</label>
              <select
                className="form-select"
                name="categoriaId"
                value={form.categoriaId ?? ""}
                onChange={onChange}
                required
              >
                <option value="" disabled>
                  Seleccioná una categoría...
                </option>
                {categorias.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre}
                  </option>
                ))}
              </select>
            </div>

            {/* Si tu backend usa fechaCreacion en update */}
            <div className="col-12 col-md-6">
              <label className="form-label">Fecha creación (opcional)</label>
              <input
                type="date"
                className="form-control"
                name="fechaCreacion"
                value={form.fechaCreacion}
                onChange={onChange}
                required
              />
              <div className="form-text">Formato YYYY-MM-DD</div>
            </div>

            <div className="col-12">
              <hr />
              <h2 className="h6 mb-2">Permisos de interacción</h2>

              <div className="d-flex flex-wrap gap-3">
                <div className="form-check">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="permiteLikes"
                    name="permiteLikes"
                    checked={!!form.permiteLikes}
                    onChange={onChange}
                  />
                  <label className="form-check-label" htmlFor="permiteLikes">
                    Permite Likes
                  </label>
                </div>

                <div className="form-check">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="permiteSuscripciones"
                    name="permiteSuscripciones"
                    checked={!!form.permiteSuscripciones}
                    onChange={onChange}
                  />
                  <label className="form-check-label" htmlFor="permiteSuscripciones">
                    Permite Suscripciones
                  </label>
                </div>

                <div className="form-check">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="permiteComentarios"
                    name="permiteComentarios"
                    checked={!!form.permiteComentarios}
                    onChange={onChange}
                  />
                  <label className="form-check-label" htmlFor="permiteComentarios">
                    Permite Comentarios
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="card-footer d-flex justify-content-end gap-2">
          <button
            type="button"
            className="btn btn-outline-secondary"
            onClick={() => navigate(`/app/editor/revistas`)}
          >
            Cancelar
          </button>

          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? "Guardando..." : "Guardar cambios"}
          </button>
        </div>
      </form>
    </div>
  );
}