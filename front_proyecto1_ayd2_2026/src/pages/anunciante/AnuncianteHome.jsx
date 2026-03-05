import { Link } from "react-router-dom";

export default function AnuncianteHome() {
  return (
    <div className="row g-3">
      <div className="col-12">
        <div className="card shadow-sm">
          <div className="card-body">
            <h1 className="h4 mb-1">Bienvenido al Panel de Anunciante</h1>
            <div className="text-muted">
              Creá anuncios, hacé publicidad en la web y gestioná tus campañas de forma rápida.
            </div>

            <div className="d-flex flex-wrap gap-2 mt-3">
              <Link to="/app/anunciante/anuncios/nuevo" className="btn btn-primary">
                <i className="bi bi-plus-lg me-2"></i>
                Crear anuncio
              </Link>
              <Link to="/app/anunciante/anuncios" className="btn btn-outline-secondary">
                <i className="bi bi-megaphone me-2"></i>
                Ver mis anuncios
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* cards sugerencias */}
      <div className="col-12 col-md-4">
        <div className="card shadow-sm h-100">
          <div className="card-body">
            <div className="fw-semibold mb-1">
              <i className="bi bi-badge-ad me-2"></i>
              Publicidad que se ve
            </div>
            <div className="text-muted small">
              Los anuncios se muestran dentro de revistas (según disponibilidad y bloqueo).
            </div>
          </div>
        </div>
      </div>

      <div className="col-12 col-md-4">
        <div className="card shadow-sm h-100">
          <div className="card-body">
            <div className="fw-semibold mb-1">
              <i className="bi bi-sliders me-2"></i>
              Control de estados
            </div>
            <div className="text-muted small">
              Manejá BORRADOR, ACTIVO, INACTIVO y EXPIRADO según tu estrategia.
            </div>
          </div>
        </div>
      </div>

      <div className="col-12 col-md-4">
        <div className="card shadow-sm h-100">
          <div className="card-body">
            <div className="fw-semibold mb-1">
              <i className="bi bi-wallet2 me-2"></i>
              Pagos y billetera
            </div>
            <div className="text-muted small">
              Revisa tu saldo y gestiona pagos desde tu billetera.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}