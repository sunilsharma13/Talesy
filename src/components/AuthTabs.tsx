// components/AuthTabs.tsx
"use client";

import { useState } from "react";

interface AuthTabsProps {
  activeTab: "login" | "register";
  onTabChange: (tab: "login" | "register") => void;
}

const AuthTabs: React.FC<AuthTabsProps> = ({ activeTab, onTabChange }) => {
    return (
        <div className="flex border-b border-gray-200">
        <button
            onClick={() => onTabChange("login")}
            className={`py-4 px-6 text-center w-1/2 transition duration-300 focus:outline-none ${
            activeTab === "login" ? "border-indigo-500 text-indigo-600 font-medium" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
        >
            Login
        </button>
        <button
            onClick={() => onTabChange("register")}
            className={`py-4 px-6 text-center w-1/2 transition duration-300 focus:outline-none ${
            activeTab === "register" ? "border-indigo-500 text-indigo-600 font-medium" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
        >
            Register
        </button>
        </div>
  );
};

export default AuthTabs;