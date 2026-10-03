import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { RefreshCw, PlayCircle } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { lang, setLang, t, resetDemo, startGuidedDemo } = useApp();
  const location = useLocation();
  const navigate = useNavigate();

  const navLinks = [
    { path: '/', label: t('nav.home') },
    { path: '/munafa-meter', label: t('nav.munafaMeter') },
    { path: '/smart-band', label: t('nav.smartBand') },
    { path: '/autopilot', label: t('nav.autopilot') },
    { path: '/sku-health', label: t('nav.skuHealth') },
    { path: '/settlement', label: t('nav.settlement') },
  ];

  const toggleLanguage = () => {
    setLang(lang === 'en' ? 'hi' : 'en');
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-[#E6E6EB] shadow-xs h-[80px] flex items-center">
      <div className="max-w-[1280px] w-full mx-auto px-6 flex items-center justify-between">
        {/* Left: Brand logo */}
        <Link to="/" className="flex flex-col group">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-[#5B0F4E] flex items-center justify-center text-white font-bold text-lg shadow-xs">
              S
            </div>
            <span className="text-2xl font-bold tracking-tight text-[#5B0F4E] group-hover:text-[#F43397] transition-colors">
              {t('nav.title')}
            </span>
          </div>
          <span className="text-[11px] text-[#5F6368] font-medium tracking-wide pl-[40px] -mt-1">
            {t('nav.subtitle')}
          </span>
        </Link>

        {/* Center: Navigation Links */}
        <nav className="flex items-center space-x-1 lg:space-x-4">
          {navLinks.map((link) => {
            const isActive = location.pathname === link.path;
            return (
              <Link
                key={link.path}
                to={link.path}
                className={`px-3 py-2 rounded-lg text-[15px] font-semibold transition-all ${
                  isActive
                    ? 'text-[#F43397] bg-[#FDF1F7] border-b-2 border-[#F43397]'
                    : 'text-[#1C1C1C] hover:text-[#F43397] hover:bg-gray-50'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Right: Controls & CTA */}
        <div className="flex items-center space-x-3">
          {/* Reset Demo Button */}
          <button
            onClick={resetDemo}
            title="Reset all demo inputs and levers to Kurti preset"
            className="flex items-center space-x-1 px-3 py-2 rounded-lg text-xs font-semibold text-[#5F6368] hover:text-[#1C1C1C] hover:bg-gray-100 border border-gray-200 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="hidden xl:inline">{t('nav.resetDemo')}</span>
          </button>

          {/* Language Toggle */}
          <button
            onClick={toggleLanguage}
            className="px-3 py-1.5 rounded-lg border-2 border-[#4A2BD0] text-[#4A2BD0] font-bold text-xs hover:bg-[#4A2BD0] hover:text-white transition-colors flex items-center space-x-1"
          >
            <span>{lang === 'en' ? 'हिं (Hindi)' : 'EN (English)'}</span>
          </button>

          {/* Demo CTA */}
          <button
            onClick={startGuidedDemo}
            className="hidden sm:flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-[#5B0F4E] bg-[#FDF1F7] hover:bg-[#F6D3E6] border border-[#F6D3E6] transition-colors"
          >
            <PlayCircle className="w-4 h-4 text-[#F43397]" />
            <span>Guided Demo</span>
          </button>

          {/* Start Pricing CTA */}
          <button
            onClick={() => navigate('/offline-check')}
            className="px-4 py-2.5 rounded-xl bg-[#4A2BD0] hover:bg-[#3b21ad] text-white font-semibold text-sm shadow-sm hover:shadow-md transition-all active:scale-[0.98]"
          >
            {t('nav.startPricing')}
          </button>
        </div>
      </div>
    </header>
  );
};
