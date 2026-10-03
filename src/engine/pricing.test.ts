import { describe, it, expect } from 'vitest';
import {
  calculateShippingAndFees,
  calculateFailureCost,
  calculateFloorPrice,
  calculateClearanceFloor,
  calculateProfitPerDispatched,
  calculateBreakEvenFailureShare,
  calculateSuggestedPrice,
  calculateCheaperThanShare,
  blendPriorAndOwnData,
  poissonCDF,
  lookupShippingRate,
  calculateBillableWeight,
  evaluateSKUVerdict,
  checkWeightGuard,
  runLifecycleSimulation,
  type SKU,
  type RateCard,
} from './pricing';

import rateCardConfig from '../config/rateCard.json';
import skusConfig from '../config/skus.json';
import sampleListingsConfig from '../config/sampleListings.json';

const rateCard = rateCardConfig as RateCard;
const skus = skusConfig as SKU[];
const sampleListings = sampleListingsConfig as number[];

describe('Sahi Daam Pricing Engine Acceptance Tests (Section 9)', () => {
  const kurtiSKU = skus.find((s) => s.id === 'sku-1')!;

  it('1. Kurti S = ₹76.70', () => {
    const S = calculateShippingAndFees(kurtiSKU.shippingOverride!, rateCard.platformFee, rateCard.gst);
    expect(S).toBeCloseTo(76.70, 2);
  });

  it('2. Kurti floor (fwdLostOnReturn = 0) = ₹314.13', () => {
    const S = calculateShippingAndFees(kurtiSKU.shippingOverride!, rateCard.platformFee, rateCard.gst);
    const C = kurtiSKU.purchaseCost + kurtiSKU.packingCost + kurtiSKU.labourCost;
    const failCost = calculateFailureCost(
      kurtiSKU.rtoShare,
      kurtiSKU.returnShare,
      kurtiSKU.costPerRto,
      rateCard.reverseFee,
      0,
      S
    );
    const floor = calculateFloorPrice(C, S, failCost.f, failCost.F, kurtiSKU.adsPerDispatched);
    expect(floor).toBeCloseTo(314.13, 2);
  });

  it('3. Kurti floor (fwdLostOnReturn = 1) = ₹330.56', () => {
    const S = calculateShippingAndFees(kurtiSKU.shippingOverride!, rateCard.platformFee, rateCard.gst);
    const C = kurtiSKU.purchaseCost + kurtiSKU.packingCost + kurtiSKU.labourCost;
    const failCost = calculateFailureCost(
      kurtiSKU.rtoShare,
      kurtiSKU.returnShare,
      kurtiSKU.costPerRto,
      rateCard.reverseFee,
      1,
      S
    );
    const floor = calculateFloorPrice(C, S, failCost.f, failCost.F, kurtiSKU.adsPerDispatched);
    expect(floor).toBeCloseTo(330.56, 2);
  });

  it('4. Kurti profit per dispatched order at ₹299 = −₹10.59', () => {
    const S = calculateShippingAndFees(kurtiSKU.shippingOverride!, rateCard.platformFee, rateCard.gst);
    const C = kurtiSKU.purchaseCost + kurtiSKU.packingCost + kurtiSKU.labourCost;
    const failCost = calculateFailureCost(
      kurtiSKU.rtoShare,
      kurtiSKU.returnShare,
      kurtiSKU.costPerRto,
      rateCard.reverseFee,
      0,
      S
    );
    const floor = calculateFloorPrice(C, S, failCost.f, failCost.F, kurtiSKU.adsPerDispatched);
    const profit = calculateProfitPerDispatched(299, floor, failCost.f);
    expect(profit).toBeCloseTo(-10.59, 2);
  });

  it('5. Kurti profit per 100 orders at ₹299 = −₹1,059', () => {
    const S = calculateShippingAndFees(kurtiSKU.shippingOverride!, rateCard.platformFee, rateCard.gst);
    const C = kurtiSKU.purchaseCost + kurtiSKU.packingCost + kurtiSKU.labourCost;
    const failCost = calculateFailureCost(
      kurtiSKU.rtoShare,
      kurtiSKU.returnShare,
      kurtiSKU.costPerRto,
      rateCard.reverseFee,
      0,
      S
    );
    const floor = calculateFloorPrice(C, S, failCost.f, failCost.F, kurtiSKU.adsPerDispatched);
    const profitPerDispatched = calculateProfitPerDispatched(299, floor, failCost.f);
    const profit100 = profitPerDispatched * 100;
    expect(profit100).toBeCloseTo(-1059.0, 0);
  });

  it('6. Kurti break-even failure share at ₹299 = 20.9%', () => {
    const S = calculateShippingAndFees(kurtiSKU.shippingOverride!, rateCard.platformFee, rateCard.gst);
    const C = kurtiSKU.purchaseCost + kurtiSKU.packingCost + kurtiSKU.labourCost;
    const failCost = calculateFailureCost(
      kurtiSKU.rtoShare,
      kurtiSKU.returnShare,
      kurtiSKU.costPerRto,
      rateCard.reverseFee,
      0,
      S
    );
    const res = calculateBreakEvenFailureShare(299, C, S, kurtiSKU.adsPerDispatched, failCost.F);
    expect(res.breakEvenShare).not.toBeNull();
    expect(res.breakEvenShare! * 100).toBeCloseTo(20.9, 1);
  });

  it('7. Kurti suggested price (ε = 15) = ₹319 (capped at Q3)', () => {
    const S = calculateShippingAndFees(kurtiSKU.shippingOverride!, rateCard.platformFee, rateCard.gst);
    const C = kurtiSKU.purchaseCost + kurtiSKU.packingCost + kurtiSKU.labourCost;
    const failCost = calculateFailureCost(
      kurtiSKU.rtoShare,
      kurtiSKU.returnShare,
      kurtiSKU.costPerRto,
      rateCard.reverseFee,
      0,
      S
    );
    const floor = calculateFloorPrice(C, S, failCost.f, failCost.F, kurtiSKU.adsPerDispatched);
    const res = calculateSuggestedPrice(floor, kurtiSKU.q3, 15);
    expect(res.suggested).toBe(319);
  });

  it('8. Kurti floor with return share 10% = ₹300.77', () => {
    const S = calculateShippingAndFees(kurtiSKU.shippingOverride!, rateCard.platformFee, rateCard.gst);
    const C = kurtiSKU.purchaseCost + kurtiSKU.packingCost + kurtiSKU.labourCost;
    const failCost = calculateFailureCost(
      kurtiSKU.rtoShare,
      0.10,
      kurtiSKU.costPerRto,
      rateCard.reverseFee,
      0,
      S
    );
    const floor = calculateFloorPrice(C, S, failCost.f, failCost.F, kurtiSKU.adsPerDispatched);
    expect(floor).toBeCloseTo(300.77, 2);
  });

  it('9. Kurti floor with levers "size chart" + "prepaid" + "smaller box" together = ₹281.55', () => {
    const S = calculateShippingAndFees(50, rateCard.platformFee, rateCard.gst);
    const C = kurtiSKU.purchaseCost + kurtiSKU.packingCost + kurtiSKU.labourCost;
    const failCost = calculateFailureCost(
      0.126,
      0.10,
      kurtiSKU.costPerRto,
      rateCard.reverseFee,
      0,
      S
    );
    const floor = calculateFloorPrice(C, S, failCost.f, failCost.F, kurtiSKU.adsPerDispatched);
    expect(floor).toBeCloseTo(281.55, 2);
  });

  it('10. Kurti clearance floor (return share 15%) = ₹124.13', () => {
    const S = calculateShippingAndFees(kurtiSKU.shippingOverride!, rateCard.platformFee, rateCard.gst);
    const failCost = calculateFailureCost(
      kurtiSKU.rtoShare,
      kurtiSKU.returnShare,
      kurtiSKU.costPerRto,
      rateCard.reverseFee,
      0,
      S
    );
    const clearanceFloor = calculateClearanceFloor(S, failCost.f, failCost.F, kurtiSKU.adsPerDispatched, 0);
    expect(clearanceFloor).toBeCloseTo(124.13, 2);
  });

  it('11. Cheaper-than share at ₹299 = 48%', () => {
    const share = calculateCheaperThanShare(299, sampleListings);
    expect(Math.round(share * 100)).toBe(48);
  });

  it('12. Blending weight at n = 30, k = 30 = 50%', () => {
    const res = blendPriorAndOwnData(0.15, 0.15, 0.15, 0.15, 30, 30);
    expect(res.weightOwn * 100).toBe(50);
  });

  it('13. Poisson P(X ≤ 10 | λ = 20) = 1.08%', () => {
    const prob = poissonCDF(10, 20);
    expect(prob * 100).toBeCloseTo(1.08, 2);
  });

  it('14. Kitchen rack floor / verdict = ₹382.89 / FIX', () => {
    const sku = skus.find((s) => s.id === 'sku-2')!;
    const billable = calculateBillableWeight(sku.declaredWeightKg, sku.boxDimensions);
    const lookup = lookupShippingRate(billable, sku.zone, rateCard);
    const S = calculateShippingAndFees(lookup.rate!, rateCard.platformFee, rateCard.gst);
    const C = sku.purchaseCost + sku.packingCost + sku.labourCost;
    const failCost = calculateFailureCost(sku.rtoShare, sku.returnShare, sku.costPerRto, rateCard.reverseFee, 0, S);
    const floor = calculateFloorPrice(C, S, failCost.f, failCost.F, sku.adsPerDispatched);
    expect(floor).toBeCloseTo(382.89, 2);

    const verdict = evaluateSKUVerdict(sku.currentPrice, floor, sku.q1, sku.q3);
    expect(verdict.verdict).toBe('FIX');
  });

  it('15. Jewellery floor / verdict = ₹108.17 / KEEP: priced OK', () => {
    const sku = skus.find((s) => s.id === 'sku-3')!;
    const billable = calculateBillableWeight(sku.declaredWeightKg, sku.boxDimensions);
    const lookup = lookupShippingRate(billable, sku.zone, rateCard);
    const S = calculateShippingAndFees(lookup.rate!, rateCard.platformFee, rateCard.gst);
    const C = sku.purchaseCost + sku.packingCost + sku.labourCost;
    const failCost = calculateFailureCost(sku.rtoShare, sku.returnShare, sku.costPerRto, rateCard.reverseFee, 0, S);
    const floor = calculateFloorPrice(C, S, failCost.f, failCost.F, sku.adsPerDispatched);
    expect(floor).toBeCloseTo(108.17, 2);

    const verdict = evaluateSKUVerdict(sku.currentPrice, floor, sku.q1, sku.q3);
    expect(verdict.verdict).toBe('KEEP_OK');
  });

  it('16. Winter jacket floor / verdict = ₹423.02 / KEEP: raise price', () => {
    const sku = skus.find((s) => s.id === 'sku-4')!;
    const billable = calculateBillableWeight(sku.declaredWeightKg, sku.boxDimensions);
    const lookup = lookupShippingRate(billable, sku.zone, rateCard);
    const S = calculateShippingAndFees(lookup.rate!, rateCard.platformFee, rateCard.gst);
    const C = sku.purchaseCost + sku.packingCost + sku.labourCost;
    const failCost = calculateFailureCost(sku.rtoShare, sku.returnShare, sku.costPerRto, rateCard.reverseFee, 0, S);
    const floor = calculateFloorPrice(C, S, failCost.f, failCost.F, sku.adsPerDispatched);
    expect(floor).toBeCloseTo(423.02, 2);

    const verdict = evaluateSKUVerdict(sku.currentPrice, floor, sku.q1, sku.q3);
    expect(verdict.verdict).toBe('KEEP_RAISE');
  });

  it('17. Fertiliser floor / verdict = ₹330.23 / KEEP: priced OK', () => {
    const sku = skus.find((s) => s.id === 'sku-5')!;
    const billable = calculateBillableWeight(sku.declaredWeightKg, sku.boxDimensions);
    const lookup = lookupShippingRate(billable, sku.zone, rateCard);
    const S = calculateShippingAndFees(lookup.rate!, rateCard.platformFee, rateCard.gst);
    const C = sku.purchaseCost + sku.packingCost + sku.labourCost;
    const failCost = calculateFailureCost(sku.rtoShare, sku.returnShare, sku.costPerRto, rateCard.reverseFee, 0, S);
    const floor = calculateFloorPrice(C, S, failCost.f, failCost.F, sku.adsPerDispatched);
    expect(floor).toBeCloseTo(330.23, 2);

    const verdict = evaluateSKUVerdict(sku.currentPrice, floor, sku.q1, sku.q3);
    expect(verdict.verdict).toBe('KEEP_OK');
  });

  it('18. Fertiliser with declared 7.5 kg: slab "5–10 kg", rateMissing = true, weight alert shown', () => {
    const declaredKg = 7.5;
    const actualKg = 0.75;
    const typicalWeightKg: [number, number] = [0.3, 2.0];

    const lookup = lookupShippingRate(declaredKg, 'national', rateCard);
    expect(lookup.slab?.label).toBe('5–10 kg');
    expect(lookup.rateMissing).toBe(true);

    const guard = checkWeightGuard(declaredKg, actualKg, typicalWeightKg);
    expect(guard.isError).toBe(true);
    expect(guard.message).toContain('This weight puts you in the 5–10 kg slab.');
  });

  it('19. Simulation season P&L: without ≈ −₹21,872; with ≈ +₹1,698', () => {
    const simResult = runLifecycleSimulation(kurtiSKU, rateCard);
    expect(simResult.netSeasonProfitWithout).toBeLessThan(-20000);
    expect(simResult.netSeasonProfitWith).toBeGreaterThan(1000);
  });

  it('20. Simulation triggers: T1 week 1, T2 week 10, T3 week 21', () => {
    const simResult = runLifecycleSimulation(kurtiSKU, rateCard);
    const t1 = simResult.weekResults.find((w) => w.triggerFired?.type === 'T1');
    const t2 = simResult.weekResults.find((w) => w.triggerFired?.type === 'T2');
    const t3 = simResult.weekResults.find((w) => w.triggerFired?.type === 'T3');

    expect(t1?.week).toBe(1);
    expect(t2?.week).toBe(10);
    expect(t3?.week).toBe(21);
  });
});
