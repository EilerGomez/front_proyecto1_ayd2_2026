import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getUser } from "../../auth/authService";
import { createAnuncio } from "../../services/anuncios.service";
import { getTiposAnuncio } from "../../services/tiposAnuncio.service";

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

    // youtu.be/VIDEOID
    if (u.hostname.includes("youtu.be")) {
      const id = u.pathname.replace("/", "").trim();
      return id ? `https://www.youtube.com/embed/${id}` : "";
    }

    // youtube.com/watch?v=VIDEOID
    if (u.hostname.includes("youtube.com") && u.pathname === "/watch") {
      const id = u.searchParams.get("v");
      return id ? `https://www.youtube.com/embed/${id}` : "";
    }

    // youtube.com/shorts/VIDEOID
    if (u.hostname.includes("youtube.com") && u.pathname.startsWith("/shorts/")) {
      const id = u.pathname.split("/shorts/")[1]?.split("?")[0]?.trim();
      return id ? `https://www.youtube.com/embed/${id}` : "";
    }

    // youtube.com/embed/VIDEOID (ya viene)
    if (u.hostname.includes("youtube.com") && u.pathname.startsWith("/embed/")) {
      return url;
    }

    return "";
  } catch {
    return "";
  }
}

function looksLikeDirectVideoFile(url) {
  const u = String(url ?? "").trim().toLowerCase();
  return u.endsWith(".mp4") || u.endsWith(".webm") || u.endsWith(".ogg");
}

