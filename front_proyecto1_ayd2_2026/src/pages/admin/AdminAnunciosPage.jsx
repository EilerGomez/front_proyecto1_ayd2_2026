import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAnunciosByEstado, changeEstadoAnuncio } from "../../services/anuncios.service";

/** ---------- UI helpers ---------- */
function EstadoBadge({ estado }) {
  const e = (estado ?? "").toUpperCase();
  const cls =
    e === "ACTIVO"
      ? "text-bg-success"
      : e === "INACTIVO"
      ? "text-bg-secondary"
      : e === "BORRADOR"
      ? "text-bg-warning"
      : "text-bg-dark";
  return (
    <span className={`badge ${cls}`}>
      <i className="bi bi-circle-fill me-1" style={{ fontSize: 8 }} />
      {e || "—"}
    </span>
  );
}

function renderTipo(t) {
  const code = (t?.codigo ?? "").toUpperCase();
  if (code === "TEXTO") return "Texto";
  if (code === "IMAGEN_TEXTO") return "Texto + Imagen";
  if (code === "VIDEO") return "Video";
  return code || "—";
}

function formatDateTime(dt) {
  if (!dt) return "";
  const s = String(dt).replace("T", " ");
  return s.length > 16 ? s.slice(0, 16) : s;
}

/** ---------- Video helpers ---------- */
function looksLikeDirectVideoFile(url) {
  const u = String(url ?? "").trim().toLowerCase();
  return u.endsWith(".mp4") || u.endsWith(".webm") || u.endsWith(".ogg");
}

function safeUrl(url) {
  try {
    const u = new URL(String(url ?? "").trim());
    return u.toString();
  } catch {
    return "";
  }
}

function getEmbedInfo(rawUrl) {
  const url = safeUrl(rawUrl);
  if (!url) return { type: "none" };

  if (looksLikeDirectVideoFile(url)) return { type: "direct", src: url };

  if (url.includes("youtu.be/") || url.includes("youtube.com/")) {
    try {
      const u = new URL(url);
      let id = "";

      if (u.hostname === "youtu.be") {
        id = u.pathname.slice(1).trim();
      } else if (
        u.hostname === "www.youtube.com" ||
        u.hostname === "youtube.com" ||
        u.hostname === "m.youtube.com"
      ) {
        if (u.pathname === "/watch") {
          id = u.searchParams.get("v") || "";
        } else if (u.pathname.startsWith("/shorts/")) {
          id = u.pathname.split("/shorts/")[1]?.split("/")[0]?.split("?")[0] || "";
        } else if (u.pathname.startsWith("/embed/")) {
          id = u.pathname.split("/embed/")[1]?.split("/")[0]?.split("?")[0] || "";
        }
      }

      const embed = id ? `https://www.youtube.com/embed/${id}` : "";
      return embed ? { type: "iframe", src: embed, provider: "YouTube" } : { type: "link" };
    } catch {
      return { type: "link" };
    }
  }

  if (url.includes("vimeo.com/")) {
    try {
      const u = new URL(url);
      const parts = u.pathname.split("/").filter(Boolean);
      const id = parts[0] || "";
      const embed = id ? `https://player.vimeo.com/video/${id}` : "";
      return embed ? { type: "iframe", src: embed, provider: "Vimeo" } : { type: "link" };
    } catch {
      return { type: "link" };
    }
  }

  if (url.includes("facebook.com/") || url.includes("fb.watch/")) {
    const embed = `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}&show_text=false&width=560`;
    return { type: "iframe", src: embed, provider: "Facebook" };
  }

  if (url.includes("tiktok.com/")) {
    const embed = url.includes("/embed") ? url : url.replace("www.tiktok.com", "www.tiktok.com/embed");
    return { type: "iframe", src: embed, provider: "TikTok" };
  }

  if (url.includes("instagram.com/")) {
    const embed = `${url}${url.includes("?") ? "&" : "?"}utm_source=ig_embed`;
    return { type: "iframe", src: embed, provider: "Instagram" };
  }

  return { type: "iframe", src: url, provider: "Enlace" };
}

