import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { logout, getUser, getCartera, updateCarteraInStorage, getPerfil } from "../../auth/authService";
import { getCarteraByUsuarioId } from "../../services/cartera.service";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const location = useLocation();

  const user = getUser();
  const usuarioId = user?.id;


  const [avatar, setAvatar] = useState(getPerfil()?.foto_url ?? "");
  const avatarUrl = avatar;
  useEffect(() => {
    setAvatar(getPerfil()?.foto_url ?? "");
  }, [location.pathname]);

  const [collapsed, setCollapsed] = useState(false);

  // cartera en UI (arranca de localStorage)
  const [cartera, setCartera] = useState(getCartera());

  async function handleLogout() {
    await logout();
    navigate("/login", { replace: true });
  }

  async function refreshCartera() {
    if (!usuarioId) return;
    try {
      const data = await getCarteraByUsuarioId(usuarioId);
      setCartera(data);
      updateCarteraInStorage(data);
    } catch (e) {
      // no bloqueamos UI si falla
      console.log("No se pudo refrescar cartera:", e);
    }
  }

  // 1) al montar
  useEffect(() => {
    refreshCartera();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usuarioId]);

  // 2) cada vez que cambie de ruta (cambia el Outlet)
  useEffect(() => {
    refreshCartera();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  return (
    <div className="d-flex min-vh-100 bg-light">
      {/* SIDEBAR */}
      <aside
        className="bg-white border-end d-flex flex-column"
        style={{
          width: collapsed ? "70px" : "240px",
          transition: "all 0.25s ease",
        }}
      >
        {/* LOGO + TOGGLE */}
        <div className="d-flex align-items-center justify-content-between p-3 border-bottom">
          {!collapsed && (
            <span className="fw-bold">
              <i className="bi bi-journal-richtext me-2"></i>
              Panel Admin
            </span>
          )}

          <button
            className="btn btn-sm btn-outline-secondary"
            onClick={() => setCollapsed(!collapsed)}
            title="Mostrar/ocultar menú"
          >
            <i className="bi bi-list"></i>
          </button>
        </div>

        {/* MENU */}
        <div className="list-group list-group-flush flex-grow-1">
          <NavLink
            to="/app/admin"
            end
            className={({ isActive }) =>
              "list-group-item list-group-item-action d-flex align-items-center gap-2 " +
              (isActive ? "active" : "")
            }
          >
            <i className="bi bi-speedometer2"></i>
            {!collapsed && "Dashboard"}
          </NavLink>

          <NavLink
            to="/app/admin/usuarios"
            className={({ isActive }) =>
              "list-group-item list-group-item-action d-flex align-items-center gap-2 " +
              (isActive ? "active" : "")
            }
          >
            <i className="bi bi-people"></i>
            {!collapsed && "Usuarios"}
          </NavLink>
          <NavLink
            to="/app/admin/revistas"
            className={({ isActive }) =>
              "list-group-item list-group-item-action d-flex align-items-center gap-2 " +
              (isActive ? "active" : "")
            }
          >
            <i className="bi bi-cash-coin"></i>
            {!collapsed && "Costo revista"}
          </NavLink>
          <NavLink
            to="/app/admin/anuncios"
            className={({ isActive }) =>
              "list-group-item list-group-item-action d-flex align-items-center gap-2 " +
              (isActive ? "active" : "")
            }
          >
            <i className="bi bi-megaphone"></i>
            {!collapsed && "Anuncios"}
          </NavLink>
          <NavLink
            to="/app/admin/periodos"
            className={({ isActive }) =>
              "list-group-item list-group-item-action d-flex align-items-center gap-2 " +
              (isActive ? "active" : "")
            }
          >
            <i className="bi bi-cash-stack"></i>
            {!collapsed && "Precios anuncios"}
          </NavLink>
          <NavLink
            to="/app/admin/categorias"
            className={({ isActive }) =>
              "list-group-item list-group-item-action d-flex align-items-center gap-2 " +
              (isActive ? "active" : "")
            }
          >
            <i className="bi bi-grid-3x3-gap"></i>
            {!collapsed && "Categorías"}
          </NavLink>

          <NavLink
            to="/app/admin/etiquetas"
            className={({ isActive }) =>
              "list-group-item list-group-item-action d-flex align-items-center gap-2 " +
              (isActive ? "active" : "")
            }
          >
            <i className="bi bi-tags"></i>
            {!collapsed && "Etiquetas"}
          </NavLink>


          <NavLink
            to="/app/admin/reportes"
            className={({ isActive }) =>
              "list-group-item list-group-item-action d-flex align-items-center gap-2 " +
              (isActive ? "active" : "")
            }
          >
            <i className="bi bi-graph-up-arrow"></i>
            {!collapsed && "Reportes"}
          </NavLink>

          {/* NUEVO: Billetera */}
          <NavLink
            to="/app/admin/billetera"
            className={({ isActive }) =>
              "list-group-item list-group-item-action d-flex align-items-center gap-2 " +
              (isActive ? "active" : "")
            }
          >
            <i className="bi bi-wallet2"></i>
            {!collapsed && "Billetera"}
          </NavLink>

          {/* NUEVO: Perfil (si tu perfil es público, esto debería existir también en rutas generales) */}
          <NavLink
            to="/app/admin/perfil"
            className={({ isActive }) =>
              "list-group-item list-group-item-action d-flex align-items-center gap-2 " +
              (isActive ? "active" : "")
            }
          >
            <i className="bi bi-person-badge"></i>
            {!collapsed && "Mi perfil"}
          </NavLink>
        </div>

        {/* FOOTER SIDEBAR */}
        <div className="border-top p-3 small text-muted">{!collapsed && "Gestión de Revistas"}</div>
      </aside>

      {/* MAIN CONTENT */}
      <div className="flex-grow-1 d-flex flex-column">
        {/* TOPBAR */}
        <nav className="navbar navbar-light bg-white border-bottom px-4">
          <div className="ms-auto d-flex align-items-center gap-3">
            {/* saldo mini en topbar */}
            <span className="badge text-bg-light border d-flex align-items-center gap-2">
              <i className="bi bi-wallet2"></i>
              {Number(cartera?.saldo ?? 0).toFixed(2)} {cartera?.moneda ?? "GTQ"}
            </span>

            <span className="text-muted small d-flex align-items-center gap-2">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="Avatar"
                  className="rounded-circle border"
                  style={{ width: 28, height: 28, objectFit: "cover" }}
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              ) : (
                <i className="bi bi-person-circle fs-5"></i>
              )}

              {user?.nombre ?? "Administrador"}
            </span>

            <button onClick={handleLogout} className="btn btn-outline-danger btn-sm">
              <i className="bi bi-box-arrow-right me-1"></i>
              Cerrar sesión
            </button>
          </div>
        </nav>

        {/* PAGE CONTENT */}
        <main className="p-4">
          <Outlet />
        </main>
      </div>
    </div>
  );
}