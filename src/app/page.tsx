// src/app/page.tsx
// This file is your new main landing page for the root route (/).

"use client"; // This component is a Client Component

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useTheme } from '@/context/ThemeContext'; // Assuming ThemeContext is correctly setup
import { useSession } from 'next-auth/react'; // Re-adding useSession for button logic

const LandingPage = () => {
  const router = useRouter();
  const { getDynamicThemeClass } = useTheme(); // To get dynamic theme colors
  const { data: session, status } = useSession(); // Get session data and status

  const handleStartWritingClick = () => {
    if (status === "unauthenticated") {
      router.push('/login'); // Redirect to login page if not authenticated
    } else {
      router.push('/write'); // Redirect to write page if authenticated
    }
  };

  return (
    <div 
      className="relative flex flex-col items-center justify-center min-h-[calc(100vh-80px)] p-4 text-center overflow-hidden"
      style={{ 
        backgroundColor: getDynamicThemeClass('background-primary'), 
        color: getDynamicThemeClass('text-primary') 
      }}
    >
      {/* Background Gradient Animation - Now uses Tailwind class */}
      <div 
        className="absolute inset-0 z-0 opacity-40 animate-gradient-pulse"
        style={{
          background: `linear-gradient(45deg, ${getDynamicThemeClass('accent-color-faded')} 0%, ${getDynamicThemeClass('background-primary')} 50%, ${getDynamicThemeClass('accent-color-hover')} 100%)`,
          backgroundSize: '200% 200%'
        }}
      ></div>
      {/* Content */}
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative z-10 max-w-3xl mx-auto p-6 rounded-lg backdrop-filter backdrop-blur-sm bg-[var(--background-secondary)] bg-opacity-70 border border-[var(--border-color)]" // Added a subtle background to the content itself
      >
        <h1 className="text-4xl md:text-6xl font-extrabold mb-6 leading-tight"
            style={{ color: getDynamicThemeClass('accent-color') }}>
          Welcome to Talesy: Your Story, Your Voice
        </h1>
        <p className="text-lg md:text-xl mb-8 leading-relaxed"
           style={{ color: getDynamicThemeClass('text-secondary') }}>
          Unleash your creativity and share your unique tales with the world. 
          Talesy provides a seamless platform for writers to express themselves and connect with readers.
        </p>
        
        <motion.button
          onClick={handleStartWritingClick}
          disabled={status === "loading"} // Disable if session is loading
          className="px-8 py-4 text-lg md:text-xl font-medium rounded-full shadow-lg transition-all transform duration-300 disabled:opacity-70 disabled:cursor-not-allowed"
          style={{
            backgroundColor: getDynamicThemeClass('accent-color'),
            color: 'white',
            border: `2px solid ${getDynamicThemeClass('accent-color')}`,
            boxShadow: `0 4px 10px ${getDynamicThemeClass('shadow-color-subtle') || 'rgba(0,0,0,0.1)'}`
          }}
          onMouseEnter={(e) => {
            if (status !== "loading") { // Only apply hover if not loading
              e.currentTarget.style.backgroundColor = getDynamicThemeClass('active-bg');
              e.currentTarget.style.color = getDynamicThemeClass('text-primary');
              e.currentTarget.style.borderColor = getDynamicThemeClass('active-bg');
            }
          }}
          onMouseLeave={(e) => {
            if (status !== "loading") { // Only revert if not loading
              e.currentTarget.style.backgroundColor = getDynamicThemeClass('accent-color');
              e.currentTarget.style.color = 'white';
              e.currentTarget.style.borderColor = getDynamicThemeClass('accent-color');
            }
          }}
          whileHover={status !== "loading" ? { scale: 1.05, y: -2, boxShadow: `0 8px 20px ${getDynamicThemeClass('shadow-color-subtle') || 'rgba(0,0,0,0.2)'}` } : {}}
          whileTap={status !== "loading" ? { scale: 0.95 } : {}}
        >
          {status === "loading" ? 'Loading...' : (status === "authenticated" ? 'Start Writing Now' : 'Get Started')}
        </motion.button>
      </motion.div>
    </div>
  );
};

export default LandingPage;
