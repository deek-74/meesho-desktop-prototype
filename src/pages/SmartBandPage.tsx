import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  calculateQuartiles,
  calculateCheaperThanShare,
  determinePriceZone,
  calculateSuggestedPrice,
  recommendStrategy,
  blendPriorAndOwnData,
  calculateFloorPrice,
  calculateProfitPerDispatched,
  calculateShippingAndFees,
  calculateFailureCost,
  type RateCard,
} from '../engine/pricing';
import sampleListingsConfig from '../config/sampleListings.json';
import categoryPriorsConfig from '../config/categoryPriors.json';
import rateCardConfig from '../config/rateCard.json';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
} from 'recharts';
import {
  Sliders,
  AlertOctagon,
} from 'lucide-react';

const rateCard = rateCardConfig as RateCard;
const sampleListings = sampleListingsConfig as number[];

export const SmartBandPage: React.FC = () => {
  const { t, activeSKU } = useApp();
  const sku = activeSKU;

  const [ownOrdersCount, setOwnOrdersCount] = useState<number>(0);
  const ownReturnShareInput = sku.returnShare;

  const catPriors = (categoryPriorsConfig.categories as any)[sku.category] || categoryPriorsConfig.categories.Fashion;
  const blended = blendPriorAndOwnData(
    catPriors.returnShare,
    ownReturnShareInput,
    catPriors.rtoShare,
    catPriors.rtoShare,
    ownOrdersCount,
    categoryPriorsConfig.priorStrengthK
  );

  const S = sku.shippingOverride
    ? calculateShippingAndFees(sku.shippingOverride, rateCard.platformFee, rateCard.gst)
    : calculateShippingAndFees(80, rateCard.platformFee, rateCard.gst);
  const C = sku.purchaseCost + sku.packingCost + sku.labourCost;
  const failCost = calculateFailureCost(
    blended.blendedRtoShare,
    blended.blendedReturnShare,
    sku.costPerRto,
    rateCard.reverseFee,
    rateCard.fwdLostOnReturn,
    S
  );

  const floor = calculateFloorPrice(C, S, failCost.f, failCost.F, sku.adsPerDispatched);
  const quartiles = calculateQuartiles(sampleListings);
  const cheaperThanPct = Math.round(calculateCheaperThanShare(sku.currentPrice, sampleListings) * 100);
  const currentZone = determinePriceZone(sku.currentPrice, floor, quartiles.median, quartiles.q3);

  const suggestedRes = calculateSuggestedPrice(floor, quartiles.q3, catPriors.eps);
  const strategyRes = recommendStrategy(
    floor,
    quartiles.q1,
    quartiles.median,
    quartiles.q3,
    sku.rating,
    sku.ratingsCount,
    true
  );

  const [simPrice, setSimPrice] = useState<number>(sku.currentPrice);
  const [simReturnShare, setSimReturnShare] = useState<number>(blended.blendedReturnShare);
  const [simRtoShare, setSimRtoShare] = useState<number>(blended.blendedRtoShare);
  const simPrepaidShift = 0;
  const [simShippingOverride, setSimShippingOverride] = useState<number>(sku.shippingOverride || 65);
  const [simLandedCost, setSimLandedCost] = useState<number>(C);
  const simAds = sku.adsPerDispatched;

  const simEffectiveRto = Math.max(0, simRtoShare - (simPrepaidShift * 0.0024));
  const simS = calculateShippingAndFees(simShippingOverride, rateCard.platformFee, rateCard.gst);
  const simFailCost = calculateFailureCost(
    simEffectiveRto,
    simReturnShare,
    sku.costPerRto,
    rateCard.reverseFee,
    0,
    simS
  );
  const simFloor = calculateFloorPrice(simLandedCost, simS, simFailCost.f, simFailCost.F, simAds);
  const simProfit = calculateProfitPerDispatched(simPrice, simFloor, simFailCost.f);
  const simZone = determinePriceZone(simPrice, simFloor, quartiles.median, quartiles.q3);

  const bins = [
    { label: '< 275', range: [0, 274], count: 0, zone: 'Loss' },
    { label: '275–289 (Q1)', range: [275, 289], count: 0, zone: 'Loss' },
    { label: '290–299 (Med)', range: [290, 299], count: 0, zone: 'Win' },
    { label: '300-[#314 Floor]', range: [300, 314], count: 0, zone: 'Win' },
    { label: '315–319 (Q3)', range: [315, 319], count: 0, zone: 'Profit' },
    { label: '320–349', range: [320, 349], count: 0, zone: 'Profit' },
    { label: '> 350', range: [350, 999], count: 0, zone: 'Above' },
  ];

  sampleListings.forEach((p) => {
    for (const b of bins) {
      if (p >= b.range[0] && p <= b.range[1]) {
        b.count++;
        break;
      }
    }
  });

  const heatmapPrices = [279, 289, 299, 309, 319, 329, 339];
  const heatmapReturnShares = [0.05, 0.10, 0.15, 0.20, 0.25, 0.30];

  return (
    <div className="space-y-8 pb-12">
      <div className="bg-white p-6 rounded-3xl border border-[#E6E6EB] shadow-2xs">
        <span className="px-2.5 py-0.5 bg-[#FDF1F7] text-[#F43397] font-bold text-xs rounded-full">
          SMART BAND
        </span>
        <h1 className="text-3xl font-extrabold text-[#1C1C1C] mt-1">
          Market Positioning & Scenario Simulator
        </h1>
        <p className="text-sm text-[#5F6368]">
          Comparable listing analysis for <span className="font-bold text-[#1C1C1C]">{sku.name}</span> ({sku.category})
        </p>
      </div>

      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E6E6EB] shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-4">
          <div>
            <h2 className="text-xl font-bold text-[#1C1C1C]">
              Market Price Distribution & Zones
            </h2>
            <p className="text-xs text-gray-500">
              Distribution of 25 comparable market listings. Q1 = ₹{quartiles.q1}, Median = ₹{quartiles.median}, Q3 = ₹{quartiles.q3}.
            </p>
          </div>

          <div className="flex items-center space-x-3 text-xs font-semibold">
            <span className="flex items-center space-x-1">
              <span className="w-3 h-3 rounded-full bg-red-500 inline-block"></span>
              <span>Loss (&lt; Floor ₹{floor.toFixed(0)})</span>
            </span>
            <span className="flex items-center space-x-1">
              <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block"></span>
              <span>Win (Floor–Median)</span>
            </span>
            <span className="flex items-center space-x-1">
              <span className="w-3 h-3 rounded-full bg-amber-500 inline-block"></span>
              <span>Profit (Median–Q3)</span>
            </span>
          </div>
        </div>

        <div className="h-72 w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={bins} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
              <XAxis dataKey="label" stroke="#5F6368" fontSize={11} />
              <YAxis stroke="#5F6368" fontSize={11} />
              <Tooltip
                formatter={(val: any) => [`${val} listings`, 'Frequency']}
                contentStyle={{ borderRadius: '12px', border: '1px solid #E6E6EB' }}
              />
              <ReferenceLine
                x="300-[#314 Floor]"
                stroke="#5B0F4E"
                strokeDasharray="4 4"
                strokeWidth={2}
                label={{ value: `Floor ₹${floor.toFixed(0)}`, fill: '#5B0F4E', fontSize: 12, fontWeight: 'bold' }}
              />
              <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                {bins.map((entry, index) => {
                  let color = '#1E8E3E';
                  if (entry.range[1] < floor) color = '#C62828';
                  else if (entry.range[0] > quartiles.median && entry.range[1] <= quartiles.q3) color = '#F29A1F';
                  else if (entry.range[0] > quartiles.q3) color = '#5B0F4E';
                  return <Cell key={`cell-${index}`} fill={color} />;
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="p-4 bg-[#FDF1F7] rounded-2xl border border-[#F6D3E6] flex items-center justify-between text-sm">
          <span className="font-bold text-[#5B0F4E]">
            {t('smartBand.cheaperThan', { percent: cheaperThanPct })}
          </span>
          <span className="px-3 py-1 bg-white text-[#F43397] font-extrabold text-xs rounded-full border border-[#F6D3E6]">
            Current Price ₹{sku.currentPrice} ({currentZone} Zone)
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-[#E6E6EB] shadow-xs space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
              {t('smartBand.suggestedPrice')}
            </span>
            <div className="flex items-baseline space-x-2">
              <span className="text-3xl font-black text-[#F43397]">
                ₹{suggestedRes.suggested || 'N/A'}
              </span>
              <span className="text-xs font-bold text-gray-500">
                (Range: ₹{floor.toFixed(0)} – ₹{suggestedRes.suggested || quartiles.q3})
              </span>
            </div>
            <p className="text-xs text-gray-600 leading-relaxed font-medium bg-gray-50 p-3 rounded-xl border border-gray-200">
              {suggestedRes.reason}
            </p>
          </div>
          <span className="text-[11px] text-[#5B0F4E] font-bold">
            ✓ Guardrail enforced: Never below floor ₹{floor.toFixed(0)}
          </span>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-[#E6E6EB] shadow-xs space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
                {t('smartBand.strategyPicker')}
              </span>
              <span className="px-2.5 py-0.5 bg-indigo-50 text-[#4A2BD0] font-bold text-xs rounded-full">
                RECOMMENDED
              </span>
            </div>
            <div className="flex items-baseline space-x-2">
              <span className="text-2xl font-extrabold text-[#1C1C1C]">
                {strategyRes.strategy}
              </span>
              <span className="text-xs font-bold text-[#F43397]">
                @ ₹{strategyRes.recommendedPrice.toFixed(0)}
              </span>
            </div>
            <p className="text-xs text-gray-600 leading-relaxed font-medium bg-gray-50 p-3 rounded-xl border border-gray-200">
              {strategyRes.why}
            </p>
          </div>

          <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-900 font-semibold flex items-center space-x-1.5">
            <AlertOctagon className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Avoid "Cheapest": copying ₹259 loses ₹38.50 per order!</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-[#E6E6EB] shadow-xs space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
              {t('smartBand.confidenceMeter')}
            </span>
            <span className="px-2.5 py-0.5 bg-purple-50 text-[#5B0F4E] font-bold text-xs rounded-full">
              {(blended.weightOwn * 100).toFixed(0)}% Seller Data
            </span>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs font-semibold">
              <span>Orders completed (n)</span>
              <span className="font-bold text-[#4A2BD0]">{ownOrdersCount} orders</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={ownOrdersCount}
              onChange={(e) => setOwnOrdersCount(parseInt(e.target.value) || 0)}
              className="w-full accent-[#4A2BD0]"
            />
          </div>

          <div className="p-3 bg-purple-50/70 rounded-xl border border-purple-100 text-xs text-purple-950 space-y-1">
            <div className="font-bold">
              {ownOrdersCount === 0
                ? 'Based on category priors (0 orders)'
                : `${(blended.weightOwn * 100).toFixed(0)}% your data (${ownOrdersCount} orders)`}
            </div>
            <div className="text-[11px] text-purple-700">
              Blended return share: <span className="font-bold">{(blended.blendedReturnShare * 100).toFixed(1)}%</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E6E6EB] shadow-xs space-y-6">
        <div className="flex items-center space-x-2 border-b border-gray-100 pb-4">
          <Sliders className="w-5 h-5 text-[#4A2BD0]" />
          <h2 className="text-xl font-bold text-[#1C1C1C]">
            Interactive Scenario Simulator
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-6 space-y-4 bg-gray-50 p-6 rounded-2xl border border-gray-200">
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-bold text-gray-700">
                <span>Planned Price (₹)</span>
                <span className="text-[#F43397]">₹{simPrice}</span>
              </div>
              <input
                type="range"
                min="250"
                max="400"
                step="5"
                value={simPrice}
                onChange={(e) => setSimPrice(parseFloat(e.target.value))}
                className="w-full accent-[#F43397]"
              />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-xs font-bold text-gray-700">
                <span>Customer Return Share (%)</span>
                <span className="text-[#4A2BD0]">{(simReturnShare * 100).toFixed(1)}%</span>
              </div>
              <input
                type="range"
                min="0.02"
                max="0.30"
                step="0.01"
                value={simReturnShare}
                onChange={(e) => setSimReturnShare(parseFloat(e.target.value))}
                className="w-full accent-[#4A2BD0]"
              />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-xs font-bold text-gray-700">
                <span>RTO Share (%)</span>
                <span className="text-[#4A2BD0]">{(simRtoShare * 100).toFixed(1)}%</span>
              </div>
              <input
                type="range"
                min="0.02"
                max="0.30"
                step="0.01"
                value={simRtoShare}
                onChange={(e) => setSimRtoShare(parseFloat(e.target.value))}
                className="w-full accent-[#4A2BD0]"
              />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-xs font-bold text-gray-700">
                <span>Shipping Rate (₹ pre-GST)</span>
                <span className="text-gray-900">₹{simShippingOverride}</span>
              </div>
              <input
                type="range"
                min="35"
                max="120"
                step="5"
                value={simShippingOverride}
                onChange={(e) => setSimShippingOverride(parseFloat(e.target.value))}
                className="w-full accent-gray-700"
              />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-xs font-bold text-gray-700">
                <span>Landed Product Cost C (₹)</span>
                <span className="text-gray-900">₹{simLandedCost}</span>
              </div>
              <input
                type="range"
                min="100"
                max="300"
                step="5"
                value={simLandedCost}
                onChange={(e) => setSimLandedCost(parseFloat(e.target.value))}
                className="w-full accent-gray-700"
              />
            </div>
          </div>

          <div className="lg:col-span-6 space-y-6">
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-[#FDF1F7] p-4 rounded-2xl border border-[#F6D3E6]">
                <span className="text-[11px] font-bold text-[#F43397] block">Simulated Floor</span>
                <span className="text-2xl font-black text-[#F43397]">₹{simFloor.toFixed(2)}</span>
              </div>

              <div
                className={`p-4 rounded-2xl border ${
                  simProfit >= 0 ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'
                }`}
              >
                <span className="text-[11px] font-bold block text-gray-600">Profit / Order</span>
                <span
                  className={`text-2xl font-black ${
                    simProfit >= 0 ? 'text-emerald-700' : 'text-red-700'
                  }`}
                >
                  {simProfit >= 0 ? `+₹${simProfit.toFixed(2)}` : `−₹${Math.abs(simProfit).toFixed(2)}`}
                </span>
              </div>

              <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200">
                <span className="text-[11px] font-bold text-gray-500 block">Band Zone</span>
                <span className="text-xl font-bold text-[#1C1C1C]">{simZone}</span>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500">
                {t('smartBand.profitHeatmap')}
              </h4>
              <div className="overflow-x-auto rounded-xl border border-gray-200">
                <table className="w-full text-center text-[10px]">
                  <thead className="bg-gray-100 text-gray-700 font-bold">
                    <tr>
                      <th className="py-2 px-1">Ret \ Price</th>
                      {heatmapPrices.map((p) => (
                        <th key={p} className="py-2 px-1">
                          ₹{p}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {heatmapReturnShares.map((ret) => {
                      return (
                        <tr key={ret} className="border-t border-gray-100">
                          <td className="py-1.5 px-1 font-bold text-gray-600 bg-gray-50">
                            {(ret * 100).toFixed(0)}%
                          </td>
                          {heatmapPrices.map((p) => {
                            const f_temp = catPriors.rtoShare + ret;
                            const fail_temp = calculateFailureCost(
                              catPriors.rtoShare,
                              ret,
                              sku.costPerRto,
                              rateCard.reverseFee,
                              0,
                              simS
                            );
                            const fl_temp = calculateFloorPrice(
                              simLandedCost,
                              simS,
                              f_temp,
                              fail_temp.F,
                              simAds
                            );
                            const profit_temp = (1 - f_temp) * (p - fl_temp);

                            let bgClass = 'bg-emerald-100 text-emerald-900';
                            if (profit_temp < 0) bgClass = 'bg-red-100 text-red-900';
                            else if (profit_temp > 20) bgClass = 'bg-emerald-300 text-emerald-950 font-bold';

                            return (
                              <td key={p} className={`py-1.5 px-1 ${bgClass}`}>
                                {profit_temp >= 0
                                  ? `+₹${profit_temp.toFixed(0)}`
                                  : `−₹${Math.abs(profit_temp).toFixed(0)}`}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
