import { NavLink } from "react-router-dom";

const REPORTES = [
  {
    to: "/app/admin/reportes/ganancias-revistas",
    title: "Ganancias por revista",
    desc:
      "Costos por revista, anuncios comprados, ingresos por editores y totales (costo/ingreso/ganancia).",
    icon: "bi-currency-dollar",
  },
  {
    to: "/app/admin/reportes/anuncios-comprados",
    title: "Anuncios comprados",
    desc: "Filtrar por tipo de anuncio y por intervalo de tiempo.",
    icon: "bi-megaphone",
  },
  {
    to: "/app/admin/reportes/ganancias-por-anunciante",
    title: "Ganancias por anunciante",
    desc: "Listado de anuncios pagados por anunciante (filtro opcional).",
    icon: "bi-cash-stack",
  },
  {
    to: "/app/admin/reportes/top-5-revistas-populares",
    title: "Top 5 revistas más populares",
    desc: "Listado de suscripciones y total de suscripciones por revista.",
    icon: "bi-award",
  },
  {
    to: "/app/admin/reportes/top-5-revistas-comentadas",
    title: "Top 5 revistas más comentadas",
    desc: "Listado de comentarios por revista en el intervalo.",
    icon: "bi-chat-left-text",
  },
  {
    to: "/app/admin/reportes/efectividad-anuncios",
    title: "Efectividad de anuncios",
    desc:
      "Veces mostrado + URL donde se mostró. Agrupado por anunciante/anuncio.",
    icon: "bi-bar-chart-line",
  },
];

export default function AdminHome() {
  return (
    <div>
      <div className="d-flex align-items-start justify-content-between gap-3 mb-4">
        <div>
          <h2 className="fw-bold mb-1">Panel de Administración</h2>
          <p className="text-muted mb-0">
            Gestión de revistas, usuarios y reportes de publicación.
          </p>
        </div>

        <div className="d-flex gap-2">
          <NavLink to="/app/admin/usuarios" className="btn btn-primary btn-sm">
            <i className="bi bi-people me-1"></i> Usuarios
          </NavLink>
          <NavLink to="/app/admin/reportes" className="btn btn-outline-secondary btn-sm">
            <i className="bi bi-graph-up-arrow me-1"></i> Reportes
          </NavLink>
        </div>
      </div>

      <div className="row g-3">
        {REPORTES.map((r) => (
          <div className="col-12 col-md-6 col-xl-4" key={r.to}>
            <NavLink to={r.to} className="text-decoration-none">
              <div className="card h-100 shadow-sm border-0">
                <div className="card-body">
                  <div className="d-flex align-items-center gap-2 mb-2">
                    <span className="badge bg-primary">
                      <i className={`bi ${r.icon}`}></i>
                    </span>
                    <h5 className="card-title mb-0 fw-semibold">{r.title}</h5>
                  </div>

                  <p className="card-text text-muted">{r.desc}</p>

                  <div className="fw-semibold text-primary">
                    Abrir reporte <i className="bi bi-arrow-right"></i>
                  </div>
                </div>
              </div>
            </NavLink>
          </div>
        ))}
      </div>
    </div>
  );
}