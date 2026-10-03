import rateCardConfig from '../config/rateCard.json';

export interface BoxDimensions {
  length: number;
  width: number;
  height: number;
}

export interface Slab {
  fromKg: number;
  label: string;
  local: number | null;
  zonal: number | null;
  national: number | null;
}

export interface RateCard {
  gst: number;
  platformFee: number;
  volDivisor: number;
  reverseFee: number;
  fwdLostOnReturn: number;
  costPerRtoDefault: number;
  tcs: number;
  tds: number;
  slabs: Slab[];
}

export interface CategoryPrior {
  rtoShare: number;
  returnShare: number;
  eps: number;
  typicalWeightKg: [number, number];
}

export interface SKU {
  id: string;
  name: string;
  category: string;
  purchaseCost: number;
  packingCost: number;
  labourCost: number;
  actualWeightKg: number;
  declaredWeightKg: number;
  boxDimensions: BoxDimensions;
  zone: 'local' | 'zonal' | 'national';
  shippingOverride: number | null;
  rtoShare: number;
  returnShare: number;
  costPerRto: number;
  adsPerDispatched: number;
  q1: number;
  q3: number;
  currentPrice: number;
  rating: number;
  ratingsCount: number;
}

// 6.1 Volumetric & Billable Weight
export function calculateVolumetricWeight(box: BoxDimensions, volDivisor: number = 5000): number {
  return (box.length * box.width * box.height) / volDivisor;
}

export function calculateBillableWeight(declaredKg: number, box: BoxDimensions, volDivisor: number = 5000): number {
  const volWeight = calculateVolumetricWeight(box, volDivisor);
  return Math.max(declaredKg, volWeight);
}

export function lookupShippingRate(
  billableKg: number,
  zone: 'local' | 'zonal' | 'national',
  rateCard: RateCard = rateCardConfig as RateCard
): { slab: Slab | null; rate: number | null; rateMissing: boolean } {
  // Sort slabs by fromKg ascending
  const sortedSlabs = [...rateCard.slabs].sort((a, b) => a.fromKg - b.fromKg);
  const matchingSlabs = sortedSlabs.filter((s) => s.fromKg <= billableKg);
  const slab = matchingSlabs.length > 0 ? matchingSlabs[matchingSlabs.length - 1] : null;

  if (!slab) {
    return { slab: null, rate: null, rateMissing: true };
  }

  const rate = slab[zone];
  if (rate === null || rate === undefined) {
    return { slab, rate: null, rateMissing: true };
  }

  return { slab, rate, rateMissing: false };
}

export function calculateShippingAndFees(
  shippingRate: number,
  platformFee: number = 0,
  gst: number = 0.18
): number {
  return (shippingRate + platformFee) * (1 + gst);
}

// 6.2 Failures Cost Calculation
export function calculateFailureCost(
  rtoShare: number,
  returnShare: number,
  costPerRto: number,
  reverseFee: number,
  fwdLostOnReturn: number,
  S: number
): { f: number; costPerReturn: number; F: number } {
  const costPerReturn = reverseFee + fwdLostOnReturn * S;
  const f = rtoShare + returnShare;
  const F = f > 0 ? (rtoShare * costPerRto + returnShare * costPerReturn) / f : 0;
  return { f, costPerReturn, F };
}

// 6.3 Floor & Profit Calculations
export function calculateFloorPrice(C: number, S: number, f: number, F: number, ads: number): number {
  if (f >= 1) return Infinity;
  return C + S + (f * F + ads) / (1 - f);
}

export function calculateClearanceFloor(
  S: number,
  f: number,
  F: number,
  ads: number,
  salvage: number = 0
): number {
  if (f >= 1) return Infinity;
  return S + (f * F + ads) / (1 - f) + salvage;
}

export function calculateMinPrice(floor: number, targetProfit: number): number {
  return floor + targetProfit;
}

export function calculateProfitPerDispatched(price: number, floor: number, f: number): number {
  return (1 - f) * (price - floor);
}

export function calculateBreakEvenFailureShare(
  price: number,
  C: number,
  S: number,
  ads: number,
  F: number
): { breakEvenShare: number | null; error: string | null } {
  const numerator = price - C - S - ads;
  if (numerator < 0) {
    return { breakEvenShare: null, error: 'Loses money even with zero failures' };
  }
  const denominator = price - C - S + F;
  if (denominator <= 0) {
    return { breakEvenShare: null, error: 'Invalid cost structure' };
  }
  return { breakEvenShare: numerator / denominator, error: null };
}

