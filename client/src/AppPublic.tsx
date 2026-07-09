import { Switch, Route, Redirect } from "wouter";
import { CookieConsentProvider } from "./public/hooks/useCookieConsent.js";
import CookieConsentBanner from "./public/components/CookieConsentBanner.js";
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

function PublicRoutes() {
  return (
    <Switch>
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
      <Route>
        <Redirect to="/" />
      </Route>
    </Switch>
  );
}

export default function AppPublic() {
  return (
    <CookieConsentProvider>
      <PublicRoutes />
      <CookieConsentBanner />
    </CookieConsentProvider>
  );
}
