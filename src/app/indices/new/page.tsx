'use client';

import IndexBuilder from '@/components/IndexBuilder';
import { useRouter } from 'next/navigation';

export default function NewIndexPage() {
  const router = useRouter();

  const handleSubmit = async (data: {
    name: string;
    description: string;
    rules: Array<{ type: string; config: Record<string, unknown> }>;
  }) => {
    const response = await fetch('/api/indices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Failed to create index');
    }

    const result = await response.json();
    router.push(`/indices/${result.index.id}`);
  };

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Create New Index</h1>
        <p className="text-gray-600 mb-8">
          Define your custom index strategy and rules
        </p>

        <div className="bg-white rounded-lg shadow p-6">
          <IndexBuilder onSubmit={handleSubmit} />
        </div>
      </div>
    </main>
  );
}
