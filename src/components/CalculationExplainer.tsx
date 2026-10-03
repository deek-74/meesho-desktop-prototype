import React, { useState } from 'react';
import { Info, X, ChevronDown, ChevronUp } from 'lucide-react';
import rateCardConfig from '../config/rateCard.json';

interface CalculationExplainerProps {
  skuName: string;
  purchaseCost: number;
  packingCost: number;
  labourCost: number;
  shippingRate: number;
  zone: string;
  rtoShare: number;
  returnShare: number;
  costPerRto: number;
  ads: number;
  currentPrice: number;
  floorPrice: number;
  fwdLostOnReturn?: number;
}

export const CalculationExplainer: React.FC<CalculationExplainerProps> = ({
  skuName,
  purchaseCost,
  packingCost,
  labourCost,
  shippingRate,
  zone,
  rtoShare,
  returnShare,
  costPerRto,
  ads,
  currentPrice,
  floorPrice,
  fwdLostOnReturn = 0,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const gst = rateCardConfig.gst;
  const reverseFee = rateCardConfig.reverseFee;
  const C = purchaseCost + packingCost + labourCost;
  const S = (shippingRate + rateCardConfig.platformFee) * (1 + gst);
  const costPerReturn = reverseFee + fwdLostOnReturn * S;
  const f = rtoShare + returnShare;
  const rtoComp = rtoShare * costPerRto;
  const retComp = returnShare * costPerReturn;
  const failureNumerator = rtoComp + retComp;
  const F = f > 0 ? failureNumerator / f : 0;
  const numerTotal = failureNumerator + ads;
  const denom = 1 - f;
  const riskCostPerDispatched = denom > 0 ? numerTotal / denom : 0;

  const profitPerDispatched = (1 - f) * (currentPrice - floorPrice);
  const profit100 = profitPerDispatched * 100;

  return (
    <div className="mt-3">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center space-x-1.5 text-xs font-semibold text-[#4A2BD0] hover:text-[#5B0F4E] underline cursor-pointer transition-colors"
      >
        <Info className="w-3.5 h-3.5" />
        <span>ⓘ How we calculated this</span>
        {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
      </button>

      {isOpen && (
        <div className="mt-3 p-4 bg-slate-900 text-slate-100 rounded-xl text-xs space-y-4 shadow-xl border border-slate-700 animate-in fade-in duration-200">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="font-bold text-pink-400 text-sm">
              Formula Breakdown: {skuName}
            </span>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-white p-1 rounded"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-1 bg-slate-800/80 p-2.5 rounded-lg border border-slate-700">
            <div className="font-semibold text-emerald-400">
              1. Landed Cost C = Purchase + Packing + Labour
            </div>
            <div className="font-mono text-[11px] text-slate-300">
              C = ₹{purchaseCost} + ₹{packingCost} + ₹{labourCost} = <span className="text-white font-bold">₹{C.toFixed(2)}</span>
            </div>
          </div>

          <div className="space-y-1 bg-slate-800/80 p-2.5 rounded-lg border border-slate-700">
            <div className="font-semibold text-emerald-400">
              2. Shipping & Fees S = (Shipping Rate + Platform Fee) × (1 + GST)
            </div>
            <div className="font-mono text-[11px] text-slate-300">
              S = (₹{shippingRate.toFixed(2)} + ₹0) × (1 + 0.18) = <span className="text-white font-bold">₹{S.toFixed(2)}</span> ({zone} zone)
            </div>
          </div>

          <div className="space-y-1 bg-slate-800/80 p-2.5 rounded-lg border border-slate-700">
            <div className="font-semibold text-emerald-400">
              3. Failure Risk Cost Per Order F
            </div>
            <div className="font-mono text-[11px] text-slate-300">
              Cost per RTO = ₹{costPerRto} | Cost per Return = ₹{reverseFee} (reverse fee) + {fwdLostOnReturn} × S = ₹{costPerReturn.toFixed(2)}
            </div>
            <div className="font-mono text-[11px] text-slate-300">
              f = {(rtoShare * 100).toFixed(1)}% RTO + {(returnShare * 100).toFixed(1)}% Returns = <span className="text-pink-300 font-bold">{(f * 100).toFixed(1)}%</span>
            </div>
            <div className="font-mono text-[11px] text-slate-300">
              F = [({rtoShare.toFixed(2)} × {costPerRto}) + ({returnShare.toFixed(2)} × {costPerReturn.toFixed(2)})] / {f.toFixed(2)} = <span className="text-white font-bold">₹{F.toFixed(2)}</span>
            </div>
          </div>

          <div className="space-y-1 bg-slate-800/80 p-2.5 rounded-lg border border-pink-900/50">
            <div className="font-semibold text-pink-400">
              4. True Floor Price Formula = C + S + (f × F + Ads) / (1 − f)
            </div>
            <div className="font-mono text-[11px] text-slate-300">
              Floor = ₹{C.toFixed(2)} + ₹{S.toFixed(2)} + [({(f * 100).toFixed(1)}% × ₹{F.toFixed(2)}) + ₹{ads}] / (1 − {f.toFixed(2)})
            </div>
            <div className="font-mono text-[11px] text-slate-300">
              Floor = ₹{C.toFixed(2)} + ₹{S.toFixed(2)} + ₹{riskCostPerDispatched.toFixed(2)} = <span className="text-pink-400 font-bold text-sm">₹{floorPrice.toFixed(2)}</span>
            </div>
          </div>

          <div className="space-y-1 bg-slate-800/80 p-2.5 rounded-lg border border-slate-700">
            <div className="font-semibold text-emerald-400">
              5. Net Profit per Dispatched Order = (1 − f) × (Price − Floor)
            </div>
            <div className="font-mono text-[11px] text-slate-300">
              Profit = (1 − {f.toFixed(2)}) × (₹{currentPrice} − ₹{floorPrice.toFixed(2)}) = <span className={profitPerDispatched >= 0 ? 'text-green-400 font-bold' : 'text-red-400 font-bold'}>₹{profitPerDispatched.toFixed(2)}</span>
            </div>
            <div className="font-mono text-[11px] text-slate-400">
              Per 100 dispatched orders: Kept {(100 * (1 - f)).toFixed(0)} orders = <span className={profit100 >= 0 ? 'text-green-400 font-bold' : 'text-red-400 font-bold'}>₹{profit100.toFixed(2)} profit</span>
            </div>
          </div>

          <div className="pt-1 text-[10px] text-slate-400 italic">
            * Standardized pricing engine formula derived from Meesho DICE Pricing Framework.
          </div>
        </div>
      )}
    </div>
  );
};
