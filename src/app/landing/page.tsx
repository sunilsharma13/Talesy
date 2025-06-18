// Enhanced app/landing/page.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";

// This function generates consistent pseudo-random values based on a seed
const seededRandom = (seed: number) => {
  return () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
};

export default function LandingPage() {
  const router = useRouter();
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [email, setEmail] = useState("");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [isMounted, setIsMounted] = useState(false);
  const [activeCardIndex, setActiveCardIndex] = useState(0);
  const teamSectionRef = useRef(null);
  const carouselRef = useRef(null);
  
  // Client-side only code
  useEffect(() => {
    setIsMounted(true);
    
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light' || savedTheme === 'dark') {
      setTheme(savedTheme);
    }
    
    // Set up scroll event listener
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };
    
    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  // Effect to handle team carousel scrolling
  useEffect(() => {
    if (!isMounted) return;
    
    const handleCarouselScroll = () => {
      if (!carouselRef.current) return;
      
      const section = carouselRef.current as HTMLElement;
      const sectionTop = section.getBoundingClientRect().top;
      const sectionHeight = section.offsetHeight;
      const viewportHeight = window.innerHeight;
      
      // Calculate the scroll position within the section
      const scrollPercentage = (viewportHeight - sectionTop) / (sectionHeight + viewportHeight);
      
      if (scrollPercentage < 0) return;
      if (scrollPercentage > 1) return;
      
      // Determine which card should be active based on scroll percentage
      // We divide the scroll range by the number of cards
      const numCards = teamMembers.length - 1; // Exclude CEO
      const newIndex = Math.min(
        Math.max(Math.floor(scrollPercentage * (numCards + 0.99)), 0),
        numCards - 1
      );
      
      if (newIndex !== activeCardIndex) {
        setActiveCardIndex(newIndex);
      }
    };
    
    window.addEventListener("scroll", handleCarouselScroll);
    return () => {
      window.removeEventListener("scroll", handleCarouselScroll);
    };
  }, [isMounted, activeCardIndex]);

  const handleSubscribe = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (email) {
      setIsSubscribed(true);
      setTimeout(() => setIsSubscribed(false), 3000);
      setEmail("");
    }
  };

  // Generate deterministic particles
  const generateParticles = () => {
    const particles = [];
    for (let i = 0; i < 40; i++) {
      const random = seededRandom(i + 1);
      particles.push({
        key: i,
        width: 20 + Math.floor(random() * 100),
        height: 20 + Math.floor(random() * 100),
        left: `${Math.floor(random() * 100)}%`,
        top: `${Math.floor(random() * 100)}%`,
        duration: 10 + Math.floor(random() * 10),
        yOffset: -50 - Math.floor(random() * 100),
      });
    }
    return particles;
  };

  // Generate shapes for CTA section
  const generateShapes = () => {
    const shapes = [];
    for (let i = 0; i < 8; i++) {
      const random = seededRandom(i + 100);
      shapes.push({
        key: i,
        width: 50 + Math.floor(random() * 300),
        height: 50 + Math.floor(random() * 300),
        left: `${Math.floor(random() * 100)}%`,
        top: `${Math.floor(random() * 100)}%`,
        duration: 15 + Math.floor(random() * 10),
        xOffset: Math.floor(random() * 100) - 50,
        yOffset: Math.floor(random() * 100) - 50,
      });
    }
    return shapes;
  };

  // Generate animated lines for background
  const generateLines = () => {
    const lines = [];
    for (let i = 0; i < 15; i++) {
      const random = seededRandom(i + 200);
      lines.push({
        key: i,
        height: 1 + Math.floor(random() * 3), 
        width: 100 + Math.floor(random() * 300),
        left: `${Math.floor(random() * 100)}%`,
        top: `${Math.floor(random() * 100)}%`,
        duration: 20 + Math.floor(random() * 20),
        delay: Math.floor(random() * 5),
        opacity: 0.1 + random() * 0.3,
        rotation: Math.floor(random() * 180),
      });
    }
    return lines;
  };

  // Generate animated dots
  const generateDots = () => {
    const dots = [];
    for (let i = 0; i < 100; i++) {
      const random = seededRandom(i + 300);
      dots.push({
        key: i,
        size: 1 + Math.floor(random() * 3),
        left: `${Math.floor(random() * 100)}%`,
        top: `${Math.floor(random() * 100)}%`,
        duration: 3 + Math.floor(random() * 7),
        delay: Math.floor(random() * 5),
        opacity: 0.1 + random() * 0.6,
      });
    }
    return dots;
  };

  // Only generate these once to ensure consistency
  const particles = generateParticles();
  const bgShapes = generateShapes();
  const bgLines = generateLines();
  const bgDots = generateDots();

  // Team members data
  const teamMembers = [
    {
      name: "Sunil Sharma",
      role: "Founder & CEO",
      quote: "Our vision at Talesy is to empower every storyteller to share their unique voice with the world. We're building a platform where creativity thrives and writers connect with their perfect audience.",
      initials: "SS",
      verified: true
    },
    {
      name: "Rishabh Soni",
      role: "Chief Operating Officer",
      quote: "At Talesy, we focus on building powerful tools that make publishing effortless. By removing technical barriers, we enable writers to focus on what they do best – creating compelling stories.",
      initials: "RS"
    },
    {
      name: "Girraj Sharma",
      role: "Chief Content Officer",
      quote: "Stories have the power to change how we see the world. Through Talesy, we help writers reach audiences they never thought possible and create meaningful connections through storytelling.",
      initials: "GS"
    },
    {
      name: "Hemant Nirmal",
      role: "Chief Technology Officer",
      quote: "We're leveraging cutting-edge technology to create an innovative platform that understands both writers and readers. Our algorithms help connect the right stories with the right audiences.",
      initials: "HN"
    },
    {
      name: "Lokesh Sharma",
      role: "Head of Marketing",
      quote: "Talesy isn't just another publishing platform – it's a community of passionate storytellers. Our marketing strategies focus on showcasing unique voices and helping them find their audience.",
      initials: "LS"
    },
    {
      name: "Deevesh Sharma",
      role: "Creative Director",
      quote: "Great writing deserves beautiful presentation. At Talesy, we've designed an experience that enhances storytelling through thoughtful typography, layout, and visual elements.",
      initials: "DS"
    }
  ];

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Enhanced interactive background with multiple elements */}
      {isMounted && (
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-indigo-900/20 via-purple-900/10 to-transparent"></div>
          
          {/* Interactive grid lines */}
          {bgLines.map((line) => (
            <motion.div
              key={line.key}
              className="absolute bg-indigo-500/10"
              style={{
                height: line.height,
                width: line.width,
                left: line.left,
                top: line.top,
                opacity: line.opacity,
                rotate: line.rotation,
                transformOrigin: "center",
              }}
              animate={{
                width: [line.width, line.width * 1.5, line.width],
                opacity: [line.opacity, line.opacity * 1.5, line.opacity],
              }}
              transition={{
                duration: line.duration,
                delay: line.delay,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          ))}
          
          {/* Animated glowing dots */}
          {bgDots.map((dot) => (
            <motion.div
              key={dot.key}
              className="absolute rounded-full bg-indigo-400/30"
              style={{
                height: dot.size,
                width: dot.size,
                left: dot.left,
                top: dot.top,
                opacity: dot.opacity,
              }}
              animate={{
                opacity: [dot.opacity, dot.opacity * 2, dot.opacity],
                scale: [1, 1.5, 1],
              }}
              transition={{
                duration: dot.duration,
                delay: dot.delay,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          ))}
          
          {/* Floating particles */}
          {particles.map((particle) => (
            <motion.div
              key={particle.key}
              className="absolute rounded-full bg-indigo-500/20"
              style={{
                width: particle.width,
                height: particle.height,
                left: particle.left,
                top: particle.top,
              }}
              animate={{
                y: [0, particle.yOffset],
                opacity: [0, 0.7, 0],
              }}
              transition={{
                duration: particle.duration,
                repeat: Infinity,
                ease: "linear",
              }}
            />
          ))}
        </div>
      )}
      
      {/* Hero section */}
      <div className="relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 relative z-10">
          <div className="pt-16 pb-24 text-center">
            {/* Logo with animation */}
            <motion.div 
              className="flex justify-center mb-8"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.6 }}
            >
              <img 
                src={theme === 'dark' ? "/logo.png" : "/logo-dark.png"}
                alt="Talesy" 
                className="h-20 w-auto"
              />
            </motion.div>
            
            {/* Main title with typing animation */}
            <motion.h1 
              className={`text-4xl md:text-6xl font-extrabold tracking-tight mb-6 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              Welcome to <span className="text-indigo-500">Talesy</span>
            </motion.h1>
            
            {/* Subtitle */}
            <motion.p 
              className={`text-xl md:text-2xl max-w-3xl mx-auto ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              Your stories matter. Create, share, and connect with readers around the world.
            </motion.p>
            
            {/* CTA buttons */}
            <motion.div 
              className="mt-10 flex flex-col sm:flex-row justify-center gap-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
            >
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link 
                  href="/explore" 
                  className="px-8 py-3 text-base font-medium rounded-md shadow bg-indigo-600 text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 inline-block"
                >
                  Explore Stories
                </Link>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link 
                  href="/write/new" 
                  className={`px-8 py-3 text-base font-medium rounded-md shadow ${
                    theme === 'dark' 
                      ? 'bg-white text-gray-900 hover:bg-gray-100' 
                      : 'bg-gray-800 text-white hover:bg-gray-700'
                  } inline-block`}
                >
                  Start Writing
                </Link>
              </motion.div>
            </motion.div>
            
            {/* Floating Social Media Links with hover effects */}
            <motion.div 
              className="mt-12"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8, duration: 1 }}
            >
              <div className="flex justify-center space-x-6">
                {[
                  { href: "https://instagram.com", icon: "M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" },
                  { href: "https://twitter.com", icon: "M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085a4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" },
                  { href: "https://facebook.com", icon: "M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" },
                  { href: "https://reddit.com", icon: "M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z" },
                  { href: "https://linkedin.com", icon: "M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" },
                ].map((social, index) => (
                  <motion.a 
                    key={index}
                    href={social.href} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className={`h-10 w-10 rounded-full flex items-center justify-center ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-200'} hover:text-white hover:bg-indigo-600 transition-all duration-300`}
                    whileHover={{ scale: 1.2, rotate: 5 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d={social.icon} />
                    </svg>
                  </motion.a>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
      
      {/* Features section with scroll animations */}
      <div className={`py-16 ${theme === 'dark' ? 'bg-gray-800/80' : 'bg-white/90'} backdrop-blur-sm relative z-10`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 className={`text-3xl font-extrabold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              Why Choose Talesy?
            </h2>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z",
                title: "Easy Writing",
                description: "Our intuitive editor makes it simple to create beautiful stories with rich formatting and images."
              },
              {
                icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z",
                title: "Connect with Readers",
                description: "Build your audience and connect with readers who appreciate your unique voice."
              },
              {
                icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
                title: "Publish Instantly",
                description: "Share your stories with the world in seconds, no complicated publishing process."
              }
            ].map((feature, index) => (
              <motion.div 
                key={index}
                className={`p-6 rounded-lg ${theme === 'dark' ? 'bg-gray-700/90' : 'bg-gray-50/90'} backdrop-blur-sm`}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.2 }}
                whileHover={{ 
                  scale: 1.05,
                  boxShadow: theme === 'dark' 
                    ? "0 10px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
                    : "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
                }}
              >
                <div className="flex justify-center mb-4">
                  <div className="bg-indigo-500 rounded-full p-3">
                    <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={feature.icon} />
                    </svg>
                  </div>
                </div>
                <h3 className={`text-xl font-bold mb-2 text-center ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  {feature.title}
                </h3>
                <p className={`text-center ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
      
      {/* New Enhanced Team Section with fixed CEO and carousel cards */}
      <div ref={teamSectionRef} className="py-20 relative z-10">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
        <motion.div
            className="text-center mb-10"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
        >
            <h2 className={`text-3xl font-extrabold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                Meet Our Team
            </h2>
            <p className={`mt-4 max-w-2xl mx-auto text-xl ${theme === 'dark' ? 'text-gray-300' : 'text-gray-500'}`}>
                The visionaries behind Talesy
            </p>
        </motion.div>

        {/* CEO Card - Highlighted */}
        <div className="mb-8">
            <motion.div
                className={`rounded-2xl overflow-hidden shadow-xl ${theme === 'dark' ? 'bg-gray-800 border border-indigo-700' : 'bg-white border border-indigo-500'}`}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                style={{ backgroundColor: theme === 'dark' ? '#1E293B' : '#FFFFFF', maxWidth: '600px', margin: '0 auto' }} //Control max width and center it
            >
                <div className="flex p-6 items-center space-x-6" style={{ minHeight: '180px' }}> {/* Boost the min height */}
                    <div className="flex-shrink-0">
                        <div className="w-20 h-20 rounded-full overflow-hidden relative">
                            <div className="absolute inset-0 bg-indigo-500 text-white flex items-center justify-center text-2xl font-bold">
                                {teamMembers[0].initials}
                            </div>
                        </div>
                    </div>
                    <div>
                        <h3 className={`text-xl font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                            {teamMembers[0].name}
                        </h3>
                        <div className="flex items-center">
                            <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                                {teamMembers[0].role}
                            </p>
                            <motion.span
                                className="ml-2" //Reduced margin
                                animate={{ scale: [0.8, 1.2, 1] }}
                                transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
                            >
                                <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20"> {/*Reduced size*/}
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                            </motion.span>
                        </div>
                        <p className={`text-md italic mt-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>"{teamMembers[0].quote}"</p>
                    </div>
                </div>
            </motion.div>
        </div>

        {/* Regular Team Members - Grid Below CEO */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {teamMembers.slice(1).map((member, index) => (
                <motion.div
                    key={index + 1}
                    className={`rounded-2xl overflow-hidden shadow-xl ${theme === 'dark' ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:bg-gray-100'} transition-colors duration-300`}
                    initial={{ opacity: 0, y: 50 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: (index + 1) * 0.15 }}
                >
                    <div className="p-4 flex flex-col h-full">
                        <div className="flex items-center mb-3">
                            <div className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold uppercase mr-3">
                                {member.initials}
                            </div>
                            <div>
                                <h3 className={`text-base font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{member.name}</h3>
                                <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>{member.role}</p>
                            </div>
                        </div>
                        <p className={`text-sm italic ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'} flex-grow`}>"{member.quote}"</p>
                    </div>
                </motion.div>
            ))}
        </div>
    </div>
</div>  
      {/* CTA section with enhanced gradient and animation */}
      <div className={`py-16 relative overflow-hidden z-10`}>
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-800 to-purple-900"></div>
        {/* Animated background shapes - only on client side */}
        {isMounted && bgShapes.map((shape) => (
          <motion.div
            key={shape.key}
            className="absolute rounded-full bg-white/10"
            style={{
              width: shape.width,
              height: shape.height,
              borderRadius: "50%",
              left: shape.left,
              top: shape.top,
            }}
            animate={{
              x: [0, shape.xOffset],
              y: [0, shape.yOffset],
              opacity: [0.1, 0.2, 0.1],
            }}
            transition={{
              duration: shape.duration,
              repeat: Infinity,
              repeatType: "reverse",
              ease: "easeInOut",
            }}
          />
        ))}
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-3xl font-extrabold text-white mb-4">
              Ready to Share Your Story?
            </h2>
            <p className="text-xl text-indigo-100 mb-8">
              Join thousands of writers who have already found their audience.
            </p>
            <motion.div 
              whileHover={{ scale: 1.05 }} 
              whileTap={{ scale: 0.95 }}
            >
              <Link 
                href="/feed" 
                className="px-8 py-4 text-base font-medium rounded-md shadow-lg bg-white text-indigo-700 hover:bg-gray-100 transition-all inline-block"
              >
                Get Started Now
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </div>
      
      {/* Newsletter section with improved contrast and styling */}
      <div className={`py-12 ${theme === 'dark' ? 'bg-gray-800/90' : 'bg-gray-100/90'} backdrop-blur-sm relative z-10`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="lg:flex lg:items-center lg:justify-between p-6 rounded-lg shadow-sm bg-gradient-to-r from-indigo-900 to-indigo-800"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="lg:w-1/2">
              <h3 className="text-2xl font-bold text-white">
                Stay updated with Talesy news
              </h3>
              <p className="mt-2 text-indigo-100">
                Get writing tips, feature updates, and inspiration delivered to your inbox.
              </p>
            </div>
            <div className="mt-6 lg:mt-0 lg:w-1/2">
              {isSubscribed ? (
                <motion.div 
                  className="text-green-400 text-center p-3 rounded-md bg-green-900/20"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  Thank you for subscribing!
                </motion.div>
              ) : (
                <form className="sm:flex" onSubmit={handleSubscribe}>
                  <input
                    type="email"
                    required
                    placeholder="Enter your email"
                    className="w-full px-4 py-3 rounded-md border-2 border-indigo-500/50 bg-indigo-900/50 text-white placeholder-indigo-300 focus:ring-indigo-500 focus:border-indigo-500"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  <motion.button
                    type="submit"
                    className="mt-3 sm:mt-0 sm:ml-3 w-full sm:w-auto flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-500 hover:bg-indigo-400"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    Subscribe
                  </motion.button>
                </form>
              )}
            </div>
          </motion.div>
        </div>
      </div>
      
      {/* Footer with improved social media links and Reddit */}
      <footer className={`py-12 ${theme === 'dark' ? 'bg-gray-900/95' : 'bg-gray-100/95'} backdrop-blur-sm relative z-10`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1">
              <img 
                src={theme === 'dark' ? "/logo.png" : "/logo-dark.png"}
                alt="Talesy" 
                className="h-10 w-auto mb-4"
              />
              <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                Share your stories with the world.
              </p>
              <div className="mt-4 flex space-x-4">
                {[
                  { href: "https://twitter.com", icon: "M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085a4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" },
                  { href: "https://facebook.com", icon: "M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" },
                  { href: "https://instagram.com", icon: "M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" },
                  { href: "https://linkedin.com", icon: "M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" },
                  { href: "https://reddit.com", icon: "M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z" },
                ].map((social, index) => (
                  <motion.a 
                    key={index}
                    href={social.href} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-indigo-500"
                    whileHover={{ scale: 1.2, rotate: 5 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d={social.icon} />
                    </svg>
                  </motion.a>
                ))}
              </div>
            </div>
            
            <div className="col-span-1">
              <h3 className={`text-sm font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'} uppercase tracking-wider`}>
                Navigation
              </h3>
              <ul className="mt-4 space-y-2">
                <li><Link href="/homepage" className={`text-sm ${theme === 'dark' ? 'text-gray-300 hover:text-white' : 'text-gray-500 hover:text-gray-900'}`}>Home</Link></li>
                <li><Link href="/feed" className={`text-sm ${theme === 'dark' ? 'text-gray-300 hover:text-white' : 'text-gray-500 hover:text-gray-900'}`}>Feed</Link></li>
                <li><Link href="/explore" className={`text-sm ${theme === 'dark' ? 'text-gray-300 hover:text-white' : 'text-gray-500 hover:text-gray-900'}`}>Explore</Link></li>
                <li><Link href="/dashboard" className={`text-sm ${theme === 'dark' ? 'text-gray-300 hover:text-white' : 'text-gray-500 hover:text-gray-900'}`}>Dashboard</Link></li>
              </ul>
            </div>
            
            <div className="col-span-1">
              <h3 className={`text-sm font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'} uppercase tracking-wider`}>
                Resources
              </h3>
              <ul className="mt-4 space-y-2">
                <li><a href="#" className={`text-sm ${theme === 'dark' ? 'text-gray-300 hover:text-white' : 'text-gray-500 hover:text-gray-900'}`}>Writing Tips</a></li>
                <li><a href="#" className={`text-sm ${theme === 'dark' ? 'text-gray-300 hover:text-white' : 'text-gray-500 hover:text-gray-900'}`}>Style Guide</a></li>
                <li><a href="#" className={`text-sm ${theme === 'dark' ? 'text-gray-300 hover:text-white' : 'text-gray-500 hover:text-gray-900'}`}>FAQs</a></li>
                <li><a href="#" className={`text-sm ${theme === 'dark' ? 'text-gray-300 hover:text-white' : 'text-gray-500 hover:text-gray-900'}`}>Support</a></li>
              </ul>
            </div>
            
            <div className="col-span-1">
              <h3 className={`text-sm font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'} uppercase tracking-wider`}>
                Legal
              </h3>
              <ul className="mt-4 space-y-2">
                <li><a href="#" className={`text-sm ${theme === 'dark' ? 'text-gray-300 hover:text-white' : 'text-gray-500 hover:text-gray-900'}`}>Privacy Policy</a></li>
                <li><a href="#" className={`text-sm ${theme === 'dark' ? 'text-gray-300 hover:text-white' : 'text-gray-500 hover:text-gray-900'}`}>Terms of Service</a></li>
                <li><a href="#" className={`text-sm ${theme === 'dark' ? 'text-gray-300 hover:text-white' : 'text-gray-500 hover:text-gray-900'}`}>Cookie Policy</a></li>
              </ul>
            </div>
          </div>
          
          <div className="mt-8 pt-8 border-t border-gray-700">
            <p className={`text-sm text-center ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
              © 2025 Talesy. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
      
      {/* Floating scroll-to-top button */}
      {isMounted && (
        <motion.button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className={`fixed bottom-6 right-6 p-3 rounded-full ${theme === 'dark' ? 'bg-indigo-600' : 'bg-indigo-500'} text-white shadow-lg z-50`}
          initial={{ opacity: 0 }}
          animate={{ 
            opacity: scrollY > 300 ? 1 : 0,
            scale: scrollY > 300 ? 1 : 0.8
          }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18"></path>
          </svg>
        </motion.button>
      )}
    </div>
  );
}