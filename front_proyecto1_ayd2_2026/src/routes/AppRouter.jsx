import { Routes, Route, Navigate } from "react-router-dom";
import Login from "../pages/Login";
import Forbidden from "../pages/Forbidden";
import PrivateRoute from "./PrivateRoute";
import { isAuthenticated, getRole } from "../auth/authService";
import { getDashboardPathByRole } from "../auth/redirectByRole";

import AdminDashboard from "../pages/admin/AdminDashboard";
import EditorDashboard from "../pages/editor/EditorDashboard";
import SuscriptorDashboard from "../pages/suscriptor/SuscriptorDashboard";

import AdminHome from "../pages/admin/AdminHome";
import UsuariosPage from "../pages/admin/UsuariosPage";
import UsuarioCreatePage from "../pages/admin/UsuarioCreatePage";
import UsuarioEditPage from "../pages/admin/UsuarioEditPage";
import PerfilUser from "../pages/PerfilUser";
import BilleteraPage from "../pages/BilleteraPage";

import EditorHome from "../pages/editor/EditorHome";
import RevistasPage from "../pages/editor/RevistasPage";
import RevistaCreatePage from "../pages/editor/RevistaCreatePage";
import RevistaDetailPage from "../pages/editor/RevistaDetailPage";
import RevistaEditPage from "../pages/editor/RevistaEditPage";
import RevistaEtiquetasPage from "../pages/editor/RevistaEtiquetasPage";
import RevistaEdicionesPage from "../pages/editor/RevistaEdicionesPage";

import AdminRevistasPage from "../pages/admin/AdminRevistasPage";
import RevistaCostosPage from "../pages/admin/RevistaCostosPage";

import PagosRevistasPage from "../pages/editor/PagosRevistasPage";
import PagosEditorTodosPage from "../pages/editor/PagosEditorTodosPage";
import PagosRevistaDetailPage from "../pages/editor/PagosRevistaDetailPage";
import AdminCategoriasPage from "../pages/admin/AdminCategoriasPage";
import AdminEtiquetasPage from "../pages/admin/AdminEtiquetasPage";

import  AnuncianteDashboard  from "../pages/anunciante/AnuncianteDashboard";
import AnuncianteHome from "../pages/anunciante/AnuncianteHome";
import  AnuncianteAnunciosPage  from "../pages/anunciante/AnuncianteAnunciosPage";
import  AnuncianteAnuncioCreate  from "../pages/anunciante/AnuncianteAnuncioCreate";
import  AnuncianteAnuncioDetail  from "../pages/anunciante/AnuncianteAnuncioDetail";
import  AnuncianteAnuncioEdit  from "../pages/anunciante/AnuncianteAnuncioEdit";

import PeriodosPage from "../pages/admin/PeriodosPage";
import PeriodoDetallePage from "../pages/admin/PeriodoDetallePage";
import AsignarPrecioPage from "../pages/admin/AsignarPrecioPage";

import ComprarAnuncioPage from "../pages/anunciante/ComprarAnuncioPage";
import ComprasAnunciosPage from "../pages/anunciante/ComprasAnunciosPage";
import PagosAnuncioDetallePage from "../pages/anunciante/PagosAnuncioDetallePage";
import AdminAnunciosPage from "../pages/admin/AdminAnunciosPage";
import RevistaPrecioBloqueoPage from "../pages/admin/RevistaPrecioBloqueoPage";
import EditorRevistasBloqueosPage from "../pages/editor/EditorRevistasBloqueosPage";
import EditorRevistaBloquearPage from "../pages/editor/EditorRevistaBloquear"

import SuscriptorHome from "../pages/suscriptor/SuscriptorHome";
import RevistasGeneralSuscriptorPage from "../pages/suscriptor/RevistasGeneralSuscriptorPage";
import PerfilPublicPage from "../pages/suscriptor/PerfilPublicPage";
import RevistaEdicionesSuscriptorPage from "../pages/suscriptor/RevistaEdicionesSuscriptorPage";
import {CrearCuenta} from "../pages/CrearCuenta";

