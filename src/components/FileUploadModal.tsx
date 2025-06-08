"use client";

import React from "react";
import FileUpload from "./FileUpload";

type FileUploadModalProps = {
  theme: "light" | "dark" | "sepia";
  onClose: () => void;
  onUpload: (url: string) => void;
};

export default function FileUploadModal({ theme, onClose, onUpload }: FileUploadModalProps) {
  const bgColor =
    theme === "dark" ? "bg-gray-800 text-white" :
    theme === "sepia" ? "bg-[#f4ecd8] text-[#5b4636]" :
    "bg-white text-black";

  return (
    <div className={`fixed inset-0 flex items-center justify-center z-50 ${bgColor} bg-opacity-90`}>
      <div className="bg-white dark:bg-gray-900 p-6 rounded shadow-lg max-w-md w-full">
        <h2 className="text-xl font-bold mb-4">Upload File</h2>
        <FileUpload onImageUpload={onUpload} />
        <div className="flex justify-end mt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded border hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
