import React, { createContext, useContext, useState, type ReactNode } from 'react';
import en from '../i18n/en.json';
import hi from '../i18n/hi.json';
import skusData from '../config/skus.json';
import type { SKU } from '../engine/pricing';

export type Language = 'en' | 'hi';

export interface LeversState {
  defectiveOnly: boolean;
  sizeChart: boolean;
  prepaid: boolean;
  smallerBox: boolean;
  cheaperSourcing: boolean;
}

interface AppContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (path: string, params?: Record<string, string | number>) => string;
  skus: SKU[];
  activeSKU: SKU;
  setActiveSKU: (sku: SKU) => void;
  updateActiveSKU: (updated: Partial<SKU>) => void;
  levers: LeversState;
  toggleLever: (key: keyof LeversState) => void;
  isWeightDemoActive: boolean;
  toggleWeightDemo: () => void;
  resetDemo: () => void;
  guidedDemoStep: number | null;
  setGuidedDemoStep: (step: number | null) => void;
  startGuidedDemo: () => void;
  nextGuidedDemoStep: () => void;
  prevGuidedDemoStep: () => void;
  closeGuidedDemo: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const dictionaries = { en, hi };

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [lang, setLang] = useState<Language>('en');
  const [skus, setSkus] = useState<SKU[]>(skusData as SKU[]);
  const [activeSKU, setActiveSKUState] = useState<SKU>((skusData as SKU[])[0]);
  const [isWeightDemoActive, setIsWeightDemoActive] = useState<boolean>(false);
  const [guidedDemoStep, setGuidedDemoStep] = useState<number | null>(null);

  const initialLevers: LeversState = {
    defectiveOnly: false,
    sizeChart: false,
    prepaid: false,
    smallerBox: false,
    cheaperSourcing: false,
  };
  const [levers, setLevers] = useState<LeversState>(initialLevers);

  const t = (path: string, params?: Record<string, string | number>): string => {
    const keys = path.split('.');
    let current: any = dictionaries[lang];
    for (const key of keys) {
      if (current && current[key] !== undefined) {
        current = current[key];
      } else {
        let fallback: any = dictionaries.en;
        for (const fk of keys) {
          if (fallback && fallback[fk] !== undefined) fallback = fallback[fk];
          else return path;
        }
        current = fallback;
        break;
      }
    }
    if (typeof current === 'string') {
      let str = current;
      if (params) {
        Object.entries(params).forEach(([k, v]) => {
          str = str.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
        });
      }
      return str;
    }
    return path;
  };

  const setActiveSKU = (sku: SKU) => {
    setActiveSKUState(sku);
  };

  const updateActiveSKU = (updated: Partial<SKU>) => {
    setActiveSKUState((prev) => {
      const next = { ...prev, ...updated };
      setSkus((all) => all.map((s) => (s.id === next.id ? next : s)));
      return next;
    });
  };

  const toggleLever = (key: keyof LeversState) => {
    setLevers((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleWeightDemo = () => {
    const nextState = !isWeightDemoActive;
    setIsWeightDemoActive(nextState);
    setSkus((prev) =>
      prev.map((sku) => {
        if (sku.id === 'sku-5') {
          return {
            ...sku,
            declaredWeightKg: nextState ? 7.5 : 0.75,
          };
        }
        return sku;
      })
    );
  };

  const resetDemo = () => {
    const defaultSkus = skusData as SKU[];
    setSkus(defaultSkus);
    setActiveSKUState(defaultSkus[0]);
    setLevers(initialLevers);
    setIsWeightDemoActive(false);
    setGuidedDemoStep(null);
  };

  const startGuidedDemo = () => setGuidedDemoStep(1);
  const nextGuidedDemoStep = () => {
    setGuidedDemoStep((prev) => (prev === null ? 1 : prev < 5 ? prev + 1 : null));
  };
  const prevGuidedDemoStep = () => {
    setGuidedDemoStep((prev) => (prev !== null && prev > 1 ? prev - 1 : prev));
  };
  const closeGuidedDemo = () => setGuidedDemoStep(null);

  return (
    <AppContext.Provider
      value={{
        lang,
        setLang,
        t,
        skus,
        activeSKU,
        setActiveSKU,
        updateActiveSKU,
        levers,
        toggleLever,
        isWeightDemoActive,
        toggleWeightDemo,
        resetDemo,
        guidedDemoStep,
        setGuidedDemoStep,
        startGuidedDemo,
        nextGuidedDemoStep,
        prevGuidedDemoStep,
        closeGuidedDemo,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
