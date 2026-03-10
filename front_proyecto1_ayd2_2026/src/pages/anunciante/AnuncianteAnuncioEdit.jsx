import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getAnuncioById, updateAnuncio } from "../../services/anuncios.service";
import { getTiposAnuncio } from "../../services/tiposAnuncio.service";
import { getUser } from "../../auth/authService";

function normalizeCode(codigo) {
  return String(codigo ?? "")
    .trim()
    .toUpperCase()
    .replaceAll(" ", "_");
}

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

export default function AnuncianteAnuncioEdit() {
  const { id } = useParams();
  const anuncioId = Number(id);
  const navigate = useNavigate();
  const user = getUser();

  const [loading, setLoading] = useState(true);
  const [tipos, setTipos] = useState([]);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  const [form, setForm] = useState({
    tipoAnuncioId: "",
    texto: "",
    imagenUrl: "",
    videoUrl: "",
    urlDestino: "",
  });

  const tipoSel = useMemo(
    () => tipos.find((t) => String(t.id) === String(form.tipoAnuncioId)),
    [tipos, form.tipoAnuncioId]
  );

  const code = useMemo(() => normalizeCode(tipoSel?.codigo), [tipoSel]);

  const showText = code === "TEXTO" || code === "IMAGEN_TEXTO";
  const showImage = code === "IMAGEN_TEXTO";
  const showVideo = code === "VIDEO";

  useEffect(() => {
    (async () => {
      setLoading(true);
      setMsg("");
      try {
        const [a, t] = await Promise.all([getAnuncioById(anuncioId), getTiposAnuncio()]);
        setTipos(t ?? []);

        if (a?.anunciante?.id != null && user?.id != null && a.anunciante.id !== user.id) {
          setMsg("No tenés permiso para editar este anuncio.");
          setLoading(false);
          return;
        }

        setForm({
          tipoAnuncioId: a?.tipoAnuncio?.id ?? "",
          texto: a?.texto ?? "",
          imagenUrl: a?.imagenUrl ?? "",
          videoUrl: a?.videoUrl ?? "",
          urlDestino: a?.urlDestino ?? "",
        });
      } catch (e) {
        console.log(e);
        setMsg("No se pudo cargar el anuncio.");
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [anuncioId]);

  function setField(name, value) {
    setForm((p) => ({ ...p, [name]: value }));
  }

  async function onSubmit(e) {
    e.preventDefault();
    setMsg("");

    if (!form.tipoAnuncioId) return setMsg("Seleccioná un tipo de anuncio.");
    if (showText && !form.texto.trim()) return setMsg("El texto es requerido.");
    if (showImage && !form.imagenUrl.trim()) return setMsg("La imagenUrl es requerida.");
    if (showVideo && !form.videoUrl.trim()) return setMsg("El videoUrl es requerido.");

    setSaving(true);
    try {
      await updateAnuncio(anuncioId, {
        anuncianteId: user?.id,
        tipoAnuncioId: Number(form.tipoAnuncioId),
        texto: showText ? (form.texto || null) : null,
        imagenUrl: showImage ? (form.imagenUrl || null) : null,
        videoUrl: showVideo ? (form.videoUrl || null) : null,
        urlDestino: form.urlDestino || null,
        // NO estado
      });

      navigate(`/app/anunciante/anuncios/${anuncioId}`);
    } catch (e2) {
      console.log(e2);
      setMsg("No se pudo actualizar el anuncio.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="alert alert-info d-flex align-items-center gap-2">
        <div className="spinner-border spinner-border-sm" />
        <span>Cargando anuncio...</span>
      </div>
    );
  }

  const videoUrl = String(form.videoUrl ?? "").trim();
  const isYt = isYouTubeUrl(videoUrl);
  const ytEmbed = isYt ? getYouTubeEmbedUrl(videoUrl) : "";
  const isDirect = looksLikeDirectVideoFile(videoUrl);

  return (
    <div className="card shadow-sm">
      <div className="card-body">
        <div className="d-flex align-items-center justify-content-between mb-2">
          <div>
            <h1 className="h4 mb-0">Editar anuncio #{anuncioId}</h1>
            <div className="text-muted small">Actualizá contenido y tipo.</div>
          </div>

          <button className="btn btn-outline-secondary" onClick={() => navigate(-1)}>
            <i className="bi bi-arrow-left me-2"></i>
            Volver
          </button>
        </div>

        {msg && <div className="alert alert-danger">{msg}</div>}

        <form onSubmit={onSubmit} className="row g-3 mt-1">
          <div className="col-12 col-md-6">
            <label className="form-label">Tipo de anuncio</label>
            <select
              className="form-select"
              value={form.tipoAnuncioId}
              onChange={(e) => {
                const val = e.target.value;
                const selected = tipos.find((t) => String(t.id) === String(val));
                const nextCode = normalizeCode(selected?.codigo);

                // limpiar lo que NO aplica
                setForm((p) => ({
                  ...p,
                  tipoAnuncioId: val,
                  texto: nextCode === "VIDEO" ? "" : p.texto,
                  imagenUrl: nextCode === "IMAGEN_TEXTO" ? p.imagenUrl : "",
                  videoUrl: nextCode === "VIDEO" ? p.videoUrl : "",
                }));
              }}
            >
              <option value="">-- Seleccionar --</option>
              {tipos.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.codigo} - {t.descripcion}
                </option>
              ))}
            </select>
          </div>

          {/* TEXTO */}
          {showText && (
            <div className="col-12">
              <label className="form-label">Texto</label>
              <textarea
                className="form-control"
                rows={4}
                value={form.texto}
                onChange={(e) => setField("texto", e.target.value)}
              />
            </div>
          )}

          {/* IMAGEN */}
          {showImage && (
            <div className="col-12">
              <label className="form-label">Imagen URL</label>
              <input
                className="form-control"
                value={form.imagenUrl}
                onChange={(e) => setField("imagenUrl", e.target.value)}
                placeholder="https://..."
              />
              {form.imagenUrl ? (
                <div className="mt-2">
                  <img
                    src={form.imagenUrl}
                    alt="preview"
                    className="rounded-3 border"
                    style={{ width: "100%", maxHeight: 260, objectFit: "cover" }}
                    onError={(e) => (e.currentTarget.style.display = "none")}
                  />
                </div>
              ) : null}
            </div>
          )}

          {/* VIDEO */}
          {showVideo && (
            <div className="col-12">
              <label className="form-label">Video URL</label>
              <input
                className="form-control"
                value={form.videoUrl}
                onChange={(e) => setField("videoUrl", e.target.value)}
                placeholder="Pega link de YouTube o un .mp4/.webm/.ogg"
              />

              {!!videoUrl && (
                <div className="mt-2">
                  {isYt ? (
                    ytEmbed ? (
                      <div className="ratio ratio-16x9">
                        <iframe
                          src={`${ytEmbed}?origin=${encodeURIComponent(window.location.origin)}&rel=0`}
                          title={`yt-edit-${anuncioId}`}
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
                      style={{ width: "100%", maxHeight: 280 }}
                    />
                  ) : (
                    <div className="alert alert-warning mb-0">
                      Ese link no es un archivo de video directo (.mp4/.webm/.ogg). Si es YouTube, pegá un link de YouTube.
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="col-12">
            <label className="form-label">URL destino (opcional)</label>
            <input
              className="form-control"
              value={form.urlDestino}
              onChange={(e) => setField("urlDestino", e.target.value)}
              placeholder="https://..."
            />
          </div>

          <div className="col-12 d-flex gap-2">
            <button className="btn btn-primary" disabled={saving}>
              {saving ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2"></span>
                  Guardando...
                </>
              ) : (
                <>
                  <i className="bi bi-check-lg me-2"></i>
                  Guardar cambios
                </>
              )}
            </button>

            <button type="button" className="btn btn-outline-secondary" onClick={() => navigate(-1)} disabled={saving}>
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}