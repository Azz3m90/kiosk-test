'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useKiosk } from '@/context/KioskContext';

interface PaymentMethodInfo {
  key: string;
  title: string;
  enabled: boolean;
  icon?: string;
  content?: string;
  bgColor?: string;
}

export default function DebugPaymentMethodsPage() {
  const { availablePaymentMethods } = useKiosk();
  const [isLoading, setIsLoading] = useState(true);
  const [extractedMethods, setExtractedMethods] = useState<PaymentMethodInfo[]>([]);

  useEffect(() => {
    if (availablePaymentMethods) {
      const methods = Object.entries(availablePaymentMethods)
        .map(([key, method]) => ({
          key,
          title: method.title || 'Unknown',
          enabled: method.enabled,
          icon: method.icon,
          content: method.content,
          bgColor: method.bgColor,
        }))
        .sort((a, b) => {
          if (a.enabled === b.enabled) {
            return a.title.localeCompare(b.title);
          }
          return b.enabled ? 1 : -1;
        });

      setExtractedMethods(methods);
      setIsLoading(false);
    }
  }, [availablePaymentMethods]);

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            💳 Payment Methods Debug
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            View all payment methods extracted from restaurant settings
          </p>
        </div>

        {isLoading ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 text-center">
            <div className="inline-block">
              <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin"></div>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mt-4">Loading payment methods...</p>
          </div>
        ) : extractedMethods.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 border-2 border-red-200 dark:border-red-700">
            <p className="text-red-600 dark:text-red-400 font-semibold">No payment methods found</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-6 border border-green-200 dark:border-green-800">
                <p className="text-green-700 dark:text-green-300 text-sm font-semibold uppercase tracking-wide">Enabled Methods</p>
                <p className="text-4xl font-bold text-green-600 dark:text-green-400 mt-2">
                  {extractedMethods.filter(m => m.enabled).length}
                </p>
              </div>
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
                <p className="text-blue-700 dark:text-blue-300 text-sm font-semibold uppercase tracking-wide">Total Methods</p>
                <p className="text-4xl font-bold text-blue-600 dark:text-blue-400 mt-2">
                  {extractedMethods.length}
                </p>
              </div>
            </div>

            {/* Enabled Methods */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden">
              <div className="bg-green-50 dark:bg-green-900/20 border-b border-green-200 dark:border-green-800 px-6 py-4">
                <h2 className="text-lg sm:text-xl font-bold text-green-900 dark:text-green-100">✅ Enabled Payment Methods</h2>
              </div>
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {extractedMethods
                  .filter(m => m.enabled)
                  .map((method) => (
                    <div key={method.key} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div>
                          <div className="flex items-start gap-3">
                            <div className="flex-shrink-0">
                              <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-green-100 dark:bg-green-900/30">
                                <span className="text-sm font-bold text-green-600 dark:text-green-400">✓</span>
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 break-words">
                                {method.title}
                              </h3>
                              <p className="text-xs text-gray-500 dark:text-gray-500 font-mono mt-1 break-all">
                                Key: <span className="text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">{method.key}</span>
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-3">
                          {method.icon && (
                            <div>
                              <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Icon Type</p>
                              <p className="text-sm text-gray-900 dark:text-gray-100 mt-1 bg-gray-100 dark:bg-gray-700 px-3 py-2 rounded">
                                {method.icon}
                              </p>
                            </div>
                          )}
                          {method.bgColor && (
                            <div>
                              <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Background Color</p>
                              <div className="flex items-center gap-2 mt-1">
                                <div
                                  className="w-8 h-8 rounded border border-gray-300 dark:border-gray-600"
                                  style={{ backgroundColor: method.bgColor }}
                                  title={method.bgColor}
                                />
                                <p className="text-sm font-mono text-gray-900 dark:text-gray-100">{method.bgColor}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {method.content && (
                        <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                          <p className="text-xs font-semibold text-blue-700 dark:text-blue-300 uppercase mb-1">Description</p>
                          <p className="text-sm text-blue-900 dark:text-blue-100">{method.content}</p>
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            </div>

            {/* Disabled Methods */}
            {extractedMethods.filter(m => !m.enabled).length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden">
                <div className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600 px-6 py-4">
                  <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100">⭕ Disabled Payment Methods</h2>
                </div>
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {extractedMethods
                    .filter(m => !m.enabled)
                    .map((method) => (
                      <div key={method.key} className="p-6 opacity-60">
                        <div className="flex items-center gap-3">
                          <span className="text-gray-400 dark:text-gray-600">✗</span>
                          <div>
                            <h3 className="text-lg font-bold text-gray-700 dark:text-gray-300">
                              {method.title}
                            </h3>
                            <p className="text-xs text-gray-500 dark:text-gray-500 font-mono mt-1">
                              Key: {method.key}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* JSON Raw Data */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden">
              <div className="bg-purple-50 dark:bg-purple-900/20 border-b border-purple-200 dark:border-purple-800 px-6 py-4">
                <h2 className="text-lg sm:text-xl font-bold text-purple-900 dark:text-purple-100">📋 Raw Data (JSON)</h2>
              </div>
              <div className="p-6">
                <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded-lg overflow-x-auto text-xs text-gray-800 dark:text-gray-200 font-mono">
                  {JSON.stringify(extractedMethods, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="mt-8 fixed bottom-4 left-4">
        <Link
          href="/"
          className="flex items-center gap-2 px-6 py-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 font-bold rounded-xl transition-all hover:scale-105 active:scale-95"
        >
          ← Back to Home
        </Link>
      </div>
    </main>
  );
}
