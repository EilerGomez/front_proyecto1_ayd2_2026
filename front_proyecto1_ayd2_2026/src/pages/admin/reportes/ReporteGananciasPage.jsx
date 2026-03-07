import { useEffect, useMemo, useState } from "react";
import { getReporteGanancias } from "../../../services/reportesAdmin.service";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

function money(value) {
  const num = Number(value || 0);
  return `Q ${num.toFixed(2)}`;
}

function formatDate(dateStr) {
  if (!dateStr) return "—";
  try {
    return new Date(`${dateStr}T00:00:00`).toLocaleDateString("es-GT");
  } catch {
    return dateStr;
  }
}

function formatDateTime(dateStr) {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleString("es-GT");
  } catch {
    return dateStr;
  }
}

function calcularCostoTotalRevista(costos = []) {
  return costos.reduce((acc, c) => acc + Number(c.costoPorDia || 0), 0);
}

function getTipoBadgeClass(tipo) {
  const t = (tipo || "").toUpperCase();
  if (t === "TEXTO") return "bg-primary";
  if (t === "VIDEO") return "bg-danger";
  if (t === "IMAGEN_TEXTO") return "bg-success";
  return "bg-secondary";
}

function getEstadoBadgeClass(estado) {
  const e = (estado || "").toUpperCase();
  if (e === "ACTIVO") return "bg-success";
  if (e === "EXPIRADO") return "bg-secondary";
  if (e === "PENDIENTE") return "bg-warning text-dark";
  return "bg-dark";
}

function resumirContenidoAnuncio(anuncio) {
  if (!anuncio) return "—";
  if (anuncio.texto) {
    return anuncio.texto.length > 60
      ? `${anuncio.texto.slice(0, 60)}...`
      : anuncio.texto;
  }
  if (anuncio.imagenUrl) return "Anuncio con imagen";
  if (anuncio.videoUrl) return "Anuncio con video";
  if (anuncio.urlDestino) return anuncio.urlDestino;
  return "—";
}

