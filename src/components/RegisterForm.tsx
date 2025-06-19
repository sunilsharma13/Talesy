// components/RegisterForm.tsx
"use client";

import { useState } from "react";
import { FaEye, FaEyeSlash } from 'react-icons/fa'; // Import eye icons

interface RegisterFormProps {
  onRegister: () => void;
}

export default function RegisterForm({ onRegister }: RegisterFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false); // New state for password visibility

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
        <label htmlFor="name" className="text-xs font-medium text-gray-300">
          Full Name
        </label>
        <input
          id="name"
          type="text"
          placeholder="John Doe"
          className="w-full rounded-lg bg-white/10 border border-white/20 px-4 py-2.5 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-transparent transition-all duration-300"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>

       <div className="space-y-1">
        <label htmlFor="username" className="text-xs font-medium text-gray-300">
          Username
        </label>
        <input
          id="username"
          type="text"
          placeholder="johndoe123"
          className="w-full rounded-lg bg-white/10 border border-white/20 px-4 py-2.5 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-transparent transition-all duration-300"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
      </div>
      
      <div className="space-y-1">
        <label htmlFor="reg-email" className="text-xs font-medium text-gray-300">
          Email Address
        </label>
        <input
          id="reg-email"
          type="email"
          placeholder="your@email.com"
          className="w-full rounded-lg bg-white/10 border border-white/20 px-4 py-2.5 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-transparent transition-all duration-300"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>

      <div className="space-y-1 relative"> {/* Added relative for positioning the eye icon */}
        <label htmlFor="reg-password" className="text-xs font-medium text-gray-300">
          Create Password
        </label>
        <input
          id="reg-password"
          type={showPassword ? "text" : "password"} 
          placeholder="••••••••"
          className="w-full rounded-lg bg-white/10 border border-white/20 px-4 py-2.5 pr-10 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-transparent transition-all duration-300"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
        />
        <button
          type="button" // Important: type="button" to prevent form submission
          onClick={togglePasswordVisibility}
          className="absolute inset-y-0 right-0 pr-3 flex items-center pt-5 text-gray-400 hover:text-white focus:outline-none"
          title={showPassword ? "Hide password" : "Show password"}
        >
          {showPassword ? <FaEyeSlash /> : <FaEye />} {/* Conditional rendering of eye icon */}
        </button>
        <p className="text-xs text-gray-400 mt-1">Password must be at least 8 characters</p>
      </div>

      {error && (
        <p className="text-sm text-red-300 bg-red-900/20 p-2 rounded-md">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={isLoading}
        className="w-full rounded-lg bg-green-600 py-2.5 text-sm font-medium text-white hover:bg-green-700 transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <span className="flex items-center justify-center">
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Creating account...
          </span>
        ) : (
          "Create Account"
        )}
      </button>

      <p className="text-xs text-center text-gray-400 mt-2">
        By registering, you agree to our
        <a href="/terms" className="text-white hover:underline ml-1">Terms of Service</a>
        {" "}and{" "}
        <a href="/privacy" className="text-white hover:underline">Privacy Policy</a>.
      </p>
    </form>
  );
}