'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

export default function TestImages() {
  const [images, setImages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchImages = async () => {
      try {
        const response = await fetch('/api/menu/full/');
        const data = await response.json();
        
        // Extract all images from choices
        const allImages: any[] = [];
        data.items?.forEach((item: any) => {
          item.options?.forEach((option: any) => {
            option.choices?.forEach((choice: any) => {
              if (choice.image) {
                allImages.push({
                  name: choice.name,
                  url: choice.image,
                  price: choice.price
                });
              }
            });
          });
        });
        
        console.log('Found images:', allImages);
        setImages(allImages);
      } catch (error) {
        console.error('Error fetching images:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchImages();
  }, []);

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-8">Image Loading Test</h1>
      <div className="grid grid-cols-3 gap-4">
        {images.map((img, idx) => (
          <div key={idx} className="border rounded-lg p-4 bg-white">
            <h3 className="font-bold mb-2">{img.name}</h3>
            <p className="text-sm text-gray-600 mb-2">Price: +${img.price}</p>
            <div className="relative w-full h-32 bg-gray-200 rounded overflow-hidden mb-2">
              <Image
                src={img.url}
                alt={img.name}
                fill
                className="object-cover"
                onLoad={() => console.log('✅ Loaded:', img.url)}
                onError={() => console.error('❌ Failed:', img.url)}
              />
            </div>
            <p className="text-xs text-gray-500 break-all">{img.url}</p>
          </div>
        ))}
      </div>
    </div>
  );
}