// app/reset-password/page.tsx
"use client";

import { useState, useEffect, useContext, createContext, Suspense } from "react"; // Added Suspense
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "react-hot-toast";
import { motion } from "framer-motion";

// Temporary placeholder for ThemeContextType and ThemeContext.
// Ideally, import these from a centralized context file in your project.
interface ThemeContextType {
  theme: "light" | "dark" | "talesy-accent";
  setTheme: (theme: "light" | "dark" | "talesy-accent") => void;
}
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);
const useTheme = () => {
  const context = useContext(ThemeContext);
  return context;
};

// Component that uses useSearchParams, wrapped in a dedicated component
function ResetPasswordContent() {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams(); // useSearchParams is here
  const userId = searchParams.get("userId"); // Get userId from query param
  const { theme } = useTheme() || { theme: 'dark' };
  
  // Helper function to get CSS variable values
  const getDynamicThemeClass = (prop: string) => {
    if (typeof document === 'undefined') return ''; // Handle SSR for initial render
    const rootStyles = getComputedStyle(document.documentElement);
    const value = rootStyles.getPropertyValue(`--${prop}`).trim();
    // Fallback values for development/initial render if not found
    if (!value) {
      if (prop === 'background-primary') return '#ffffff';
      if (prop === 'background-secondary') return '#f0f2f5';
      if (prop === 'border-color') return '#e2e8f0';
      if (prop === 'text-primary') return '#1a202c';
      if (prop === 'text-secondary') return '#4a5568';
      if (prop === 'text-secondary-faded') return '#718096';
      if (prop === 'accent-color') return '#6366f1';
      if (prop === 'active-text') return '#ffffff';
      if (prop === 'input-background') return '#ffffff';
      if (prop === 'input-border') return '#e2e8f0';
      if (prop === 'error-background') return '#fee2e2';
      if (prop === 'error-color') return '#ef4444';
      if (prop === 'error-border') return '#fca5a5';
      if (prop === 'shadow-color-subtle') return 'rgba(0,0,0,0.1)';
      if (prop === 'accent-color-hover') return '#4f46e5';
    }
    return value;
  };

  useEffect(() => {
    if (!userId) {
      toast.error("Invalid reset link. Please start the forgot password process again.");
      router.replace("/forgot-password"); // Redirect if no userId
    }
  }, [userId, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError("");

    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match.");
      return;
    }

    if (newPassword.length < 8) { // Assuming minimum 8 characters
      setPasswordError("Password must be at least 8 characters.");
      return;
    }

    if (!userId) {
        setPasswordError("User ID missing. Cannot reset password.");
        return;
    }

    setLoading(true);

    try {
      // Calls your provided /api/auth/update-password API
      const res = await fetch("/api/auth/update-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, password: newPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to reset password.");
      }

      toast.success(data.message || "Password reset successfully! You can now log in.");
      router.push("/login"); // Redirect to login page

    } catch (error: any) {
      console.error("Reset password error:", error);
      setPasswordError(error.message || "Failed to reset password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-80px)] items-center justify-center p-4"
         style={{ backgroundColor: getDynamicThemeClass('background-primary') }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className={`w-full max-w-md p-8 rounded-xl shadow-lg`}
        style={{ backgroundColor: getDynamicThemeClass('background-secondary'), border: `1px solid ${getDynamicThemeClass('border-color')}` }}
      >
        <h2 className="text-2xl font-bold mb-6 text-center" style={{ color: getDynamicThemeClass('text-primary') }}>
          Set New Password
        </h2>
        <p className="text-center mb-6 text-sm" style={{ color: getDynamicThemeClass('text-secondary') }}>
          Enter your new password below.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="newPassword" className="block text-sm font-medium mb-2" style={{ color: getDynamicThemeClass('text-secondary') }}>
              New Password
            </label>
            <input
              type="password"
              id="newPassword"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2"
              style={{
                backgroundColor: getDynamicThemeClass('input-background'),
                border: `1px solid ${getDynamicThemeClass('input-border')}`,
                color: getDynamicThemeClass('text-primary'),
                '--tw-ring-color': getDynamicThemeClass('accent-color'),
              } as React.CSSProperties}
              required
              minLength={8}
            />
            <p className="text-xs mt-1" style={{ color: getDynamicThemeClass('text-secondary-faded') }}>
              Password must be at least 8 characters
            </p>
          </div>
          
          <div className="mb-6">
            <label htmlFor="confirmPassword" className="block text-sm font-medium mb-2" style={{ color: getDynamicThemeClass('text-secondary') }}>
              Confirm New Password
            </label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2"
              style={{
                backgroundColor: getDynamicThemeClass('input-background'),
                border: `1px solid ${getDynamicThemeClass('input-border')}`,
                color: getDynamicThemeClass('text-primary'),
                '--tw-ring-color': getDynamicThemeClass('accent-color'),
              } as React.CSSProperties}
              required
            />
          </div>
          
          {passwordError && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-6 p-3 rounded-lg text-sm"
              style={{ backgroundColor: getDynamicThemeClass('error-background'), color: getDynamicThemeClass('error-color'), border: `1px solid ${getDynamicThemeClass('error-border')}` }}
            >
              {passwordError}
            </motion.div>
          )}
          
          <motion.button
            type="submit"
            disabled={loading}
            className="w-full px-5 py-3 font-medium rounded-lg transition-colors duration-300 disabled:opacity-70 disabled:cursor-not-allowed"
            style={{
              backgroundColor: getDynamicThemeClass('accent-color'),
              color: getDynamicThemeClass('active-text'),
              boxShadow: `0 4px 10px ${getDynamicThemeClass('shadow-color-subtle')}`,
              '--tw-bg-opacity': loading ? '0.7' : '1',
            } as React.CSSProperties}
            whileHover={{ scale: 1.02, backgroundColor: getDynamicThemeClass('accent-color-hover') }}
            whileTap={{ scale: 0.98 }}
          >
            {loading ? 'Resetting Password...' : 'Reset Password'}
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
}

// Default export is wrapped in Suspense for useSearchParams
export default function ResetPasswordPageWrapper() {
  return (
    <Suspense fallback={
      <div className="flex min-h-[calc(100vh-80px)] items-center justify-center p-4">
        <div className="w-full max-w-md p-8 rounded-xl shadow-lg bg-gray-800 text-white text-center">
          Loading password reset form...
        </div>
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
}