# Sahi Daam (सही दाम) – Desktop Web App

> **Supplier Hub Co-Pilot for New-to-Online Sellers**  
> Developed for Meesho DICE Challenge S3 (Pricing Case) by Team NoName, IIT (ISM) Dhanbad.

---

## 🌟 Overview

**Sahi Daam** ("the right price") is a pricing co-pilot integrated into a seller-facing supplier portal. It empowers new online sellers to discover their true floor price, position competitive listings in market bands, and manage price adjustments dynamically across the product lifecycle.

### Key Features
1. **Offline Price Check Entry Point:** Instantly alerts sellers copying market prices (e.g. ₹299) about hidden loss risks before listing.
2. **Munafa Meter (True Floor Price):** Standardized floor price formula incorporating landed cost $C$, 3PL shipping + 18% GST ($S$), RTO risks, customer return costs ($F$), and marketing spend. Includes live "What-if" profit levers and a Listing Health Guard for declared weight errors.
3. **Smart Band (Market Positioning):** Recharts distribution visualization across comparable market listings ($Q1, \text{Median}, Q3$). Features automated strategy recommendation, confidence score blending ($k=30$), and a 2D profit heatmap ($Price \times Return\%$).
4. **Lifecycle Autopilot:** Interactive 26-week simulation tracking 3 key triggers:
   - **T1:** Conversion drops alert (Week 1)
   - **T2:** Logistics fee hikes (Week 10)
   - **T3:** Clearance markdown ladder down to clearance floor (Week 21)
5. **SKU Health Dashboard:** Catalogue-wide floor coverage & risk verdicts (`KEEP`, `FIX`, `DROP`). Includes a "Weight error demo" toggle on the Fertiliser SKU.
6. **Settlement Explainer:** Step-by-step breakdown of listed price to bank payout, explaining TCS (0.5%) and TDS (0.1%) tax credits.
7. **Guided Demo Overlay & i18n:** Interactive 5-step guided overlay and instant English / Hindi toggle.

---

## 🚀 Quick Start

### 1. Installation
Ensure Node.js (v18+) is installed. Clone the repository and install dependencies:
```bash
npm install
```

### 2. Running Locally
Start the Vite development server:
```bash
npm run dev
```
Open `http://localhost:5173/` (or `http://localhost:5174/`) in your desktop browser (1440 × 900 or 1280 px recommended).

### 3. Running Unit Tests
Run the Vitest acceptance test suite (20/20 pure engine acceptance tests):
```bash
npx vitest run
```

### 4. Production Build
Compile TypeScript and generate the production bundle:
```bash
npm run build
```

---

## 📐 Mathematical Formulas

All calculations in Sahi Daam are derived from the standardized engine in `src/engine/pricing.ts`:

1. **Shipping & Logistics Fee ($S$):**
   $$S = (\text{ShippingRate} + \text{PlatformFee}) \times (1 + \text{GST})$$

2. **Failure Cost ($F$):**
   $$\text{CostPerReturn} = \text{ReverseFee} + (\text{fwdLostOnReturn} \times S)$$
   $$f = \text{rtoShare} + \text{returnShare}$$
   $$F = \frac{\text{rtoShare} \times \text{costPerRto} + \text{returnShare} \times \text{costPerReturn}}{f}$$

3. **True Floor Price ($\text{Floor}$):**
   $$\text{Floor} = C + S + \frac{f \cdot F + \text{Ads}}{1 - f}$$

4. **Profit per Dispatched Order:**
   $$\text{Profit} = (1 - f) \cdot (\text{Price} - \text{Floor})$$

5. **Clearance Floor:**
   $$\text{ClearanceFloor} = S + \frac{f \cdot F + \text{Ads}}{1 - f} + \text{Salvage}$$

---

## 📁 JSON Configuration

All data live in static config files in `src/config/` for easy updates:
- `rateCard.json`: GST (18%), 3PL weight slab rates, reverse fees (₹153), TCS/TDS.
- `categoryPriors.json`: Category priors for Fashion, Home & Kitchen, Jewellery, Home & Garden.
- `skus.json`: Demo product presets.
- `sampleListings.json`: 25 market listing prices for sample Kurti ($Q1=289, \text{Median}=299, Q3=319$).
- `simulation.json`: 26-week lifecycle simulation parameters.

---

## 🌐 Deploying to Vercel or Netlify

### Vercel
```bash
npx vercel
```
Or connect the repository on Vercel Dashboard with framework preset **Vite**.

### Netlify
```bash
npx netlify-cli deploy --build
```
Build command: `npm run build` | Publish directory: `dist`.

---

## 🛡 Brand Safety & Compliance

- **No copyrighted logos or artwork:** Uses text logo **"Sahi Daam"** and custom vector SVG graphics.
- **Sample Tags:** All unconfirmed or sample data are explicitly tagged with `"Sample data"` or `"Fee to be confirmed"`.
