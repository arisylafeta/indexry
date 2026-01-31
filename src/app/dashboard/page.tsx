export default function Dashboard() {
  return (
    <main className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Indexry Dashboard</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-600 mb-2">Total Portfolio Value</h2>
            <p className="text-3xl font-bold">$0.00</p>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-600 mb-2">Active Indices</h2>
            <p className="text-3xl font-bold">0</p>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-600 mb-2">IBKR Status</h2>
            <p className="text-3xl font-bold text-yellow-500">Disconnected</p>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Your Indices</h2>
            <a
              href="/indices/new"
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Create New Index
            </a>
          </div>
          
          <p className="text-gray-500">No indices yet. Create your first custom index to get started.</p>
        </div>
      </div>
    </main>
  );
}
