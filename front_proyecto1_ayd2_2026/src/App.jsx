import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { setOnUnauthorized } from "./api/http";
import AppRouter from "./routes/AppRouter";

export default function App() {
  const navigate = useNavigate();

  useEffect(() => {
    setOnUnauthorized(() => {
      localStorage.removeItem("token");
      localStorage.removeItem("session");

      // evita loop si ya estás en login
      if (window.location.pathname !== "/login") {
        navigate("/login", { replace: true });
      }
    });
  }, [navigate]);

  return <AppRouter />;
}