export function calculateWaterfallPer100(
  price: number,
  C: number,
  S: number,
  rtoShare: number,
  returnShare: number,
  costPerRto: number,
  costPerReturn: number,
  ads: number
) {
  const f = rtoShare + returnShare;
  const kept = 100 * (1 - f);
  const revenue = kept * price;
  const productCost = kept * C;
  const shippingCost = kept * S;
  const rtoCost = 100 * rtoShare * costPerRto;
  const returnCost = 100 * returnShare * costPerReturn;
  const adsCost = 100 * ads;
  const totalCost = productCost + shippingCost + rtoCost + returnCost + adsCost;
  const profit = revenue - totalCost;

  return {
    kept,
    revenue,
    productCost,
    shippingCost,
    rtoCost,
    returnCost,
    adsCost,
    totalCost,
    profit,
  };
}

// 6.4 Quartiles & Market Band Analysis
export function calculateQuartiles(listings: number[]): {
  min: number;
  q1: number;
  median: number;
  q3: number;
  max: number;
} {
  if (listings.length === 0) {
    return { min: 0, q1: 0, median: 0, q3: 0, max: 0 };
  }
  const sorted = [...listings].sort((a, b) => a - b);
  const N = sorted.length;

  const getQuartile = (q: number) => {
    const pos = (N - 1) * q;
    const base = Math.floor(pos);
    const rest = pos - base;
    if (sorted[base + 1] !== undefined) {
      return sorted[base] + rest * (sorted[base + 1] - sorted[base]);
    }
    return sorted[base];
  };

  return {
    min: sorted[0],
    q1: getQuartile(0.25),
    median: getQuartile(0.5),
    q3: getQuartile(0.75),
    max: sorted[N - 1],
  };
}

export function calculateCheaperThanShare(price: number, listings: number[]): number {
  if (listings.length === 0) return 0;
  const higherCount = listings.filter((p) => p > price).length;
  return higherCount / listings.length;
}

export function determinePriceZone(
  price: number,
  floor: number,
  median: number,
  q3: number
): 'Loss' | 'Win' | 'Profit' | 'Above' {
  if (price < floor) return 'Loss';
  if (price <= median) return 'Win';
  if (price <= q3) return 'Profit';
  return 'Above';
}

export function evaluateFloorPosition(floor: number, q1: number, q3: number): string {
  if (floor > q3) {
    return 'Above band: pull a lever or do not list';
  }
  if (floor < q1) {
    return 'Below band: launch low-to-mid, step up later';
  }
  return 'Inside band: price at floor+';
}

// 6.5 Suggested Price
export function calculateSuggestedPrice(
  floor: number,
  q3: number,
  eps: number
): { suggested: number | null; reason: string; pStar: number } {
  if (eps <= 1) {
    return { suggested: floor, reason: 'Low elasticity fallback', pStar: floor };
  }
  const pStar = (eps / (eps - 1)) * floor;
  if (floor > q3) {
    return { suggested: null, reason: 'No viable price in the band', pStar };
  }
  const suggested = Math.min(Math.max(pStar, floor), q3);
  return {
    suggested,
    reason: `Optimal markup based on category elasticity (ε=${eps}), capped at market Q3`,
    pStar,
  };
}

// 6.6 Strategy Picker
export function recommendStrategy(
  floor: number,
  q1: number,
  median: number,
  q3: number,
  rating: number,
  ratingsCount: number,
  isDifferentiated: boolean = false
): { strategy: string; recommendedPrice: number; why: string } {
  if (floor > q3) {
    return {
      strategy: 'Bundle / fix levers',
      recommendedPrice: floor,
      why: 'Floor price exceeds upper market band (Q3). Pull levers or differentiate.',
    };
  }
  if (ratingsCount < 20) {
    return {
      strategy: 'Penetration',
      recommendedPrice: Math.max(floor, q1),
      why: 'New listing with under 20 reviews. Price at Q1 to build initial volume.',
    };
  }
  if (rating >= 4.2 && isDifferentiated) {
    return {
      strategy: 'Premium',
      recommendedPrice: Math.max(floor, q3),
      why: 'High rating and unique positioning allow premium pricing at Q3.',
    };
  }
  return {
    strategy: 'Competitive',
    recommendedPrice: Math.max(floor, median),
    why: 'Established listing. Price competitively at market median.',
  };
}

// 6.8 First Price & Blending
export function blendPriorAndOwnData(
  priorReturnShare: number,
  ownReturnShare: number,
  priorRtoShare: number,
  ownRtoShare: number,
  n: number,
  k: number = 30
): { blendedReturnShare: number; blendedRtoShare: number; weightOwn: number } {
  const weightOwn = n / (n + k);
  const blendedReturnShare = (k * priorReturnShare + n * ownReturnShare) / (k + n);
  const blendedRtoShare = (k * priorRtoShare + n * ownRtoShare) / (k + n);
  return { blendedReturnShare, blendedRtoShare, weightOwn };
}

