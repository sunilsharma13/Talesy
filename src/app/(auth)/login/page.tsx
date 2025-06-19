// app/login/page.tsx
'use client';

import { useState, useRef, useCallback, useEffect } from "react";
import Particles from "react-tsparticles";
import { loadFull } from "tsparticles";
import AuthModal from "@/components/AuthModal";
import { AiOutlineUser } from 'react-icons/ai';
import { motion } from 'framer-motion';
import ParallaxTilt from 'react-parallax-tilt';

export default function LoginPage() {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [initialTab, setInitialTab] = useState<"login" | "register">("login");

  useEffect(() => {
    document.title = "Login or Register | Talesy - Share Your Stories with the World";
    return () => {
      document.title = "Talesy - Share Your Stories";
    };
  }, []);

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

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden bg-gradient-to-br from-[#FF9933]/70 via-white/70 to-[#138808]/70">
      {/* Particles.js background (z-0) */}
      <Particles
        id="tsparticles"
        init={particlesInit}
        className="absolute inset-0 z-0"
        options={{
          fullScreen: false,
          background: { color: "transparent" },
          particles: {
            number: { value: 60 },
            color: { value: "#000" },
            size: { value: 2 },
            move: { enable: true, speed: 0.3 },
            opacity: { value: 0.4 },
            links: { enable: true, distance: 100, color: "#000", opacity: 0.1 },
          },
        }}
      />

      {/* NEW: Subtle background text elements (z-10) */}
      <div className="absolute inset-0 z-10 pointer-events-none">
        <span className="absolute top-1/4 left-1/4 text-[10vw] font-extrabold text-white/5 opacity-50 select-none transform -rotate-12">Talesy</span>
        <span className="absolute bottom-1/3 right-1/4 text-[8vw] font-extrabold text-white/5 opacity-50 select-none transform rotate-6">Stories</span>
        <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[12vw] font-extrabold text-white/3 opacity-30 select-none rotate-3">Inspire</span>
        <span className="absolute top-2/3 left-1/10 text-[7vw] font-extrabold text-white/4 opacity-40 select-none transform -rotate-6">Create</span>
        <span className="absolute bottom-1/5 left-1/5 text-[9vw] font-extrabold text-white/3 opacity-30 select-none transform rotate-9">Share</span>
      </div>


      {/* Parallax Tilt effect for the main content (z-20) */}
      <ParallaxTilt
        perspective={500}
        glareEnable={true}
        glareMaxOpacity={0.2}
        glarePosition="bottom"
        tiltMaxAngleX={10}
        tiltMaxAngleY={10}
        className="z-20" // Ensure tilt is above background text
      >
        <div className="relative text-center space-y-8 p-6 sm:p-10 bg-black/30 backdrop-blur-lg rounded-2xl shadow-3xl border border-white/20 animate-fade-in">
          <h1 className="text-5xl sm:text-6xl font-extrabold text-white leading-tight drop-shadow-2xl animate-text-pop">
            Welcome to <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-blue-500">Talesy</span>
          </h1>
          <p className="text-xl sm:text-2xl text-gray-200 font-light max-w-xl mx-auto drop-shadow-lg animate-fade-in-up">
            Where every story finds its voice. <br/>Share your tales, inspire others, and connect.
          </p>

          <motion.button
            onClick={() => openAuthModal("login")}
            className="relative px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-700 text-white font-bold text-lg rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 active:scale-95 overflow-hidden group focus:outline-none focus:ring-4 focus:ring-indigo-500 focus:ring-opacity-50 animate-bounce-once"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <span className="relative z-10 flex items-center justify-center">
              <AiOutlineUser className="mr-2 text-xl" /> Start Your Story
            </span>
            <span className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity duration-300"></span>
            <span className="absolute -inset-full bg-white/20 transform -rotate-45 -translate-x-full group-hover:translate-x-full z-0 transition-transform duration-700 ease-out"></span>
          </motion.button>
        </div>
      </ParallaxTilt>

      {/* Authentication Modal */}
      {showAuthModal && (
        <AuthModal
          onClose={closeAuthModal}
          initialTab={initialTab}
        />
      )}
    </div>
  );
}