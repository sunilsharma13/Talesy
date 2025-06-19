// app/reset-password/new-password/NewPasswordClient.tsx
"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";

export default function NewPasswordClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") || ""; // This 'token' is the OTP from verify-otp
  const [userId, setUserId] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false); // Added loading state

  useEffect(() => {
    if (!token) {
      setError("No valid verification token found.");
      return;
    }

    // Verify OTP on component load
    fetch("/api/auth/verify-otp", { // Correct API route
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ otp: token }), // Send 'otp' not 'token'
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.userId) {
          setUserId(data.userId);
        }
        else {
          setError(data.error || "Invalid or expired verification token. Please restart the forgot password process.");
        }
      })
      .catch(() => setError("Failed to verify token. Please try again."));
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setIsLoading(true); // Set loading true

    if (password.length < 6) { // Enforce minimum password length
      setError("Password must be at least 6 characters long.");
      setIsLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      setIsLoading(false);
      return;
    }

    if (!userId) {
      setError("User identification failed. Please try the process again.");
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/update-password", { // Correct API route
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, password }),
      });

      const resData = await res.json().catch(() => ({})); // Parse JSON even if not ok

      if (!res.ok) {
        setError(resData.error || "Failed to update password. Please try again.");
      } else {
        setSuccessMessage("Password updated successfully! Redirecting to login...");
        setTimeout(() => {
          router.push("/login");
        }, 3000);
      }
    } catch (err) {
      console.error("New password form submit error:", err);
      setError("An unexpected error occurred. Please try again later.");
    } finally {
      setIsLoading(false); // Set loading false
    }
  };

  if (!userId && !error) {
    // Show a loading state while token is being verified
    return (
      <div className="max-w-md mx-auto mt-10 space-y-6 p-6 bg-gray-800 rounded text-white text-center">
        Verifying token...
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500 mx-auto"></div>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-md mx-auto mt-10 space-y-6 p-6 bg-gray-800 rounded"
    >
      <h2 className="text-white text-center text-2xl mb-4">Set New Password</h2>
      {error && <p className="text-red-400 text-sm">{error}</p>}
      {successMessage && <p className="text-green-400 text-sm">{successMessage}</p>}
      {!userId && error && ( // Show "Start over" only if no userId and error
        <p className="text-gray-400 text-center text-sm">
          Please <a href="/forgot-password" className="text-indigo-400 hover:underline">start the process over</a>.
        </p>
      )}

      {userId && ( // Only show password fields if userId is verified
        <>
          <input
            type="password"
            placeholder="New password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 rounded bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            required
            minLength={6}
          />
          <input
            type="password"
            placeholder="Confirm new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full px-3 py-2 rounded bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            required
            minLength={6}
          />
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 rounded text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Updating Password..." : "Update Password"}
          </button>
        </>
      )}
    </form>
  );
}