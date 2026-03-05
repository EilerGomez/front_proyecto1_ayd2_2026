import { useEffect, useState } from "react";
import { getPeriodos } from "../../services/periodos.service";
import { Link } from "react-router-dom";

export default function PeriodosPage() {
  const [periodos, setPeriodos] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const data = await getPeriodos();
    setPeriodos(data);
  }

  return (
    <div className="container mt-4">
      <h2>Períodos de Anuncios</h2>

      <table className="table table-bordered align-middle">
        <thead className="table-light">
          <tr>
            <th>ID</th>
            <th>Código</th>
            <th>Días</th>
            <th className="text-center">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {periodos.map((p) => (
            <tr key={p.id}>
              <td>{p.id}</td>
              <td>{p.codigo}</td>
              <td>{p.dias}</td>

              <td className="text-center d-flex gap-2 justify-content-center">
                <Link
                  to={`/app/admin/periodos/${p.id}`}
                  state={{ periodoItem: p }}
                  className="btn btn-sm btn-outline-primary"
                >
                  <i className="bi bi-eye me-1"></i>
                  Ver
                </Link>

                <Link
                  to={`/app/admin/precios/periodo/${p.id}`}
                  state={{ periodoItem: p }}
                  className="btn btn-sm btn-success"
                >
                  <i className="bi bi-cash-stack me-1"></i>
                  Asignar precios
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}