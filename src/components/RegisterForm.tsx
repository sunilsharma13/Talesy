// components/RegisterForm.tsx
"use client";

import { useState } from "react";
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { motion } from 'framer-motion';

interface RegisterFormProps {
  onRegister: () => void;
  modalColors: {
    backgroundPrimary: string;
    backgroundSecondary: string;
    textPrimary: string;
    textSecondary: string;
    textSecondaryFaded: string;
    accentColor: string;
    accentColorHover: string; // This is the color we need for hover
    activeText: string;
    borderColor: string;
    borderColorSubtle: string;
    shadowColorSubtle: string;
    inputBackground: string;
    inputBorder: string;
    inputFocusRing: string;
    errorBackground: string;
    errorColor: string;
    errorBorder: string;
  };
}

export default function RegisterForm({ onRegister, modalColors }: RegisterFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        body: JSON.stringify({ name, username, email, password }),
        headers: { "Content-Type": "application/json" },
      });

      if (res.ok) {
        onRegister();
      } else {
        const errorData = await res.json();
        setError(errorData.error || "Failed to register. Please try again.");
      }
    } catch (error) {
      console.error("Registration error:", error);
      setError("An error occurred. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <form onSubmit={handleRegister} className="space-y-4">
      <div className="space-y-1">
        <label htmlFor="name" className="block text-xs font-medium mb-1" style={{ color: modalColors.textSecondary }}>
          Full Name
        </label>
        <input
          id="name"
          type="text"
          placeholder="John Doe"
          className="w-full px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 transition-all duration-300"
          style={{
            backgroundColor: modalColors.inputBackground,
            border: `1px solid ${modalColors.inputBorder}`,
            color: modalColors.textPrimary,
            '--tw-ring-color': modalColors.inputFocusRing,
          } as React.CSSProperties}
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>

       <div className="space-y-1">
        <label htmlFor="username" className="block text-xs font-medium mb-1" style={{ color: modalColors.textSecondary }}>
          Username
        </label>
        <input
          id="username"
          type="text"
          placeholder="johndoe123"
          className="w-full px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 transition-all duration-300"
          style={{
            backgroundColor: modalColors.inputBackground,
            border: `1px solid ${modalColors.inputBorder}`,
            color: modalColors.textPrimary,
            '--tw-ring-color': modalColors.inputFocusRing,
          } as React.CSSProperties}
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
      </div>
      
      <div className="space-y-1">
        <label htmlFor="reg-email" className="block text-xs font-medium mb-1" style={{ color: modalColors.textSecondary }}>
          Email Address
        </label>
        <input
          id="reg-email"
          type="email"
          placeholder="your@email.com"
          className="w-full px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 transition-all duration-300"
          style={{
            backgroundColor: modalColors.inputBackground,
            border: `1px solid ${modalColors.inputBorder}`,
            color: modalColors.textPrimary,
            '--tw-ring-color': modalColors.inputFocusRing,
          } as React.CSSProperties}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>

      <div className="space-y-1 relative">
        <label htmlFor="reg-password" className="block text-xs font-medium mb-1" style={{ color: modalColors.textSecondary }}>
          Create Password
        </label>
        <input
          id="reg-password"
          type={showPassword ? "text" : "password"} 
          placeholder="••••••••"
          className="w-full px-4 py-2.5 pr-10 rounded-lg focus:outline-none focus:ring-2 transition-all duration-300"
          style={{
            backgroundColor: modalColors.inputBackground,
            border: `1px solid ${modalColors.inputBorder}`,
            color: modalColors.textPrimary,
            '--tw-ring-color': modalColors.inputFocusRing,
          } as React.CSSProperties}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
        />
        <button
          type="button"
          onClick={togglePasswordVisibility}
          className="absolute top-1/2 -translate-y-1/2 right-3 flex items-center focus:outline-none"
          style={{ color: modalColors.textSecondary }} // Ensure eye icon color is consistent
          title={showPassword ? "Hide password" : "Show password"}
        >
          {showPassword ? <FaEyeSlash /> : <FaEye />}
        </button>
        <p className="text-xs mt-1" style={{ color: modalColors.textSecondaryFaded }}>Password must be at least 8 characters</p>
      </div>

      {error && (
        <p className="text-sm p-2 rounded-md"
           style={{ backgroundColor: modalColors.errorBackground, color: modalColors.errorColor, border: `1px solid ${modalColors.errorBorder}` }}>
          {error}
        </p>
      )}

      <motion.button
        type="submit"
        disabled={isLoading}
        className="w-full py-2.5 font-medium rounded-lg transition-colors duration-300 disabled:opacity-70 disabled:cursor-not-allowed"
        whileHover={{ scale: 1.01, boxShadow: `0 5px 15px ${modalColors.shadowColorSubtle}` }}
        whileTap={{ scale: 0.99 }}
        style={{
          backgroundColor: modalColors.accentColor, // Use accent color for consistency
          color: modalColors.activeText,
          boxShadow: `0 4px 10px ${modalColors.shadowColorSubtle}`,
          '--tw-bg-opacity': isLoading ? '0.7' : '1',
        } as React.CSSProperties}
      >
        {isLoading ? (
          <span className="flex items-center justify-center">
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4" style={{ color: modalColors.activeText }} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Creating account...
          </span>
        ) : (
          "Create Account"
        )}
      </motion.button>

      <p className="text-xs text-center mt-2" style={{ color: modalColors.textSecondaryFaded }}>
        By registering, you agree to our
        <a href="/terms" className={`font-medium transition-colors duration-200 underline ml-1`}
          style={{ color: modalColors.accentColor }} // Default color
          // Tailwind hover class to use the accentColorHover
          onMouseEnter={(e) => e.currentTarget.style.color = modalColors.accentColorHover}
          onMouseLeave={(e) => e.currentTarget.style.color = modalColors.accentColor}
        >Terms of Service</a>
        {" "}and{" "}
        <a href="/privacy" className={`font-medium transition-colors duration-200 underline`}
          style={{ color: modalColors.accentColor }} // Default color
          // Tailwind hover class to use the accentColorHover
          onMouseEnter={(e) => e.currentTarget.style.color = modalColors.accentColorHover}
          onMouseLeave={(e) => e.currentTarget.style.color = modalColors.accentColor}
        >Privacy Policy</a>.
      </p>
    </form>
  );
}