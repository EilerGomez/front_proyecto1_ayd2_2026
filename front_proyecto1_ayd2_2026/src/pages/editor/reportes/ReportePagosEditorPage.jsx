import { useEffect, useMemo, useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { getUser } from "../../../auth/authService";
import { getReportePagosEditor } from "../../../services/reportesEditor.service";

function money(value) {
  const num = Number(value || 0);
  return `Q ${num.toFixed(2)}`;
}

function formatDate(value) {
  if (!value) return "—";
  try {
    return new Date(`${value}T00:00:00`).toLocaleDateString("es-GT");
  } catch {
    return value;
  }
}

function textPreview(text, max = 100) {
  if (!text) return "—";
  return text.length > max ? `${text.slice(0, max)}...` : text;
}

export default function ReportePagosEditorPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [items, setItems] = useState([]);

  const [revistaId, setRevistaId] = useState("");
  const [inicio, setInicio] = useState("");
  const [fin, setFin] = useState("");

  const [detalle, setDetalle] = useState(null);

  const user = getUser();
  const editorId = user?.id;

  async function cargarReporte() {
    if (!editorId) {
      setError("No se pudo identificar al editor autenticado.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const data = await getReportePagosEditor(editorId, {
        revistaId: revistaId || undefined,
        inicio: inicio || undefined,
        fin: fin || undefined,
      });

      setItems(Array.isArray(data) ? data : []);
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
    setRevistaId("");
    setInicio("");
    setFin("");
  }

  const totalRevistas = useMemo(() => items.length, [items]);

  const totalPagos = useMemo(() => {
    return items.reduce((acc, item) => acc + (item?.detalles?.length || 0), 0);
  }, [items]);

  const totalMontoGeneral = useMemo(() => {
    return items.reduce((acc, item) => acc + Number(item?.sumaMontoTotal || 0), 0);
  }, [items]);

  function exportarPdfResumen() {
    const doc = new jsPDF();

    doc.setFontSize(16);
    doc.text("Reporte de pagos por revista", 14, 15);

    doc.setFontSize(10);
    doc.text(
      `Revista ID: ${revistaId || "Todas"} | Inicio: ${inicio || "Sin filtro"} | Fin: ${fin || "Sin filtro"}`,
      14,
      22
    );

    const body = items.map((item) => [
      item?.revista?.id ?? "—",
      item?.revista?.titulo ?? "—",
      item?.revista?.categoria ?? "—",
      item?.detalles?.length || 0,
      money(item?.sumaMontoTotal),
    ]);

    autoTable(doc, {
      startY: 28,
      head: [["ID revista", "Título", "Categoría", "Cantidad pagos", "Total pagado"]],
      body,
      styles: {
        fontSize: 9,
        cellPadding: 2,
        overflow: "linebreak",
      },
      headStyles: {
        fillColor: [13, 110, 253],
      },
      columnStyles: {
        1: { cellWidth: 78 },
      },
    });

    const finalY = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(11);
    doc.text(`Total revistas: ${totalRevistas}`, 14, finalY);
    doc.text(`Total de pagos: ${totalPagos}`, 14, finalY + 7);
    doc.text(`Monto total pagado: ${money(totalMontoGeneral)}`, 14, finalY + 14);

    doc.save("reporte-pagos-editor.pdf");
  }

  function exportarPdfDetalleRevista(item) {
    const doc = new jsPDF();

    doc.setFontSize(16);
    doc.text(`Detalle de pagos - Revista ${item?.revista?.id ?? ""}`, 14, 15);

    doc.setFontSize(10);
    doc.text(item?.revista?.titulo || "Sin título", 14, 22);

    const body = (item?.detalles || []).map((d, index) => [
      index + 1,
      money(d?.monto),
      formatDate(d?.fechaPago),
      formatDate(d?.periodoInicio),
      formatDate(d?.periodoFin),
    ]);

    autoTable(doc, {
      startY: 28,
      head: [["#", "Monto", "Fecha pago", "Periodo inicio", "Periodo fin"]],
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
    doc.text(`Cantidad de pagos: ${item?.detalles?.length || 0}`, 14, finalY);
    doc.text(`Total pagado: ${money(item?.sumaMontoTotal)}`, 14, finalY + 7);

    doc.save(`detalle-pagos-revista-${item?.revista?.id || "editor"}.pdf`);
  }

  return (
    <div className="container-fluid">
      <div className="d-flex flex-wrap justify-content-between align-items-start gap-3 mb-4">
        <div>
          <h2 className="fw-bold mb-1">Pagos hechos por revista</h2>
          <p className="text-muted mb-0">
            Consulta los pagos realizados a tus revistas dentro de un intervalo de tiempo.
          </p>
        </div>

        <button
          className="btn btn-danger"
          onClick={exportarPdfResumen}
          disabled={loading || items.length === 0}
        >
          <i className="bi bi-file-earmark-pdf me-2"></i>
          Descargar PDF
        </button>
      </div>

      <div className="row g-3 mb-4">
        <div className="col-12 col-md-4">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <div className="text-muted small">Revistas con pagos</div>
              <div className="fs-4 fw-bold">{totalRevistas}</div>
            </div>
          </div>
        </div>

        <div className="col-12 col-md-4">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <div className="text-muted small">Cantidad total de pagos</div>
              <div className="fs-4 fw-bold text-primary">{totalPagos}</div>
            </div>
          </div>
        </div>

        <div className="col-12 col-md-4">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <div className="text-muted small">Monto total pagado</div>
              <div className="fs-4 fw-bold text-success">{money(totalMontoGeneral)}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="card shadow-sm border-0 mb-4">
        <div className="card-body">
          <div className="row g-3 align-items-end">
            <div className="col-12 col-md-4">
              <label className="form-label fw-semibold">Revista ID</label>
              <input
                type="number"
                min="1"
                className="form-control"
                placeholder="Opcional"
                value={revistaId}
                onChange={(e) => setRevistaId(e.target.value)}
              />
            </div>

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

            <div className="col-12">
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
          <h5 className="mb-0 fw-semibold">Pagos por revista</h5>
        </div>

        <div className="card-body">
          <div className="table-responsive">
            <table className="table align-middle">
              <thead className="table-light">
                <tr>
                  <th>ID revista</th>
                  <th>Título</th>
                  <th>Categoría</th>
                  <th>Cantidad pagos</th>
                  <th>Total pagado</th>
                  <th>Acciones</th>
                </tr>
              </thead>

              <tbody>
                {!loading && items.length === 0 && (
                  <tr>
                    <td colSpan="6" className="text-center text-muted py-4">
                      No hay pagos para mostrar.
                    </td>
                  </tr>
                )}

                {items.map((item, index) => (
                  <tr key={`${item?.revista?.id || "rev"}-${index}`}>
                    <td>{item?.revista?.id ?? "—"}</td>
                    <td>
                      <div className="fw-semibold">{item?.revista?.titulo ?? "—"}</div>
                      <div className="text-muted small">
                        {textPreview(item?.revista?.descripcion, 100)}
                      </div>
                    </td>
                    <td>{item?.revista?.categoria ?? "—"}</td>
                    <td>{item?.detalles?.length || 0}</td>
                    <td className="fw-semibold text-success">{money(item?.sumaMontoTotal)}</td>
                    <td>
                      <div className="d-flex flex-wrap gap-2">
                        <button
                          className="btn btn-sm btn-outline-secondary"
                          onClick={() => setDetalle(item)}
                        >
                          <i className="bi bi-eye me-1"></i>
                          Ver pagos
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

              <tfoot className="table-light">
                <tr>
                  <th colSpan="3" className="text-end">Totales:</th>
                  <th>{totalPagos}</th>
                  <th>{money(totalMontoGeneral)}</th>
                  <th></th>
                </tr>
              </tfoot>
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
            <div className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
              <div className="modal-content border-0 shadow">
                <div className="modal-header">
                  <div>
                    <h5 className="modal-title mb-1">Detalle de pagos</h5>
                    <div className="text-muted small">
                      {detalle?.revista?.titulo || "—"}
                    </div>
                  </div>

                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setDetalle(null)}
                  ></button>
                </div>

                <div className="modal-body">
                  <div className="row g-3 mb-3">
                    <div className="col-12 col-md-8">
                      <div className="border rounded p-3 h-100">
                        <h6 className="fw-bold">Información de revista</h6>
                        <p className="mb-2">
                          <strong>ID:</strong> {detalle?.revista?.id ?? "—"}
                        </p>
                        <p className="mb-2">
                          <strong>Título:</strong> {detalle?.revista?.titulo ?? "—"}
                        </p>
                        <p className="mb-2">
                          <strong>Categoría:</strong> {detalle?.revista?.categoria ?? "—"}
                        </p>
                        <p className="mb-0">
                          <strong>Descripción:</strong> {detalle?.revista?.descripcion ?? "—"}
                        </p>
                      </div>
                    </div>

                    <div className="col-12 col-md-4">
                      <div className="border rounded p-3 h-100">
                        <h6 className="fw-bold">Resumen</h6>
                        <p className="mb-2">
                          <strong>Cantidad de pagos:</strong> {detalle?.detalles?.length || 0}
                        </p>
                        <p className="mb-0">
                          <strong>Total pagado:</strong> {money(detalle?.sumaMontoTotal)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="d-flex justify-content-end mb-3">
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
                          <th>Monto</th>
                          <th>Fecha pago</th>
                          <th>Periodo inicio</th>
                          <th>Periodo fin</th>
                        </tr>
                      </thead>

                      <tbody>
                        {detalle?.detalles?.length > 0 ? (
                          detalle.detalles.map((d, index) => (
                            <tr key={`pago-${index}`}>
                              <td>{index + 1}</td>
                              <td className="fw-semibold">{money(d?.monto)}</td>
                              <td>{formatDate(d?.fechaPago)}</td>
                              <td>{formatDate(d?.periodoInicio)}</td>
                              <td>{formatDate(d?.periodoFin)}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="5" className="text-center text-muted py-4">
                              No hay pagos para esta revista.
                            </td>
                          </tr>
                        )}
                      </tbody>

                      <tfoot className="table-light">
                        <tr>
                          <th colSpan="2" className="text-end">Total pagado:</th>
                          <th colSpan="3">{money(detalle?.sumaMontoTotal)}</th>
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