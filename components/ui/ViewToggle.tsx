'use client';

import { useKiosk } from '@/context/KioskContext';
import { useTranslation } from '@/hooks/useTranslation';
import { LayoutGrid, List } from 'lucide-react';
import { clsx } from 'clsx';

export function ViewToggle() {
  const { viewMode, toggleViewMode } = useKiosk();
  const { t } = useTranslation();

  return (
    <div className="flex items-center gap-2 bg-white dark:bg-gray-800 rounded-xl p-1.5 shadow-sm">
      <button
        onClick={viewMode === 'list' ? toggleViewMode : undefined}
        className={clsx(
          'min-w-[44px] min-h-[44px] w-11 h-11 rounded-lg flex items-center justify-center transition-all',
          viewMode === 'grid'
            ? 'bg-primary-500 text-white shadow-md'
            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
        )}
        aria-label={t('grid_view')}
        title={t('grid_view')}
      >
        <LayoutGrid className="w-5 h-5 stroke-[2.5]" />
      </button>
      <button
        onClick={viewMode === 'grid' ? toggleViewMode : undefined}
        className={clsx(
          'min-w-[44px] min-h-[44px] w-11 h-11 rounded-lg flex items-center justify-center transition-all',
          viewMode === 'list'
            ? 'bg-primary-500 text-white shadow-md'
            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
        )}
        aria-label={t('list_view')}
        title={t('list_view')}
      >
        <List className="w-5 h-5 stroke-[2.5]" />
      </button>
    </div>
  );
}