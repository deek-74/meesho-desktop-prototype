import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import {
  calculateShippingAndFees,
  calculateFailureCost,
  calculateFloorPrice,
  calculateProfitPerDispatched,
  evaluateSKUVerdict,
  lookupShippingRate,
  calculateBillableWeight,
  type SKU,
  type RateCard,
} from '../engine/pricing';
import rateCardConfig from '../config/rateCard.json';
import {
  ArrowRight,
  TrendingUp,
  PlayCircle,
  Calculator,
  BarChart3,
  RefreshCcw,
  Tag,
} from 'lucide-react';

const rateCard = rateCardConfig as RateCard;

export const Home: React.FC = () => {
  const { t, skus, setActiveSKU, startGuidedDemo } = useApp();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'munafa' | 'band' | 'autopilot'>('munafa');

  const handleSelectSKU = (sku: SKU) => {
    setActiveSKU(sku);
    navigate('/munafa-meter');
  };

  return (
    <div className="space-y-12 pb-12">
      {/* Hero Section */}
      <section className="relative bg-[#FDF1F7] rounded-3xl overflow-hidden border border-[#F6D3E6] shadow-xs">
        <div className="max-w-[1280px] mx-auto px-8 py-14 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Content */}
          <div className="lg:col-span-7 space-y-6 z-10">
            <div className="inline-flex items-center space-x-2 bg-white px-3.5 py-1.5 rounded-full border border-[#F6D3E6] shadow-2xs">
              <span className="bg-[#F43397] text-white text-[11px] font-extrabold px-2 py-0.5 rounded-full tracking-wider">
                {t('hero.pill')}
              </span>
              <span className="text-xs font-semibold text-[#1C1C1C]">
                {t('hero.pillNote')}
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-[52px] font-extrabold text-[#1C1C1C] leading-[1.15] tracking-tight">
              Price right from <span className="text-[#F43397] underline decoration-[#F6D3E6]">day one</span>
            </h1>

            <p className="text-lg text-[#5F6368] font-normal leading-relaxed max-w-xl">
              {t('hero.subtitle')}
            </p>

            <div className="flex items-center space-x-4 pt-2">
              <button
                onClick={() => navigate('/offline-check')}
                className="px-6 py-3.5 rounded-xl bg-[#4A2BD0] hover:bg-[#3b21ad] text-white font-bold text-base shadow-md hover:shadow-lg transition-all flex items-center space-x-2 active:scale-[0.98]"
              >
                <span>{t('hero.cta')}</span>
                <ArrowRight className="w-5 h-5" />
              </button>

              <button
                onClick={startGuidedDemo}
                className="px-5 py-3.5 rounded-xl bg-white hover:bg-gray-50 border border-gray-300 text-[#1C1C1C] font-semibold text-base transition-colors flex items-center space-x-2 shadow-2xs"
              >
                <PlayCircle className="w-5 h-5 text-[#F43397]" />
                <span>{t('hero.secondaryCta')}</span>
              </button>
            </div>
          </div>

          <div className="lg:col-span-5 relative flex justify-center items-center">
            <div className="w-80 h-80 sm:w-96 sm:h-96 bg-[#F6D3E6] rounded-full absolute -right-10 -bottom-10 opacity-70 blur-xs"></div>

            <div className="relative z-10 bg-white/90 backdrop-blur-md p-6 rounded-3xl border border-[#F6D3E6] shadow-xl w-full max-w-md space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-red-400"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                  <div className="w-3 h-3 rounded-full bg-green-400"></div>
                </div>
                <span className="text-xs font-mono text-gray-400">Sahi Daam Co-Pilot</span>
              </div>

              <div className="bg-[#F5F6F8] p-4 rounded-2xl border border-gray-200 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Sample Kurti Pricing</span>
                  <span className="px-2 py-0.5 bg-green-100 text-green-700 font-bold text-[10px] rounded-full">LIVE CHECK</span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-white p-3 rounded-xl border border-gray-200">
                    <span className="text-[11px] text-gray-500 block font-medium">Market Price</span>
                    <span className="text-lg font-bold text-[#1C1C1C]">₹299.00</span>
                  </div>
                  <div className="bg-[#FDF1F7] p-3 rounded-xl border border-[#F6D3E6]">
                    <span className="text-[11px] text-[#F43397] block font-semibold">True Floor</span>
                    <span className="text-lg font-bold text-[#F43397]">₹314.13</span>
                  </div>
                </div>

                <div className="p-3 bg-red-50 rounded-xl border border-red-200 flex items-center justify-between text-xs">
                  <span className="font-semibold text-red-700">Profit per order @ ₹299</span>
                  <span className="font-bold text-red-800">−₹10.59</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-[#5F6368] font-medium pt-1">
                <span className="flex items-center space-x-1">
                  <Tag className="w-3.5 h-3.5 text-[#4A2BD0]" />
                  <span>No hidden fee loss</span>
                </span>
                <span className="flex items-center space-x-1">
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Day 1 Margin Floor</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stat Cards Row (4) */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#F5F6F8] p-6 rounded-2xl border border-[#E6E6EB] hover:shadow-md transition-all space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-3xl font-black text-[#F43397] tracking-tight">
              {t('stats.stat1Value')}
            </span>
            <span className="px-2 py-0.5 bg-gray-200 text-gray-600 text-[10px] font-bold rounded-md">
              {t('stats.sampleTag')}
            </span>
          </div>
          <p className="text-sm font-semibold text-[#1C1C1C] leading-snug">
            {t('stats.stat1Label')}
          </p>
        </div>

        <div className="bg-[#F5F6F8] p-6 rounded-2xl border border-[#E6E6EB] hover:shadow-md transition-all space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-3xl font-black text-[#C62828] tracking-tight">
              {t('stats.stat2Value')}
            </span>
            <span className="px-2 py-0.5 bg-red-100 text-red-700 text-[10px] font-bold rounded-md">
              Loss alert
            </span>
          </div>
          <p className="text-sm font-semibold text-[#1C1C1C] leading-snug">
            {t('stats.stat2Label')}
          </p>
        </div>

        <div className="bg-[#F5F6F8] p-6 rounded-2xl border border-[#E6E6EB] hover:shadow-md transition-all space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-3xl font-black text-[#5B0F4E] tracking-tight">
              {t('stats.stat3Value')}
            </span>
            <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-[10px] font-bold rounded-md">
              Cost ratio
            </span>
          </div>
          <p className="text-sm font-semibold text-[#1C1C1C] leading-snug">
            {t('stats.stat3Label')}
          </p>
        </div>

        <div className="bg-[#F5F6F8] p-6 rounded-2xl border border-[#E6E6EB] hover:shadow-md transition-all space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-3xl font-black text-[#4A2BD0] tracking-tight">
              {t('stats.stat4Value')}
            </span>
            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-bold rounded-md">
              Autopilot
            </span>
          </div>
          <p className="text-sm font-semibold text-[#1C1C1C] leading-snug">
            {t('stats.stat4Label')}
          </p>
        </div>
      </section>

      {/* "How Sahi Daam Works" Tab Section */}
      <section className="bg-white rounded-3xl p-8 border border-[#E6E6EB] shadow-xs space-y-6">
        <h2 className="text-2xl font-bold text-[#1C1C1C]">
          {t('howItWorks.title')}
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          <div className="lg:col-span-4 space-y-2">
            <button
              onClick={() => setActiveTab('munafa')}
              className={`w-full text-left p-4 rounded-xl font-semibold text-base transition-all flex items-center justify-between ${
                activeTab === 'munafa'
                  ? 'bg-[#FDF1F7] text-[#F43397] border-l-4 border-[#F43397] shadow-2xs'
                  : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Calculator className="w-5 h-5" />
                <span>Munafa Meter</span>
              </div>
              <span className="text-xs font-normal opacity-75">True Floor</span>
            </button>

            <button
              onClick={() => setActiveTab('band')}
              className={`w-full text-left p-4 rounded-xl font-semibold text-base transition-all flex items-center justify-between ${
                activeTab === 'band'
                  ? 'bg-[#FDF1F7] text-[#F43397] border-l-4 border-[#F43397] shadow-2xs'
                  : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center space-x-3">
                <BarChart3 className="w-5 h-5" />
                <span>Smart Band</span>
              </div>
              <span className="text-xs font-normal opacity-75">Market Band</span>
            </button>

            <button
              onClick={() => setActiveTab('autopilot')}
              className={`w-full text-left p-4 rounded-xl font-semibold text-base transition-all flex items-center justify-between ${
                activeTab === 'autopilot'
                  ? 'bg-[#FDF1F7] text-[#F43397] border-l-4 border-[#F43397] shadow-2xs'
                  : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center space-x-3">
                <RefreshCcw className="w-5 h-5" />
                <span>Lifecycle Autopilot</span>
              </div>
              <span className="text-xs font-normal opacity-75">Auto Nudges</span>
            </button>
          </div>

          <div className="lg:col-span-8 bg-[#F5F6F8] p-8 rounded-2xl border border-gray-200 flex flex-col justify-between">
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-[#1C1C1C]">
                {activeTab === 'munafa' && 'Munafa Meter: Stop under-pricing your SKUs'}
                {activeTab === 'band' && 'Smart Band: Win in the market without losing margin'}
                {activeTab === 'autopilot' && 'Lifecycle Autopilot: Protect margins across product lifespan'}
              </h3>
              <p className="text-base text-[#5F6368] leading-relaxed">
                {activeTab === 'munafa' && t('howItWorks.munafaDesc')}
                {activeTab === 'band' && t('howItWorks.bandDesc')}
                {activeTab === 'autopilot' && t('howItWorks.autopilotDesc')}
              </p>
            </div>

            <div className="pt-6">
              <button
                onClick={() =>
                  navigate(
                    activeTab === 'munafa'
                      ? '/munafa-meter'
                      : activeTab === 'band'
                      ? '/smart-band'
                      : '/autopilot'
                  )
                }
                className="px-6 py-3 rounded-xl bg-[#4A2BD0] hover:bg-[#3b21ad] text-white font-bold text-sm flex items-center space-x-2 transition-all"
              >
                <span>{t('howItWorks.tryIt')}</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* My Products Table */}
      <section className="bg-white rounded-3xl p-8 border border-[#E6E6EB] shadow-xs space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-[#1C1C1C]">My Products</h2>
            <p className="text-sm text-[#5F6368]">
              5 demo SKUs pre-loaded with category parameters. Click any row to inspect in Munafa Meter.
            </p>
          </div>
          <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-semibold">
            5 Active SKUs
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50/50">
                <th className="py-3.5 px-4 rounded-l-xl">Product</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4 text-right">Floor Price</th>
                <th className="py-3.5 px-4 text-center">Market Band (Q1–Q3)</th>
                <th className="py-3.5 px-4 text-right">Current Price</th>
                <th className="py-3.5 px-4 text-right">Profit / Order</th>
                <th className="py-3.5 px-4 text-center rounded-r-xl">Verdict</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {skus.map((sku) => {
                const S = sku.shippingOverride
                  ? calculateShippingAndFees(sku.shippingOverride, rateCard.platformFee, rateCard.gst)
                  : calculateShippingAndFees(
                      lookupShippingRate(
                        calculateBillableWeight(sku.declaredWeightKg, sku.boxDimensions),
                        sku.zone,
                        rateCard
                      ).rate || 0,
                      rateCard.platformFee,
                      rateCard.gst
                    );
                const C = sku.purchaseCost + sku.packingCost + sku.labourCost;
                const failCost = calculateFailureCost(
                  sku.rtoShare,
                  sku.returnShare,
                  sku.costPerRto,
                  rateCard.reverseFee,
                  0,
                  S
                );
                const floor = calculateFloorPrice(C, S, failCost.f, failCost.F, sku.adsPerDispatched);
                const profitPerOrder = calculateProfitPerDispatched(sku.currentPrice, floor, failCost.f);
                const verdictInfo = evaluateSKUVerdict(sku.currentPrice, floor, sku.q1, sku.q3);

                return (
                  <tr
                    key={sku.id}
                    onClick={() => handleSelectSKU(sku)}
                    className="hover:bg-[#FDF1F7]/50 cursor-pointer transition-colors group"
                  >
                    <td className="py-4 px-4 font-bold text-[#1C1C1C] group-hover:text-[#F43397]">
                      {sku.name}
                    </td>
                    <td className="py-4 px-4 text-gray-500 text-xs font-medium">
                      {sku.category}
                    </td>
                    <td className="py-4 px-4 text-right font-semibold text-[#5B0F4E]">
                      ₹{floor.toFixed(2)}
                    </td>
                    <td className="py-4 px-4 text-center text-xs text-gray-600 font-mono">
                      ₹{sku.q1} – ₹{sku.q3}
                    </td>
                    <td className="py-4 px-4 text-right font-bold text-[#1C1C1C]">
                      ₹{sku.currentPrice}
                    </td>
                    <td
                      className={`py-4 px-4 text-right font-bold ${
                        profitPerOrder >= 0 ? 'text-emerald-700' : 'text-red-700'
                      }`}
                    >
                      {profitPerOrder >= 0 ? `+₹${profitPerOrder.toFixed(2)}` : `−₹${Math.abs(profitPerOrder).toFixed(2)}`}
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-bold border ${verdictInfo.chipColor}`}
                      >
                        {verdictInfo.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
