'use client';

import { Copy, Download, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';

interface OrderDataDisplayProps {
  orderData: any;
  onClose?: () => void;
}

export function OrderDataDisplay({ orderData, onClose }: OrderDataDisplayProps) {
  const [isCopied, setIsCopied] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(orderData, null, 2));
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleDownload = () => {
    const element = document.createElement('a');
    const file = new Blob([JSON.stringify(orderData, null, 2)], { type: 'application/json' });
    element.href = URL.createObjectURL(file);
    element.download = `order-${orderData.id}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(element);
    element.click();
    if (element.parentNode) {
      element.parentNode.removeChild(element);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-blue-200 dark:border-blue-700 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 p-4 border-b border-blue-200 dark:border-blue-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
              {'{'}
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Order Data JSON</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Order ID: {orderData.id}</p>
            </div>
          </div>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 hover:bg-blue-200 dark:hover:bg-blue-700/50 rounded-lg transition-colors"
            title={isExpanded ? 'Collapse' : 'Expand'}
          >
            {isExpanded ? (
              <ChevronUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            )}
          </button>
        </div>
      </div>

      {/* Content */}
      {isExpanded && (
        <div className="p-4 space-y-4">
          {/* Controls */}
          <div className="flex gap-2">
            <button
              onClick={handleCopy}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                isCopied
                  ? 'bg-green-500 text-white'
                  : 'bg-blue-500 hover:bg-blue-600 text-white'
              }`}
            >
              <Copy className="w-4 h-4" />
              {isCopied ? 'Copied!' : 'Copy JSON'}
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm bg-indigo-500 hover:bg-indigo-600 text-white transition-all"
            >
              <Download className="w-4 h-4" />
              Download JSON
            </button>
          </div>

          {/* JSON Display */}
          <div className="bg-gray-900 dark:bg-gray-950 rounded-lg p-4 overflow-x-auto">
            <pre className="text-xs sm:text-sm text-gray-100 font-mono whitespace-pre-wrap break-words">
              {JSON.stringify(orderData, null, 2)}
            </pre>
          </div>

          {/* Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div>
              <p className="text-xs text-gray-600 dark:text-gray-400 uppercase font-semibold">Items</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">
                {orderData.cart?.items?.length || 0}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-600 dark:text-gray-400 uppercase font-semibold">Total</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">
                {orderData.payment?.charges?.total?.formatted_amount || 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-600 dark:text-gray-400 uppercase font-semibold">Method</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white capitalize">
                {orderData.payment?.payment_type || 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-600 dark:text-gray-400 uppercase font-semibold">Status</p>
              <p className="text-lg font-bold text-green-600 dark:text-green-400">
                {orderData.current_state || 'CREATED'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
