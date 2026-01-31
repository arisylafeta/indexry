'use client';

import { useEffect, useState } from 'react';
import TradingViewChart from '@/components/TradingViewChart';
import { Index, Holding } from '@/types';

export default function IndexDetail({ indexId }: { indexId: string }) {
  const [index, setIndex] = useState<Index | null>(null);
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchIndex();
    fetchHoldings();
  }, [indexId]);

  const fetchIndex = async () => {
    try {
      const response = await fetch(`/api/indices/${indexId}`);
      if (!response.ok) throw new Error('Failed to fetch index');
      const data = await response.json();
      setIndex(data.index);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const fetchHoldings = async () => {
    try {
      const response = await fetch(`/api/indices/${indexId}/holdings`);
      if (!response.ok) throw new Error('Failed to fetch holdings');
      const data = await response.json();
      setHoldings(data.holdings);
    } catch (err) {
      console.error('Error fetching holdings:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen p-8">
        <div className="max-w-6xl mx-auto">
          <p>Loading...</p>
        </div>
      </main>
    );
  }

  if (error || !index) {
    return (
      <main className="min-h-screen p-8">
        <div className="max-w-6xl mx-auto">
          <p className="text-red-600">{error || 'Index not found'}</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-3xl font-bold">{index.name}</h1>
            <p className="text-gray-600 mt-1">{index.description}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Total Value</p>
            <p className="text-2xl font-bold">${index.totalValue.toFixed(2)}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <TradingViewChart symbol={holdings[0]?.symbol || 'AAPL'} height={400} />
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Holdings</h2>
            {holdings.length === 0 ? (
              <p className="text-gray-500">No holdings yet. Rebalance to add positions.</p>
            ) : (
              <div className="space-y-3">
                {holdings.map((holding) => (
                  <div key={holding.id} className="flex justify-between items-center py-2 border-b border-gray-100">
                    <div>
                      <p className="font-medium">{holding.symbol}</p>
                      <p className="text-sm text-gray-500">{holding.quantity} shares</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">${holding.marketValue.toFixed(2)}</p>
                      <p className="text-sm text-gray-500">{holding.currentWeight.toFixed(1)}%</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}