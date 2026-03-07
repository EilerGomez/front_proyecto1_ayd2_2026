import { useEffect, useMemo, useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { getUser } from "../../../auth/authService";
import { getReporteComentariosEditor } from "../../../services/reportesEditor.service";

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

function textPreview(text, max = 100) {
  if (!text) return "—";
  return text.length > max ? `${text.slice(0, max)}...` : text;
}

export default function ReporteComentariosEditorPage() {
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

      const data = await getReporteComentariosEditor(editorId, {
        revistaId: revistaId || undefined,
        inicio: toStartDateTime(inicio),
        fin: toEndDateTime(fin),
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

  const totalComentarios = useMemo(() => {
    return items.reduce((acc, item) => acc + Number(item?.totalComentarios || 0), 0);
  }, [items]);

  function exportarPdfResumen() {
    const doc = new jsPDF();

    doc.setFontSize(16);
    doc.text("Reporte de comentarios por revista", 14, 15);

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
      item?.totalComentarios ?? 0,
    ]);

    autoTable(doc, {
      startY: 28,
      head: [["ID revista", "Título", "Categoría", "Total comentarios"]],
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
        1: { cellWidth: 90 },
      },
    });

    const finalY = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(11);
    doc.text(`Total revistas: ${totalRevistas}`, 14, finalY);
    doc.text(`Total comentarios: ${totalComentarios}`, 14, finalY + 7);

    doc.save("reporte-comentarios-editor.pdf");
  }

  function exportarPdfDetalleRevista(item) {
    const doc = new jsPDF();

    doc.setFontSize(16);
    doc.text(`Detalle de comentarios - Revista ${item?.revista?.id ?? ""}`, 14, 15);

    doc.setFontSize(10);
    doc.text(
      `${item?.revista?.titulo || "Sin título"}`,
      14,
      22
    );

    const body = (item?.detalles || []).map((d, index) => [
      index + 1,
      d?.username ?? "—",
      d?.contenido ?? "—",
      formatDateTime(d?.fechaCreacion),
    ]);

    autoTable(doc, {
      startY: 28,
      head: [["#", "Usuario", "Comentario", "Fecha creación"]],
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
        2: { cellWidth: 95 },
      },
    });

    const finalY = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(11);
    doc.text(`Total comentarios: ${item?.totalComentarios || 0}`, 14, finalY);

    doc.save(`detalle-comentarios-revista-${item?.revista?.id || "editor"}.pdf`);
  }

  return (
    <div className="container-fluid">
      <div className="d-flex flex-wrap justify-content-between align-items-start gap-3 mb-4">
        <div>
          <h2 className="fw-bold mb-1">Comentarios por revista</h2>
          <p className="text-muted mb-0">
            Consulta los comentarios recibidos por tus revistas en un intervalo de tiempo.
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
        <div className="col-12 col-md-6">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <div className="text-muted small">Revistas con comentarios</div>
              <div className="fs-4 fw-bold">{totalRevistas}</div>
            </div>
          </div>
        </div>

        <div className="col-12 col-md-6">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <div className="text-muted small">Total de comentarios</div>
              <div className="fs-4 fw-bold text-primary">{totalComentarios}</div>
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
          <h5 className="mb-0 fw-semibold">Comentarios por revista</h5>
        </div>

        <div className="card-body">
          <div className="table-responsive">
            <table className="table align-middle">
              <thead className="table-light">
                <tr>
                  <th>ID revista</th>
                  <th>Título</th>
                  <th>Categoría</th>
                  <th>Total comentarios</th>
                  <th>Acciones</th>
                </tr>
              </thead>

              <tbody>
                {!loading && items.length === 0 && (
                  <tr>
                    <td colSpan="5" className="text-center text-muted py-4">
                      No hay comentarios para mostrar.
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
                    <td className="fw-semibold text-primary">{item?.totalComentarios ?? 0}</td>
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

              <tfoot className="table-light">
                <tr>
                  <th colSpan="3" className="text-end">Totales:</th>
                  <th>{totalComentarios}</th>
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
                    <h5 className="modal-title mb-1">Detalle de comentarios</h5>
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
                        <p className="mb-0">
                          <strong>Total comentarios:</strong> {detalle?.totalComentarios ?? 0}
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
                          <th>Usuario</th>
                          <th>Comentario</th>
                          <th>Fecha creación</th>
                        </tr>
                      </thead>

                      <tbody>
                        {detalle?.detalles?.length > 0 ? (
                          detalle.detalles.map((d, index) => (
                            <tr key={`${d?.username || "coment"}-${index}`}>
                              <td>{index + 1}</td>
                              <td className="fw-semibold">{d?.username ?? "—"}</td>
                              <td>{d?.contenido ?? "—"}</td>
                              <td>{formatDateTime(d?.fechaCreacion)}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="4" className="text-center text-muted py-4">
                              No hay comentarios para esta revista.
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