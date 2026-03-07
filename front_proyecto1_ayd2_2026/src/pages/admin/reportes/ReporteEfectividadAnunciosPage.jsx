import { useEffect, useMemo, useState } from "react";
import { getReporteEfectividadAnuncios } from "../../../services/reportesAdmin.service";
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

function boolText(value) {
  return value ? "Sí" : "No";
}

export default function ReporteEfectividadAnunciosPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [reporte, setReporte] = useState(null);

  const [inicio, setInicio] = useState("");
  const [fin, setFin] = useState("");

  const [detalleAnunciante, setDetalleAnunciante] = useState(null);
  const [revistaDetalle, setRevistaDetalle] = useState(null);

  async function cargarReporte() {
    try {
      setLoading(true);
      setError("");

      const data = await getReporteEfectividadAnuncios({
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

  const anunciantes = useMemo(() => reporte?.anunciantes || [], [reporte]);

  const totalAnunciantes = useMemo(() => anunciantes.length, [anunciantes]);

  const totalRegistros = useMemo(() => {
    return anunciantes.reduce(
      (acc, item) => acc + (Array.isArray(item?.detalleAnuncios) ? item.detalleAnuncios.length : 0),
      0
    );
  }, [anunciantes]);

  const totalVistas = useMemo(() => {
    return anunciantes.reduce((acc, anunciante) => {
      const suma = (anunciante?.detalleAnuncios || []).reduce(
        (sub, detalle) => sub + Number(detalle?.cantidadVistas || 0),
        0
      );
      return acc + suma;
    }, 0);
  }, [anunciantes]);

  function totalVistasPorAnunciante(item) {
    return (item?.detalleAnuncios || []).reduce(
      (acc, detalle) => acc + Number(detalle?.cantidadVistas || 0),
      0
    );
  }

  function exportarPdfResumen() {
    const doc = new jsPDF();

    doc.setFontSize(16);
    doc.text("Reporte de efectividad de anuncios", 14, 15);

    doc.setFontSize(10);
    doc.text(
      `Inicio: ${inicio || "Sin filtro"} | Fin: ${fin || "Sin filtro"}`,
      14,
      22
    );

    const body = anunciantes.map((item) => [
      item?.usernameAnunciante ?? "—",
      item?.detalleAnuncios?.length || 0,
      totalVistasPorAnunciante(item),
    ]);

    autoTable(doc, {
      startY: 28,
      head: [["Anunciante", "Cantidad de registros", "Total vistas"]],
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
    doc.text(`Total registros: ${totalRegistros}`, 14, finalY + 7);
    doc.text(`Total vistas: ${totalVistas}`, 14, finalY + 14);

    doc.save("reporte-efectividad-anuncios.pdf");
  }

  function exportarPdfDetalleAnunciante(anunciante) {
    const doc = new jsPDF();

    doc.setFontSize(16);
    doc.text(`Detalle efectividad - ${anunciante?.usernameAnunciante || "Anunciante"}`, 14, 15);

    doc.setFontSize(10);
    doc.text(
      `Inicio: ${inicio || "Sin filtro"} | Fin: ${fin || "Sin filtro"}`,
      14,
      22
    );

    const body = (anunciante?.detalleAnuncios || []).map((d) => [
      d?.anuncioId ?? "—",
      textPreview(d?.textoAnuncio, 35),
      d?.cantidadVistas ?? 0,
      d?.url ?? "—",
      d?.revistaDondeSeMostro?.id ?? "—",
      d?.revistaDondeSeMostro?.titulo ?? "—",
    ]);

    autoTable(doc, {
      startY: 28,
      head: [[
        "ID anuncio",
        "Texto",
        "Vistas",
        "URL",
        "ID revista",
        "Revista",
      ]],
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
        1: { cellWidth: 40 },
        3: { cellWidth: 42 },
        5: { cellWidth: 45 },
      },
    });

    const finalY = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(11);
    doc.text(`Cantidad de registros: ${anunciante?.detalleAnuncios?.length || 0}`, 14, finalY);
    doc.text(`Total vistas: ${totalVistasPorAnunciante(anunciante)}`, 14, finalY + 7);

    doc.save(`detalle-efectividad-${anunciante?.usernameAnunciante || "anunciante"}.pdf`);
  }

  return (
    <div className="container-fluid">
      <div className="d-flex flex-wrap justify-content-between align-items-start gap-3 mb-4">
        <div>
          <h2 className="fw-bold mb-1">Efectividad de anuncios</h2>
          <p className="text-muted mb-0">
            Consulta cuántas veces se mostraron los anuncios, en qué URL aparecieron y en qué revista fueron visualizados.
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
              <div className="text-muted small">Total registros</div>
              <div className="fs-4 fw-bold">{totalRegistros}</div>
            </div>
          </div>
        </div>

        <div className="col-12 col-md-4">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <div className="text-muted small">Total vistas</div>
              <div className="fs-4 fw-bold text-primary">{totalVistas}</div>
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
          <h5 className="mb-0 fw-semibold">Resumen por anunciante</h5>
        </div>

        <div className="card-body">
          <div className="table-responsive">
            <table className="table align-middle">
              <thead className="table-light">
                <tr>
                  <th>Anunciante</th>
                  <th>Cantidad de registros</th>
                  <th>Total vistas</th>
                  <th>Acciones</th>
                </tr>
              </thead>

              <tbody>
                {!loading && anunciantes.length === 0 && (
                  <tr>
                    <td colSpan="4" className="text-center text-muted py-4">
                      No hay registros de efectividad para mostrar.
                    </td>
                  </tr>
                )}

                {anunciantes.map((item, index) => (
                  <tr key={`${item?.usernameAnunciante || "anunciante"}-${index}`}>
                    <td className="fw-semibold">{item?.usernameAnunciante || "—"}</td>
                    <td>{item?.detalleAnuncios?.length || 0}</td>
                    <td className="fw-semibold text-primary">{totalVistasPorAnunciante(item)}</td>
                    <td>
                      <div className="d-flex flex-wrap gap-2">
                        <button
                          className="btn btn-sm btn-outline-secondary"
                          onClick={() => setDetalleAnunciante(item)}
                        >
                          <i className="bi bi-eye me-1"></i>
                          Ver detalle
                        </button>

                        <button
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => exportarPdfDetalleAnunciante(item)}
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
                    <th>{totalRegistros}</th>
                    <th>{totalVistas}</th>
                    <th></th>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      </div>

      {detalleAnunciante && (
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
                    <h5 className="modal-title mb-1">Detalle de efectividad por anunciante</h5>
                    <div className="text-muted small">
                      {detalleAnunciante?.usernameAnunciante || "—"}
                    </div>
                  </div>

                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setDetalleAnunciante(null)}
                  ></button>
                </div>

                <div className="modal-body">
                  <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
                    <div>
                      <div className="small text-muted">Cantidad de registros</div>
                      <div className="fw-bold">{detalleAnunciante?.detalleAnuncios?.length || 0}</div>
                    </div>

                    <div>
                      <div className="small text-muted">Total vistas</div>
                      <div className="fw-bold text-primary">
                        {totalVistasPorAnunciante(detalleAnunciante)}
                      </div>
                    </div>

                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => exportarPdfDetalleAnunciante(detalleAnunciante)}
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
                          <th>Texto anuncio</th>
                          <th>Vistas</th>
                          <th>URL</th>
                          <th>Revista mostrado</th>
                          <th>Acciones</th>
                        </tr>
                      </thead>

                      <tbody>
                        {detalleAnunciante?.detalleAnuncios?.length > 0 ? (
                          detalleAnunciante.detalleAnuncios.map((d, index) => (
                            <tr key={`${d?.anuncioId || "detalle"}-${index}`}>
                              <td>{d?.anuncioId ?? ""}</td>
                              <td>{textPreview(d?.textoAnuncio, 70)??""}</td>
                              <td className="fw-semibold">{d?.cantidadVistas ?? 0}</td>
                              <td className="small">{d?.url ?? ""}</td>
                              <td>
                                <div className="fw-semibold">
                                  {d?.revistaDondeSeMostro?.titulo ?? ""}
                                </div>
                                <div className="text-muted small">
                                  ID: {d?.revistaDondeSeMostro?.id ?? ""}
                                </div>
                              </td>
                              <td>
                                <button
                                  className="btn btn-sm btn-outline-secondary"
                                  onClick={() => setRevistaDetalle(d?.revistaDondeSeMostro || null)}
                                >
                                  <i className="bi bi-journal-text me-1"></i>
                                  Ver revista
                                </button>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="6" className="text-center text-muted py-4">
                              Este anunciante no tiene detalles de efectividad.
                            </td>
                          </tr>
                        )}
                      </tbody>

                      <tfoot className="table-light">
                        <tr>
                          <th colSpan="2" className="text-end">Total vistas:</th>
                          <th>{totalVistasPorAnunciante(detalleAnunciante)}</th>
                          <th colSpan="3"></th>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>

                <div className="modal-footer">
                  <button
                    className="btn btn-secondary"
                    onClick={() => setDetalleAnunciante(null)}
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

      {revistaDetalle && (
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
                    <h5 className="modal-title mb-1">Detalle de revista donde se mostró</h5>
                    <div className="text-muted small">
                      {revistaDetalle?.titulo || "—"}
                    </div>
                  </div>

                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setRevistaDetalle(null)}
                  ></button>
                </div>

                <div className="modal-body">
                  <div className="row g-3">
                    <div className="col-12 col-md-6">
                      <div className="border rounded p-3 h-100">
                        <h6 className="fw-bold">Datos generales</h6>
                        <p className="mb-2"><strong>ID:</strong> {revistaDetalle?.id ?? "—"}</p>
                        <p className="mb-2"><strong>Título:</strong> {revistaDetalle?.titulo ?? "—"}</p>
                        <p className="mb-2"><strong>Descripción:</strong> {revistaDetalle?.descripcion ?? "—"}</p>
                        <p className="mb-2"><strong>Activa:</strong> {boolText(revistaDetalle?.activa)}</p>
                        <p className="mb-2"><strong>Fecha creación:</strong> {formatDate(revistaDetalle?.fechaCreacion)}</p>
                        <p className="mb-0"><strong>Categoría:</strong> {revistaDetalle?.categoria?.nombre ?? "—"}</p>
                      </div>
                    </div>

                    <div className="col-12 col-md-6">
                      <div className="border rounded p-3 h-100">
                        <h6 className="fw-bold">Métricas</h6>
                        <p className="mb-2"><strong>Likes:</strong> {revistaDetalle?.cantidadLikes ?? 0}</p>
                        <p className="mb-2"><strong>Comentarios:</strong> {revistaDetalle?.cantidadComentarios ?? 0}</p>
                        <p className="mb-2"><strong>Suscripciones:</strong> {revistaDetalle?.cantidadSuscripciones ?? 0}</p>
                        <p className="mb-2"><strong>Permite likes:</strong> {boolText(revistaDetalle?.permiteLikes)}</p>
                        <p className="mb-2"><strong>Permite comentarios:</strong> {boolText(revistaDetalle?.permiteComentarios)}</p>
                        <p className="mb-0"><strong>Permite suscripciones:</strong> {boolText(revistaDetalle?.permiteSuscripciones)}</p>
                      </div>
                    </div>

                    <div className="col-12">
                      <div className="border rounded p-3">
                        <h6 className="fw-bold">Editor</h6>
                        <div className="row g-3 align-items-center">
                          <div className="col-12 col-md-9">
                            <p className="mb-2">
                              <strong>Nombre:</strong> {revistaDetalle?.editor?.nombre} {revistaDetalle?.editor?.apellido}
                            </p>
                            <p className="mb-2">
                              <strong>Username:</strong> {revistaDetalle?.editor?.username ?? "—"}
                            </p>
                            <p className="mb-2">
                              <strong>Correo:</strong> {revistaDetalle?.editor?.correo ?? "—"}
                            </p>
                            <p className="mb-0">
                              <strong>Estado:</strong> {revistaDetalle?.editor?.estado ?? "—"}
                            </p>
                          </div>

                          <div className="col-12 col-md-3">
                            {revistaDetalle?.editor?.perfilUrl && (
                              <img
                                src={revistaDetalle.editor.perfilUrl}
                                alt="Perfil editor"
                                className="rounded border"
                                style={{ width: 100, height: 100, objectFit: "cover" }}
                              />
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="col-12 col-md-6">
                      <div className="border rounded p-3 h-100">
                        <h6 className="fw-bold">Etiquetas</h6>
                        <div className="d-flex flex-wrap gap-2">
                          {revistaDetalle?.etiquetas?.length > 0 ? (
                            revistaDetalle.etiquetas.map((et) => (
                              <span key={et.id} className="badge bg-secondary">
                                {et.nombre}
                              </span>
                            ))
                          ) : (
                            <span className="text-muted">Sin etiquetas</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="col-12 col-md-6">
                      <div className="border rounded p-3 h-100">
                        <h6 className="fw-bold">Ediciones</h6>
                        {revistaDetalle?.ediciones?.length > 0 ? (
                          <div className="table-responsive">
                            <table className="table table-sm align-middle mb-0">
                              <thead className="table-light">
                                <tr>
                                  <th>ID</th>
                                  <th>Número</th>
                                  <th>Título</th>
                                  <th>Fecha</th>
                                </tr>
                              </thead>
                              <tbody>
                                {revistaDetalle.ediciones.map((ed) => (
                                  <tr key={ed.id}>
                                    <td>{ed.id}</td>
                                    <td>{ed.numeroEdicion}</td>
                                    <td>{ed.titulo}</td>
                                    <td>{formatDateTime(ed.fechaPublicacion)}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <div className="text-muted">Sin ediciones</div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="modal-footer">
                  <button
                    className="btn btn-secondary"
                    onClick={() => setRevistaDetalle(null)}
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