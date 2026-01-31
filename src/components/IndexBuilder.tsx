'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

// Context for index builder state
interface IndexBuilderContextValue {
  name: string;
  setName: (name: string) => void;
  description: string;
  setDescription: (desc: string) => void;
  ruleType: 'top_n' | 'market_cap' | 'momentum' | 'manual';
  setRuleType: (type: 'top_n' | 'market_cap' | 'momentum' | 'manual') => void;
  symbols: string;
  setSymbols: (symbols: string) => void;
  loading: boolean;
  setLoading: (loading: boolean) => void;
  error: string;
  setError: (error: string) => void;
}

const IndexBuilderContext = createContext<IndexBuilderContextValue | null>(null);

function useIndexBuilder() {
  const context = useContext(IndexBuilderContext);
  if (!context) {
    throw new Error('useIndexBuilder must be used within IndexBuilderProvider');
  }
  return context;
}

// Provider component
interface IndexBuilderProviderProps {
  children: ReactNode;
}

function IndexBuilderProvider({ children }: IndexBuilderProviderProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [ruleType, setRuleType] = useState<'top_n' | 'market_cap' | 'momentum' | 'manual'>('manual');
  const [symbols, setSymbols] = useState('AAPL, MSFT, GOOGL');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  return (
    <IndexBuilderContext.Provider
      value={{
        name, setName,
        description, setDescription,
        ruleType, setRuleType,
        symbols, setSymbols,
        loading, setLoading,
        error, setError
      }}
    >
      {children}
    </IndexBuilderContext.Provider>
  );
}

// Form field components
function NameField() {
  const { name, setName } = useIndexBuilder();
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Index Name
      </label>
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        placeholder="e.g., Tech Giants Index"
        required
      />
    </div>
  );
}

function DescriptionField() {
  const { description, setDescription } = useIndexBuilder();
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Description
      </label>
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        rows={3}
        placeholder="Describe your index strategy..."
      />
    </div>
  );
}

function RuleTypeSelector() {
  const { ruleType, setRuleType } = useIndexBuilder();
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Construction Method
      </label>
      <select
        value={ruleType}
        onChange={(e) => setRuleType(e.target.value as typeof ruleType)}
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="manual">Manual Selection</option>
        <option value="top_n">Top N by Market Cap</option>
        <option value="momentum">Momentum Based</option>
      </select>
    </div>
  );
}

function SymbolsField() {
  const { symbols, setSymbols, ruleType } = useIndexBuilder();
  
  if (ruleType !== 'manual') return null;
  
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Symbols (comma-separated)
      </label>
      <textarea
        value={symbols}
        onChange={(e) => setSymbols(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        rows={3}
        placeholder="AAPL, MSFT, GOOGL, AMZN"
      />
      <p className="text-sm text-gray-500 mt-1">
        Enter stock symbols separated by commas
      </p>
    </div>
  );
}

function ErrorDisplay() {
  const { error } = useIndexBuilder();
  if (!error) return null;
  
  return (
    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
      {error}
    </div>
  );
}

function SubmitButton({ onSubmit }: { onSubmit: () => Promise<void> }) {
  const { loading, name } = useIndexBuilder();
  
  return (
    <button
      type="submit"
      disabled={loading || !name}
      className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
    >
      {loading ? 'Creating...' : 'Create Index'}
    </button>
  );
}

// Main form component
interface IndexBuilderFormProps {
  onSubmit: (data: {
    name: string;
    description: string;
    rules: Array<{ type: string; config: Record<string, unknown> }>;
  }) => Promise<void>;
}

function IndexBuilderForm({ onSubmit }: IndexBuilderFormProps) {
  const { name, description, ruleType, symbols, setLoading, setError } = useIndexBuilder();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const rules: Array<{ type: string; config: Record<string, unknown> }> = [];
    
    if (ruleType === 'manual') {
      const symbolList = symbols.split(',').map(s => s.trim().toUpperCase()).filter(Boolean);
      rules.push({
        type: 'manual',
        config: { symbols: symbolList }
      });
    } else {
      rules.push({
        type: ruleType,
        config: { count: 10 }
      });
    }

    try {
      await onSubmit({ name, description, rules });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <ErrorDisplay />
      <NameField />
      <DescriptionField />
      <RuleTypeSelector />
      <SymbolsField />
      <SubmitButton onSubmit={() => {}} />
    </form>
  );
}

// Export compound component
export const IndexBuilder = {
  Provider: IndexBuilderProvider,
  Form: IndexBuilderForm,
};

// Default export for backward compatibility
export default function IndexBuilderWrapper({ onSubmit }: IndexBuilderFormProps) {
  return (
    <IndexBuilderProvider>
      <IndexBuilderForm onSubmit={onSubmit} />
    </IndexBuilderProvider>
  );
}
