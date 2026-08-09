"use client";
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

const CurrencyContext = createContext<any>({});
export const useCurrency = () => useContext(CurrencyContext);

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrency] = useState<string>('INR'); // Default to INR
  const [rates, setRates] = useState<any>({ INR: 83.2, USD: 1, EUR: 0.92, GBP: 0.79 });

  // Fetch live exchange rates on app load
  useEffect(() => {
    fetch('https://open.er-api.com/v6/latest/USD')
      .then(res => res.json())
      .then(data => { if (data.rates) setRates(data.rates); })
      .catch(() => console.log('Using fallback currency rates'));
  }, []);

  const symbols: any = { INR: '₹', USD: '$', EUR: '€', GBP: '£' };

  // Function to convert and format any amount
  const formatCurrency = (amount: number | string | undefined | null) => {
    const num = Number(amount) || 0;
    const converted = (num * (rates[currency] || 1)).toFixed(0);
    const formattedNum = Number(converted).toLocaleString('en-IN');
    return `${symbols[currency] || ''}${formattedNum}`;
  };

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, formatCurrency, symbol: symbols[currency] || "$" }}>
      {children}
    </CurrencyContext.Provider>
  );
}
