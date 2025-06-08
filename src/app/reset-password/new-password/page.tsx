// app/reset-password/new-password/page.tsx

"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";

export default function NewPassword() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") || "";
  const [userId, setUserId] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setError("No valid token found.");
      return;
    }
    // Verify token again to get userId (optional, or you can pass userId from verify OTP API)
    fetch("/api/auth/verify-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.userId) setUserId(data.userId);
        else setError("Invalid or expired token.");
      })
      .catch(() => setError("Failed to verify token."));
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (!userId) {
      setError("User identification failed.");
      return;
    }

    try {
      const res = await fetch("/api/auth/update-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, password }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        setError(errData.error || "Failed to update password.");
      } else {
        setSuccessMessage("Password updated successfully! Redirecting to login...");
        setTimeout(() => {
          router.push("/login");
        }, 3000);
      }
    } catch {
      setError("Unexpected error occurred.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto mt-10 space-y-6 p-6 bg-gray-800 rounded">
      <h2 className="text-white text-center text-2xl mb-4">Set New Password</h2>
      {error && <p className="text-red-400">{error}</p>}
      {successMessage && <p className="text-green-400">{successMessage}</p>}
      <input
        type="password"
        placeholder="New password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="w-full px-3 py-2 rounded bg-gray-700 text-white border border-gray-600"
        required
        minLength={6}
      />
      <input
        type="password"
        placeholder="Confirm new password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        className="w-full px-3 py-2 rounded bg-gray-700 text-white border border-gray-600"
        required
        minLength={6}
      />
      <button
        type="submit"
        className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 rounded text-white font-medium"
      >
        Update Password
      </button>
    </form>
  );
}
