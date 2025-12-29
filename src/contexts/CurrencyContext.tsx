import React, { createContext, useContext, useState, ReactNode } from 'react';

type Currency = 'USD' | 'PEN' | 'MXN' | 'EUR';

interface CurrencyContextType {
  currency: Currency;
  setCurrency: (currency: Currency) => void;
  currencySymbol: string;
  currencyOptions: Currency[];
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

const currencySymbols: Record<Currency, string> = {
  USD: '$',
  PEN: 'S/',
  MXN: '$',
  EUR: '€',
};

// Ordered list of currencies
const currencyOptions: Currency[] = ['USD', 'PEN', 'MXN', 'EUR'];

export const CurrencyProvider = ({ children }: { children: ReactNode }) => {
  const [currency, setCurrencyState] = useState<Currency>(() => {
    const saved = localStorage.getItem('currency');
    return (saved as Currency) || 'USD';
  });

  const setCurrency = (newCurrency: Currency) => {
    setCurrencyState(newCurrency);
    localStorage.setItem('currency', newCurrency);
  };

  const currencySymbol = currencySymbols[currency];

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, currencySymbol, currencyOptions }}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within CurrencyProvider');
  }
  return context;
};
