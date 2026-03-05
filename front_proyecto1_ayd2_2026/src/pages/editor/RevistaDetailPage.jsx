import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { getRevistaById } from "../../services/revistas.service";

function EstadoBadge({ activa }) {
  return (
    <span className={`badge ${activa ? "text-bg-success" : "text-bg-secondary"}`}>
      <i className={`bi ${activa ? "bi-check-circle" : "bi-slash-circle"} me-1`}></i>
      {activa ? "ACTIVA" : "INACTIVA"}
    </span>
  );
}

export default function RevistaDetailPage() {
  const { id } = useParams();
  const revistaId = Number(id);
  const navigate = useNavigate();

  const [revista, setRevista] = useState(null);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState({ type: "", text: "" });

  async function load() {
    setLoading(true);
    setMsg({ type: "", text: "" });
    try {
      const r = await getRevistaById(revistaId);
      setRevista(r);
    } catch (e) {
      console.log(e);
      setMsg({ type: "danger", text: "No se pudo cargar la revista." });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!revistaId) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [revistaId]);

  if (loading) {
    return (
      <div className="alert alert-info d-flex align-items-center gap-2">
        <div className="spinner-border spinner-border-sm" />
        <span>Cargando revista...</span>
      </div>
    );
  }

  if (!revista) {
    return (
      <div className="alert alert-warning">
        No se encontró la revista.{" "}
        <button className="btn btn-link p-0" onClick={() => navigate(-1)}>
          Volver
        </button>
      </div>
    );
  }

  return (
    <div className="container-fluid p-0" style={{ maxWidth: 1100 }}>
      <div className="d-flex align-items-start justify-content-between mb-3">
        <div>
          <div className="d-flex align-items-center gap-2 flex-wrap">
            <h1 className="h4 mb-0">{revista.titulo}</h1>
            <EstadoBadge activa={!!revista.activa} />
          </div>

          <div className="text-muted mt-1">
            {revista.categoria?.nombre ? (
              <span className="me-3">
                <i className="bi bi-bookmark me-1"></i>
                {revista.categoria.nombre}
              </span>
            ) : null}

            {revista.editor?.nombre ? (
              <span className="me-3">
                <i className="bi bi-person me-1"></i>
                {revista.editor.nombre} {revista.editor.apellido ?? ""}
              </span>
            ) : null}

            <span className="me-3">
              <i className="bi bi-hash me-1"></i>ID: {revista.id}
            </span>
          </div>
        </div>

        <div className="d-flex gap-2">
          <button className="btn btn-outline-secondary" onClick={() => navigate(-1)}>
            <i className="bi bi-arrow-left me-1"></i>
            Volver
          </button>
        </div>
      </div>

      {msg.text && <div className={`alert alert-${msg.type}`}>{msg.text}</div>}

      <div className="row g-3">
        <div className="col-12 col-lg-8">
          <div className="card shadow-sm">
            <div className="card-body">
              <h2 className="h6">Descripción</h2>
              <p className="text-muted mb-3" style={{ whiteSpace: "pre-wrap" }}>
                {revista.descripcion || "—"}
              </p>

              <div className="d-flex flex-wrap gap-2">
                <span className="badge text-bg-light border">
                  <i className="bi bi-chat-left-text me-1"></i>
                  {revista.cantidadComentarios ?? 0} comentarios
                </span>
                <span className="badge text-bg-light border">
                  <i className="bi bi-heart me-1"></i>
                  {revista.cantidadLikes ?? 0} likes
                </span>
                <span className="badge text-bg-light border">
                  <i className="bi bi-people me-1"></i>
                  {revista.cantidadSuscripciones ?? 0} suscripciones
                </span>
              </div>

              <hr />

              <div className="d-flex flex-wrap gap-2">
                <Link to={`/app/editor/revistas/${revistaId}/etiquetas`} className="btn btn-outline-primary">
                  <i className="bi bi-tags me-2"></i>
                  Asignar etiquetas
                </Link>

                <Link to={`/app/editor/revistas/${revistaId}/ediciones`} className="btn btn-outline-success">
                  <i className="bi bi-journal-text me-2"></i>
                  Ver ediciones
                </Link>

                <Link to={`/app/editor/revistas/${revistaId}/editar`} className="btn btn-outline-secondary">
                  <i className="bi bi-pencil-square me-2"></i>
                  Editar
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Resumen mini a la derecha */}
        <div className="col-12 col-lg-4">
          <div className="card shadow-sm">
            <div className="card-body">
              <h2 className="h6 mb-2">Etiquetas actuales</h2>
              <div className="d-flex flex-wrap gap-2">
                {(revista.etiquetas ?? []).length > 0 ? (
                  (revista.etiquetas ?? []).map((t) => (
                    <span key={t.id} className="badge rounded-pill text-bg-light border">
                      #{t.nombre}
                    </span>
                  ))
                ) : (
                  <span className="text-muted">Sin etiquetas.</span>
                )}
              </div>

              <hr />

              <div className="text-muted small">
                Tip: administrá etiquetas y ediciones desde los botones.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}