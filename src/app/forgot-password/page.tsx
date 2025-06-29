// app/forgot-password/page.tsx
"use client";

import { useState, useContext, createContext } from "react"; // Added createContext
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { motion } from "framer-motion";

// Temporary placeholder for ThemeContextType and ThemeContext.
// Ideally, import these from a centralized context file in your project.
interface ThemeContextType {
  theme: "light" | "dark" | "talesy-accent";
  setTheme: (theme: "light" | "dark" | "talesy-accent") => void;
}
// This line should be replaced with `import { ThemeContext } from '@/path/to/your/ThemeContext';`
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);
// This line should be replaced with `import { useTheme } from '@/path/to/your/ThemeContext';`
const useTheme = () => {
  const context = useContext(ThemeContext);
  return context;
};

export default function ForgotPasswordPage() {
  const [emailOrUsername, setEmailOrUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { theme } = useTheme() || { theme: 'dark' };
  const getDynamicThemeClass = (prop: string) => `var(--${prop})`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailOrUsername }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to send OTP.");
      }

      toast.success(data.message || "If your account exists, an OTP has been sent to your email.");
      // Redirect to OTP verification page, passing email/username for display and potential backend lookup
      router.push(`/verify-otp?identifier=${encodeURIComponent(emailOrUsername)}`);

    } catch (error: any) {
      console.error("Forgot password error:", error);
      toast.error(error.message || "Failed to initiate password reset.");
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
          Forgot Password
        </h2>
        <p className="text-center mb-6 text-sm" style={{ color: getDynamicThemeClass('text-secondary') }}>
          Enter your email or username to receive a password reset OTP.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label htmlFor="emailOrUsername" className="block text-sm font-medium mb-2" style={{ color: getDynamicThemeClass('text-secondary') }}>
              Email or Username
            </label>
            <input
              type="text"
              id="emailOrUsername"
              value={emailOrUsername}
              onChange={(e) => setEmailOrUsername(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2"
              style={{
                backgroundColor: getDynamicThemeClass('input-background'),
                border: `1px solid ${getDynamicThemeClass('input-border')}`,
                color: getDynamicThemeClass('text-primary'),
                '--tw-ring-color': getDynamicThemeClass('accent-color'),
              } as React.CSSProperties}
              required
              autoComplete="username" // Or email
            />
          </div>

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
            {loading ? 'Sending OTP...' : 'Send OTP'}
          </motion.button>
        </form>

        <p className="mt-6 text-center text-sm">
          <button
            onClick={() => router.push("/login")}
            className={`font-medium transition-colors duration-200 underline
              text-[color:var(--accent-color)] hover:text-[color:var(--accent-color-hover)]`} // Fixed hover style
          >
            Back to Login
          </button>
        </p>
      </motion.div>
    </div>
  );
}