// 6.9 SKU Verdict
export function evaluateSKUVerdict(
  price: number,
  floor: number,
  _q1: number,
  q3: number
): { verdict: 'DROP' | 'FIX' | 'KEEP_RAISE' | 'KEEP_OK'; label: string; chipColor: string } {
  if (floor > 1.1 * q3) {
    return { verdict: 'DROP', label: 'DROP / rethink SKU', chipColor: 'bg-red-100 text-red-800 border-red-200' };
  }
  if (floor > q3) {
    return { verdict: 'FIX', label: 'FIX: pull a lever', chipColor: 'bg-amber-100 text-amber-800 border-amber-200' };
  }
  if (price < floor) {
    return { verdict: 'KEEP_RAISE', label: 'KEEP: raise price to floor+', chipColor: 'bg-red-100 text-red-800 border-red-200' };
  }
  return { verdict: 'KEEP_OK', label: 'KEEP: priced OK', chipColor: 'bg-green-100 text-green-800 border-green-200' };
}

// 6.11 Poisson CDF
export function poissonCDF(k: number, lambda: number): number {
  let sum = 0;
  let term = Math.exp(-lambda); // for i = 0
  sum += term;

  for (let i = 1; i <= k; i++) {
    term = (term * lambda) / i;
    sum += term;
  }
  return sum;
}

// Weight Alert Check for Listing Health Guard
export function checkWeightGuard(
  declaredKg: number,
  actualKg: number,
  typicalWeightKg: [number, number]
): { isError: boolean; message: string | null } {
  const isOutsideTypical = declaredKg < typicalWeightKg[0] || declaredKg > typicalWeightKg[1];
  const is3xActual = declaredKg > 3 * actualKg;

  if (isOutsideTypical || is3xActual) {
    return {
      isError: true,
      message: `This weight puts you in the 5–10 kg slab. Typical for this product: ${typicalWeightKg[0]}–${typicalWeightKg[1]} kg. Please check.`,
    };
  }
  return { isError: false, message: null };
}

// 6.10 Lifecycle Simulation Helper
export interface SimulationWeekResult {
  week: number;
  views: number;
  conversion: number;
  priceWithout: number;
  priceWith: number;
  floorWithout: number;
  floorWith: number;
  demandWithout: number;
  demandWith: number;
  ordersWithout: number;
  ordersWith: number;
  profitWithout: number;
  profitWith: number;
  cumProfitWithout: number;
  cumProfitWith: number;
  stockWithoutLeft: number;
  stockWithLeft: number;
  triggerFired?: { type: 'T1' | 'T2' | 'T3'; title: string; desc: string };
}

