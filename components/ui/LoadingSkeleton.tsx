'use client';

interface LoadingSkeletonProps {
  type?: 'card' | 'text' | 'circle' | 'button';
  count?: number;
  className?: string;
}

export function LoadingSkeleton({ 
  type = 'card', 
  count = 1,
  className = '' 
}: LoadingSkeletonProps) {
  const skeletons = Array.from({ length: count }, (_, i) => i);

  const renderSkeleton = () => {
    switch (type) {
      case 'card':
        return (
          <div className={`card animate-pulse ${className}`}>
            <div className="bg-gray-300 h-48 w-full" />
            <div className="p-4 space-y-3">
              <div className="h-4 bg-gray-300 rounded w-3/4" />
              <div className="h-3 bg-gray-300 rounded w-full" />
              <div className="h-3 bg-gray-300 rounded w-5/6" />
              <div className="flex justify-between items-center mt-4">
                <div className="h-6 bg-gray-300 rounded w-20" />
                <div className="h-10 bg-gray-300 rounded w-24" />
              </div>
            </div>
          </div>
        );

      case 'text':
        return (
          <div className={`animate-pulse ${className}`}>
            <div className="h-4 bg-gray-300 rounded w-full" />
          </div>
        );

      case 'circle':
        return (
          <div className={`animate-pulse ${className}`}>
            <div className="rounded-full bg-gray-300 w-12 h-12" />
          </div>
        );

      case 'button':
        return (
          <div className={`animate-pulse ${className}`}>
            <div className="h-12 bg-gray-300 rounded-lg w-full" />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <>
      {skeletons.map((i) => (
        <div key={i}>{renderSkeleton()}</div>
      ))}
    </>
  );
}

// Specific skeleton components for common use cases
export function MenuItemSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      <LoadingSkeleton type="card" count={count} />
    </div>
  );
}

export function CartItemSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex gap-4 p-4 bg-gray-50 rounded-lg animate-pulse">
          <div className="w-20 h-20 bg-gray-300 rounded-lg flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-300 rounded w-3/4" />
            <div className="h-3 bg-gray-300 rounded w-1/2" />
            <div className="h-4 bg-gray-300 rounded w-1/4" />
          </div>
        </div>
      ))}
    </div>
  );
}