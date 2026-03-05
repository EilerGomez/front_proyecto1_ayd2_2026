// src/pages/public/CrearCuenta.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getRoles } from "../services/roles.service";
import { createUsuario } from "../services/usuarios.service";

export function CrearCuenta() {
  const navigate = useNavigate();

  const [roles, setRoles] = useState([]);
  const [loadingRoles, setLoadingRoles] = useState(true);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    nombre: "",
    apellido: "",
    username: "",
    correo: "",
    password: "",
    confirmPassword: "",
    estado: "ACTIVO",
    id_rol: "",
  });

  const rolesPublicos = useMemo(() => {
    return (roles ?? []).filter((r) => String(r?.nombre ?? "").toUpperCase() !== "ADMIN");
  }, [roles]);

  useEffect(() => {
    (async () => {
      setLoadingRoles(true);
      setError("");
      try {
        const r = await getRoles();
        setRoles(r ?? []);
        const filtrados = (r ?? []).filter((x) => String(x?.nombre ?? "").toUpperCase() !== "ADMIN");
        if (filtrados.length > 0) {
          setForm((f) => ({ ...f, id_rol: filtrados[0].id }));
        }
      } catch (e) {
        console.log(e);
        setError("No se pudieron cargar los roles.");
      } finally {
        setLoadingRoles(false);
      }
    })();
  }, []);

  function onChange(e) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: name === "id_rol" ? Number(value) : value }));
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError("");

    if (!form.nombre.trim() || !form.apellido.trim() || !form.username.trim() || !form.correo.trim()) {
      return setError("Completá nombre, apellido, username y correo.");
    }
    if (!form.password) return setError("Ingresá una contraseña.");
    if (form.password.length < 6) return setError("La contraseña debe tener al menos 6 caracteres.");
    if (form.password !== form.confirmPassword) return setError("Las contraseñas no coinciden.");
    if (!form.id_rol) return setError("Seleccioná un rol.");

    const rolElegido = rolesPublicos.find((r) => Number(r.id) === Number(form.id_rol));
    if (!rolElegido) return setError("Rol inválido (no se permite ADMIN).");

    setLoading(true);
    try {
      // Mandamos lo que espera tu API (sin confirmPassword)
      const payload = {
        nombre: form.nombre,
        apellido: form.apellido,
        username: form.username,
        correo: form.correo,
        password: form.password,
        estado: form.estado,
        id_rol: Number(form.id_rol),
      };

      await createUsuario(payload);

      // listo -> a login
      navigate("/login", { replace: true });
    } catch (e) {
      console.log(e);
      setError("No se pudo crear la cuenta. Revisá datos o si ya existe el usuario/correo.");
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
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl font-semibold">Crear cuenta</h1>
                <p className="text-sm text-white/60 mt-1">
                  Registrate seleccionando un rol (excepto ADMIN).
                </p>
              </div>

              <button
                type="button"
                onClick={() => navigate("/login")}
                className="text-sm px-3 py-2 rounded-xl border border-white/10 bg-black/30 hover:bg-black/40 transition"
              >
                Volver
              </button>
            </div>

            <form onSubmit={onSubmit} className="mt-6 space-y-4">
              {/* Nombre / Apellido */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="text-sm text-white/70">Nombre</label>
                  <input
                    name="nombre"
                    value={form.nombre}
                    onChange={onChange}
                    placeholder="Ej: Carlos"
                    className="w-full rounded-xl bg-black/40 border border-white/10 px-4 py-3 outline-none focus:border-indigo-400/60 focus:ring-2 focus:ring-indigo-400/20 transition"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm text-white/70">Apellido</label>
                  <input
                    name="apellido"
                    value={form.apellido}
                    onChange={onChange}
                    placeholder="Ej: Mendoza"
                    className="w-full rounded-xl bg-black/40 border border-white/10 px-4 py-3 outline-none focus:border-indigo-400/60 focus:ring-2 focus:ring-indigo-400/20 transition"
                  />
                </div>
              </div>

              {/* Username / Correo */}
              <div className="space-y-2">
                <label className="text-sm text-white/70">Username</label>
                <input
                  name="username"
                  value={form.username}
                  onChange={onChange}
                  placeholder="Ej: cmendoza"
                  className="w-full rounded-xl bg-black/40 border border-white/10 px-4 py-3 outline-none focus:border-indigo-400/60 focus:ring-2 focus:ring-indigo-400/20 transition"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm text-white/70">Correo</label>
                <input
                  name="correo"
                  type="email"
                  value={form.correo}
                  onChange={onChange}
                  placeholder="ej: usuario@correo.com"
                  className="w-full rounded-xl bg-black/40 border border-white/10 px-4 py-3 outline-none focus:border-emerald-400/60 focus:ring-2 focus:ring-emerald-400/20 transition"
                />
              </div>

              {/* Rol */}
              <div className="space-y-2">
                <label className="text-sm text-white/70">Rol</label>
                <select
                  name="id_rol"
                  value={form.id_rol}
                  onChange={onChange}
                  disabled={loadingRoles}
                  className="w-full rounded-xl bg-black/40 border border-white/10 px-4 py-3 outline-none focus:border-indigo-400/60 focus:ring-2 focus:ring-indigo-400/20 transition"
                >
                  {rolesPublicos.map((r) => (
                    <option key={r.id} value={r.id} className="bg-neutral-900">
                      {r.nombre}
                    </option>
                  ))}
                </select>
                {loadingRoles && <div className="text-xs text-white/40">Cargando roles...</div>}
              </div>

              {/* Password / Confirm */}
              <div className="space-y-2">
                <label className="text-sm text-white/70">Contraseña</label>
                <input
                  name="password"
                  type="password"
                  value={form.password}
                  onChange={onChange}
                  placeholder="••••••••"
                  className="w-full rounded-xl bg-black/40 border border-white/10 px-4 py-3 outline-none focus:border-emerald-400/60 focus:ring-2 focus:ring-emerald-400/20 transition"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm text-white/70">Confirmar contraseña</label>
                <input
                  name="confirmPassword"
                  type="password"
                  value={form.confirmPassword}
                  onChange={onChange}
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
                disabled={loading || loadingRoles || rolesPublicos.length === 0}
                className="w-full rounded-xl py-3 font-medium bg-gradient-to-r from-indigo-500 to-emerald-500 hover:opacity-95 active:opacity-90 transition disabled:opacity-50"
              >
                {loading ? "Creando..." : "Crear cuenta"}
              </button>

              <div className="text-xs text-white/40 pt-2 text-center">
                ¿Ya tenés cuenta?{" "}
                <button
                  type="button"
                  className="text-white/80 hover:text-white underline underline-offset-4"
                  onClick={() => navigate("/login")}
                >
                  Iniciar sesión
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}