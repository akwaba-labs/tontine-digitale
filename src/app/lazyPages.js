import { lazy } from 'react';

// Pages chargées à la demande : l'application reste légère sur les connexions lentes.
export const LoginPage = lazy(() => import('../features/auth/pages/LoginPage'));
export const RegisterPage = lazy(() => import('../features/auth/pages/RegisterPage'));
export const ForgotPasswordPage = lazy(() => import('../features/auth/pages/ForgotPasswordPage'));
export const ProfilePage = lazy(() => import('../features/auth/pages/ProfilePage'));
export const SettingsPage = lazy(() => import('../features/auth/pages/SettingsPage'));
export const JoinTontinePage = lazy(() => import('../features/members/pages/JoinTontinePage'));
export const DashboardPage = lazy(() => import('../features/dashboard/pages/DashboardPage'));
export const TontineListPage = lazy(() => import('../features/tontines/pages/TontineListPage'));
export const CreateTontinePage = lazy(() => import('../features/tontines/pages/CreateTontinePage'));
export const TontineDetailPage = lazy(() => import('../features/tontines/pages/TontineDetailPage'));
export const EditTontinePage = lazy(() => import('../features/tontines/pages/EditTontinePage'));
export const DeclarePaymentPage = lazy(
  () => import('../features/contributions/pages/DeclarePaymentPage'),
);
export const OrganizerPage = lazy(() => import('../features/organizer/pages/OrganizerPage'));
export const NotificationsPage = lazy(
  () => import('../features/notifications/pages/NotificationsPage'),
);