import RecuperarContrasenia from "../pages/RecuperarContrasenia";
import ReporteGananciasPage from "../pages/admin/reportes/ReporteGananciasPage";
import ReporteAnunciosCompradosPage from "../pages/admin/reportes/ReporteAnunciosCompradosPage";
import ReporteGananciasAnunciantesPage from "../pages/admin/reportes/ReporteGananciasAnunciantesPage";
import ReporteTopRevistasPage from "../pages/admin/reportes/ReporteTopRevistasPage";
import ReporteTopComentadasPage from "../pages/admin/reportes/ReporteTopComentadasPage";
import ReporteEfectividadAnunciosPage from "../pages/admin/reportes/ReporteEfectividadAnunciosPage";

import ReporteComentariosEditorPage from "../pages/editor/reportes/ReporteComentariosEditorPage";
import ReporteSuscripcionesEditorPage from "../pages/editor/reportes/ReporteSuscripcionesEditorPage";
import ReporteLikesTopEditorPage from "../pages/editor/reportes/ReporteLikesTopEditorPage";
import ReportePagosEditorPage from "../pages/editor/reportes/ReportePagosEditorPage";
export default function AppRouter() {
  const authed = isAuthenticated();

  return (
    <Routes>
      {/* Inicio */}
      <Route path="/" element={authed ? <Navigate to="/app" replace /> : <Login />} />
      <Route path="/login" element={<Login />} />
      <Route path="/forbidden" element={<Forbidden />} />
      <Route path="/crear-cuenta" element={<CrearCuenta />} />
      <Route path="/recuperar-contrasenia" element={<RecuperarContrasenia />} />

      {/* Protegidas */}
      <Route element={<PrivateRoute />}>
        {/* /app SOLO redirige según rol */}
        <Route
          path="/app"
          element={<Navigate to={getDashboardPathByRole(getRole())} replace />}
        />

        {/* ADMIN */}
        <Route element={<PrivateRoute roles={["ADMIN"]} />}>
          <Route path="/app/admin" element={<AdminDashboard />}>
            <Route index element={<AdminHome />} />
            <Route path="usuarios" element={<UsuariosPage />} />
            <Route path="usuarios/nuevo" element={<UsuarioCreatePage />} />
            <Route path="usuarios/editar/:id" element={<UsuarioEditPage />} />
            <Route path="perfil" element={<PerfilUser />} />
            <Route path="billetera" element={<BilleteraPage />} />

            <Route path="revistas" element={<AdminRevistasPage />} />
            <Route path="revistas/:id/ediciones" element={<RevistaEdicionesPage />} />
            <Route path="revistas/:id/costos" element={<RevistaCostosPage />} />
            <Route path="revistas/:id/precio-bloqueo" element={<RevistaPrecioBloqueoPage />} />

            <Route path="categorias" element={<AdminCategoriasPage />} />
            <Route path="etiquetas" element={<AdminEtiquetasPage />} />

            <Route path="periodos" element={<PeriodosPage />} />
            <Route path="periodos/:id" element={<PeriodoDetallePage />} />
            <Route path="precios/periodo/:periodoId" element={<AsignarPrecioPage />} />
            <Route path="anuncios" element={<AdminAnunciosPage />} />
            <Route path="anuncios/:id" element={<AnuncianteAnuncioDetail />} />
            <Route path="anuncios/:id/pagos" element={<PagosAnuncioDetallePage />} />  
                       
            
            
            <Route path="reportes" element={<AdminHome />} />
            <Route path="reportes/ganancias-revistas" element={<ReporteGananciasPage />} />
            <Route path="reportes/anuncios-comprados" element={<ReporteAnunciosCompradosPage />}/>
            <Route path="reportes/ganancias-por-anunciante" element={<ReporteGananciasAnunciantesPage />}/>
            <Route path="reportes/top-5-revistas-populares" element={<ReporteTopRevistasPage />}/>
            <Route path="reportes/top-5-revistas-comentadas" element={<ReporteTopComentadasPage />}/>
            <Route path="/app/admin/reportes/efectividad-anuncios" element={<ReporteEfectividadAnunciosPage />}/>
          </Route>
        </Route>

        {/* EDITOR */}
        <Route element={<PrivateRoute roles={["EDITOR"]} />}>
          <Route path="/app/editor" element={<EditorDashboard />}>
            <Route index element={<EditorHome />} />

            {/* revistas */}
            <Route path="revistas" element={<RevistasPage />} />
            <Route path="revistas/nueva" element={<RevistaCreatePage />} />
            <Route path="revistas/:id" element={<RevistaDetailPage />} />
            <Route path="revistas/:id/etiquetas" element={<RevistaEtiquetasPage />} />
            <Route path="revistas/:id/ediciones" element={<RevistaEdicionesPage />} />
            <Route path="revistas/:id/editar" element={<RevistaEditPage />} />


            <Route path="pagos-revistas" element={<PagosRevistasPage />} />
            <Route path="pagos-revistas/todos" element={<PagosEditorTodosPage />} />
            <Route path="pagos-revistas/revista/:id" element={<PagosRevistaDetailPage />} />



            <Route path="bloqueos-anuncios" element={<EditorRevistasBloqueosPage />} />

            <Route path="revistas/:id/bloqueos" element={<EditorRevistaBloquearPage />} />

            <Route path="billetera" element={<BilleteraPage />} />
            <Route path="perfil" element={<PerfilUser />} />

            {/* reportes */}

\
            <Route path="reportes" element={<EditorHome/>} />
            <Route path="reportes/comentarios" element={<ReporteComentariosEditorPage/>} />
            <Route path="reportes/suscripciones" element={<ReporteSuscripcionesEditorPage/>} />
            <Route path="reportes/top-gustadas" element={<ReporteLikesTopEditorPage/>} />
            <Route path="reportes/pagos" element={<ReportePagosEditorPage/>} />
          </Route>
        </Route>

        {/* SUSCRIPTOR */}
        <Route element={<PrivateRoute roles={["SUSCRIPTOR"]} />}>
          <Route path="/app/suscriptor" element={<SuscriptorDashboard />} >
            <Route index element={<SuscriptorHome />} />

            <Route path="perfil" element={<PerfilUser />} />
            <Route path="revistas" element={<RevistasGeneralSuscriptorPage />} />
            <Route path="perfil/:id" element={< PerfilPublicPage/>} />
            <Route path="revistas/:id/ediciones" element={<RevistaEdicionesSuscriptorPage />} />


          </Route>

        </Route>

        {/* ANUNCIANTE */}
        <Route element={<PrivateRoute roles={["ANUNCIANTE"]} />}>
          <Route path="/app/anunciante" element={<AnuncianteDashboard />}>
            <Route index element={<AnuncianteHome />} />

            {/* anuncios */}
            <Route path="anuncios" element={<AnuncianteAnunciosPage />} />
            <Route path="anuncios/nuevo" element={<AnuncianteAnuncioCreate />} />
            <Route path="anuncios/:id" element={<AnuncianteAnuncioDetail />} />
            <Route path="anuncios/:id/editar" element={<AnuncianteAnuncioEdit />} />

                        {/* Comprar */}
            <Route path="anuncios/:id/comprar" element={<ComprarAnuncioPage />} />

            {/* Mis compras */}
            <Route path="pagos-anuncios" element={<ComprasAnunciosPage />} />

<           Route path="anuncios/:id/pagos" element={<PagosAnuncioDetallePage />} />

            {/* billetera y perfil (reusá tus páginas existentes) */}
            <Route path="billetera" element={<BilleteraPage />} />
            <Route path="perfil" element={<PerfilUser />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<h2>404</h2>} />
    </Routes>
  );
}