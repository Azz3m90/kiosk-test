'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useKiosk } from '@/context/KioskContext';

export default function DebugLogoPage() {
  const { restaurantName, restaurantRef, restaurantLogo } = useKiosk();
  const [apiResponse, setApiResponse] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!restaurantName) return;

    const fetchConfig = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(
          `/api/config?restaurant=${encodeURIComponent(restaurantName)}`
        );
        const data = await response.json();
        setApiResponse(data);
        console.log('🔍 DEBUG - API Response:', data);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        setError(errorMsg);
        console.error('🔍 DEBUG - API Error:', errorMsg);
      } finally {
        setLoading(false);
      }
    };

    fetchConfig();
  }, [restaurantName]);

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-gray-900">🔍 Logo Debug Page</h1>

        {/* Context State */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">Context State</h2>
          <div className="space-y-3">
            <div className="border-l-4 border-blue-500 pl-4 py-2">
              <span className="font-mono text-sm bg-gray-100 p-2 rounded inline-block w-full">
                restaurantName: <strong>{restaurantName || 'NOT SET'}</strong>
              </span>
            </div>
            <div className="border-l-4 border-blue-500 pl-4 py-2">
              <span className="font-mono text-sm bg-gray-100 p-2 rounded inline-block w-full">
                restaurantRef: <strong>{restaurantRef || 'NOT SET'}</strong>
              </span>
            </div>
            <div className="border-l-4 border-green-500 pl-4 py-2">
              <span className="font-mono text-sm bg-gray-100 p-2 rounded inline-block w-full">
                restaurantLogo.header: <strong>{restaurantLogo?.header || 'NOT SET'}</strong>
              </span>
            </div>
            <div className="border-l-4 border-green-500 pl-4 py-2">
              <span className="font-mono text-sm bg-gray-100 p-2 rounded inline-block w-full">
                restaurantLogo.footer: <strong>{restaurantLogo?.footer || 'NOT SET'}</strong>
              </span>
            </div>
          </div>
        </div>

        {/* API Response */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">API Response</h2>
          {loading && <p className="text-yellow-600">Loading...</p>}
          {error && <p className="text-red-600">Error: {error}</p>}
          {apiResponse && (
            <pre className="bg-gray-900 text-green-400 p-4 rounded overflow-auto text-xs">
              {JSON.stringify(apiResponse, null, 2)}
            </pre>
          )}
        </div>

        {/* Logo Preview */}
        {restaurantLogo?.header && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">Logo Preview</h2>
            <div className="relative w-40 h-32">
              <Image
                src={restaurantLogo.header}
                alt="Restaurant Logo"
                fill
                className="object-contain"
                onError={() => {
                  console.error('🔍 Image failed to load:', restaurantLogo.header);
                }}
                onLoad={() => console.log('✅ Logo loaded successfully')}
              />
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-300 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">Instructions:</h3>
          <ul className="text-sm text-blue-800 list-disc list-inside space-y-1">
            <li>Check the browser console (F12) for debug logs</li>
            <li>Verify restaurantName is set</li>
            <li>Check if API Response shows logo URLs</li>
            <li>Verify the logo URL is accessible</li>
            <li>If logo fails to load, the URL might be incorrect or inaccessible</li>
          </ul>
        </div>
      </div>
    </div>
  );
}