import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { GuidedDemoOverlay } from './components/GuidedDemoOverlay';

import { Home } from './pages/Home';
import { OfflineCheckPage } from './pages/OfflineCheckPage';
import { MunafaMeterPage } from './pages/MunafaMeterPage';
import { SmartBandPage } from './pages/SmartBandPage';
import { AutopilotPage } from './pages/AutopilotPage';
import { SKUHealthPage } from './pages/SKUHealthPage';
import { SettlementPage } from './pages/SettlementPage';

// Scroll to top component on route change
const ScrollToTop = () => {
  const { pathname } = useLocation();
  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

export const AppContent: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-[#F5F6F8]">
      <ScrollToTop />
      <Navbar />

      <main className="flex-grow max-w-[1280px] w-full mx-auto px-6 pt-6">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/offline-check" element={<OfflineCheckPage />} />
          <Route path="/munafa-meter" element={<MunafaMeterPage />} />
          <Route path="/smart-band" element={<SmartBandPage />} />
          <Route path="/autopilot" element={<AutopilotPage />} />
          <Route path="/sku-health" element={<SKUHealthPage />} />
          <Route path="/settlement" element={<SettlementPage />} />
        </Routes>
      </main>

      <Footer />
      <GuidedDemoOverlay />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <Router>
        <AppContent />
      </Router>
    </AppProvider>
  );
}
