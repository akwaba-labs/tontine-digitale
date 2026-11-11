import { AppLayout, PublicLayout } from '../shared/components/Layout';
import { ROUTES } from './routePaths';
import NotFoundPage from './NotFoundPage';
import HomePage from '../features/home/pages/HomePage';
import LoginPage from '../features/auth/pages/LoginPage';
import RegisterPage from '../features/auth/pages/RegisterPage';
import ForgotPasswordPage from '../features/auth/pages/ForgotPasswordPage';
import ProfilePage from '../features/auth/pages/ProfilePage';
import SettingsPage from '../features/auth/pages/SettingsPage';
import JoinTontinePage from '../features/members/pages/JoinTontinePage';
import DashboardPage from '../features/dashboard/pages/DashboardPage';
import TontineListPage from '../features/tontines/pages/TontineListPage';
import CreateTontinePage from '../features/tontines/pages/CreateTontinePage';
import TontineDetailPage from '../features/tontines/pages/TontineDetailPage';
import DeclarePaymentPage from '../features/contributions/pages/DeclarePaymentPage';
import NotificationsPage from '../features/notifications/pages/NotificationsPage';

// Définition des routes, partagée entre l'application et les tests.
// Phase 3 : les routes de AppLayout seront protégées (connexion obligatoire).
export const appRoutes = [
  {
    element: <PublicLayout />,
    children: [
      { path: ROUTES.home, element: <HomePage /> },
      { path: ROUTES.login, element: <LoginPage /> },
      { path: ROUTES.register, element: <RegisterPage /> },
      { path: ROUTES.forgotPassword, element: <ForgotPasswordPage /> },
      { path: ROUTES.join, element: <JoinTontinePage /> },
      { path: ROUTES.joinWithCode, element: <JoinTontinePage /> },
    ],
  },
  {
    element: <AppLayout />,
    children: [
      { path: ROUTES.dashboard, element: <DashboardPage /> },
      { path: ROUTES.tontines, element: <TontineListPage /> },
      { path: ROUTES.createTontine, element: <CreateTontinePage /> },
      { path: ROUTES.tontineDetail, element: <TontineDetailPage /> },
      { path: ROUTES.declarePayment, element: <DeclarePaymentPage /> },
      { path: ROUTES.notifications, element: <NotificationsPage /> },
      { path: ROUTES.profile, element: <ProfilePage /> },
      { path: ROUTES.settings, element: <SettingsPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
];
