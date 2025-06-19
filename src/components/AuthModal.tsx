// components/AuthModal.tsx
'use client';

import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import UsernameLoginForm from "@/components/UsernameLoginForm";
import RegisterForm from "@/components/RegisterForm";
import { AnimatePresence, motion } from 'framer-motion';
import { AiOutlineGoogle, AiOutlineUser, AiOutlineUserAdd } from 'react-icons/ai';

interface AuthModalProps {
  onClose: () => void;
  initialTab?: "login" | "register";
}

export default function AuthModal({ onClose, initialTab = "login" }: AuthModalProps) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [loginError, setLoginError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  const handleSuccessfulLogin = () => {
    onClose();
    router.push('/landing');
  };

  const handleCredentialsLogin = async (loginIdentifier: string, password: string) => {
    setLoginError(null);

    const result = await signIn('credentials', {
      redirect: false,
      loginIdentifier,
      password,
    });

    if (result?.error) {
      if (result.error === "CredentialsSignin") {
        setLoginError("Invalid username or password. Please try again.");
      } else {
        setLoginError(result.error);
      }
      console.error("Login failed:", result.error);
    } else if (result?.ok) {
      handleSuccessfulLogin();
    }
  };

  const handleGoogleSignIn = async () => {
    await signIn("google", { callbackUrl: '/dashboard' });
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-70 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        className="relative w-full max-w-md sm:max-w-md md:max-w-lg lg:max-w-md xl:max-w-md bg-gradient-to-br from-[#0e0e2c]/95 via-[#1a1a3a]/95 to-[#252550]/95 text-white backdrop-blur-md border border-white/20 rounded-2xl shadow-3xl p-6 sm:p-8 space-y-6"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ duration: 0.2 }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors duration-200 text-2xl"
          title="Close"
        >
          &times;
        </button>

        <div className="text-center space-y-3">
          <h1 className="text-3xl font-extrabold tracking-wide text-white drop-shadow-lg">
            Welcome to Talesy
          </h1>

          <div className="flex justify-center gap-6 mt-2">
            <button
              onClick={() => setActiveTab("login")}
              className={`text-sm font-medium transition-all duration-300 py-2 px-4 rounded-md ${
                activeTab === "login"
                  ? "bg-indigo-600 text-white shadow-md"
                  : "text-gray-300 hover:text-white hover:bg-gray-700/50"
              } flex items-center gap-2`}
            >
              <AiOutlineUser /> Login
            </button>
            <button
              onClick={() => setActiveTab("register")}
              className={`text-sm font-medium transition-all duration-300 py-2 px-4 rounded-md ${
                activeTab === "register"
                  ? "bg-indigo-600 text-white shadow-md"
                  : "text-gray-300 hover:text-white hover:bg-gray-700/50"
              } flex items-center gap-2`}
            >
              <AiOutlineUserAdd /> Register
            </button>
          </div>
        </div>

        {activeTab === "login" ? (
          <>
            {/* Google button using AiOutlineGoogle */}
            <button
              onClick={handleGoogleSignIn}
              className="w-full bg-white/10 text-white border border-white/30 rounded-lg py-3 font-medium hover:bg-white/20 transition-all duration-300 backdrop-blur-sm text-base flex items-center justify-center space-x-2 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
            >
              <AiOutlineGoogle className="w-6 h-6" />
              <span>Sign in with Google</span>
            </button>

            <div className="flex items-center gap-3 my-4">
              <div className="h-px bg-white/20 flex-1"></div>
              <span className="text-sm text-white/60">OR</span>
              <div className="h-px bg-white/20 flex-1"></div>
            </div>

            <UsernameLoginForm
              error={loginError}
              onLogin={handleCredentialsLogin}
            />

            <div className="text-right">
              <a href="/forgot-password" className="text-xs text-gray-300 hover:text-white transition-colors duration-300 underline">
                Forgot your password?
              </a>
            </div>
          </>
        ) : (
          <>
            <RegisterForm onRegister={() => setActiveTab("login")} />
          </>
        )}

        <p className="text-sm text-center text-gray-300">
          {activeTab === "login" ? "Not a member yet? " : "Already have an account? "}
          <button
            onClick={() => setActiveTab(activeTab === "login" ? "register" : "login")}
            className="underline hover:text-white transition-colors duration-300"
          >
            {activeTab === "login" ? "Create an account" : "Sign in"}
          </button>
        </p>
      </motion.div>
    </motion.div>
  );
}