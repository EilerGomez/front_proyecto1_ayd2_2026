import { useEffect, useMemo, useState } from "react";
import { getReporteTopRevistas } from "../../../services/reportesAdmin.service";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

function formatDate(value) {
  if (!value) return "—";
  try {
    return new Date(`${value}T00:00:00`).toLocaleDateString("es-GT");
  } catch {
    return value;
  }
}

function getEstadoBadgeClass(activa) {
  return activa ? "bg-success" : "bg-secondary";
}

export default function ReporteTopRevistasPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [reporte, setReporte] = useState(null);

  const [inicio, setInicio] = useState("");
  const [fin, setFin] = useState("");

  const [detalle, setDetalle] = useState(null);

  async function cargarReporte() {
    try {
      setLoading(true);
      setError("");

      const data = await getReporteTopRevistas({
        inicio: inicio || undefined,
        fin: fin || undefined,
      });

      setReporte(data);
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.message || err.message || "No se pudo cargar el reporte");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    cargarReporte();
  }, []);

  function limpiarFiltros() {
    setInicio("");
    setFin("");
  }

  const topRevistas = useMemo(() => reporte?.topRevistas || [], [reporte]);

  const totalSuscripciones = useMemo(() => {
    return topRevistas.reduce((acc, item) => acc + Number(item?.totalSuscripciones || 0), 0);
  }, [topRevistas]);

  function exportarPdfResumen() {
    const doc = new jsPDF();

    doc.setFontSize(16);
    doc.text("Reporte Top 5 revistas más populares", 14, 15);

    doc.setFontSize(10);
    doc.text(
      `Inicio: ${inicio || "Sin filtro"} | Fin: ${fin || "Sin filtro"}`,
      14,
      22
    );

    const body = topRevistas.map((item, index) => [
      index + 1,
      item?.revistaId ?? "—",
      item?.titulo ?? "—",
      item?.totalSuscripciones ?? 0,
    ]);

    autoTable(doc, {
      startY: 28,
      head: [["Top", "ID revista", "Título", "Total suscripciones"]],
      body,
      styles: {
        fontSize: 9,
        cellPadding: 2,
      },
      headStyles: {
        fillColor: [13, 110, 253],
      },
      columnStyles: {
        2: { cellWidth: 95 },
      },
    });

    const finalY = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(11);
    doc.text(`Revistas listadas: ${topRevistas.length}`, 14, finalY);
    doc.text(`Total suscripciones acumuladas: ${totalSuscripciones}`, 14, finalY + 7);

    doc.save("reporte-top-5-revistas-populares.pdf");
  }

  function exportarPdfDetalleRevista(revista) {
    const doc = new jsPDF();

    doc.setFontSize(16);
    doc.text(`Detalle de suscripciones - ${revista?.titulo || "Revista"}`, 14, 15);

    doc.setFontSize(10);
    doc.text(
      `Inicio: ${inicio || "Sin filtro"} | Fin: ${fin || "Sin filtro"}`,
      14,
      22
    );

    const body = (revista?.suscripciones || []).map((s, index) => [
      index + 1,
      s?.username ?? "—",
      formatDate(s?.fechaSuscripcion),
      s?.activa ? "Activa" : "Inactiva",
    ]);

    autoTable(doc, {
      startY: 28,
      head: [["#", "Username", "Fecha suscripción", "Estado"]],
      body,
      styles: {
        fontSize: 9,
        cellPadding: 2,
      },
      headStyles: {
        fillColor: [13, 110, 253],
      },
    });

    const finalY = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(11);
    doc.text(`Total suscripciones: ${revista?.totalSuscripciones || 0}`, 14, finalY);

    doc.save(`detalle-revista-${revista?.revistaId || "top"}.pdf`);
  }

  return (
    <div className="container-fluid">
      <div className="d-flex flex-wrap justify-content-between align-items-start gap-3 mb-4">
        <div>
          <h2 className="fw-bold mb-1">Top 5 revistas más populares</h2>
          <p className="text-muted mb-0">
            Consulta las revistas con más suscripciones dentro del rango de fechas seleccionado.
          </p>
        </div>

        <button
          className="btn btn-danger"
          onClick={exportarPdfResumen}
          disabled={!reporte || loading || topRevistas.length === 0}
        >
          <i className="bi bi-file-earmark-pdf me-2"></i>
          Descargar PDF
        </button>
      </div>

      <div className="row g-3 mb-4">
        <div className="col-12 col-md-6">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <div className="text-muted small">Revistas listadas</div>
              <div className="fs-4 fw-bold">{topRevistas.length}</div>
            </div>
          </div>
        </div>

        <div className="col-12 col-md-6">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <div className="text-muted small">Total suscripciones acumuladas</div>
              <div className="fs-4 fw-bold text-primary">{totalSuscripciones}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="card shadow-sm border-0 mb-4">
        <div className="card-body">
          <div className="row g-3 align-items-end">
            <div className="col-12 col-md-4">
              <label className="form-label fw-semibold">Fecha inicio</label>
              <input
                type="date"
                className="form-control"
                value={inicio}
                onChange={(e) => setInicio(e.target.value)}
              />
            </div>

            <div className="col-12 col-md-4">
              <label className="form-label fw-semibold">Fecha fin</label>
              <input
                type="date"
                className="form-control"
                value={fin}
                onChange={(e) => setFin(e.target.value)}
              />
            </div>

            <div className="col-12 col-md-4">
              <div className="d-flex flex-wrap gap-2">
                <button
                  className="btn btn-primary"
                  onClick={cargarReporte}
                  disabled={loading}
                >
                  <i className="bi bi-search me-2"></i>
                  {loading ? "Consultando..." : "Consultar"}
                </button>

                <button
                  className="btn btn-outline-secondary"
                  onClick={limpiarFiltros}
                  disabled={loading}
                >
                  <i className="bi bi-eraser me-2"></i>
                  Limpiar
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger">
          <i className="bi bi-exclamation-triangle me-2"></i>
          {error}
        </div>
      )}

      <div className="card shadow-sm border-0">
        <div className="card-header bg-white border-0 pt-3">
          <h5 className="mb-0 fw-semibold">Ranking de revistas</h5>
        </div>

        <div className="card-body">
          <div className="table-responsive">
            <table className="table align-middle">
              <thead className="table-light">
                <tr>
                  <th>Top</th>
                  <th>ID revista</th>
                  <th>Título</th>
                  <th>Total suscripciones</th>
                  <th>Acciones</th>
                </tr>
              </thead>

              <tbody>
                {!loading && topRevistas.length === 0 && (
                  <tr>
                    <td colSpan="5" className="text-center text-muted py-4">
                      No hay revistas para mostrar.
                    </td>
                  </tr>
                )}

                {topRevistas.map((item, index) => (
                  <tr key={item?.revistaId ?? index}>
                    <td>
                      <span className="badge bg-warning text-dark">#{index + 1}</span>
                    </td>
                    <td>{item?.revistaId ?? "—"}</td>
                    <td className="fw-semibold">{item?.titulo ?? "—"}</td>
                    <td>{item?.totalSuscripciones ?? 0}</td>
                    <td>
                      <div className="d-flex flex-wrap gap-2">
                        <button
                          className="btn btn-sm btn-outline-secondary"
                          onClick={() => setDetalle(item)}
                        >
                          <i className="bi bi-eye me-1"></i>
                          Ver suscripciones
                        </button>

                        <button
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => exportarPdfDetalleRevista(item)}
                        >
                          <i className="bi bi-file-earmark-pdf me-1"></i>
                          PDF detalle
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>

              {reporte && (
                <tfoot className="table-light">
                  <tr>
                    <th colSpan="3" className="text-end">Totales:</th>
                    <th>{totalSuscripciones}</th>
                    <th></th>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      </div>

      {detalle && (
        <>
          <div
            className="modal fade show"
            style={{ display: "block", backgroundColor: "rgba(0,0,0,0.5)" }}
            tabIndex="-1"
          >
            <div className="modal-dialog modal-xl modal-dialog-centered">
              <div className="modal-content border-0 shadow">
                <div className="modal-header">
                  <div>
                    <h5 className="modal-title mb-1">Suscripciones de la revista</h5>
                    <div className="text-muted small">
                      {detalle?.titulo || "—"}
                    </div>
                  </div>

                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setDetalle(null)}
                  ></button>
                </div>

                <div className="modal-body">
                  <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
                    <div>
                      <div className="small text-muted">Revista ID</div>
                      <div className="fw-bold">{detalle?.revistaId ?? "—"}</div>
                    </div>

                    <div>
                      <div className="small text-muted">Total suscripciones</div>
                      <div className="fw-bold text-primary">
                        {detalle?.totalSuscripciones ?? 0}
                      </div>
                    </div>

                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => exportarPdfDetalleRevista(detalle)}
                    >
                      <i className="bi bi-file-earmark-pdf me-2"></i>
                      Descargar PDF detalle
                    </button>
                  </div>

                  <div className="table-responsive">
                    <table className="table align-middle">
                      <thead className="table-light">
                        <tr>
                          <th>#</th>
                          <th>Username</th>
                          <th>Fecha suscripción</th>
                          <th>Estado</th>
                        </tr>
                      </thead>

                      <tbody>
                        {detalle?.suscripciones?.length > 0 ? (
                          detalle.suscripciones.map((s, index) => (
                            <tr key={`${s?.username || "sus"}-${index}`}>
                              <td>{index + 1}</td>
                              <td className="fw-semibold">{s?.username ?? "—"}</td>
                              <td>{formatDate(s?.fechaSuscripcion)}</td>
                              <td>
                                <span className={`badge ${getEstadoBadgeClass(s?.activa)}`}>
                                  {s?.activa ? "Activa" : "Inactiva"}
                                </span>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="4" className="text-center text-muted py-4">
                              Esta revista no tiene suscripciones en el rango seleccionado.
                            </td>
                          </tr>
                        )}
                      </tbody>

                      <tfoot className="table-light">
                        <tr>
                          <th colSpan="2" className="text-end">Total suscripciones:</th>
                          <th colSpan="2">{detalle?.totalSuscripciones ?? 0}</th>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>

                <div className="modal-footer">
                  <button
                    className="btn btn-secondary"
                    onClick={() => setDetalle(null)}
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="modal-backdrop fade show"></div>
        </>
      )}
    </div>
  );
}