export function runLifecycleSimulation(
  sku: SKU,
  rateCard: RateCard = rateCardConfig as RateCard
) {
  const totalWeeks = 26;
  const initialStock = 250;
  const marketPrice = 299;
  const epsSim = 3.0;
  const q1 = 289;
  const q3 = 319;

  let stockWithout = initialStock;
  let stockWith = initialStock;

  let cumProfitWithout = 0;
  let cumProfitWith = 0;

  let cumViewsWithout = 0;
  let cumViewsWith = 0;
  let cumOrdersWithout = 0;
  let cumOrdersWith = 0;

  let t1Fired = false;
  let t2Fired = false;
  let t3Fired = false;

  const weekResults: SimulationWeekResult[] = [];

  let lastInSeasonPriceWith = 319;

  for (let w = 1; w <= totalWeeks; w++) {
    const views = w <= 20 ? 1000 : 300;

    // Shipping cost changes at week 10 (Trigger 2: +10 pre-GST)
    const baseShipping = 65;
    const shippingPreGst = w >= 10 ? baseShipping + 10 : baseShipping;
    const S = calculateShippingAndFees(shippingPreGst, 0, rateCard.gst);

    // --- WITHOUT SAHI DAAM ---
    const convWithout = 0.01;
    const rtoWithout = 0.15;
    const retWithout = 0.15;
    const fWithout = rtoWithout + retWithout;
    const failCostWithout = calculateFailureCost(
      rtoWithout,
      retWithout,
      sku.costPerRto,
      rateCard.reverseFee,
      rateCard.fwdLostOnReturn,
      S
    );
    const C = sku.purchaseCost + sku.packingCost + sku.labourCost;
    const floorWithout = calculateFloorPrice(C, S, fWithout, failCostWithout.F, sku.adsPerDispatched);
    const priceWithout = 299;

    const demandWithout = views * convWithout * Math.pow(priceWithout / marketPrice, -epsSim);
    const maxOrdersWithout = stockWithout / (1 - fWithout);
    const ordersWithout = Math.min(demandWithout, maxOrdersWithout);
    const deliveredWithout = ordersWithout * (1 - fWithout);
    stockWithout -= deliveredWithout;
    const profitWithout = ordersWithout * (1 - fWithout) * (priceWithout - floorWithout);
    cumProfitWithout += profitWithout;

    cumViewsWithout += views;
    cumOrdersWithout += ordersWithout;

    // --- WITH SAHI DAAM ---
    // Conversion: 1% until week 2, then 2% (photos fixed after T1)
    const convWith = w <= 2 ? 0.01 : 0.02;
    // Return share: 15% until week 3, then 10% (size chart fixed)
    const retWith = w <= 3 ? 0.15 : 0.10;
    const rtoWith = 0.15;
    const fWith = rtoWith + retWith;
    const failCostWith = calculateFailureCost(
      rtoWith,
      retWith,
      sku.costPerRto,
      rateCard.reverseFee,
      rateCard.fwdLostOnReturn,
      S
    );
    const floorWith = calculateFloorPrice(C, S, fWith, failCostWith.F, sku.adsPerDispatched);
    const clearanceFloor = calculateClearanceFloor(S, fWith, failCostWith.F, sku.adsPerDispatched, 0);

    let priceWith: number;
    if (w <= 20) {
      const targetBase = Math.max(floorWith, q1) + 1;
      const roundedUp = Math.ceil(targetBase / 10) * 10 - 1;
      priceWith = Math.min(Math.max(roundedUp, floorWith), Math.max(q3, floorWith));
      lastInSeasonPriceWith = priceWith;
    } else {
      // Clearance markdown ladder after week 20
      const discount = 0.10 * (w - 20);
      const markDownPrice = lastInSeasonPriceWith * (1 - discount);
      priceWith = Math.max(clearanceFloor, markDownPrice);
    }

    const demandWith = views * convWith * Math.pow(priceWith / marketPrice, -epsSim);
    const maxOrdersWith = stockWith > 0 ? stockWith / (1 - fWith) : 0;
    const ordersWith = Math.min(demandWith, maxOrdersWith);
    const deliveredWith = ordersWith * (1 - fWith);
    stockWith = Math.max(0, stockWith - deliveredWith);
    const profitWith = ordersWith * (1 - fWith) * (priceWith - floorWith);
    cumProfitWith += profitWith;

    cumViewsWith += views;
    cumOrdersWith += ordersWith;

    let triggerFired: { type: 'T1' | 'T2' | 'T3'; title: string; desc: string } | undefined;

    if (!t1Fired && cumViewsWith >= 1000 && cumOrdersWith <= Math.floor((cumViewsWith * 0.02) / 2)) {
      t1Fired = true;
      triggerFired = {
        type: 'T1',
        title: 'T1: Listing Conversion Alert',
        desc: 'Views are good but orders are low. Fix photos and check visibility first.',
      };
    } else if (w === 10 && !t2Fired) {
      t2Fired = true;
      triggerFired = {
        type: 'T2',
        title: 'T2: Logistics Cost Change',
        desc: `Shipping went up ₹10. Your new floor is ₹${floorWith.toFixed(2)}. Your price (₹${priceWith.toFixed(2)}) is still above it.`,
      };
    } else if (w === 21 && stockWith > 0 && !t3Fired) {
      t3Fired = true;
      triggerFired = {
        type: 'T3',
        title: 'T3: End of Season Clearance',
        desc: `Markdown ladder activated to clear remaining stock before next season. Floor protection at clearance floor ₹${clearanceFloor.toFixed(2)}.`,
      };
    }

    weekResults.push({
      week: w,
      views,
      conversion: convWith,
      priceWithout,
      priceWith,
      floorWithout,
      floorWith,
      demandWithout,
      demandWith,
      ordersWithout,
      ordersWith,
      profitWithout,
      profitWith,
      cumProfitWithout,
      cumProfitWith,
      stockWithoutLeft: stockWithout,
      stockWithLeft: stockWith,
      triggerFired,
    });
  }

  // Deduct unsold stock at end of season (C - salvage)
  const unsoldWithout = Math.max(0, stockWithout);
  const unsoldWith = Math.max(0, stockWith);
  const C_total = sku.purchaseCost + sku.packingCost + sku.labourCost;
  const netSeasonProfitWithout = cumProfitWithout - unsoldWithout * C_total;
  const netSeasonProfitWith = cumProfitWith - unsoldWith * C_total;

  return {
    weekResults,
    netSeasonProfitWithout,
    netSeasonProfitWith,
    unsoldWithout,
    unsoldWith,
  };
}
