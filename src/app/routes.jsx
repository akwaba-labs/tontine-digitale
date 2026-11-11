import { AppLayout, PublicLayout } from '../shared/components/Layout';
import { ROUTES } from './routePaths';
import { Suspense } from 'react';
import Loader from '../shared/components/Loader';
import { RedirectIfAuthenticated, RequireAdmin, RequireAuth } from './RouteGuards';
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
  OrganizerPage,
  AdminLayout,
  AdminOverviewPage,
  AdminUsersPage,
  AdminTontinesPage,
  AdminMailsPage,
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
          { path: ROUTES.organizer, element: <OrganizerPage /> },
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
      {
        // Back-office de la plateforme (administrateurs uniquement).
        element: <RequireAdmin />,
        children: [
          {
            element: (
              <Suspense fallback={<Loader fullPage />}>
                <AdminLayout />
              </Suspense>
            ),
            children: [
              { path: ROUTES.admin, element: <AdminOverviewPage /> },
              { path: ROUTES.adminUsers, element: <AdminUsersPage /> },
              { path: ROUTES.adminTontines, element: <AdminTontinesPage /> },
              { path: ROUTES.adminTontineDetail, element: <TontineDetailPage /> },
              { path: ROUTES.adminMails, element: <AdminMailsPage /> },
            ],
          },
        ],
      },
    ],
  },
  { element: <PublicLayout />, children: [{ path: '*', element: <NotFoundPage /> }] },
];
