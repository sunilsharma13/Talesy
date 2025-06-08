"use client";
import React from "react";
import FileUpload from "@/components/FileUpload";

interface Props {
  title: string;
  content: string;
  imageUrl: string;
  status: "draft" | "published";
  saving: boolean;
  setTitle: (val: string) => void;
  setContent: (val: string) => void;
  setImageUrl: (val: string) => void;
  setStatus: (val: "draft" | "published") => void;
  saveContent: () => void;
}

export default function TitleAndContentForm({
  title,
  content,
  imageUrl,
  status,
  saving,
  setTitle,
  setContent,
  setImageUrl,
  setStatus,
  saveContent,
}: Props) {
  return (
    <>
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full text-2xl font-bold mb-2 border border-gray-600 bg-transparent text-white p-2 placeholder-gray-400"
        placeholder="Title"
      />
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="w-full h-64 border border-gray-600 bg-transparent text-white p-2 placeholder-gray-400"
        placeholder="Start writing..."
      />
      <FileUpload onImageUpload={setImageUrl} />
      {imageUrl && (
        <div className="mt-4">
          <p className="text-sm text-gray-500">Image Preview:</p>
          <img
            src={imageUrl}
            alt="Uploaded"
            className="w-32 h-32 object-cover mt-2"
          />
        </div>
      )}
      <div className="mt-4">
        <label className="mr-2 font-medium text-white">Status:</label>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as "draft" | "published")}
          className="border border-gray-600 p-2 rounded bg-transparent text-white"
        >
          <option value="draft">Draft</option>
          <option value="published">Published</option>
        </select>
      </div>

      <button
        onClick={saveContent}
        disabled={saving}
        className="mt-4 bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition"
      >
        {saving ? "Saving..." : "Save Story"}
      </button>
    </>
  );
}
