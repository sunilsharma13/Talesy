// app/forgot-password/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ForgotPassword() {
  const [emailOrUsername, setEmailOrUsername] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false); // Added loading state
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setError(null);
    setIsLoading(true); // Set loading true

    try {
      const res = await fetch("/api/auth/forgot-password", { // Corrected API route
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailOrUsername }),
      });

      const resData = await res.json().catch(() => ({})); // Parse JSON even if not ok

      if (!res.ok) {
        setError(resData.error || "Failed to send OTP. Please try again.");
      } else {
        setMessage(resData.message || "OTP sent to your registered email.");
        // Redirect to OTP verification page, passing the email (or username) along
        router.push(`/verify-otp?email=${encodeURIComponent(emailOrUsername)}`);
      }
    } catch (err) {
      console.error("Forgot password form submit error:", err);
      setError("An unexpected error occurred. Please try again later.");
    } finally {
      setIsLoading(false); // Set loading false
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-md mx-auto mt-10 p-6 bg-gray-800 rounded">
      <h2 className="text-white text-center text-2xl mb-4">Forgot Password</h2>
      {error && <p className="text-red-400 text-sm">{error}</p>}
      {message && <p className="text-green-400 text-sm">{message}</p>}
      <input
        type="text" // Can be text for username or email
        name="emailOrUsername" // Changed name to reflect both options
        id="emailOrUsername"
        placeholder="Enter your email or username"
        value={emailOrUsername}
        onChange={(e) => setEmailOrUsername(e.target.value)}
        className="w-full px-3 py-2 rounded bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        required
      />
      <button
        type="submit"
        disabled={isLoading} // Disable button while loading
        className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 rounded text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? "Sending OTP..." : "Send OTP"}
      </button>
    </form>
  );
}