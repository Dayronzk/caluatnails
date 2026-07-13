import { BrowserRouter } from "react-router-dom";
import { AppRoutes } from "./router";
import { I18nextProvider } from "react-i18next";
import i18n from "./i18n";
import { CartProvider } from "@/lib/CartContext";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";
import ScrollToTop from "@/components/ScrollToTop";
import RecoveryRedirect from "@/components/RecoveryRedirect";
import WhatsAppButton from "@/components/WhatsAppButton";


import { HelmetProvider } from "react-helmet-async";

function App() {
  return (
    <I18nextProvider i18n={i18n}>
      <HelmetProvider>
        <CartProvider>
          <BrowserRouter basename={__BASE_PATH__}>
            <ScrollToTop />
            <RecoveryRedirect />
            <AppRoutes />
            <WhatsAppButton />
          </BrowserRouter>
          <Analytics />
          <SpeedInsights />
        </CartProvider>
      </HelmetProvider>
    </I18nextProvider>
  );
}

export default App;
