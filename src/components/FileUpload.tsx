"use client";

import React, { useState } from "react";

type FileUploadProps = {
  onImageUpload: (url: string) => void;
};

export default function FileUpload({ onImageUpload }: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setError(null);
    setProgress(10);

    const file = files[0];
    
    // Validate file size and type
    if (file.size > 5 * 1024 * 1024) {
      setError("File too large (max 5MB)");
      setUploading(false);
      return;
    }
    
    if (!file.type.startsWith('image/')) {
      setError("Please upload an image file");
      setUploading(false);
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      setProgress(30);
      
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      setProgress(70);

      if (!res.ok) {
        const errorData = await res.text();
        throw new Error(errorData || "Upload failed");
      }

      setProgress(90);
      const data = await res.json();
      
      if (data.url) {
        onImageUpload(data.url);
        setProgress(100);
      } else {
        throw new Error("No URL returned from server");
      }
    } catch (err: any) {
      setError(err.message || "Upload failed");
      console.error("Upload error:", err);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="mb-4">
      <label className="block text-sm mb-2 text-gray-300">Upload Image</label>
      <input
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        disabled={uploading}
        className="block w-full text-gray-300 file:mr-4 file:py-2 file:px-4 
        file:rounded-full file:border-0 file:bg-indigo-600 file:text-white 
        hover:file:bg-indigo-700 cursor-pointer"
      />
      
      {uploading && (
        <div className="mt-2">
          <div className="bg-gray-200 rounded-full h-2.5 mt-1.5 overflow-hidden">
            <div 
              className="bg-indigo-600 h-2.5 rounded-full transition-all duration-300" 
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <p className="text-sm text-gray-400 mt-1">Uploading: {progress}%</p>
        </div>
      )}
      
      {error && (
        <p className="text-red-500 mt-2 text-sm">{error}</p>
      )}
    </div>
  );
}