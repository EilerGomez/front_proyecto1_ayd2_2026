import { Navigate, Outlet } from "react-router-dom";
import { isAuthenticated, getRole } from "../auth/authService";

export default function PrivateRoute({ roles = [] }) {
  if (!isAuthenticated()) return <Navigate to="/login" replace />;

  const role = getRole();
  if (roles.length > 0 && !roles.includes(role)) {
    return <Navigate to="/forbidden" replace />;
  }

  return <Outlet />;
}