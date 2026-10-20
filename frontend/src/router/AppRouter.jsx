import { Routes, Route, Navigate, Outlet, useParams } from 'react-router-dom';

import PublicLayout from '../layouts/PublicLayout.jsx';
import DashboardLayout from '../layouts/DashboardLayout.jsx';
import AdminLayout from '../layouts/AdminLayout.jsx';
import ClientRoute from './ClientRoute.jsx';
import AdminRoute from './AdminRoute.jsx';
import { isLocale } from '../i18n/config.js';

import Home from '../pages/Home.jsx';
import Login from '../pages/auth/Login.jsx';
import Register from '../pages/auth/Register.jsx';
import Signup from '../pages/auth/Signup.jsx';
import ForgotPassword from '../pages/auth/ForgotPassword.jsx';
import ResetPassword from '../pages/auth/ResetPassword.jsx';
import VerifyEmail from '../pages/auth/VerifyEmail.jsx';
import Dashboard from '../pages/dashboard/Dashboard.jsx';
import EventManage from '../pages/dashboard/EventManage.jsx';
import EventEdit from '../pages/dashboard/EventEdit.jsx';
import EventPreview from '../pages/dashboard/EventPreview.jsx';
import CreateEvent from '../pages/create/CreateEvent.jsx';
import ChooseCategory from '../pages/create/ChooseCategory.jsx';
import Graduation from '../pages/create/Graduation.jsx';
import Fiancailles from '../pages/create/Fiancailles.jsx';
import Soiree from '../pages/create/Soiree.jsx';
import BabyShower from '../pages/create/BabyShower.jsx';
import Inauguration from '../pages/create/Inauguration.jsx';
import EvenementProfessionnel from '../pages/create/EvenementProfessionnel.jsx';
import Commemoration from '../pages/create/Commemoration.jsx';
import Autres from '../pages/create/Autres.jsx';
import EventPublic from '../pages/public/EventPublic.jsx';
import NotFound from '../pages/public/NotFound.jsx';
import AdminHome from '../pages/admin/AdminHome.jsx';
import AdminUsers from '../pages/admin/AdminUsers.jsx';
import AdminEvents from '../pages/admin/AdminEvents.jsx';
import AdminReports from '../pages/admin/AdminReports.jsx';
import AdminCategories from '../pages/admin/AdminCategories.jsx';
import AdminTemplates from '../pages/admin/AdminTemplates.jsx';
import MonCompte from '../pages/dashboard/MonCompte.jsx';

/** Garde de locale : n'accepte que fr | en | wo, sinon redirige vers la racine. */
function LocaleLayout() {
  const { locale } = useParams();
  if (!isLocale(locale)) return <Navigate to="/" replace />;
  return <Outlet />;
}

/**
 * Arbre de routes partage : monte a la racine (URLs historiques deja
 * partagees, QR codes) ET sous /:locale (fr | en | wo).
 */
function renderRouteTree() {
  return (
    <>
      <Route element={<PublicLayout />}>
        <Route index element={<Home />} />
        <Route path="categories" element={<ChooseCategory />} />
        <Route path="e/:slug" element={<EventPublic />} />
        <Route path="connexion" element={<Login />} />
        <Route path="inscription" element={<Register />} />
        <Route path="inscription-invite" element={<Signup />} />
        <Route path="mot-de-passe-oublie" element={<ForgotPassword />} />
        <Route path="reinitialiser-mot-de-passe/:token" element={<ResetPassword />} />
        <Route path="verifier-email/:token" element={<VerifyEmail />} />
      </Route>

      <Route element={<ClientRoute />}>
        <Route path="dashboard" element={<DashboardLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="creer" element={<ChooseCategory />} />
          <Route path="creer/graduation" element={<Graduation />} />
          <Route path="creer/fiancailles" element={<Fiancailles />} />
          <Route path="creer/soiree" element={<Soiree />} />
          <Route path="creer/baby-shower" element={<BabyShower />} />
          <Route path="creer/inauguration" element={<Inauguration />} />
          <Route path="creer/evenement-professionnel" element={<EvenementProfessionnel />} />
          <Route path="creer/commemoration" element={<Commemoration />} />
          <Route path="creer/autres" element={<Autres />} />
          <Route path="creer/:categorySlug" element={<CreateEvent />} />
          <Route path="evenements/:id" element={<EventManage />} />
          <Route path="evenements/:id/editer" element={<EventEdit />} />
          <Route path="evenements/:id/apercu" element={<EventPreview />} />
          <Route path="compte" element={<MonCompte />} />
        </Route>
      </Route>

      <Route element={<AdminRoute />}>
        <Route path="admin" element={<AdminLayout />}>
          <Route index element={<AdminHome />} />
          <Route path="utilisateurs" element={<AdminUsers />} />
          <Route path="evenements" element={<AdminEvents />} />
          <Route path="signalements" element={<AdminReports />} />
          <Route path="categories" element={<AdminCategories />} />
          <Route path="templates" element={<AdminTemplates />} />
        </Route>
      </Route>
    </>
  );
}

export default function AppRouter() {
  return (
    <Routes>
      {renderRouteTree()}

      <Route path=":locale" element={<LocaleLayout />}>
        {renderRouteTree()}
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
