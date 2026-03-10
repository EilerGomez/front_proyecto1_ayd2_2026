// src/pages/suscriptor/RevistaEdicionesSuscriptorPage.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getUser } from "../../auth/authService";

import { getRevistaById } from "../../services/revistas.service";
import { getEdicionesByRevistaId } from "../../services/ediciones.service";

import { existsLike, darLike, quitarLike, getLikesByRevistaId } from "../../services/likes.service";
import { getComentariosByRevistaId, createComentario, deleteComentario } from "../../services/comentarios.service";
import {
    suscribirse,
    cancelarSuscripcion,
    getSuscripcionesByUsuarioId,
    getSuscripcionesByRevistaId,
} from "../../services/suscripciones.service";

import { getAnunciosByEstado } from "../../services/anuncios.service";
import { getBloqueoActivoByRevistaId } from "../../services/bloqueosAnuncios.service";
import { registrarImpresion } from "../../services/impresionesAnuncios.service";
/* ================== CONFIG ================== */
const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8080";

/* ---------------- helpers ---------------- */

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

function resolveMediaUrl(url) {
    if (!url) return "";
    if (/^https?:\/\//i.test(url)) return url;
    return `${API_BASE_URL}${url.startsWith("/") ? "" : "/"}${url}`;
}

function isDirectVideoUrl(url) {
    const u = String(url || "").toLowerCase();
    return u.endsWith(".mp4") || u.endsWith(".webm") || u.endsWith(".ogg");
}

function isSocialUrl(u) {
    const url = String(u || "").toLowerCase();
    return (
        url.includes("youtube.com") ||
        url.includes("youtu.be") ||
        url.includes("facebook.com") ||
        url.includes("fb.watch") ||
        url.includes("instagram.com") ||
        url.includes("tiktok.com")
    );
}

function extractYouTubeId(u) {
    try {
        const url = new URL(u);

        if (url.hostname === "youtu.be") {
            return url.pathname.slice(1).trim();
        }

        if (
            url.hostname === "www.youtube.com" ||
            url.hostname === "youtube.com" ||
            url.hostname === "m.youtube.com"
        ) {
            if (url.pathname === "/watch") {
                return url.searchParams.get("v");
            }

            if (url.pathname.startsWith("/embed/")) {
                return url.pathname.split("/embed/")[1]?.split("/")[0]?.split("?")[0] || null;
            }

            if (url.pathname.startsWith("/shorts/")) {
                return url.pathname.split("/shorts/")[1]?.split("/")[0]?.split("?")[0] || null;
            }
        }
    } catch (e) {
        console.log(e);
    }

    return null;
}

function buildEmbedUrl(originalUrl) {
    const url = String(originalUrl || "").trim();
    if (!url) return "";

    const yid = extractYouTubeId(url);
    if (yid) {
        return `https://www.youtube.com/embed/${yid}?autoplay=1&mute=1&controls=0&rel=0&modestbranding=1&loop=1&playlist=${yid}&origin=${encodeURIComponent(window.location.origin)}`;
    }

    if (url.includes("facebook.com") || url.includes("fb.watch")) {
        return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}&show_text=0&autoplay=1&mute=1`;
    }

    if (url.includes("instagram.com")) {
        const clean = url.split("?")[0].replace(/\/$/, "");
        return `${clean}/embed`;
    }

    if (url.includes("tiktok.com")) {
        return `${url.split("?")[0]}?is_copy_url=1&is_from_webapp=v1`;
    }

    return url;
}

/* ---------------- TAGS / ETIQUETAS ---------------- */
function getRevistaTags(r) {
    const arr = r?.etiquetas ?? r?.tags ?? r?.palabrasClave ?? r?.keywords ?? [];
    if (!Array.isArray(arr)) return [];
    return arr
        .map((x) => (typeof x === "string" ? x : x?.nombre ?? x?.tag ?? x?.codigo ?? ""))
        .map((s) => String(s || "").trim())
        .filter(Boolean);
}

/* ---------------- UI helpers ---------------- */

function Avatar({ url, name = "Usuario", size = 40, onClick }) {
    const [ok, setOk] = useState(true);

    if (!url || !ok) {
        return (
            <button
                type="button"
                className="rounded-circle bg-light border d-inline-flex align-items-center justify-content-center"
                style={{ width: size, height: size, cursor: onClick ? "pointer" : "default" }}
                title={name}
                onClick={onClick}
            >
                <i className="bi bi-person-circle fs-5 text-muted"></i>
            </button>
        );
    }

    return (
        <img
            src={url}
            alt={name}
            className="rounded-circle border"
            style={{ width: size, height: size, objectFit: "cover", cursor: onClick ? "pointer" : "default" }}
            onError={() => setOk(false)}
            onClick={onClick}
            title={name}
        />
    );
}

/* ---------------- ADS NORMALIZATION ---------------- */
function normalizeAd(raw) {
    const tipo = (raw?.tipoAnuncio?.codigo ?? "").toString().toUpperCase(); // TEXTO | IMAGEN_TEXTO | VIDEO
    const texto = raw?.texto ?? "";
    const imagenUrl = resolveMediaUrl(raw?.imagenUrl ?? "");
    const videoUrl = resolveMediaUrl(raw?.videoUrl ?? "");
    const urlDestino = raw?.urlDestino ?? "";

    let mediaUrl = "";
    if (tipo === "IMAGEN_TEXTO") mediaUrl = imagenUrl;
    if (tipo === "VIDEO") mediaUrl = videoUrl;

    let finalTipo = tipo;
    if (!finalTipo) {
        if (videoUrl) finalTipo = "VIDEO";
        else if (imagenUrl && texto) finalTipo = "IMAGEN_TEXTO";
        else finalTipo = "TEXTO";
    }

    return {
        id: raw?.id ?? `${finalTipo}-${imagenUrl}-${videoUrl}-${texto}`,
        tipo: finalTipo || "TEXTO",
        texto,
        mediaUrl,
        urlDestino,
    };
}


function AdsPanel({ title = "Publicidad", current, idxLabel, onNext, onRefresh, height = 360 }) {
    const [imgOk, setImgOk] = useState(true);
    useEffect(() => setImgOk(true), [current?.id]);

    const tipo = current?.tipo;
    const texto = current?.texto ?? "";
    const mediaUrl = current?.mediaUrl ?? "";
    const destino = current?.urlDestino;

    const isSocial = isSocialUrl(mediaUrl);
    const embedUrl = isSocial ? buildEmbedUrl(mediaUrl) : "";

    function goDestino() {
        if (!destino) return;
        window.open(destino, "_blank", "noopener,noreferrer");
    }

    // Por si algún navegador pausa por alguna razón
    function forcePlay(e) {
        try {
            const v = e?.currentTarget;
            if (v && v.paused) v.play().catch(() => { });
        } catch (e) { console.log(e) }
    }

    return (
        <div className="card shadow-sm h-100 w-100">
            <div className="card-header bg-white d-flex align-items-center justify-content-between py-2">
                <div className="fw-semibold small">
                    <i className="bi bi-megaphone me-2"></i>
                    {title}
                </div>
                <span className="text-muted small">{idxLabel ?? "—"}</span>
            </div>

            {/* 👇 click en TODO el body del anuncio */}
            <div
                className="card-body p-0 position-relative"
                style={{ height, overflow: "hidden", cursor: destino ? "pointer" : "default" }}
                role={destino ? "button" : undefined}
                tabIndex={destino ? 0 : undefined}
                onClick={destino ? goDestino : undefined}
                onKeyDown={(e) => {
                    if (!destino) return;
                    if (e.key === "Enter" || e.key === " ") goDestino();
                }}
                title={destino ? "Ir al anuncio" : undefined}
            >
                {!current ? (
                    <div className="p-3 text-muted small">Sin anuncios activos.</div>
                ) : (
                    <div className="h-100 w-100 position-relative">
                        {tipo === "TEXTO" && (
                            <div className="h-100 d-flex flex-column justify-content-center p-4">
                                <div className="fw-semibold">Anuncio</div>
                                <div className="text-muted mt-2" style={{ whiteSpace: "pre-wrap" }}>
                                    {texto || "—"}
                                </div>
                            </div>
                        )}

                        {tipo === "IMAGEN_TEXTO" && (
                            <div className="h-100 d-flex flex-column">

                                {/* TEXTO ARRIBA */}
                                <div className="p-3 border-bottom">
                                    <div className="fw-semibold">Anuncio</div>
                                    <div className="text-muted mt-1" style={{ whiteSpace: "pre-wrap" }}>
                                        {texto || "—"}
                                    </div>
                                </div>

                                {/* IMAGEN ABAJO */}
                                <div className="flex-grow-1">
                                    {mediaUrl && imgOk ? (
                                        <img
                                            src={mediaUrl}
                                            alt="Anuncio"
                                            style={{
                                                width: "100%",
                                                height: "100%",
                                                objectFit: "cover"
                                            }}
                                            onError={() => setImgOk(false)}
                                        />
                                    ) : (
                                        <div className="h-100 d-flex align-items-center justify-content-center text-muted">
                                            Sin imagen
                                        </div>
                                    )}
                                </div>

                            </div>
                        )}

                        {tipo === "VIDEO" && (
                            <div className="h-100 w-100 position-relative">
                                {isDirectVideoUrl(mediaUrl) ? (
                                    <video
                                        key={mediaUrl}
                                        src={mediaUrl}
                                        muted
                                        playsInline
                                        autoPlay
                                        loop
                                        controls={false}
                                        disablePictureInPicture
                                        controlsList="nodownload noplaybackrate noremoteplayback"
                                        style={{
                                            width: "100%",
                                            height: "100%",
                                            objectFit: "cover",
                                            pointerEvents: "none",
                                        }}
                                        onPause={forcePlay}
                                    />
                                ) : (
                                    <iframe
                                        key={embedUrl || mediaUrl}
                                        src={embedUrl || mediaUrl}
                                        title="Video anuncio"
                                        style={{
                                            width: "100%",
                                            height: "100%",
                                            border: 0,
                                            pointerEvents: "none",
                                        }}
                                        allow="autoplay; encrypted-media; picture-in-picture; web-share"
                                        allowFullScreen
                                        referrerPolicy="strict-origin-when-cross-origin"
                                    />
                                )}
                            </div>
                        )}

                        {/* Botón Ir opcional (sigue sirviendo) */}
                        {destino ? (
                            <div className="position-absolute bottom-0 start-0 end-0 p-3" style={{ pointerEvents: "none" }}>
                                <div className="d-flex justify-content-end">
                                    <button
                                        type="button"
                                        className="btn btn-primary btn-sm"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            goDestino();
                                        }}
                                        style={{ pointerEvents: "auto" }}
                                    >
                                        Ir <i className="bi bi-box-arrow-up-right ms-1"></i>
                                    </button>
                                </div>
                            </div>
                        ) : null}
                    </div>
                )}
            </div>

            <div className="card-footer bg-white py-2 d-flex justify-content-between align-items-center">
                <button className="btn btn-sm btn-light border" onClick={onNext} disabled={!current}>
                    <i className="bi bi-skip-forward"></i>
                </button>
                <span className="text-muted small">Anuncios activos</span>
                <button className="btn btn-sm btn-light border" onClick={onRefresh}>
                    <i className="bi bi-arrow-clockwise"></i>
                </button>
            </div>
        </div>
    );
}

/* ---------------- PAGE ---------------- */

export default function RevistaEdicionesSuscriptorPage() {
    const { id } = useParams();
    const revistaId = Number(id);

    const user = getUser();
    const usuarioId = user?.id;

    const navigate = useNavigate();

    const [revista, setRevista] = useState(null);
    const [ediciones, setEdiciones] = useState([]);

    const [loading, setLoading] = useState(true);
    const [msg, setMsg] = useState({ type: "", text: "" });

    const [sub, setSub] = useState({ subscribed: false, suscripcionId: null });
    const [subBusy, setSubBusy] = useState(false);

    const [likedByMe, setLikedByMe] = useState(false);
    const [likeBusy, setLikeBusy] = useState(false);

    const [panelOpen, setPanelOpen] = useState(false);
    const [panelTab, setPanelTab] = useState("comentarios");

    const [panelLoading, setPanelLoading] = useState(false);
    const [panelComentarios, setPanelComentarios] = useState([]);
    const [panelLikes, setPanelLikes] = useState([]);
    const [panelSuscriptores, setPanelSuscriptores] = useState([]);

    const [nuevoComentario, setNuevoComentario] = useState("");
    const [commentBusy, setCommentBusy] = useState(false);

    const [adsBlocked, setAdsBlocked] = useState(false);

    const [ads, setAds] = useState([]);
    const [adsLoading, setAdsLoading] = useState(false);

    const [adIndex, setAdIndex] = useState(0);
    const adTimerRef = useRef(null);

    const normalizedAds = useMemo(() => (ads ?? []).map(normalizeAd), [ads]);
    const currentAd = normalizedAds.length ? normalizedAds[adIndex % normalizedAds.length] : null;
    const idxLabel = normalizedAds.length ? `${(adIndex % normalizedAds.length) + 1}/${normalizedAds.length}` : "—";

    useEffect(() => {
        if (adsBlocked) return;
        if (!revistaId) return;
        if (!currentAd?.id) return;

        const urlPagina = window.location.pathname; // solo /app/...
        const anuncioIdNum = Number(currentAd.id);
        if (!Number.isFinite(anuncioIdNum)) return;

        registrarImpresion({
            anuncioId: anuncioIdNum,
            revistaId: Number(revistaId),
            urlPagina,
        }).catch((e) => {
            // no frenamos la UI si falla
            console.log("No se pudo registrar impresión:", e);
        });
    }, [currentAd?.id, revistaId, adsBlocked]);


    const tags = useMemo(() => getRevistaTags(revista), [revista]);

    function nextAd() {
        if (!normalizedAds.length) return;
        setAdIndex((p) => (p + 1) % normalizedAds.length);
    }

    async function loadAds() {
        if (adsBlocked) {
            setAds([]);
            setAdIndex(0);
            return;
        }

        setAdsLoading(true);
        try {
            const data = await getAnunciosByEstado("ACTIVO");
            setAds(data ?? []);
            setAdIndex(0);
        } catch (e) {
            console.log("No se pudieron cargar anuncios:", e);
            setAds([]);
            setAdIndex(0);
        } finally {
            setAdsLoading(false);
        }
    }
    const AD_MS = 12000;
    useEffect(() => {
        clearInterval(adTimerRef.current);
        if (!normalizedAds.length || adsBlocked) return;

        adTimerRef.current = setInterval(() => {
            setAdIndex((p) => {
                const last = normalizedAds.length - 1;

                // si ya se mostró el último, recargar anuncios random y reiniciar
                if (p >= last) {
                    loadAds();
                    return 0;
                }

                return p + 1;
            });
        }, AD_MS);

        return () => clearInterval(adTimerRef.current);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [normalizedAds.length, adsBlocked]);

    async function loadPanelData() {
        if (!revistaId) return;
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

    async function loadAll() {
        setLoading(true);
        setMsg({ type: "", text: "" });

        try {
            if (!usuarioId || !revistaId) return;

            const [r, eds] = await Promise.all([getRevistaById(revistaId), getEdicionesByRevistaId(revistaId)]);
            setRevista(r);
            setEdiciones(eds ?? []);

            try {
                const subs = await getSuscripcionesByUsuarioId(usuarioId);
                const found = (subs ?? []).find((s) => s?.revista?.id === revistaId);
                setSub({ subscribed: !!found?.activa, suscripcionId: found?.id ?? null });
            } catch (e) {
                console.log("No se pudieron cargar suscripciones:", e);
                setSub({ subscribed: false, suscripcionId: null });
            }

            try {
                const permiteLikes = !!r?.permiteLikes;
                if (permiteLikes) {
                    const ex = await existsLike(revistaId, usuarioId);
                    setLikedByMe(!!ex);
                } else {
                    setLikedByMe(false);
                }
            } catch {
                setLikedByMe(false);
            }

            try {
                const b = await getBloqueoActivoByRevistaId(revistaId);
                setAdsBlocked(!!b);
            } catch {
                setAdsBlocked(false);
            }
        } catch (e) {
            console.log(e);
            setMsg({ type: "danger", text: "No se pudo cargar la revista/ediciones." });
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        if (!revistaId || !usuarioId) return;
        loadAll();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [revistaId, usuarioId]);

    useEffect(() => {
        loadAds();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [adsBlocked, revistaId]);

    function goPerfil(uid) {
        if (!uid) return;
        navigate(`/app/suscriptor/perfil/${uid}`);
    }

    async function toggleLike() {
        if (!revista) return;
        if (!revista?.permiteLikes) {
            alert("Esta revista tiene los likes deshabilitados.");
            return;
        }

        setLikeBusy(true);
        try {
            if (likedByMe) {
                await quitarLike(revistaId, usuarioId);
                setLikedByMe(false);
                setRevista((p) => (p ? { ...p, cantidadLikes: Math.max(0, (p.cantidadLikes ?? 0) - 1) } : p));
            } else {
                await darLike({ revistaId, usuarioId });
                setLikedByMe(true);
                setRevista((p) => (p ? { ...p, cantidadLikes: (p.cantidadLikes ?? 0) + 1 } : p));
            }

            if (panelOpen) await loadPanelData();
        } catch (e) {
            console.log(e);
            alert("No se pudo procesar el like.");
        } finally {
            setLikeBusy(false);
        }
    }

    async function toggleSuscripcion() {
        if (!revista) return;
        if (!revista?.permiteSuscripciones) {
            alert("Esta revista tiene las suscripciones deshabilitadas.");
            return;
        }

        setSubBusy(true);
        try {
            if (sub.subscribed) {
                if (!sub.suscripcionId) throw new Error("No suscripcionId");
                await cancelarSuscripcion(sub.suscripcionId);
                setSub((p) => ({ ...p, subscribed: false }));
                setRevista((p) => (p ? { ...p, cantidadSuscripciones: Math.max(0, (p.cantidadSuscripciones ?? 0) - 1) } : p));
            } else {
                const resp = await suscribirse({
                    revistaId,
                    usuarioId,
                    fechaSuscripcion: todayISO(),
                    activa: true,
                });
                setSub({ subscribed: true, suscripcionId: resp?.id ?? null });
                setRevista((p) => (p ? { ...p, cantidadSuscripciones: (p.cantidadSuscripciones ?? 0) + 1 } : p));
            }

            if (panelOpen) await loadPanelData();
        } catch (e) {
            console.log(e);
            alert("No se pudo procesar la suscripción.");
        } finally {
            setSubBusy(false);
        }
    }

    async function crearComentario() {
        if (!revista) return;
        if (!revista?.permiteComentarios) {
            alert("Esta revista tiene comentarios deshabilitados.");
            return;
        }
        if (!sub.subscribed) {
            alert("Tenés que estar suscrito para comentar.");
            return;
        }

        const contenido = (nuevoComentario ?? "").trim();
        if (!contenido) return;

        setCommentBusy(true);
        try {
            await createComentario({ revistaId, usuarioId, contenido });
            setNuevoComentario("");
            await loadPanelData();
            setRevista((p) => (p ? { ...p, cantidadComentarios: (p.cantidadComentarios ?? 0) + 1 } : p));
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
            await loadPanelData();
            setRevista((p) => (p ? { ...p, cantidadComentarios: Math.max(0, (p.cantidadComentarios ?? 0) - 1) } : p));
        } catch (e) {
            console.log(e);
            alert("No se pudo eliminar el comentario.");
        }
    }

    async function openPanel(tab = "comentarios") {
        setPanelTab(tab);
        setPanelOpen(true);
        await loadPanelData();
    }

    function closePanel() {
        setPanelOpen(false);
        setPanelComentarios([]);
        setPanelLikes([]);
        setPanelSuscriptores([]);
        setNuevoComentario("");
    }

    if (loading) {
        return (
            <div className="alert alert-info d-flex align-items-center gap-2">
                <div className="spinner-border spinner-border-sm" />
                <span>Cargando...</span>
            </div>
        );
    }

    const editorId = revista?.editor?.id;
    const canSee = !!sub.subscribed;

    return (
        <div className="container-fluid p-0" style={{ maxWidth: 1600 }}>
            <div className="d-flex flex-column" style={{ height: "100vh", overflow: "hidden", padding: 16 }}>
                {/* header */}
                <div className="d-flex align-items-center justify-content-between mb-3">
                    <div>
                        <h1 className="h5 mb-0">Revista</h1>
                        <div className="text-muted small">
                            {revista?.titulo ?? `#${revistaId}`} •{" "}
                            {adsBlocked ? (
                                <span className="badge text-bg-dark">
                                    <i className="bi bi-shield-lock me-1"></i>Sin anuncios
                                </span>
                            ) : (
                                <span className="badge text-bg-light border">
                                    <i className="bi bi-megaphone me-1"></i>Con anuncios
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="d-flex gap-2">
                        <button className="btn btn-outline-secondary" onClick={() => navigate(-1)}>
                            <i className="bi bi-arrow-left me-1"></i>Volver
                        </button>

                        <button
                            className="btn btn-outline-secondary"
                            onClick={() => {
                                loadAll();
                                loadAds();
                            }}
                            disabled={loading}
                        >
                            <i className="bi bi-arrow-clockwise me-1"></i>Refrescar
                        </button>
                    </div>
                </div>

                {msg.text && <div className={`alert alert-${msg.type}`}>{msg.text}</div>}

                {/* body */}
                <div className="row g-3 flex-grow-1" style={{ minHeight: 0 }}>
                    {/* left */}
                    <div className="col-12 col-lg-3 d-none d-lg-flex" style={{ minHeight: 0 }}>
                        {adsBlocked ? (
                            <div className="w-100 h-100" />
                        ) : adsLoading ? (
                            <div className="card shadow-sm h-100 w-100">
                                <div className="card-body text-muted small">
                                    <span className="spinner-border spinner-border-sm me-2" />
                                    Cargando anuncios...
                                </div>
                            </div>
                        ) : (
                            <AdsPanel
                                title="Publicidad"
                                current={currentAd}
                                idxLabel={idxLabel}
                                onNext={nextAd}
                                onRefresh={loadAds}
                                height={360}
                            />
                        )}
                    </div>

                    {/* center scroll  ✅ más largo (más alto) */}
                    <div className="col-12 col-lg-6 d-flex" style={{ minHeight: 0 }}>
                        <div
                            className="border rounded-3 bg-white shadow-sm w-100"
                            style={{
                                maxHeight: "calc(100vh - 130px)",
                                overflowY: "auto",
                                padding: 12,
                            }}
                        >
                            {/* acceso */}
                            {!canSee && (
                                <div className="alert alert-warning">
                                    Tenés que estar <b>suscrito</b> a esta revista para ver sus ediciones.
                                    <div className="mt-2 d-flex gap-2">
                                        <button
                                            className="btn btn-success btn-sm"
                                            onClick={toggleSuscripcion}
                                            disabled={subBusy || !revista?.permiteSuscripciones}
                                        >
                                            {subBusy ? "Procesando..." : "Suscribirme"}
                                        </button>
                                        <button className="btn btn-outline-secondary btn-sm" onClick={() => navigate(-1)}>
                                            Volver
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* info revista */}
                            <div className="card shadow-sm mb-3">
                                <div className="card-body">
                                    <div className="d-flex align-items-start justify-content-between gap-2">
                                        <div className="d-flex align-items-center gap-2">
                                            <Avatar
                                                url={revista?.editor?.perfilUrl}
                                                name={`${revista?.editor?.nombre ?? "Editor"} ${revista?.editor?.apellido ?? ""}`.trim()}
                                                size={44}
                                                onClick={() => goPerfil(revista?.editor?.id)}
                                            />

                                            <div>
                                                {/* ✅ TÍTULO ARRIBA de la descripción (más evidente) */}
                                                <div className="h5 mb-1">{revista?.titulo ?? `Revista #${revistaId}`}</div>

                                                <div className="text-muted small">
                                                    Editor:{" "}
                                                    <button
                                                        type="button"
                                                        className="btn btn-link p-0 text-decoration-none"
                                                        onClick={() => goPerfil(revista?.editor?.id)}
                                                    >
                                                        {`${revista?.editor?.nombre ?? "Editor"} ${revista?.editor?.apellido ?? ""}`.trim()}
                                                    </button>{" "}
                                                    • @{revista?.editor?.username ?? "editor"}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="d-flex flex-column align-items-end gap-2">
                                            <span className={"badge " + (sub.subscribed ? "text-bg-success" : "text-bg-secondary")}>
                                                <i className={"bi " + (sub.subscribed ? "bi-person-check-fill" : "bi-person-plus") + " me-1"} />
                                                {sub.subscribed ? "SUSCRITO" : "NO SUSCRITO"}
                                            </span>

                                            {revista?.permiteSuscripciones && (
                                                <button
                                                    className={"btn btn-sm " + (sub.subscribed ? "btn-outline-success" : "btn-success")}
                                                    onClick={toggleSuscripcion}
                                                    disabled={subBusy}
                                                >
                                                    {subBusy ? "Procesando..." : sub.subscribed ? "Cancelar" : "Suscribirme"}
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    <div className="mt-3 text-muted" style={{ whiteSpace: "pre-wrap" }}>
                                        {revista?.descripcion || "—"}
                                    </div>

                                    {/* etiquetas */}
                                    {tags.length > 0 && (
                                        <div className="mt-3 d-flex flex-wrap gap-2">
                                            {tags.map((t) => (
                                                <span key={t} className="badge text-bg-light border">
                                                    <i className="bi bi-tag me-1"></i>
                                                    {t}
                                                </span>
                                            ))}
                                        </div>
                                    )}

                                    <div className="mt-3 d-flex flex-wrap gap-2">
                                        <button
                                            className={"btn btn-sm " + (likedByMe ? "btn-danger" : "btn-outline-danger")}
                                            onClick={toggleLike}
                                            disabled={likeBusy || !revista?.permiteLikes}
                                            title={!revista?.permiteLikes ? "Likes deshabilitados" : likedByMe ? "Quitar like" : "Dar like"}
                                            style={!revista?.permiteLikes ? { opacity: 0.6 } : undefined}
                                        >
                                            <i className={"bi " + (likedByMe ? "bi-heart-fill" : "bi-heart") + " me-1"} />
                                            {revista?.cantidadLikes ?? 0}
                                        </button>

                                        <button
                                            className="btn btn-sm btn-outline-secondary"
                                            onClick={() => openPanel("comentarios")}
                                            disabled={!revista?.permiteComentarios}
                                            style={!revista?.permiteComentarios ? { opacity: 0.6 } : undefined}
                                            title={!revista?.permiteComentarios ? "Comentarios deshabilitados" : "Ver comentarios"}
                                        >
                                            <i className="bi bi-chat-left-text me-1" />
                                            {revista?.cantidadComentarios ?? 0}
                                        </button>

                                        <button className="btn btn-sm btn-outline-dark" onClick={() => openPanel("suscriptores")}>
                                            <i className="bi bi-people me-1" />
                                            {revista?.cantidadSuscripciones ?? 0}
                                        </button>

                                        <button className="btn btn-sm btn-outline-primary ms-auto" onClick={() => openPanel("likes")}>
                                            <i className="bi bi-activity me-1"></i>Actividad
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* ediciones */}
                            {canSee ? (
                                ediciones.length === 0 ? (
                                    <div className="alert alert-secondary">No hay ediciones todavía.</div>
                                ) : (
                                    <div className="d-flex flex-column gap-3">
                                        {ediciones.map((e) => (
                                            <div key={e.id} className="card shadow-sm">
                                                <div className="card-body">
                                                    <div className="d-flex align-items-center gap-2 flex-wrap">
                                                        <div className="fw-semibold">{e.titulo}</div>

                                                        <span className="badge text-bg-light border">
                                                            <i className="bi bi-hash me-1"></i>ID: {e.id}
                                                        </span>

                                                        {e.numeroEdicion ? (
                                                            <span className="badge text-bg-primary">
                                                                <i className="bi bi-journal-text me-1"></i>No. {e.numeroEdicion}
                                                            </span>
                                                        ) : null}

                                                        {e.fechaPublicacion ? (
                                                            <span className="badge text-bg-light border">
                                                                <i className="bi bi-calendar-event me-1"></i>
                                                                {formatDateTime(e.fechaPublicacion)}
                                                            </span>
                                                        ) : null}
                                                    </div>

                                                    <div className="mt-3">
                                                        {e.pdfUrl ? (
                                                            <>
                                                                <div
                                                                    className="border rounded overflow-hidden"
                                                                    style={{ width: "100%", height: "700px" }}
                                                                >
                                                                    <iframe
                                                                        src={e.pdfUrl}
                                                                        title={`PDF ${e.titulo}`}
                                                                        style={{ width: "100%", height: "100%", border: 0 }}
                                                                        loading="lazy"
                                                                    />
                                                                </div>
{/* Este es un comentario dentro de JSX 
                                                                <div className="mt-2">
                                                                    <a href={e.pdfUrl} target="_blank" rel="noreferrer">
                                                                        Abrir en nueva pestaña <i className="bi bi-box-arrow-up-right ms-1"></i>
                                                                    </a>
                                                                </div>
*/}
                                                            </>
                                                        ) : (
                                                            <div className="text-muted">Sin PDF.</div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )
                            ) : null}
                        </div>
                    </div>

                    {/* right */}
                    <div className="col-12 col-lg-3 d-none d-lg-flex" style={{ minHeight: 0 }}>
                        {adsBlocked ? (
                            <div className="w-100 h-100" />
                        ) : adsLoading ? (
                            <div className="card shadow-sm h-100 w-100">
                                <div className="card-body text-muted small">
                                    <span className="spinner-border spinner-border-sm me-2" />
                                    Cargando anuncios...
                                </div>
                            </div>
                        ) : (
                            <AdsPanel
                                title="Publicidad"
                                current={currentAd}
                                idxLabel={idxLabel}
                                onNext={nextAd}
                                onRefresh={loadAds}
                                height={360}
                            />
                        )}
                    </div>
                </div>

                {/* OFFCANVAS (actividad) */}
                {panelOpen && (
                    <>
                        <div className="offcanvas-backdrop fade show" onClick={closePanel} style={{ cursor: "pointer", zIndex: 1040 }} />

                        <div
                            className="offcanvas offcanvas-end show"
                            tabIndex="-1"
                            style={{ visibility: "visible", width: "420px", background: "white", zIndex: 1050 }}
                        >
                            <div className="offcanvas-header border-bottom">
                                <div>
                                    <div className="fw-semibold">Actividad</div>
                                    <div className="text-muted small">
                                        {revista?.titulo ?? "Revista"} • #{revistaId}
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
                                        {!revista?.permiteComentarios && <div className="alert alert-warning">Esta revista tiene comentarios deshabilitados.</div>}

                                        {revista?.permiteComentarios && (
                                            <>
                                                {!sub.subscribed && (
                                                    <div className="alert alert-warning">
                                                        Para comentar necesitás estar suscrito. Igual podés ver los comentarios.
                                                    </div>
                                                )}

                                                <div className="mb-3">
                                                    <label className="form-label mb-1">Escribir comentario</label>
                                                    <textarea
                                                        className="form-control"
                                                        rows={3}
                                                        value={nuevoComentario}
                                                        onChange={(e) => setNuevoComentario(e.target.value)}
                                                        placeholder={sub.subscribed ? "Escribí algo..." : "Suscribite para poder comentar"}
                                                        disabled={!sub.subscribed}
                                                    />

                                                    <button
                                                        className="btn btn-primary w-100 mt-2"
                                                        onClick={crearComentario}
                                                        disabled={commentBusy || !nuevoComentario.trim() || !sub.subscribed || !revista?.permiteComentarios}
                                                    >
                                                        {commentBusy ? "Publicando..." : "Publicar comentario"}
                                                    </button>
                                                </div>
                                            </>
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
                                                    const u = c.usuario;
                                                    const name = `${u?.nombre ?? "Usuario"} ${u?.apellido ?? ""}`.trim();
                                                    const isMine = u?.id === usuarioId;
                                                    const isAutor = u?.id === editorId;

                                                    return (
                                                        <div key={c.id} className="border rounded-3 p-2">
                                                            <div className="d-flex align-items-start gap-2">
                                                                <Avatar url={u?.perfilUrl} name={name} size={34} onClick={() => goPerfil(u?.id)} />
                                                                <div className="flex-grow-1">
                                                                    <div className="d-flex justify-content-between gap-2">
                                                                        <div>
                                                                            <button
                                                                                type="button"
                                                                                className="btn btn-link p-0 fw-semibold text-decoration-none d-inline-flex align-items-center gap-1"
                                                                                onClick={() => goPerfil(u?.id)}
                                                                            >
                                                                                {name}
                                                                                {isAutor && (
                                                                                    <span className="badge bg-warning text-dark" title="Autor">
                                                                                        <i className="bi bi-mic-fill"></i> Autor
                                                                                    </span>
                                                                                )}
                                                                            </button>
                                                                            <div className="text-muted small">{formatDateTime(c.fechaCreacion)}</div>
                                                                        </div>

                                                                        {isMine && (
                                                                            <button className="btn btn-sm btn-outline-danger" onClick={() => eliminarComentario(c)} title="Eliminar">
                                                                                <i className="bi bi-trash" />
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
                                        {!revista?.permiteLikes && <div className="alert alert-warning">Esta revista tiene likes deshabilitados.</div>}

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
                                                    const isAutor = u?.id === editorId;

                                                    return (
                                                        <div key={l.id} className="d-flex align-items-center gap-2 border rounded-3 p-2">
                                                            <Avatar url={u?.perfilUrl} name={name} size={34} onClick={() => goPerfil(u?.id)} />
                                                            <div className="flex-grow-1">
                                                                <button
                                                                    type="button"
                                                                    className="btn btn-link p-0 fw-semibold text-decoration-none d-inline-flex align-items-center gap-1"
                                                                    onClick={() => goPerfil(u?.id)}
                                                                >
                                                                    {name}
                                                                    {isAutor && (
                                                                        <span className="badge bg-warning text-dark" title="Autor">
                                                                            <i className="bi bi-mic-fill"></i> Autor
                                                                        </span>
                                                                    )}
                                                                </button>
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
                                        {!revista?.permiteSuscripciones && (
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
                                                    const isAutor = u?.id === editorId;

                                                    return (
                                                        <div key={s.id} className="d-flex align-items-center gap-2 border rounded-3 p-2">
                                                            <Avatar url={u?.perfilUrl} name={name} size={34} onClick={() => goPerfil(u?.id)} />
                                                            <div className="flex-grow-1">
                                                                <button
                                                                    type="button"
                                                                    className="btn btn-link p-0 fw-semibold text-decoration-none d-inline-flex align-items-center gap-1"
                                                                    onClick={() => goPerfil(u?.id)}
                                                                >
                                                                    {name}
                                                                    {isAutor && (
                                                                        <span className="badge bg-warning text-dark" title="Autor">
                                                                            <i className="bi bi-mic-fill"></i>
                                                                        </span>
                                                                    )}
                                                                </button>
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
        </div>
    );
}