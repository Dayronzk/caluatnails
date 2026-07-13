import type { RouteObject } from "react-router-dom";
import NotFound from "../pages/NotFound";
import Home from "../pages/home/page";
import ModulePage from "../pages/module/page";
import AdminDashboard from "../pages/admin/page";
import AdminModules from "../pages/admin/modules/page";
import AdminLessons from "../pages/admin/lessons/page";
import AdminStudents from "../pages/admin/students/page";
import AdminClientesPage from "../pages/admin/clientes/page";
import AdminSettings from "../pages/admin/settings/page";
import AdminForum from "../pages/admin/forum/page";
import AdminTags from "../pages/admin/tags/page";
import AdminServiciosPage from "../pages/admin/servicios/page";
import AdminAgendaPage from "../pages/admin/agenda/page";
import AdminWhatsAppPage from "../pages/admin/whatsapp/page";
import AdminCuponesPage from "../pages/admin/cupones/page";
import AdminReferidosPage from "../pages/admin/referidos/page";
import AdminTiendaPage from "../pages/admin/tienda/page";
import AdminInventarioPage from "../pages/admin/inventario/page";
import AdminGastosPage from "../pages/admin/gastos/page";
import AdminIngresosPage from "../pages/admin/ingresos/page";
import AdminCampanasPage from "../pages/admin/campanas/page";
import AdminNotificacionesPage from "../pages/admin/notificaciones/page";
import AdminGarantiasPage from "../pages/admin/garantias/page";
import TiendaPage from "../pages/tienda/page";
import ProfesionalesPage from "../pages/profesionales/page";
import ReservarPage from "../pages/reservar/page";
import MisCitasPage from "../pages/mis-citas/page";
import RegistroPage from "../pages/auth/registro/page";
import LoginPage from "../pages/auth/login/page";
import RecuperarPage from "../pages/auth/recuperar/page";
import NuevaContrasenaPage from "../pages/auth/nueva-contrasena/page";
import AccountPage from "../pages/account/page";
import FaqPage from "../pages/soporte/faq/page";
import ContactoPage from "../pages/soporte/contacto/page";
import PrivacidadPage from "../pages/soporte/privacidad/page";
import TerminosPage from "../pages/soporte/terminos/page";
import ConfirmarEmailPage from "../pages/auth/confirmar-email/page";
import CertificadoPublicoPage from "../pages/certificado/page";
import ServiceLandingPage from "../pages/servicios/slug/page";
import AllServicesPage from "../pages/servicios/page";
import BlogListPage from "../pages/blog/page";
import AllSubscriptionsPage from "../pages/suscripciones/page";
import AdminSubscriptionsPage from "../pages/admin/suscripciones/page";
import BlogPostPage from "../pages/blog/slug/page";
import InvitaLandingPage from "../pages/invita/code/page";
import TarjetaRegaloPage from "../pages/tarjeta-regalo/page";
import AportacionPage from "../pages/tarjeta-regalo/aportacion/page";
import PromocionesPage from "../pages/promociones/page";
import SedeEixamplePage from "../pages/sede-eixample/page";
import ProtectedRoute from "../components/feature/ProtectedRoute";
import AdminRoute from "../components/feature/AdminRoute";

