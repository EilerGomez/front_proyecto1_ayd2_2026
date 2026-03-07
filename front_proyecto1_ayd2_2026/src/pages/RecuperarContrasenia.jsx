// src/pages/public/RecuperarContrasenia.jsx
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  solicitarRecuperacion,
  validarCodigoRecuperacion,
  cambiarContraseniaRecuperacion,
} from "../services/recuperacion.service";

export default function RecuperarContrasenia() {
  const navigate = useNavigate();

  // paso: 1 correo, 2 codigo, 3 cambiar pass
  const [step, setStep] = useState(1);

  // "memoria" (en runtime): guardamos correo y codigo
  const [correo, setCorreo] = useState("");
  const [codigo, setCodigo] = useState("");

  const [inputCorreo, setInputCorreo] = useState("");
  const [inputCodigo, setInputCodigo] = useState("");
  const [pass1, setPass1] = useState("");
  const [pass2, setPass2] = useState("");

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });

  const canNextPass = useMemo(() => {
    if (!pass1 || !pass2) return false;
    if (pass1 !== pass2) return false;
    if (pass1.length < 6) return false;
    return true;
  }, [pass1, pass2]);

  async function onSolicitar(e) {
    e.preventDefault();
    setMsg({ type: "", text: "" });

    const ident = (inputCorreo ?? "").trim();
    if (!ident) return setMsg({ type: "danger", text: "Ingresá tu correo o identificador." });

    setLoading(true);
    try {
      await solicitarRecuperacion(ident);
      setCorreo(ident); // guardado en memoria (estado)
      setStep(2);
      setMsg({ type: "success", text: "Te enviamos un código al correo. Revisá tu inbox/spam." });
    } catch (err) {
      console.log(err);
      setMsg({ type: "danger", text: "No se pudo enviar el código. Verificá el correo." });
    } finally {
      setLoading(false);
    }
  }

  async function onValidar(e) {
    e.preventDefault();
    setMsg({ type: "", text: "" });

    const cod = (inputCodigo ?? "").trim();
    if (!correo) return setMsg({ type: "danger", text: "No hay correo en memoria. Volvé al paso 1." });
    if (!cod) return setMsg({ type: "warning", text: "Ingresá el código que te llegó al correo." });

    setLoading(true);
    try {
      const ok = await validarCodigoRecuperacion({ correo, codigo: cod });
      if (!ok) {
        setMsg({ type: "danger", text: "Código inválido o vencido. Pedí otro código." });
        return;
      }
      setCodigo(cod); // guardado en memoria (estado)
      setStep(3);
      setMsg({ type: "success", text: "Código validado. Ahora cambiá tu contraseña." });
    } catch (err) {
      console.log(err);
      setMsg({ type: "danger", text: "No se pudo validar el código." });
    } finally {
      setLoading(false);
    }
  }

  async function onCambiar(e) {
    e.preventDefault();
    setMsg({ type: "", text: "" });

    if (!correo || !codigo) {
      return setMsg({ type: "danger", text: "Faltan datos en memoria (correo/código). Volvé a empezar." });
    }
    if (!canNextPass) {
      if (pass1.length < 6) return setMsg({ type: "warning", text: "La contraseña debe tener al menos 6 caracteres." });
      if (pass1 !== pass2) return setMsg({ type: "warning", text: "Las contraseñas no coinciden." });
      return setMsg({ type: "warning", text: "Completá la nueva contraseña." });
    }

    setLoading(true);
    try {
      await cambiarContraseniaRecuperacion({
        correo,
        codigo,
        nuevaPassword: pass1,
      });

      setMsg({ type: "success", text: "Contraseña actualizada. Ahora podés iniciar sesión." });

      setTimeout(() => navigate("/login", { replace: true }), 600);
    } catch (err) {
      console.log(err);
      setMsg({ type: "danger", text: "No se pudo cambiar la contraseña. Revisá el código o pedí otro." });
    } finally {
      setLoading(false);
    }
  }

  function volverPaso1() {
    setStep(1);
    setCorreo("");
    setCodigo("");
    setInputCorreo("");
    setInputCodigo("");
    setPass1("");
    setPass2("");
    setMsg({ type: "", text: "" });
  }

  return (
    <div className="min-h-screen w-full bg-neutral-950 text-white relative overflow-hidden">
      {/* Fondo (igual al login) */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/30 via-black to-emerald-900/20" />
      <div className="absolute -top-24 -left-24 h-80 w-80 rounded-full bg-indigo-500/20 blur-3xl" />
      <div className="absolute -bottom-24 -right-24 h-96 w-96 rounded-full bg-emerald-500/15 blur-3xl" />

      {/* Centro */}
      <div className="relative min-h-screen flex items-center justify-center p-6">
        <div className="w-full max-w-md mx-auto rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl">
          <div className="p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl font-semibold">Recuperar contraseña</h1>
                <p className="text-sm text-white/60 mt-1">
                  {step === 1 && "Ingresá tu correo para recibir un código."}
                  {step === 2 && "Ingresá el código que te llegó por email."}
                  {step === 3 && "Creá tu nueva contraseña."}
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

            {msg.text && (
              <div
                className={
                  "mt-4 rounded-xl border px-4 py-3 text-sm " +
                  (msg.type === "success"
                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-100"
                    : msg.type === "warning"
                    ? "border-yellow-500/30 bg-yellow-500/10 text-yellow-100"
                    : "border-red-500/30 bg-red-500/10 text-red-200")
                }
              >
                {msg.text}
              </div>
            )}

            {/* STEP 1 */}
            {step === 1 && (
              <form onSubmit={onSolicitar} className="mt-6 space-y-4">
                <div className="space-y-2">
                  <label className="text-sm text-white/70">Correo</label>
                  <input
                    value={inputCorreo}
                    onChange={(e) => setInputCorreo(e.target.value)}
                    placeholder="ej: usuario@correo.com"
                    className="w-full rounded-xl bg-black/40 border border-white/10 px-4 py-3 outline-none focus:border-indigo-400/60 focus:ring-2 focus:ring-indigo-400/20 transition"
                  />
                </div>

                <button
                  disabled={loading}
                  className="w-full rounded-xl py-3 font-medium bg-gradient-to-r from-indigo-500 to-emerald-500 hover:opacity-95 active:opacity-90 transition disabled:opacity-50"
                >
                  {loading ? "Enviando..." : "Enviar código"}
                </button>

                <div className="text-xs text-white/40 pt-2 text-center">
                  ¿No era tu correo?{" "}
                  <button
                    type="button"
                    className="text-white/70 hover:text-white underline underline-offset-4"
                    onClick={() => setInputCorreo("")}
                  >
                    Limpiar
                  </button>
                </div>
              </form>
            )}

            {/* STEP 2 */}
            {step === 2 && (
              <form onSubmit={onValidar} className="mt-6 space-y-4">
                <div className="text-sm text-white/60">
                  Enviamos el código a: <span className="text-white">{correo}</span>
                </div>

                <div className="space-y-2">
                  <label className="text-sm text-white/70">Código</label>
                  <input
                    value={inputCodigo}
                    onChange={(e) => setInputCodigo(e.target.value)}
                    placeholder="Ej: 123456"
                    className="w-full rounded-xl bg-black/40 border border-white/10 px-4 py-3 outline-none focus:border-emerald-400/60 focus:ring-2 focus:ring-emerald-400/20 transition"
                  />
                </div>

                <button
                  disabled={loading}
                  className="w-full rounded-xl py-3 font-medium bg-gradient-to-r from-indigo-500 to-emerald-500 hover:opacity-95 active:opacity-90 transition disabled:opacity-50"
                >
                  {loading ? "Validando..." : "Validar código"}
                </button>

                <div className="flex items-center justify-between text-xs text-white/50 pt-1">
                  <button
                    type="button"
                    onClick={volverPaso1}
                    className="text-white/60 hover:text-white underline underline-offset-4"
                  >
                    Cambiar correo
                  </button>

                  <button
                    type="button"
                    onClick={async () => {
                      // reenviar usando el correo guardado
                      setMsg({ type: "", text: "" });
                      setLoading(true);
                      try {
                        await solicitarRecuperacion(correo);
                        setMsg({ type: "success", text: "Te reenviamos el código. Revisá tu correo." });
                      } catch (e) {
                        console.log(e);
                        setMsg({ type: "danger", text: "No se pudo reenviar el código." });
                      } finally {
                        setLoading(false);
                      }
                    }}
                    className="text-white/60 hover:text-white underline underline-offset-4"
                  >
                    Reenviar código
                  </button>
                </div>
              </form>
            )}

            {/* STEP 3 */}
            {step === 3 && (
              <form onSubmit={onCambiar} className="mt-6 space-y-4">
                <div className="text-sm text-white/60">
                  Correo: <span className="text-white">{correo}</span> • Código:{" "}
                  <span className="text-white">{codigo}</span>
                </div>

                <div className="space-y-2">
                  <label className="text-sm text-white/70">Nueva contraseña</label>
                  <input
                    type="password"
                    value={pass1}
                    onChange={(e) => setPass1(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-xl bg-black/40 border border-white/10 px-4 py-3 outline-none focus:border-emerald-400/60 focus:ring-2 focus:ring-emerald-400/20 transition"
                  />
                  <div className="text-xs text-white/40">Mínimo 6 caracteres.</div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm text-white/70">Confirmar contraseña</label>
                  <input
                    type="password"
                    value={pass2}
                    onChange={(e) => setPass2(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-xl bg-black/40 border border-white/10 px-4 py-3 outline-none focus:border-emerald-400/60 focus:ring-2 focus:ring-emerald-400/20 transition"
                  />
                  {pass1 && pass2 && pass1 !== pass2 && (
                    <div className="text-xs text-red-200">No coinciden.</div>
                  )}
                </div>

                <button
                  disabled={loading || !canNextPass}
                  className="w-full rounded-xl py-3 font-medium bg-gradient-to-r from-indigo-500 to-emerald-500 hover:opacity-95 active:opacity-90 transition disabled:opacity-50"
                >
                  {loading ? "Guardando..." : "Cambiar contraseña"}
                </button>

                <div className="text-xs text-white/50 pt-1 text-center">
                  ¿Tu código expiró?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setStep(2);
                      setInputCodigo("");
                      setMsg({ type: "warning", text: "Volvé a validar un código." });
                    }}
                    className="text-white/70 hover:text-white underline underline-offset-4"
                  >
                    Validar otro código
                  </button>
                </div>
              </form>
            )}

            <div className="text-xs text-white/40 pt-6 text-center">
              Practica 1 AyD2 • REVISTAS HUB
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}