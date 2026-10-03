import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import categoryPriorsConfig from '../config/categoryPriors.json';
import rateCardConfig from '../config/rateCard.json';
import {
  calculateShippingAndFees,
  calculateFailureCost,
  calculateFloorPrice,
  calculateProfitPerDispatched,
  type RateCard,
} from '../engine/pricing';
import { SpeechInputButton } from '../components/SpeechInputButton';
import { ArrowRight, AlertTriangle, CheckCircle2, Tag } from 'lucide-react';

const rateCard = rateCardConfig as RateCard;

export const OfflineCheckPage: React.FC = () => {
  const { t, lang, setActiveSKU, skus } = useApp();
  const navigate = useNavigate();

  const [category, setCategory] = useState<string>('Fashion');
  const [offlinePrice, setOfflinePrice] = useState<number>(299);
  const [purchaseCost, setPurchaseCost] = useState<number>(160);

  const catPriors = (categoryPriorsConfig.categories as any)[category] || categoryPriorsConfig.categories.Fashion;
  const defaultPacking = 15;
  const defaultLabour = 15;
  const C = purchaseCost + defaultPacking + defaultLabour;
  const defaultShipping = 65;
  const S = calculateShippingAndFees(defaultShipping, rateCard.platformFee, rateCard.gst);
  const defaultAds = 8;

  const failCost = calculateFailureCost(
    catPriors.rtoShare,
    catPriors.returnShare,
    rateCard.costPerRtoDefault,
    rateCard.reverseFee,
    0,
    S
  );

  const floor = calculateFloorPrice(C, S, failCost.f, failCost.F, defaultAds);
  const profitPerOrder = calculateProfitPerDispatched(offlinePrice, floor, failCost.f);

  const isLoss = profitPerOrder < 0;

  const handleProceed = () => {
    const baseSku = skus[0];
    const customSku = {
      ...baseSku,
      category,
      purchaseCost,
      currentPrice: offlinePrice,
      rtoShare: catPriors.rtoShare,
      returnShare: catPriors.returnShare,
    };
    setActiveSKU(customSku);
    navigate('/munafa-meter');
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center py-8">
      <div className="max-w-[720px] w-full bg-white rounded-3xl p-8 sm:p-10 border border-[#E6E6EB] shadow-xl space-y-8 animate-in fade-in zoom-in-95 duration-300">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center space-x-2 bg-[#FDF1F7] px-3 py-1 rounded-full text-[#F43397] font-bold text-xs">
            <Tag className="w-3.5 h-3.5" />
            <span>OFFLINE PRICE CHECK</span>
          </div>
          <h1 className="text-3xl font-extrabold text-[#1C1C1C]">
            {t('offlineCheck.title')}
          </h1>
          <p className="text-sm text-[#5F6368]">
            {t('offlineCheck.subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-700 block">
              {t('offlineCheck.categoryLabel')}
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full h-[48px] px-3 rounded-xl border border-[#E6E6EB] font-medium text-sm focus:outline-none focus:ring-2 focus:ring-[#4A2BD0] bg-gray-50"
            >
              {Object.keys(categoryPriorsConfig.categories).map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-gray-700 block">
                {t('offlineCheck.offlinePriceLabel')}
              </label>
              <SpeechInputButton
                onValueDetected={(val) => setOfflinePrice(val)}
                lang={lang === 'hi' ? 'hi-IN' : 'en-IN'}
              />
            </div>
            <div className="relative">
              <span className="absolute left-3 top-3 text-gray-400 font-bold text-sm">₹</span>
              <input
                type="number"
                value={offlinePrice}
                onChange={(e) => setOfflinePrice(parseFloat(e.target.value) || 0)}
                className="w-full h-[48px] pl-8 pr-3 rounded-xl border border-[#E6E6EB] font-bold text-sm focus:outline-none focus:ring-2 focus:ring-[#4A2BD0] bg-white"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-gray-700 block">
                {t('offlineCheck.purchaseCostLabel')}
              </label>
              <SpeechInputButton
                onValueDetected={(val) => setPurchaseCost(val)}
                lang={lang === 'hi' ? 'hi-IN' : 'en-IN'}
              />
            </div>
            <div className="relative">
              <span className="absolute left-3 top-3 text-gray-400 font-bold text-sm">₹</span>
              <input
                type="number"
                value={purchaseCost}
                onChange={(e) => setPurchaseCost(parseFloat(e.target.value) || 0)}
                className="w-full h-[48px] pl-8 pr-3 rounded-xl border border-[#E6E6EB] font-bold text-sm focus:outline-none focus:ring-2 focus:ring-[#4A2BD0] bg-white"
              />
            </div>
          </div>
        </div>

        <div
          className={`p-6 rounded-2xl border text-center transition-all ${
            isLoss
              ? 'bg-red-50/80 border-red-200 text-red-900'
              : 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
          }`}
        >
          <div className="flex items-center justify-center space-x-2 mb-2">
            {isLoss ? (
              <AlertTriangle className="w-6 h-6 text-red-600 animate-bounce" />
            ) : (
              <CheckCircle2 className="w-6 h-6 text-emerald-600" />
            )}
            <span className="text-xs font-bold uppercase tracking-wider">
              {isLoss ? 'LOSS WARNING' : 'PROFITABLE PRICE'}
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
            {isLoss
              ? t('offlineCheck.resultLoss', {
                  price: offlinePrice,
                  amount: Math.abs(profitPerOrder).toFixed(2),
                })
              : t('offlineCheck.resultProfit', {
                  price: offlinePrice,
                  amount: profitPerOrder.toFixed(2),
                })}
          </h2>

          <p className="text-xs text-gray-600 mt-2 font-medium">
            Calculated true floor for this category: <span className="font-bold text-gray-900">₹{floor.toFixed(2)}</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2 text-xs">
          <span className="px-3 py-1.5 rounded-full bg-gray-100 text-gray-700 font-semibold border border-gray-200">
            {t('offlineCheck.chips.shipping')}
          </span>
          <span className="px-3 py-1.5 rounded-full bg-gray-100 text-gray-700 font-semibold border border-gray-200">
            {t('offlineCheck.chips.returns')}
          </span>
          <span className="px-3 py-1.5 rounded-full bg-gray-100 text-gray-700 font-semibold border border-gray-200">
            {t('offlineCheck.chips.ads')}
          </span>
        </div>

        <button
          onClick={handleProceed}
          className="w-full py-4 rounded-xl bg-[#4A2BD0] hover:bg-[#3b21ad] text-white font-bold text-base shadow-lg hover:shadow-xl transition-all flex items-center justify-center space-x-2 active:scale-[0.99]"
        >
          <span>{t('offlineCheck.calculateBtn')}</span>
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
