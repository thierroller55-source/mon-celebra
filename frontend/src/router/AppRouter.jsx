import { Routes, Route } from 'react-router-dom';

import PublicLayout from '../layouts/PublicLayout.jsx';
import DashboardLayout from '../layouts/DashboardLayout.jsx';
import PrivateRoute from './PrivateRoute.jsx';

import Home from '../pages/Home.jsx';
import Login from '../pages/auth/Login.jsx';
import Register from '../pages/auth/Register.jsx';
import Dashboard from '../pages/dashboard/Dashboard.jsx';
import CreateEvent from '../pages/create/CreateEvent.jsx';
import NotFound from '../pages/public/NotFound.jsx';

export default function AppRouter() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route index element={<Home />} />
        <Route path="connexion" element={<Login />} />
        <Route path="inscription" element={<Register />} />
      </Route>

      <Route element={<PrivateRoute />}>
        <Route path="dashboard" element={<DashboardLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="creer" element={<CreateEvent />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
