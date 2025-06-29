// app/(auth)/login/page.tsx
'use client';

import { useState, useRef, useCallback, useEffect } from "react"; // Removed useContext, createContext
import Particles from "react-tsparticles";
import { loadFull } from "tsparticles";
import { AiOutlineUser } from 'react-icons/ai';
import { motion, AnimatePresence } from 'framer-motion';
import ParallaxTilt from 'react-parallax-tilt';
import AuthModal from "@/components/AuthModal"; // Ensure this path is correct

export default function LoginPage() {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [initialTab, setInitialTab] = useState<"login" | "register">("login");

  // Fixed colors for the elegant login page, independent of global theme
  const BACKGROUND_GRADIENT_START = '#1A1A2E'; // Deep blue/purple
  const BACKGROUND_GRADIENT_END = '#0A0A1A';   // Even deeper blue/purple
  const CARD_GRADIENT_START = '#2C2C45';       // Slightly lighter card
  const CARD_GRADIENT_END = '#1A1A2E';         // Matches background start for blend
  const PARTICLE_COLOR = '#8A8ACC';           // Subtle purple-grey for particles
  const LINK_COLOR = '#5A5A7A';               // Darker purple-grey for particle links
  const GLARE_COLOR = '#ffffff';             // White for parallax glare
  const TEXT_PRIMARY = '#E0E0FF';             // Light bluish-white
  const TEXT_SECONDARY = '#A0A0C0';           // Muted bluish-grey
  const ACCENT_COLOR = '#6A4C9C';             // Talesy's signature purple
  const ACCENT_COLOR_HOVER = '#8A6CCF';       // Lighter purple for hover
  const SHADOW_COLOR_STRONG = 'rgba(0, 0, 0, 0.6)'; // Strong dark shadow
  const BORDER_COLOR_SUBTLE = 'rgba(255, 255, 255, 0.1)'; // Subtle white border

  useEffect(() => {
    document.title = "Login or Register | Talesy - Share Your Stories with the World";
    // Set a fixed background color for body if needed, otherwise let the div handle it
    document.body.style.backgroundColor = BACKGROUND_GRADIENT_END;

    return () => {
      document.title = "Talesy - Share Your Stories";
      document.body.style.backgroundColor = ''; // Reset on unmount
    };
  }, []); // No theme dependency

  const particlesInit = useCallback(async (engine: any) => {
    await loadFull(engine);
  }, []);

  const openAuthModal = (tab: "login" | "register") => {
    setInitialTab(tab);
    setShowAuthModal(true);
  };

  const closeAuthModal = () => {
    setShowAuthModal(false);
  };

  // Animation variants for text
  const textVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } }
  };

  // Animation for the button
  const buttonVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.6, ease: "easeOut", delay: 0.8 } }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden"
         style={{
           background: `radial-gradient(circle at top left, ${BACKGROUND_GRADIENT_START} 0%, ${BACKGROUND_GRADIENT_END} 100%)`,
         }}>
      {/* Particles.js background (z-0) */}
      <Particles
        id="tsparticles"
        init={particlesInit}
        className="absolute inset-0 z-0"
        options={{
          fullScreen: { enable: false },
          background: { color: "transparent" },
          particles: {
            number: { value: 60, density: { enable: true, area: 800 } },
            color: { value: PARTICLE_COLOR }, // Fixed particle color
            shape: { type: "circle" },
            opacity: { value: 0.4, random: false, anim: { enable: false } },
            size: { value: 3, random: true, anim: { enable: false } },
            links: {
              enable: true,
              distance: 150,
              color: LINK_COLOR, // Fixed link color
              opacity: 0.2,
              width: 1,
            },
            move: {
              enable: true,
              speed: 0.5,
              direction: "none",
              random: true,
              straight: false,
              outModes: { default: "bounce" },
              attract: { enable: false, rotateX: 600, rotateY: 1200 },
            },
          },
          interactivity: {
            events: {
              onHover: { enable: true, mode: "repulse" },
              onClick: { enable: true, mode: "push" },
              resize: true,
            },
            modes: {
              grab: { distance: 400, links: { opacity: 1 } },
              bubble: { distance: 400, size: 40, duration: 2, opacity: 8, speed: 3 },
              repulse: { distance: 200, duration: 0.4 },
              push: { quantity: 4 },
              remove: { quantity: 2 },
            },
          },
          retina_detect: true,
        }}
      />

      {/* Elegant Background Text Elements (z-10) */}
      <div className="absolute inset-0 z-10 pointer-events-none">
        <motion.span
          className="absolute top-[15%] left-[5%] text-[10vw] md:text-[8vw] lg:text-[6vw] font-extrabold select-none transform -rotate-12"
          initial={{ opacity: 0, x: -100 }}
          animate={{ opacity: 0.03, x: 0, transition: { delay: 0.2, duration: 1, ease: "easeOut" } }}
          style={{ color: TEXT_PRIMARY }}
        >
          Talesy
        </motion.span>
        <motion.span
          className="absolute bottom-[20%] right-[8%] text-[8vw] md:text-[6vw] lg:text-[4vw] font-extrabold select-none transform rotate-6"
          initial={{ opacity: 0, x: 100 }}
          animate={{ opacity: 0.02, x: 0, transition: { delay: 0.4, duration: 1, ease: "easeOut" } }}
          style={{ color: TEXT_SECONDARY }}
        >
          Stories
        </motion.span>
        <motion.span
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[12vw] md:text-[10vw] lg:text-[8vw] font-extrabold select-none rotate-3"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 0.04, scale: 1, transition: { delay: 0.6, duration: 1, ease: "easeOut" } }}
          style={{ color: ACCENT_COLOR }}
        >
          Inspire
        </motion.span>
        <motion.span
          className="absolute top-[60%] left-[10%] text-[7vw] md:text-[5vw] lg:text-[3.5vw] font-extrabold select-none transform -rotate-6"
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 0.03, y: 0, transition: { delay: 0.8, duration: 1, ease: "easeOut" } }}
          style={{ color: TEXT_PRIMARY }}
        >
          Create
        </motion.span>
        <motion.span
          className="absolute bottom-[5%] left-[25%] text-[9vw] md:text-[7vw] lg:text-[5vw] font-extrabold select-none transform rotate-9"
          initial={{ opacity: 0, x: -100 }}
          animate={{ opacity: 0.02, x: 0, transition: { delay: 1.0, duration: 1, ease: "easeOut" } }}
          style={{ color: ACCENT_COLOR }}
        >
          Share
        </motion.span>
      </div>


      {/* Parallax Tilt effect for the main content (z-20) */}
      <ParallaxTilt
        perspective={1000}
        glareEnable={true}
        glareMaxOpacity={0.4}
        glareColor={GLARE_COLOR} // Fixed glare color
        glarePosition="all"
        tiltMaxAngleX={8}
        tiltMaxAngleY={8}
        scale={1.02}
        transitionEasing="cubic-bezier(.03,.98,.52,.99)"
        className="z-20"
      >
        <motion.div
          className="relative text-center space-y-8 p-6 sm:p-10 rounded-3xl border animate-fade-in max-w-md sm:max-w-xl mx-auto"
          initial={{ opacity: 0, y: -50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          style={{
            background: `linear-gradient(145deg, ${CARD_GRADIENT_START} 0%, ${CARD_GRADIENT_END} 100%)`,
            backdropFilter: 'blur(15px)',
            WebkitBackdropFilter: 'blur(15px)',
            borderColor: `${BORDER_COLOR_SUBTLE}`, // Use fixed transparent border
            boxShadow: `0 20px 40px ${SHADOW_COLOR_STRONG}`,
          }}
        >
          <motion.h1
            className="text-5xl sm:text-6xl font-extrabold leading-tight drop-shadow-2xl"
            initial="hidden"
            animate="visible"
            variants={textVariants}
            style={{ color: TEXT_PRIMARY }}
          >
            Welcome to <span className="text-transparent bg-clip-text"
            style={{ backgroundImage: `linear-gradient(to right, ${ACCENT_COLOR}, ${ACCENT_COLOR_HOVER})` }}>Talesy</span>
          </motion.h1>
          <motion.p
            className="text-xl sm:text-2xl font-light max-w-xl mx-auto drop-shadow-lg"
            initial="hidden"
            animate="visible"
            variants={textVariants}
            style={{ color: TEXT_SECONDARY }}
          >
            Where every story finds its voice. <br/>Share your tales, inspire others, and connect.
          </motion.p>

          <motion.button
            onClick={() => openAuthModal("login")}
            className="relative px-8 py-4 font-bold text-lg rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform active:scale-95 overflow-hidden group focus:outline-none focus:ring-4 focus:ring-opacity-50"
            initial="hidden"
            animate="visible"
            variants={buttonVariants}
            whileHover={{ scale: 1.05, boxShadow: `0 10px 20px ${SHADOW_COLOR_STRONG}` }}
            whileTap={{ scale: 0.95 }}
            style={{
              background: `linear-gradient(to right, ${ACCENT_COLOR}, ${ACCENT_COLOR_HOVER})`,
              color: '#FFFFFF', // Fixed text color for the button
              '--tw-ring-color': ACCENT_COLOR,
            } as React.CSSProperties}
          >
            <span className="relative z-10 flex items-center justify-center">
              <AiOutlineUser className="mr-2 text-xl" /> Start Your Story
            </span>
            {/* Shimmer effect on button hover */}
            <span className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity duration-300"></span>
            <span className="absolute -inset-full bg-[color:var(--active-text)]/20 transform -rotate-45 -translate-x-full group-hover:translate-x-full z-0 transition-transform duration-700 ease-out"></span>
          </motion.button>
        </motion.div>
      </ParallaxTilt>

      {/* Authentication Modal - This will still be themed via ThemeContext */}
      <AnimatePresence>
        {showAuthModal && (
          <AuthModal
            onClose={closeAuthModal}
            initialTab={initialTab}
          />
        )}
      </AnimatePresence>
    </div>
  );
}