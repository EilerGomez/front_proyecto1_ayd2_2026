import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getUser } from "../../auth/authService";
import { getCategorias } from "../../services/categorias.service";
import { getEtiquetas } from "../../services/etiquetas.service";
import { asignarEtiquetas, createRevista } from "../../services/revistas.service";

export default function RevistaCreatePage() {
  const navigate = useNavigate();
  const user = getUser();

  const [categorias, setCategorias] = useState([]);
  const [etiquetas, setEtiquetas] = useState([]);

  const [step, setStep] = useState(1); // 1 = crear revista, 2 = asignar etiquetas
  const [createdRevista, setCreatedRevista] = useState(null);

  const [form, setForm] = useState({
    editorId: user?.id ?? null,
    titulo: "",
    descripcion: "",
    categoriaId: "",
    fechaCreacion: new Date().toISOString().slice(0, 10),
    permiteLikes: true,
    permiteSuscripciones: true,
    permiteComentarios: true,
  });

  const [selectedTags, setSelectedTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });

  const tagsAsMap = useMemo(() => {
    const m = new Map();
    (etiquetas ?? []).forEach((t) => m.set(t.id, t));
    return m;
  }, [etiquetas]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [cats, tags] = await Promise.all([getCategorias(), getEtiquetas()]);
        setCategorias(cats ?? []);
        setEtiquetas(tags ?? []);
        if ((cats ?? []).length > 0) {
          setForm((f) => ({ ...f, categoriaId: cats[0].id }));
        }
      } catch (e) {
        console.log(e);
        setMsg({ type: "danger", text: "No se pudieron cargar categorías/etiquetas." });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  function onChange(e) {
    const { name, value, type, checked } = e.target;
    setForm((p) => ({
      ...p,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  function toggleTag(id) {
    setSelectedTags((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  async function onCreate(e) {
    e.preventDefault();
    setMsg({ type: "", text: "" });
    setSaving(true);

    try {
      if (!form.editorId) throw new Error("No editorId");
      if (!form.titulo.trim()) throw new Error("Falta título");
      if (!form.categoriaId) throw new Error("Falta categoría");

      const payload = {
        ...form,
        categoriaId: Number(form.categoriaId),
      };

      const created = await createRevista(payload);
      setCreatedRevista(created);

      // pasa al step 2
      setStep(2);
      setMsg({ type: "success", text: "Revista creada. Ahora asigná etiquetas." });
    } catch (e) {
      console.log(e);
      setMsg({ type: "danger", text: "No se pudo crear la revista. Revisá los campos." });
    } finally {
      setSaving(false);
    }
  }

  async function onAssignTags() {
    setMsg({ type: "", text: "" });
    setSaving(true);
    try {
      if (!createdRevista?.id) throw new Error("No revista id");

      await asignarEtiquetas({
        idRevista: createdRevista.id,
        etiquetasIds: selectedTags,
      });

      setMsg({ type: "success", text: "Etiquetas asignadas correctamente." });

      // ir al detalle para agregar ediciones
      navigate(`/app/editor/revistas/${createdRevista.id}`, { replace: true });
    } catch (e) {
      console.log(e);
      setMsg({ type: "danger", text: "No se pudieron asignar etiquetas." });
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
    <div className="row g-3">
      <div className="col-12 col-lg-7">
        <div className="card shadow-sm">
          <div className="card-body">
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <h1 className="h5 mb-0">Nueva revista</h1>
                <div className="text-muted small">
                  Paso {step}/2 — {step === 1 ? "Datos de la revista" : "Etiquetas"}
                </div>
              </div>

              <button className="btn btn-outline-secondary btn-sm" onClick={() => navigate(-1)}>
                Volver
              </button>
            </div>

            <hr />

            {msg.text && <div className={`alert alert-${msg.type}`}>{msg.text}</div>}

            {step === 1 && (
              <form onSubmit={onCreate}>
                <div className="mb-3">
                  <label className="form-label">Título</label>
                  <input
                    className="form-control"
                    name="titulo"
                    value={form.titulo}
                    onChange={onChange}
                    placeholder="Ej: Revista Tech"
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label">Descripción</label>
                  <textarea
                    className="form-control"
                    rows={3}
                    name="descripcion"
                    value={form.descripcion}
                    onChange={onChange}
                    placeholder="Descripción corta..."
                  />
                </div>

                <div className="row g-3">
                  <div className="col-12 col-md-6">
                    <label className="form-label">Categoría</label>
                    <select
                      className="form-select"
                      name="categoriaId"
                      value={form.categoriaId}
                      onChange={onChange}
                    >
                      {categorias.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.nombre}
                        </option>
                      ))}
                    </select>
                    <div className="form-text">
                      Elegí la categoría principal de la revista.
                    </div>
                  </div>

                  <div className="col-12 col-md-6">
                    <label className="form-label">Fecha creación</label>
                    <input
                      type="date"
                      className="form-control"
                      name="fechaCreacion"
                      value={form.fechaCreacion}
                      onChange={onChange}
                    />
                  </div>
                </div>

                <hr />

                <div className="row g-2">
                  <div className="col-12 col-md-4">
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        name="permiteLikes"
                        checked={form.permiteLikes}
                        onChange={onChange}
                        id="likes"
                      />
                      <label className="form-check-label" htmlFor="likes">
                        Permite likes
                      </label>
                    </div>
                  </div>

                  <div className="col-12 col-md-4">
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        name="permiteSuscripciones"
                        checked={form.permiteSuscripciones}
                        onChange={onChange}
                        id="subs"
                      />
                      <label className="form-check-label" htmlFor="subs">
                        Permite suscripciones
                      </label>
                    </div>
                  </div>

                  <div className="col-12 col-md-4">
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        name="permiteComentarios"
                        checked={form.permiteComentarios}
                        onChange={onChange}
                        id="com"
                      />
                      <label className="form-check-label" htmlFor="com">
                        Permite comentarios
                      </label>
                    </div>
                  </div>
                </div>

                <div className="d-flex justify-content-end mt-4">
                  <button className="btn btn-primary" disabled={saving}>
                    {saving ? "Creando..." : "Crear revista"}
                  </button>
                </div>
              </form>
            )}

            {step === 2 && (
              <>
                <div className="alert alert-secondary">
                  Revista creada: <b>{createdRevista?.titulo}</b> (ID: {createdRevista?.id})
                </div>

                <div className="mb-2 fw-semibold">Seleccioná etiquetas</div>

                <div className="d-flex flex-wrap gap-2">
                  {etiquetas.map((t) => {
                    const active = selectedTags.includes(t.id);
                    return (
                      <button
                        key={t.id}
                        type="button"
                        className={`btn btn-sm ${active ? "btn-primary" : "btn-outline-primary"}`}
                        onClick={() => toggleTag(t.id)}
                      >
                        #{t.nombre}
                      </button>
                    );
                  })}
                </div>

                <div className="mt-3">
                  <div className="text-muted small mb-2">Seleccionadas:</div>
                  <div className="d-flex flex-wrap gap-2">
                    {selectedTags.map((id) => (
                      <span key={id} className="badge rounded-pill text-bg-light border">
                        #{tagsAsMap.get(id)?.nombre ?? id}
                      </span>
                    ))}
                    {selectedTags.length === 0 && (
                      <span className="text-muted small">Ninguna</span>
                    )}
                  </div>
                </div>

                <div className="d-flex justify-content-end mt-4 gap-2">
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => setStep(1)}
                    disabled={saving}
                  >
                    Atrás
                  </button>

                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={onAssignTags}
                    disabled={saving}
                  >
                    {saving ? "Guardando..." : "Guardar etiquetas y continuar"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="col-12 col-lg-5">
        <div className="card shadow-sm">
          <div className="card-body">
            <h2 className="h6">Tip</h2>
            <div className="text-muted small">
              Agrega una descripcion que represente formalmente tu revista, es decir de que se trata, etc.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}