// src/pages/admin/AdminRevistasPage.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getUser } from "../../auth/authService";
import { getRevistasAll, changeEstadoRevista } from "../../services/revistas.service";

import { existsLike, darLike, quitarLike, getLikesByRevistaId } from "../../services/likes.service";
import { getComentariosByRevistaId, createComentario, deleteComentario } from "../../services/comentarios.service";
import { getSuscripcionesByRevistaId } from "../../services/suscripciones.service";

function badgeColorByCategoria(nombre) {
  if (!nombre) return "secondary";
  const n = nombre.toLowerCase();
  if (n.includes("tecn")) return "primary";
  if (n.includes("música") || n.includes("musica")) return "success";
  if (n.includes("auto")) return "warning";
  return "info";
}

function EstadoBadge({ activa }) {
  return (
    <span className={`badge ${activa ? "text-bg-success" : "text-bg-secondary"}`}>
      <i className={`bi ${activa ? "bi-check-circle" : "bi-slash-circle"} me-1`}></i>
      {activa ? "ACTIVA" : "INACTIVA"}
    </span>
  );
}

function Avatar({ url, name = "Usuario", size = 44 }) {
  const [ok, setOk] = useState(true);

  if (!url || !ok) {
    return (
      <div
        className="rounded-circle bg-light border d-inline-flex align-items-center justify-content-center"
        style={{ width: size, height: size }}
        title={name}
      >
        <i className="bi bi-person-circle fs-4 text-muted"></i>
      </div>
    );
  }

  return (
    <img
      src={url}
      alt={name}
      className="rounded-circle border"
      style={{ width: size, height: size, objectFit: "cover" }}
      onError={() => setOk(false)}
    />
  );
}

function formatDateTime(dt) {
  if (!dt) return "";
  const s = String(dt).replace("T", " ");
  return s.length > 16 ? s.slice(0, 16) : s;
}

