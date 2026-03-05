// src/pages/suscriptor/PerfilPublicPage.jsx
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { getPerfilByUsuarioId } from "../../services/perfil.service";
import { getUsuarioById } from "../../services/usuarios.service";

function chipsFrom(str) {
  if (!str) return [];
  return String(str)
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
}

export default function PerfilPublicPage() {
  const { id } = useParams(); // /app/suscriptor/perfil/:id
  const usuarioId = Number(id);
  const navigate = useNavigate();

  const [usuario, setUsuario] = useState(null);
  const [perfil, setPerfil] = useState(null);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    async function load() {
      setLoading(true);
      setMsg("");
      try {
        const [u, p] = await Promise.all([
          getUsuarioById(usuarioId),
          getPerfilByUsuarioId(usuarioId).catch(() => null),
        ]);
        setUsuario(u ?? null);
        setPerfil(p ?? null);
      } catch (e) {
        console.log(e);
        setMsg("No se pudo cargar el perfil.");
      } finally {
        setLoading(false);
      }
    }
    if (usuarioId) load();
  }, [usuarioId]);

  const nombre = `${usuario?.nombre ?? "Usuario"} ${usuario?.apellido ?? ""}`.trim();

  if (loading) {
    return (
      <div className="alert alert-info d-flex align-items-center gap-2">
        <div className="spinner-border spinner-border-sm" />
        <span>Cargando perfil...</span>
      </div>
    );
  }

  if (msg) return <div className="alert alert-danger">{msg}</div>;

  return (
    <div className="container-fluid p-0" style={{ maxWidth: 950 }}>
      <div className="d-flex align-items-start justify-content-between mb-3">
        <div>
          <h1 className="h5 mb-0">Perfil</h1>
          <div className="text-muted small">@{usuario.usuario.username ?? "user"}</div>
        </div>

        <button className="btn btn-outline-secondary" onClick={() => navigate(-1)}>
          <i className="bi bi-arrow-left me-1"></i>
          Volver
        </button>
      </div>

      <div className="row g-3">
        <div className="col-12 col-lg-4">
          <div className="card shadow-sm">
            <div className="card-body text-center">
              {perfil?.foto_url ? (
                <img
                  src={perfil.foto_url}
                  alt="Foto"
                  className="rounded-circle border"
                  style={{ width: 120, height: 120, objectFit: "cover" }}
                  onError={(e) => (e.currentTarget.style.display = "none")}
                />
              ) : (
                <div
                  className="rounded-circle bg-light border d-inline-flex align-items-center justify-content-center"
                  style={{ width: 120, height: 120 }}
                >
                  <i className="bi bi-person-circle" style={{ fontSize: 48 }} />
                </div>
              )}

              <div className="mt-3 fw-semibold">{nombre}</div>
              <div className="text-muted small">{usuario?.correo ?? ""}</div>

              <hr />

              <div className="text-muted small">Este perfil es solo lectura.</div>
            </div>
          </div>
        </div>

        <div className="col-12 col-lg-8">
          <div className="card shadow-sm">
            <div className="card-body">
              <div className="fw-semibold mb-2">
                <i className="bi bi-person-lines-fill me-2"></i>
                Información
              </div>

              <div className="mb-3">
                <div className="text-muted small mb-1">Descripción</div>
                <div className="border rounded-3 p-2 bg-light">
                  {perfil?.descripcion?.trim() ? perfil.descripcion : "—"}
                </div>
              </div>

              <div className="row g-3">
                <div className="col-12">
                  <div className="text-muted small mb-1">Hobbies</div>
                  <div className="d-flex flex-wrap gap-2">
                    {chipsFrom(perfil?.hobbies).length ? (
                      chipsFrom(perfil?.hobbies).map((x, i) => (
                        <span key={i} className="badge rounded-pill bg-primary-subtle text-primary border">
                          {x}
                        </span>
                      ))
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </div>
                </div>

                <div className="col-12">
                  <div className="text-muted small mb-1">Intereses</div>
                  <div className="d-flex flex-wrap gap-2">
                    {chipsFrom(perfil?.intereses).length ? (
                      chipsFrom(perfil?.intereses).map((x, i) => (
                        <span key={i} className="badge rounded-pill bg-success-subtle text-success border">
                          {x}
                        </span>
                      ))
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </div>
                </div>

                <div className="col-12">
                  <div className="text-muted small mb-1">Gustos</div>
                  <div className="d-flex flex-wrap gap-2">
                    {chipsFrom(perfil?.gustos).length ? (
                      chipsFrom(perfil?.gustos).map((x, i) => (
                        <span key={i} className="badge rounded-pill bg-warning-subtle text-warning border">
                          {x}
                        </span>
                      ))
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </div>
                </div>
              </div>

              <hr />

              <div className="text-muted small">
                <i className="bi bi-info-circle me-1"></i>
                Informacion del usuario
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}