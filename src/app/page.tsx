// src/app/page.tsx
// This is your final combined landing page for the root route (/).

"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import { FaInstagram, FaTwitter, FaFacebookF, FaRedditAlien, FaLinkedinIn, FaCheckCircle, FaFeatherAlt, FaUsers, FaShareAlt, FaArrowUp, FaBookmark, FaHeart } from 'react-icons/fa';
import { FaChevronDown } from 'react-icons/fa6';
import { useTheme } from '@/context/ThemeContext'; // Assuming ThemeContext is correctly setup
import { useSession } from 'next-auth/react'; // For session management

// Removed: User interface (not strictly needed here with direct session usage)
// Removed: AuthContextType interface
// Removed: AuthContext
// Removed: useAuth hook
// Removed: AuthProvider component

// Mock data for stories, testimonials, and FAQs
const mockStories = [
  {
    id: 's1',
    title: "The Whispering Willows",
    author: "Elara Vance",
    excerpt: "Deep within the ancient forest, whispers carried tales of magic and forgotten realms, beckoning a young adventurer.",
    imageUrl: "/read-1.png",
    likes: 2145,
    reads: "21.4k",
    readTime: "18 min"
  },
  {
    id: 's2',
    title: "Echoes of a Fading City",
    author: "Kaelen Rivers",
    excerpt: "In a city slowly reclaiming by nature, a detective uncovers a conspiracy that could bring about its final collapse.",
    imageUrl: "/read-2.png",
    likes: 1890,
    reads: "18.9k",
    readTime: "14 min"
  },
  {
    id: 's3',
    title: "The Alchemist's Secret Garden",
    author: "Seraphina Moon",
    excerpt: "A reclusive alchemist's garden holds the key to eternal youth, but its secrets come with a perilous price.",
    imageUrl: "/read-3.png",
    likes: 1560,
    reads: "15.6k",
    readTime: "22 min"
  },
];

const mockTestimonials = [
  {
    id: 1,
    quote: "Talesy's innovative tech stack makes writing and publishing unbelievably smooth. It's truly a platform built for creators.",
    author: "Lokesh Sharma",
    role: "Head of Marketing (User Feedback)"
  },
  {
    id: 2,
    quote: "The visual design and user experience on Talesy are top-notch. My stories have never looked better or felt more at home!",
    author: "Deevesh Sharma",
    role: "Creative Director (User Feedback)"
  },
  {
    id: 3,
    quote: "Talesy helped me connect with readers I never knew existed. Their marketing approach for writers is a game-changer.",
    author: "Hemant Nirmal",
    role: "Chief Technology Officer (User Feedback)"
  },
  {
    id: 4,
    quote: "As a new writer, Talesy provided the perfect platform to share my work and receive valuable feedback from a supportive community.",
    author: "Bhavin Sharma",
    role: "Aspiring Author"
  },
  {
    id: 5,
    quote: "The ease of use and beautiful interface of Talesy made publishing my first novel a dream come true. Highly recommended!",
    author: "Deepak Sharma",
    role: "Indie Author"
  }
];

const mockFAQs = [
  {
    id: 1,
    question: "How do I start writing on Talesy?",
    answer: "Simply click on the 'Login to Start Writing' button. Our intuitive editor will guide you through the process of creating your story after you log in or sign up."
  },
  {
    id: 2,
    question: "Is Talesy free to use?",
    answer: "Yes, Talesy offers a robust free tier that allows you to write, publish, and read stories. We also have premium features for advanced users and monetization options."
  },
  {
    id: 3,
    question: "Can I monetize my stories on Talesy?",
    answer: "We are actively developing features to allow writers to monetize their work through various models, including subscriptions and one-time purchases. Stay tuned for updates!"
  },
  {
    id: 4,
    question: "How can I find new readers?",
    answer: "Talesy helps you connect with readers through our 'Explore' page, personalized recommendations, and community features. Share your stories on social media and engage with your audience to grow your readership."
  },
  {
    id: 5,
    question: "What kind of stories can I publish?",
    answer: "Talesy welcomes stories from all genres, including fiction, non-fiction, poetry, and more. We encourage creative expression while adhering to our content guidelines."
  }
];

