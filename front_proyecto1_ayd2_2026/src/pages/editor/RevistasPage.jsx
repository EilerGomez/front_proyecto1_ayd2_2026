import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getUser } from "../../auth/authService";
import { getRevistasByEditorId } from "../../services/revistas.service";

import {
  existsLike,
  darLike,
  quitarLike,
  getLikesByRevistaId,
} from "../../services/likes.service";

import {
  getComentariosByRevistaId,
  createComentario,
  deleteComentario,
} from "../../services/comentarios.service";

import {
  suscribirse,
  cancelarSuscripcion,
  getSuscripcionesByUsuarioId,
  getSuscripcionesByRevistaId,
} from "../../services/suscripciones.service";

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

function getUltimaEdicion(ediciones) {
  const arr = Array.isArray(ediciones) ? ediciones : [];
  if (arr.length === 0) return null;
  return arr.reduce((max, it) => (it?.id > (max?.id ?? -1) ? it : max), arr[0]);
}

function formatDateTime(dt) {
  if (!dt) return "";
  const s = String(dt).replace("T", " ");
  return s.length > 16 ? s.slice(0, 16) : s;
}

function todayISO() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export default function RevistasPage() {
  const user = getUser();
  const usuarioId = user?.id;
  const editorId = user?.id;
  const navigate = useNavigate();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // per revista
  const [likedByMe, setLikedByMe] = useState({});
  const [likeBusy, setLikeBusy] = useState({});

  const [subsByMe, setSubsByMe] = useState({});
  const [subBusy, setSubBusy] = useState({});

  // panel
  const [panelOpen, setPanelOpen] = useState(false);
  const [panelTab, setPanelTab] = useState("comentarios");
  const [panelRevista, setPanelRevista] = useState(null);

  const [panelLoading, setPanelLoading] = useState(false);
  const [panelComentarios, setPanelComentarios] = useState([]);
  const [panelLikes, setPanelLikes] = useState([]);
  const [panelSuscriptores, setPanelSuscriptores] = useState([]);

  const [nuevoComentario, setNuevoComentario] = useState("");
  const [commentBusy, setCommentBusy] = useState(false);

  function canSubscribe(revista) {
    const editorUserId = revista?.editor?.id;
    return usuarioId != null && editorUserId != null && usuarioId !== editorUserId;
  }

  async function load() {
    setError("");
    setLoading(true);

    try {
      if (!editorId) return;

      // 1) revistas
      const data = await getRevistasByEditorId(editorId);
      setItems(data ?? []);

      // 2) suscripciones del usuario (map)
      try {
        const subs = await getSuscripcionesByUsuarioId(usuarioId);
        const map = {};
        (subs ?? []).forEach((s) => {
          const rid = s?.revista?.id;
          if (rid != null) map[rid] = { subscribed: !!s.activa, suscripcionId: s.id };
        });
        setSubsByMe(map);
      } catch (e) {
        console.log("No se pudieron cargar suscripciones:", e);
      }

      // 3) existsLike por revista (solo si permiteLikes)
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
      setError("No se pudieron cargar las revistas.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editorId]);

  function warnDisabled(msg) {
    // podés cambiarlo por toast si tenés (react-toastify, etc.)
    alert(msg);
  }
  // ---------- LIKE ----------
  async function toggleLike(revista) {
    const rid = revista.id;
    if (!revista?.permiteLikes) return;

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

  // ---------- SUSCRIPCIÓN ----------
  async function toggleSuscripcion(revista) {
    const rid = revista.id;
    if (!revista?.permiteSuscripciones) return;
    if (!canSubscribe(revista)) return;

    setSubBusy((p) => ({ ...p, [rid]: true }));
    try {
      const current = subsByMe[rid];
      const subscribed = !!current?.subscribed;

      if (subscribed) {
        if (!current?.suscripcionId) throw new Error("No suscripcionId");
        await cancelarSuscripcion(current.suscripcionId);

        setSubsByMe((p) => ({
          ...p,
          [rid]: { subscribed: false, suscripcionId: current.suscripcionId },
        }));

        setItems((prev) =>
          prev.map((x) =>
            x.id === rid
              ? { ...x, cantidadSuscripciones: Math.max(0, (x.cantidadSuscripciones ?? 0) - 1) }
              : x
          )
        );
      } else {
        const resp = await suscribirse({
          revistaId: rid,
          usuarioId,
          fechaSuscripcion: todayISO(),
          activa: true,
        });

        setSubsByMe((p) => ({ ...p, [rid]: { subscribed: true, suscripcionId: resp?.id } }));

        setItems((prev) =>
          prev.map((x) =>
            x.id === rid ? { ...x, cantidadSuscripciones: (x.cantidadSuscripciones ?? 0) + 1 } : x
          )
        );
      }

      if (panelOpen && panelRevista?.id === rid) {
        await loadPanelData(rid);
      }
    } catch (e) {
      console.log(e);
      alert("No se pudo procesar la suscripción.");
    } finally {
      setSubBusy((p) => ({ ...p, [rid]: false }));
    }
  }

  // ---------- PANEL ----------
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

  async function crearComentario() {
    if (!panelRevista?.id) return;
    if (!panelRevista?.permiteComentarios) return;

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

  // ---------- UI buttons ----------
  function LikeButton({ r }) {
    if (!r?.permiteLikes) return null;
    const rid = r.id;
    const active = !!likedByMe[rid];
    const busy = !!likeBusy[rid];

    return (
      <button
        className={"btn btn-sm " + (active ? "btn-danger" : "btn-outline-danger")}
        onClick={() => toggleLike(r)}
        disabled={busy}
        title={active ? "Quitar like" : "Dar like"}
      >
        <i className={"bi " + (active ? "bi-heart-fill" : "bi-heart") + " me-2"}></i>
        Me gusta
      </button>
    );
  }

  function CommentButton({ r }) {
    if (!r?.permiteComentarios) return null;

    return (
      <button
        className="btn btn-sm btn-outline-secondary"
        onClick={() => openPanel(r, "comentarios")}
        title="Ver comentarios"
      >
        <i className="bi bi-chat-left-text me-2"></i>
        Comentarios
      </button>
    );
  }

  function SubscribeButton({ r }) {
    if (!r?.permiteSuscripciones) return null;

    const rid = r.id;
    const current = subsByMe[rid];
    const active = !!current?.subscribed;
    const busy = !!subBusy[rid];
    const allowed = canSubscribe(r);

    return (
      <button
        className={"btn btn-sm " + (active ? "btn-success" : "btn-outline-success")}
        onClick={() => toggleSuscripcion(r)}
        disabled={busy || !allowed}
        title={
          !allowed
            ? "No podés suscribirte a tu propia revista"
            : active
              ? "Cancelar suscripción"
              : "Suscribirse"
        }
      >
        <i className={"bi " + (active ? "bi-person-check-fill" : "bi-person-plus") + " me-2"}></i>
        {active ? "Suscrito" : "Suscribirme"}
      </button>
    );
  }

  return (
    <div>
      {/* Header page */}
      <div className="d-flex align-items-center justify-content-between mb-3">
        <div>
          <h1 className="h4 mb-0">Mis revistas</h1>
          <div className="text-muted small">Administra tus revistas, crea, publica, hazte famoso.</div>
        </div>

        <Link to="/app/editor/revistas/nueva" className="btn btn-primary">
          <i className="bi bi-plus-lg me-2"></i>
          Nueva revista
        </Link>
      </div>

      {loading && (
        <div className="alert alert-info d-flex align-items-center gap-2">
          <div className="spinner-border spinner-border-sm" />
          <span>Cargando revistas...</span>
        </div>
      )}

      {error && <div className="alert alert-danger">{error}</div>}

      {!loading && !error && items.length === 0 && (
        <div className="alert alert-secondary">
          Aún no tenés revistas. Creá la primera con <b>Nueva revista</b>.
        </div>
      )}

      {!loading && !error && items.length > 0 && (
        <div className="d-flex flex-column gap-3">
          {items.map((r) => {
            const menuId = `revista-menu-${r.id}`;
            const ultimaEd = getUltimaEdicion(r.ediciones);
            const editorName = `${r.editor?.nombre ?? "Editor"} ${r.editor?.apellido ?? ""}`.trim();
            const categoriaName = r.categoria?.nombre ?? "Sin categoría";
            const catColor = badgeColorByCategoria(categoriaName);

            return (
              <div key={r.id} className="card shadow-sm">
                <div className="card-body pb-2">
                  <div className="d-flex align-items-start justify-content-between gap-2">
                    <div className="d-flex align-items-center gap-2">
                      <Avatar url={r.editor?.perfilUrl} name={editorName} />

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

                    {/* 3 puntitos */}
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
                          <button className="dropdown-item" onClick={() => navigate(`/app/editor/revistas/${r.id}`)}>
                            <i className="bi bi-eye me-2"></i>
                            Ver detalle
                          </button>
                        </li>

                        <li>
                          <button
                            className="dropdown-item"
                            onClick={() => navigate(`/app/editor/revistas/${r.id}/etiquetas`)}
                          >
                            <i className="bi bi-tags me-2"></i>
                            Ver etiquetas
                          </button>
                        </li>

                        <li>
                          <button
                            className="dropdown-item"
                            onClick={() => navigate(`/app/editor/revistas/${r.id}/ediciones`)}
                          >
                            <i className="bi bi-journal-text me-2"></i>
                            Ver ediciones
                          </button>
                        </li>

                        <li><hr className="dropdown-divider" /></li>

                        <li>
                          <button
                            className="dropdown-item"
                            onClick={() => navigate(`/app/editor/revistas/${r.id}/editar`)}
                          >
                            <i className="bi bi-pencil-square me-2"></i>
                            Editar
                          </button>
                        </li>
                      </ul>
                    </div>
                  </div>


                  {/* descripción */}
                  <div className="mt-3 text-muted" style={{ whiteSpace: "pre-wrap" }}>
                    {r.titulo ? <div className="fw-semibold text-dark mb-1">{r.titulo}</div> : null}

                    {r.descripcion || "—"}
                  </div>

                  {/* etiquetas */}
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

                {/* PDF preview */}
                <div className="px-3 pb-3">
                  {ultimaEd?.pdfUrl ? (
                    <div className="border rounded-3 overflow-hidden bg-light">
                      <div className="d-flex align-items-center justify-content-between px-3 py-2 border-bottom bg-white">
                        <div className="fw-semibold">
                          <i className="bi bi-file-earmark-pdf me-2"></i>
                          {ultimaEd.titulo || "Última edición"}
                        </div>

                        <div className="text-muted small">
                          <i className="bi bi-hash me-1"></i>Edición ID: {ultimaEd.id}
                          {ultimaEd.numeroEdicion ? (
                            <>
                              <span className="mx-2">•</span>
                              No. {ultimaEd.numeroEdicion}
                            </>
                          ) : null}
                        </div>
                      </div>

                      <div style={{ height: 520 }}>
                        <iframe
                          title={`pdf-${ultimaEd.id}`}
                          src={ultimaEd.pdfUrl}
                          style={{ width: "100%", height: "100%", border: "none" }}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="alert alert-light border mb-0">
                      <i className="bi bi-info-circle me-2"></i>
                      Esta revista aún no tiene ediciones con PDF.
                      <button
                        className="btn btn-link p-0 ms-2"
                        onClick={() => navigate(`/app/editor/revistas/${r.id}/ediciones`)}
                      >
                        Agregar edición
                      </button>
                    </div>
                  )}
                </div>

                {/* footer */}
                <div className="card-footer bg-white">
                  <div className="d-flex flex-wrap gap-2 justify-content-between align-items-center">
                    <div className="card-footer bg-white">
                      <div className="d-flex justify-content-between align-items-center">

                        {/* IZQUIERDA: BOTONES REALES CON CONTADOR */}
                        <div className="d-flex flex-wrap gap-2">

                          {/* LIKE */}
                          <button
                            className={
                              "btn btn-sm " +
                              (likedByMe[r.id] ? "btn-danger" : "btn-outline-danger")
                            }
                            onClick={() => {
                              if (!r.permiteLikes) return warnDisabled("Esta revista tiene los likes deshabilitados.");
                              toggleLike(r);
                            }}
                            disabled={likeBusy[r.id]}
                            title={!r.permiteLikes ? "Likes deshabilitados" : (likedByMe[r.id] ? "Quitar like" : "Dar like")}
                            style={!r.permiteLikes ? { opacity: 0.6 } : undefined}
                          >
                            <i
                              className={
                                "bi " +
                                (likedByMe[r.id] ? "bi-heart-fill" : "bi-heart") +
                                " me-1"
                              }
                            ></i>
                            {r.cantidadLikes ?? 0}
                          </button>

                          {/* COMENTARIOS */}
                          <button
                            className="btn btn-sm btn-outline-secondary"
                            onClick={() => {
                              if (!r.permiteComentarios) return warnDisabled("Esta revista tiene los comentarios deshabilitados.");
                              openPanel(r, "comentarios");
                            }}
                            title={!r.permiteComentarios ? "Comentarios deshabilitados" : "Ver comentarios"}
                            style={!r.permiteComentarios ? { opacity: 0.6 } : undefined}
                          >
                            <i className="bi bi-chat-left-text me-1"></i>
                            {r.cantidadComentarios ?? 0}
                          </button>

                          {/* SUSCRIPCIÓN */}
                          <button
                            className={
                              "btn btn-sm " +
                              (subsByMe[r.id]?.subscribed ? "btn-success" : "btn-outline-success")
                            }
                            onClick={() => {
                              if (!r.permiteSuscripciones) return warnDisabled("Esta revista tiene las suscripciones deshabilitadas.");
                              if (!canSubscribe(r)) return warnDisabled("No podés suscribirte a tu propia revista.");
                              toggleSuscripcion(r);
                            }}
                            disabled={subBusy[r.id]}
                            title={
                              !r.permiteSuscripciones
                                ? "Suscripciones deshabilitadas"
                                : !canSubscribe(r)
                                  ? "No podés suscribirte a tu propia revista"
                                  : subsByMe[r.id]?.subscribed
                                    ? "Cancelar suscripción"
                                    : "Suscribirse"
                            }
                            style={!r.permiteSuscripciones ? { opacity: 0.6 } : undefined}
                          >
                            <i
                              className={
                                "bi " +
                                (subsByMe[r.id]?.subscribed ? "bi-person-check-fill" : "bi-person-plus") +
                                " me-1"
                              }
                            ></i>
                            {r.cantidadSuscripciones ?? 0}
                          </button>
                        </div>

                        {/* DERECHA: SOLO ACTIVIDAD 
                        <button
                          className="btn btn-sm btn-outline-dark"
                          onClick={() => openPanel(r, "likes")}
                        >
                          <i className="bi bi-people me-1"></i>
                          Actividad
                        </button>*/}

                      </div>
                    </div>
                  </div>

                  <div className="text-muted small mt-2">
                    {!r.permiteLikes ? <span className="me-3">• Likes deshabilitados</span> : null}
                    {!r.permiteComentarios ? <span className="me-3">• Comentarios deshabilitados</span> : null}
                    {!r.permiteSuscripciones ? <span className="me-3">• Suscripciones deshabilitadas</span> : null}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* OFFCANVAS */}
      {panelOpen && (
        <>
          {/* Backdrop correcto para offcanvas */}
          <div
            className="offcanvas-backdrop fade show"
            onClick={closePanel}
            style={{ cursor: "pointer", zIndex: 1040 }}
          />

          {/* Offcanvas arriba del backdrop */}
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
                  onClick={() => setPanelTab("comentarios")}
                >
                  <i className="bi bi-chat-left-text me-1"></i> Comentarios
                </button>
                <button
                  className={"btn " + (panelTab === "likes" ? "btn-danger" : "btn-outline-danger")}
                  onClick={() => setPanelTab("likes")}
                >
                  <i className="bi bi-heart me-1"></i> Likes
                </button>
                <button
                  className={"btn " + (panelTab === "suscriptores" ? "btn-success" : "btn-outline-success")}
                  onClick={() => setPanelTab("suscriptores")}
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