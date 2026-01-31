'use client';

import { useEffect, useRef } from 'react';

interface TradingViewChartProps {
  symbol?: string;
  height?: number;
  theme?: 'light' | 'dark';
}

export default function TradingViewChart({
  symbol = 'AAPL',
  height = 500,
  theme = 'light'
}: TradingViewChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/tv.js';
    script.async = true;
    script.onload = () => {
      if (typeof window !== 'undefined' && (window as unknown as { TradingView: unknown }).TradingView) {
        new (window as unknown as { TradingView: new (config: Record<string, unknown>) => unknown }).TradingView({
          autosize: true,
          symbol: symbol,
          interval: 'D',
          timezone: 'Etc/UTC',
          theme: theme,
          style: '1',
          locale: 'en',
          toolbar_bg: '#f1f3f6',
          enable_publishing: false,
          allow_symbol_change: true,
          container_id: 'tradingview-chart',
          hide_top_toolbar: false,
          hide_legend: false,
          save_image: false,
          calendar: false,
          hide_volume: false,
          support_host: 'https://www.tradingview.com'
        });
      }
    };

    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
    };
  }, [symbol, theme]);

  return (
    <div
      ref={containerRef}
      id="tradingview-chart"
      style={{ height: `${height}px` }}
      className="w-full rounded-lg overflow-hidden border border-gray-200"
    />
  );
}
