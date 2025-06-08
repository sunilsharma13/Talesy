"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ForgotPassword() {
  const [emailOrUsername, setEmailOrUsername] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setError(null);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailOrUsername }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        setError(errData.error || "Failed to send OTP");
      } else {
        setMessage("OTP sent to your registered email.");
        router.push(`/verify-otp?email=${encodeURIComponent(emailOrUsername)}`);
      }
    } catch {
      setError("Unexpected error, please try again.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-md mx-auto mt-10 p-6 bg-gray-800 rounded">
      <h2 className="text-white text-center text-2xl mb-4">Forgot Password</h2>
      {error && <p className="text-red-400">{error}</p>}
      {message && <p className="text-green-400">{message}</p>}
      <input
        type="email"
        name="email"
        id="email"
        autoComplete="email"
        placeholder="Enter your email or username"
        value={emailOrUsername}
        onChange={(e) => setEmailOrUsername(e.target.value)}
        className="w-full px-3 py-2 rounded bg-gray-700 text-white border border-gray-600"
        required
      />
      <button
        type="submit"
        className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 rounded text-white font-medium"
      >
        Send OTP
      </button>
    </form>
  );
}
