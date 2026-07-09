import { Switch, Route, Redirect } from "wouter";
import { useAuth } from "./hooks/useAuth.js";
import LoginPage from "./pages/LoginPage.js";
import Layout from "./components/Layout.js";
import DashboardPage from "./pages/DashboardPage.js";
import CustomersPage from "./pages/CustomersPage.js";
import QuotesPage from "./pages/QuotesPage.js";
import InvoicesPage from "./pages/InvoicesPage.js";
import ProtocolsPage from "./pages/ProtocolsPage.js";
import DocumentsPage from "./pages/DocumentsPage.js";
import ServicesPage from "./pages/ServicesPage.js";
import CatalogPage from "./pages/CatalogPage.js";
import AufmassPage from "./pages/AufmassPage.js";
import InquiriesPage from "./pages/InquiriesPage.js";

function PrivateRoute({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-dark">
        <div className="text-gray-400">Laden...</div>
      </div>
    );
  }
  if (!isAuthenticated) return <Redirect to="/login" />;
  return <Layout>{children}</Layout>;
}

export default function AppPortal() {
  return (
    <Switch>
      <Route path="/login" component={LoginPage} />
      <Route path="/dashboard">
        <PrivateRoute>
          <DashboardPage />
        </PrivateRoute>
      </Route>
      <Route path="/admin">
        <PrivateRoute>
          <DashboardPage />
        </PrivateRoute>
      </Route>
      <Route path="/inquiries">
        <PrivateRoute>
          <InquiriesPage />
        </PrivateRoute>
      </Route>
      <Route path="/customers">
        <PrivateRoute>
          <CustomersPage />
        </PrivateRoute>
      </Route>
      <Route path="/quotes">
        <PrivateRoute>
          <QuotesPage />
        </PrivateRoute>
      </Route>
      <Route path="/invoices">
        <PrivateRoute>
          <InvoicesPage />
        </PrivateRoute>
      </Route>
      <Route path="/protocols">
        <PrivateRoute>
          <ProtocolsPage />
        </PrivateRoute>
      </Route>
      <Route path="/documents">
        <PrivateRoute>
          <DocumentsPage />
        </PrivateRoute>
      </Route>
      <Route path="/services">
        <PrivateRoute>
          <ServicesPage />
        </PrivateRoute>
      </Route>
      <Route path="/catalog">
        <PrivateRoute>
          <CatalogPage />
        </PrivateRoute>
      </Route>
      <Route path="/aufmass">
        <PrivateRoute>
          <AufmassPage />
        </PrivateRoute>
      </Route>
      <Route>
        <Redirect to="/login" />
      </Route>
    </Switch>
  );
}