function CardPreview({ a }) {
  const code = (a?.tipoAnuncio?.codigo ?? "").toUpperCase();

  if (code === "TEXTO") {
    return (
      <div className="border rounded-3 p-2 bg-light">
        <div className="fw-semibold small" style={{ whiteSpace: "pre-wrap" }}>
          {a.texto || "—"}
        </div>
        {a.urlDestino ? (
          <div className="mt-2 small">
            <i className="bi bi-link-45deg me-1" />
            <a href={a.urlDestino} target="_blank" rel="noreferrer">Abrir link</a>
          </div>
        ) : null}
      </div>
    );
  }

  if (code === "IMAGEN_TEXTO") {
    return (
      <div className="border rounded-3 p-2 bg-light">
        <div className="fw-semibold small" style={{ whiteSpace: "pre-wrap" }}>
          {a.texto || "—"}
        </div>
        <div className="mt-2">
          {a.imagenUrl ? (
            <img
              src={a.imagenUrl}
              alt="anuncio"
              className="rounded-3 border"
              style={{ width: "100%", maxHeight: 160, objectFit: "cover" }}
              onError={(e) => (e.currentTarget.style.display = "none")}
            />
          ) : (
            <div className="text-muted small">Sin imagen</div>
          )}
        </div>
        {a.urlDestino ? (
          <div className="mt-2 small">
            <i className="bi bi-link-45deg me-1" />
            <a href={a.urlDestino} target="_blank" rel="noreferrer">Abrir link</a>
          </div>
        ) : null}
      </div>
    );
  }

  const info = getEmbedInfo(a.videoUrl);

  return (
    <div className="border rounded-3 p-2 bg-light">
      {!a.videoUrl ? (
        <div className="text-muted small">Sin video</div>
      ) : info.type === "direct" ? (
        <video src={info.src} controls className="rounded-3 border" style={{ width: "100%", maxHeight: 200 }} />
      ) : info.type === "iframe" ? (
        <div>
          <div className="ratio ratio-16x9">
              <iframe
                src={
                  info.provider === "YouTube"
                    ? `${info.src}?origin=${encodeURIComponent(window.location.origin)}&rel=0`
                    : info.src
                }
                title={`embed-${a.id}`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                referrerPolicy="strict-origin-when-cross-origin"
                style={{ border: 0 }}
              />
          </div>
          <div className="text-muted small mt-1">
            <i className="bi bi-play-btn me-1" />
            Vista previa ({info.provider})
          </div>
        </div>
      ) : (
        <div className="alert alert-warning mb-0">
          No se pudo previsualizar este video.{" "}
          <a href={a.videoUrl} target="_blank" rel="noreferrer">Abrir enlace</a>
        </div>
      )}

      {a.urlDestino ? (
        <div className="mt-2 small">
          <i className="bi bi-link-45deg me-1" />
          <a href={a.urlDestino} target="_blank" rel="noreferrer">Abrir link destino</a>
        </div>
      ) : null}
    </div>
  );
}

/** ---------- Page ---------- */
export default function AdminAnunciosPage() {
  const navigate = useNavigate();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState({ type: "", text: "" });

  const [q, setQ] = useState("");
  const [estado, setEstado] = useState("ACTIVO"); // ACTIVO por defecto (más útil para admin)

  async function load() {
    setLoading(true);
    setMsg({ type: "", text: "" });

    try {
      if (estado === "ALL") {
        // si no hay endpoint "listar todos", hacemos varias llamadas
        const estados = ["BORRADOR", "ACTIVO", "INACTIVO", "EXPIRADO"];
        const results = await Promise.all(estados.map((e) => getAnunciosByEstado(e)));
        const merged = results.flat();
        // eliminar duplicados por si acaso
        const map = new Map();
        (merged ?? []).forEach((a) => map.set(a.id, a));
        setItems(Array.from(map.values()));
      } else {
        const data = await getAnunciosByEstado(estado);
        setItems(data ?? []);
      }
    } catch (e) {
      console.log(e);
      setMsg({ type: "danger", text: "No se pudieron cargar los anuncios." });
    } finally {
      setLoading(false);
    }
  }

  async function handleToggleEstado(anuncio) {
    const estadoActual = (anuncio?.estado ?? "").toUpperCase();
    const nuevoEstado = estadoActual === "ACTIVO" ? "INACTIVO" : "ACTIVO";

    const ok = window.confirm(`¿Seguro que deseas cambiar el estado a ${nuevoEstado}?`);
    if (!ok) return;

    try {
      await changeEstadoAnuncio(anuncio.id, nuevoEstado);
      await load();
    } catch (e) {
      console.log(e);
      alert("No se pudo cambiar el estado del anuncio.");
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [estado]);

  const filtered = useMemo(() => {
    const query = (q ?? "").toLowerCase().trim();
    return (items ?? []).filter((a) => {
      const matchQuery =
        !query ||
        (a.texto ?? "").toLowerCase().includes(query) ||
        (a.tipoAnuncio?.codigo ?? "").toLowerCase().includes(query) ||
        String(a.id).includes(query);

      return matchQuery;
    });
  }, [items, q]);

  return (
    <div>
      <div className="d-flex align-items-center justify-content-between mb-3">
        <div>
          <h1 className="h4 mb-0">Anuncios</h1>
          <div className="text-muted small">Como admin: ver detalles, pagos y activar/desactivar.</div>
        </div>

        <button className="btn btn-outline-secondary" onClick={load} disabled={loading}>
          <i className="bi bi-arrow-clockwise me-2" />
          {loading ? "Actualizando..." : "Refrescar"}
        </button>
      </div>

      {/* filtros */}
      <div className="card shadow-sm mb-3">
        <div className="card-body">
          <div className="row g-2 align-items-end">
            <div className="col-12 col-md-6">
              <label className="form-label mb-1">Buscar por texto / tipo / id</label>
              <div className="input-group">
                <span className="input-group-text">
                  <i className="bi bi-search" />
                </span>
                <input
                  className="form-control"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Ej: 12, VIDEO, promo..."
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
                <option value="ALL">Todos</option>
                <option value="BORRADOR">BORRADOR</option>
                <option value="ACTIVO">ACTIVO</option>
                <option value="INACTIVO">INACTIVO</option>
                <option value="EXPIRADO">EXPIRADO</option>
              </select>
            </div>

            <div className="col-12 col-md-3 d-flex gap-2">
              <button
                className="btn btn-outline-secondary w-100"
                onClick={() => {
                  setQ("");
                  setEstado("ACTIVO");
                }}
              >
                <i className="bi bi-x-circle me-1" />
                Reset
              </button>
            </div>
          </div>

          <div className="text-muted small mt-2">
            Mostrando <b>{filtered.length}</b> de <b>{items.length}</b>
          </div>
        </div>
      </div>

      {loading && (
        <div className="alert alert-info d-flex align-items-center gap-2">
          <div className="spinner-border spinner-border-sm" />
          <span>Cargando anuncios...</span>
        </div>
      )}

      {msg.text && <div className={`alert alert-${msg.type}`}>{msg.text}</div>}

      {!loading && !msg.text && items.length === 0 && (
        <div className="alert alert-secondary">No hay anuncios para mostrar.</div>
      )}

      {!loading && items.length > 0 && filtered.length === 0 && (
        <div className="alert alert-secondary">No hay resultados con esos filtros.</div>
      )}

      {/* GRID */}
      {!loading && filtered.length > 0 && (
        <div className="row g-3">
          {filtered.map((a) => {
            const menuId = `admin-anuncio-menu-${a.id}`;
            const estadoUpper = (a.estado ?? "").toUpperCase();

            return (
              <div key={a.id} className="col-12 col-md-6 col-lg-4">
                <div className="card shadow-sm h-100">
                  <div className="card-body">
                    <div className="d-flex align-items-start justify-content-between gap-2">
                      <div>
                        <div className="d-flex align-items-center gap-2 flex-wrap">
                          <div className="fw-semibold small">
                            <i className="bi bi-megaphone me-2" />
                            Anuncio #{a.id}
                          </div>
                          <EstadoBadge estado={a.estado} />
                          <span className="badge text-bg-light border">
                            <i className="bi bi-tag me-1" />
                            {renderTipo(a.tipoAnuncio)}
                          </span>
                        </div>

                        <div className="text-muted small mt-1">
                          <i className="bi bi-clock me-1" />
                          {formatDateTime(a.fechaCreacion)}
                        </div>

                        {a.anunciante?.nombre ? (
                          <div className="text-muted small mt-1">
                            <i className="bi bi-person me-1" />
                            {a.anunciante.nombre} {a.anunciante.apellido ?? ""}
                          </div>
                        ) : null}
                      </div>

                      {/* dropdown */}
                      <div className="dropdown">
                        <button
                          className="btn btn-sm btn-light border"
                          type="button"
                          id={menuId}
                          data-bs-toggle="dropdown"
                          aria-expanded="false"
                        >
                          <i className="bi bi-three-dots-vertical" />
                        </button>

                        <ul className="dropdown-menu dropdown-menu-end" aria-labelledby={menuId}>
                          <li>
                            <button
                              className="dropdown-item"
                              onClick={() => navigate(`/app/admin/anuncios/${a.id}`)}
                            >
                              <i className="bi bi-eye me-2" />
                              Ver detalles
                            </button>
                          </li>

                          <li>
                            <button
                              className="dropdown-item"
                              onClick={() => navigate(`/app/admin/anuncios/${a.id}/pagos`)}
                            >
                              <i className="bi bi-receipt me-2" />
                              Ver pagos
                            </button>
                          </li>

                          {/* Activar / Desactivar */}
                          {estadoUpper === "ACTIVO" && (
                            <li>
                              <button className="dropdown-item text-danger" onClick={() => handleToggleEstado(a)}>
                                <i className="bi bi-pause-circle me-2" />
                                Desactivar
                              </button>
                            </li>
                          )}

                          {estadoUpper === "INACTIVO" && (
                            <li>
                              <button className="dropdown-item text-success" onClick={() => handleToggleEstado(a)}>
                                <i className="bi bi-play-circle me-2" />
                                Activar
                              </button>
                            </li>
                          )}
                        </ul>
                      </div>
                    </div>

                    <div className="mt-3">
                      <CardPreview a={a} />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}