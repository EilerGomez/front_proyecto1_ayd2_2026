import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { getUser, logout, getRole } from "../auth/authService";

export default function DashboardLayout() {
  const navigate = useNavigate();
  const user = getUser();
  const role = getRole();

  async function handleLogout() {
    await logout();
    navigate("/", { replace: true });
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Topbar */}
      <div className="flex items-center justify-between px-6 py-3 border-b">
        <div className="flex gap-4">
          <NavLink to="/app" className="hover:underline">Home</NavLink>

          {/* links según rol (opcional) */}
          {role === "ADMIN" && <NavLink to="/app/admin" className="hover:underline">Admin</NavLink>}
          {role === "EDITOR" && <NavLink to="/app/editor" className="hover:underline">Editor</NavLink>}
          {role === "SUSCRIPTOR" && <NavLink to="/app/suscriptor" className="hover:underline">Suscriptor</NavLink>}
          {role === "ANUNCIANTE" && <NavLink to="/app/anunciante" className="hover:underline">Anunciante</NavLink>}
        </div>

        <div className="flex items-center gap-4">
          <span className="text-sm">{user?.nombre ?? "usuario"}</span>
          <button onClick={handleLogout} className="text-sm underline">
            Cerrar sesión
          </button>
        </div>
      </div>

      {/* AQUÍ va lo que cambia (AdminDashboard, EditorDashboard, etc.) */}
      <main className="p-6">
        <Outlet />
      </main>
    </div>
  );
}