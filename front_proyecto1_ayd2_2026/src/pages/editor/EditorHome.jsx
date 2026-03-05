import { Link } from "react-router-dom";

export default function EditorHome() {
  const cards = [
    {
      title: "Comentarios por revista",
      desc: "Reporte de comentarios de revistas en un intervalo de tiempo. Filtro opcional por revista.",
      icon: "bi-chat-left-text",
      to: "/app/editor/reportes/comentarios",
      badge: "Interacción",
    },
    {
      title: "Suscripciones por revista",
      desc: "Suscripciones en un intervalo de tiempo, incluyendo listado. Filtro opcional por revista.",
      icon: "bi-person-check",
      to: "/app/editor/reportes/suscripciones",
      badge: "Crecimiento",
    },
    {
      title: "Top 5 revistas más gustadas",
      desc: "Top 5 por ‘Me gusta’ en el intervalo. Incluye listado. Filtro opcional por revista.",
      icon: "bi-heart",
      to: "/app/editor/reportes/top-gustadas",
      badge: "Ranking",
    },
    {
      title: "Pagos hechos por revista",
      desc: "Pagos en un intervalo. Listado por revista + total de pagos. Filtro opcional por revista.",
      icon: "bi-receipt",
      to: "/app/editor/reportes/pagos",
      badge: "Finanzas",
    },
  ];

  return (
    <div>
      <div className="d-flex align-items-start justify-content-between flex-wrap gap-3 mb-4">
        <div>
          <h1 className="h4 mb-1">Panel Editorial</h1>
          <div className="text-muted">
            Administrá contenido, pagos y métricas de tus revistas.
          </div>
        </div>

        <div className="d-flex gap-2">
          <Link to="/app/editor/revistas" className="btn btn-primary">
            <i className="bi bi-journals me-2"></i>
            Revistas
          </Link>
          <Link to="/app/editor/billetera" className="btn btn-outline-secondary">
            <i className="bi bi-wallet2 me-2"></i>
            Billetera
          </Link>
        </div>
      </div>

      <div className="row g-3">
        {cards.map((c) => (
          <div className="col-12 col-md-6 col-xl-3" key={c.title}>
            <div className="card shadow-sm h-100">
              <div className="card-body d-flex flex-column">
                <div className="d-flex align-items-center justify-content-between">
                  <div className="d-flex align-items-center gap-2">
                    <span className="badge text-bg-primary-subtle border text-primary">
                      <i className={`bi ${c.icon} me-1`}></i>
                      {c.badge}
                    </span>
                  </div>
                </div>

                <h5 className="mt-3 mb-2">{c.title}</h5>
                <p className="text-muted small flex-grow-1 mb-3">{c.desc}</p>

                <Link to={c.to} className="stretched-link text-decoration-none fw-semibold">
                  Abrir reporte <i className="bi bi-arrow-right"></i>
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="alert alert-info mt-4">
        <i className="bi bi-info-circle me-2"></i>
        Tip: todos los reportes piden <b>Fecha de inicio</b> y <b> fecha final </b> pero son opcionales si quieres ver <b> todos </b>.
      </div>
    </div>
  );
}