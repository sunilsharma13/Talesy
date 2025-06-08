"use client";

import { useState, useEffect } from "react";
import TiptapEditor from "@/components/TiptapEditor";

const WritePage = () => {
  const [content, setContent] = useState("");
  const [message, setMessage] = useState(""); // Correctly placed inside the component
  const [showMessage, setShowMessage] = useState(false);

  // Load saved content when the page loads
  useEffect(() => {
    const savedContent = localStorage.getItem("savedContent");
    if (savedContent) {
      setContent(savedContent);
    }
  }, []);

  const handleSave = () => {
    localStorage.setItem("savedContent", content); // Ensure content is actually saved
    setMessage("Content saved!");

    // Hide the message after 3 seconds
    setTimeout(() => {
      setMessage("");
    }, 3000);
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">
        Sunil, you're awesome! Now write your story
      </h1>
      <TiptapEditor content={content} setContent={setContent} />
      <button
        onClick={handleSave}
        className="bg-blue-500 text-white px-4 py-2 rounded"
      >
        Save
      </button>

      {message && (
        <div className="fixed bottom-4 right-4 bg-green-500 text-white px-4 py-2 rounded">
          {message}
        </div>
      )}
    </div>
  );
};

export default WritePage;
