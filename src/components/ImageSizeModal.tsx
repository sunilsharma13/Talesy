"use client";

import React from "react";

type ImageSizeModalProps = {
  theme: "light" | "dark" | "sepia";
  inlineImageUrl: string;
  inlineImageWidth: string;
  setInlineImageWidth: (width: string) => void;
  onClose: () => void;
  onInsert: () => void;
};

export default function ImageSizeModal({
  theme,
  inlineImageUrl,
  inlineImageWidth,
  setInlineImageWidth,
  onClose,
  onInsert,
}: ImageSizeModalProps) {
  const bgColor =
    theme === "dark" ? "bg-gray-800 text-white" :
    theme === "sepia" ? "bg-[#f4ecd8] text-[#5b4636]" :
    "bg-white text-black";

  return (
    <div className={`fixed inset-0 flex items-center justify-center z-50 ${bgColor} bg-opacity-90`}>
      <div className="bg-white dark:bg-gray-900 p-6 rounded shadow-lg max-w-md w-full">
        <h2 className="text-xl font-bold mb-4">Set Image Size</h2>
        <img src={inlineImageUrl} alt="Preview" className="mb-4 max-w-full" />
        <input
          type="text"
          placeholder="e.g. 100%, 200px"
          value={inlineImageWidth}
          onChange={(e) => setInlineImageWidth(e.target.value)}
          className="w-full p-2 border rounded mb-4"
        />
        <div className="flex justify-end space-x-3">
          <button onClick={onClose} className="px-4 py-2 rounded border">
            Cancel
          </button>
          <button
            onClick={onInsert}
            disabled={!inlineImageWidth.trim()}
            className="px-4 py-2 rounded bg-blue-600 text-white disabled:opacity-50"
          >
            Insert
          </button>
        </div>
      </div>
    </div>
  );
}
