import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { runLifecycleSimulation, type RateCard } from '../engine/pricing';
import rateCardConfig from '../config/rateCard.json';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';
import {
  Zap,
  Clock,
  Send,
} from 'lucide-react';

const rateCard = rateCardConfig as RateCard;

export const AutopilotPage: React.FC = () => {
  const { t, lang, activeSKU } = useApp();
  const sku = activeSKU;

  const [selectedWeek, setSelectedWeek] = useState<number>(10);
  const [nudgeDecisions, setNudgeDecisions] = useState<Record<string, 'applied' | 'ignored'>>({});

  const simResult = runLifecycleSimulation(sku, rateCard);
  const weekData = simResult.weekResults;

  const firedTriggers = weekData
    .slice(0, selectedWeek)
    .filter((w) => w.triggerFired !== undefined)
    .map((w) => ({ week: w.week, ...w.triggerFired! }));

  const handleDecision = (triggerType: string, action: 'applied' | 'ignored') => {
    setNudgeDecisions((prev) => ({ ...prev, [triggerType]: action }));
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="bg-white p-6 rounded-3xl border border-[#E6E6EB] shadow-2xs">
        <span className="px-2.5 py-0.5 bg-[#FDF1F7] text-[#F43397] font-bold text-xs rounded-full">
          LIFECYCLE AUTOPILOT
        </span>
        <h1 className="text-3xl font-extrabold text-[#1C1C1C] mt-1">
          Automated Pricing & Performance Nudges
        </h1>
        <p className="text-sm text-[#5F6368]">
          26-week simulation for <span className="font-bold text-[#1C1C1C]">{sku.name}</span> with 3 key lifecycle triggers (T1, T2, T3)
        </p>
      </div>

      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E6E6EB] shadow-xs space-y-6">
        <div className="flex justify-between items-center">
          <label className="text-sm font-bold text-[#1C1C1C] flex items-center space-x-2">
            <Clock className="w-4 h-4 text-[#4A2BD0]" />
            <span>{t('autopilot.weekLabel')}</span>
          </label>
          <span className="px-3 py-1 bg-[#4A2BD0] text-white font-extrabold text-xs rounded-full">
            Week {selectedWeek} of 26
          </span>
        </div>

        <input
          type="range"
          min="1"
          max="26"
          value={selectedWeek}
          onChange={(e) => setSelectedWeek(parseInt(e.target.value) || 1)}
          className="w-full accent-[#4A2BD0] h-2 bg-gray-200 rounded-lg cursor-pointer"
        />

        <div className="relative pt-2">
          <div className="h-2 bg-gray-100 rounded-full w-full relative">
            <div
              className="h-full bg-[#4A2BD0] rounded-full transition-all duration-150"
              style={{ width: `${(selectedWeek / 26) * 100}%` }}
            ></div>

            <div
              onClick={() => setSelectedWeek(1)}
              className={`absolute -top-3 left-[3.8%] -translate-x-1/2 w-8 h-8 rounded-full border-2 cursor-pointer flex items-center justify-center text-xs font-bold transition-transform hover:scale-110 ${
                selectedWeek >= 1
                  ? 'bg-[#F43397] text-white border-white shadow-md'
                  : 'bg-gray-200 text-gray-600 border-gray-300'
              }`}
              title="T1: Listing Conversion Alert (Week 1)"
            >
              T1
            </div>

            <div
              onClick={() => setSelectedWeek(10)}
              className={`absolute -top-3 left-[38.4%] -translate-x-1/2 w-8 h-8 rounded-full border-2 cursor-pointer flex items-center justify-center text-xs font-bold transition-transform hover:scale-110 ${
                selectedWeek >= 10
                  ? 'bg-[#F43397] text-white border-white shadow-md'
                  : 'bg-gray-200 text-gray-600 border-gray-300'
              }`}
              title="T2: Logistics Cost Change (Week 10)"
            >
              T2
            </div>

            <div
              onClick={() => setSelectedWeek(21)}
              className={`absolute -top-3 left-[80.7%] -translate-x-1/2 w-8 h-8 rounded-full border-2 cursor-pointer flex items-center justify-center text-xs font-bold transition-transform hover:scale-110 ${
                selectedWeek >= 21
                  ? 'bg-[#F43397] text-white border-white shadow-md'
                  : 'bg-gray-200 text-gray-600 border-gray-300'
              }`}
              title="T3: End of Season Clearance (Week 21)"
            >
              T3
            </div>
          </div>

          <div className="flex justify-between text-[11px] text-gray-400 font-semibold mt-3">
            <span>Week 1 (Launch)</span>
            <span>Week 10 (Fee Hike +₹10)</span>
            <span>Week 21 (Clearance)</span>
            <span>Week 26 (End)</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E6E6EB] shadow-xs space-y-4">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <div>
                <h3 className="text-lg font-bold text-[#1C1C1C]">
                  Cumulative Season Profit Over Time
                </h3>
                <p className="text-xs text-gray-500">
                  Comparing Sahi Daam Autopilot vs Flat Pricing (₹299)
                </p>
              </div>
            </div>

            <div className="h-72 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={weekData} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F0F0F0" />
                  <XAxis dataKey="week" stroke="#5F6368" fontSize={11} tickFormatter={(w) => `W${w}`} />
                  <YAxis stroke="#5F6368" fontSize={11} tickFormatter={(val) => `₹${val}`} />
                  <Tooltip
                    formatter={(val: any) => [`₹${Number(val).toFixed(2)}`, 'Cumulative Profit']}
                    labelFormatter={(w) => `Week ${w}`}
                    contentStyle={{ borderRadius: '12px', border: '1px solid #E6E6EB' }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="cumProfitWith"
                    name={t('autopilot.withSahiDaam')}
                    stroke="#4A2BD0"
                    strokeWidth={3}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="cumProfitWithout"
                    name={t('autopilot.withoutSahiDaam')}
                    stroke="#C62828"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-[#E6E6EB] shadow-xs space-y-4">
            <h3 className="text-lg font-bold text-[#1C1C1C]">
              Season Performance Breakdown
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-red-50/70 p-5 rounded-2xl border border-red-200 space-y-2">
                <span className="text-xs font-bold text-red-800 uppercase tracking-wide block">
                  {t('autopilot.withoutSahiDaam')}
                </span>
                <div className="text-2xl font-black text-red-700">
                  ₹{simResult.netSeasonProfitWithout.toFixed(2)}
                </div>
                <div className="text-xs text-red-900 space-y-1 font-medium border-t border-red-200/60 pt-2">
                  <div className="flex justify-between">
                    <span>{t('autopilot.unsoldUnits')}:</span>
                    <span className="font-bold">{simResult.unsoldWithout.toFixed(0)} units</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t('autopilot.weeksBelowFloor')}:</span>
                    <span className="font-bold">26 weeks (priced @ ₹299)</span>
                  </div>
                </div>
              </div>

              <div className="bg-emerald-50/70 p-5 rounded-2xl border border-emerald-200 space-y-2">
                <span className="text-xs font-bold text-emerald-800 uppercase tracking-wide block">
                  {t('autopilot.withSahiDaam')}
                </span>
                <div className="text-2xl font-black text-emerald-700">
                  +₹{simResult.netSeasonProfitWith.toFixed(2)}
                </div>
                <div className="text-xs text-emerald-900 space-y-1 font-medium border-t border-emerald-200/60 pt-2">
                  <div className="flex justify-between">
                    <span>{t('autopilot.unsoldUnits')}:</span>
                    <span className="font-bold">{simResult.unsoldWith.toFixed(0)} units</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t('autopilot.weeksBelowFloor')}:</span>
                    <span className="font-bold text-emerald-700">0 weeks</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-[#E6E6EB] shadow-xs space-y-4">
            <div className="flex items-center space-x-2 border-b border-gray-100 pb-3">
              <Zap className="w-5 h-5 text-[#F43397]" />
              <h3 className="text-base font-bold text-[#1C1C1C]">
                Active Nudges (Week {selectedWeek})
              </h3>
            </div>

            {firedTriggers.length === 0 ? (
              <p className="text-xs text-gray-500 italic p-4 text-center">
                No triggers fired yet. Move the week slider to week 1, 10 or 21 to see nudges.
              </p>
            ) : (
              <div className="space-y-4">
                {firedTriggers.map((trig) => {
                  const decision = nudgeDecisions[trig.type] || 'pending';
                  return (
                    <div
                      key={trig.type}
                      className="bg-gray-50 p-4 rounded-2xl border border-gray-200 space-y-3 shadow-2xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="px-2.5 py-0.5 bg-purple-100 text-[#5B0F4E] font-bold text-[11px] rounded-md">
                          {trig.title}
                        </span>
                        <span className="text-[11px] text-gray-400 font-medium">
                          Fired W{trig.week}
                        </span>
                      </div>

                      <p className="text-xs text-gray-700 leading-relaxed font-medium">
                        {trig.desc}
                      </p>

                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[11px] text-emerald-700 font-bold">
                          Estimated Impact: +₹23,570 P&L lift
                        </span>

                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleDecision(trig.type, 'ignored')}
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                              decision === 'ignored'
                                ? 'bg-gray-700 text-white'
                                : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-100'
                            }`}
                          >
                            Ignore
                          </button>

                          <button
                            onClick={() => handleDecision(trig.type, 'applied')}
                            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                              decision === 'applied'
                                ? 'bg-emerald-600 text-white'
                                : 'bg-[#4A2BD0] text-white hover:bg-[#3b21ad]'
                            }`}
                          >
                            {decision === 'applied' ? 'Applied ✓' : 'Apply'}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="bg-[#E5DDD5] rounded-3xl overflow-hidden border border-gray-300 shadow-md">
            <div className="bg-[#075E54] text-white p-4 flex items-center space-x-3">
              <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center font-bold text-sm">
                SD
              </div>
              <div>
                <h4 className="font-bold text-sm leading-none">
                  {t('autopilot.chatTitle')}
                </h4>
                <span className="text-[10px] text-emerald-200">Online · Instant Nudge Bot</span>
              </div>
            </div>

            <div className="p-4 space-y-3 max-h-72 overflow-y-auto font-sans text-xs">
              <div className="bg-white p-3 rounded-xl rounded-tl-none shadow-2xs max-w-[85%] space-y-1">
                <span className="text-[10px] font-bold text-[#075E54] block">
                  Sahi Daam Bot
                </span>
                <p className="text-gray-800 leading-snug">
                  {lang === 'hi'
                    ? 'नमस्ते! आपके कुर्ती सेट के लिए साप्ताहिक अलर्ट:'
                    : 'Hello! Weekly alert for your Kurti Set:'}
                </p>
              </div>

              {firedTriggers.map((trig) => (
                <div
                  key={trig.type}
                  className="bg-[#DCF8C6] p-3 rounded-xl rounded-tr-none shadow-2xs max-w-[88%] ml-auto space-y-1 border border-emerald-200"
                >
                  <span className="text-[10px] font-bold text-emerald-900 block">
                    {trig.title}
                  </span>
                  <p className="text-emerald-950 font-medium leading-snug">
                    {trig.desc}
                  </p>
                  <span className="text-[9px] text-emerald-700 block text-right">
                    Just now · Deliverable via WhatsApp API
                  </span>
                </div>
              ))}
            </div>

            <div className="bg-gray-100 p-2.5 flex items-center space-x-2 border-t border-gray-200 text-xs text-gray-400">
              <input
                type="text"
                disabled
                placeholder="Type 'Apply' or 'Ignore'..."
                className="w-full bg-white px-3 py-1.5 rounded-full border border-gray-300 text-gray-600 outline-none"
              />
              <button className="p-2 rounded-full bg-[#075E54] text-white">
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
