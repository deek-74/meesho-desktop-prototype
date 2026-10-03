import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { ChevronRight, ChevronLeft, X, Sparkles } from 'lucide-react';

export const GuidedDemoOverlay: React.FC = () => {
  const {
    guidedDemoStep,
    nextGuidedDemoStep,
    prevGuidedDemoStep,
    closeGuidedDemo,
    toggleLever,
    levers,
  } = useApp();
  const navigate = useNavigate();

  if (guidedDemoStep === null) return null;

  const steps = [
    {
      step: 1,
      title: '1. Offline Price Check',
      targetPath: '/offline-check',
      highlight: 'Sellers copy ₹299 thinking they profit ₹109, but actually lose ₹10.59 per order.',
      actionText: 'Go to Munafa Meter →',
      onNext: () => navigate('/munafa-meter'),
    },
    {
      step: 2,
      title: '2. Munafa Meter (True Floor Price)',
      targetPath: '/munafa-meter',
      highlight: 'Weight check alerts when declared weight puts you in high slab. Kurti floor is ₹314.13.',
      actionText: 'Try "What-If" Levers →',
      onNext: () => {
        if (!levers.sizeChart) toggleLever('sizeChart');
      },
    },
    {
      step: 3,
      title: '3. "What-If" Profit Levers',
      targetPath: '/munafa-meter',
      highlight: 'Adding a size chart & real photos drops returns from 15% to 10%, cutting floor to ₹300.77!',
      actionText: 'Explore Smart Band →',
      onNext: () => navigate('/smart-band'),
    },
    {
      step: 4,
      title: '4. Smart Band Market Positioning',
      targetPath: '/smart-band',
      highlight: '₹299 is in the RED Loss zone. Smart Band suggests ₹319 (Q3 cap) to stay profitable.',
      actionText: 'View Lifecycle Autopilot →',
      onNext: () => navigate('/autopilot'),
    },
    {
      step: 5,
      title: '5. Lifecycle Autopilot (T1, T2, T3)',
      targetPath: '/autopilot',
      highlight: 'Automated alerts for conversion drops (T1), shipping hikes (T2), and clearance (T3). Season P&L −₹21,872 vs +₹1,698!',
      actionText: 'Finish Tour',
      onNext: () => closeGuidedDemo(),
    },
  ];

  const current = steps[guidedDemoStep - 1] || steps[0];

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-md w-full bg-slate-900 text-white rounded-2xl p-5 shadow-2xl border-2 border-[#F43397] animate-in slide-in-from-bottom duration-300">
      <div className="flex items-center justify-between border-b border-slate-700 pb-3 mb-3">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded-lg bg-[#F43397] text-white">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-pink-300">
              Guided Tour ({current.step} / 5)
            </h4>
            <p className="text-[11px] text-slate-400 font-medium">
              {current.title}
            </p>
          </div>
        </div>
        <button
          onClick={closeGuidedDemo}
          className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="bg-slate-800/90 rounded-xl p-3 border border-slate-700 text-xs leading-relaxed text-slate-200 mb-4">
        {current.highlight}
      </div>

      <div className="flex items-center justify-between">
        <button
          onClick={prevGuidedDemoStep}
          disabled={guidedDemoStep === 1}
          className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 disabled:opacity-40 hover:bg-slate-700 text-xs font-semibold flex items-center space-x-1"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back</span>
        </button>

        <button
          onClick={() => {
            current.onNext();
            if (guidedDemoStep < 5) nextGuidedDemoStep();
          }}
          className="px-4 py-2 rounded-xl bg-[#F43397] hover:bg-pink-600 text-white font-bold text-xs flex items-center space-x-1 shadow-md transition-transform active:scale-95"
        >
          <span>{current.actionText}</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
