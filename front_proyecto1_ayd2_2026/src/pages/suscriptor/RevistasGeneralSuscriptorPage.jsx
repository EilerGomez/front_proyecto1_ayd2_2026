// src/pages/suscriptor/RevistasGeneralSuscriptorPage.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getUser } from "../../auth/authService";

import { getRevistasActivas } from "../../services/revistas.service";
import { existsLike, darLike, quitarLike, getLikesByRevistaId } from "../../services/likes.service";
import { getComentariosByRevistaId, createComentario, deleteComentario } from "../../services/comentarios.service";
import {
    suscribirse,
    cancelarSuscripcion,
    getSuscripcionesByUsuarioId,
    getSuscripcionesByRevistaId,
} from "../../services/suscripciones.service";
import { getAnunciosByEstado } from "../../services/anuncios.service";

/* ================== CONFIG ================== */
const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8080";

/* ---------------- helpers ---------------- */

function badgeColorByCategoria(nombre) {
    if (!nombre) return "secondary";
    const n = nombre.toLowerCase();
    if (n.includes("tecn")) return "primary";
    if (n.includes("música") || n.includes("musica")) return "success";
    if (n.includes("auto")) return "warning";
    return "info";
}

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

function isDirectVideoUrl(url) {
    const u = String(url || "").toLowerCase();
    return u.endsWith(".mp4") || u.endsWith(".webm") || u.endsWith(".ogg");
}

function isImageUrl(url) {
    const u = String(url || "").toLowerCase();
    return u.endsWith(".png") || u.endsWith(".jpg") || u.endsWith(".jpeg") || u.endsWith(".webp") || u.endsWith(".gif");
}

