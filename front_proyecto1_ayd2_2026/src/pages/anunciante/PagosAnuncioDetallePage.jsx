// src/pages/anunciante/PagosAnuncioDetallePage.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { getUser } from "../../auth/authService";
import { getAnuncioById } from "../../services/anuncios.service";
import { getComprasByAnuncianteId, actualizarFechaFinCompra } from "../../services/comprasAnuncio.service";

function formatDateTime(dt) {
  if (!dt) return "—";
  const s = String(dt).replace("T", " ");
  return s.length > 16 ? s.slice(0, 16) : s;
}

// convierte "2026-03-05T14:30:00" -> "2026-03-05T14:30" (para input datetime-local)
function toDTLocalValue(iso) {
  if (!iso) return "";
  const s = String(iso);
  return s.length >= 16 ? s.slice(0, 16) : s;
}

function EstadoBadge({ estado }) {
  const e = (estado ?? "").toUpperCase();
  const cls =
    e === "ACTIVO"
      ? "text-bg-success"
      : e === "INACTIVO"
      ? "text-bg-secondary"
      : e === "EXPIRADO"
      ? "text-bg-warning"
      : "text-bg-dark";
  return (
    <span className={`badge ${cls}`}>
      <i className="bi bi-circle-fill me-1" style={{ fontSize: 8 }} />
      {e || "—"}
    </span>
  );
}

