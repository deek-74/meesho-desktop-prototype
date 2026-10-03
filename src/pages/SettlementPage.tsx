import React from 'react';
import { useApp } from '../context/AppContext';
import rateCardConfig from '../config/rateCard.json';
import { ArrowDown, ShieldCheck } from 'lucide-react';

export const SettlementPage: React.FC = () => {
  const { t, activeSKU } = useApp();
  const sku = activeSKU;

  const listedPrice = sku.currentPrice;
  const shippingPreGst = sku.shippingOverride || 65;
  const gstOnShipping = shippingPreGst * rateCardConfig.gst;
  const totalLogisticsDeduction = shippingPreGst + gstOnShipping;
  const bankPayout = listedPrice - totalLogisticsDeduction;

  const tcsAmount = listedPrice * rateCardConfig.tcs;
  const tdsAmount = listedPrice * rateCardConfig.tds;

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-12">
      <div className="bg-white p-6 rounded-3xl border border-[#E6E6EB] shadow-2xs text-center space-y-2">
        <span className="px-2.5 py-0.5 bg-[#FDF1F7] text-[#F43397] font-bold text-xs rounded-full">
          SETTLEMENT EXPLAINER
        </span>
        <h1 className="text-3xl font-extrabold text-[#1C1C1C]">
          {t('settlement.title')}
        </h1>
        <p className="text-sm text-[#5F6368]">
          {t('settlement.subtitle')} for <span className="font-bold text-[#1C1C1C]">{sku.name}</span>
        </p>
      </div>

      <div className="bg-white rounded-3xl p-8 border border-[#E6E6EB] shadow-md space-y-6">
        <div className="flex items-start space-x-4 p-4 rounded-2xl bg-gray-50 border border-gray-200">
          <div className="w-10 h-10 rounded-xl bg-[#4A2BD0] text-white flex items-center justify-center font-bold text-lg shrink-0">
            1
          </div>
          <div className="flex-1 space-y-1">
            <h3 className="font-bold text-base text-[#1C1C1C]">
              {t('settlement.step1')}
            </h3>
            <p className="text-xs text-gray-500">
              Price displayed to end customer on platform
            </p>
          </div>
          <span className="text-2xl font-black text-[#1C1C1C]">
            ₹{listedPrice.toFixed(2)}
          </span>
        </div>

        <div className="flex justify-center text-gray-400">
          <ArrowDown className="w-5 h-5" />
        </div>

        <div className="flex items-start space-x-4 p-4 rounded-2xl bg-red-50/70 border border-red-200">
          <div className="w-10 h-10 rounded-xl bg-red-600 text-white flex items-center justify-center font-bold text-lg shrink-0">
            2
          </div>
          <div className="flex-1 space-y-1">
            <h3 className="font-bold text-base text-red-950">
              {t('settlement.step2')}
            </h3>
            <p className="text-xs text-red-800">
              Base 3PL shipping rate for {sku.zone} zone
            </p>
          </div>
          <span className="text-2xl font-black text-red-700">
            −₹{shippingPreGst.toFixed(2)}
          </span>
        </div>

        <div className="flex justify-center text-gray-400">
          <ArrowDown className="w-5 h-5" />
        </div>

        <div className="flex items-start space-x-4 p-4 rounded-2xl bg-red-50/70 border border-red-200">
          <div className="w-10 h-10 rounded-xl bg-red-600 text-white flex items-center justify-center font-bold text-lg shrink-0">
            3
          </div>
          <div className="flex-1 space-y-1">
            <h3 className="font-bold text-base text-red-950">
              {t('settlement.step3')}
            </h3>
            <p className="text-xs text-red-800">
              18% GST collected on shipping fee (₹{shippingPreGst} × 18%)
            </p>
          </div>
          <span className="text-2xl font-black text-red-700">
            −₹{gstOnShipping.toFixed(2)}
          </span>
        </div>

        <div className="flex justify-center text-gray-400">
          <ArrowDown className="w-5 h-5" />
        </div>

        <div className="flex items-start space-x-4 p-6 rounded-2xl bg-emerald-50 border-2 border-emerald-300 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-xl shrink-0">
            4
          </div>
          <div className="flex-1 space-y-1">
            <h3 className="font-bold text-lg text-emerald-950">
              {t('settlement.step4')}
            </h3>
            <p className="text-xs text-emerald-800 font-medium">
              Net settlement credited directly to your bank account per order
            </p>
          </div>
          <span className="text-3xl font-black text-emerald-700">
            ₹{bankPayout.toFixed(2)}
          </span>
        </div>

        <div className="p-5 bg-blue-50 rounded-2xl border border-blue-200 space-y-2 text-xs text-blue-950">
          <div className="flex items-center space-x-2 text-blue-900 font-bold text-sm">
            <ShieldCheck className="w-5 h-5 text-blue-600" />
            <span>Government Tax Credits Note (TCS & TDS)</span>
          </div>
          <p className="leading-relaxed font-medium">
            {t('settlement.taxNote')}
          </p>
          <div className="flex items-center space-x-4 text-blue-900 font-mono text-xs pt-1 border-t border-blue-200">
            <span>TCS (0.5%): ₹{tcsAmount.toFixed(2)} credited</span>
            <span>TDS (0.1%): ₹{tdsAmount.toFixed(2)} credited</span>
          </div>
        </div>
      </div>
    </div>
  );
};
