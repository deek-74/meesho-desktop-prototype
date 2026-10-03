import React from 'react';
import { useApp } from '../context/AppContext';
import {
  calculateShippingAndFees,
  calculateFailureCost,
  calculateFloorPrice,
  calculateProfitPerDispatched,
  calculateBreakEvenFailureShare,
  evaluateSKUVerdict,
  lookupShippingRate,
  calculateBillableWeight,
  checkWeightGuard,
  type RateCard,
} from '../engine/pricing';
import rateCardConfig from '../config/rateCard.json';
import categoryPriorsConfig from '../config/categoryPriors.json';
import { AlertTriangle, ToggleLeft, ToggleRight } from 'lucide-react';

const rateCard = rateCardConfig as RateCard;

export const SKUHealthPage: React.FC = () => {
  const { t, skus, isWeightDemoActive, toggleWeightDemo } = useApp();

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-[#E6E6EB] shadow-2xs">
        <div>
          <span className="px-2.5 py-0.5 bg-[#FDF1F7] text-[#F43397] font-bold text-xs rounded-full">
            SKU HEALTH
          </span>
          <h1 className="text-3xl font-extrabold text-[#1C1C1C] mt-1">
            {t('skuHealth.title')}
          </h1>
          <p className="text-sm text-[#5F6368]">
            {t('skuHealth.subtitle')}
          </p>
        </div>

        <button
          onClick={toggleWeightDemo}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-2xl font-bold text-xs border transition-all ${
            isWeightDemoActive
              ? 'bg-red-50 text-red-800 border-red-300 shadow-sm'
              : 'bg-gray-50 text-gray-700 border-gray-300 hover:bg-gray-100'
          }`}
        >
          {isWeightDemoActive ? (
            <ToggleRight className="w-6 h-6 text-red-600" />
          ) : (
            <ToggleLeft className="w-6 h-6 text-gray-400" />
          )}
          <span>{t('skuHealth.weightDemoToggle')}</span>
        </button>
      </div>

      {isWeightDemoActive && (
        <div className="p-4 bg-red-50 rounded-2xl border-2 border-red-300 flex items-start space-x-3 text-red-900 animate-in slide-in-from-top duration-300">
          <AlertTriangle className="w-6 h-6 text-red-600 shrink-0 mt-0.5" />
          <div className="space-y-1 text-sm">
            <span className="font-bold text-red-800 uppercase tracking-wide text-xs block">
              DEMO: Fertliser Combo Weight Error Triggered
            </span>
            <p className="font-medium">
              Declared weight updated to <span className="font-bold text-red-900">7.5 kg</span>. Billable weight falls into slab <span className="font-bold text-red-900">"5–10 kg"</span> (rate missing in rate card). Health Guard alerts seller immediately!
            </p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-3xl p-8 border border-[#E6E6EB] shadow-xs space-y-6">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50/50">
                <th className="py-3.5 px-4 rounded-l-xl">SKU Name</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4 text-right">Floor Price</th>
                <th className="py-3.5 px-4 text-center">Market Band (Q1–Q3)</th>
                <th className="py-3.5 px-4 text-right">Current Price</th>
                <th className="py-3.5 px-4 text-right">Profit / Order</th>
                <th className="py-3.5 px-4 text-center">Break-Even Fail %</th>
                <th className="py-3.5 px-4 text-center rounded-r-xl">Verdict Chip</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {skus.map((sku) => {
                const billable = calculateBillableWeight(sku.declaredWeightKg, sku.boxDimensions);
                const lookup = sku.shippingOverride
                  ? { slab: null, rate: sku.shippingOverride, rateMissing: false }
                  : lookupShippingRate(billable, sku.zone, rateCard);

                const S = lookup.rate !== null ? calculateShippingAndFees(lookup.rate, rateCard.platformFee, rateCard.gst) : 0;
                const C = sku.purchaseCost + sku.packingCost + sku.labourCost;
                const failCost = calculateFailureCost(sku.rtoShare, sku.returnShare, sku.costPerRto, rateCard.reverseFee, 0, S);
                const floor = calculateFloorPrice(C, S, failCost.f, failCost.F, sku.adsPerDispatched);
                const profitPerOrder = calculateProfitPerDispatched(sku.currentPrice, floor, failCost.f);
                const breakEvenRes = calculateBreakEvenFailureShare(sku.currentPrice, C, S, sku.adsPerDispatched, failCost.F);
                const verdict = evaluateSKUVerdict(sku.currentPrice, floor, sku.q1, sku.q3);

                const catPriors = (categoryPriorsConfig.categories as any)[sku.category] || categoryPriorsConfig.categories.Fashion;
                const weightGuard = checkWeightGuard(sku.declaredWeightKg, sku.actualWeightKg, catPriors.typicalWeightKg);

                return (
                  <tr key={sku.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="py-4 px-4 font-bold text-[#1C1C1C]">
                      <div>{sku.name}</div>
                      {(weightGuard.isError || lookup.rateMissing) && (
                        <span className="text-[10px] text-red-600 font-bold block">
                          ⚠ Weight Error: {sku.declaredWeightKg} kg
                        </span>
                      )}
                    </td>

                    <td className="py-4 px-4 text-gray-500 text-xs font-medium">
                      {sku.category}
                    </td>

                    <td className="py-4 px-4 text-right font-bold text-[#5B0F4E]">
                      {lookup.rateMissing ? 'Rate Missing' : `₹${floor.toFixed(2)}`}
                    </td>

                    <td className="py-4 px-4 text-center font-mono text-xs text-gray-600">
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

                    <td className="py-4 px-4 text-center font-mono text-xs font-bold text-gray-700">
                      {breakEvenRes.breakEvenShare !== null
                        ? `${(breakEvenRes.breakEvenShare * 100).toFixed(1)}%`
                        : 'Loses Money'}
                    </td>

                    <td className="py-4 px-4 text-center">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-bold border ${verdict.chipColor}`}
                      >
                        {verdict.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