export default function PagosAnuncioDetallePage() {
  const navigate = useNavigate();
  const { id } = useParams(); // anuncioId

  const user = getUser();
  const anuncianteId = user?.id;

  const [anuncio, setAnuncio] = useState(null);
  const [compras, setCompras] = useState([]);

  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState({ type: "", text: "" });

  // --- edición fecha fin ---
  const [editId, setEditId] = useState(null); // compraId editando
  const [editFechaFin, setEditFechaFin] = useState(""); // datetime-local
  const [savingId, setSavingId] = useState(null);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, anuncianteId]);

  async function load() {
    setLoading(true);
    setMsg({ type: "", text: "" });

    try {
      // 1) info del anuncio
      const a = await getAnuncioById(id);
      setAnuncio(a);

      // 2) compras del anunciante (mejor usar sesión, pero aquí lo tenías así)
      const data = await getComprasByAnuncianteId(a?.anunciante?.id ?? anuncianteId);
      setCompras(data ?? []);
    } catch (e) {
      console.error(e);
      setMsg({ type: "danger", text: "No se pudieron cargar los pagos del anuncio." });
    } finally {
      setLoading(false);
    }
  }

  const pagosDeEsteAnuncio = useMemo(() => {
    const anuncioId = Number(id);
    return (compras ?? []).filter((c) => Number(c?.anuncio?.id) === anuncioId);
  }, [compras, id]);

  function startEdit(compra) {
    setMsg({ type: "", text: "" });
    setEditId(compra.id);
    setEditFechaFin(toDTLocalValue(compra.fechaFin));
  }

  function cancelEdit() {
    setEditId(null);
    setEditFechaFin("");
  }

  async function saveEdit(compra) {
    setMsg({ type: "", text: "" });

    if (!editFechaFin) {
      setMsg({ type: "warning", text: "Seleccioná una fecha fin." });
      return;
    }

    // Validación simple: fin > inicio
    const ini = new Date(compra.fechaInicio);
    const fin = new Date(editFechaFin);
    if (!Number.isNaN(ini.getTime()) && !Number.isNaN(fin.getTime())) {
      if (fin.getTime() <= ini.getTime()) {
        setMsg({ type: "warning", text: "La fecha fin debe ser mayor que la fecha inicio." });
        return;
      }
    }

    const ok = window.confirm(`¿Actualizar fecha fin a ${editFechaFin.replace("T", " ")}?`);
    if (!ok) return;

    setSavingId(compra.id);
    try {
      await actualizarFechaFinCompra(compra.id, editFechaFin);
      setMsg({ type: "success", text: "Fecha fin actualizada correctamente." });
      cancelEdit();
      await load();
    } catch (e) {
      console.error(e);
      setMsg({ type: "danger", text: "No se pudo actualizar la fecha fin." });
    } finally {
      setSavingId(null);
    }
  }

  return (
    <div className="container mt-4">
      {/* REGRESAR */}
      <button className="btn btn-outline-secondary mb-3" onClick={() => navigate(-1)}>
        <i className="bi bi-arrow-left me-2" />
        Regresar
      </button>

      <div className="d-flex align-items-center justify-content-between mb-3">
        <div>
          <h1 className="h4 mb-0">Pagos del anuncio #{id}</h1>
          <div className="text-muted small">Compras realizadas para este anuncio.</div>
        </div>

        <button className="btn btn-outline-secondary" onClick={load} disabled={loading || savingId != null}>
          <i className="bi bi-arrow-clockwise me-2" />
          {loading ? "Actualizando..." : "Refrescar"}
        </button>
      </div>

      {loading && (
        <div className="alert alert-info d-flex align-items-center gap-2">
          <div className="spinner-border spinner-border-sm" />
          <span>Cargando...</span>
        </div>
      )}

      {msg.text && <div className={`alert alert-${msg.type}`}>{msg.text}</div>}

      {!loading && anuncio && (
        <div className="card p-3 mb-3">
          <div className="d-flex flex-wrap align-items-center justify-content-between gap-2">
            <div>
              <div className="fw-semibold">
                <i className="bi bi-megaphone me-2" />
                {anuncio?.tipoAnuncio?.codigo ?? "—"} — {anuncio?.estado ?? "—"}
              </div>
              <div className="text-muted small">
                {anuncio?.texto ? anuncio.texto.slice(0, 140) : "Sin texto"}
              </div>
            </div>
            <span className="badge text-bg-light border">
              <i className="bi bi-clock me-1" />
              {formatDateTime(anuncio?.fechaCreacion)}
            </span>
          </div>
        </div>
      )}

      {!loading && (
        <div className="card p-3">
          <div className="text-muted small mb-2">
            Mostrando <b>{pagosDeEsteAnuncio.length}</b> pagos para este anuncio.
          </div>

          <div className="table-responsive">
            <table className="table table-bordered align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th>ID</th>
                  <th>Estado</th>
                  <th>Inicio</th>
                  <th>Fin</th>
                  <th>Periodo</th>
                  <th>Precio</th>
                  <th>Transacción</th>
                  <th className="text-end">Acciones</th>
                </tr>
              </thead>

              <tbody>
                {pagosDeEsteAnuncio.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center text-muted">
                      No hay pagos para este anuncio todavía.
                    </td>
                  </tr>
                ) : (
                  pagosDeEsteAnuncio.map((c) => {
                    const estado = String(c.estado ?? "").toUpperCase();
                    const isActive = estado === "ACTIVO";
                    const isEditing = editId === c.id;

                    return (
                      <tr key={c.id}>
                        <td>{c.id}</td>

                        <td>
                          <EstadoBadge estado={c.estado} />
                        </td>

                        <td>{formatDateTime(c.fechaInicio)}</td>

                        <td style={{ minWidth: 210 }}>
                          {!isEditing ? (
                            formatDateTime(c.fechaFin)
                          ) : (
                            <input
                              type="datetime-local"
                              className="form-control form-control-sm"
                              value={editFechaFin}
                              onChange={(e) => setEditFechaFin(e.target.value)}
                            />
                          )}
                        </td>

                        <td>{c.precio?.periodoAnuncio?.codigo ?? "—"}</td>

                        <td>Q {c.precio?.precio ?? "—"}</td>

                        <td>{c.transaccionId ?? "—"}</td>

                        <td className="text-end" style={{ whiteSpace: "nowrap" }}>
                          {isActive ? (
                            !isEditing ? (
                              <button
                                className="btn btn-sm btn-outline-primary"
                                onClick={() => startEdit(c)}
                                disabled={savingId != null}
                                title="Editar fecha fin"
                              >
                                <i className="bi bi-pencil-square me-1" />
                                Editar fin
                              </button>
                            ) : (
                              <div className="d-inline-flex gap-2">
                                <button
                                  className="btn btn-sm btn-primary"
                                  onClick={() => saveEdit(c)}
                                  disabled={savingId === c.id}
                                >
                                  {savingId === c.id ? "Guardando..." : "Guardar"}
                                </button>

                                <button
                                  className="btn btn-sm btn-outline-secondary"
                                  onClick={cancelEdit}
                                  disabled={savingId === c.id}
                                >
                                  Cancelar
                                </button>
                              </div>
                            )
                          ) : (
                            <span className="text-muted">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="form-text mt-2">
            Solo podés editar la <b>fecha fin</b> cuando el pago está en estado <code>ACTIVO</code>.
          </div>
        </div>
      )}
    </div>
  );
}