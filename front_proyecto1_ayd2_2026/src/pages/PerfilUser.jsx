import { useEffect, useMemo, useState } from "react";
import {
  getUser,
  getPerfil,
  updatePerfilInStorage,
  updateUsuarioInStorage,
} from "../auth/authService";

import {
  getPerfilByUsuarioId,
  updatePerfilByUsuarioId,
} from "../services/perfil.service";

import { updateUsuario } from "../services/usuarios.service";

function toChips(str) {
  if (!str) return [];
  return str
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
}

function fromChipsToString(str) {
  return (str ?? "").trim();
}

export default function PerfilUser() {
  const user = getUser();          // {id,nombre,username,apellido,correo,estado}
  const perfilLS = getPerfil();    // {foto_url,hobbies,intereses,descripcion,gustos}

  const usuarioId = user?.id;

  const [form, setForm] = useState({
    // USUARIO
    nombre: user?.nombre ?? "",
    apellido: user?.apellido ?? "",
    username: user?.username ?? "",
    correo: user?.correo ?? "",

    // PERFIL
    foto_url: perfilLS?.foto_url ?? "",
    hobbies: perfilLS?.hobbies ?? "",
    intereses: perfilLS?.intereses ?? "",
    descripcion: perfilLS?.descripcion ?? "",
    gustos: perfilLS?.gustos ?? "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });

  const chips = useMemo(() => {
    return {
      hobbies: toChips(form.hobbies),
      intereses: toChips(form.intereses),
      gustos: toChips(form.gustos),
    };
  }, [form.hobbies, form.intereses, form.gustos]);

  useEffect(() => {
    async function load() {
      setMsg({ type: "", text: "" });
      setLoading(true);

      try {
        if (!usuarioId) return;

        // Traemos perfil desde API
        const data = await getPerfilByUsuarioId(usuarioId);

        setForm((prev) => ({
          ...prev,
          // usuario se queda desde localStorage
          // perfil viene del servidor
          foto_url: data?.foto_url ?? "",
          hobbies: data?.hobbies ?? "",
          intereses: data?.intereses ?? "",
          descripcion: data?.descripcion ?? "",
          gustos: data?.gustos ?? "",
        }));
      } catch (e) {
        console.log(e);
        setMsg({
          type: "warning",
          text: "No se pudo cargar desde el servidor. Mostrando datos locales.",
        });
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [usuarioId]);

  function onChange(e) {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  }

  async function onSave(e) {
    e.preventDefault();
    setMsg({ type: "", text: "" });
    setSaving(true);

    try {
      if (!usuarioId) throw new Error("No hay usuarioId");

      // 1) actualizar USUARIO (cuenta)
      const payloadUsuario = {
        id: usuarioId,
        nombre: form.nombre,
        username: form.username,
        apellido: form.apellido,
        correo: form.correo,
        // mantenemos estado ACTIVO/INACTIVO como está en storage
        estado: user?.estado ?? "ACTIVO",
      };

      const usuarioResponse = await updateUsuario(usuarioId, payloadUsuario);

      // A veces tu backend retorna { usuario, perfil, rol, cartera }
      // Si retorna solo usuario, igual funciona con fallback
      const usuarioUpdated =
        usuarioResponse?.usuario ?? usuarioResponse ?? payloadUsuario;

      updateUsuarioInStorage(usuarioUpdated);

      // 2) actualizar PERFIL
      const payloadPerfil = {
        foto_url: form.foto_url ?? "",
        hobbies: fromChipsToString(form.hobbies),
        intereses: fromChipsToString(form.intereses),
        descripcion: form.descripcion ?? "",
        gustos: fromChipsToString(form.gustos),
      };

      const perfilUpdated = await updatePerfilByUsuarioId(usuarioId, payloadPerfil);
      updatePerfilInStorage(perfilUpdated);

      setMsg({ type: "success", text: "Perfil actualizado correctamente." });
    } catch (e) {
      console.log(e);
      setMsg({ type: "danger", text: "Error al actualizar el perfil." });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="d-flex align-items-center justify-content-between mb-3">
        <div>
          <h1 className="h4 mb-0">Mi perfil</h1>
          <div className="text-muted small">
            Editá tu cuenta y tu información de perfil
          </div>
        </div>
      </div>

      {loading && (
        <div className="alert alert-info d-flex align-items-center gap-2">
          <div className="spinner-border spinner-border-sm" />
          <span>Cargando perfil...</span>
        </div>
      )}

      {msg.text && <div className={`alert alert-${msg.type}`}>{msg.text}</div>}

      {!loading && (
        <div className="row g-3">
          {/* Columna izquierda: Foto + URL */}
          <div className="col-12 col-lg-4">
            <div className="card shadow-sm">
              <div className="card-body text-center">
                {form.foto_url ? (
                  <img
                    src={form.foto_url}
                    alt="Foto de perfil"
                    className="rounded-circle border"
                    style={{ width: 120, height: 120, objectFit: "cover" }}
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                ) : (
                  <div
                    className="rounded-circle bg-light border d-inline-flex align-items-center justify-content-center"
                    style={{ width: 120, height: 120 }}
                  >
                    <i className="bi bi-person-circle" style={{ fontSize: 48 }}></i>
                  </div>
                )}

                <div className="mt-3 fw-semibold">
                  {form.nombre || user?.nombre || "Usuario"}
                </div>
                <div className="text-muted small">{form.correo || user?.correo || ""}</div>

                <hr />

                <label className="form-label text-start w-100">
                  URL foto 
                </label>
                <input
                  className="form-control"
                  name="foto_url"
                  value={form.foto_url}
                  onChange={onChange}
                  placeholder="https://..."
                />
                <div className="form-text">
                  Pegá un link público de imagen (jpg/png/webp).
                </div>
              </div>
            </div>
          </div>

          {/* Columna derecha: formulario completo */}
          <div className="col-12 col-lg-8">
            <form onSubmit={onSave} className="card shadow-sm">
              <div className="card-body">
                {/* Datos de cuenta */}
                <div className="d-flex align-items-center gap-2 mb-2">
                  <i className="bi bi-shield-lock"></i>
                  <div className="fw-semibold">Datos de cuenta</div>
                </div>

                <div className="row g-3 mb-4">
                  <div className="col-md-6">
                    <label className="form-label">Nombre</label>
                    <input
                      className="form-control"
                      name="nombre"
                      value={form.nombre}
                      onChange={onChange}
                      required
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">Apellido</label>
                    <input
                      className="form-control"
                      name="apellido"
                      value={form.apellido}
                      onChange={onChange}
                      required
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">Username</label>
                    <input
                      className="form-control"
                      name="username"
                      value={form.username}
                      onChange={onChange}
                      required
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">Correo</label>
                    <input
                      className="form-control"
                      type="email"
                      name="correo"
                      value={form.correo}
                      onChange={onChange}
                      required
                    />
                  </div>
                </div>

                {/* Datos de perfil */}
                <div className="d-flex align-items-center gap-2 mb-2">
                  <i className="bi bi-person-lines-fill"></i>
                  <div className="fw-semibold">Datos de perfil</div>
                </div>

                <div className="mb-3">
                  <label className="form-label">Descripción</label>
                  <textarea
                    className="form-control"
                    rows={3}
                    name="descripcion"
                    value={form.descripcion}
                    onChange={onChange}
                    placeholder="Contá algo sobre vos..."
                  />
                </div>

                <div className="row g-3">
                  <div className="col-12">
                    <label className="form-label">
                      Hobbies (separados por coma)
                    </label>
                    <input
                      className="form-control"
                      name="hobbies"
                      value={form.hobbies}
                      onChange={onChange}
                      placeholder="Ej: fútbol, lectura, música"
                    />
                    <div className="mt-2 d-flex flex-wrap gap-2">
                      {chips.hobbies.map((x, i) => (
                        <span
                          key={i}
                          className="badge rounded-pill bg-primary-subtle text-primary border"
                        >
                          {x}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="col-12">
                    <label className="form-label">
                      Intereses (separados por coma)
                    </label>
                    <input
                      className="form-control"
                      name="intereses"
                      value={form.intereses}
                      onChange={onChange}
                      placeholder="Ej: tecnología, finanzas, revistas"
                    />
                    <div className="mt-2 d-flex flex-wrap gap-2">
                      {chips.intereses.map((x, i) => (
                        <span
                          key={i}
                          className="badge rounded-pill bg-success-subtle text-success border"
                        >
                          {x}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="col-12">
                    <label className="form-label">Gustos (separados por coma)</label>
                    <input
                      className="form-control"
                      name="gustos"
                      value={form.gustos}
                      onChange={onChange}
                      placeholder="Ej: café, jazz, viajes"
                    />
                    <div className="mt-2 d-flex flex-wrap gap-2">
                      {chips.gustos.map((x, i) => (
                        <span
                          key={i}
                          className="badge rounded-pill bg-warning-subtle text-warning border"
                        >
                          {x}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="card-footer d-flex justify-content-end gap-2">
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? "Guardando..." : "Guardar cambios"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}