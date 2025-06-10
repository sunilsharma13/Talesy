import { Suspense } from "react";
import VerifyOTPClient from "./VerifyOTPClient";

export default function VerifyOTPPage() {
  return (
    <Suspense fallback={<LoadingOTP />}>
      <VerifyOTPClient />
    </Suspense>
  );
}

function LoadingOTP() {
  return (
    <div className="max-w-md mx-auto mt-10 space-y-6 p-6 bg-gray-800 rounded">
      <h2 className="text-white text-center text-2xl mb-4">Enter OTP</h2>
      <div className="animate-pulse">
        <div className="w-full h-10 bg-gray-700 rounded mb-4"></div>
        <div className="w-full h-10 bg-gray-700 rounded mb-4"></div>
        <div className="w-full h-10 bg-gray-700 rounded"></div>
      </div>
    </div>
  );
}