const routes: RouteObject[] = [
  {
    path: "/",
    element: <Home />,
  },
  {
    path: "/modulo/:id",
    element: (
      <ProtectedRoute>
        <ModulePage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/admin",
    element: (
      <AdminRoute>
        <AdminDashboard />
      </AdminRoute>
    ),
  },
  {
    path: "/admin/modulos",
    element: (
      <AdminRoute>
        <AdminModules />
      </AdminRoute>
    ),
  },
  {
    path: "/admin/lecciones",
    element: (
      <AdminRoute>
        <AdminLessons />
      </AdminRoute>
    ),
  },
  {
    path: "/admin/estudiantes",
    element: (
      <AdminRoute>
        <AdminStudents />
      </AdminRoute>
    ),
  },
  {
    path: "/admin/clientes",
    element: (
      <AdminRoute>
        <AdminClientesPage />
      </AdminRoute>
    ),
  },
  {
    path: "/admin/foro",
    element: (
      <AdminRoute>
        <AdminForum />
      </AdminRoute>
    ),
  },
  {
    path: "/admin/etiquetas",
    element: (
      <AdminRoute>
        <AdminTags />
      </AdminRoute>
    ),
  },
  {
    path: "/admin/configuracion",
    element: (
      <AdminRoute>
        <AdminSettings />
      </AdminRoute>
    ),
  },
  {
    path: "/admin/servicios",
    element: (
      <AdminRoute>
        <AdminServiciosPage />
      </AdminRoute>
    ),
  },
  {
    path: "/admin/agenda",
    element: (
      <AdminRoute>
        <AdminAgendaPage />
      </AdminRoute>
    ),
  },
  {
    path: "/admin/whatsapp",
    element: (
      <AdminRoute>
        <AdminWhatsAppPage />
      </AdminRoute>
    ),
  },
  {
    path: "/admin/cupones",
    element: (
      <AdminRoute>
        <AdminCuponesPage />
      </AdminRoute>
    ),
  },
  {
    path: "/admin/referidos",
    element: (
      <AdminRoute>
        <AdminReferidosPage />
      </AdminRoute>
    ),
  },
  {
    path: "/admin/inventario",
    element: (
      <AdminRoute>
        <AdminInventarioPage />
      </AdminRoute>
    ),
  },
  {
    path: "/admin/gastos",
    element: (
      <AdminRoute>
        <AdminGastosPage />
      </AdminRoute>
    ),
  },
  {
    path: "/admin/ingresos",
    element: (
      <AdminRoute>
        <AdminIngresosPage />
      </AdminRoute>
    ),
  },
  {
    path: "/admin/tienda",
    element: (
      <AdminRoute>
        <AdminTiendaPage />
      </AdminRoute>
    ),
  },
  {
    path: "/admin/campanas",
    element: (
      <AdminRoute>
        <AdminCampanasPage />
      </AdminRoute>
    ),
  },
  {
    path: "/admin/notificaciones",
    element: (
      <AdminRoute>
        <AdminNotificacionesPage />
      </AdminRoute>
    ),
  },
  {
    path: "/admin/garantias",
    element: (
      <AdminRoute>
        <AdminGarantiasPage />
      </AdminRoute>
    ),
  },
  {
    path: "/admin/suscripciones",
    element: (
      <AdminRoute>
        <AdminSubscriptionsPage />
      </AdminRoute>
    ),
  },
  {
    path: "/tienda",
    element: <TiendaPage />,
  },
  {
    path: "/reservar",
    element: <ReservarPage />,
  },
  {
    path: "/mis-citas",
    element: <MisCitasPage />,
  },
  {
    path: "/profesionales",
    element: <ProfesionalesPage />,
  },
  {
    path: "/registro",
    element: <RegistroPage />,
  },
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/recuperar",
    element: <RecuperarPage />,
  },
  {
    path: "/nueva-contrasena",
    element: <NuevaContrasenaPage />,
  },
  {
    path: "/confirmar-email",
    element: <ConfirmarEmailPage />,
  },
  {
    path: "/mi-cuenta",
    element: <AccountPage />,
  },
  {
    path: "/faq",
    element: <FaqPage />,
  },
  {
    path: "/contacto",
    element: <ContactoPage />,
  },
  {
    path: "/privacidad",
    element: <PrivacidadPage />,
  },
  {
    path: "/terminos",
    element: <TerminosPage />,
  },
  {
    path: "/certificado/:certId",
    element: <CertificadoPublicoPage />,
  },
  {
    path: "/invita/:code",
    element: <InvitaLandingPage />,
  },
  {
    path: "/servicios",
    element: <AllServicesPage />,
  },
  {
    path: "/suscripciones",
    element: <AllSubscriptionsPage />,
  },
  {
    path: "/servicios/:slug",
    element: <ServiceLandingPage />,
  },
  {
    path: "/blog",
    element: <BlogListPage />,
  },
  {
    path: "/blog/:slug",
    element: <BlogPostPage />,
  },
  {
    path: "/tarjeta-regalo",
    element: <TarjetaRegaloPage />,
  },
  {
    path: "/tarjeta-regalo/exito",
    element: <TarjetaRegaloPage />,
  },
  {
    path: "/tarjeta-regalo/aportacion/:codigo",
    element: <AportacionPage />,
  },
  {
    path: "/promociones",
    element: <PromocionesPage />,
  },
  {
    path: "/sede-eixample",
    element: <SedeEixamplePage />,
  },
  {
    path: "*",
    element: <NotFound />,
  },
];

export default routes;
