import { useEffect, useMemo, useState } from "react";
import { getReporteGananciasAnunciantes } from "../../../services/reportesAdmin.service";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

function money(value) {
  const num = Number(value || 0);
  return `Q ${num.toFixed(2)}`;
}

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

function getTipoBadgeClass(tipo) {
  const t = (tipo || "").toUpperCase();
  if (t === "TEXTO") return "bg-primary";
  if (t === "VIDEO") return "bg-danger";
  if (t === "IMAGEN_TEXTO") return "bg-success";
  return "bg-secondary";
}

export default function ReporteGananciasAnunciantesPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [reporte, setReporte] = useState(null);

  const [anuncianteId, setAnuncianteId] = useState("");
  const [inicio, setInicio] = useState("");
  const [fin, setFin] = useState("");

  const [detalle, setDetalle] = useState(null);

  async function cargarReporte() {
    try {
      setLoading(true);
      setError("");

      const data = await getReporteGananciasAnunciantes({
        anuncianteId: anuncianteId || undefined,
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
    setAnuncianteId("");
    setInicio("");
    setFin("");
  }

  const anunciantes = useMemo(() => reporte?.anunciantes || [], [reporte]);

  const totalAnunciantes = useMemo(() => anunciantes.length, [anunciantes]);

  const totalCompras = useMemo(() => {
    return anunciantes.reduce(
      (acc, a) => acc + (Array.isArray(a?.anunciosPagados) ? a.anunciosPagados.length : 0),
      0
    );
  }, [anunciantes]);

  function exportarPdfResumen() {
    const doc = new jsPDF();

    doc.setFontSize(16);
    doc.text("Reporte de ganancias por anunciante", 14, 15);

    doc.setFontSize(10);
    doc.text(
      `Anunciante ID: ${anuncianteId || "Todos"} | Inicio: ${inicio || "Sin filtro"} | Fin: ${fin || "Sin filtro"}`,
      14,
      22
    );

    const body = anunciantes.map((a) => [
      a?.usernameAnunciante ?? "—",
      Array.isArray(a?.anunciosPagados) ? a.anunciosPagados.length : 0,
      money(a?.totalInvertido),
    ]);

    autoTable(doc, {
      startY: 28,
      head: [["Anunciante", "Cantidad de compras", "Total invertido"]],
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
    doc.text(`Total anunciantes: ${totalAnunciantes}`, 14, finalY);
    doc.text(`Total de compras: ${totalCompras}`, 14, finalY + 7);
    doc.text(`Total general ingresos: ${money(reporte?.totalGeneralIngresos)}`, 14, finalY + 14);

    doc.save("reporte-ganancias-por-anunciante.pdf");
  }

  function exportarPdfDetalleAnunciante(anunciante) {
    const doc = new jsPDF();

    doc.setFontSize(16);
    doc.text(`Detalle de anunciante: ${anunciante?.usernameAnunciante || "—"}`, 14, 15);

    doc.setFontSize(10);
    doc.text(
      `Inicio: ${inicio || "Sin filtro"} | Fin: ${fin || "Sin filtro"}`,
      14,
      22
    );

    const body = (anunciante?.anunciosPagados || []).map((item) => [
      item?.idAnuncio ?? "—",
      item?.tipo ?? "—",
      money(item?.montoPagado),
      formatDateTime(item?.fechaCompra),
    ]);

    autoTable(doc, {
      startY: 28,
      head: [["ID anuncio", "Tipo", "Monto pagado", "Fecha compra"]],
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
    doc.text(
      `Cantidad de compras: ${anunciante?.anunciosPagados?.length || 0}`,
      14,
      finalY
    );
    doc.text(
      `Total invertido: ${money(anunciante?.totalInvertido)}`,
      14,
      finalY + 7
    );

    doc.save(`detalle-anunciante-${anunciante?.usernameAnunciante || "reporte"}.pdf`);
  }

  return (
    <div className="container-fluid">
      <div className="d-flex flex-wrap justify-content-between align-items-start gap-3 mb-4">
        <div>
          <h2 className="fw-bold mb-1">Ganancias por anunciante</h2>
          <p className="text-muted mb-0">
            Consulta la inversión realizada por cada anunciante y el detalle de sus anuncios pagados.
          </p>
        </div>

        <button
          className="btn btn-danger"
          onClick={exportarPdfResumen}
          disabled={!reporte || loading || anunciantes.length === 0}
        >
          <i className="bi bi-file-earmark-pdf me-2"></i>
          Descargar PDF
        </button>
      </div>

      <div className="row g-3 mb-4">
        <div className="col-12 col-md-4">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <div className="text-muted small">Total anunciantes</div>
              <div className="fs-4 fw-bold">{totalAnunciantes}</div>
            </div>
          </div>
        </div>

        <div className="col-12 col-md-4">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <div className="text-muted small">Total de compras</div>
              <div className="fs-4 fw-bold">{totalCompras}</div>
            </div>
          </div>
        </div>

        <div className="col-12 col-md-4">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <div className="text-muted small">Total general ingresos</div>
              <div className="fs-4 fw-bold text-success">
                {money(reporte?.totalGeneralIngresos)}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card shadow-sm border-0 mb-4">
        <div className="card-body">
          <div className="row g-3 align-items-end">
            <div className="col-12 col-md-4">
              <label className="form-label fw-semibold">Anunciante ID</label>
              <input
                type="number"
                min="1"
                className="form-control"
                placeholder="Opcional"
                value={anuncianteId}
                onChange={(e) => setAnuncianteId(e.target.value)}
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
          <h5 className="mb-0 fw-semibold">Listado de anunciantes</h5>
        </div>

        <div className="card-body">
          <div className="table-responsive">
            <table className="table align-middle">
              <thead className="table-light">
                <tr>
                  <th>Anunciante</th>
                  <th>Cantidad de anuncios pagados</th>
                  <th>Total invertido</th>
                  <th>Acciones</th>
                </tr>
              </thead>

              <tbody>
                {!loading && anunciantes.length === 0 && (
                  <tr>
                    <td colSpan="4" className="text-center text-muted py-4">
                      No hay anunciantes para mostrar.
                    </td>
                  </tr>
                )}

                {anunciantes.map((a, index) => (
                  <tr key={`${a?.usernameAnunciante || "anunciante"}-${index}`}>
                    <td className="fw-semibold">{a?.usernameAnunciante || "—"}</td>
                    <td>{a?.anunciosPagados?.length || 0}</td>
                    <td className="fw-semibold text-success">{money(a?.totalInvertido)}</td>
                    <td>
                      <div className="d-flex flex-wrap gap-2">
                        <button
                          className="btn btn-sm btn-outline-secondary"
                          onClick={() => setDetalle(a)}
                        >
                          <i className="bi bi-eye me-1"></i>
                          Ver anuncios
                        </button>

                        <button
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => exportarPdfDetalleAnunciante(a)}
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
                    <th className="text-end">Totales:</th>
                    <th>{totalCompras}</th>
                    <th>{money(reporte.totalGeneralIngresos)}</th>
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
                    <h5 className="modal-title mb-1">Anuncios pagados del anunciante</h5>
                    <div className="text-muted small">
                      {detalle?.usernameAnunciante || "—"}
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
                      <div className="small text-muted">Cantidad de compras</div>
                      <div className="fw-bold">{detalle?.anunciosPagados?.length || 0}</div>
                    </div>

                    <div>
                      <div className="small text-muted">Total invertido</div>
                      <div className="fw-bold text-success">
                        {money(detalle?.totalInvertido)}
                      </div>
                    </div>

                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => exportarPdfDetalleAnunciante(detalle)}
                    >
                      <i className="bi bi-file-earmark-pdf me-2"></i>
                      Descargar PDF detalle
                    </button>
                  </div>

                  <div className="table-responsive">
                    <table className="table align-middle">
                      <thead className="table-light">
                        <tr>
                          <th>ID anuncio</th>
                          <th>Tipo</th>
                          <th>Anunciante</th>
                          <th>Monto pagado</th>
                          <th>Fecha compra</th>
                        </tr>
                      </thead>

                      <tbody>
                        {detalle?.anunciosPagados?.length > 0 ? (
                          detalle.anunciosPagados.map((item, index) => (
                            <tr key={`${item?.idAnuncio || "an"}-${index}`}>
                              <td>{item?.idAnuncio ?? "—"}</td>
                              <td>
                                <span className={`badge ${getTipoBadgeClass(item?.tipo)}`}>
                                  {item?.tipo || "—"}
                                </span>
                              </td>
                              <td>{item?.anunciante || "—"}</td>
                              <td>{money(item?.montoPagado)}</td>
                              <td>{formatDateTime(item?.fechaCompra)}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="5" className="text-center text-muted py-4">
                              Este anunciante no tiene anuncios pagados.
                            </td>
                          </tr>
                        )}
                      </tbody>

                      <tfoot className="table-light">
                        <tr>
                          <th colSpan="3" className="text-end">Total invertido:</th>
                          <th colSpan="2">{money(detalle?.totalInvertido)}</th>
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