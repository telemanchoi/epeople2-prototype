import { lazy } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import CitizenLayout from '@/components/layout/CitizenLayout';
import BackofficeLayout from '@/components/layout/BackofficeLayout';

// ─── Lazy-load all pages ────────────────────────────────────────

// Auth
const LoginPage = lazy(() => import('@/pages/auth/LoginPage'));

// Citizen
const CitizenHomePage = lazy(() => import('@/pages/citizen/CitizenHomePage'));
const ComplaintListPage = lazy(
  () => import('@/pages/citizen/complaints/ComplaintListPage')
);
const ComplaintNewPage = lazy(
  () => import('@/pages/citizen/complaints/ComplaintNewPage')
);
const ComplaintDetailPage = lazy(
  () => import('@/pages/citizen/complaints/ComplaintDetailPage')
);
const ReportNewPage = lazy(
  () => import('@/pages/citizen/reports/ReportNewPage')
);
const ProposalListPage = lazy(
  () => import('@/pages/citizen/proposals/ProposalListPage')
);
const ProposalNewPage = lazy(
  () => import('@/pages/citizen/proposals/ProposalNewPage')
);
const ProposalDetailPage = lazy(
  () => import('@/pages/citizen/proposals/ProposalDetailPage')
);

// Backoffice
const DashboardPage = lazy(
  () => import('@/pages/backoffice/DashboardPage')
);
const WorklistPage = lazy(
  () => import('@/pages/backoffice/WorklistPage')
);
const ComplaintProcessPage = lazy(
  () => import('@/pages/backoffice/ComplaintProcessPage')
);
const StatisticsPage = lazy(
  () => import('@/pages/backoffice/StatisticsPage')
);
const HelpdeskListPage = lazy(
  () => import('@/pages/backoffice/HelpdeskListPage')
);

// Admin
const AdminDashboardPage = lazy(
  () => import('@/pages/admin/AdminDashboardPage')
);
const PerformancePage = lazy(
  () => import('@/pages/admin/PerformancePage')
);
const UserManagementPage = lazy(
  () => import('@/pages/admin/UserManagementPage')
);

// ─── Route Configuration ────────────────────────────────────────

export const router = createBrowserRouter([
  // Auth routes (no layout wrapper)
  {
    path: '/auth/login',
    element: <LoginPage />,
  },

  // Citizen routes
  {
    path: '/citizen',
    element: <CitizenLayout />,
    children: [
      { index: true, element: <CitizenHomePage /> },
      { path: 'complaints', element: <ComplaintListPage /> },
      { path: 'complaints/new', element: <ComplaintNewPage /> },
      { path: 'complaints/:id', element: <ComplaintDetailPage /> },
      { path: 'reports/new', element: <ReportNewPage /> },
      { path: 'proposals', element: <ProposalListPage /> },
      { path: 'proposals/new', element: <ProposalNewPage /> },
      { path: 'proposals/:id', element: <ProposalDetailPage /> },
    ],
  },

  // Backoffice routes (BRC officers)
  {
    path: '/backoffice',
    element: <BackofficeLayout />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'worklist', element: <WorklistPage /> },
      { path: 'complaints/:id', element: <ComplaintProcessPage /> },
      { path: 'statistics', element: <StatisticsPage /> },
      { path: 'helpdesk', element: <HelpdeskListPage /> },
    ],
  },

  // Admin routes (BCRC admin)
  {
    path: '/admin',
    element: <BackofficeLayout />,
    children: [
      { index: true, element: <AdminDashboardPage /> },
      { path: 'performance', element: <PerformancePage /> },
      { path: 'users', element: <UserManagementPage /> },
    ],
  },

  // Root redirect
  {
    path: '/',
    element: <Navigate to="/citizen" replace />,
  },

  // Catch-all
  {
    path: '*',
    element: <Navigate to="/citizen" replace />,
  },
]);