function resolveMediaUrl(url) {
    if (!url) return "";
    if (/^https?:\/\//i.test(url)) return url; // absoluta
    return `${API_BASE_URL}${url.startsWith("/") ? "" : "/"}${url}`; // relativa -> backend
}

/* ---------------- VIDEO EMBEDS (YouTube / FB / IG / TikTok) ---------------- */

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

/* ---------------- ADS NORMALIZATION (DTO REAL) ---------------- */
/**
 * Tu DTO:
 * {
 *   id, texto, imagenUrl, videoUrl, urlDestino, estado, fechaCreacion,
 *   anunciante, tipoAnuncio:{ id, codigo, descripcion }
 * }
 *
 * Tipos esperados (según tu UI):
 * - TEXTO
 * - IMAGEN_TEXTO
 * - VIDEO
 */
function normalizeAd(raw) {
    const tipo = (raw?.tipoAnuncio?.codigo ?? "").toString().toUpperCase();
    const texto = raw?.texto ?? "";
    const imagenUrl = resolveMediaUrl(raw?.imagenUrl ?? "");
    const videoUrl = resolveMediaUrl(raw?.videoUrl ?? "");
    const urlDestino = raw?.urlDestino ?? "";

    // decide media según tipo
    let mediaUrl = "";
    if (tipo === "IMAGEN_TEXTO") mediaUrl = imagenUrl;
    if (tipo === "VIDEO") mediaUrl = videoUrl;

    // fallback si backend manda tipo vacío
    let finalTipo = tipo;
    if (!finalTipo) {
        if (videoUrl) finalTipo = "VIDEO";
        else if (imagenUrl && texto) finalTipo = "IMAGEN_TEXTO";
        else finalTipo = "TEXTO";
    }

    return {
        id: raw?.id ?? `${finalTipo}-${imagenUrl}-${videoUrl}-${texto}`,
        tipo: finalTipo,
        texto,
        mediaUrl,
        urlDestino,
    };
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

/* ---------------- ADS UI ---------------- */
/**
 * REGLAS:
 * - Debe poderse hacer click al anuncio para ir a urlDestino
 * - No pausar (sin controles + bloqueamos interacción del video/iframe)
 * - El espacio (alto) del anuncio debe ser menor
 */
function AdsPanel({ title = "Publicidad", current, idxLabel, onNext, onRefresh, height = 420 }) {
    const [imgOk, setImgOk] = useState(true);

    useEffect(() => setImgOk(true), [current?.id]);

    function goDestino() {
        if (!current?.urlDestino) return;
        window.open(current.urlDestino, "_blank", "noopener,noreferrer");
    }

    // Por si algún navegador pausa por alguna razón, intentamos reanudar
    function forcePlay(e) {
        try {
            const v = e?.currentTarget;
            if (v && v.paused) v.play().catch(() => { });
        } catch (e) { console.log(e) }
    }

    const tipo = current?.tipo;
    const texto = current?.texto ?? "";
    const mediaUrl = current?.mediaUrl ?? "";

    const isSocial = isSocialUrl(mediaUrl);
    const embedUrl = isSocial ? buildEmbedUrl(mediaUrl) : "";

    return (
        <div className="card shadow-sm h-100 w-100">
            <div className="card-header bg-white d-flex align-items-center justify-content-between py-2">
                <div className="fw-semibold small">
                    <i className="bi bi-megaphone me-2"></i>
                    {title}
                </div>
                <span className="text-muted small">{idxLabel ?? "—"}</span>
            </div>

            {/* 👇 El ALTO real del anuncio está aquí */}
            <div className="card-body p-0 position-relative" style={{ height, overflow: "hidden" }}>
                {!current ? (
                    <div className="p-3 text-muted small">Sin anuncios activos.</div>
                ) : (
                    // Click en TODO el anuncio -> ir a urlDestino
                    <div
                        className="h-100 w-100 position-relative"
                        role={current.urlDestino ? "button" : undefined}
                        onClick={current.urlDestino ? goDestino : undefined}
                        style={{ cursor: current.urlDestino ? "pointer" : "default" }}
                        title={current.urlDestino ? "Ir al anuncio" : undefined}
                    >
                        {/* TEXTO */}
                        {tipo === "TEXTO" && (
                            <div className="h-100 d-flex flex-column justify-content-center p-4">
                                <div className="fw-semibold">Anuncio</div>
                                <div className="text-muted mt-2" style={{ whiteSpace: "pre-wrap" }}>
                                    {texto || "—"}
                                </div>
                            </div>
                        )}

                        {/* IMAGEN + TEXTO */}
                        {tipo === "IMAGEN_TEXTO" && (
                            <div className="h-100 d-flex flex-column">
                                {/* TEXTO ARRIBA */}
                                <div className="p-3 border-bottom" style={{ background: "white" }}>
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
                                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
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

                        {/* VIDEO */}
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
                                            pointerEvents: "none", // bloquea pausar
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

                        {/* botón Ir (opcional, pero lo dejo porque es útil visualmente) */}
                        {current.urlDestino ? (
                            <div className="position-absolute bottom-0 start-0 end-0 p-3" style={{ pointerEvents: "none" }}>
                                <div className="d-flex justify-content-end">
                                    <button
                                        type="button"
                                        className="btn btn-primary btn-sm"
                                        onClick={(e) => {
                                            e.stopPropagation(); // para que no duplique click
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

export default function RevistasGeneralSuscriptorPage() {
    const user = getUser();
    const usuarioId = user?.id;
    const navigate = useNavigate();

    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [msg, setMsg] = useState({ type: "", text: "" });

    const [q, setQ] = useState("");
    const [categoria, setCategoria] = useState("ALL");
    const [etiqueta, setEtiqueta] = useState("ALL");
    const [soloSuscritas, setSoloSuscritas] = useState(false);

    // suscripciones: { revistaId: {subscribed, suscripcionId} }
    const [subsByMe, setSubsByMe] = useState({});
    const [subBusy, setSubBusy] = useState({});

    // likes: {revistaId: true/false}
    const [likedByMe, setLikedByMe] = useState({});
    const [likeBusy, setLikeBusy] = useState({});

    // panel actividad
    const [panelOpen, setPanelOpen] = useState(false);
    const [panelTab, setPanelTab] = useState("comentarios");
    const [panelRevista, setPanelRevista] = useState(null);

    const [panelLoading, setPanelLoading] = useState(false);
    const [panelComentarios, setPanelComentarios] = useState([]);
    const [panelLikes, setPanelLikes] = useState([]);
    const [panelSuscriptores, setPanelSuscriptores] = useState([]);

    const [nuevoComentario, setNuevoComentario] = useState("");
    const [commentBusy, setCommentBusy] = useState(false);

    // anuncios
    const [ads, setAds] = useState([]);
    const [adsLoading, setAdsLoading] = useState(false);

    // rotación compartida
    const [adIndex, setAdIndex] = useState(0);
    const adTimerRef = useRef(null);

    const normalizedAds = useMemo(() => (ads ?? []).map(normalizeAd), [ads]);
    const currentAd = normalizedAds.length ? normalizedAds[adIndex % normalizedAds.length] : null;
    const idxLabel = normalizedAds.length ? `${(adIndex % normalizedAds.length) + 1}/${normalizedAds.length}` : "—";

    function nextAd() {
        if (!normalizedAds.length) return;
        setAdIndex((p) => (p + 1) % normalizedAds.length);
    }

    async function loadAds() {
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
        if (!normalizedAds.length) return;

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
    }, [normalizedAds.length]);

    async function load() {
        setLoading(true);
        setMsg({ type: "", text: "" });

        try {
            if (!usuarioId) return;

            const data = await getRevistasActivas();
            setItems(data ?? []);

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
        loadAds();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [usuarioId]);

    const categorias = useMemo(() => {
        const set = new Set();
        (items ?? []).forEach((r) => {
            const n = r?.categoria?.nombre;
            if (n) set.add(n);
        });
        return ["ALL", ...Array.from(set)];
    }, [items]);

    const etiquetas = useMemo(() => {
        const set = new Set();

        (items ?? []).forEach((r) => {
            (r.etiquetas ?? []).forEach((e) => {
                if (typeof e === "string") set.add(e);
                else if (e?.nombre) set.add(e.nombre);
            });
        });

        return ["ALL", ...Array.from(set)];
    }, [items]);

    const filteredItems = useMemo(() => {
        const query = (q ?? "").toLowerCase().trim();

        return (items ?? []).filter((r) => {

            const matchQuery =
                !query ||
                (r.titulo ?? "").toLowerCase().includes(query) ||
                (r.categoria?.nombre ?? "").toLowerCase().includes(query) ||
                (r.editor?.username ?? "").toLowerCase().includes(query);

            const matchCat =
                categoria === "ALL" ||
                (r.categoria?.nombre ?? "") === categoria;

            const matchEtiqueta =
                etiqueta === "ALL" ||
                (r.etiquetas ?? []).some((e) =>
                    (typeof e === "string" ? e : e?.nombre) === etiqueta
                );
            const matchSubs = !soloSuscritas || isSubscribed(r.id);


            return matchQuery && matchCat && matchEtiqueta && matchSubs;
        });
    }, [items, q, categoria, etiqueta, soloSuscritas]);

    function warnDisabled(text) {
        alert(text);
    }

    function isSubscribed(revistaId) {
        return !!subsByMe[revistaId]?.subscribed;
    }

    // ---------- LIKE ----------
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
                    prev.map((x) => (x.id === rid ? { ...x, cantidadLikes: Math.max(0, (x.cantidadLikes ?? 0) - 1) } : x))
                );
            } else {
                await darLike({ revistaId: rid, usuarioId });
                setLikedByMe((p) => ({ ...p, [rid]: true }));
                setItems((prev) => prev.map((x) => (x.id === rid ? { ...x, cantidadLikes: (x.cantidadLikes ?? 0) + 1 } : x)));
            }

            if (panelOpen && panelRevista?.id === rid) await loadPanelData(rid);
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

        if (!revista?.permiteSuscripciones) {
            warnDisabled("Esta revista tiene las suscripciones deshabilitadas.");
            return;
        }

        setSubBusy((p) => ({ ...p, [rid]: true }));
        try {
            const current = subsByMe[rid];
            const subscribed = !!current?.subscribed;

            if (subscribed) {
                if (!current?.suscripcionId) throw new Error("No suscripcionId");
                await cancelarSuscripcion(current.suscripcionId);

                setSubsByMe((p) => ({ ...p, [rid]: { subscribed: false, suscripcionId: current.suscripcionId } }));

                setItems((prev) =>
                    prev.map((x) =>
                        x.id === rid ? { ...x, cantidadSuscripciones: Math.max(0, (x.cantidadSuscripciones ?? 0) - 1) } : x
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
                    prev.map((x) => (x.id === rid ? { ...x, cantidadSuscripciones: (x.cantidadSuscripciones ?? 0) + 1 } : x))
                );
            }

            if (panelOpen && panelRevista?.id === rid) await loadPanelData(rid);
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

    function goPerfil(uid) {
        if (!uid) return;
        navigate(`/app/suscriptor/perfil/${uid}`);
    }

    async function crearComentario() {
        if (!panelRevista?.id) return;

        const rid = panelRevista.id;
        const subscribed = isSubscribed(rid);

        if (!panelRevista?.permiteComentarios) {
            warnDisabled("Esta revista tiene comentarios deshabilitados.");
            return;
        }
        if (!subscribed) {
            warnDisabled("Tenés que estar suscrito para comentar.");
            return;
        }

        const contenido = (nuevoComentario ?? "").trim();
        if (!contenido) return;

        setCommentBusy(true);
        try {
            await createComentario({ revistaId: rid, usuarioId, contenido });

            setNuevoComentario("");
            await loadPanelData(rid);

            setItems((prev) => prev.map((x) => (x.id === rid ? { ...x, cantidadComentarios: (x.cantidadComentarios ?? 0) + 1 } : x)));
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
                    x.id === panelRevista.id ? { ...x, cantidadComentarios: Math.max(0, (x.cantidadComentarios ?? 0) - 1) } : x
                )
            );
        } catch (e) {
            console.log(e);
            alert("No se pudo eliminar el comentario.");
        }
    }

    return (
        <div className="container-fluid p-0" style={{ maxWidth: 1600 }}>
            {/* IMPORTANTE: este wrapper mantiene el scroll SOLO en el centro */}
            <div className="d-flex flex-column" style={{ height: "100vh", overflow: "hidden", padding: 2 }}>
                {/* header */}
                <div className="d-flex align-items-center justify-content-between mb-3">
                    <div>
                        <h1 className="h4 mb-0">Revistas</h1>
                        <div className="text-muted small">Explorá, suscribite, mirá actividad y ediciones.</div>
                    </div>

                    <button className="btn btn-outline-secondary" onClick={() => { load(); loadAds(); }} disabled={loading}>
                        <i className="bi bi-arrow-clockwise me-2"></i>
                        {loading ? "Actualizando..." : "Refrescar"}
                    </button>
                </div>

                {/* filtros */}
                <div className="card shadow-sm mb-3">
                    <div className="card-body">
                        <div className="row g-2 align-items-end">
                            <div className="col-12 col-md-6">
                                <label className="form-label mb-1">Buscar</label>
                                <div className="input-group">
                                    <span className="input-group-text"><i className="bi bi-search"></i></span>
                                    <input className="form-control" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Título, categoría, @editor..." />
                                    {q && <button className="btn btn-outline-secondary" onClick={() => setQ("")}>Limpiar</button>}
                                </div>
                            </div>

                            <div className="col-12 col-md-3">
                                <label className="form-label mb-1">Categoría</label>
                                <select className="form-select" value={categoria} onChange={(e) => setCategoria(e.target.value)}>
                                    {categorias.map((c) => <option key={c} value={c}>{c === "ALL" ? "Todas" : c}</option>)}
                                </select>
                            </div>
                            <div className="col-12 col-md-3">
                                <label className="form-label mb-1">Etiqueta</label>

                                <select
                                    className="form-select"
                                    value={etiqueta}
                                    onChange={(e) => setEtiqueta(e.target.value)}
                                >
                                    {etiquetas.map((e) => (
                                        <option key={e} value={e}>
                                            {e === "ALL" ? "Todas" : e}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="col-12 col-md-2">
                                <label className="form-label mb-1">Mostrar</label>
                                <select
                                    className="form-select"
                                    value={soloSuscritas ? "SUBS" : "ALL"}
                                    onChange={(e) => setSoloSuscritas(e.target.value === "SUBS")}
                                >
                                    <option value="ALL">Todas</option>
                                    <option value="SUBS">Mis suscripciones</option>
                                </select>
                            </div>

                            <div className="col-12 col-md-3 d-flex gap-2">
                                <button className="btn btn-outline-secondary w-100" onClick={() => {
                                    setQ(""); setCategoria("ALL");
                                    setEtiqueta("ALL");
                                    setSoloSuscritas(false);
                                }}>
                                    <i className="bi bi-x-circle me-1"></i>Reset
                                </button>
                            </div>
                        </div>

                        <div className="text-muted small mt-2">Mostrando <b>{filteredItems.length}</b> revistas</div>
                    </div>
                </div>

                {/* body */}
                <div className="row g-3 flex-grow-1">
                    {/* left */}
                    <div className="col-12 col-lg-3 d-none d-lg-flex">
                        {adsLoading ? (
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
                                height={360}  // 👈 anuncios más pequeños
                            />
                        )}
                    </div>

                    {/* center scroll */}
                    <div className="col-12 col-lg-6">
                        <div
                            className="border rounded-3 bg-white shadow-sm"
                            style={{
                                maxHeight: "calc(100vh - 260px)", // ✅ altura real -> aparece scroll sí o sí
                                overflowY: "auto",
                                padding: 12,
                            }}
                        >
                            {loading && (
                                <div className="alert alert-info d-flex align-items-center gap-2">
                                    <div className="spinner-border spinner-border-sm" />
                                    <span>Cargando revistas...</span>
                                </div>
                            )}

                            {msg.text && <div className={`alert alert-${msg.type}`}>{msg.text}</div>}

                            {!loading && !msg.text && filteredItems.length === 0 && (
                                <div className="alert alert-secondary">No hay revistas activas para mostrar.</div>
                            )}

                            <div className="d-flex flex-column gap-3" style={{ maxWidth: 820, margin: "0 auto" }}>
                                {filteredItems.map((r) => {
                                    const rid = r.id;
                                    const editorName = `${r.editor?.nombre ?? "Editor"} ${r.editor?.apellido ?? ""}`.trim();
                                    const categoriaName = r.categoria?.nombre ?? "Sin categoría";
                                    const catColor = badgeColorByCategoria(categoriaName);
                                    const subscribed = isSubscribed(rid);
                                    const menuId = `sub-revista-menu-${rid}`;

                                    const likesCount = r.cantidadLikes ?? 0;
                                    const comCount = r.cantidadComentarios ?? 0;
                                    const subsCount = r.cantidadSuscripciones ?? 0;

                                    return (
                                        <div key={rid} className="card shadow-sm">
                                            <div className="card-body">
                                                <div className="d-flex align-items-start justify-content-between gap-2">
                                                    <div className="d-flex align-items-center gap-2">
                                                        <Avatar url={r.editor?.perfilUrl} name={editorName} size={42} onClick={() => goPerfil(r.editor?.id)} />
                                                        <div>
                                                            <div className="d-flex align-items-center gap-2 flex-wrap">
                                                                <button
                                                                    type="button"
                                                                    className="btn btn-link p-0 fw-semibold text-decoration-none"
                                                                    onClick={() => goPerfil(r.editor?.id)}
                                                                    style={{ lineHeight: 1.1 }}
                                                                >
                                                                    {editorName || "Editor"}
                                                                </button>

                                                                <span className={`badge text-bg-${catColor}`}>
                                                                    <i className="bi bi-bookmark me-1"></i>
                                                                    {categoriaName}
                                                                </span>

                                                                <span className={"badge " + (subscribed ? "text-bg-success" : "text-bg-secondary")}>
                                                                    <i className={"bi " + (subscribed ? "bi-person-check-fill" : "bi-person-plus") + " me-1"} />
                                                                    {subscribed ? "SUSCRITO" : "NO SUSCRITO"}
                                                                </span>
                                                            </div>

                                                            <div className="text-muted small">@{r.editor?.username ?? "editor"} • Revista #{rid}</div>
                                                        </div>
                                                    </div>

                                                    <div className="dropdown">
                                                        <button className="btn btn-sm btn-light border" type="button" id={menuId} data-bs-toggle="dropdown" aria-expanded="false">
                                                            <i className="bi bi-three-dots-vertical"></i>
                                                        </button>

                                                        <ul className="dropdown-menu dropdown-menu-end" aria-labelledby={menuId}>
                                                            <li>
                                                                <button className="dropdown-item" onClick={() => openPanel(r, "comentarios")}>
                                                                    <i className="bi bi-people me-2"></i>Ver actividad
                                                                </button>
                                                            </li>
                                                            <li>
                                                                <button
                                                                    className="dropdown-item"
                                                                    disabled={!subscribed}
                                                                    onClick={() => navigate(`/app/suscriptor/revistas/${rid}/ediciones`)}
                                                                    title={!subscribed ? "Suscribite para ver ediciones" : "Ver ediciones"}
                                                                >
                                                                    <i className="bi bi-journal-text me-2"></i>Ver ediciones
                                                                </button>
                                                            </li>
                                                        </ul>
                                                    </div>
                                                </div>


                                                <div className="mt-3">
                                                    {r.titulo ? <div className="fw-semibold">{r.titulo}</div> : null}

                                                    <div className="text-muted" style={{ whiteSpace: "pre-wrap" }}>
                                                        {r.descripcion || "—"}
                                                    </div>

                                                    {/* etiquetas */}
                                                    {(r.etiquetas ?? []).length > 0 && (
                                                        <div className="mt-2 d-flex flex-wrap gap-2">
                                                            {(r.etiquetas ?? []).map((et) => {
                                                                const nombre = typeof et === "string" ? et : et?.nombre;

                                                                return (
                                                                    <span
                                                                        key={nombre}
                                                                        className="badge bg-light text-dark border d-flex align-items-center gap-1"
                                                                    >
                                                                        <i className="bi bi-tag"></i>
                                                                        {nombre}
                                                                    </span>
                                                                );
                                                            })}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="card-footer bg-white">
                                                <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                                                    <div className="d-flex flex-wrap gap-2">
                                                        <button
                                                            className={"btn btn-sm " + (likedByMe[rid] ? "btn-danger" : "btn-outline-danger")}
                                                            onClick={() => toggleLike(r)}
                                                            disabled={!!likeBusy[rid] || !r.permiteLikes}
                                                            style={!r.permiteLikes ? { opacity: 0.6 } : undefined}
                                                        >
                                                            <i className={"bi " + (likedByMe[rid] ? "bi-heart-fill" : "bi-heart") + " me-1"} />
                                                            {likesCount}
                                                        </button>

                                                        <button
                                                            className="btn btn-sm btn-outline-secondary"
                                                            onClick={() => openPanel(r, "comentarios")}
                                                            disabled={!r.permiteComentarios}
                                                            style={!r.permiteComentarios ? { opacity: 0.6 } : undefined}
                                                        >
                                                            <i className="bi bi-chat-left-text me-1" />
                                                            {comCount}
                                                        </button>

                                                        <button
                                                            className={"btn btn-sm " + (subscribed ? "btn-success" : "btn-outline-success")}
                                                            onClick={() => toggleSuscripcion(r)}
                                                            disabled={!!subBusy[rid] || !r.permiteSuscripciones}
                                                            style={!r.permiteSuscripciones ? { opacity: 0.6 } : undefined}
                                                        >
                                                            <i className={"bi " + (subscribed ? "bi-person-check-fill" : "bi-person-plus") + " me-1"} />
                                                            {subsCount}
                                                        </button>
                                                    </div>

                                                    <div className="text-muted small">{!subscribed && r.permiteComentarios ? "Para comentar: suscribite" : ""}</div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* right */}
                    <div className="col-12 col-lg-3 d-none d-lg-flex">
                        {adsLoading ? (
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
                                height={360} // 👈 anuncios más pequeños
                            />
                        )}
                    </div>
                </div>

                {/* OFFCANVAS (igual que lo tenías) */}
                {panelOpen && (
                    <>
                        <div className="offcanvas-backdrop fade show" onClick={closePanel} style={{ cursor: "pointer", zIndex: 1040 }} />

                        <div className="offcanvas offcanvas-end show" tabIndex="-1" style={{ visibility: "visible", width: "420px", background: "white", zIndex: 1050 }}>
                            <div className="offcanvas-header border-bottom">
                                <div>
                                    <div className="fw-semibold">Actividad</div>
                                    <div className="text-muted small">
                                        {panelRevista?.titulo ?? "Revista"} • #{panelRevista?.id}
                                    </div>
                                </div>
                                <button type="button" className="btn-close" onClick={closePanel} />
                            </div>

                            <div className="offcanvas-body">
                                <div className="btn-group w-100 mb-3">
                                    <button className={"btn " + (panelTab === "comentarios" ? "btn-primary" : "btn-outline-primary")} onClick={() => setPanelTab("comentarios")}>
                                        <i className="bi bi-chat-left-text me-1"></i> Comentarios
                                    </button>
                                    <button className={"btn " + (panelTab === "likes" ? "btn-danger" : "btn-outline-danger")} onClick={() => setPanelTab("likes")}>
                                        <i className="bi bi-heart me-1"></i> Likes
                                    </button>
                                    <button className={"btn " + (panelTab === "suscriptores" ? "btn-success" : "btn-outline-success")} onClick={() => setPanelTab("suscriptores")}>
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
                                        {!panelRevista?.permiteComentarios && <div className="alert alert-warning">Esta revista tiene comentarios deshabilitados.</div>}

                                        {panelRevista?.permiteComentarios && (
                                            <>
                                                {!isSubscribed(panelRevista?.id) && (
                                                    <div className="alert alert-warning">Para comentar necesitás estar suscrito. Igual podés ver los comentarios.</div>
                                                )}

                                                <div className="mb-3">
                                                    <label className="form-label mb-1">Escribir comentario</label>
                                                    <textarea
                                                        className="form-control"
                                                        rows={3}
                                                        value={nuevoComentario}
                                                        onChange={(e) => setNuevoComentario(e.target.value)}
                                                        placeholder={isSubscribed(panelRevista?.id) ? "Escribí algo..." : "Suscribite para poder comentar"}
                                                        disabled={!isSubscribed(panelRevista?.id)}
                                                    />

                                                    <button
                                                        className="btn btn-primary w-100 mt-2"
                                                        onClick={crearComentario}
                                                        disabled={commentBusy || !nuevoComentario.trim() || !isSubscribed(panelRevista?.id) || !panelRevista?.permiteComentarios}
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
                                                    const isAutor = u?.id === panelRevista?.editor?.id;

                                                    return (
                                                        <div key={c.id} className="border rounded-3 p-2">
                                                            <div className="d-flex align-items-start gap-2">
                                                                <Avatar url={u?.perfilUrl} name={name} size={34} onClick={() => goPerfil(u?.id)} />
                                                                <div className="flex-grow-1">
                                                                    <div className="d-flex justify-content-between gap-2">
                                                                        <div>
                                                                            <button type="button" className="btn btn-link p-0 fw-semibold text-decoration-none d-flex align-items-center gap-1" onClick={() => goPerfil(u?.id)}>
                                                                                {name}

                                                                                {isAutor && (
                                                                                    <span className="badge bg-warning text-dark">
                                                                                        <i className="bi bi-mic-fill"></i>Autor
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
                                        {!panelRevista?.permiteLikes && <div className="alert alert-warning">Esta revista tiene likes deshabilitados.</div>}

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
                                                    const isAutor = u?.id === panelRevista?.editor?.id;
                                                    return (
                                                        <div key={l.id} className="d-flex align-items-center gap-2 border rounded-3 p-2">
                                                            <Avatar url={u?.perfilUrl} name={name} size={34} onClick={() => goPerfil(u?.id)} />
                                                            <div className="flex-grow-1">
                                                                <button type="button" className="btn btn-link p-0 fw-semibold text-decoration-none d-flex align-items-center gap-1" onClick={() => goPerfil(u?.id)}>
                                                                    {name}

                                                                    {isAutor && (
                                                                        <span className="badge bg-warning text-dark">
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
                                        {!panelRevista?.permiteSuscripciones && <div className="alert alert-warning">Esta revista tiene suscripciones deshabilitadas.</div>}

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
                                                            <Avatar url={u?.perfilUrl} name={name} size={34} onClick={() => goPerfil(u?.id)} />
                                                            <div className="flex-grow-1">
                                                                <button type="button" className="btn btn-link p-0 fw-semibold text-decoration-none" onClick={() => goPerfil(u?.id)}>
                                                                    {name}
                                                                </button>
                                                                <div className="text-muted small">
                                                                    @{u?.username ?? "user"} • {formatDateTime(s.fechaSuscripcion)}
                                                                </div>
                                                            </div>
                                                            <span className={"badge " + (s.activa ? "text-bg-success" : "text-bg-secondary")}>{s.activa ? "Activa" : "Inactiva"}</span>
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