import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { getUser, getCartera } from "../../auth/authService";
import { getAnuncioById } from "../../services/anuncios.service";
import { getPreciosPorTipo } from "../../services/preciosAnuncio.service";
import { comprarAnuncio } from "../../services/comprasAnuncio.service";

function toLocalDateTimeString(dt) {
  // Spring LocalDateTime espera: YYYY-MM-DDTHH:mm:ss
  // input type="datetime-local" trae: YYYY-MM-DDTHH:mm
  // completamos segundos si no vienen
  if (!dt) return null;
  return dt.length === 16 ? `${dt}:00` : dt; 
}

export default function ComprarAnuncioPage() {
  const { id } = useParams(); // anuncioId
  const navigate = useNavigate();

  const user = getUser();
  const cartera = getCartera();

  const anuncianteId = user?.id;
  const carteraId = cartera?.id;

  const [anuncio, setAnuncio] = useState(null);
  const [precios, setPrecios] = useState([]);
  const [precioId, setPrecioId] = useState("");
  const [fechaInicio, setFechaInicio] = useState(""); // datetime-local
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState({ type: "", text: "" });

  const tipoAnuncioId = anuncio?.tipoAnuncio?.id;

  const precioSeleccionado = useMemo(
    () => (precios ?? []).find((p) => p.id === Number(precioId)),
    [precios, precioId]
  );

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function load() {
    setLoading(true);
    setMsg({ type: "", text: "" });

    try {
      const a = await getAnuncioById(id);
      setAnuncio(a);

      const lista = await getPreciosPorTipo(a?.tipoAnuncio?.id);
      // si querés solo activos:
      // const activos = (lista ?? []).filter(x => x.activo);
      setPrecios(lista ?? []);
    } catch (e) {
      console.error(e);
      setMsg({ type: "danger", text: "No se pudo cargar el anuncio o los precios." });
    } finally {
      setLoading(false);
    }
  }

  async function handleComprar() {
    setMsg({ type: "", text: "" });

    if (!anuncianteId) return setMsg({ type: "danger", text: "No hay sesión de anunciante." });
    if (!carteraId) return setMsg({ type: "danger", text: "No se encontró la cartera en sesión." });
    if (!id) return setMsg({ type: "danger", text: "No se encontró el anuncio." });
    if (!precioId) return setMsg({ type: "warning", text: "Selecciona un precio." });
    if (!fechaInicio) return setMsg({ type: "warning", text: "Selecciona la fecha de inicio." });

    const payload = {
      anuncioId: Number(id),
      anuncianteId: Number(anuncianteId),
      precioId: Number(precioId),
      carteraId: Number(carteraId),
      fechaInicio: toLocalDateTimeString(fechaInicio),
    };

    try {
      await comprarAnuncio(payload);
      console.log(payload)
      setMsg({ type: "success", text: "Compra realizada correctamente." });
      
      setTimeout(() => navigate("/app/anunciante/pagos-anuncios"), 500);
    } catch (e) {
      console.error(e.message);
      setMsg({ type: "danger", text: "No se pudo completar la compra. Revisa tu saldo o el backend." });
    }
  }

  return (
    <div className="container mt-4">
      <button className="btn btn-outline-secondary mb-3" onClick={() => navigate(-1)}>
        <i className="bi bi-arrow-left me-2"></i>
        Regresar
      </button>

      <h2 className="mb-3">
        Comprar anuncio #{id}
      </h2>

      {loading && (
        <div className="alert alert-info d-flex align-items-center gap-2">
          <div className="spinner-border spinner-border-sm" />
          <span>Cargando...</span>
        </div>
      )}

      {msg.text && <div className={`alert alert-${msg.type}`}>{msg.text}</div>}

      {!loading && anuncio && (
        <div className="card p-3 mb-3">
          <div className="d-flex flex-wrap gap-2 align-items-center justify-content-between">
            <div>
              <div className="fw-semibold">
                <i className="bi bi-megaphone me-2" />
                {anuncio?.tipoAnuncio?.codigo} — {anuncio?.estado}
              </div>
              <div className="text-muted small">
                {anuncio?.texto ? anuncio.texto.slice(0, 120) : "Sin texto"}
              </div>
            </div>

            <span className="badge text-bg-light border">
              <i className="bi bi-wallet2 me-1" />
              {Number(cartera?.saldo ?? 0).toFixed(2)} {cartera?.moneda ?? "GTQ"}
            </span>
          </div>
        </div>
      )}

      {!loading && (
        <div className="card p-3">
          <div className="row g-3 align-items-end">
            <div className="col-12 col-md-6">
              <label className="form-label">Precio / período</label>
              <select
                className="form-select"
                value={precioId}
                onChange={(e) => setPrecioId(e.target.value)}
                disabled={!tipoAnuncioId}
              >
                <option value="">-- Selecciona --</option>
                {(precios ?? []).map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.periodoAnuncio?.codigo} ({p.periodoAnuncio?.dias} días) — Q {p.precio}
                    {p.activo ? "  [VIGENTE]" : ""}
                  </option>
                ))}
              </select>
              <div className="form-text">
                Mostrando precios para el tipo: <b>{anuncio?.tipoAnuncio?.codigo ?? "—"}</b>
              </div>
            </div>

            <div className="col-12 col-md-4">
              <label className="form-label">Fecha inicio</label>
              <input
                type="datetime-local"
                className="form-control"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
              />
            </div>

            <div className="col-12 col-md-2 d-grid">
              <button className="btn btn-primary" onClick={handleComprar} disabled={!precioId || !fechaInicio}>
                <i className="bi bi-bag-check me-2" />
                Comprar
              </button>
            </div>
          </div>

          {precioSeleccionado && (
            <div className="alert alert-light border mt-3 mb-0">
              <div className="fw-semibold">
                Resumen:
              </div>
              <div className="small text-muted">
                Período: <b>{precioSeleccionado.periodoAnuncio?.codigo}</b> —{" "}
                {precioSeleccionado.periodoAnuncio?.dias} días | Precio: <b>Q {precioSeleccionado.precio}</b>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}