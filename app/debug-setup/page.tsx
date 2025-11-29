'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function DebugSetupPage() {
  const [restaurantName, setRestaurantName] = useState('Test-FastCaisse');
  const [apiResponse, setApiResponse] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const testFrontendAPI = async () => {
    setIsLoading(true);
    setError('');
    setApiResponse('');

    try {
      console.log('🧪 Testing frontend API...');
      const url = `/api/languages?restaurant=${encodeURIComponent(restaurantName)}`;
      console.log('📡 URL:', url);

      const response = await fetch(url);
      const data = await response.json();

      console.log('✅ Frontend API Response:', data);
      setApiResponse(JSON.stringify(data, null, 2));

      if (!response.ok) {
        setError(`HTTP ${response.status}: ${data.error}`);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      console.error('❌ Frontend API Error:', errorMsg);
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const testBackendAPI = async () => {
    setIsLoading(true);
    setError('');
    setApiResponse('');

    try {
      console.log('🧪 Testing backend API directly...');
      const url = `https://fastcaisse.be/food3/public/api/restaurants/${encodeURIComponent(restaurantName)}/languages`;
      console.log('📡 URL:', url);

      const response = await fetch(url);
      const data = await response.json();

      console.log('✅ Backend API Response:', data);
      setApiResponse(JSON.stringify(data, null, 2));

      if (!response.ok) {
        setError(`HTTP ${response.status}: ${data.error || 'Unknown error'}`);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      console.error('❌ Backend API Error:', errorMsg);
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const clearSetup = () => {
    localStorage.removeItem('kiosk_restaurant_name');
    localStorage.removeItem('available_languages');
    localStorage.removeItem('default_language');
    console.log('🧹 Cleared localStorage');
    alert('Setup cleared. Refresh the page to start over.');
  };

  const checkSetup = () => {
    const restaurantStored = localStorage.getItem('kiosk_restaurant_name');
    const languagesStored = localStorage.getItem('available_languages');
    const defaultLangStored = localStorage.getItem('default_language');

    const info = {
      restaurant_name: restaurantStored,
      available_languages: languagesStored,
      default_language: defaultLangStored,
    };

    console.log('📋 Current Setup State:', info);
    setApiResponse(JSON.stringify(info, null, 2));
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">🔧 Setup Flow Debugger</h1>

        {/* Input Section */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">1️⃣ Configure Restaurant Name</h2>
          <div className="flex gap-2">
            <input
              type="text"
              value={restaurantName}
              onChange={(e) => setRestaurantName(e.target.value)}
              placeholder="Enter restaurant name"
              className="flex-1 bg-gray-700 text-white px-4 py-2 rounded border border-gray-600 focus:border-blue-500 outline-none"
            />
          </div>
          <p className="text-sm text-gray-400 mt-2">
            Current: <code className="bg-gray-700 px-2 py-1 rounded">{restaurantName}</code>
          </p>
        </div>

        {/* Test Buttons */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">2️⃣ Test API Calls</h2>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <button
              onClick={testFrontendAPI}
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 px-4 py-2 rounded font-semibold transition"
            >
              {isLoading ? '⏳ Testing...' : '🌐 Test Frontend API'}
            </button>
            <button
              onClick={testBackendAPI}
              disabled={isLoading}
              className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 px-4 py-2 rounded font-semibold transition"
            >
              {isLoading ? '⏳ Testing...' : '🔗 Test Backend API'}
            </button>
            <button
              onClick={checkSetup}
              disabled={isLoading}
              className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 px-4 py-2 rounded font-semibold transition"
            >
              📋 Check Stored Setup
            </button>
            <button
              onClick={clearSetup}
              disabled={isLoading}
              className="bg-red-600 hover:bg-red-700 disabled:bg-gray-600 px-4 py-2 rounded font-semibold transition"
            >
              🧹 Clear Setup
            </button>
          </div>

          {/* Status */}
          {error && (
            <div className="bg-red-900/30 border border-red-500 text-red-200 px-4 py-3 rounded mb-4">
              <p className="font-semibold">❌ Error:</p>
              <p className="text-sm mt-1">{error}</p>
            </div>
          )}
        </div>

        {/* Response Section */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">3️⃣ API Response</h2>
          {apiResponse ? (
            <pre className="bg-gray-900 p-4 rounded overflow-auto max-h-96 text-sm text-green-400 border border-gray-700">
              {apiResponse}
            </pre>
          ) : (
            <p className="text-gray-400">Click a test button to see the response here...</p>
          )}
        </div>

        {/* Help Section */}
        <div className="bg-blue-900/30 border border-blue-500 text-blue-100 rounded-lg p-6 mt-8">
          <h3 className="font-semibold mb-2">💡 How to Use:</h3>
          <ol className="space-y-2 text-sm list-decimal list-inside">
            <li>Enter a restaurant name (e.g., "Test-FastCaisse")</li>
            <li>Click "Test Frontend API" - tests the Next.js API route</li>
            <li>Click "Test Backend API" - tests the Laravel backend directly</li>
            <li>Check the response for errors or missing data</li>
            <li>Check browser Console (F12) for detailed logs</li>
            <li>Use "Check Stored Setup" to see what's saved locally</li>
          </ol>
        </div>

        {/* Quick Links */}
        <div className="mt-8 flex gap-4">
          <Link
            href="/"
            className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded font-semibold transition"
          >
            ← Back to Kiosk
          </Link>
          <Link
            href="/debug-setup"
            className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded font-semibold transition"
          >
            🔄 Refresh
          </Link>
        </div>
      </div>
    </div>
  );
}