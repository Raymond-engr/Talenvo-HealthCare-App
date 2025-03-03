"use client"

import { useState, useEffect } from 'react';
import Image, { ImageProps } from 'next/image';

interface ImageWithFallbackProps extends Omit<ImageProps, 'onError'> {
  fallbackSrc: string;
}

export function ImageWithFallback({
  src,
  fallbackSrc,
  alt,
  ...props
}: ImageWithFallbackProps) {
  const [imgSrc, setImgSrc] = useState<string>(src as string);
  const [isBase64, setIsBase64] = useState<boolean>(false);

  useEffect(() => {
    // Check if the source is a base64 string
    if (typeof src === 'string' && src.startsWith('data:image')) {
      setIsBase64(true);
    } else {
      setIsBase64(false);
      setImgSrc(src as string);
    }
  }, [src]);

  // Convert base64 to blob URL if needed
  useEffect(() => {
    if (isBase64 && typeof src === 'string') {
      try {
        // Convert base64 to blob
        const fetchData = async () => {
          const response = await fetch(src);
          const blob = await response.blob();
          const url = URL.createObjectURL(blob);
          setImgSrc(url);
          
          // Clean up object URL when component unmounts
          return () => URL.revokeObjectURL(url);
        };
        
        fetchData();
      } catch (error) {
        console.error('Error converting base64 to blob:', error);
        setImgSrc(fallbackSrc);
      }
    }
  }, [isBase64, src, fallbackSrc]);

  return (
    <Image
      {...props}
      src={imgSrc}
      alt={alt}
      onError={() => {
        setImgSrc(fallbackSrc);
      }}
    />
  );
}