export default function ReporteGananciasPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [reporte, setReporte] = useState(null);

  const [inicio, setInicio] = useState("");
  const [fin, setFin] = useState("");

  const [vista, setVista] = useState("revistas");
  const [revistaSeleccionada, setRevistaSeleccionada] = useState(null);
  const [anuncioSeleccionado, setAnuncioSeleccionado] = useState(null);

  async function cargarReporte() {
    try {
      setLoading(true);
      setError("");

      const data = await getReporteGanancias({
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

  const revistas = useMemo(() => reporte?.reporteRevistas || [], [reporte]);
  const anuncios = useMemo(() => reporte?.anunciosComprados || [], [reporte]);

  function limpiarFiltros() {
    setInicio("");
    setFin("");
  }

  function exportarPdfRevistas() {
    const doc = new jsPDF();

    doc.setFontSize(16);
    doc.text("Reporte de Ganancias - Revistas", 14, 15);

    doc.setFontSize(10);
    doc.text(
      `Filtro inicio: ${inicio || "Sin filtro"} | Filtro fin: ${fin || "Sin filtro"}`,
      14,
      22
    );

    const body = revistas.map((r) => {
      const ingresosEditor = Number(r.ingresosPagosEditor || 0);
      const costoTotalRevista = calcularCostoTotalRevista(r.costos || []);

      return [
        r.revistaId,
        r.nombreRevista,
        money(ingresosEditor),
        money(costoTotalRevista),
      ];
    });

    autoTable(doc, {
      startY: 28,
      head: [["ID", "Revista", "Ingresos editor", "Costos"]],
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
    doc.text(`Costos total: ${money(reporte?.costosTotal)}`, 14, finalY);
    doc.text(`Total ingresos: ${money(reporte?.totalIngresos)}`, 14, finalY + 7);
    doc.text(`Total anuncios: ${money(reporte?.totalAnuncios)}`, 14, finalY + 14);
    doc.text(`Total ganancias: ${money(reporte?.totalGanancias)}`, 14, finalY + 21);

    doc.save("reporte-ganancias-revistas.pdf");
  }

  function exportarPdfAnuncios() {
    const doc = new jsPDF();

    doc.setFontSize(16);
    doc.text("Reporte de Ganancias - Anuncios Comprados", 14, 15);

    doc.setFontSize(10);
    doc.text(
      `Filtro inicio: ${inicio || "Sin filtro"} | Filtro fin: ${fin || "Sin filtro"}`,
      14,
      22
    );

    const body = anuncios.map((a) => [
      a?.anuncio?.id ?? "—",
      a?.anuncio?.tipoAnuncio?.codigo ?? "—",
      a?.anuncio?.anunciante?.username ?? "—",
      resumirContenidoAnuncio(a?.anuncio),
      money(a?.montoPagado),
      formatDateTime(a?.fechaInicio),
      formatDateTime(a?.fechaFin),
      a?.estadoCompra ?? "—",
    ]);

    autoTable(doc, {
      startY: 28,
      head: [[
        "ID anuncio",
        "Tipo",
        "Anunciante",
        "Contenido",
        "Monto pagado",
        "Fecha inicio",
        "Fecha fin",
        "Estado compra",
      ]],
      body,
      styles: {
        fontSize: 8,
        cellPadding: 2,
      },
      headStyles: {
        fillColor: [13, 110, 253],
      },
    });

    const finalY = doc.lastAutoTable.finalY + 10;

    doc.setFontSize(11);
    doc.text(`Costos total: ${money(reporte?.costosTotal)}`, 14, finalY);
    doc.text(`Total ingresos: ${money(reporte?.totalIngresos)}`, 14, finalY + 7);
    doc.text(`Total anuncios: ${money(reporte?.totalAnuncios)}`, 14, finalY + 14);
    doc.text(`Total ganancias: ${money(reporte?.totalGanancias)}`, 14, finalY + 21);

    doc.save("reporte-ganancias-anuncios.pdf");
  }

  function exportarPdf() {
    if (!reporte) return;
    if (vista === "revistas") exportarPdfRevistas();
    else exportarPdfAnuncios();
  }

  return (
    <div className="container-fluid">
      <div className="d-flex flex-wrap justify-content-between align-items-start gap-3 mb-4">
        <div>
          <h2 className="fw-bold mb-1">Reporte de ganancias</h2>
          <p className="text-muted mb-0">
            Consulta ingresos por editor, anuncios comprados, costos y totales generales.
          </p>
        </div>

        <button
          className="btn btn-danger"
          onClick={exportarPdf}
          disabled={!reporte || loading}
        >
          <i className="bi bi-file-earmark-pdf me-2"></i>
          Descargar PDF
        </button>
      </div>

      <div className="row g-3 mb-4">
        <div className="col-12 col-md-3">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <div className="text-muted small">Costos total</div>
              <div className="fs-4 fw-bold">{money(reporte?.costosTotal)}</div>
            </div>
          </div>
        </div>

        <div className="col-12 col-md-3">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <div className="text-muted small">Total ingresos</div>
              <div className="fs-4 fw-bold text-primary">{money(reporte?.totalIngresos)}</div>
            </div>
          </div>
        </div>

        <div className="col-12 col-md-3">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <div className="text-muted small">Total anuncios</div>
              <div className="fs-4 fw-bold text-info">{money(reporte?.totalAnuncios)}</div>
            </div>
          </div>
        </div>

        <div className="col-12 col-md-3">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <div className="text-muted small">Total ganancias</div>
              <div className="fs-4 fw-bold text-success">{money(reporte?.totalGanancias)}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="card shadow-sm border-0 mb-4">
        <div className="card-body">
          <div className="row g-3 align-items-end">
            <div className="col-12 col-md-3">
              <label className="form-label fw-semibold">Fecha inicio</label>
              <input
                type="date"
                className="form-control"
                value={inicio}
                onChange={(e) => setInicio(e.target.value)}
              />
            </div>

            <div className="col-12 col-md-3">
              <label className="form-label fw-semibold">Fecha fin</label>
              <input
                type="date"
                className="form-control"
                value={fin}
                onChange={(e) => setFin(e.target.value)}
              />
            </div>

            <div className="col-12 col-md-6">
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

          <hr />

          <div className="d-flex flex-wrap gap-2">
            <button
              className={`btn ${vista === "revistas" ? "btn-primary" : "btn-outline-primary"}`}
              onClick={() => setVista("revistas")}
            >
              <i className="bi bi-journal-richtext me-2"></i>
              Ver revistas
            </button>

            <button
              className={`btn ${vista === "anuncios" ? "btn-primary" : "btn-outline-primary"}`}
              onClick={() => setVista("anuncios")}
            >
              <i className="bi bi-megaphone me-2"></i>
              Ver anuncios comprados
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger">
          <i className="bi bi-exclamation-triangle me-2"></i>
          {error}
        </div>
      )}

      {vista === "revistas" && (
        <div className="card shadow-sm border-0 mb-4">
          <div className="card-header bg-white border-0 pt-3">
            <h5 className="mb-0 fw-semibold">Ganancias por revista</h5>
          </div>

          <div className="card-body">
            <div className="table-responsive">
              <table className="table align-middle">
                <thead className="table-light">
                  <tr>
                    <th>ID</th>
                    <th>Revista</th>
                    <th>Ingresos por editor</th>
                    <th>Costos</th>
                    <th>Acciones</th>
                  </tr>
                </thead>

                <tbody>
                  {!loading && revistas.length === 0 && (
                    <tr>
                      <td colSpan="5" className="text-center text-muted py-4">
                        No hay revistas para mostrar.
                      </td>
                    </tr>
                  )}

                  {revistas.map((r) => {
                    const ingresosEditor = Number(r.ingresosPagosEditor || 0);
                    const costoTotalRevista = calcularCostoTotalRevista(r.costos || []);

                    return (
                      <tr key={r.revistaId}>
                        <td>{r.revistaId}</td>
                        <td className="fw-semibold">{r.nombreRevista}</td>
                        <td>{money(ingresosEditor)}</td>
                        <td>{money(costoTotalRevista)}</td>
                        <td>
                          <button
                            className="btn btn-sm btn-outline-secondary"
                            onClick={() => setRevistaSeleccionada(r)}
                          >
                            <i className="bi bi-eye me-1"></i>
                            Ver costos
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>

                {reporte && (
                  <tfoot className="table-light">
                    <tr>
                      <th colSpan="2" className="text-end">Costos total:</th>
                      <th colSpan="3">{money(reporte.costosTotal)}</th>
                    </tr>
                    <tr>
                      <th colSpan="2" className="text-end">Total ingresos:</th>
                      <th colSpan="3">{money(reporte.totalIngresos)}</th>
                    </tr>
                    <tr>
                      <th colSpan="2" className="text-end">Total anuncios:</th>
                      <th colSpan="3">{money(reporte.totalAnuncios)}</th>
                    </tr>
                    <tr>
                      <th colSpan="2" className="text-end">Total ganancias:</th>
                      <th colSpan="3">{money(reporte.totalGanancias)}</th>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        </div>
      )}

      {vista === "anuncios" && (
        <div className="card shadow-sm border-0 mb-4">
          <div className="card-header bg-white border-0 pt-3">
            <h5 className="mb-0 fw-semibold">Anuncios comprados</h5>
          </div>

          <div className="card-body">
            <div className="table-responsive">
              <table className="table align-middle">
                <thead className="table-light">
                  <tr>
                    <th>ID anuncio</th>
                    <th>Tipo</th>
                    <th>Anunciante</th>
                    <th>Contenido</th>
                    <th>Monto pagado</th>
                    <th>Fecha inicio</th>
                    <th>Fecha fin</th>
                    <th>Estado compra</th>
                    <th>Acciones</th>
                  </tr>
                </thead>

                <tbody>
                  {!loading && anuncios.length === 0 && (
                    <tr>
                      <td colSpan="9" className="text-center text-muted py-4">
                        No hay anuncios comprados para mostrar.
                      </td>
                    </tr>
                  )}

                  {anuncios.map((a, index) => {
                    const anuncio = a?.anuncio;
                    const tipoCodigo = anuncio?.tipoAnuncio?.codigo || "—";
                    const anuncianteUsername = anuncio?.anunciante?.username || "—";
                    const anuncianteNombre = `${anuncio?.anunciante?.nombre || ""} ${anuncio?.anunciante?.apellido || ""}`.trim();

                    return (
                      <tr key={`${anuncio?.id || "anuncio"}-${index}`}>
                        <td>{anuncio?.id ?? "—"}</td>

                        <td>
                          <span className={`badge ${getTipoBadgeClass(tipoCodigo)}`}>
                            {tipoCodigo}
                          </span>
                        </td>

                        <td>
                          <div className="fw-semibold">{anuncianteUsername}</div>
                          <div className="text-muted small">{anuncianteNombre || "—"}</div>
                        </td>

                        <td>{resumirContenidoAnuncio(anuncio)}</td>

                        <td>{money(a?.montoPagado)}</td>
                        <td>{formatDateTime(a?.fechaInicio)}</td>
                        <td>{formatDateTime(a?.fechaFin)}</td>

                        <td>
                          <span className={`badge ${getEstadoBadgeClass(a?.estadoCompra)}`}>
                            {a?.estadoCompra || "—"}
                          </span>
                        </td>

                        <td>
                          <button
                            className="btn btn-sm btn-outline-secondary"
                            onClick={() => setAnuncioSeleccionado(a)}
                          >
                            <i className="bi bi-eye me-1"></i>
                            Ver detalle
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>

                {reporte && (
                  <tfoot className="table-light">
                    <tr>
                      <th colSpan="4" className="text-end">Costos total:</th>
                      <th colSpan="5">{money(reporte.costosTotal)}</th>
                    </tr>
                    <tr>
                      <th colSpan="4" className="text-end">Total ingresos:</th>
                      <th colSpan="5">{money(reporte.totalIngresos)}</th>
                    </tr>
                    <tr>
                      <th colSpan="4" className="text-end">Total anuncios:</th>
                      <th colSpan="5">{money(reporte.totalAnuncios)}</th>
                    </tr>
                    <tr>
                      <th colSpan="4" className="text-end">Total ganancias:</th>
                      <th colSpan="5">{money(reporte.totalGanancias)}</th>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        </div>
      )}

      {revistaSeleccionada && (
        <>
          <div
            className="modal fade show"
            style={{ display: "block", backgroundColor: "rgba(0,0,0,0.5)" }}
            tabIndex="-1"
          >
            <div className="modal-dialog modal-lg modal-dialog-centered">
              <div className="modal-content border-0 shadow">
                <div className="modal-header">
                  <div>
                    <h5 className="modal-title mb-1">Costos de revista</h5>
                    <div className="text-muted small">
                      {revistaSeleccionada.nombreRevista}
                    </div>
                  </div>

                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setRevistaSeleccionada(null)}
                  ></button>
                </div>

                <div className="modal-body">
                  {revistaSeleccionada.costos?.length > 0 ? (
                    <div className="table-responsive">
                      <table className="table align-middle">
                        <thead className="table-light">
                          <tr>
                            <th>ID</th>
                            <th>Admin ID</th>
                            <th>Costo por día</th>
                            <th>Fecha inicio</th>
                            <th>Fecha fin</th>
                          </tr>
                        </thead>
                        <tbody>
                          {revistaSeleccionada.costos.map((c) => (
                            <tr key={c.id}>
                              <td>{c.id}</td>
                              <td>{c.adminId}</td>
                              <td>{money(c.costoPorDia)}</td>
                              <td>{formatDate(c.fechaInicio)}</td>
                              <td>{formatDate(c.fechaFin)}</td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="table-light">
                          <tr>
                            <th colSpan="2" className="text-end">Total costos:</th>
                            <th colSpan="3">
                              {money(calcularCostoTotalRevista(revistaSeleccionada.costos))}
                            </th>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  ) : (
                    <div className="alert alert-secondary mb-0">
                      Esta revista no tiene costos registrados.
                    </div>
                  )}
                </div>

                <div className="modal-footer">
                  <button
                    className="btn btn-secondary"
                    onClick={() => setRevistaSeleccionada(null)}
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

      {anuncioSeleccionado && (
        <>
          <div
            className="modal fade show"
            style={{ display: "block", backgroundColor: "rgba(0,0,0,0.5)" }}
            tabIndex="-1"
          >
            <div className="modal-dialog modal-lg modal-dialog-centered">
              <div className="modal-content border-0 shadow">
                <div className="modal-header">
                  <div>
                    <h5 className="modal-title mb-1">Detalle de anuncio comprado</h5>
                    <div className="text-muted small">
                      Anuncio #{anuncioSeleccionado?.anuncio?.id ?? "—"}
                    </div>
                  </div>

                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setAnuncioSeleccionado(null)}
                  ></button>
                </div>

                <div className="modal-body">
                  <div className="row g-3">
                    <div className="col-12 col-md-6">
                      <div className="border rounded p-3 h-100">
                        <h6 className="fw-bold">Datos del anuncio</h6>
                        <p className="mb-2">
                          <strong>ID:</strong> {anuncioSeleccionado?.anuncio?.id ?? "—"}
                        </p>
                        <p className="mb-2">
                          <strong>Tipo:</strong> {anuncioSeleccionado?.anuncio?.tipoAnuncio?.codigo ?? "—"}
                        </p>
                        <p className="mb-2">
                          <strong>Descripción tipo:</strong>{" "}
                          {anuncioSeleccionado?.anuncio?.tipoAnuncio?.descripcion ?? "—"}
                        </p>
                        <p className="mb-2">
                          <strong>Estado del anuncio:</strong> {anuncioSeleccionado?.anuncio?.estado ?? "—"}
                        </p>
                        <p className="mb-2">
                          <strong>Fecha creación:</strong> {formatDateTime(anuncioSeleccionado?.anuncio?.fechaCreacion)}
                        </p>
                        <p className="mb-0">
                          <strong>Monto pagado:</strong> {money(anuncioSeleccionado?.montoPagado)}
                        </p>
                      </div>
                    </div>

                    <div className="col-12 col-md-6">
                      <div className="border rounded p-3 h-100">
                        <h6 className="fw-bold">Datos del anunciante</h6>
                        <p className="mb-2">
                          <strong>Nombre:</strong>{" "}
                          {anuncioSeleccionado?.anuncio?.anunciante?.nombre}{" "}
                          {anuncioSeleccionado?.anuncio?.anunciante?.apellido}
                        </p>
                        <p className="mb-2">
                          <strong>Username:</strong> {anuncioSeleccionado?.anuncio?.anunciante?.username ?? "—"}
                        </p>
                        <p className="mb-2">
                          <strong>Correo:</strong> {anuncioSeleccionado?.anuncio?.anunciante?.correo ?? "—"}
                        </p>
                        <p className="mb-2">
                          <strong>Estado:</strong> {anuncioSeleccionado?.anuncio?.anunciante?.estado ?? "—"}
                        </p>

                        {anuncioSeleccionado?.anuncio?.anunciante?.perfilUrl && (
                          <div className="mt-2">
                            <img
                              src={anuncioSeleccionado.anuncio.anunciante.perfilUrl}
                              alt="Perfil anunciante"
                              className="rounded border"
                              style={{ width: 90, height: 90, objectFit: "cover" }}
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="col-12">
                      <div className="border rounded p-3">
                        <h6 className="fw-bold">Contenido del anuncio</h6>

                        <p className="mb-2">
                          <strong>Texto:</strong> {anuncioSeleccionado?.anuncio?.texto || "—"}
                        </p>

                        <p className="mb-2">
                          <strong>URL destino:</strong>{" "}
                          {anuncioSeleccionado?.anuncio?.urlDestino ? (
                            <a
                              href={anuncioSeleccionado.anuncio.urlDestino}
                              target="_blank"
                              rel="noreferrer"
                            >
                              {anuncioSeleccionado.anuncio.urlDestino}
                            </a>
                          ) : (
                            "—"
                          )}
                        </p>

                        <p className="mb-2">
                          <strong>Video URL:</strong>{" "}
                          {anuncioSeleccionado?.anuncio?.videoUrl ? (
                            <a
                              href={anuncioSeleccionado.anuncio.videoUrl}
                              target="_blank"
                              rel="noreferrer"
                            >
                              {anuncioSeleccionado.anuncio.videoUrl}
                            </a>
                          ) : (
                            "—"
                          )}
                        </p>

                        {anuncioSeleccionado?.anuncio?.imagenUrl && (
                          <div className="mt-3">
                            <strong>Imagen:</strong>
                            <div className="mt-2">
                              <img
                                src={anuncioSeleccionado.anuncio.imagenUrl}
                                alt="Imagen anuncio"
                                className="img-fluid rounded border"
                                style={{ maxHeight: 260, objectFit: "contain" }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="col-12">
                      <div className="border rounded p-3">
                        <h6 className="fw-bold">Datos de la compra</h6>
                        <div className="row g-3">
                          <div className="col-12 col-md-4">
                            <div>
                              <strong>Fecha inicio:</strong>
                              <div>{formatDateTime(anuncioSeleccionado?.fechaInicio)}</div>
                            </div>
                          </div>
                          <div className="col-12 col-md-4">
                            <div>
                              <strong>Fecha fin:</strong>
                              <div>{formatDateTime(anuncioSeleccionado?.fechaFin)}</div>
                            </div>
                          </div>
                          <div className="col-12 col-md-4">
                            <div>
                              <strong>Estado compra:</strong>
                              <div>{anuncioSeleccionado?.estadoCompra || "—"}</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="modal-footer">
                  <button
                    className="btn btn-secondary"
                    onClick={() => setAnuncioSeleccionado(null)}
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