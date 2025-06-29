// src/app/write/page.tsx
// यह फाइल अब तुम्हारा राइटिंग एडिटर पेज है, जो URL /write पर खुलेगा।

"use client";

import { useState, useEffect, useCallback } from "react"; 
// सुनिश्चित करें कि TiptapEditor कॉम्पोनेंट सही ढंग से परिभाषित और इम्पोर्ट किया गया है
import TiptapEditor from "@/components/TiptapEditor"; 
import { toast } from 'react-hot-toast'; // मान लिया है कि तुम react-hot-toast का उपयोग करते हो
import { useTheme } from '@/context/ThemeContext'; // NEW: useTheme इम्पोर्ट किया

const WritePage = () => {
  const [content, setContent] = useState<string>("");
  const { theme } = useTheme(); // NEW: वर्तमान थीम प्राप्त की

  // content लोड करें जब पेज लोड हो
  useEffect(() => {
    const savedContent = localStorage.getItem("savedContent");
    if (savedContent) {
      setContent(savedContent);
    }
  }, []);

  // यह फंक्शन TiptapEditor के onContentChange प्रॉप के लिए सही टाइप से मैच करेगा।
  // इसकी टाइपिंग (newContent: string) => void है।
  const handleContentChange = useCallback((newContent: string) => {
    setContent(newContent);
  }, []); 


  const handleSave = () => {
    localStorage.setItem("savedContent", content);
    toast.success("कंटेंट सेव हो गया!"); 
  };

  return (
    <div className="max-w-2xl mx-auto p-4 min-h-[calc(100vh-80px)] flex flex-col">
      <h1 className="text-2xl font-bold mb-4 text-[var(--text-primary)]">
        Start Writing
      </h1>
      {/* NEW: TiptapEditor को 'theme' प्रॉप पास किया गया है */}
      <div className="flex-grow mb-4"> 
        <TiptapEditor content={content} onContentChange={handleContentChange} theme={theme as "light" | "dark" | "sepia"} />
      </div>
      <button
        onClick={handleSave}
        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg shadow-md transition-colors duration-300 self-start" 
      >
        Save Story
      </button>
    </div>
  );
};

export default WritePage;
