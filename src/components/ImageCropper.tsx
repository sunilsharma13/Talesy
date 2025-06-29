// components/ImageCropper.tsx
"use client";

import React, { useState, useRef, useCallback } from 'react';
import ReactCrop, { type Crop, centerCrop, makeAspectCrop, type PixelCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { toast } from 'react-hot-toast';

interface ImageCropperProps {
  onCroppedImage: (croppedFile: File, dataUrl: string) => void; // <-- This line is correct!
  imageUrl: string;
  onCancel: () => void;
  aspectRatio?: number | null;
  cropShape?: 'rect' | 'round';
  theme?: 'light' | 'dark' | 'sepia';
}

function centerAspectCrop(
  mediaWidth: number,
  mediaHeight: number,
  aspect: number,
) {
  return centerCrop(
    makeAspectCrop(
      {
        unit: '%',
        width: 90,
      },
      aspect,
      mediaWidth,
      mediaHeight,
    ),
    mediaWidth,
    mediaHeight,
  );
}

export default function ImageCropper({
  imageUrl,
  onCroppedImage, // FIXED: Changed from onCropComplete to onCroppedImage here
  onCancel,
  aspectRatio,
  cropShape = 'rect',
  theme = 'dark'
}: ImageCropperProps) {
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [isLoading, setIsLoading] = useState(false);

  const actualReactCropAspect = aspectRatio === null ? undefined : aspectRatio;

  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    if (actualReactCropAspect) {
      setCrop(centerAspectCrop(width, height, actualReactCropAspect));
    } else {
      setCrop(centerCrop(
        { unit: '%', width: 50, height: 50 },
        width,
        height
      ));
    }
  }, [actualReactCropAspect]);

  const handleCropImage = async () => {
    if (!completedCrop || !imgRef.current) {
      toast.error("Please create a crop selection first");
      return;
    }

    setIsLoading(true);

    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        throw new Error('No 2d context');
      }

      const scaleX = imgRef.current.naturalWidth / imgRef.current.width;
      const scaleY = imgRef.current.naturalHeight / imgRef.current.height;

      canvas.width = completedCrop.width;
      canvas.height = completedCrop.height;

      // Apply round crop if specified
      if (cropShape === 'round') {
        ctx.beginPath();
        ctx.arc(canvas.width / 2, canvas.height / 2, Math.min(canvas.width, canvas.height) / 2, 0, Math.PI * 2, false);
        ctx.closePath();
        ctx.clip();
      }

      ctx.drawImage(
        imgRef.current,
        completedCrop.x * scaleX,
        completedCrop.y * scaleY,
        completedCrop.width * scaleX,
        completedCrop.height * scaleY,
        0,
        0,
        completedCrop.width,
        completedCrop.height
      );

      // Get both Blob and Data URL
      const blob: Blob = await new Promise((resolve, reject) => {
        canvas.toBlob(
          (b) => {
            if (!b) {
              reject(new Error('Canvas is empty'));
              return;
            }
            resolve(b);
          },
          'image/jpeg',
          0.95
        );
      });

      const dataUrl = canvas.toDataURL('image/jpeg', 0.95);

      // Create a File object from the Blob
      const croppedFile = new File([blob], 'cropped-image.jpeg', { type: 'image/jpeg' });

      // FIXED: Pass both the File object and the Data URL
      onCroppedImage(croppedFile, dataUrl);
      toast.success('Image cropped!', { id: 'cropping' });

    } catch (error) {
      console.error('Error cropping image:', error);
      toast.error('Failed to crop image. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Theme-based styling for the modal and buttons
  const modalBg = theme === 'dark' ? 'bg-gray-800' : theme === 'sepia' ? 'bg-amber-100' : 'bg-white';
  const textColor = theme === 'dark' ? 'text-white' : theme === 'sepia' ? 'text-amber-900' : 'text-gray-900';
  const subTextColor = theme === 'dark' ? 'text-gray-300' : theme === 'sepia' ? 'text-amber-700' : 'text-gray-600';
  const contentBg = theme === 'dark' ? 'bg-gray-900' : theme === 'sepia' ? 'bg-amber-50' : 'bg-gray-100';

  const btnCancelBg = theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : theme === 'sepia' ? 'bg-amber-300 hover:bg-amber-400 text-amber-900' : 'bg-gray-200 hover:bg-gray-300 text-gray-800';
  const btnPrimaryBg = theme === 'dark' ? 'bg-indigo-600 hover:bg-indigo-700' : theme === 'sepia' ? 'bg-amber-600 hover:bg-amber-700 text-white' : 'bg-blue-600 hover:bg-blue-700';

  return (
    <div className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4">
      {/* Main modal container - added flex-col, h-full, and max-h for proper layout */}
      <div className={`${modalBg} rounded-xl p-6 max-w-4xl w-full shadow-2xl flex flex-col h-full md:max-h-[90vh]`}>
        <h3 className={`text-xl font-bold mb-4 ${textColor}`}>Crop Image</h3>
        <p className={`text-sm mb-4 ${subTextColor}`}>
          Adjust the crop area to fit your needs. {aspectRatio ? `Using aspect ratio: ${actualReactCropAspect?.toFixed(2) || 'auto'}.` : 'Allowing free-form crop.'}
        </p>

        {/* Content area that will scroll if needed - added flex-grow and overflow-auto */}
        <div className={`mb-6 p-2 rounded-lg ${contentBg} flex-grow overflow-auto`}>
          <ReactCrop
            crop={crop}
            onChange={(c) => setCrop(c)}
            onComplete={(c) => setCompletedCrop(c)}
            aspect={actualReactCropAspect}
            minWidth={100}
            className="react-crop-container"
          >
            <img
              ref={imgRef}
              src={imageUrl}
              alt="Crop preview"
              onLoad={onImageLoad}
              // Adjusted max-height to account for header/footer in the modal
              className="max-h-[calc(80vh-150px)] w-full object-contain mx-auto"
            />
          </ReactCrop>
        </div>

        {/* Buttons - added mt-4 for spacing from the content above */}
        <div className="flex justify-end gap-3 mt-4">
          <button
            onClick={onCancel}
            className={`px-4 py-2 rounded-lg transition-colors ${btnCancelBg}`}
          >
            Cancel
          </button>
          <button
            onClick={handleCropImage}
            disabled={!completedCrop || isLoading}
            className={`px-4 py-2 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 ${btnPrimaryBg}`}
          >
            {isLoading ? (
              <>
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </>
            ) : (
              'Apply Crop'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}