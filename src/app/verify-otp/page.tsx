"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function VerifyOTPPage() {
  const [otp, setOtp] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: otp }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Invalid OTP");
      } else {
        router.push(`/reset-password/new-password?token=${otp}`);
      }
    } catch {
      setError("Unexpected error, please try again");
    }
  };

  const handleResend = async () => {
    if (!email) {
      setError("Email not found");
      return;
    }

    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (res.ok) {
        setMessage("OTP resent successfully.");
      } else {
        setError("Failed to resend OTP");
      }
    } catch {
      setError("Network error");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto mt-10 space-y-6 p-6 bg-gray-800 rounded">
      <h2 className="text-white text-center text-2xl mb-4">Enter OTP</h2>
      {error && <p className="text-red-400">{error}</p>}
      {message && <p className="text-green-400">{message}</p>}
      <input
        type="text"
        maxLength={4}
        value={otp}
        onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
        placeholder="4-digit OTP"
        className="w-full px-3 py-2 rounded bg-gray-700 text-white border border-gray-600 text-center tracking-widest text-lg"
        required
      />
      <button
        type="submit"
        className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 rounded text-white font-medium"
      >
        Verify OTP
      </button>
      <button
        type="button"
        onClick={handleResend}
        className="w-full py-2 bg-gray-600 hover:bg-gray-700 rounded text-white font-medium mt-2"
      >
        Resend OTP
      </button>
    </form>
  );
}
