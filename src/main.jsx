import React, { useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider, Navigate, useParams } from 'react-router-dom';
import './styles.css';
import { AppShell } from './ui/AppShell.jsx';
import { Login } from './pages/Login.jsx';
import { Homes } from './pages/Homes.jsx';
import { HomeDetail } from './pages/HomeDetail.jsx';
import { CreateHome } from './pages/CreateHome.jsx';
import { EditHome } from './pages/EditHome.jsx';
import { CreateRoom } from './pages/CreateRoom.jsx';
import { EditRoom } from './pages/EditRoom.jsx';
import { Settings } from './pages/Settings.jsx';
import { CreateInvoice } from './pages/CreateInvoice.jsx';
import { InvoiceList } from './pages/InvoiceList.jsx';
import { InvoiceView } from './pages/InvoiceView.jsx';
import { Chart } from './pages/Chart.jsx';
import { NotFound } from './pages/NotFound.jsx';

const isAuthed = () => {
  try { return !!sessionStorage.getItem('authAccountId'); } catch { return false; }
};

const Protected = ({ children }) => {
  if (!isAuthed()) return <NotFound />;
  return children;
};

const getAuthAccountId = () => {
  try { return sessionStorage.getItem('authAccountId'); } catch { return null; }
};

// Wrapper route that only renders AppShell when :accountId matches logged-in account
const AccountRouteWrapper = () => {
  const { accountId } = useParams();
  const authId = getAuthAccountId();
  if (!authId) return <NotFound />;
  if (String(authId) !== String(accountId)) return <NotFound />;
  return (
    <AppShell />
  );
};

// Full-screen 404 for any unmatched deeper paths under a valid account
const AccountSplatNotFound = () => {
  return <NotFound />;
};
// Wrapper for Invoice detail route:
// - Not logged in: show InvoiceView without AppShell (no header/sidebar)
// - Logged in: render inside AppShell
const InvoiceRouteWrapper = () => {
  return isAuthed() ? (
    <AppShell>
      <InvoiceView />
    </AppShell>
  ) : (
    <InvoiceView />
  );
};

// Logout route clears session and redirects to /login
const Logout = () => {
  useEffect(() => {
    try { sessionStorage.removeItem('authAccountId'); } catch {}
  }, []);
  return <Navigate to="/login" replace />;
};

const router = createBrowserRouter([
  {
    path: '/',
    element: <Login />,
  },
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/logout',
    element: <Logout />,
  },
  // When missing accountId, show full-screen 404 (outside AppShell)
  {
    path: '/app/homes',
    element: <NotFound />,
  },
  {
    path: '/app',
    element: (
      <Protected>
        <AppShell />
      </Protected>
    ),
    children: [
      // Nested catch-all: render 404 inside AppShell for unknown /app routes (non-homes)
      { path: '*', element: <NotFound /> },
    ],
  },
  // Account-scoped routes: show AppShell only when account matches; otherwise full-screen 404
  {
    path: '/app/homes/:accountId',
    element: <AccountRouteWrapper />,
    children: [
      { index: true, element: <Homes /> },
      { path: 'new', element: <CreateHome /> },
      { path: ':homeId', element: <HomeDetail /> },
      { path: ':homeId/edit', element: <EditHome /> },
      { path: ':homeId/rooms/new', element: <CreateRoom /> },
      { path: ':homeId/rooms/:roomId/edit', element: <EditRoom /> },
      { path: ':homeId/settings', element: <Settings /> },
      { path: ':homeId/invoices/new', element: <CreateInvoice /> },
      { path: ':homeId/invoices', element: <InvoiceList /> },
      { path: ':homeId/chart', element: <Chart /> },
    ],
  },
  // Any other path under /app/homes/:accountId/** becomes full-screen 404 (outside AppShell)
  {
    path: '/app/homes/:accountId/*',
    element: <AccountSplatNotFound />,
  },
  // Invoice detail route (public view allowed)
  {
    path: '/app/homes/:accountId/:homeId/invoices/:invoiceId',
    element: <InvoiceRouteWrapper />,
  },
  // Catch-all 404
  {
    path: '*',
    element: <NotFound />,
  },
]);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);


