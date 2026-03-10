import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { getAnuncioById } from "../../services/anuncios.service";
import { getUser, getRole } from "../../auth/authService";

function isYouTubeUrl(url) {
  const u = String(url ?? "").trim();
  if (!u) return false;
  return (
    u.includes("youtube.com/watch") ||
    u.includes("youtube.com/shorts") ||
    u.includes("youtube.com/embed") ||
    u.includes("youtu.be/")
  );
}

function getYouTubeEmbedUrl(url) {
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

    if (!id) return "";

    return `https://www.youtube.com/embed/${id}`;
  } catch {
    return "";
  }
}

function looksLikeDirectVideoFile(url) {
  const u = String(url ?? "").trim().toLowerCase();
  return u.endsWith(".mp4") || u.endsWith(".webm") || u.endsWith(".ogg");
}

function formatDateTime(dt) {
  if (!dt) return "";
  const s = String(dt).replace("T", " ");
  return s.length > 16 ? s.slice(0, 16) : s;
}

export default function AnuncianteAnuncioDetail() {
  const { id } = useParams();
  const anuncioId = Number(id);
  const navigate = useNavigate();
  const user = getUser();
  const rol = getRole();

  const [loading, setLoading] = useState(true);
  const [a, setA] = useState(null);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    (async () => {
      setLoading(true);
      setMsg("");
      try {
        const data = await getAnuncioById(anuncioId);

        // seguridad simple: solo ver si es del anunciante logueado
        if ((data?.anunciante?.id != null && user?.id != null && data.anunciante.id !== user.id && (rol.nombre==='ADMIN'||rol.nombre==='ANUNCIANTE'))) {
          setMsg("No tenés permiso para ver este anuncio.");
          setA(null);
          setLoading(false);
          return;
        }

        setA(data);
      } catch (e) {
        console.log(e);
        setMsg("No se pudo cargar el anuncio.");
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [anuncioId]);

  if (loading) {
    return (
      <div className="alert alert-info d-flex align-items-center gap-2">
        <div className="spinner-border spinner-border-sm" />
        <span>Cargando anuncio...</span>
      </div>
    );
  }

  if (msg) return <div className="alert alert-danger">{msg}</div>;
  if (!a) return <div className="alert alert-secondary">No encontrado.</div>;

  const code = (a?.tipoAnuncio?.codigo ?? "").toUpperCase();

  // VIDEO helpers
  const videoUrl = String(a.videoUrl ?? "").trim();
  const isYt = isYouTubeUrl(videoUrl);
  const ytEmbed = isYt ? getYouTubeEmbedUrl(videoUrl) : "";
  const isDirect = looksLikeDirectVideoFile(videoUrl);

  return (
    <div className="card shadow-sm">
      <div className="card-body">
        <div className="d-flex align-items-center justify-content-between mb-2">
          <div>
            <h1 className="h4 mb-0">Detalle anuncio #{a.id}</h1>
            <div className="text-muted small">
              Tipo: <b>{a.tipoAnuncio?.codigo}</b> • Estado: <b>{a.estado}</b>
            </div>
          </div>

          <div className="d-flex gap-2">
            {rol === "ANUNCIANTE" && (
              <Link to={`/app/anunciante/anuncios/${a.id}/editar`} className="btn btn-primary">
                <i className="bi bi-pencil-square me-2"></i>
                Editar
              </Link>
            )}
            <button className="btn btn-outline-secondary" onClick={() => navigate(-1)}>
              <i className="bi bi-arrow-left me-2"></i>
              Volver
            </button>
          </div>
        </div>

        <div className="row g-3 mt-1">
          <div className="col-12 col-md-7">
            <div className="border rounded-3 p-3 bg-light">
              {code === "TEXTO" && (
                <div className="fw-semibold" style={{ whiteSpace: "pre-wrap" }}>
                  {a.texto || "—"}
                </div>
              )}

              {code === "TEXTO_IMAGEN" && (
                <div className="d-flex flex-column gap-2">
                  <div className="fw-semibold" style={{ whiteSpace: "pre-wrap" }}>
                    {a.texto || "—"}
                  </div>
                  {a.imagenUrl ? (
                    <img
                      src={a.imagenUrl}
                      alt="anuncio"
                      className="rounded-3 border"
                      style={{ width: "100%", maxHeight: 280, objectFit: "cover" }}
                      onError={(e) => (e.currentTarget.style.display = "none")}
                    />
                  ) : (
                    <div className="text-muted small">Sin imagen</div>
                  )}
                </div>
              )}

              {code === "VIDEO" && (
                <div>
                  {!videoUrl ? (
                    <div className="text-muted small">Sin video</div>
                  ) : isYt ? (
                    ytEmbed ? (
                      <div className="ratio ratio-16x9">
                        <iframe
                          src={`${ytEmbed}?origin=${encodeURIComponent(window.location.origin)}&rel=0`}
                          title={`yt-${a.id}`}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                          allowFullScreen
                          referrerPolicy="strict-origin-when-cross-origin"
                          style={{ border: 0 }}
                        />
                      </div>
                    ) : (
                      <div className="alert alert-warning mb-0">Link de YouTube inválido.</div>
                    )
                  ) : isDirect ? (
                    <video
                      src={videoUrl}
                      controls
                      className="rounded-3 border"
                      style={{ width: "100%", maxHeight: 320 }}
                    />
                  ) : (
                    <div className="alert alert-warning mb-0">
                      Ese link no es un archivo de video directo (.mp4/.webm/.ogg). Si es YouTube, pegá un link de YouTube.
                    </div>
                  )}
                </div>
              )}

              {a.urlDestino ? (
                <div className="mt-2 small">
                  <i className="bi bi-link-45deg me-1"></i>
                  <a href={a.urlDestino} target="_blank" rel="noreferrer">
                    Abrir link
                  </a>
                </div>
              ) : null}
            </div>
          </div>

          <div className="col-12 col-md-5">
            <div className="border rounded-3 p-3">
              <div className="fw-semibold mb-2">Información</div>

              <div className="small text-muted mb-1">ID</div>
              <div className="mb-2">{a.id}</div>

              <div className="small text-muted mb-1">Estado</div>
              <div className="mb-2">{a.estado}</div>

              <div className="small text-muted mb-1">Fecha creación</div>
              <div className="mb-2">{formatDateTime(a.fechaCreacion)}</div>

              <div className="small text-muted mb-1">Tipo anuncio</div>
              <div className="mb-2">
                {a.tipoAnuncio?.codigo} - {a.tipoAnuncio?.descripcion}
              </div>

              <div className="small text-muted mb-1">Anunciante</div>
              <div className="mb-2">
                {a.anunciante?.nombre ?? "—"} {a.anunciante?.apellido ?? ""}
                {a.anunciante?.username ? <span className="text-muted"> • @{a.anunciante.username}</span> : null}
              </div>

              <div className="small text-muted mb-1">URL Destino</div>
              <div className="mb-0">{a.urlDestino || "—"}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}