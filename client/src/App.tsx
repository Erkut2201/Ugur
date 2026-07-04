// client/src/App.tsx
import { Switch, Route, Redirect } from "wouter";
import { useAuth } from "./hooks/useAuth.js";
import LoginPage from "./pages/LoginPage.js";
import Layout from "./components/Layout.js";
import DashboardPage from "./pages/DashboardPage.js";
import CustomersPage from "./pages/CustomersPage.js";
import { CookieConsentProvider } from "./public/hooks/useCookieConsent.js";
import CookieConsentBanner from "./public/components/CookieConsentBanner.js";
import QuotesPage from "./pages/QuotesPage.js";
import InvoicesPage from "./pages/InvoicesPage.js";
import ProtocolsPage from "./pages/ProtocolsPage.js";
import DocumentsPage from "./pages/DocumentsPage.js";
import ServicesPage from "./pages/ServicesPage.js";
import InquiriesPage from "./pages/InquiriesPage.js";
import HomePage from "./public/pages/HomePage.js";
import SimplePage from "./public/pages/SimplePage.js";
import ProductPage from "./public/pages/ProductPage.js";
import ProductsOverviewPage from "./public/pages/ProductsOverviewPage.js";
import InfoPage from "./public/pages/InfoPage.js";
import ContactPage from "./public/pages/ContactPage.js";
import OfferPage from "./public/pages/OfferPage.js";
import { productPages } from "./public/content/products.js";
import { companyPage, imprintPage, privacyPage, termsPage } from "./public/content/infoPages.js";
import { actionsPage, galleryPage } from "./public/content/extraPages.js";
import KarrierePage from "./public/pages/KarrierePage.js";

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


export default function App() {
  return (
    <CookieConsentProvider>
      <Switch>
        {/* ── Interne Routen (B2B-Portal) ── */}
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

        {/* ── Öffentliche Routen (Website) ── */}
        <Route path="/" component={HomePage} />
        <Route path="/produkte" component={ProductsOverviewPage} />
        {productPages.map((product) => (
          <Route key={product.slug} path={`/${product.slug}`}>
            <ProductPage product={product} />
          </Route>
        ))}
        <Route path="/unternehmen">
          <InfoPage page={companyPage} />
        </Route>
        <Route path="/kontakt" component={ContactPage} />
        <Route path="/angebot-anfragen" component={OfferPage} />
        <Route path="/aktionen">
          <SimplePage eyebrow={actionsPage.eyebrow} title={actionsPage.title} description={actionsPage.description} />
        </Route>
        <Route path="/galerie">
          <SimplePage eyebrow={galleryPage.eyebrow} title={galleryPage.title} description={galleryPage.description} />
        </Route>
        <Route path="/karriere" component={KarrierePage} />
        <Route path="/impressum">
          <InfoPage page={imprintPage} />
        </Route>
        <Route path="/datenschutz">
          <InfoPage page={privacyPage} />
        </Route>
        <Route path="/agb">
          <InfoPage page={termsPage} />
        </Route>

        {/* Fallback */}
        <Route>
          <Redirect to="/" />
        </Route>
      </Switch>
      <CookieConsentBanner />
    </CookieConsentProvider>
  );
}
