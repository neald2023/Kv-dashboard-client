import React from "react";

function App() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 text-gray-800">
      <h1 className="text-3xl font-bold mb-4">🚀 KV Dashboard</h1>
      <p className="mb-6">Your team dashboard is running successfully.</p>
      <button
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
        onClick={() => alert("Feature coming soon!")}
      >
        Test Button
      </button>
    </div>
  );
}

export default App;
