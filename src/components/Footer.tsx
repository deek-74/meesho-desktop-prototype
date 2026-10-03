import React from 'react';
import { useApp } from '../context/AppContext';
import { Info } from 'lucide-react';

export const Footer: React.FC = () => {
  const { t } = useApp();

  return (
    <footer className="mt-16 bg-[#F5F6F8] border-t border-[#E6E6EB] py-8 text-center text-xs text-[#5F6368]">
      <div className="max-w-[1280px] mx-auto px-6 space-y-2">
        <p className="font-semibold text-[#1C1C1C]">
          {t('footer.line1')}
        </p>
        <p className="flex items-center justify-center space-x-1.5 text-gray-500">
          <Info className="w-3.5 h-3.5 text-gray-400 shrink-0" />
          <span>{t('footer.line2')}</span>
        </p>
      </div>
    </footer>
  );
};
