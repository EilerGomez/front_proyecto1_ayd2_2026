import { useEffect, useMemo, useState } from "react";
import { getReporteAnunciosComprados } from "../../../services/reportesAdmin.service";
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

function textPreview(text, max = 60) {
  if (!text) return "—";
  return text.length > max ? `${text.slice(0, max)}...` : text;
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

export default function ReporteAnunciosCompradosPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [items, setItems] = useState([]);

  const [tipo, setTipo] = useState("");
  const [estadoCompra, setEstadoCompra] = useState("");
  const [inicio, setInicio] = useState("");
  const [fin, setFin] = useState("");

  const [detalle, setDetalle] = useState(null);

  async function cargarReporte() {
    try {
      setLoading(true);
      setError("");

      const data = await getReporteAnunciosComprados({
        tipo: tipo || undefined,
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
    setTipo("");
    setEstadoCompra("");
    setInicio("");
    setFin("");
  }

  const itemsFiltrados = useMemo(() => {
    if (!estadoCompra) return items;

    return items.filter((item) => {
      const estado = item?.estadoCompra || "";
      return estado.toUpperCase() === estadoCompra.toUpperCase();
    });
  }, [items, estadoCompra]);

  const totalRegistros = useMemo(() => itemsFiltrados.length, [itemsFiltrados]);

  const totalMonto = useMemo(() => {
    return itemsFiltrados.reduce((acc, item) => acc + Number(item?.montoPagado || 0), 0);
  }, [itemsFiltrados]);

  function exportarPdf() {
    const doc = new jsPDF();

    doc.setFontSize(16);
    doc.text("Reporte de anuncios comprados", 14, 15);

    doc.setFontSize(10);
    doc.text(
      `Tipo: ${tipo || "Todos"} | Estado compra: ${estadoCompra || "Todos"} | Inicio: ${inicio || "Sin filtro"} | Fin: ${fin || "Sin filtro"}`,
      14,
      22
    );

    const body = itemsFiltrados.map((item) => [
      item?.anuncio?.id ?? "—",
      item?.anuncio?.tipoAnuncio?.codigo ?? "—",
      item?.anuncio?.anunciante?.username ?? "—",
      textPreview(item?.anuncio?.texto || item?.anuncio?.urlDestino || item?.anuncio?.videoUrl, 35),
      money(item?.montoPagado),
      formatDateTime(item?.fechaInicio),
      formatDateTime(item?.fechaFin),
      item?.estadoCompra ?? "—",
    ]);

    autoTable(doc, {
      startY: 28,
      head: [[
        "ID",
        "Tipo",
        "Anunciante",
        "Contenido",
        "Monto",
        "Fecha inicio",
        "Fecha fin",
        "Estado",
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
    doc.text(`Total de compras: ${totalRegistros}`, 14, finalY);
    doc.text(`Monto total: ${money(totalMonto)}`, 14, finalY + 7);

    doc.save("reporte-anuncios-comprados.pdf");
  }

  return (
    <div className="container-fluid">
      <div className="d-flex flex-wrap justify-content-between align-items-start gap-3 mb-4">
        <div>
          <h2 className="fw-bold mb-1">Reporte de anuncios comprados</h2>
          <p className="text-muted mb-0">
            Consulta las compras de anuncios por tipo y rango de fechas, y filtra en memoria por estado de compra.
          </p>
        </div>

        <button
          className="btn btn-danger"
          onClick={exportarPdf}
          disabled={loading || itemsFiltrados.length === 0}
        >
          <i className="bi bi-file-earmark-pdf me-2"></i>
          Descargar PDF
        </button>
      </div>

      <div className="row g-3 mb-4">
        <div className="col-12 col-md-6 col-xl-3">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <div className="text-muted small">Total de compras</div>
              <div className="fs-4 fw-bold">{totalRegistros}</div>
            </div>
          </div>
        </div>

        <div className="col-12 col-md-6 col-xl-3">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <div className="text-muted small">Monto total</div>
              <div className="fs-4 fw-bold text-success">{money(totalMonto)}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="card shadow-sm border-0 mb-4">
        <div className="card-body">
          <div className="row g-3 align-items-end">
            <div className="col-12 col-md-3 col-lg-3">
              <label className="form-label fw-semibold">Tipo de anuncio</label>
              <select
                className="form-select"
                value={tipo}
                onChange={(e) => setTipo(e.target.value)}
              >
                <option value="">Todos</option>
                <option value="TEXTO">TEXTO</option>
                <option value="VIDEO">VIDEO</option>
                <option value="IMAGEN_TEXTO">IMAGEN_TEXTO</option>
              </select>
            </div>

            <div className="col-12 col-md-3 col-lg-3">
              <label className="form-label fw-semibold">Estado de compra</label>
              <select
                className="form-select"
                value={estadoCompra}
                onChange={(e) => setEstadoCompra(e.target.value)}
              >
                <option value="">Todos</option>
                <option value="ACTIVO">ACTIVO</option>
                <option value="EXPIRADO">EXPIRADO</option>
                <option value="PENDIENTE">PENDIENTE</option>
              </select>
            </div>

            <div className="col-12 col-md-3 col-lg-2">
              <label className="form-label fw-semibold">Fecha inicio</label>
              <input
                type="date"
                className="form-control"
                value={inicio}
                onChange={(e) => setInicio(e.target.value)}
              />
            </div>

            <div className="col-12 col-md-3 col-lg-2">
              <label className="form-label fw-semibold">Fecha fin</label>
              <input
                type="date"
                className="form-control"
                value={fin}
                onChange={(e) => setFin(e.target.value)}
              />
            </div>

            <div className="col-12 col-lg-2">
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
          <h5 className="mb-0 fw-semibold">Listado de anuncios comprados</h5>
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
                {!loading && itemsFiltrados.length === 0 && (
                  <tr>
                    <td colSpan="9" className="text-center text-muted py-4">
                      No hay anuncios comprados para mostrar.
                    </td>
                  </tr>
                )}

                {itemsFiltrados.map((item, index) => {
                  const anuncio = item?.anuncio;
                  const tipoCodigo = anuncio?.tipoAnuncio?.codigo || "—";
                  const anunciante = anuncio?.anunciante?.username || "—";

                  let contenido = "—";
                  if (anuncio?.texto) contenido = textPreview(anuncio.texto, 55);
                  else if (anuncio?.imagenUrl) contenido = "Anuncio con imagen";
                  else if (anuncio?.videoUrl) contenido = "Anuncio con video";

                  return (
                    <tr key={`${anuncio?.id || "an"}-${index}`}>
                      <td>{anuncio?.id ?? "—"}</td>

                      <td>
                        <span className={`badge ${getTipoBadgeClass(tipoCodigo)}`}>
                          {tipoCodigo}
                        </span>
                      </td>

                      <td>
                        <div className="fw-semibold">{anunciante}</div>
                        <div className="text-muted small">
                          {anuncio?.anunciante?.nombre} {anuncio?.anunciante?.apellido}
                        </div>
                      </td>

                      <td>{contenido}</td>

                      <td className="fw-semibold">{money(item?.montoPagado)}</td>

                      <td>{formatDateTime(item?.fechaInicio)}</td>
                      <td>{formatDateTime(item?.fechaFin)}</td>

                      <td>
                        <span className={`badge ${getEstadoBadgeClass(item?.estadoCompra)}`}>
                          {item?.estadoCompra || "—"}
                        </span>
                      </td>

                      <td>
                        <button
                          className="btn btn-sm btn-outline-secondary"
                          onClick={() => setDetalle(item)}
                        >
                          <i className="bi bi-eye me-1"></i>
                          Ver detalle
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>

              <tfoot className="table-light">
                <tr>
                  <th colSpan="4" className="text-end">Total de compras:</th>
                  <th colSpan="5">{totalRegistros}</th>
                </tr>
                <tr>
                  <th colSpan="4" className="text-end">Monto total:</th>
                  <th colSpan="5">{money(totalMonto)}</th>
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
            <div className="modal-dialog modal-lg modal-dialog-centered">
              <div className="modal-content border-0 shadow">
                <div className="modal-header">
                  <div>
                    <h5 className="modal-title mb-1">Detalle de compra de anuncio</h5>
                    <div className="text-muted small">
                      Anuncio #{detalle?.anuncio?.id ?? "—"}
                    </div>
                  </div>

                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setDetalle(null)}
                  ></button>
                </div>

                <div className="modal-body">
                  <div className="row g-3">
                    <div className="col-12 col-md-6">
                      <div className="border rounded p-3 h-100">
                        <h6 className="fw-bold">Datos del anuncio</h6>
                        <p className="mb-2">
                          <strong>ID:</strong> {detalle?.anuncio?.id ?? "—"}
                        </p>
                        <p className="mb-2">
                          <strong>Tipo:</strong> {detalle?.anuncio?.tipoAnuncio?.codigo ?? "—"}
                        </p>
                        <p className="mb-2">
                          <strong>Descripción tipo:</strong>{" "}
                          {detalle?.anuncio?.tipoAnuncio?.descripcion ?? "—"}
                        </p>
                        <p className="mb-2">
                          <strong>Estado del anuncio:</strong> {detalle?.anuncio?.estado ?? "—"}
                        </p>
                        <p className="mb-2">
                          <strong>Fecha creación:</strong> {formatDateTime(detalle?.anuncio?.fechaCreacion)}
                        </p>
                        <p className="mb-0">
                          <strong>Monto pagado:</strong> {money(detalle?.montoPagado)}
                        </p>
                      </div>
                    </div>

                    <div className="col-12 col-md-6">
                      <div className="border rounded p-3 h-100">
                        <h6 className="fw-bold">Datos del anunciante</h6>
                        <p className="mb-2">
                          <strong>Nombre:</strong>{" "}
                          {detalle?.anuncio?.anunciante?.nombre} {detalle?.anuncio?.anunciante?.apellido}
                        </p>
                        <p className="mb-2">
                          <strong>Username:</strong> {detalle?.anuncio?.anunciante?.username ?? "—"}
                        </p>
                        <p className="mb-2">
                          <strong>Correo:</strong> {detalle?.anuncio?.anunciante?.correo ?? "—"}
                        </p>
                        <p className="mb-2">
                          <strong>Estado:</strong> {detalle?.anuncio?.anunciante?.estado ?? "—"}
                        </p>

                        {detalle?.anuncio?.anunciante?.perfilUrl && (
                          <div className="mt-2">
                            <img
                              src={detalle.anuncio.anunciante.perfilUrl}
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
                          <strong>Texto:</strong> {detalle?.anuncio?.texto || "—"}
                        </p>

                        <p className="mb-2">
                          <strong>URL destino:</strong>{" "}
                          {detalle?.anuncio?.urlDestino ? (
                            <a
                              href={detalle.anuncio.urlDestino}
                              target="_blank"
                              rel="noreferrer"
                            >
                              {detalle.anuncio.urlDestino}
                            </a>
                          ) : (
                            "—"
                          )}
                        </p>

                        <p className="mb-2">
                          <strong>Video URL:</strong>{" "}
                          {detalle?.anuncio?.videoUrl ? (
                            <a
                              href={detalle.anuncio.videoUrl}
                              target="_blank"
                              rel="noreferrer"
                            >
                              {detalle.anuncio.videoUrl}
                            </a>
                          ) : (
                            "—"
                          )}
                        </p>

                        {detalle?.anuncio?.imagenUrl && (
                          <div className="mt-3">
                            <strong>Imagen:</strong>
                            <div className="mt-2">
                              <img
                                src={detalle.anuncio.imagenUrl}
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
                              <div>{formatDateTime(detalle?.fechaInicio)}</div>
                            </div>
                          </div>
                          <div className="col-12 col-md-4">
                            <div>
                              <strong>Fecha fin:</strong>
                              <div>{formatDateTime(detalle?.fechaFin)}</div>
                            </div>
                          </div>
                          <div className="col-12 col-md-4">
                            <div>
                              <strong>Estado compra:</strong>
                              <div>{detalle?.estadoCompra || "—"}</div>
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