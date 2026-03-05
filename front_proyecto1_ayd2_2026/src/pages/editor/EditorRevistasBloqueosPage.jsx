// src/pages/editor/EditorRevistasBloqueosPage.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getUser } from "../../auth/authService";
import { getRevistasByEditorId } from "../../services/revistas.service";
import { getBloqueoActivoByRevistaId } from "../../services/bloqueosAnuncios.service";

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

function AnunciosBadge({ libre }) {
  return (
    <span className={`badge ${libre ? "text-bg-dark" : "text-bg-warning"}`}>
      <i className={`bi ${libre ? "bi-shield-check" : "bi-megaphone"} me-1`}></i>
      {libre ? "LIBRE DE ANUNCIOS" : "CONTIENE ANUNCIOS"}
    </span>
  );
}

function Avatar({ url, name = "Editor" }) {
  const [ok, setOk] = useState(true);

  if (!url || !ok) {
    return (
      <div
        className="rounded-circle bg-light border d-inline-flex align-items-center justify-content-center"
        style={{ width: 44, height: 44 }}
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
      style={{ width: 44, height: 44, objectFit: "cover" }}
      onError={() => setOk(false)}
    />
  );
}

export default function EditorRevistasBloqueosPage() {
  const navigate = useNavigate();
  const user = getUser();
  const editorId = user?.id;

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState({ type: "", text: "" });

  const [q, setQ] = useState("");
  const [estado, setEstado] = useState("ALL"); // ALL | ACTIVA | INACTIVA

  // mapa: revistaId -> true si está libre (tiene bloqueo activo), false si contiene anuncios
  const [libreMap, setLibreMap] = useState({});
  const [checkingMap, setCheckingMap] = useState({}); // loading por revista

  async function load() {
    setLoading(true);
    setMsg({ type: "", text: "" });

    try {
      if (!editorId) return;

      const data = await getRevistasByEditorId(editorId);
      const arr = data ?? [];
      setItems(arr);

      // precargar estado "bloqueo activo"
      const checks = arr.map(async (r) => {
        setCheckingMap((p) => ({ ...p, [r.id]: true }));
        try {
          const activo = await getBloqueoActivoByRevistaId(r.id);
          // si hay activo => LIBRE DE ANUNCIOS
          return [r.id, !!activo];
        } catch {
          // si falla (no existe) => CONTIENE ANUNCIOS
          return [r.id, false];
        } finally {
          setCheckingMap((p) => ({ ...p, [r.id]: false }));
        }
      });

      const results = await Promise.all(checks);
      const map = {};
      results.forEach(([rid, libre]) => (map[rid] = libre));
      setLibreMap(map);
    } catch (e) {
      console.log(e);
      setMsg({ type: "danger", text: "No se pudieron cargar tus revistas." });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editorId]);

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

  return (
    <div>
      <div className="d-flex align-items-center justify-content-between mb-3">
        <div>
          <h1 className="h4 mb-0">Bloqueos de anuncios (Editor)</h1>
          <div className="text-muted small">
            Seleccioná una revista para ver historial o contratar bloqueo.
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
        <div className="alert alert-secondary">Aún no tenés revistas registradas.</div>
      )}

      {!loading && !msg.text && items.length > 0 && filteredItems.length === 0 && (
        <div className="alert alert-secondary">No hay resultados con esos filtros.</div>
      )}

      {!loading && filteredItems.length > 0 && (
        <div className="d-flex flex-column gap-3">
          {filteredItems.map((r) => {
            const menuId = `editor-bloqueos-menu-${r.id}`;
            const editorName = `${r.editor?.nombre ?? "Editor"} ${r.editor?.apellido ?? ""}`.trim();
            const categoriaName = r.categoria?.nombre ?? "Sin categoría";
            const catColor = badgeColorByCategoria(categoriaName);

            const libre = !!libreMap[r.id];
            const checking = !!checkingMap[r.id];

            return (
              <div key={r.id} className="card shadow-sm">
                <div className="card-body">
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

                          {checking ? (
                            <span className="badge text-bg-light border">
                              <span className="spinner-border spinner-border-sm me-1" />
                              Verificando...
                            </span>
                          ) : (
                            <AnunciosBadge libre={libre} />
                          )}
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
                            onClick={() => navigate(`/app/editor/revistas/${r.id}/ediciones`)}
                          >
                            <i className="bi bi-journal-text me-2"></i>
                            Ver ediciones
                          </button>
                        </li>

                        <li>
                          <button
                            className="dropdown-item"
                            onClick={() => navigate(`/app/editor/revistas/${r.id}/bloqueos`)}
                          >
                            <i className="bi bi-shield-lock me-2"></i>
                            Pagos de bloqueos
                          </button>
                        </li>
                      </ul>
                    </div>
                  </div>

                  <div className="mt-3 text-muted" style={{ whiteSpace: "pre-wrap" }}>
                    {r.titulo ? <div className="fw-semibold text-dark mb-1">{r.titulo}</div> : null}
                    {r.descripcion || "—"}
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