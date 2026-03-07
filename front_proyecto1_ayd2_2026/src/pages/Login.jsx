import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login, getRole } from "../auth/authService";
import { getDashboardPathByRole } from "../auth/redirectByRole";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      
      await login(email, password);
        const role = getRole();
        navigate(getDashboardPathByRole(role), { replace: true });
    } catch (err) {
      setError("Credenciales inválidas o el servidor no responde.");
      console.log(err)
    } finally {
      setLoading(false);
    }
  }

return (
  <div className="min-h-screen w-full bg-neutral-950 text-white relative overflow-hidden">
    {/* Fondo */}
    <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/30 via-black to-emerald-900/20" />
    <div className="absolute -top-24 -left-24 h-80 w-80 rounded-full bg-indigo-500/20 blur-3xl" />
    <div className="absolute -bottom-24 -right-24 h-96 w-96 rounded-full bg-emerald-500/15 blur-3xl" />

    {/* Centro */}
    <div className="relative min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md mx-auto rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl">
        <div className="p-8">
          <h1 className="text-2xl font-semibold">Iniciar sesión</h1>
          <p className="text-sm text-white/60 mt-1">
            Accedé con tu cuenta para entrar al sistema.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div className="space-y-2">
              <label className="text-sm text-white/70">Email o Username</label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ej: admin@correo.com"
                className="w-full rounded-xl bg-black/40 border border-white/10 px-4 py-3 outline-none focus:border-indigo-400/60 focus:ring-2 focus:ring-indigo-400/20 transition"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm text-white/70">Contraseña</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl bg-black/40 border border-white/10 px-4 py-3 outline-none focus:border-emerald-400/60 focus:ring-2 focus:ring-emerald-400/20 transition"
              />
            </div>

            {error && (
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {error}
              </div>
            )}

            <button
              disabled={loading}
              className="w-full rounded-xl py-3 font-medium bg-gradient-to-r from-indigo-500 to-emerald-500 hover:opacity-95 active:opacity-90 transition disabled:opacity-50"
            >
              {loading ? "Entrando..." : "Entrar"}
            </button>
            {/* links */}
              <div className="flex items-center justify-between text-sm pt-1">
                <button
                  type="button"
                  onClick={() => navigate("/crear-cuenta")}
                  className="text-white/70 hover:text-white underline underline-offset-4"
                >
                  Crear cuenta
                </button>

                <button
                  type="button"
                  onClick={() => navigate("/recuperar-contrasenia")} 
                  className="text-white/50 hover:text-white/80 underline underline-offset-4"
                >
                  Recuperar contraseña
                </button>
              </div>

            <div className="text-xs text-white/40 pt-2 text-center">
              Practica 1 AyD2 • REVISTAS HUB
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
);
}