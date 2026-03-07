import { useEffect, useMemo, useState } from "react";
import { getReporteTopComentadas } from "../../../services/reportesAdmin.service";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

function formatDateTime(value) {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleString("es-GT");
  } catch {
    return value;
  }
}

function toStartDateTime(date) {
  return date ? `${date}T00:00:00` : undefined;
}

function toEndDateTime(date) {
  return date ? `${date}T23:59:59` : undefined;
}

function textPreview(text, max = 90) {
  if (!text) return "—";
  return text.length > max ? `${text.slice(0, max)}...` : text;
}

export default function ReporteTopComentadasPage() {
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

      const data = await getReporteTopComentadas({
        inicio: toStartDateTime(inicio),
        fin: toEndDateTime(fin),
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

  const totalComentarios = useMemo(() => {
    return topRevistas.reduce((acc, item) => acc + Number(item?.totalComentarios || 0), 0);
  }, [topRevistas]);

  function exportarPdfResumen() {
    const doc = new jsPDF();

    doc.setFontSize(16);
    doc.text("Reporte Top 5 revistas más comentadas", 14, 15);

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
      item?.totalComentarios ?? 0,
    ]);

    autoTable(doc, {
      startY: 28,
      head: [["Top", "ID revista", "Título", "Total comentarios"]],
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
    doc.text(`Total comentarios acumulados: ${totalComentarios}`, 14, finalY + 7);

    doc.save("reporte-top-5-revistas-comentadas.pdf");
  }

  function exportarPdfDetalleRevista(revista) {
    const doc = new jsPDF();

    doc.setFontSize(16);
    doc.text(`Detalle de comentarios - ${revista?.titulo || "Revista"}`, 14, 15);

    doc.setFontSize(10);
    doc.text(
      `Inicio: ${inicio || "Sin filtro"} | Fin: ${fin || "Sin filtro"}`,
      14,
      22
    );

    const body = (revista?.comentarios || []).map((c, index) => [
      index + 1,
      c?.username ?? "—",
      c?.contenido ?? "—",
      formatDateTime(c?.fechaCreacion),
    ]);

    autoTable(doc, {
      startY: 28,
      head: [["#", "Username", "Comentario", "Fecha creación"]],
      body,
      styles: {
        fontSize: 8,
        cellPadding: 2,
        overflow: "linebreak",
      },
      headStyles: {
        fillColor: [13, 110, 253],
      },
      columnStyles: {
        2: { cellWidth: 90 },
      },
    });

    const finalY = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(11);
    doc.text(`Total comentarios: ${revista?.totalComentarios || 0}`, 14, finalY);

    doc.save(`detalle-comentarios-revista-${revista?.revistaId || "top"}.pdf`);
  }

  return (
    <div className="container-fluid">
      <div className="d-flex flex-wrap justify-content-between align-items-start gap-3 mb-4">
        <div>
          <h2 className="fw-bold mb-1">Top 5 revistas más comentadas</h2>
          <p className="text-muted mb-0">
            Consulta las revistas con mayor cantidad de comentarios en el rango de fechas seleccionado.
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
              <div className="text-muted small">Total comentarios acumulados</div>
              <div className="fs-4 fw-bold text-primary">{totalComentarios}</div>
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
          <h5 className="mb-0 fw-semibold">Ranking de revistas comentadas</h5>
        </div>

        <div className="card-body">
          <div className="table-responsive">
            <table className="table align-middle">
              <thead className="table-light">
                <tr>
                  <th>Top</th>
                  <th>ID revista</th>
                  <th>Título</th>
                  <th>Total comentarios</th>
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
                    <td>{item?.totalComentarios ?? 0}</td>
                    <td>
                      <div className="d-flex flex-wrap gap-2">
                        <button
                          className="btn btn-sm btn-outline-secondary"
                          onClick={() => setDetalle(item)}
                        >
                          <i className="bi bi-eye me-1"></i>
                          Ver comentarios
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
                    <th>{totalComentarios}</th>
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
                    <h5 className="modal-title mb-1">Comentarios de la revista</h5>
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
                      <div className="small text-muted">Total comentarios</div>
                      <div className="fw-bold text-primary">
                        {detalle?.totalComentarios ?? 0}
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
                          <th>Comentario</th>
                          <th>Fecha creación</th>
                        </tr>
                      </thead>

                      <tbody>
                        {detalle?.comentarios?.length > 0 ? (
                          detalle.comentarios.map((c, index) => (
                            <tr key={`${c?.username || "coment"}-${index}`}>
                              <td>{index + 1}</td>
                              <td className="fw-semibold">{c?.username ?? "—"}</td>
                              <td>{c?.contenido ?? "—"}</td>
                              <td>{formatDateTime(c?.fechaCreacion)}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="4" className="text-center text-muted py-4">
                              Esta revista no tiene comentarios en el rango seleccionado.
                            </td>
                          </tr>
                        )}
                      </tbody>

                      <tfoot className="table-light">
                        <tr>
                          <th colSpan="2" className="text-end">Total comentarios:</th>
                          <th colSpan="2">{detalle?.totalComentarios ?? 0}</th>
                        </tr>
                      </tfoot>
                    </table>
                  </div>

                  {detalle?.comentarios?.length > 0 && (
                    <div className="mt-3">
                      <div className="small text-muted mb-2">Vista rápida</div>
                      <div className="row g-3">
                        {detalle.comentarios.map((c, index) => (
                          <div className="col-12 col-md-6" key={`card-${index}`}>
                            <div className="border rounded p-3 h-100">
                              <div className="d-flex justify-content-between align-items-start gap-2 mb-2">
                                <strong>{c?.username ?? "—"}</strong>
                                <span className="text-muted small">
                                  {formatDateTime(c?.fechaCreacion)}
                                </span>
                              </div>
                              <div>{textPreview(c?.contenido, 180)}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
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