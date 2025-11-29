'use client';

import Image from 'next/image';
import { ImgHTMLAttributes, useState, useEffect, useCallback } from 'react';
import { Loader } from 'lucide-react';

interface OptimizedImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'onProgress'> {
  src: string;
  alt: string;
  fill?: boolean;
  sizes?: string;
  className?: string;
  onProgress?: (progress: number) => void;
}

export function OptimizedImage({
  src,
  alt,
  fill,
  sizes,
  className,
  onProgress,
  ...props
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const trackImageProgress = async () => {
      try {
        const response = await fetch(src);
        const reader = response.body?.getReader();
        
        if (!reader) {
          setProgress(100);
          return;
        }

        const contentLength = parseInt(response.headers.get('content-length') || '0', 10);
        let receivedLength = 0;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          receivedLength += value.length;
          const newProgress = contentLength ? Math.min((receivedLength / contentLength) * 100, 99) : 90;
          setProgress(newProgress);
          onProgress?.(newProgress);
        }

        setProgress(100);
        onProgress?.(100);
      } catch (error) {
        setProgress(100);
        onProgress?.(100);
      }
    };

    trackImageProgress();

    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, [src, onProgress]);

  const loaderSpinner = (
    <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-700 z-10">
      <Loader className="w-8 h-8 text-gray-400 dark:text-gray-500 animate-spin" />
    </div>
  );

  if (fill) {
    return (
      <div className="relative w-full h-full">
        {isLoading && loaderSpinner}
        <Image
          src={src}
          alt={alt}
          fill
          unoptimized
          className={`${className || ''} ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
          onLoad={() => setIsLoading(false)}
          onError={() => setIsLoading(false)}
          {...(props as any)}
        />
      </div>
    );
  }

  const { width, height, ...restProps } = props;
  return (
    <div className="relative w-fit h-fit">
      {isLoading && loaderSpinner}
      <Image
        src={src}
        alt={alt}
        width={width ? parseInt(width as string) : 500}
        height={height ? parseInt(height as string) : 500}
        unoptimized
        className={`${className || ''} ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
        onLoad={() => setIsLoading(false)}
        onError={() => setIsLoading(false)}
        {...(restProps as any)}
      />
    </div>
  );
}
