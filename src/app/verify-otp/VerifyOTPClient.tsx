// app/verify-otp/VerifyOTPClient.tsx
"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function VerifyOTPClient() {
  const [otp, setOtp] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false); // Added loading state for verify
  const [isResending, setIsResending] = useState(false); // Added loading state for resend
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailOrUsername = searchParams.get("email"); // Changed to emailOrUsername

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setIsLoading(true); // Set loading true

    try {
      const res = await fetch("/api/auth/verify-otp", { // Correct API route
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ otp: otp }), // Send 'otp' not 'token'
      });

      const resData = await res.json().catch(() => ({})); // Parse JSON even if not ok

      if (!res.ok) {
        setError(resData.error || "Invalid OTP. Please try again.");
      } else {
        setMessage("OTP verified successfully. Redirecting...");
        // Pass the actual OTP (now validated as a token) to the new password page
        router.push(`/reset-password/new-password?token=${otp}`);
      }
    } catch (err) {
      console.error("Verify OTP form submit error:", err);
      setError("An unexpected error occurred. Please try again later.");
    } finally {
      setIsLoading(false); // Set loading false
    }
  };

  const handleResend = async () => {
    if (!emailOrUsername) {
      setError("Cannot resend OTP: Email or username not found in URL.");
      return;
    }
    setError(null);
    setMessage(null);
    setIsResending(true); // Set resending loading true

    try {
      const res = await fetch("/api/auth/forgot-password", { // Re-use the forgot-password API
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailOrUsername }),
      });

      const resData = await res.json().catch(() => ({}));

      if (res.ok) {
        setMessage(resData.message || "New OTP sent successfully.");
      } else {
        setError(resData.error || "Failed to resend OTP. Please try again.");
      }
    } catch (err) {
      console.error("Resend OTP error:", err);
      setError("An unexpected error occurred during resend. Please try again later.");
    } finally {
      setIsResending(false); // Set resending loading false
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto mt-10 space-y-6 p-6 bg-gray-800 rounded">
      <h2 className="text-white text-center text-2xl mb-4">Enter OTP</h2>
      {emailOrUsername && (
        <p className="text-gray-300 text-center text-sm">
          An OTP has been sent to {emailOrUsername}.
        </p>
      )}
      {error && <p className="text-red-400 text-sm">{error}</p>}
      {message && <p className="text-green-400 text-sm">{message}</p>}
      <input
        type="text"
        maxLength={6} // Changed to 6-digit OTP
        value={otp}
        onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))} // Only allow digits
        placeholder="6-digit OTP"
        className="w-full px-3 py-2 rounded bg-gray-700 text-white border border-gray-600 text-center tracking-widest text-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
        required
      />
      <button
        type="submit"
        disabled={isLoading}
        className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 rounded text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? "Verifying..." : "Verify OTP"}
      </button>
      <button
        type="button"
        onClick={handleResend}
        disabled={isResending}
        className="w-full py-2 bg-gray-600 hover:bg-gray-700 rounded text-white font-medium mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isResending ? "Resending..." : "Resend OTP"}
      </button>
    </form>
  );
}