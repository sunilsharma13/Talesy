// components/AuthModal.tsx
'use client';

import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import UsernameLoginForm from "@/components/UsernameLoginForm";
import RegisterForm from "@/components/RegisterForm";
import { AnimatePresence, motion } from 'framer-motion';
import { AiOutlineGoogle, AiOutlineUser, AiOutlineUserAdd } from 'react-icons/ai';
// No longer importing useTheme from ClientProviders for AuthModal's internal styling

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
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [onClose]);

  const handleSuccessfulLogin = () => {
    onClose();
    router.push('/feed');
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
    await signIn("google", { callbackUrl: '/feed' });
  };

  // Variants for modal content animation
  const modalContentVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } },
    exit: { opacity: 0, y: -20, transition: { duration: 0.2, ease: "easeIn" } }
  };

  // Define static dark theme-like colors for the modal itself
  // These are derived from your typical dark theme values, ensuring consistency within the modal
  const modalColors = {
    backgroundPrimary: '#121212', // Main dark background
    backgroundSecondary: '#1e1e1e', // Card/Modal background
    textPrimary: '#eaeaea', // Main text
    textSecondary: '#b3b3b3', // Secondary text
    textSecondaryFaded: '#808080', // Faded text/placeholders
    accentColor: '#bb86fc', // Blue/Purple accent (for buttons, links, active states)
    accentColorHover: '#9e6fef', // Lighter accent on hover
    activeText: '#121212', // Text color when on accent background (black for contrast)
    borderColor: '#333333', // General borders
    borderColorSubtle: '#444444', // Subtler borders
    shadowColorStrong: 'rgba(0, 0, 0, 0.5)', // Strong shadows
    shadowColorSubtle: 'rgba(0, 0, 0, 0.3)', // Subtle shadows
    inputBackground: 'rgba(40, 40, 40, 0.7)', // Input field background
    inputBorder: '#555555', // Input field border (more visible)
    inputFocusRing: '#bb86fc', // Input focus ring color (same as accent)
    errorBackground: 'rgba(207, 102, 121, 0.2)', // Error message background
    errorColor: '#cf6679', // Error message text color
    errorBorder: 'rgba(207, 102, 121, 0.5)', // Error message border
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
        className="relative w-full max-w-md sm:max-w-md md:max-w-lg lg:max-w-md xl:max-w-md rounded-2xl shadow-3xl p-6 sm:p-8 space-y-6 overflow-hidden"
        style={{
          background: `linear-gradient(145deg, ${modalColors.backgroundSecondary} 0%, ${modalColors.backgroundPrimary} 100%)`,
          color: modalColors.textPrimary,
          border: `1px solid ${modalColors.borderColor}70`,
          boxShadow: `0 15px 30px ${modalColors.shadowColorStrong}`,
          backdropFilter: 'blur(18px)',
          WebkitBackdropFilter: 'blur(18px)',
        }}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ duration: 0.2 }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-2xl transition-colors duration-200 hover:text-white"
          style={{ color: modalColors.textSecondary }}
          title="Close"
        >
          &times;
        </button>

        <div className="text-center space-y-3">
          <h1 className="text-3xl font-extrabold tracking-wide drop-shadow-lg"
              style={{ color: modalColors.textPrimary }}>
            Welcome to Talesy
          </h1>

          <div className="flex justify-center gap-4 mt-2 p-1 rounded-full"
               style={{
                 background: modalColors.inputBackground,
                 border: `1px solid ${modalColors.borderColorSubtle}`,
               }}>
            {/* Sign In Tab Button */}
            <motion.button
              onClick={() => setActiveTab("login")}
              className={`relative z-10 flex-1 text-sm font-medium transition-all duration-300 py-2 px-4 rounded-full flex items-center justify-center gap-2`}
              whileHover={{ scale: 1.02, transition: { duration: 0.1 } }}
              whileTap={{ scale: 0.98 }}
              style={{
                backgroundColor: activeTab === "login" ? modalColors.accentColor : 'transparent',
                color: activeTab === "login" ? modalColors.activeText : modalColors.textSecondary,
                boxShadow: activeTab === "login" ? `0 4px 10px ${modalColors.shadowColorSubtle}` : 'none',
              }}
            >
              <AiOutlineUser /> Sign In
            </motion.button>
            
            {/* Register Tab Button */}
            <motion.button
              onClick={() => setActiveTab("register")}
              className={`relative z-10 flex-1 text-sm font-medium transition-all duration-300 py-2 px-4 rounded-full flex items-center justify-center gap-2`}
              whileHover={{ scale: 1.02, transition: { duration: 0.1 } }}
              whileTap={{ scale: 0.98 }}
              style={{
                backgroundColor: activeTab === "register" ? modalColors.accentColor : 'transparent',
                color: activeTab === "register" ? modalColors.activeText : modalColors.textSecondary,
                boxShadow: activeTab === "register" ? `0 4px 10px ${modalColors.shadowColorSubtle}` : 'none',
              }}
            >
              <AiOutlineUserAdd /> Register
            </motion.button>
          </div>
        </div>

        {/* Dynamic content based on activeTab */}
        <AnimatePresence mode="wait">
          {activeTab === "login" ? (
            <motion.div
              key="loginForm"
              variants={modalContentVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="space-y-4"
            >
              {/* Google button using AiOutlineGoogle */}
              <motion.button
                onClick={handleGoogleSignIn}
                className="relative w-full rounded-lg py-3 font-medium transition-all duration-300 text-base flex items-center justify-center space-x-2 shadow-md overflow-hidden group"
                whileHover={{ scale: 1.01, boxShadow: `0 5px 15px ${modalColors.shadowColorSubtle}` }}
                whileTap={{ scale: 0.99 }}
                style={{
                  backgroundColor: modalColors.inputBackground,
                  color: modalColors.textPrimary,
                  border: `1px solid ${modalColors.borderColorSubtle}`,
                }}
              >
                <AiOutlineGoogle className="w-6 h-6" />
                <span>Sign in with Google</span>
                {/* Shimmer effect */}
                <span className="absolute -inset-x-full bg-white/10 transform -rotate-45 -translate-x-full group-hover:translate-x-full z-0 transition-transform duration-700 ease-out"></span>
              </motion.button>

              <div className="flex items-center gap-3 my-4">
                <div className="h-px flex-1" style={{ backgroundColor: modalColors.borderColorSubtle }}></div>
                <span className="text-sm" style={{ color: modalColors.textSecondaryFaded }}>OR</span>
                <div className="h-px flex-1" style={{ backgroundColor: modalColors.borderColorSubtle }}></div>
              </div>

              {loginError && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.3 }}
                  className="p-3 rounded-md text-sm text-center"
                  style={{
                    backgroundColor: modalColors.errorBackground,
                    color: modalColors.errorColor,
                    border: `1px solid ${modalColors.errorBorder}`,
                  }}
                >
                  {loginError}
                </motion.div>
              )}

              {/* UsernameLoginForm: Apply direct dark theme styles */}
              <UsernameLoginForm
                error={loginError}
                onLogin={handleCredentialsLogin}
                // Pass modalColors directly to UsernameLoginForm
                modalColors={modalColors} 
              />
            </motion.div>
          ) : (
            <motion.div
              key="registerForm"
              variants={modalContentVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="space-y-4"
            >
              {/* RegisterForm: Apply direct dark theme styles */}
              <RegisterForm 
                onRegister={() => setActiveTab("login")} 
                // Pass modalColors directly to RegisterForm
                modalColors={modalColors}
              />
            </motion.div>
          )}
        </AnimatePresence>

        <p className="text-sm text-center" style={{ color: modalColors.textSecondary }}>
          {activeTab === "login" ? "Not a member yet? " : "Already have an account? "}
          <motion.button
            onClick={() => setActiveTab(activeTab === "login" ? "register" : "login")}
            className={`underline transition-colors duration-300`}
            whileHover={{ color: modalColors.accentColorHover, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            style={{
              color: modalColors.accentColor,
            }}
          >
            {activeTab === "login" ? "Create an account" : "Sign in"}
          </motion.button>
        </p>
      </motion.div>
    </motion.div>
  );
}