export default function AdminRevistasPage() {
  const navigate = useNavigate();
  const user = getUser();
  const usuarioId = user?.id;

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const [msg, setMsg] = useState({ type: "", text: "" });

  const [q, setQ] = useState("");
  const [estado, setEstado] = useState("ALL"); // ALL | ACTIVA | INACTIVA

  const [togglingId, setTogglingId] = useState(null);

  // --- likes per revista ---
  const [likedByMe, setLikedByMe] = useState({});
  const [likeBusy, setLikeBusy] = useState({});

  // --- panel actividad ---
  const [panelOpen, setPanelOpen] = useState(false);
  const [panelTab, setPanelTab] = useState("comentarios"); // comentarios | likes | suscriptores
  const [panelRevista, setPanelRevista] = useState(null);

  const [panelLoading, setPanelLoading] = useState(false);
  const [panelComentarios, setPanelComentarios] = useState([]);
  const [panelLikes, setPanelLikes] = useState([]);
  const [panelSuscriptores, setPanelSuscriptores] = useState([]);

  const [nuevoComentario, setNuevoComentario] = useState("");
  const [commentBusy, setCommentBusy] = useState(false);

  function warnDisabled(msgText) {
    alert(msgText);
  }

  async function load() {
    setLoading(true);
    setMsg({ type: "", text: "" });

    try {
      const data = await getRevistasAll(); // ADMIN
      setItems(data ?? []);

      // precargar "ya dio like" (solo revistas que permiten likes)
      const arr = data ?? [];
      const checks = arr
        .filter((r) => !!r?.permiteLikes)
        .map(async (r) => {
          try {
            const ex = await existsLike(r.id, usuarioId);
            return [r.id, ex];
          } catch {
            return [r.id, false];
          }
        });

      const results = await Promise.all(checks);
      const likeMap = {};
      results.forEach(([rid, val]) => (likeMap[rid] = val));
      setLikedByMe(likeMap);
    } catch (e) {
      console.log(e);
      setMsg({ type: "danger", text: "No se pudieron cargar las revistas." });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredItems = useMemo(() => {
    const query = (q ?? "").toLowerCase().trim();

    return (items ?? []).filter((r) => {
      const matchQuery =
        !query ||
        (r.titulo ?? "").toLowerCase().includes(query) ||
        (r.categoria?.nombre ?? "").toLowerCase().includes(query);

      const matchEstado =
        estado === "ALL" ||
        (estado === "ACTIVA" && !!r.activa) ||
        (estado === "INACTIVA" && !r.activa);

      return matchQuery && matchEstado;
    });
  }, [items, q, estado]);

  // --------- activar/desactivar ---------
  async function toggleEstado(r) {
    const nextEstado = !r.activa;

    const ok = confirm(
      nextEstado ? `¿Activar la revista "${r.titulo}"?` : `¿Desactivar la revista "${r.titulo}"?`
    );
    if (!ok) return;

    setMsg({ type: "", text: "" });
    setTogglingId(r.id);

    // optimistic
    setItems((prev) => prev.map((x) => (x.id === r.id ? { ...x, activa: nextEstado } : x)));

    try {
      const updated = await changeEstadoRevista(r.id, nextEstado);
      setItems((prev) => prev.map((x) => (x.id === r.id ? { ...x, ...updated } : x)));
      setMsg({
        type: "success",
        text: `Revista ${nextEstado ? "activada" : "desactivada"} correctamente.`,
      });
    } catch (e) {
      console.log(e);
      // rollback
      setItems((prev) => prev.map((x) => (x.id === r.id ? { ...x, activa: r.activa } : x)));
      setMsg({ type: "danger", text: "No se pudo cambiar el estado de la revista." });
    } finally {
      setTogglingId(null);
    }
  }

  // --------- LIKE (admin sí puede like) ---------
  async function toggleLike(revista) {
    const rid = revista.id;

    if (!revista?.permiteLikes) {
      warnDisabled("Esta revista tiene los likes deshabilitados.");
      return;
    }

    setLikeBusy((p) => ({ ...p, [rid]: true }));
    try {
      const ya = !!likedByMe[rid];

      if (ya) {
        await quitarLike(rid, usuarioId);
        setLikedByMe((p) => ({ ...p, [rid]: false }));
        setItems((prev) =>
          prev.map((x) =>
            x.id === rid ? { ...x, cantidadLikes: Math.max(0, (x.cantidadLikes ?? 0) - 1) } : x
          )
        );
      } else {
        await darLike({ revistaId: rid, usuarioId });
        setLikedByMe((p) => ({ ...p, [rid]: true }));
        setItems((prev) =>
          prev.map((x) => (x.id === rid ? { ...x, cantidadLikes: (x.cantidadLikes ?? 0) + 1 } : x))
        );
      }

      if (panelOpen && panelRevista?.id === rid) {
        await loadPanelData(rid);
      }
    } catch (e) {
      console.log(e);
      alert("No se pudo procesar el like.");
    } finally {
      setLikeBusy((p) => ({ ...p, [rid]: false }));
    }
  }

  // --------- PANEL ---------
  async function loadPanelData(revistaId) {
    setPanelLoading(true);
    try {
      const [coms, likes, subs] = await Promise.all([
        getComentariosByRevistaId(revistaId),
        getLikesByRevistaId(revistaId),
        getSuscripcionesByRevistaId(revistaId),
      ]);

      setPanelComentarios(coms ?? []);
      setPanelLikes(likes ?? []);
      setPanelSuscriptores(subs ?? []);
    } catch (e) {
      console.log(e);
      setPanelComentarios([]);
      setPanelLikes([]);
      setPanelSuscriptores([]);
    } finally {
      setPanelLoading(false);
    }
  }

  async function openPanel(revista, tab = "comentarios") {
    if (tab === "comentarios" && !revista?.permiteComentarios) {
      warnDisabled("Esta revista tiene los comentarios deshabilitados.");
      return;
    }
    if (tab === "likes" && !revista?.permiteLikes) {
      warnDisabled("Esta revista tiene los likes deshabilitados.");
      return;
    }
    if (tab === "suscriptores" && !revista?.permiteSuscripciones) {
      warnDisabled("Esta revista tiene las suscripciones deshabilitadas.");
      return;
    }

    setPanelRevista(revista);
    setPanelTab(tab);
    setNuevoComentario("");
    setPanelOpen(true);
    await loadPanelData(revista.id);
  }

  function closePanel() {
    setPanelOpen(false);
    setPanelRevista(null);
    setPanelComentarios([]);
    setPanelLikes([]);
    setPanelSuscriptores([]);
  }

  // --------- COMENTARIOS (admin sí puede comentar) ---------
  async function crearComentario() {
    if (!panelRevista?.id) return;

    if (!panelRevista?.permiteComentarios) {
      warnDisabled("Esta revista tiene los comentarios deshabilitados.");
      return;
    }

    const contenido = (nuevoComentario ?? "").trim();
    if (!contenido) return;

    setCommentBusy(true);
    try {
      await createComentario({
        revistaId: panelRevista.id,
        usuarioId,
        contenido,
      });

      setNuevoComentario("");
      await loadPanelData(panelRevista.id);

      setItems((prev) =>
        prev.map((x) =>
          x.id === panelRevista.id
            ? { ...x, cantidadComentarios: (x.cantidadComentarios ?? 0) + 1 }
            : x
        )
      );
    } catch (e) {
      console.log(e);
      alert("No se pudo crear el comentario.");
    } finally {
      setCommentBusy(false);
    }
  }

  async function eliminarComentario(comentario) {
    if (!comentario?.id) return;
    if (comentario?.usuario?.id !== usuarioId) return;

    const ok = confirm("¿Eliminar tu comentario?");
    if (!ok) return;

    try {
      await deleteComentario(comentario.id);
      await loadPanelData(panelRevista.id);

      setItems((prev) =>
        prev.map((x) =>
          x.id === panelRevista.id
            ? { ...x, cantidadComentarios: Math.max(0, (x.cantidadComentarios ?? 0) - 1) }
            : x
        )
      );
    } catch (e) {
      console.log(e);
      alert("No se pudo eliminar el comentario.");
    }
  }

  return (
    <div>
      <div className="d-flex align-items-center justify-content-between mb-3">
        <div>
          <h1 className="h4 mb-0">Revistas (Admin)</h1>
          <div className="text-muted small">
            Listado general. Acciones: ediciones, precios por día, activar/desactivar y actividad.
          </div>
        </div>

        <button className="btn btn-outline-secondary" onClick={load} disabled={loading}>
          <i className="bi bi-arrow-clockwise me-2"></i>
          {loading ? "Actualizando..." : "Refrescar"}
        </button>
      </div>

      {/* filtros */}
      <div className="card shadow-sm mb-3">
        <div className="card-body">
          <div className="row g-2 align-items-end">
            <div className="col-12 col-md-6">
              <label className="form-label mb-1">Buscar por título o categoría</label>
              <div className="input-group">
                <span className="input-group-text">
                  <i className="bi bi-search"></i>
                </span>
                <input
                  className="form-control"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Ej: Tecnología, Música..."
                />
                {q && (
                  <button className="btn btn-outline-secondary" onClick={() => setQ("")}>
                    Limpiar
                  </button>
                )}
              </div>
            </div>

            <div className="col-12 col-md-3">
              <label className="form-label mb-1">Estado</label>
              <select className="form-select" value={estado} onChange={(e) => setEstado(e.target.value)}>
                <option value="ALL">Todas</option>
                <option value="ACTIVA">Activas</option>
                <option value="INACTIVA">Inactivas</option>
              </select>
            </div>

            <div className="col-12 col-md-3 d-flex gap-2">
              <button
                className="btn btn-outline-secondary w-100"
                onClick={() => {
                  setQ("");
                  setEstado("ALL");
                }}
              >
                <i className="bi bi-x-circle me-1"></i>
                Reset
              </button>
            </div>
          </div>

          <div className="text-muted small mt-2">
            Mostrando <b>{filteredItems.length}</b> de <b>{items.length}</b>
          </div>
        </div>
      </div>

      {loading && (
        <div className="alert alert-info d-flex align-items-center gap-2">
          <div className="spinner-border spinner-border-sm" />
          <span>Cargando revistas...</span>
        </div>
      )}

      {msg.text && <div className={`alert alert-${msg.type}`}>{msg.text}</div>}

      {!loading && !msg.text && items.length === 0 && (
        <div className="alert alert-secondary">No hay revistas registradas.</div>
      )}

      {!loading && !msg.text && items.length > 0 && filteredItems.length === 0 && (
        <div className="alert alert-secondary">No hay resultados con esos filtros.</div>
      )}

      {!loading && filteredItems.length > 0 && (
        <div className="d-flex flex-column gap-3">
          {filteredItems.map((r) => {
            const menuId = `admin-revista-menu-${r.id}`;
            const editorName = `${r.editor?.nombre ?? "Editor"} ${r.editor?.apellido ?? ""}`.trim();
            const categoriaName = r.categoria?.nombre ?? "Sin categoría";
            const catColor = badgeColorByCategoria(categoriaName);

            const isToggling = togglingId === r.id;

            return (
              <div key={r.id} className="card shadow-sm">
                <div className="card-body">
                  {/* Header */}
                  <div className="d-flex align-items-start justify-content-between gap-2">
                    <div className="d-flex align-items-center gap-2">
                      <Avatar url={r.editor?.perfilUrl} name={editorName} size={44} />

                      <div>
                        <div className="d-flex align-items-center gap-2 flex-wrap">
                          <div className="fw-semibold">{editorName || "Editor"}</div>
                          <EstadoBadge activa={!!r.activa} />
                          <span className={`badge text-bg-${catColor}`}>
                            <i className="bi bi-bookmark me-1"></i>
                            {categoriaName}
                          </span>
                        </div>

                        <div className="text-muted small">
                          <i className="bi bi-hash me-1"></i>Revista ID: {r.id}
                          {r.editor?.username ? (
                            <>
                              <span className="mx-2">•</span>
                              <i className="bi bi-at me-1"></i>@{r.editor.username}
                            </>
                          ) : null}
                        </div>
                      </div>
                    </div>

                    {/* acciones + menu */}
                    <div className="d-flex align-items-center gap-2">
                      <button
                        className={`btn btn-sm ${r.activa ? "btn-outline-secondary" : "btn-outline-success"}`}
                        disabled={isToggling}
                        onClick={() => toggleEstado(r)}
                        title={r.activa ? "Desactivar" : "Activar"}
                      >
                        {isToggling ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2" />
                            Guardando...
                          </>
                        ) : r.activa ? (
                          <>
                            <i className="bi bi-slash-circle me-2"></i>
                            Desactivar
                          </>
                        ) : (
                          <>
                            <i className="bi bi-check-circle me-2"></i>
                            Activar
                          </>
                        )}
                      </button>

                      <div className="dropdown">
                        <button
                          className="btn btn-sm btn-light border"
                          type="button"
                          id={menuId}
                          data-bs-toggle="dropdown"
                          aria-expanded="false"
                          title="Opciones"
                        >
                          <i className="bi bi-three-dots-vertical"></i>
                        </button>

                        <ul className="dropdown-menu dropdown-menu-end" aria-labelledby={menuId}>
                          <li>
                            <button
                              className="dropdown-item"
                              onClick={() => navigate(`/app/admin/revistas/${r.id}/ediciones`)}
                            >
                              <i className="bi bi-journal-text me-2"></i>
                              Ver ediciones
                            </button>
                          </li>

                          <li>
                            <button
                              className="dropdown-item"
                              onClick={() => navigate(`/app/admin/revistas/${r.id}/costos`)}
                            >
                              <i className="bi bi-cash-coin me-2"></i>
                              Ver precios por día
                            </button>
                          </li>
                          <li>
                            <button
                              className="dropdown-item"
                              onClick={() => navigate(`/app/admin/revistas/${r.id}/precio-bloqueo`)}
                            >
                              <i className="bi bi-shield-lock me-2"></i>
                              Precio bloqueo anuncios
                            </button>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Descripción */}
                  <div className="mt-3 text-muted" style={{ whiteSpace: "pre-wrap" }}>
                    {r.titulo ? <div className="fw-semibold text-dark mb-1">{r.titulo}</div> : null}
                    {r.descripcion || "—"}
                  </div>

                  {/* Etiquetas */}
                  <div className="d-flex flex-wrap gap-2 mt-3">
                    {(r.etiquetas ?? []).slice(0, 12).map((t) => (
                      <span key={t.id} className="badge rounded-pill text-bg-light border">
                        #{t.nombre}
                      </span>
                    ))}
                    {(r.etiquetas ?? []).length > 12 && (
                      <span className="badge rounded-pill text-bg-light border">
                        +{(r.etiquetas ?? []).length - 12}
                      </span>
                    )}
                  </div>
                </div>

                {/* Footer: botones reales + actividad */}
                <div className="card-footer bg-white">
                  <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                    {/* izquierda: botones */}
                    <div className="d-flex flex-wrap gap-2">
                      {/* LIKE */}
                      <button
                        className={
                          "btn btn-sm " + (likedByMe[r.id] ? "btn-danger" : "btn-outline-danger")
                        }
                        onClick={() => toggleLike(r)}
                        disabled={!!likeBusy[r.id]}
                        title={!r.permiteLikes ? "Likes deshabilitados" : likedByMe[r.id] ? "Quitar like" : "Dar like"}
                        style={!r.permiteLikes ? { opacity: 0.6 } : undefined}
                      >
                        <i className={"bi " + (likedByMe[r.id] ? "bi-heart-fill" : "bi-heart") + " me-1"}></i>
                        {r.cantidadLikes ?? 0}
                      </button>

                      {/* COMENTARIOS (abre panel) */}
                      <button
                        className="btn btn-sm btn-outline-secondary"
                        onClick={() => openPanel(r, "comentarios")}
                        title={!r.permiteComentarios ? "Comentarios deshabilitados" : "Ver comentarios"}
                        style={!r.permiteComentarios ? { opacity: 0.6 } : undefined}
                      >
                        <i className="bi bi-chat-left-text me-1"></i>
                        {r.cantidadComentarios ?? 0}
                      </button>

                      {/* SUSCRIPCIONES: admin NO se suscribe, solo abre panel */}
                      <button
                        className="btn btn-sm btn-outline-success"
                        onClick={() => openPanel(r, "suscriptores")}
                        title={!r.permiteSuscripciones ? "Suscripciones deshabilitadas" : "Ver suscriptores"}
                        style={!r.permiteSuscripciones ? { opacity: 0.6 } : undefined}
                      >
                        <i className="bi bi-person-check me-1"></i>
                        {r.cantidadSuscripciones ?? 0}
                      </button>

                      {/* ACTIVIDAD */}
                      <button
                        className="btn btn-sm btn-outline-dark"
                        onClick={() => openPanel(r, "comentarios")}
                        title="Ver actividad"
                      >
                        <i className="bi bi-people me-1"></i>
                        Actividad
                      </button>
                    </div>

                    <div className="text-muted small">
                      {!r.permiteLikes ? <span className="me-3">• Likes deshabilitados</span> : null}
                      {!r.permiteComentarios ? <span className="me-3">• Comentarios deshabilitados</span> : null}
                      {!r.permiteSuscripciones ? <span className="me-3">• Suscripciones deshabilitadas</span> : null}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* OFFCANVAS (Actividad) */}
      {panelOpen && (
        <>
          <div
            className="offcanvas-backdrop fade show"
            onClick={closePanel}
            style={{ cursor: "pointer", zIndex: 1040 }}
          />

          <div
            className="offcanvas offcanvas-end show"
            tabIndex="-1"
            style={{
              visibility: "visible",
              width: "420px",
              background: "white",
              zIndex: 1050,
            }}
          >
            <div className="offcanvas-header border-bottom">
              <div>
                <div className="fw-semibold">Actividad</div>
                <div className="text-muted small">
                  {panelRevista?.titulo ?? "Revista"} • ID #{panelRevista?.id}
                </div>
              </div>
              <button type="button" className="btn-close" onClick={closePanel} />
            </div>

            <div className="offcanvas-body">
              <div className="btn-group w-100 mb-3">
                <button
                  className={"btn " + (panelTab === "comentarios" ? "btn-primary" : "btn-outline-primary")}
                  onClick={() => {
                    if (!panelRevista?.permiteComentarios) return warnDisabled("Esta revista tiene los comentarios deshabilitados.");
                    setPanelTab("comentarios");
                  }}
                >
                  <i className="bi bi-chat-left-text me-1"></i> Comentarios
                </button>
                <button
                  className={"btn " + (panelTab === "likes" ? "btn-danger" : "btn-outline-danger")}
                  onClick={() => {
                    if (!panelRevista?.permiteLikes) return warnDisabled("Esta revista tiene los likes deshabilitados.");
                    setPanelTab("likes");
                  }}
                >
                  <i className="bi bi-heart me-1"></i> Likes
                </button>
                <button
                  className={"btn " + (panelTab === "suscriptores" ? "btn-success" : "btn-outline-success")}
                  onClick={() => {
                    if (!panelRevista?.permiteSuscripciones) return warnDisabled("Esta revista tiene las suscripciones deshabilitadas.");
                    setPanelTab("suscriptores");
                  }}
                >
                  <i className="bi bi-person-check me-1"></i> Suscriptores
                </button>
              </div>

              {panelLoading && (
                <div className="alert alert-info d-flex align-items-center gap-2">
                  <div className="spinner-border spinner-border-sm" />
                  <span>Cargando...</span>
                </div>
              )}

              {/* COMENTARIOS */}
              {panelTab === "comentarios" && (
                <div>
                  {!panelRevista?.permiteComentarios && (
                    <div className="alert alert-warning">Esta revista tiene comentarios deshabilitados.</div>
                  )}

                  {panelRevista?.permiteComentarios && (
                    <div className="mb-3">
                      <label className="form-label mb-1">Escribir comentario</label>
                      <textarea
                        className="form-control"
                        rows={3}
                        value={nuevoComentario}
                        onChange={(e) => setNuevoComentario(e.target.value)}
                        placeholder="Escribí algo..."
                      />
                      <button
                        className="btn btn-primary w-100 mt-2"
                        onClick={crearComentario}
                        disabled={commentBusy || !nuevoComentario.trim()}
                      >
                        {commentBusy ? "Publicando..." : "Publicar comentario"}
                      </button>
                    </div>
                  )}

                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <div className="fw-semibold">Comentarios</div>
                    <div className="text-muted small">{panelComentarios.length}</div>
                  </div>

                  {panelComentarios.length === 0 ? (
                    <div className="text-muted">Sin comentarios.</div>
                  ) : (
                    <div className="d-flex flex-column gap-2">
                      {panelComentarios.map((c) => {
                        const editorUserId = panelRevista?.editor?.id;
                        const u = c.usuario;
                        const name = `${u?.nombre ?? "Usuario"} ${u?.apellido ?? ""}`.trim();
                        const isMine = u?.id === usuarioId;
                        const isAutor = u?.id != null && editorUserId != null && u.id === editorUserId;

                        return (
                          <div key={c.id} className="border rounded-3 p-2">
                            <div className="d-flex align-items-start gap-2">
                              <Avatar url={u?.perfilUrl} name={name} size={34} />
                              <div className="flex-grow-1">
                                <div className="d-flex justify-content-between gap-2">
                                  <div>
                                    {isAutor && (
                                      <div className="text-muted small d-flex align-items-center gap-1">
                                        <i className="bi bi-mic-fill"></i>
                                        <span>Autor</span>
                                      </div>
                                    )}
                                    <div className="fw-semibold" style={{ lineHeight: 1.1 }}>
                                      {name}
                                    </div>
                                    <div className="text-muted small">{formatDateTime(c.fechaCreacion)}</div>
                                  </div>

                                  {isMine && (
                                    <button
                                      className="btn btn-sm btn-outline-danger"
                                      onClick={() => eliminarComentario(c)}
                                      title="Eliminar"
                                    >
                                      <i className="bi bi-trash"></i>
                                    </button>
                                  )}
                                </div>

                                <div className="mt-2" style={{ whiteSpace: "pre-wrap" }}>
                                  {c.contenido}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* LIKES */}
              {panelTab === "likes" && (
                <div>
                  {!panelRevista?.permiteLikes && (
                    <div className="alert alert-warning">Esta revista tiene likes deshabilitados.</div>
                  )}

                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <div className="fw-semibold">A quiénes les gustó</div>
                    <div className="text-muted small">{panelLikes.length}</div>
                  </div>

                  {panelLikes.length === 0 ? (
                    <div className="text-muted">Aún no hay likes.</div>
                  ) : (
                    <div className="d-flex flex-column gap-2">
                      {panelLikes.map((l) => {
                        const u = l.usuario;
                        const name = `${u?.nombre ?? "Usuario"} ${u?.apellido ?? ""}`.trim();
                        return (
                          <div key={l.id} className="d-flex align-items-center gap-2 border rounded-3 p-2">
                            <Avatar url={u?.perfilUrl} name={name} size={34} />
                            <div className="flex-grow-1">
                              <div className="fw-semibold">{name}</div>
                              <div className="text-muted small">
                                @{u?.username ?? "user"} • {formatDateTime(l.fechaCreacion)}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* SUSCRIPTORES */}
              {panelTab === "suscriptores" && (
                <div>
                  {!panelRevista?.permiteSuscripciones && (
                    <div className="alert alert-warning">Esta revista tiene suscripciones deshabilitadas.</div>
                  )}

                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <div className="fw-semibold">Suscriptores</div>
                    <div className="text-muted small">{panelSuscriptores.length}</div>
                  </div>

                  {panelSuscriptores.length === 0 ? (
                    <div className="text-muted">Aún no hay suscriptores.</div>
                  ) : (
                    <div className="d-flex flex-column gap-2">
                      {panelSuscriptores.map((s) => {
                        const u = s.usuario;
                        const name = `${u?.nombre ?? "Usuario"} ${u?.apellido ?? ""}`.trim();
                        return (
                          <div key={s.id} className="d-flex align-items-center gap-2 border rounded-3 p-2">
                            <Avatar url={u?.perfilUrl} name={name} size={34} />
                            <div className="flex-grow-1">
                              <div className="fw-semibold">{name}</div>
                              <div className="text-muted small">
                                @{u?.username ?? "user"} • {formatDateTime(s.fechaSuscripcion)}
                              </div>
                            </div>
                            <span className={"badge " + (s.activa ? "text-bg-success" : "text-bg-secondary")}>
                              {s.activa ? "Activa" : "Inactiva"}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}