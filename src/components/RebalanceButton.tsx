'use client';

import { useState } from 'react';
import { Order } from '@/types';

interface RebalanceButtonProps {
  indexId: string;
  onRebalanceComplete?: () => void;
}

export default function RebalanceButton({ indexId, onRebalanceComplete }: RebalanceButtonProps) {
  const [loading, setLoading] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [rebalanceId, setRebalanceId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const calculateRebalancing = async () => {
    setCalculating(true);
    setError('');
    
    try {
      const response = await fetch(`/api/indices/${indexId}/rebalance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'calculate' })
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to calculate rebalancing');
      }
      
      const data = await response.json();
      setOrders(data.orders);
      setRebalanceId(data.rebalanceId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setCalculating(false);
    }
  };

  const executeRebalancing = async () => {
    if (!rebalanceId) return;
    
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch(`/api/indices/${indexId}/rebalance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'execute', rebalanceId })
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to execute rebalancing');
      }
      
      // Clear orders after successful execution
      setOrders(null);
      setRebalanceId(null);
      onRebalanceComplete?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const cancelRebalancing = () => {
    setOrders(null);
    setRebalanceId(null);
    setError('');
  };

  if (orders && orders.length > 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6 mt-4">
        <h3 className="text-lg font-semibold mb-4">Rebalancing Orders</h3>
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
        <div className="space-y-2 mb-4">
          {orders.map((order, index) => (
            <div 
              key={index}
              className={`flex justify-between items-center p-3 rounded ${
                order.side === 'buy' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
              }`}
            >
              <div>
                <span className="font-medium">{order.symbol}</span>
                <span className={`ml-2 px-2 py-1 text-xs rounded ${
                  order.side === 'buy' ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'
                }`}>
                  {order.side.toUpperCase()}
                </span>
              </div>
              <span className="font-medium">{order.quantity} shares</span>
            </div>
          ))}
        </div>
        
        <div className="flex space-x-3">
          <button
            onClick={executeRebalancing}
            disabled={loading}
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:bg-gray-400"
          >
            {loading ? 'Executing...' : 'Execute Orders'}
          </button>
          <button
            onClick={cancelRebalancing}
            disabled={loading}
            className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded hover:bg-gray-300 disabled:bg-gray-100"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      <button
        onClick={calculateRebalancing}
        disabled={calculating}
        className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:bg-gray-400"
      >
        {calculating ? 'Calculating...' : 'Rebalance Portfolio'}
      </button>
    </div>
  );
}
