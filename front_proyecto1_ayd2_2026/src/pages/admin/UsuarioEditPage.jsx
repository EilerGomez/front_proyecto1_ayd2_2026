import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { getUsuarioById, updateUsuario } from "../../services/usuarios.service";
import { getUser } from "../../auth/authService"; 

export default function UsuarioEditPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const user = getUser();
  const fromState = location.state?.usuarioItem ?? null;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    id: Number(id),
    nombre: "",
    username: "",
    apellido: "",
    correo: "",
    estado: "ACTIVO",
  });

  useEffect(() => {
    (async () => {
      setError("");
      setLoading(true);
      try {
        if (fromState) {
          const u = fromState.usuario;
          setForm({
            id: u.id,
            nombre: u.nombre ?? "",
            username: u.username ?? "",
            apellido: u.apellido ?? "",
            correo: u.correo ?? "",
            estado: u.estado ?? "ACTIVO",
          });
          return;
        }

        // Si no vino del state, probamos con GET /usuarios/{id} (si tu backend lo tiene)
        const item = await getUsuarioById(id);
        const u = item.usuario;

        setForm({
          id: u.id,
          nombre: u.nombre ?? "",
          username: u.username ?? "",
          apellido: u.apellido ?? "",
          correo: u.correo ?? "",
          estado: u.estado ?? "ACTIVO",
        });
      } catch (e) {
        console.log(e);
        setError("No se pudo cargar el usuario. Entrá desde el listado o habilitá GET /v1/usuarios/{id}.");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  function onChange(e) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setSaving(true);

    try {
      // payload EXACTO como tu backend espera (según tu Postman)
      const payload = {
        id: form.id,
        nombre: form.nombre,
        username: form.username,
        apellido: form.apellido,
        correo: form.correo,
        estado: form.estado,
      };

      await updateUsuario(form.id, payload);
      navigate("/app/admin/usuarios", { replace: true });
    } catch (e) {
      console.log(e);
      setError("No se pudo actualizar. Revisá permisos o datos.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="text-muted">Cargando...</p>;

  return (
    <div className="container-fluid">
      <div className="d-flex align-items-center justify-content-between mb-3">
        <div>
          <h1 className="h4 mb-0">Editar usuario</h1>
          <div className="text-muted small">ID: {form.id}</div>
        </div>

        <button
          className="btn btn-outline-secondary"
          onClick={() => navigate("/app/admin/usuarios")}
        >
          Volver
        </button>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <form onSubmit={onSubmit} className="card border-0 shadow-sm">
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label">Nombre</label>
              <input
                name="nombre"
                value={form.nombre}
                onChange={onChange}
                className="form-control"
                required
              />
            </div>

            <div className="col-md-6">
              <label className="form-label">Apellido</label>
              <input
                name="apellido"
                value={form.apellido}
                onChange={onChange}
                className="form-control"
                required
              />
            </div>

            <div className="col-md-6">
              <label className="form-label">Username</label>
              <input
                name="username"
                value={form.username}
                onChange={onChange}
                className="form-control"
                required
              />
            </div>

            <div className="col-md-6">
              <label className="form-label">Correo</label>
              <input
                type="email"
                name="correo"
                value={form.correo}
                onChange={onChange}
                className="form-control"
                required
              />
            </div>

            <div className="col-md-4">
              <label className="form-label">Estado</label>
              <select
                name="estado"
                value={form.estado}
                onChange={onChange}
                className="form-select"
                disabled={form.id==user.id}
              >
                <option value="ACTIVO">ACTIVO</option>
                <option value="INACTIVO">INACTIVO</option>
              </select>
            </div>
          </div>
        </div>

        <div className="card-footer bg-white d-flex gap-2 justify-content-end">
          <button
            type="button"
            className="btn btn-outline-secondary"
            onClick={() => navigate("/app/admin/usuarios")}
            disabled={saving}
          >
            Cancelar
          </button>

          <button className="btn btn-primary" disabled={saving}>
            {saving ? "Guardando..." : "Guardar cambios"}
          </button>
        </div>
      </form>
    </div>
  );
}