import { useEffect, useState } from "react";
import { getRoles } from "../../services/roles.service";
import { createUsuario } from "../../services/usuarios.service";
import { useNavigate } from "react-router-dom";

export default function UsuarioCreatePage() {
  const navigate = useNavigate();

  const [roles, setRoles] = useState([]);
  const [form, setForm] = useState({
    nombre: "",
    username: "",
    apellido: "",
    correo: "",
    password: "",
    estado: "ACTIVO",
    id_rol: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const r = await getRoles();
        setRoles(r);
        if (r.length > 0) {
          setForm((f) => ({ ...f, id_rol: r[0].id }));
        }
      } catch (e) {
        setError("No se pudieron cargar los roles.");
        console.log(e)
      }
    })();
  }, []);

  function onChange(e) {
    const { name, value } = e.target;
    setForm((f) => ({
      ...f,
      [name]: name === "id_rol" ? Number(value) : value,
    }));
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await createUsuario(form);
      navigate("/app/admin/usuarios", { replace: true });
    } catch (e) {
      setError("No se pudo crear el usuario. Revisá datos o permisos.");
      console.log(e)
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card shadow-sm">
      <div className="card-body">
        <div className="d-flex align-items-center justify-content-between mb-3">
          <div>
            <h1 className="h4 mb-0">Nuevo usuario</h1>
            <div className="text-muted small">
              Completá la información para crear un usuario.
            </div>
          </div>

          <button
            className="btn btn-outline-secondary"
            onClick={() => navigate("/app/admin/usuarios")}
          >
            Volver
          </button>
        </div>

        {error && <div className="alert alert-danger">{error}</div>}

        <form onSubmit={onSubmit} className="row g-3">
          <div className="col-md-6">
            <label className="form-label">Nombre</label>
            <input
              name="nombre"
              value={form.nombre}
              onChange={onChange}
              className="form-control"
            />
          </div>

          <div className="col-md-6">
            <label className="form-label">Apellido</label>
            <input
              name="apellido"
              value={form.apellido}
              onChange={onChange}
              className="form-control"
            />
          </div>

          <div className="col-md-6">
            <label className="form-label">Username</label>
            <input
              name="username"
              value={form.username}
              onChange={onChange}
              className="form-control"
            />
          </div>

          <div className="col-md-6">
            <label className="form-label">Correo</label>
            <input
              name="correo"
              type="email"
              value={form.correo}
              onChange={onChange}
              className="form-control"
            />
          </div>

          <div className="col-md-6">
            <label className="form-label">Password</label>
            <input
              name="password"
              type="password"
              value={form.password}
              onChange={onChange}
              className="form-control"
            />
          </div>

          <div className="col-md-6">
            <label className="form-label">Estado</label>
            <select
              name="estado"
              value={form.estado}
              onChange={onChange}
              className="form-select"
            >
              <option value="ACTIVO">ACTIVO</option>
              <option value="INACTIVO">INACTIVO</option>
            </select>
          </div>

          <div className="col-md-6">
            <label className="form-label">Rol</label>
            <select
              name="id_rol"
              value={form.id_rol}
              onChange={onChange}
              className="form-select"
            >
              {roles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.nombre}
                </option>
              ))}
            </select>
          </div>

          <div className="col-12 d-flex justify-content-end gap-2 mt-3">
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={() => navigate("/app/admin/usuarios")}
            >
              Cancelar
            </button>

            <button className="btn btn-primary" disabled={loading}>
              {loading ? "Guardando..." : "Crear usuario"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}