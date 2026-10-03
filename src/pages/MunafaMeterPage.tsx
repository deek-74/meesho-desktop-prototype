import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  calculateBillableWeight,
  lookupShippingRate,
  calculateShippingAndFees,
  calculateFailureCost,
  calculateFloorPrice,
  calculateMinPrice,
  calculateProfitPerDispatched,
  calculateWaterfallPer100,
  checkWeightGuard,
  type RateCard,
} from '../engine/pricing';
import rateCardConfig from '../config/rateCard.json';
import categoryPriorsConfig from '../config/categoryPriors.json';
import { CalculationExplainer } from '../components/CalculationExplainer';
import { SpeechInputButton } from '../components/SpeechInputButton';
import {
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Package,
  Truck,
  RotateCcw,
  Sparkles,
  Info,
} from 'lucide-react';

const rateCard = rateCardConfig as RateCard;

export const MunafaMeterPage: React.FC = () => {
  const { t, lang, activeSKU, levers, toggleLever } = useApp();

  const [openCosts, setOpenCosts] = useState(true);
  const [openPackage, setOpenPackage] = useState(true);
  const [openReturns, setOpenReturns] = useState(true);

  const sku = activeSKU;
  const [purchaseCost, setPurchaseCost] = useState(sku.purchaseCost);
  const [packingCost, setPackingCost] = useState(sku.packingCost);
  const [labourCost, setLabourCost] = useState(sku.labourCost);

  const [actualWeight, setActualWeight] = useState(sku.actualWeightKg);
  const [declaredWeight, setDeclaredWeight] = useState(sku.declaredWeightKg);
  const [boxL, setBoxL] = useState(sku.boxDimensions.length);
  const [boxB, setBoxB] = useState(sku.boxDimensions.width);
  const [boxH, setBoxH] = useState(sku.boxDimensions.height);
  const [zone, setZone] = useState<'local' | 'zonal' | 'national'>(sku.zone);

  const [rtoShare, setRtoShare] = useState(sku.rtoShare);
  const [returnShare, setReturnShare] = useState(sku.returnShare);
  const [currentPrice, setCurrentPrice] = useState(sku.currentPrice);

  let effectiveReturnShare = returnShare;
  let effectiveRtoShare = rtoShare;
  let effectiveShippingDeduction = 0;
  let effectiveSourcingDeduction = 0;

  if (levers.defectiveOnly) {
    effectiveReturnShare = effectiveReturnShare * 0.5;
  }
  if (levers.sizeChart) {
    effectiveReturnShare = Math.max(0, effectiveReturnShare - 0.05);
  }
  if (levers.prepaid) {
    effectiveRtoShare = Math.max(0, effectiveRtoShare - 0.024);
  }
  if (levers.smallerBox) {
    effectiveShippingDeduction = 15;
  }
  if (levers.cheaperSourcing) {
    effectiveSourcingDeduction = 15;
  }

  const C = Math.max(0, purchaseCost + packingCost + labourCost - effectiveSourcingDeduction);

  const boxDims = { length: boxL, width: boxB, height: boxH };
  const billableKg = calculateBillableWeight(declaredWeight, boxDims, rateCard.volDivisor);

  let shippingRate: number | null = null;
  let rateMissing = false;
  let slabLabel = '';

  if (sku.shippingOverride && !levers.smallerBox) {
    shippingRate = sku.shippingOverride;
    slabLabel = 'Override (₹65)';
  } else {
    const lookup = lookupShippingRate(billableKg, zone, rateCard);
    slabLabel = lookup.slab ? lookup.slab.label : 'No slab found';
    rateMissing = lookup.rateMissing;
    if (lookup.rate !== null) {
      shippingRate = Math.max(0, lookup.rate - effectiveShippingDeduction);
    } else if (sku.shippingOverride) {
      shippingRate = Math.max(0, sku.shippingOverride - effectiveShippingDeduction);
      rateMissing = false;
    }
  }

  const S = shippingRate !== null ? calculateShippingAndFees(shippingRate, rateCard.platformFee, rateCard.gst) : 0;

  const catPriors = (categoryPriorsConfig.categories as any)[sku.category] || categoryPriorsConfig.categories.Fashion;
  const typicalWeightKg: [number, number] = catPriors.typicalWeightKg || [0.2, 1.0];
  const weightGuard = checkWeightGuard(declaredWeight, actualWeight, typicalWeightKg);

  const failCost = calculateFailureCost(
    effectiveRtoShare,
    effectiveReturnShare,
    sku.costPerRto,
    rateCard.reverseFee,
    rateCard.fwdLostOnReturn,
    S
  );

  const floorPrice = calculateFloorPrice(C, S, failCost.f, failCost.F, sku.adsPerDispatched);
  const minPrice = calculateMinPrice(floorPrice, 20);
  const profitPerDispatched = calculateProfitPerDispatched(currentPrice, floorPrice, failCost.f);

  const waterfall = calculateWaterfallPer100(
    currentPrice,
    C,
    S,
    effectiveRtoShare,
    effectiveReturnShare,
    sku.costPerRto,
    failCost.costPerReturn,
    sku.adsPerDispatched
  );

  const baseS = sku.shippingOverride
    ? calculateShippingAndFees(sku.shippingOverride, rateCard.platformFee, rateCard.gst)
    : S;
  const baseFailCost = calculateFailureCost(
    sku.rtoShare,
    sku.returnShare,
    sku.costPerRto,
    rateCard.reverseFee,
    0,
    baseS
  );
  const baseFloor = calculateFloorPrice(
    purchaseCost + packingCost + labourCost,
    baseS,
    baseFailCost.f,
    baseFailCost.F,
    sku.adsPerDispatched
  );

  const isLeverActive =
    levers.defectiveOnly || levers.sizeChart || levers.prepaid || levers.smallerBox || levers.cheaperSourcing;

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-[#E6E6EB] shadow-2xs">
        <div>
          <span className="px-2.5 py-0.5 bg-[#FDF1F7] text-[#F43397] font-bold text-xs rounded-full">
            MUNAFA METER
          </span>
          <h1 className="text-3xl font-extrabold text-[#1C1C1C] mt-1">
            True Floor Price Calculator
          </h1>
          <p className="text-sm text-[#5F6368]">
            Active SKU: <span className="font-bold text-[#1C1C1C]">{sku.name}</span> ({sku.category})
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="text-right">
            <span className="text-xs text-gray-500 block">Current Selling Price</span>
            <div className="flex items-center space-x-1">
              <span className="text-xs font-bold text-gray-400">₹</span>
              <input
                type="number"
                value={currentPrice}
                onChange={(e) => setCurrentPrice(parseFloat(e.target.value) || 0)}
                className="w-24 px-2 py-1 border border-gray-300 rounded-lg text-lg font-bold text-[#1C1C1C] text-right focus:outline-none focus:ring-2 focus:ring-[#4A2BD0]"
              />
            </div>
          </div>
        </div>
      </div>

      {(weightGuard.isError || rateMissing) && (
        <div className="p-4 bg-red-50 rounded-2xl border-2 border-red-300 flex items-start space-x-3 text-red-900 animate-in slide-in-from-top duration-300">
          <AlertTriangle className="w-6 h-6 text-red-600 shrink-0 mt-0.5" />
          <div className="space-y-1 text-sm">
            <span className="font-bold text-red-800 uppercase tracking-wide text-xs block">
              LISTING HEALTH GUARD ALERT
            </span>
            <p className="font-medium">
              {weightGuard.message || 'Slab rate to be confirmed for this weight.'}
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-2xl border border-[#E6E6EB] shadow-2xs overflow-hidden">
            <button
              onClick={() => setOpenCosts(!openCosts)}
              className="w-full p-4 flex items-center justify-between bg-gray-50/80 hover:bg-gray-100/80 font-bold text-base text-[#1C1C1C] transition-colors"
            >
              <div className="flex items-center space-x-2">
                <Package className="w-5 h-5 text-[#4A2BD0]" />
                <span>{t('munafa.costsHeader')}</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-mono text-[#5B0F4E] bg-purple-50 px-2 py-0.5 rounded">
                  C = ₹{C.toFixed(2)}
                </span>
                {openCosts ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </div>
            </button>

            {openCosts && (
              <div className="p-4 space-y-4 border-t border-gray-100">
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-xs font-semibold text-gray-700">
                    <span>{t('munafa.purchaseCost')}</span>
                    <SpeechInputButton
                      onValueDetected={(val) => setPurchaseCost(val)}
                      lang={lang === 'hi' ? 'hi-IN' : 'en-IN'}
                    />
                  </div>
                  <input
                    type="number"
                    value={purchaseCost}
                    onChange={(e) => setPurchaseCost(parseFloat(e.target.value) || 0)}
                    className="w-full h-11 px-3 rounded-xl border border-gray-200 font-semibold text-sm focus:ring-2 focus:ring-[#4A2BD0] outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <span className="text-xs font-semibold text-gray-700 block">
                    {t('munafa.packingCost')}
                  </span>
                  <input
                    type="number"
                    value={packingCost}
                    onChange={(e) => setPackingCost(parseFloat(e.target.value) || 0)}
                    className="w-full h-11 px-3 rounded-xl border border-gray-200 font-semibold text-sm focus:ring-2 focus:ring-[#4A2BD0] outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <span className="text-xs font-semibold text-gray-700 block">
                    {t('munafa.labourCost')}
                  </span>
                  <input
                    type="number"
                    value={labourCost}
                    onChange={(e) => setLabourCost(parseFloat(e.target.value) || 0)}
                    className="w-full h-11 px-3 rounded-xl border border-gray-200 font-semibold text-sm focus:ring-2 focus:ring-[#4A2BD0] outline-none"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-[#E6E6EB] shadow-2xs overflow-hidden">
            <button
              onClick={() => setOpenPackage(!openPackage)}
              className="w-full p-4 flex items-center justify-between bg-gray-50/80 hover:bg-gray-100/80 font-bold text-base text-[#1C1C1C] transition-colors"
            >
              <div className="flex items-center space-x-2">
                <Truck className="w-5 h-5 text-[#4A2BD0]" />
                <span>{t('munafa.packageHeader')}</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-mono text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                  {billableKg.toFixed(2)} kg ({slabLabel})
                </span>
                {openPackage ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </div>
            </button>

            {openPackage && (
              <div className="p-4 space-y-4 border-t border-gray-100">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <span className="text-xs font-semibold text-gray-700 block">
                      {t('munafa.actualWeight')}
                    </span>
                    <input
                      type="number"
                      step="0.05"
                      value={actualWeight}
                      onChange={(e) => setActualWeight(parseFloat(e.target.value) || 0)}
                      className="w-full h-11 px-3 rounded-xl border border-gray-200 font-semibold text-sm focus:ring-2 focus:ring-[#4A2BD0] outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <span className="text-xs font-semibold text-gray-700 block">
                      {t('munafa.declaredWeight')}
                    </span>
                    <input
                      type="number"
                      step="0.05"
                      value={declaredWeight}
                      onChange={(e) => setDeclaredWeight(parseFloat(e.target.value) || 0)}
                      className={`w-full h-11 px-3 rounded-xl border font-semibold text-sm outline-none ${
                        weightGuard.isError ? 'border-red-500 bg-red-50 text-red-900' : 'border-gray-200'
                      }`}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-xs font-semibold text-gray-700 block">
                    {t('munafa.dimensions')}
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    <input
                      type="number"
                      placeholder="L"
                      value={boxL}
                      onChange={(e) => setBoxL(parseFloat(e.target.value) || 0)}
                      className="h-10 px-2 rounded-lg border border-gray-200 text-center font-medium text-xs"
                    />
                    <input
                      type="number"
                      placeholder="B"
                      value={boxB}
                      onChange={(e) => setBoxB(parseFloat(e.target.value) || 0)}
                      className="h-10 px-2 rounded-lg border border-gray-200 text-center font-medium text-xs"
                    />
                    <input
                      type="number"
                      placeholder="H"
                      value={boxH}
                      onChange={(e) => setBoxH(parseFloat(e.target.value) || 0)}
                      className="h-10 px-2 rounded-lg border border-gray-200 text-center font-medium text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-xs font-semibold text-gray-700 block">
                    {t('munafa.zone')}
                  </span>
                  <select
                    value={zone}
                    onChange={(e) => setZone(e.target.value as any)}
                    className="w-full h-11 px-3 rounded-xl border border-gray-200 font-semibold text-sm bg-white"
                  >
                    <option value="local">Local</option>
                    <option value="zonal">Zonal</option>
                    <option value="national">National</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-[#E6E6EB] shadow-2xs overflow-hidden">
            <button
              onClick={() => setOpenReturns(!openReturns)}
              className="w-full p-4 flex items-center justify-between bg-gray-50/80 hover:bg-gray-100/80 font-bold text-base text-[#1C1C1C] transition-colors"
            >
              <div className="flex items-center space-x-2">
                <RotateCcw className="w-5 h-5 text-[#4A2BD0]" />
                <span>{t('munafa.returnsHeader')}</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="px-2 py-0.5 bg-pink-50 text-[#F43397] font-mono text-xs rounded">
                  {(failCost.f * 100).toFixed(0)}% total failure
                </span>
                {openReturns ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </div>
            </button>

            {openReturns && (
              <div className="p-4 space-y-5 border-t border-gray-100">
                <div className="inline-flex items-center space-x-1.5 px-2.5 py-1 bg-gray-100 text-gray-600 rounded-md text-[11px] font-semibold">
                  <Info className="w-3.5 h-3.5" />
                  <span>{t('munafa.categoryDataTag')}</span>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold text-gray-700">
                    <span>{t('munafa.rtoShare')}</span>
                    <span className="font-bold text-[#F43397]">
                      {(rtoShare * 100).toFixed(1)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="0.4"
                    step="0.01"
                    value={rtoShare}
                    onChange={(e) => setRtoShare(parseFloat(e.target.value))}
                    className="w-full accent-[#F43397]"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold text-gray-700">
                    <span>{t('munafa.returnShare')}</span>
                    <span className="font-bold text-[#F43397]">
                      {(returnShare * 100).toFixed(1)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="0.4"
                    step="0.01"
                    value={returnShare}
                    onChange={(e) => setReturnShare(parseFloat(e.target.value))}
                    className="w-full accent-[#F43397]"
                  />
                </div>

                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 leading-relaxed font-medium">
                  {t('munafa.returnsNote')}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-7 space-y-6 lg:sticky lg:top-24">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E6E6EB] shadow-md space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#5F6368]">
                  {t('munafa.floorTitle')}
                </span>
                <div className="flex items-baseline space-x-3">
                  <span className="text-4xl sm:text-5xl font-black text-[#F43397] tracking-tight">
                    ₹{floorPrice.toFixed(2)}
                  </span>
                  {isLeverActive && (
                    <span className="px-2.5 py-1 bg-[#FDF1F7] text-[#F43397] font-extrabold text-xs rounded-full animate-pulse border border-[#F6D3E6]">
                      Floor ₹{baseFloor.toFixed(0)} → ₹{floorPrice.toFixed(0)}
                    </span>
                  )}
                </div>
              </div>

              <div className="bg-gray-50 p-3 rounded-2xl border border-gray-200 text-right">
                <span className="text-[11px] text-gray-500 font-medium block">
                  {t('munafa.minPriceTitle')}
                </span>
                <span className="text-lg font-bold text-[#1C1C1C]">
                  ₹{minPrice.toFixed(2)}
                </span>
              </div>
            </div>

            <div
              className={`p-4 rounded-2xl border flex items-center justify-between ${
                profitPerDispatched >= 0
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-red-50 border-red-200 text-red-900'
              }`}
            >
              <div className="space-y-0.5">
                <span className="text-xs font-bold block uppercase tracking-wider">
                  Profit per dispatched order @ ₹{currentPrice}
                </span>
                <span className="text-xs opacity-80">
                  Includes RTO & Customer Return failure costs
                </span>
              </div>
              <span
                className={`text-2xl font-extrabold ${
                  profitPerDispatched >= 0 ? 'text-emerald-700' : 'text-red-700'
                }`}
              >
                {profitPerDispatched >= 0 ? `+₹${profitPerDispatched.toFixed(2)}` : `−₹${Math.abs(profitPerDispatched).toFixed(2)}`}
              </span>
            </div>

            <CalculationExplainer
              skuName={sku.name}
              purchaseCost={purchaseCost}
              packingCost={packingCost}
              labourCost={labourCost}
              shippingRate={shippingRate || 0}
              zone={zone}
              rtoShare={effectiveRtoShare}
              returnShare={effectiveReturnShare}
              costPerRto={sku.costPerRto}
              ads={sku.adsPerDispatched}
              currentPrice={currentPrice}
              floorPrice={floorPrice}
              fwdLostOnReturn={rateCard.fwdLostOnReturn}
            />
          </div>

          <div className="bg-white rounded-3xl p-6 border border-[#E6E6EB] shadow-2xs space-y-4">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-[#F43397]" />
              <h3 className="text-base font-bold text-[#1C1C1C]">
                {t('munafa.leversTitle')}
              </h3>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => toggleLever('sizeChart')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all ${
                  levers.sizeChart
                    ? 'bg-[#F43397] text-white border-[#F43397] shadow-sm'
                    : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                }`}
              >
                Size chart & real photos (−5% returns)
              </button>

              <button
                onClick={() => toggleLever('prepaid')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all ${
                  levers.prepaid
                    ? 'bg-[#F43397] text-white border-[#F43397] shadow-sm'
                    : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                }`}
              >
                Prepaid nudge (+10% prepaid)
              </button>

              <button
                onClick={() => toggleLever('smallerBox')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all ${
                  levers.smallerBox
                    ? 'bg-[#F43397] text-white border-[#F43397] shadow-sm'
                    : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                }`}
              >
                Smaller box (−₹15 shipping)
              </button>

              <button
                onClick={() => toggleLever('cheaperSourcing')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all ${
                  levers.cheaperSourcing
                    ? 'bg-[#F43397] text-white border-[#F43397] shadow-sm'
                    : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                }`}
              >
                Cheaper sourcing (−₹15 cost)
              </button>

              <button
                onClick={() => toggleLever('defectiveOnly')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all ${
                  levers.defectiveOnly
                    ? 'bg-[#F43397] text-white border-[#F43397] shadow-sm'
                    : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                }`}
              >
                Defective-only returns (50% returns)
              </button>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-[#E6E6EB] shadow-2xs space-y-4">
            <h3 className="text-base font-bold text-[#1C1C1C]">
              {t('munafa.waterfallTitle')}
            </h3>

            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <div className="flex justify-between font-semibold">
                  <span>1. Revenue ({waterfall.kept.toFixed(0)} kept orders × ₹{currentPrice})</span>
                  <span className="font-bold text-gray-900">₹{waterfall.revenue.toFixed(2)}</span>
                </div>
                <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                  <div className="bg-blue-600 h-full rounded-full w-full"></div>
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between font-semibold">
                  <span>2. Product Landed Cost ({waterfall.kept.toFixed(0)} × ₹{C.toFixed(2)})</span>
                  <span className="font-bold text-red-600">−₹{waterfall.productCost.toFixed(2)}</span>
                </div>
                <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-red-400 h-full rounded-full"
                    style={{ width: `${Math.min(100, (waterfall.productCost / waterfall.revenue) * 100)}%` }}
                  ></div>
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between font-semibold">
                  <span>3. Shipping + GST ({waterfall.kept.toFixed(0)} × ₹{S.toFixed(2)})</span>
                  <span className="font-bold text-red-600">−₹{waterfall.shippingCost.toFixed(2)}</span>
                </div>
                <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-amber-400 h-full rounded-full"
                    style={{ width: `${Math.min(100, (waterfall.shippingCost / waterfall.revenue) * 100)}%` }}
                  ></div>
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between font-semibold">
                  <span>4. RTO Failure Loss ({(effectiveRtoShare * 100).toFixed(1)}% × ₹{sku.costPerRto})</span>
                  <span className="font-bold text-red-600">−₹{waterfall.rtoCost.toFixed(2)}</span>
                </div>
                <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-purple-400 h-full rounded-full"
                    style={{ width: `${Math.min(100, (waterfall.rtoCost / waterfall.revenue) * 100)}%` }}
                  ></div>
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between font-semibold">
                  <span>5. Customer Return Loss ({(effectiveReturnShare * 100).toFixed(1)}% × ₹{failCost.costPerReturn.toFixed(2)})</span>
                  <span className="font-bold text-red-600">−₹{waterfall.returnCost.toFixed(2)}</span>
                </div>
                <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-rose-500 h-full rounded-full"
                    style={{ width: `${Math.min(100, (waterfall.returnCost / waterfall.revenue) * 100)}%` }}
                  ></div>
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between font-semibold">
                  <span>6. Marketing & Ads (100 × ₹{sku.adsPerDispatched})</span>
                  <span className="font-bold text-red-600">−₹{waterfall.adsCost.toFixed(2)}</span>
                </div>
                <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-indigo-400 h-full rounded-full"
                    style={{ width: `${Math.min(100, (waterfall.adsCost / waterfall.revenue) * 100)}%` }}
                  ></div>
                </div>
              </div>

              <div className="pt-2 border-t border-gray-200 flex justify-between items-center text-sm font-extrabold">
                <span>Net Kept Profit (per 100 dispatched)</span>
                <span className={waterfall.profit >= 0 ? 'text-emerald-700' : 'text-red-700'}>
                  {waterfall.profit >= 0 ? `+₹${waterfall.profit.toFixed(2)}` : `−₹${Math.abs(waterfall.profit).toFixed(2)}`}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
