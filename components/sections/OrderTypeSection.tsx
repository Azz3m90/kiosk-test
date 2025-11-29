'use client';

import { useKiosk } from '@/context/KioskContext';
import { useTranslation } from '@/hooks/useTranslation';
import { ShoppingBag, UtensilsCrossed, ChevronLeft } from 'lucide-react';
import type { OrderType } from '@/types';

export function OrderTypeSection() {
  const { setOrderType, navigateToStep, currentLanguage } = useKiosk();
  const { t } = useTranslation();

  const handleOrderTypeSelect = (type: OrderType) => {
    setOrderType(type);
    navigateToStep('menu');
  };

  const handleBack = () => {
    navigateToStep('welcome');
  };

  const orderTypes = [
    {
      type: 'eatin' as OrderType,
      icon: UtensilsCrossed,
      title: t('eat_in'),
      subtitle: t('eat_in_description'),
      gradient: 'from-green-500 to-emerald-600',
      hoverGradient: 'group-hover:from-green-500/10 group-hover:to-emerald-600/10',
      borderColor: 'hover:border-green-500 dark:hover:border-emerald-500',
      textColor: 'group-hover:text-green-600 dark:group-hover:text-emerald-400',
    },
    {
      type: 'takeaway' as OrderType,
      icon: ShoppingBag,
      title: t('pickup'),
      subtitle: t('pickup_description'),
      gradient: 'from-orange-500 to-red-600',
      hoverGradient: 'group-hover:from-orange-500/10 group-hover:to-red-600/10',
      borderColor: 'hover:border-orange-500 dark:hover:border-red-500',
      textColor: 'group-hover:text-orange-600 dark:group-hover:text-red-400',
    },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-8">
      <div className="max-w-5xl w-full">
        {/* Back Button */}
        <button
          onClick={handleBack}
          className="mb-8 flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors duration-200"
        >
          <ChevronLeft className="w-6 h-6" />
          <span className="text-lg font-medium">{t('back')}</span>
        </button>

        {/* Title */}
        <div className="text-center mb-12 animate-fade-in">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            {t('how_would_you_like_order')}
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            {t('choose_dining_preference')}
          </p>
        </div>

        {/* Order Type Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {orderTypes.map((orderType, index) => {
            const Icon = orderType.icon;
            return (
              <button
                key={orderType.type}
                onClick={() => handleOrderTypeSelect(orderType.type)}
                className={`group relative overflow-hidden bg-white dark:bg-gray-800 rounded-3xl p-10 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 border-3 border-transparent ${orderType.borderColor}`}
                style={{
                  animation: `slideUp 0.6s ease-out ${index * 0.15}s both`,
                }}
              >
                {/* Background Gradient Overlay */}
                <div className={`absolute inset-0 bg-gradient-to-br ${orderType.hoverGradient} transition-all duration-300`} />
                
                {/* Content */}
                <div className="relative z-10 flex flex-col items-center text-center">
                  {/* Icon with Gradient Background */}
                  <div className={`w-28 h-28 mb-6 bg-gradient-to-br ${orderType.gradient} rounded-full flex items-center justify-center shadow-lg transform group-hover:scale-110 group-hover:rotate-6 transition-all duration-300`}>
                    <Icon className="w-14 h-14 text-white" strokeWidth={2} />
                  </div>
                  
                  {/* Title */}
                  <h2 className={`text-3xl font-bold text-gray-900 dark:text-white mb-3 ${orderType.textColor} transition-colors duration-300`}>
                    {orderType.title}
                  </h2>
                  
                  {/* Subtitle */}
                  <p className="text-lg text-gray-600 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors duration-300">
                    {orderType.subtitle}
                  </p>

                  {/* Call to Action */}
                  <div className="mt-6 px-6 py-3 bg-gray-100 dark:bg-gray-700 rounded-full text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:bg-gray-200 dark:group-hover:bg-gray-600 transition-colors duration-300">
                    {t('tap_to_select')}
                  </div>
                </div>

                {/* Hover Ring Effect */}
                <div className="absolute inset-0 rounded-3xl ring-2 ring-offset-2 ring-transparent group-hover:ring-offset-0 transition-all duration-300" />
              </button>
            );
          })}
        </div>

        {/* Additional Info */}
        <div className="text-center mt-12 animate-fade-in-delay">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t('dining_preference_note')}
          </p>
        </div>
      </div>

      <style jsx>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes fade-in-delay {
          0%, 50% {
            opacity: 0;
          }
          100% {
            opacity: 1;
          }
        }

        .animate-fade-in {
          animation: fade-in 0.8s ease-out;
        }

        .animate-fade-in-delay {
          animation: fade-in-delay 1.5s ease-out;
        }
      `}</style>
    </div>
  );
}