export default function AnuncianteAnuncioCreate() {
  const navigate = useNavigate();
  const user = getUser();
  const anuncianteId = user?.id;

  const [tipos, setTipos] = useState([]);
  const [loadingTipos, setLoadingTipos] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  const [form, setForm] = useState({
    tipoAnuncioId: "",
    texto: "",
    imagenUrl: "",
    videoUrl: "",
    urlDestino: "",
    estado:""
  });

  useEffect(() => {
    (async () => {
      setLoadingTipos(true);
      try {
        const data = await getTiposAnuncio();
        setTipos(data ?? []);
      } catch (e) {
        console.log(e);
        setTipos([]);
      } finally {
        setLoadingTipos(false);
      }
    })();
  }, []);

  const tipoSel = useMemo(
    () => tipos.find((t) => String(t.id) === String(form.tipoAnuncioId)),
    [tipos, form.tipoAnuncioId]
  );

  const code = useMemo(() => normalizeCode(tipoSel?.codigo), [tipoSel]);

  // en tu BD los códigos son: 'TEXTO','TEXTO_IMAGEN','VIDEO'
  const showText = code === "TEXTO" || code === "IMAGEN_TEXTO";
  const showImage = code === "IMAGEN_TEXTO";
  const showVideo = code === "VIDEO";

  const ytEmbed = useMemo(() => {
    if (!showVideo) return "";
    if (!isYouTubeUrl(form.videoUrl)) return "";
    return getYouTubeEmbedUrl(form.videoUrl);
  }, [form.videoUrl, showVideo]);

  function setField(name, value) {
    setForm((p) => ({ ...p, [name]: value }));
  }

  async function onSubmit(e) {
    e.preventDefault();
    setMsg("");

    if (!form.tipoAnuncioId) return setMsg("Seleccioná un tipo de anuncio.");

    if (showText && !form.texto.trim()) return setMsg("El texto es requerido.");
    if (showImage && !form.imagenUrl.trim()) return setMsg("La imagenUrl es requerida.");

    if (showVideo) {
      if (!form.videoUrl.trim()) return setMsg("El videoUrl es requerido.");

      // si es youtube, validamos que podamos generar embed
      if (isYouTubeUrl(form.videoUrl) && !ytEmbed) {
        return setMsg("URL de YouTube inválida. Pegá un link tipo watch?v=... o youtu.be/...");
      }
    }

    setSaving(true);
    try {
      await createAnuncio({
        anuncianteId,
        tipoAnuncioId: Number(form.tipoAnuncioId),
        texto: showText ? (form.texto.trim() || null) : null,
        imagenUrl: showImage ? (form.imagenUrl.trim() || null) : null,
        videoUrl: showVideo ? (form.videoUrl.trim() || null) : null,
        urlDestino: form.urlDestino.trim() || null,
       
      });

      navigate("/app/anunciante/anuncios");
    } catch (e2) {
      console.log(e2);
      setMsg("No se pudo crear el anuncio.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="card shadow-sm">
      <div className="card-body">
        <div className="d-flex align-items-center justify-content-between mb-2">
          <div>
            <h1 className="h4 mb-0">Nuevo anuncio</h1>
            <div className="text-muted small">
              Seleccioná el tipo y completá los campos necesarios.
            </div>
          </div>

          <button className="btn btn-outline-secondary" onClick={() => navigate(-1)}>
            <i className="bi bi-arrow-left me-2"></i>
            Volver
          </button>
        </div>

        {msg && <div className="alert alert-danger">{msg}</div>}

        <form onSubmit={onSubmit} className="row g-3 mt-1">
          {/* Tipo */}
          <div className="col-12 col-md-6">
            <label className="form-label">Tipo de anuncio</label>
            <select
              className="form-select"
              value={form.tipoAnuncioId}
              onChange={(e) => {
                const val = e.target.value;
                const selected = tipos.find((t) => String(t.id) === String(val));
                const nextCode = normalizeCode(selected?.codigo);

                setForm((p) => ({
                  ...p,
                  tipoAnuncioId: val,
                  // limpiamos campos no usados
                  texto: nextCode === "VIDEO" ? "" : p.texto,
                  imagenUrl: nextCode === "IMAGEN_TEXTO" ? p.imagenUrl : "",
                  videoUrl: nextCode === "VIDEO" ? p.videoUrl : "",
                }));
              }}
              disabled={loadingTipos}
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
                placeholder="Escribí tu publicidad..."
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

              {!!form.imagenUrl.trim() && (
                <div className="mt-2">
                  <img
                    src={form.imagenUrl}
                    alt="preview"
                    className="rounded-3 border"
                    style={{ width: "100%", maxHeight: 260, objectFit: "cover" }}
                    onError={(e) => (e.currentTarget.style.display = "none")}
                  />
                </div>
              )}
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
                placeholder="Pegá un link de YouTube o un .mp4 directo"
              />

              {!!form.videoUrl.trim() && (
                <div className="mt-2">
                  {isYouTubeUrl(form.videoUrl) ? (
                    ytEmbed ? (
                      <div className="ratio ratio-16x9">
                        <iframe
                          src={`${ytEmbed}?origin=${encodeURIComponent(window.location.origin)}&rel=0`}
                          title="YouTube preview"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                          allowFullScreen
                          referrerPolicy="strict-origin-when-cross-origin"
                          style={{ border: 0 }}
                        />
                      </div>
                    ) : (
                      <div className="alert alert-warning mb-0">
                        Link de YouTube inválido (no pude generar embed).
                      </div>
                    )
                  ) : looksLikeDirectVideoFile(form.videoUrl) ? (
                    <video
                      src={form.videoUrl}
                      controls
                      className="rounded-3 border"
                      style={{ width: "100%", maxHeight: 280 }}
                    />
                  ) : (
                    <div className="alert alert-warning mb-0">
                      Para previsualizar con &lt;video&gt; necesitás un link directo a archivo (.mp4/.webm/.ogg).
                      Si es YouTube, se mostrará como embed.
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* URL DESTINO */}
          <div className="col-12">
            <label className="form-label">URL destino (opcional)</label>
            <input
              className="form-control"
              value={form.urlDestino}
              onChange={(e) => setField("urlDestino", e.target.value)}
              placeholder="https://..."
            />
          </div>

          {/* BOTONES */}
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
                  Crear anuncio
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