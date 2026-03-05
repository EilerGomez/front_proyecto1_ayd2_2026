import { useEffect, useState } from "react";
import { getUsuarios } from "../../services/usuarios.service";
import { Link } from "react-router-dom";

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setError("");
    setLoading(true);
    try {
      const list = await getUsuarios();
      setUsuarios(Array.isArray(list) ? list : []);
      console.log("usuarios:", list);
    } catch (e) {
      setError("No se pudieron cargar los usuarios.");
      console.log("error:", e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div>
      <div className="d-flex align-items-center justify-content-between mb-3">
        <div>
          <h1 className="h4 mb-0">Usuarios</h1>
          <div className="text-muted small">
            Administración de usuarios del sistema
          </div>
        </div>

        <Link to="/app/admin/usuarios/nuevo" className="btn btn-primary">
          <i className="bi bi-plus-lg me-2"></i>
          Nuevo usuario
        </Link>
      </div>

      {loading && (
        <div className="alert alert-info d-flex align-items-center gap-2">
          <div className="spinner-border spinner-border-sm" />
          <span>Cargando usuarios...</span>
        </div>
      )}

      {error && <div className="alert alert-danger">{error}</div>}

      {!loading && !error && (
        <div className="card shadow-sm">
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-hover table-striped align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th style={{ width: 80 }}>ID</th>
                    <th>Nombre</th>
                    <th>Username</th>
                    <th>Correo</th>
                    <th style={{ width: 130 }}>Rol</th>
                    <th style={{ width: 120 }}>Estado</th>
                    <th style={{ width: 140 }}>Saldo</th>
                    <th className="text-left p-3">Acciones</th>
                  </tr>
                </thead>

                <tbody>
                  {usuarios.map((x) => (
                    <tr key={x?.usuario?.id}>
                      <td className="fw-semibold">{x.usuario.id}</td>
                      <td>
                        {x.usuario.nombre} {x.usuario.apellido}
                      </td>
                      <td className="text-muted">{x.usuario.username}</td>
                      <td>{x.usuario.correo}</td>
                      <td>
                        <span className="badge bg-secondary">
                          {x.rol?.nombre ?? "SIN_ROL"}
                        </span>
                      </td>
                      <td>
                        <span
                          className={
                            "badge " +
                            (x.usuario.estado === "ACTIVO"
                              ? "bg-success"
                              : "bg-warning text-dark")
                          }
                        >
                          {x.usuario.estado}
                        </span>
                      </td>
                      <td>
                        {Number(x.cartera?.saldo ?? 0).toFixed(2)}{" "}
                        {x.cartera?.moneda ?? "GTQ"}
                      </td>
                        <td className="p-3">
                            <Link
                                to={`/app/admin/usuarios/editar/${x.usuario.id}`}
                                state={{ usuarioItem: x }}  
                                className="px-3 py-1 rounded-md bg-gray-100 text-gray-900 hover:bg-gray-200"
                            >
                                Editar
                            </Link>
                        </td>
                    </tr>
                  ))}

                  {usuarios.length === 0 && (
                    <tr>
                      <td colSpan={7} className="text-center text-muted py-4">
                        No hay usuarios.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="card-footer d-flex justify-content-between align-items-center">
            <small className="text-muted">
              Total: <b>{usuarios.length}</b>
            </small>

            <button onClick={load} className="btn btn-outline-secondary btn-sm">
              <i className="bi bi-arrow-clockwise me-1"></i>
              Recargar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}