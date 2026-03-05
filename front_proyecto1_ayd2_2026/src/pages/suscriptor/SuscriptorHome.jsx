import { useNavigate } from "react-router-dom";
import { getUser, getPerfil } from "../../auth/authService";

export default function SuscriptorHome() {
  const navigate = useNavigate();
  const user = getUser();
  const perfil = getPerfil();

  const avatarUrl = perfil?.foto_url ?? "";

  return (
    <div style={{ maxWidth: 1100 }}>
      {/* HERO */}
      <div className="card shadow-sm mb-3">
        <div className="card-body d-flex flex-wrap align-items-center justify-content-between gap-3">
          <div className="d-flex align-items-center gap-3">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt="avatar"
                className="rounded-circle border"
                style={{ width: 56, height: 56, objectFit: "cover" }}
                onError={(e) => (e.currentTarget.style.display = "none")}
              />
            ) : (
              <div
                className="rounded-circle bg-light border d-flex align-items-center justify-content-center"
                style={{ width: 56, height: 56 }}
              >
                <i className="bi bi-person-circle fs-2 text-muted"></i>
              </div>
            )}

            <div>
              <div className="h5 mb-0">
                ¡Qué tal, {user?.nombre ?? "Suscriptor"}!
              </div>
              <div className="text-muted small">
                Explorá revistas, suscribite y disfrutá tus ediciones.
              </div>
            </div>
          </div>

          <div className="d-flex gap-2 flex-wrap">
            <button className="btn btn-primary" onClick={() => navigate("/app/suscriptor/revistas")}>
              <i className="bi bi-journals me-2"></i>
              Explorar revistas
            </button>

            <button className="btn btn-outline-success" onClick={() => navigate("/app/suscriptor/revistas")}>
              <i className="bi bi-person-check me-2"></i>
              Mis suscripciones
            </button>
          </div>
        </div>
      </div>

      {/* QUICK ACTIONS */}
      <div className="row g-3">
        <div className="col-12 col-md-4">
          <div className="card shadow-sm h-100">
            <div className="card-body">
              <div className="fw-semibold mb-1">
                <i className="bi bi-search me-2"></i>
                Buscar y leer
              </div>
              <div className="text-muted small mb-3">
                Entrá al catálogo, filtrá por categoría y abrí ediciones disponibles.
              </div>
              <button className="btn btn-outline-primary w-100" onClick={() => navigate("/app/suscriptor/revistas")}>
                Ver catálogo
              </button>
            </div>
          </div>
        </div>

        <div className="col-12 col-md-4">
          <div className="card shadow-sm h-100">
            <div className="card-body">
              <div className="fw-semibold mb-1">
                <i className="bi bi-stars me-2"></i>
                Suscribite
              </div>
              <div className="text-muted small mb-3">
                Suscribite a tus revistas favoritas para recibir acceso continuo.
              </div>
              <button className="btn btn-outline-success w-100" onClick={() => navigate("/app/suscriptor/revistas")}>
                Ver mis suscripciones
              </button>
            </div>
          </div>
        </div>

        <div className="col-12 col-md-4">
          <div className="card shadow-sm h-100">
            <div className="card-body">
              <div className="fw-semibold mb-1">
                <i className="bi bi-person-badge me-2"></i>
                Tu perfil
              </div>
              <div className="text-muted small mb-3">
                Actualizá tu información y tu foto para personalizar tu cuenta.
              </div>
              <button className="btn btn-outline-secondary w-100" onClick={() => navigate("/app/suscriptor/perfil")}>
                Ir a mi perfil
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* TIP */}
      <div className="alert alert-info mt-3 d-flex align-items-center gap-2">
        <i className="bi bi-lightbulb"></i>
        <div>
          Tip: si una revista te gusta, revisá su descripción y categoría antes de suscribirte.
        </div>
      </div>
    </div>
  );
}