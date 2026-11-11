import { AppLayout, PublicLayout } from '../shared/components/Layout';
import { ROUTES } from './routePaths';
import { RedirectIfAuthenticated, RequireAuth } from './RouteGuards';
import NotFoundPage from './NotFoundPage';
import HomePage from '../features/home/pages/HomePage';
import {
  LoginPage,
  RegisterPage,
  ForgotPasswordPage,
  ProfilePage,
  SettingsPage,
  JoinTontinePage,
  DashboardPage,
  TontineListPage,
  CreateTontinePage,
  TontineDetailPage,
  EditTontinePage,
  DeclarePaymentPage,
  NotificationsPage,
} from './lazyPages';

// Définition des routes, partagée entre l'application et les tests.
export const appRoutes = [
  {
    element: <PublicLayout />,
    children: [
      { path: ROUTES.home, element: <HomePage /> },
      {
        element: <RedirectIfAuthenticated />,
        children: [
          { path: ROUTES.login, element: <LoginPage /> },
          { path: ROUTES.register, element: <RegisterPage /> },
          { path: ROUTES.forgotPassword, element: <ForgotPasswordPage /> },
        ],
      },
    ],
  },
  {
    element: <RequireAuth />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: ROUTES.join, element: <JoinTontinePage /> },
          { path: ROUTES.joinWithCode, element: <JoinTontinePage /> },
          { path: ROUTES.dashboard, element: <DashboardPage /> },
          { path: ROUTES.tontines, element: <TontineListPage /> },
          { path: ROUTES.createTontine, element: <CreateTontinePage /> },
          { path: ROUTES.tontineDetail, element: <TontineDetailPage /> },
          { path: ROUTES.editTontine, element: <EditTontinePage /> },
          { path: ROUTES.declarePayment, element: <DeclarePaymentPage /> },
          { path: ROUTES.notifications, element: <NotificationsPage /> },
          { path: ROUTES.profile, element: <ProfilePage /> },
          { path: ROUTES.settings, element: <SettingsPage /> },
        ],
      },
    ],
  },
  { element: <AppLayout />, children: [{ path: '*', element: <NotFoundPage /> }] },
];
