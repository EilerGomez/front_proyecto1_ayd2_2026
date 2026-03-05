import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getRevistaById, asignarEtiquetas } from "../../services/revistas.service";
import { getEtiquetas } from "../../services/etiquetas.service";

export default function RevistaEtiquetasPage() {
  const { id } = useParams();
  const revistaId = Number(id);
  const navigate = useNavigate();

  const [revista, setRevista] = useState(null);
  const [allTags, setAllTags] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });

  const currentTagIds = useMemo(() => {
    return (revista?.etiquetas ?? []).map((t) => t.id);
  }, [revista]);

  async function load() {
    setLoading(true);
    setMsg({ type: "", text: "" });

    try {
      const [r, tags] = await Promise.all([
        getRevistaById(revistaId),
        getEtiquetas(),
      ]);

      setRevista(r);
      setAllTags(tags ?? []);
      setSelectedTags((r?.etiquetas ?? []).map((t) => t.id));
    } catch (e) {
      console.log(e);
      setMsg({ type: "danger", text: "No se pudo cargar etiquetas." });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!revistaId) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [revistaId]);

  function toggleTag(idTag) {
    setSelectedTags((prev) =>
      prev.includes(idTag) ? prev.filter((x) => x !== idTag) : [...prev, idTag]
    );
  }

  async function onSave() {
    setSaving(true);
    setMsg({ type: "", text: "" });

    try {
      await asignarEtiquetas({
        idRevista: revistaId,
        etiquetasIds: selectedTags,
      });

      setMsg({ type: "success", text: "Etiquetas guardadas correctamente." });

      const r = await getRevistaById(revistaId);
      setRevista(r);
    } catch (e) {
      console.log(e);
      setMsg({ type: "danger", text: "No se pudieron guardar las etiquetas." });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="alert alert-info d-flex align-items-center gap-2">
        <div className="spinner-border spinner-border-sm" />
        <span>Cargando etiquetas...</span>
      </div>
    );
  }

  return (
    <div className="container-fluid p-0" style={{ maxWidth: 1100 }}>
      <div className="d-flex align-items-start justify-content-between mb-3">
        <div>
          <h1 className="h5 mb-0">Etiquetas</h1>
          <div className="text-muted small">
            Revista: <b>{revista?.titulo ?? `#${revistaId}`}</b>
          </div>
        </div>

        <div className="d-flex gap-2">
          <button className="btn btn-outline-secondary" onClick={() => navigate(-1)}>
            <i className="bi bi-arrow-left me-1"></i>
            Volver
          </button>
          <button className="btn btn-primary" onClick={onSave} disabled={saving}>
            {saving ? "Guardando..." : "Guardar cambios"}
          </button>
        </div>
      </div>

      {msg.text && <div className={`alert alert-${msg.type}`}>{msg.text}</div>}

      <div className="card shadow-sm">
        <div className="card-body">
          <div className="text-muted small mb-3">
            Seleccioná etiquetas. Luego “Guardar cambios”.
          </div>

          <div className="d-flex flex-wrap gap-2">
            {(allTags ?? []).map((t) => {
              const active = selectedTags.includes(t.id);
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => toggleTag(t.id)}
                  className={"btn btn-sm " + (active ? "btn-primary" : "btn-outline-primary")}
                >
                  {t.nombre}
                </button>
              );
            })}

            {allTags.length === 0 && (
              <div className="text-muted">No hay etiquetas registradas.</div>
            )}
          </div>

          <hr />

          <div className="small text-muted">
            {JSON.stringify(selectedTags.slice().sort()) !==
            JSON.stringify(currentTagIds.slice().sort()) ? (
              <span>
                <i className="bi bi-exclamation-circle me-1"></i>
                Tenés cambios sin guardar.
              </span>
            ) : (
              <span>
                <i className="bi bi-check2-circle me-1"></i>
                Etiquetas sincronizadas.
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}