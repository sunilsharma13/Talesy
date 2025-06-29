// components/UsernameLoginForm.tsx
import { useState } from "react";
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { motion } from 'framer-motion';
import Link from 'next/link';

interface UsernameLoginFormProps {
  onLogin: (loginIdentifier: string, password: string) => void;
  error: string | null;
  modalColors: {
    backgroundPrimary: string;
    backgroundSecondary: string;
    textPrimary: string;
    textSecondary: string;
    textSecondaryFaded: string;
    accentColor: string;
    accentColorHover: string;
    activeText: string;
    borderColor: string;
    borderColorSubtle: string;
    shadowColorSubtle: string;
    inputBackground: string;
    inputBorder: string;
    inputFocusRing: string;
  };
}

export default function UsernameLoginForm({ onLogin, error, modalColors }: UsernameLoginFormProps) {
  const [loginIdentifier, setLoginIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    await onLogin(loginIdentifier, password);
    setIsLoading(false);
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1">
        <label htmlFor="login-identifier" className="block text-xs font-medium mb-1" style={{ color: modalColors.textSecondary }}>
          Username or Email
        </label>
        <input
          id="login-identifier"
          type="text"
          placeholder="username or your@email.com"
          className="w-full px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 transition-all duration-300"
          style={{
            backgroundColor: modalColors.inputBackground,
            border: `1px solid ${modalColors.inputBorder}`,
            color: modalColors.textPrimary,
            '--tw-ring-color': modalColors.inputFocusRing,
          } as React.CSSProperties}
          value={loginIdentifier}
          onChange={(e) => setLoginIdentifier(e.target.value)}
          required
        />
      </div>

      <div className="space-y-1 relative">
        <label htmlFor="login-password" className="block text-xs font-medium mb-1" style={{ color: modalColors.textSecondary }}>
          Password
        </label>
        <input
          id="login-password"
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
        />
        <button
          type="button"
          onClick={togglePasswordVisibility}
          // --- FIX APPLIED HERE ---
          className="absolute top-1/2 -translate-y-1/4 right-3 flex items-center focus:outline-none"
          // ------------------------
          style={{ color: modalColors.textSecondary }}
          title={showPassword ? "Hide password" : "Show password"}
        >
          {showPassword ? <FaEyeSlash /> : <FaEye />}
        </button>
      </div>

      <p className="text-right text-sm">
        <Link href="/forgot-password"
              className={`underline transition-colors duration-200`}
              style={{ color: modalColors.accentColor }}
              onMouseEnter={(e) => e.currentTarget.style.color = modalColors.accentColorHover}
              onMouseLeave={(e) => e.currentTarget.style.color = modalColors.accentColor}
        >
          Forgot password?
        </Link>
      </p>

      <motion.button
        type="submit"
        disabled={isLoading}
        className="w-full py-2.5 font-medium rounded-lg transition-colors duration-300 disabled:opacity-70 disabled:cursor-not-allowed"
        whileHover={{ scale: 1.01, boxShadow: `0 5px 15px ${modalColors.shadowColorSubtle}` }}
        whileTap={{ scale: 0.99 }}
        style={{
          backgroundColor: modalColors.accentColor,
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
            Signing In...
          </span>
        ) : (
          "Sign In"
        )}
      </motion.button>
    </form>
  );
}