// FAQItem component
const FAQItem: React.FC<{ question: string; answer: string; theme: 'light' | 'dark' | 'talesy-accent' }> = ({
  question,
  answer,
  theme
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const { getDynamicThemeClass } = useTheme(); // Use getDynamicThemeClass from context

  return (
    <motion.div
      className={`border-b pb-4 mb-4 cursor-pointer`}
      style={{
        borderColor: getDynamicThemeClass('border-color'),
      }}
      onClick={() => setIsOpen(!isOpen)}
      initial={false}
      transition={{ duration: 0.3 }}
      whileHover={{ scale: 1.01 }}
    >
      <div className="flex justify-between items-center">
        <h4 className={`text-lg font-semibold`} style={{ color: getDynamicThemeClass('text-primary') }}>
          {question}
        </h4>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.3 }}
        >
          <FaChevronDown style={{ color: getDynamicThemeClass('accent-color') }} />
        </motion.div>
      </div>
      <AnimatePresence>
        {isOpen && (
          <motion.p
            className={`mt-2`}
            style={{ color: getDynamicThemeClass('text-secondary') }}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            {answer}
          </motion.p>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// StoryCard component
const StoryCard: React.FC<{ story: typeof mockStories[0]; theme: 'light' | 'dark' | 'talesy-accent' }> = ({
  story,
  theme
}) => {
  const { getDynamicThemeClass } = useTheme(); // Use getDynamicThemeClass from context
  return (
    <motion.div
      className={`rounded-lg overflow-hidden shadow-md transition-all duration-300 cursor-pointer flex flex-col min-w-0`}
      style={{
        backgroundColor: getDynamicThemeClass('background-secondary')
      }}
      whileHover={{
        scale: 1.03,
        boxShadow: `0 15px 30px -5px ${getDynamicThemeClass('shadow-color')}`
      }}
    >
      <div className="w-full h-40 relative"> {/* Use relative parent for Image fill */}
        <Image src={story.imageUrl} alt={story.title} fill style={{ objectFit: "cover" }} sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" /> {/* Added fill and sizes */}
      </div>
      <div className="p-4 flex flex-col flex-grow">
        <h3 className={`text-xl font-bold mb-1`} style={{ color: getDynamicThemeClass('text-primary') }}>{story.title}</h3>
        <p className={`text-sm`} style={{ color: getDynamicThemeClass('accent-color') }}>{story.author}</p>
        <p className={`text-sm mt-2 line-clamp-2 flex-grow`} style={{ color: getDynamicThemeClass('text-secondary') }}>{story.excerpt}</p>
        <div className="flex justify-between items-center mt-4 text-sm pt-2 border-t" style={{ borderColor: getDynamicThemeClass('border-color') }}>
          <span className={`flex items-center`} style={{ color: getDynamicThemeClass('text-secondary') }}>
            <FaHeart className="mr-1 text-red-400" /> {story.likes}
          </span>
          <span style={{ color: getDynamicThemeClass('text-secondary') }}>
            {story.reads} reads
          </span>
          <span style={{ color: getDynamicThemeClass('text-secondary') }}>
            {story.readTime}
          </span>
        </div>
      </div>
    </motion.div>
  );
};

// Seeded random for consistent animations
const seededRandom = (seed: number) => {
  return () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
};

// Main wrapper for LandingPageContent (now directly exports LandingPageContent)
export default function LandingPage() { // Renamed from LandingPageWrapper to LandingPage
  const router = useRouter();
  const { data: session, status } = useSession(); // NextAuth से वास्तविक सेशन स्टेटस
  const { theme, getDynamicThemeClass } = useTheme(); // useTheme से theme और getDynamicThemeClass प्राप्त करें
  
  const [email, setEmail] = useState("");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [isMounted, setIsMounted] = useState(false);
  const [currentTestimonialIndex, setCurrentTestimonialIndex] = useState(0);
  const [isSliderPaused, setIsSliderPaused] = useState(false);
  const sliderIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // const getDynamicThemeClass = (prop: string) => `var(--${prop})`; // Moved to useTheme context

  const teamSectionRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: teamSectionRef,
    offset: ["start end", "end start"]
  });

  const ceoScale = useTransform(scrollYProgress, [0, 0.5, 1], [0.8, 1, 0.8]);
  const ceoOpacity = useTransform(scrollYProgress, [0, 0.5, 1], [0, 1, 0]);

  useEffect(() => {
    setIsMounted(true);

    // Theme initialization (ensure this is handled by your ThemeContext or global CSS)
    // Removed direct localStorage theme handling from here if ThemeContext already does it
    // If ThemeContext manages this, keep it there. Otherwise, ensure it's here.
    const storedTheme = localStorage.getItem('theme');
    if (storedTheme && ['light', 'dark', 'talesy-accent'].includes(storedTheme)) {
      // setTheme(storedTheme as "light" | "dark" | "talesy-accent"); // ThemeContext should handle this
      document.documentElement.setAttribute('data-theme', storedTheme);
    } else {
      // setTheme("dark"); // ThemeContext should handle this
      localStorage.setItem("theme", "dark");
      document.documentElement.setAttribute('data-theme', 'dark');
    }


    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener("scroll", handleScroll);

    const startSlider = () => {
      if (sliderIntervalRef.current) clearInterval(sliderIntervalRef.current);
      sliderIntervalRef.current = setInterval(() => {
        if (!isSliderPaused) {
          setCurrentTestimonialIndex((prevIndex) =>
            (prevIndex + 1) % mockTestimonials.length
          );
        }
      }, 5000);
    };

    startSlider();

    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (sliderIntervalRef.current) clearInterval(sliderIntervalRef.current);
    };
  }, [isSliderPaused, mockTestimonials.length]); // Dependencies for useEffect

  const handleSubscribe = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (email) {
      console.log("Subscribing email:", email);
      setIsSubscribed(true);
      setTimeout(() => setIsSubscribed(false), 3000); // Show confirmation for 3 seconds
      setEmail(""); // Clear email input
    }
  };

  // --- Background Animation: Floating Bubbles (Adjusted) ---
  const generateBubbles = () => {
    const bubbles = [];
    for (let i = 0; i < 120; i++) { // Increased bubble count significantly
      const random = seededRandom(i);
      bubbles.push({
        key: `bubble-${i}`,
        size: 40 + Math.floor(random() * 100), // Slightly larger size range
        left: `${Math.floor(random() * 100)}%`,
        top: `${Math.floor(random() * 100)}%`,
        duration: 20 + Math.floor(random() * 25), // Longer duration for slower, more floaty movement
        delay: random() * 15, // Wider delay range
        yOffset: (random() > 0.5 ? 1 : -1) * (200 + Math.floor(random() * 300)), // Increased vertical float
        xOffset: (random() > 0.5 ? 1 : -1) * (100 + Math.floor(random() * 150)), // Increased horizontal float
        opacity: 0.15 + random() * 0.25, // Adjusted opacity range to be more visible (0.15 to 0.4)
      });
    }
    return bubbles;
  };

  const bgBubbles = generateBubbles();

  // Team Members Data - THIS SECTION WILL BE REMOVED
  // Removed: teamMembers data

  return (
    <div className={`min-h-screen relative overflow-hidden`} style={{ backgroundColor: getDynamicThemeClass('background-primary') }}>
      {/* Global Background Animations: Floating Bubbles */}
      {isMounted && (
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
          {bgBubbles.map((bubble) => (
            <motion.div
              key={bubble.key}
              className="absolute rounded-full"
              style={{
                width: bubble.size,
                height: bubble.size,
                left: bubble.left,
                top: bubble.top,
                opacity: bubble.opacity,
                backgroundColor: getDynamicThemeClass('accent-color-faded-more'), // Use a faded accent color for bubbles
                filter: `blur(${bubble.size / 6}px)`, // Apply blur for a softer look
              }}
              animate={{
                y: [0, bubble.yOffset, 0],
                x: [0, bubble.xOffset, 0],
                opacity: [0, bubble.opacity, 0], // Fade in and out
                scale: [0.8, 1.2, 0.8], // Subtle pulsation
              }}
              transition={{
                duration: bubble.duration,
                delay: bubble.delay,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          ))}
        </div>
      )}

      {/* Hero Section */}
      <div className="relative z-10 py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <motion.h1
            className={`text-4xl md:text-6xl font-extrabold tracking-tight mb-6 leading-tight`}
            style={{ color: getDynamicThemeClass('text-primary') }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            {/* Conditional Welcome Message */}
            {status === "authenticated" ? (
              <>Welcome back, <span style={{ color: getDynamicThemeClass('accent-color') }}>{session?.user?.name || 'Storyteller'}</span>!</>
            ) : (
              <>Welcome to <span style={{ color: getDynamicThemeClass('accent-color') }}>Talesy</span></>
            )}
          </motion.h1>

          <motion.p
            className={`text-xl md:text-2xl max-w-3xl mx-auto mb-12`}
            style={{ color: getDynamicThemeClass('text-secondary') }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            {status === "authenticated" ? (
              `Your next great story awaits. Dive into your personalized feed or continue writing.`
            ) : (
              `Your stories matter. Create, share, and connect with readers around the world.`
            )}
          </motion.p>

          <motion.div
            className="flex flex-col sm:flex-row justify-center gap-6 px-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            {/* Conditional Buttons based on login status */}
            {status === "authenticated" ? (
              <>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="w-full sm:w-auto">
                  <Link
                    href="/feed"
                    className={`inline-flex items-center justify-center w-full px-8 py-3 sm:px-10 sm:py-4 border border-transparent text-lg font-medium rounded-full shadow-md text-white transition duration-300 ease-in-out transform`}
                    style={{
                      backgroundColor: getDynamicThemeClass('accent-color'),
                      color: 'white',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = getDynamicThemeClass('active-bg');
                      e.currentTarget.style.color = getDynamicThemeClass('text-primary');
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = getDynamicThemeClass('accent-color');
                      e.currentTarget.style.color = 'white';
                    }}
                  >
                    Go to My Feed
                  </Link>
                </motion.div>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="w-full sm:w-auto">
                  <Link
                    href="/write/new"
                    className={`inline-flex items-center justify-center w-full px-8 py-3 sm:px-10 sm:py-4 border text-lg font-medium rounded-full shadow-md transition duration-300 ease-in-out transform`}
                    style={{
                      backgroundColor: getDynamicThemeClass('accent-color'),
                      color: 'white',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = getDynamicThemeClass('active-bg');
                      e.currentTarget.style.color = getDynamicThemeClass('text-primary');
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = getDynamicThemeClass('accent-color');
                      e.currentTarget.style.color = 'white';
                    }}
                  >
                    Start New Story
                  </Link>
                </motion.div>
              </>
            ) : (
              // NEW: Only one button when not logged in, leads to /login
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="w-full sm:w-auto">
                <Link
                  href="/login" // Direct to login page
                  className={`inline-flex items-center justify-center w-full px-8 py-3 sm:px-10 sm:py-4 border-2 border-transparent text-lg font-medium rounded-full shadow-md text-white transition duration-300 ease-in-out transform`}
                  style={{
                    backgroundColor: getDynamicThemeClass('accent-color'), // Use accent color for consistency
                    color: 'white',
                    borderColor: getDynamicThemeClass('accent-color'), // Match border to accent color
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = getDynamicThemeClass('active-bg');
                    e.currentTarget.style.color = getDynamicThemeClass('text-primary');
                    e.currentTarget.style.borderColor = getDynamicThemeClass('active-bg');
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = getDynamicThemeClass('accent-color');
                    e.currentTarget.style.color = 'white';
                    e.currentTarget.style.borderColor = getDynamicThemeClass('accent-color');
                  }}
                >
                  Login
                </Link>
              </motion.div>
            )}
          </motion.div>

          <motion.div
            className="mt-8 mb-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 1 }}
          >
            <div className="flex justify-center space-x-8">
              {[
                { href: "https://instagram.com", icon: FaInstagram },
                { href: "https://twitter.com", icon: FaTwitter },
                { href: "https://facebook.com", icon: FaFacebookF },
                { href: "https://reddit.com", icon: FaRedditAlien },
                { href: "https://linkedin.com", icon: FaLinkedinIn },
              ].map((social, index) => (
                <motion.a
                  key={index}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`h-12 w-12 rounded-full flex items-center justify-center transition-all duration-300`}
                  style={{
                    backgroundColor: getDynamicThemeClass('background-secondary'),
                    color: getDynamicThemeClass('text-secondary'),
                  }}
                  whileHover={{
                    scale: 1.2, rotate: 5,
                    backgroundColor: getDynamicThemeClass('accent-color'),
                    color: getDynamicThemeClass('active-text'),
                  }}
                  whileTap={{ scale: 0.9 }}
                >
                  <social.icon className="h-6 w-6" />
                </motion.a>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Fresh Reads Section */}
      <div className={`py-16`} style={{ backgroundColor: getDynamicThemeClass('background-primary') }}> {/* Increased padding top/bottom */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.8 }}
          >
            <h2 className={`text-3xl sm:text-4xl font-extrabold`} style={{ color: getDynamicThemeClass('text-primary') }}>
              Fresh Reads from Our Community
            </h2>
            <p className={`mt-4 text-lg`} style={{ color: getDynamicThemeClass('text-secondary') }}>
              Discover the latest stories and connect with talented writers.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-10"> {/* Adjusted gap for responsiveness */}
            {mockStories.map((story, index) => (
              <StoryCard key={story.id} story={story} theme={theme} />
            ))}
          </div>

          <motion.div
            className="mt-16 text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link
                href="/explore"
                className="inline-flex items-center justify-center w-full sm:w-auto px-8 py-3 sm:px-10 sm:py-4 border border-transparent text-lg font-medium rounded-full shadow-md text-white transition duration-300 ease-in-out transform"
                style={{
                  backgroundColor: getDynamicThemeClass('accent-color'),
                  color: 'white',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = getDynamicThemeClass('active-bg');
                  e.currentTarget.style.color = getDynamicThemeClass('text-primary');
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = getDynamicThemeClass('accent-color');
                  e.currentTarget.style.color = 'white';
                }}
              >
                View All Stories
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Why Choose Talesy Section */}
      <div className={`py-16 relative z-10`} style={{
        backgroundColor: getDynamicThemeClass('background-secondary-faded'), // Keep this as is for consistency
        backdropFilter: 'blur(5px)' // Apply backdrop blur here
      }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.8 }}
          >
            <h2 className={`text-3xl sm:text-4xl font-extrabold`} style={{ color: getDynamicThemeClass('text-primary') }}>
              Why Choose Talesy?
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-10"> {/* Adjusted gap for responsiveness */}
            {[
              {
                icon: FaFeatherAlt,
                title: "Effortless Creation",
                description: "Our intuitive editor makes it simple to create beautiful stories with rich formatting and images, bringing your narratives to life."
              },
              {
                icon: FaUsers,
                title: "Connect & Grow",
                description: "Build your passionate audience and connect with readers who appreciate your unique voice, fostering a vibrant community."
              },
              {
                icon: FaShareAlt,
                title: "Instant Publishing",
                description: "Share your stories with the world in seconds. No complicated processes, just seamless publishing at your fingertips."
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                className={`p-8 rounded-lg flex flex-col items-center text-center min-w-0`}
                style={{
                  backgroundColor: getDynamicThemeClass('background-secondary-faded-more'), // Potentially adjust opacity here in CSS variables
                  backdropFilter: 'blur(3px)' // Apply backdrop blur to individual cards too
                }}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.5 }}
                transition={{ duration: 0.5, delay: index * 0.2 }}
                whileHover={{
                  scale: 1.05,
                  boxShadow: `0 10px 25px -5px ${getDynamicThemeClass('shadow-color-strong')}`
                }}
              >
                <div className="flex justify-center mb-6">
                  <div className="rounded-full p-4" style={{ backgroundColor: getDynamicThemeClass('accent-color') }}>
                    <feature.icon className="h-7 w-7" style={{ color: getDynamicThemeClass('active-text') }} />
                  </div>
                </div>
                <h3 className={`text-2xl font-bold mb-3`} style={{ color: getDynamicThemeClass('text-primary') }}>
                  {feature.title}
                </h3>
                <p className={`text-lg`} style={{ color: getDynamicThemeClass('text-secondary') }}>
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Testimonials Section */}
      <div className={`py-16`} style={{ backgroundColor: getDynamicThemeClass('background-primary') }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.8 }}
          >
            <h2 className={`text-3xl sm:text-4xl font-extrabold`} style={{ color: getDynamicThemeClass('text-primary') }}>
              What Our Community Says
            </h2>
            <p className={`mt-4 text-lg`} style={{ color: getDynamicThemeClass('text-secondary') }}>
              Hear directly from our passionate writers and readers.
            </p>
          </motion.div>

          <div className="relative w-full overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.div
                key={mockTestimonials[currentTestimonialIndex].id}
                className={`p-8 sm:p-10 rounded-xl shadow-xl flex flex-col justify-between mx-auto max-w-2xl border-2`}
                style={{
                  backgroundColor: getDynamicThemeClass('background-secondary'),
                  borderColor: getDynamicThemeClass('border-color'),
                }}
                initial={{ opacity: 0, x: 200, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: -200, scale: 0.95 }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
                whileHover={{
                  scale: 1.02,
                  boxShadow: `0 15px 30px -5px ${getDynamicThemeClass('shadow-color-strong')}`
                }}
                onMouseEnter={() => setIsSliderPaused(true)}
                onMouseLeave={() => setIsSliderPaused(false)}
              >
                <p className={`text-lg md:text-2xl italic text-center leading-relaxed flex-grow mb-6`} style={{ color: getDynamicThemeClass('text-secondary') }}>
                  "{mockTestimonials[currentTestimonialIndex].quote}"
                </p>
                <div className="mt-4 text-center border-t pt-4" style={{ borderColor: getDynamicThemeClass('border-color') }}>
                  <p className={`text-lg md:text-xl font-semibold`} style={{ color: getDynamicThemeClass('text-primary') }}>
                    - {mockTestimonials[currentTestimonialIndex].author}
                  </p>
                  <p className={`text-base md:text-lg`} style={{ color: getDynamicThemeClass('accent-color') }}>
                    {mockTestimonials[currentTestimonialIndex].role}
                  </p>
                </div>
              </motion.div>
            </AnimatePresence>
            <div className="flex justify-center mt-8 space-x-2">
              {mockTestimonials.map((_, idx) => (
                <motion.button
                  key={idx}
                  onClick={() => {
                    setCurrentTestimonialIndex(idx);
                    setIsSliderPaused(true);
                    if (sliderIntervalRef.current) clearInterval(sliderIntervalRef.current);
                    setTimeout(() => {
                      setIsSliderPaused(false);
                    }, 3000);
                  }}
                  className={`w-4 h-4 rounded-full transition-all duration-300`}
                  style={{
                    backgroundColor: idx === currentTestimonialIndex ? getDynamicThemeClass('accent-color') : getDynamicThemeClass('border-color'),
                    border: `1px solid ${idx === currentTestimonialIndex ? getDynamicThemeClass('accent-color') : getDynamicThemeClass('text-secondary-faded')}`,
                  }}
                  whileHover={{ scale: 1.2 }}
                  whileTap={{ scale: 0.8 }}
                ></motion.button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Team Section - REMOVED AS PER USER REQUEST */}
      {/* This section (Meet Our Visionaries) has been fully removed based on your previous explicit request. */}
      {/* <div ref={teamSectionRef} className={`py-16 relative z-10`} style={{ backgroundColor: getDynamicThemeClass('background-primary') }}>
        ... (removed content) ...
      </div> */}

      {/* FAQs Section */}
      <div id="faqs" className={`py-20 relative z-10`} style={{
        backgroundColor: getDynamicThemeClass('background-secondary-faded'), // Keep this as is for consistency
        backdropFilter: 'blur(5px)' // Apply backdrop blur here
      }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.8 }}
          >
            <h2 className={`text-3xl sm:text-4xl font-extrabold`} style={{ color: getDynamicThemeClass('text-primary') }}>
              Frequently Asked Questions
            </h2>
            <p className={`mt-4 text-lg`} style={{ color: getDynamicThemeClass('text-secondary') }}>
              Quick answers to common questions about Talesy.
            </p>
          </motion.div>

          <div className="max-w-3xl mx-auto space-y-6">
            {mockFAQs.map((faq) => (
              <FAQItem key={faq.id} question={faq.question} answer={faq.answer} theme={theme} />
            ))}
          </div>
        </div>
      </div>

      {/* Call to Action Section (Distinct from Footer) */}
      <div className={`py-20 relative overflow-hidden z-10`} style={{ backgroundColor: getDynamicThemeClass('background-secondary') }}>
        <div
          className="absolute inset-0"
          style={{ background: `linear-gradient(to right, ${getDynamicThemeClass('purple-gradient-start')}, ${getDynamicThemeClass('purple-gradient-end')})` }}
        ></div>
        {/* Removed redundant bgShapes from here as bubbles are global */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-6" style={{ color: getDynamicThemeClass('active-text') }}>
              Ready to Share Your Story?
            </h2>
            <p className="text-xl md:text-2xl mb-10" style={{ color: getDynamicThemeClass('text-on-accent') }}>
              Join thousands of writers who have already found their audience.
            </p>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {/* NEW: Single button to login */}
              <Link
                href="/login"
                className="inline-flex items-center justify-center w-full sm:w-auto px-8 py-4 text-lg md:text-xl font-medium rounded-full shadow-lg transition-all transform"
                style={{
                  backgroundColor: getDynamicThemeClass('accent-color'),
                  color: 'white',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = getDynamicThemeClass('active-bg');
                  e.currentTarget.style.color = getDynamicThemeClass('text-primary');
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = getDynamicThemeClass('accent-color');
                  e.currentTarget.style.color = 'white';
                }}
              >
                Login
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Newsletter Section (Visually distinct from the main footer) */}
      <div className={`py-16 relative z-10`} style={{
        backgroundColor: getDynamicThemeClass('background-secondary-faded'), // Keep this as is for consistency
        backdropFilter: 'blur(5px)' // Apply backdrop blur here
      }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="lg:flex lg:items-center lg:justify-between p-8 sm:p-10 rounded-xl shadow-lg"
            style={{
              background: `linear-gradient(to right, ${getDynamicThemeClass('purple-gradient-start')}, ${getDynamicThemeClass('purple-gradient-end')})`
            }}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.6 }}
          >
            <div className="lg:w-1/2 mb-8 lg:mb-0">
              <h3 className="text-3xl md:text-4xl font-bold leading-tight" style={{ color: getDynamicThemeClass('active-text') }}>
                Stay updated with Talesy news
              </h3>
              <p className="mt-3 text-xl" style={{ color: getDynamicThemeClass('text-on-accent') }}>
                Get writing tips, feature updates, and inspiration delivered to your inbox.
              </p>
            </div>
            <div className="lg:w-1/2 lg:pl-12">
              <AnimatePresence mode="wait">
                {isSubscribed ? (
                  <motion.div
                    key="subscribed"
                    className="text-center p-4 rounded-md text-xl font-medium"
                    style={{
                      backgroundColor: getDynamicThemeClass('background-primary'), // Success message background
                      color: getDynamicThemeClass('accent-color'), // Success message text color
                      border: `1px solid ${getDynamicThemeClass('border-color')}` // Border for definition
                    }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    Thank you for subscribing! 🎉
                  </motion.div>
                ) : (
                  <motion.form
                    key="form"
                    className="flex flex-col sm:flex-row items-center gap-4"
                    onSubmit={handleSubscribe}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <input
                      type="email"
                      required
                      placeholder="Enter your email"
                      className="w-full sm:flex-grow px-4 py-4 rounded-full border-2 outline-none focus:ring-2 transition-all text-base sm:text-lg"
                      style={{
                        borderColor: getDynamicThemeClass('border-color'),
                        backgroundColor: getDynamicThemeClass('input-background') || getDynamicThemeClass('background-primary'),
                        color: getDynamicThemeClass('text-primary'),
                        '--tw-ring-color': getDynamicThemeClass('accent-color'),
                      } as React.CSSProperties}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                    <motion.button
                      type="submit"
                      disabled={isSubscribed}
                      className="w-full sm:w-auto flex-shrink-0 flex items-center justify-center px-8 py-4 text-lg md:text-xl font-medium rounded-full shadow-lg transition-all transform" // transition-all for smooth CSS transitions
                      style={{
                        // Initial styles matching 'Get Started Now' button
                        backgroundColor: getDynamicThemeClass('accent-color'),
                        color: 'white', // Text color for the button
                        border: `2px solid ${getDynamicThemeClass('accent-color')}`, // Explicit border for visibility
                        boxShadow: `0 4px 10px ${getDynamicThemeClass('shadow-color-subtle') || 'rgba(0,0,0,0.1)'}`
                      }}
                      // Hover and leave events for dynamic color changes, exactly like "Get Started Now"
                      onMouseEnter={(e) => {
                        if (!isSubscribed) { // Apply hover effects only if not subscribed
                          e.currentTarget.style.backgroundColor = getDynamicThemeClass('active-bg');
                          e.currentTarget.style.color = getDynamicThemeClass('text-primary');
                          e.currentTarget.style.borderColor = getDynamicThemeClass('active-bg'); // Border also changes on hover
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isSubscribed) { // Revert styles only if not subscribed
                          e.currentTarget.style.backgroundColor = getDynamicThemeClass('accent-color');
                          e.currentTarget.style.color = 'white';
                          e.currentTarget.style.borderColor = getDynamicThemeClass('accent-color'); // Revert border
                        }
                      }}
                      // Framer Motion for scale and lift
                      whileHover={!isSubscribed ? {
                        scale: 1.05,
                        y: -2, // Slight lift on hover
                        boxShadow: `0 8px 20px ${getDynamicThemeClass('shadow-color-subtle') || 'rgba(0,0,0,0.2)'}` // Enhanced shadow on hover
                      } : {}} // No Framer Motion hover effects if already subscribed
                      whileTap={!isSubscribed ? { scale: 0.95 } : {}} // No Framer Motion tap effects if already subscribed
                    >
                      {isSubscribed ? 'Subscribed!' : 'Subscribe'}
                    </motion.button>
                  </motion.form>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Main Footer */}
      <footer className={`py-16 relative z-10`} style={{
        backgroundColor: getDynamicThemeClass('background-primary-faded'), // Keep this as is for consistency
        backdropFilter: 'blur(5px)' // Apply backdrop blur here
      }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Adjusted grid: Base is 1 column, sm is 2, md is 3, lg is 4 (for Talesy info + 3 links) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-y-10 md:gap-y-0 gap-x-10">
            {/* Talesy Info & Socials (takes 1 column) */}
            <div className="col-span-1">
              <Image
                src={theme === "light" ? "/logo-dark.png" : "/logo.png"}
                alt="Talesy"
                width={120}
                height={48}
                className="h-12 w-auto mb-6"
              />
              <p className={`text-base`} style={{ color: getDynamicThemeClass('text-secondary') }}>
                Share your stories with the world.
              </p>
              <div className="mt-6 flex space-x-5">
                {[
                  { href: "https://instagram.com", icon: FaInstagram },
                  { href: "https://twitter.com", icon: FaTwitter },
                  { href: "https://facebook.com", icon: FaFacebookF },
                  { href: "https://reddit.com", icon: FaRedditAlien },
                  { href: "https://linkedin.com", icon: FaLinkedinIn },
                ].map((social, index) => (
                  <motion.a
                    key={index}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`transition-colors duration-200`}
                    style={{ color: getDynamicThemeClass('text-secondary') }}
                    whileHover={{ scale: 1.2, rotate: 5, color: getDynamicThemeClass('accent-color') }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <social.icon className="h-7 w-7" />
                  </motion.a>
                ))}
              </div>
            </div>

            {/* Navigation, Resources, Legal - now always in columns */}
            <div className="col-span-1">
              <h3 className={`text-base font-semibold uppercase tracking-wider`} style={{ color: getDynamicThemeClass('text-primary') }}>
                Navigation
              </h3>
              <ul className="mt-5 space-y-3">
                {/* All footer links now lead to /login if not authenticated */}
                <li><Link href="/login" className={`text-lg transition-colors duration-200 hover:text-[color:var(--text-link-hover)]`} style={{ color: getDynamicThemeClass('text-link') }}>Home</Link></li>
                <li><Link href="/login" className={`text-lg transition-colors duration-200 hover:text-[color:var(--text-link-hover)]`} style={{ color: getDynamicThemeClass('text-link') }}>Feed</Link></li>
                <li><Link href="/login" className={`text-lg transition-colors duration-200 hover:text-[color:var(--text-link-hover)]`} style={{ color: getDynamicThemeClass('text-link') }}>Explore</Link></li>
                <li><Link href="/login" className={`text-lg transition-colors duration-200 hover:text-[color:var(--text-link-hover)]`} style={{ color: getDynamicThemeClass('text-link') }}>Dashboard</Link></li>
                <li><Link href="/login" className={`text-lg transition-colors duration-200 hover:text-[color:var(--text-link-hover)]`} style={{ color: getDynamicThemeClass('text-link') }}>About Us</Link></li>
              </ul>
            </div>

            <div className="col-span-1">
              <h3 className={`text-base font-semibold uppercase tracking-wider`} style={{ color: getDynamicThemeClass('text-primary') }}>
                Resources
              </h3>
              <ul className="mt-5 space-y-3">
                 {/* All footer links now lead to /login if not authenticated */}
                <li><Link href="/login" className={`text-lg transition-colors duration-200 hover:text-[color:var(--text-link-hover)]`} style={{ color: getDynamicThemeClass('text-link') }}>Writing Tips</Link></li>
                <li><Link href="/login" className={`text-lg transition-colors duration-200 hover:text-[color:var(--text-link-hover)]`} style={{ color: getDynamicThemeClass('text-link') }}>Style Guide</Link></li>
                <li><Link href="/login" className={`text-lg transition-colors duration-200 hover:text-[color:var(--text-link-hover)]`} style={{ color: getDynamicThemeClass('text-link') }}>FAQs</Link></li> {/* Removed #faqs as it's a section, not a separate page */}
                <li><Link href="/login" className={`text-lg transition-colors duration-200 hover:text-[color:var(--text-link-hover)]`} style={{ color: getDynamicThemeClass('text-link') }}>Support</Link></li>
              </ul>
            </div>

            <div className="col-span-1">
              <h3 className={`text-base font-semibold uppercase tracking-wider`} style={{ color: getDynamicThemeClass('text-primary') }}>
                Legal
              </h3>
              <ul className="mt-5 space-y-3">
                 {/* All footer links now lead to /login if not authenticated */}
                <li><Link href="/login" className={`text-lg transition-colors duration-200 hover:text-[color:var(--text-link-hover)]`} style={{ color: getDynamicThemeClass('text-link') }}>Privacy Policy</Link></li>
                <li><Link href="/login" className={`text-lg transition-colors duration-200 hover:text-[color:var(--text-link-hover)]`} style={{ color: getDynamicThemeClass('text-link') }}>Terms of Service</Link></li>
                <li><Link href="/login" className={`text-lg transition-colors duration-200 hover:text-[color:var(--text-link-hover)]`} style={{ color: getDynamicThemeClass('text-link') }}>Cookie Policy</Link></li>
              </ul>
            </div>
          </div>

        </div>
      </footer>

      {/* Scroll to Top Button */}
      {isMounted && (
        <motion.button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className={`fixed bottom-8 right-8 p-4 rounded-full shadow-lg z-50 focus:outline-none focus:ring-2 focus:ring-offset-2`}
          style={{
            backgroundColor: getDynamicThemeClass('accent-color'),
            color: getDynamicThemeClass('active-text'),
            '--tw-ring-offset-color': getDynamicThemeClass('background-primary')
          } as React.CSSProperties}
          initial={{ opacity: 0, y: 20 }}
          animate={{
            opacity: scrollY > 300 ? 1 : 0,
            y: scrollY > 300 ? 0 : 20,
            scale: scrollY > 300 ? 1 : 0.8
          }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          transition={{ duration: 0.3 }}
        >
          <FaArrowUp className="w-7 h-7" />
        </motion.button>
      )}
    </div>
  );
}
