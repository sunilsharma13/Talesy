// app/verify-otp/page.tsx
"use client";

import { useState, useEffect, useContext, createContext } from "react"; // Added createContext
import { useRouter, useSearchParams } from "next/navigation";
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

export default function VerifyOtpPage() {
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const identifier = searchParams.get("identifier"); // Get email/username from query param
  const { theme } = useTheme() || { theme: 'dark' };
  const getDynamicThemeClass = (prop: string) => `var(--${prop})`;

  useEffect(() => {
    if (!identifier) {
      toast.error("No email or username provided for OTP verification. Please go back.");
      router.replace("/forgot-password"); // Redirect if no identifier
    }
  }, [identifier, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (otp.length !== 6) { // Assuming 6-digit OTP
      toast.error("Please enter a 6-digit OTP.");
      setLoading(false);
      return;
    }

    try {
      // Sending 'otp' as 'token' to match your API's expected parameter
      // The `identifier` is included for context, if your backend uses it for lookup
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: otp, identifier }), 
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to verify OTP.");
      }

      toast.success(data.message || "OTP verified successfully!");
      
      // IMPORTANT: Now we expect `data.userId` from your /api/auth/verify-otp response
      if (data.userId) {
        router.push(`/reset-password?userId=${encodeURIComponent(data.userId)}`);
      } else {
        // Fallback if userId is not returned, prompt for restart
        toast.error("OTP verified, but user ID missing. Please restart the process.");
        router.push("/forgot-password");
      }
      
    } catch (error: any) {
      console.error("OTP verification error:", error);
      toast.error(error.message || "Failed to verify OTP. Please try again.");
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
          Verify OTP
        </h2>
        <p className="text-center mb-6 text-sm" style={{ color: getDynamicThemeClass('text-secondary') }}>
          An OTP has been sent to your email associated with <span className="font-semibold" style={{ color: getDynamicThemeClass('accent-color') }}>{identifier}</span>.
          Please enter it below.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label htmlFor="otp" className="block text-sm font-medium mb-2" style={{ color: getDynamicThemeClass('text-secondary') }}>
              One-Time Password (OTP)
            </label>
            <input
              type="text"
              id="otp"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))} // Allow only numbers
              maxLength={6} // Assuming 6-digit OTP
              className="w-full px-4 py-2.5 rounded-lg text-center text-xl tracking-widest focus:outline-none focus:ring-2"
              style={{
                backgroundColor: getDynamicThemeClass('input-background'),
                border: `1px solid ${getDynamicThemeClass('input-border')}`,
                color: getDynamicThemeClass('text-primary'),
                '--tw-ring-color': getDynamicThemeClass('accent-color'),
              } as React.CSSProperties}
              required
              inputMode="numeric"
              pattern="[0-9]*"
              autoComplete="one-time-code" // For better mobile keyboard experience
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
            {loading ? 'Verifying...' : 'Verify OTP'}
          </motion.button>
        </form>

        {/* You might add a resend OTP button here */}
        <p className="mt-6 text-center text-sm">
          <button
            onClick={() => router.push("/forgot-password")}
            className={`font-medium transition-colors duration-200 underline
              text-[color:var(--accent-color)] hover:text-[color:var(--accent-color-hover)]`} // Fixed hover style
          >
            Go back to request new OTP
          </button>
        </p>
      </motion.div>
    </div>
  );
}