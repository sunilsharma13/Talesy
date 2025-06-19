// components/UsernameLoginForm.tsx
"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { FaEye, FaEyeSlash } from 'react-icons/fa'; // Import eye icons

// Define the props for UsernameLoginForm more explicitly
interface UsernameLoginFormProps {
  // onLogin should accept the identifier and password
  onLogin: (loginIdentifier: string, password: string) => Promise<void>; 
  error?: string | null; // This will be the error passed from the parent LoginPage
}

export default function UsernameLoginForm({ onLogin, error }: UsernameLoginFormProps) {
  const [loginIdentifier, setLoginIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false); // New state for password visibility
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setLocalError(null);

    try {
      await onLogin(loginIdentifier, password);
    } catch (err) {
      console.error("Error calling onLogin prop:", err);
      setLocalError("An unexpected error occurred during login. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1">
        <label htmlFor="loginIdentifier" className="text-xs font-medium text-gray-300">
          Username or Email
        </label>
        <input
          id="loginIdentifier"
          type="text"
          placeholder="username or your@email.com"
          className="w-full rounded-lg bg-white/10 border border-white/20 px-4 py-2.5 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-transparent transition-all duration-300"
          value={loginIdentifier}
          onChange={(e) => setLoginIdentifier(e.target.value)}
          required
        />
      </div>

      <div className="space-y-1 relative"> {/* Added relative for positioning the eye icon */}
        <label htmlFor="password" className="text-xs font-medium text-gray-300">
          Password
        </label>
        <input
          id="password"
          type={showPassword ? "text" : "password"}
          placeholder="••••••••"
          className="w-full rounded-lg bg-white/10 border border-white/20 px-4 py-2.5 pr-10 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-transparent transition-all duration-300"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button
          type="button" // Important: type="button" to prevent form submission
          onClick={togglePasswordVisibility}
          className="absolute inset-y-0 right-0 pr-3 flex items-center pt-5 text-gray-400 hover:text-white focus:outline-none"
          title={showPassword ? "Hide password" : "Show password"}
        >
          {showPassword ? <FaEyeSlash /> : <FaEye />} {/* Conditional rendering of eye icon */}
        </button>
      </div>

      {(error || localError) && (
        <p className="text-sm text-red-300 bg-red-900/20 p-2 rounded-md">
          {error || localError}
        </p>
      )}

      <button
        type="submit"
        disabled={isLoading}
        className="w-full rounded-lg bg-indigo-600 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <span className="flex items-center justify-center">
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Signing in...
          </span>
        ) : (
          "Sign In"
        )}
      </button>
    </form>
  );
}