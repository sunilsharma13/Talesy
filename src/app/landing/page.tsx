// app/landing/page.tsx
"use client";

import { useState, useEffect, useRef, createContext, useContext } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import { FaInstagram, FaTwitter, FaFacebookF, FaRedditAlien, FaLinkedinIn, FaCheckCircle, FaFeatherAlt, FaUsers, FaShareAlt, FaArrowUp, FaChevronDown, FaBookmark, FaHeart } from 'react-icons/fa'; // Added FaChevronDown, FaBookmark, FaHeart for new features

// --- Mock Authentication Context & Hook ---
// Real app mein, ye context aur hook alag file mein honge aur actual auth logic use karenge.
interface User {
  id: string;
  username: string;
}

interface AuthContextType {
  isLoggedIn: boolean;
  user: User | null;
  // login: (userData: User) => void; // Removed login for simplicity based on user's flow
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

// Mock AuthProvider Component
const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Simulate login status check (e.g., from localStorage or a session cookie)
    // In a real app, this would be an API call or check for a session token
    const storedUser = localStorage.getItem('mockUser');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
      setIsLoggedIn(true);
    } else {
      // FOR TESTING ONLY: If no user, simulate a logged-in user immediately upon mount
      // REMOVE THIS BLOCK IN PRODUCTION IF USER MUST LOGIN FIRST
      const mockUser = { id: 'test-user-123', username: 'Talesy Enthusiast' };
      setUser(mockUser);
      setIsLoggedIn(true);
      localStorage.setItem('mockUser', JSON.stringify(mockUser));
      // In a real app, if no user, you'd redirect to /login
    }
  }, []);

  const logout = () => {
    setUser(null);
    setIsLoggedIn(false);
    localStorage.removeItem('mockUser'); // Clear mock user on logout
    // In a real app, redirect to login page after logout
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, user, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// --- Mock Data for New Sections ---
const mockStories = [
  {
    id: 's1',
    title: "The Last Star Weaver",
    author: "Luna Skye",
    excerpt: "In a world where starlight was a currency, Elara discovered a forgotten loom that could weave constellations into destiny...",
    imageUrl: "https://images.unsplash.com/photo-1518173836374-6011a2f64f40?auto=format&fit=crop&q=80&w=2670&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    likes: 1245,
    reads: "12.5k",
    readTime: "15 min"
  },
  {
    id: 's2',
    title: "Whispers in the Ancient Grove",
    author: "Arjun Mehta",
    excerpt: "A young cartographer stumbles upon a map leading to a hidden grove, where trees whisper secrets of a forgotten civilization.",
    imageUrl: "https://images.unsplash.com/photo-1473225071151-bb443a253018?auto=format&fit=crop&q=80&w=2574&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    likes: 987,
    reads: "9.8k",
    readTime: "10 min"
  },
  {
    id: 's3',
    title: "Code & Chronicles: A Cyberpunk Saga",
    author: "Zara Khan",
    excerpt: "In Neo-Mumbai, a hacker uncovers a conspiracy woven into the very fabric of the city's digital infrastructure. Her only ally: a rogue AI.",
    imageUrl: "https://images.unsplash.com/photo-1629904853716-9ee15091c099?auto=format&fit=crop&q=80&w=2670&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    likes: 765,
    reads: "7.6k",
    readTime: "20 min"
  },
  {
    id: 's4',
    title: "The Quantum Chef's Recipe",
    author: "Hiroshi Tanaka",
    excerpt: "A chef invents a quantum device that allows him to cook ingredients from parallel universes, leading to bizarre and delicious culinary adventures.",
    imageUrl: "https://images.unsplash.com/photo-1624795368940-bf7b9dd469e3?auto=format&fit=crop&q=80&w=2670&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    likes: 543,
    reads: "5.4k",
    readTime: "12 min"
  },
];

// Updated Testimonials as requested
const mockTestimonials = [
  {
    id: 1,
    quote: "Talesy's innovative tech stack makes writing and publishing unbelievably smooth. It's truly a platform built for creators.",
    author: "Hemant Nirmal",
    role: "Chief Technology Officer (User Feedback)" // Role changed for testimonial context
  },
  {
    id: 2,
    quote: "The visual design and user experience on Talesy are top-notch. My stories have never looked better!",
    author: "Deevesh Sharma",
    role: "Creative Director (User Feedback)"
  },
  {
    id: 3,
    quote: "Talesy helped me connect with readers I never knew existed. Their marketing approach for writers is a game-changer.",
    author: "Lokesh Sharma",
    role: "Head of Marketing (User Feedback)"
  }
];

const mockFAQs = [
  {
    id: 1,
    question: "How do I start writing on Talesy?",
    answer: "Simply click on the 'Start Writing' button or navigate to the 'Write' section. Our intuitive editor will guide you through the process of creating your story."
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

// --- Reusable FAQ Item Component ---
const FAQItem: React.FC<{ question: string; answer: string; theme: 'dark' | 'light' }> = ({ question, answer, theme }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <motion.div
      className={`border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-300'} pb-4 mb-4 cursor-pointer`}
      onClick={() => setIsOpen(!isOpen)}
      initial={false}
      animate={{ backgroundColor: isOpen && theme === 'dark' ? 'rgba(55,65,81,0.5)' : (isOpen && theme === 'light' ? 'rgba(243,244,246,0.5)' : 'transparent') }}
      transition={{ duration: 0.3 }}
      whileHover={{ scale: 1.01 }}
    >
      <div className="flex justify-between items-center">
        <h4 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
          {question}
        </h4>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.3 }}
        >
          <FaChevronDown className={`${theme === 'dark' ? 'text-indigo-400' : 'text-indigo-600'}`} />
        </motion.div>
      </div>
      <AnimatePresence>
        {isOpen && (
          <motion.p
            className={`mt-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}
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

// --- Reusable Story Card Component ---
const StoryCard: React.FC<{ story: typeof mockStories[0]; theme: 'dark' | 'light' }> = ({ story, theme }) => (
  <motion.div
    className={`rounded-lg overflow-hidden shadow-md transition-all duration-300 ${theme === 'dark' ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:bg-gray-100'} cursor-pointer`}
    whileHover={{ scale: 1.03, boxShadow: theme === 'dark' ? "0 15px 30px -5px rgba(0, 0, 0, 0.4)" : "0 15px 30px -5px rgba(0, 0, 0, 0.1)" }}
  >
    <img src={story.imageUrl} alt={story.title} className="w-full h-40 object-cover" />
    <div className="p-4">
      <h3 className={`text-xl font-bold mb-1 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{story.title}</h3>
      <p className={`text-sm ${theme === 'dark' ? 'text-indigo-300' : 'text-indigo-700'}`}>{story.author}</p>
      <p className={`text-sm mt-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'} line-clamp-2`}>{story.excerpt}</p>
      <div className="flex justify-between items-center mt-3 text-sm">
        <span className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} flex items-center`}>
          <FaHeart className="mr-1 text-red-400" /> {story.likes}
        </span>
        <span className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
          {story.reads} reads
        </span>
        <span className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
          {story.readTime}
        </span>
      </div>
    </div>
  </motion.div>
);


// This function generates consistent pseudo-random values based on a seed
const seededRandom = (seed: number) => {
  return () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
};

export default function LandingPageWrapper() {
  return (
    <AuthProvider>
      <LandingPageContent />
    </AuthProvider>
  );
}

function LandingPageContent() {
  const router = useRouter();
  const { isLoggedIn, user, logout } = useAuth(); // Use the mock auth hook
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [email, setEmail] = useState("");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [isMounted, setIsMounted] = useState(false);

  // Framer Motion scroll hook for team section animation
  const teamSectionRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: teamSectionRef,
    offset: ["start end", "end start"]
  });

  const ceoScale = useTransform(scrollYProgress, [0, 0.5, 1], [0.8, 1, 0.8]);
  const ceoOpacity = useTransform(scrollYProgress, [0, 0.5, 1], [0, 1, 0]);

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

  const handleSubscribe = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (email) {
      setIsSubscribed(true);
      setTimeout(() => setIsSubscribed(false), 3000);
      setEmail("");
    }
  };

  // Generate deterministic particles for Hero background
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

  // Generate shapes for CTA section background
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

  // Updated Team members data as requested
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
    }
  ];

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'} relative overflow-hidden`}>
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
      <div className="relative z-10 pt-20 pb-16 sm:pb-24 lg:pb-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
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

          {/* Main title with typing animation - Personalised for Logged-In Users */}
          <motion.h1
            className={`text-4xl md:text-6xl font-extrabold tracking-tight mb-6 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            {isLoggedIn ? (
              <>Welcome back, <span className="text-indigo-500">{user?.username || 'Storyteller'}</span>!</>
            ) : (
              // This part should technically not be reached if user is always logged in before landing page
              <>Welcome to <span className="text-indigo-500">Talesy</span></>
            )}
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            className={`text-xl md:text-2xl max-w-3xl mx-auto ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            {isLoggedIn ? (
              `Your next great story awaits. Dive into your personalized feed or continue writing.`
            ) : (
              `Your stories matter. Create, share, and connect with readers around the world.`
            )}
          </motion.p>

          {/* CTA buttons - Dynamic for Logged-In Users (Login/Logout test buttons removed) */}
          <motion.div
            className="mt-10 flex flex-col sm:flex-row justify-center gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            {isLoggedIn ? (
              <>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Link
                    href="/feed"
                    className="px-8 py-3 text-base font-medium rounded-md shadow bg-indigo-600 text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 inline-block"
                  >
                    Go to My Feed
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
                    Start New Story
                  </Link>
                </motion.div>
              </>
            ) : (
              // This part should theoretically not be reached as user is always logged in before landing page
              // But keeping it for robustness or if flow changes later
              <>
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
                    href="/write/new" // Redirect to login/signup flow if not logged in
                    className={`px-8 py-3 text-base font-medium rounded-md shadow ${
                      theme === 'dark'
                        ? 'bg-white text-gray-900 hover:bg-gray-100'
                        : 'bg-gray-800 text-white hover:bg-gray-700'
                    } inline-block`}
                  >
                    Start Writing
                  </Link>
                </motion.div>
              </>
            )}
          </motion.div>

          {/* Floating Social Media Links with hover effects (Icons are now Fa from react-icons) */}
          <motion.div
            className="mt-12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 1 }}
          >
            <div className="flex justify-center space-x-6">
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
                  className={`h-10 w-10 rounded-full flex items-center justify-center ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-200'} hover:text-white hover:bg-indigo-600 transition-all duration-300`}
                  whileHover={{ scale: 1.2, rotate: 5 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <social.icon className="h-5 w-5" /> {/* Use imported icon component */}
                </motion.a>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* NEW SECTION: Dynamic Content Preview (Latest/Trending Stories) */}
      <div className={`py-16 ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.8 }}
          >
            <h2 className={`text-3xl font-extrabold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              Fresh Reads from Our Community
            </h2>
            <p className={`mt-4 text-lg ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
              Discover the latest stories and connect with talented writers.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {mockStories.map((story, index) => (
              <StoryCard key={story.id} story={story} theme={theme} />
            ))}
          </div>

          <motion.div
            className="mt-12 text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <Link
              href="/explore"
              className="px-8 py-3 text-base font-medium rounded-md shadow bg-indigo-600 text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 inline-block"
            >
              View All Stories
            </Link>
          </motion.div>
        </div>
      </div>


      {/* Features section with scroll animations */}
      <div className={`py-16 ${theme === 'dark' ? 'bg-gray-800/80' : 'bg-white/90'} backdrop-blur-sm relative z-10`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.8 }}
          >
            <h2 className={`text-3xl font-extrabold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              Why Choose Talesy?
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: FaFeatherAlt, // Replaced path with FaFeatherAlt
                title: "Easy Writing",
                description: "Our intuitive editor makes it simple to create beautiful stories with rich formatting and images."
              },
              {
                icon: FaUsers, // Replaced path with FaUsers
                title: "Connect with Readers",
                description: "Build your audience and connect with readers who appreciate your unique voice."
              },
              {
                icon: FaShareAlt, // Replaced path with FaShareAlt
                title: "Publish Instantly",
                description: "Share your stories with the world in seconds, no complicated publishing process."
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                className={`p-6 rounded-lg ${theme === 'dark' ? 'bg-gray-700/90' : 'bg-gray-50/90'} backdrop-blur-sm`}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.5 }}
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
                    <feature.icon className="h-6 w-6 text-white" /> {/* Use imported icon component */}
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

      {/* NEW SECTION: Testimonials (Updated Names) */}
      <div className={`py-16 ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.8 }}
          >
            <h2 className={`text-3xl font-extrabold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              What Our Community Says
            </h2>
            <p className={`mt-4 text-lg ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
              Hear directly from our passionate writers and readers.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {mockTestimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.id}
                className={`p-6 rounded-lg shadow-md ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.5 }}
                transition={{ duration: 0.5, delay: index * 0.15 }}
              >
                <p className={`text-lg italic ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                  "{testimonial.quote}"
                </p>
                <div className="mt-4 text-right">
                  <p className={`text-md font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    - {testimonial.author}
                  </p>
                  <p className={`text-sm ${theme === 'dark' ? 'text-indigo-300' : 'text-indigo-700'}`}>
                    {testimonial.role}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* NEW & ENHANCED Team Section with CEO Highlight and Dynamic Member Grid (Updated Members) */}
      <div ref={teamSectionRef} className={`py-20 relative z-10 ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center mb-10"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className={`text-4xl font-extrabold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              Meet Our Visionaries
            </h2>
            <p className={`mt-4 max-w-3xl mx-auto text-xl ${theme === 'dark' ? 'text-gray-300' : 'text-gray-500'}`}>
              The passionate minds shaping the future of Talesy.
            </p>
          </motion.div>

          {/* CEO Card - Highlighted and Centered with Framer Motion scroll transform */}
          <motion.div
            className="mb-12"
            style={{
              scale: ceoScale,
              opacity: ceoOpacity,
            }}
          >
            <motion.div
              className={`rounded-3xl overflow-hidden shadow-2xl transition-all duration-300 ${theme === 'dark' ? 'bg-gray-800 border-2 border-indigo-600' : 'bg-white border-2 border-indigo-400'}`}
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              style={{ maxWidth: '700px', margin: '0 auto' }}
              whileHover={{
                boxShadow: theme === 'dark' ? "0 20px 40px -10px rgba(0, 0, 0, 0.5)" : "0 20px 40px -10px rgba(0, 0, 0, 0.2)"
              }}
            >
              <div className="flex flex-col sm:flex-row p-8 items-center sm:space-x-8 space-y-6 sm:space-y-0">
                <div className="flex-shrink-0">
                  <div className="w-28 h-28 rounded-full overflow-hidden relative border-4 border-indigo-500 flex items-center justify-center">
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center text-4xl font-bold transform -rotate-6">
                      {teamMembers[0].initials}
                    </div>
                  </div>
                </div>
                <div className="text-center sm:text-left flex-1">
                  <h3 className={`text-3xl font-bold mb-1 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    {teamMembers[0].name}
                  </h3>
                  <div className="flex items-center justify-center sm:justify-start mb-3">
                    <p className={`text-lg font-medium ${theme === 'dark' ? 'text-indigo-300' : 'text-indigo-700'}`}>
                      {teamMembers[0].role}
                    </p>
                    <motion.span
                      className="ml-3 text-green-400"
                      animate={{ scale: [0.9, 1.1, 0.9] }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                    >
                      <FaCheckCircle className="w-6 h-6" />
                    </motion.span>
                  </div>
                  <p className={`text-lg italic leading-relaxed ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                    "{teamMembers[0].quote}"
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>

          {/* Regular Team Members - Responsive Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-8 max-w-2xl mx-auto"> {/* Adjusted grid for 2 members */}
            {teamMembers.slice(1).map((member, index) => (
              <motion.div
                key={index + 1}
                className={`rounded-2xl overflow-hidden shadow-lg transition-colors duration-300 ${theme === 'dark' ? 'bg-gray-800 hover:bg-gray-700 border border-gray-700' : 'bg-white hover:bg-gray-100 border border-gray-200'}`}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.6, delay: (index + 1) * 0.1 }}
                whileHover={{
                  scale: 1.03,
                  boxShadow: theme === 'dark' ? "0 15px 30px -5px rgba(0, 0, 0, 0.4)" : "0 15px 30px -5px rgba(0, 0, 0, 0.1)"
                }}
              >
                <div className="p-6 flex flex-col h-full text-center">
                  <div className="flex justify-center mb-4">
                    <div className="w-16 h-16 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold uppercase text-2xl">
                      {member.initials}
                    </div>
                  </div>
                  <h3 className={`text-xl font-semibold mb-1 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{member.name}</h3>
                  <p className={`text-md font-medium ${theme === 'dark' ? 'text-indigo-400' : 'text-indigo-700'}`}>{member.role}</p>
                  <p className={`text-base italic mt-3 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'} flex-grow`}>"{member.quote}"</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* NEW SECTION: FAQ Section */}
      <div className={`py-16 ${theme === 'dark' ? 'bg-gray-800/80' : 'bg-white/90'} backdrop-blur-sm relative z-10`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.8 }}
          >
            <h2 className={`text-3xl font-extrabold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              Frequently Asked Questions
            </h2>
            <p className={`mt-4 text-lg ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
              Quick answers to common questions about Talesy.
            </p>
          </motion.div>

          <div className="max-w-3xl mx-auto">
            {mockFAQs.map((faq) => (
              <FAQItem key={faq.id} question={faq.question} answer={faq.answer} theme={theme} />
            ))}
          </div>
        </div>
      </div>


      {/* CTA section with enhanced gradient and animation */}
      <div className={`py-16 relative overflow-hidden z-10 ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'}`}>
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-800 to-purple-900 opacity-90"></div> {/* Increased opacity */}
        {/* Animated background shapes - only on client side */}
        {isMounted && bgShapes.map((shape) => (
          <motion.div
            key={shape.key}
            className="absolute rounded-full bg-white/15" // Slightly more visible
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
              opacity: [0.15, 0.25, 0.15], // Slightly higher opacity
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
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4">
              Ready to Share Your Story?
            </h2>
            <p className="text-xl md:text-2xl text-indigo-100 mb-8">
              Join thousands of writers who have already found their audience.
            </p>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link
                href="/feed"
                className="px-8 py-4 text-base md:text-lg font-medium rounded-md shadow-lg bg-white text-indigo-700 hover:bg-gray-100 transition-all inline-block transform hover:-translate-y-1" // Added transform
              >
                Get Started Now
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Newsletter section with improved contrast and styling */}
      <div className={`py-12 relative z-10 ${theme === 'dark' ? 'bg-gray-800/90' : 'bg-gray-100/90'} backdrop-blur-sm`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="lg:flex lg:items-center lg:justify-between p-6 sm:p-8 rounded-xl shadow-lg bg-gradient-to-r from-indigo-900 to-indigo-800"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.6 }}
          >
            <div className="lg:w-1/2 mb-6 lg:mb-0">
              <h3 className="text-2xl md:text-3xl font-bold text-white leading-tight">
                Stay updated with Talesy news
              </h3>
              <p className="mt-2 text-indigo-100 text-lg">
                Get writing tips, feature updates, and inspiration delivered to your inbox.
              </p>
            </div>
            <div className="lg:w-1/2 lg:pl-10">
              <AnimatePresence mode="wait">
                {isSubscribed ? (
                  <motion.div
                    key="subscribed"
                    className="text-green-400 text-center p-3 rounded-md bg-green-900/20 text-lg font-medium"
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
                    className="sm:flex"
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
                      className="w-full px-4 py-3 rounded-lg border-2 border-indigo-500/50 bg-indigo-900/50 text-white placeholder-indigo-300 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                    <motion.button
                      type="submit"
                      className="mt-3 sm:mt-0 sm:ml-3 w-full sm:w-auto flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-indigo-500 hover:bg-indigo-400 transition-all shadow-md"
                      whileHover={{ scale: 1.03, boxShadow: "0 5px 15px rgba(0,0,0,0.2)" }}
                      whileTap={{ scale: 0.97 }}
                    >
                      Subscribe
                    </motion.button>
                  </motion.form>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Footer with improved social media links and Reddit */}
      <footer className={`py-12 ${theme === 'dark' ? 'bg-gray-900/95' : 'bg-gray-100/95'} backdrop-blur-sm relative z-10`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-y-8 md:gap-y-0 gap-x-8"> {/* Added gap-y for mobile */}
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
                  { href: "https://twitter.com", icon: FaTwitter },
                  { href: "https://facebook.com", icon: FaFacebookF },
                  { href: "https://instagram.com", icon: FaInstagram },
                  { href: "https://linkedin.com", icon: FaLinkedinIn },
                  { href: "https://reddit.com", icon: FaRedditAlien },
                ].map((social, index) => (
                  <motion.a
                    key={index}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`text-gray-400 hover:text-indigo-500 transition-colors duration-200`}
                    whileHover={{ scale: 1.2, rotate: 5 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <social.icon className="h-6 w-6" /> {/* Increased icon size slightly for better tap target */}
                  </motion.a>
                ))}
              </div>
            </div>

            <div className="col-span-1">
              <h3 className={`text-sm font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'} uppercase tracking-wider`}>
                Navigation
              </h3>
              <ul className="mt-4 space-y-2">
                <li><Link href="/homepage" className={`text-base ${theme === 'dark' ? 'text-gray-300 hover:text-white' : 'text-gray-500 hover:text-gray-900'} transition-colors duration-200`}>Home</Link></li>
                <li><Link href="/feed" className={`text-base ${theme === 'dark' ? 'text-gray-300 hover:text-white' : 'text-gray-500 hover:text-gray-900'} transition-colors duration-200`}>Feed</Link></li>
                <li><Link href="/explore" className={`text-base ${theme === 'dark' ? 'text-gray-300 hover:text-white' : 'text-gray-500 hover:text-gray-900'} transition-colors duration-200`}>Explore</Link></li>
                <li><Link href="/dashboard" className={`text-base ${theme === 'dark' ? 'text-gray-300 hover:text-white' : 'text-gray-500 hover:text-gray-900'} transition-colors duration-200`}>Dashboard</Link></li>
              </ul>
            </div>

            <div className="col-span-1">
              <h3 className={`text-sm font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'} uppercase tracking-wider`}>
                Resources
              </h3>
              <ul className="mt-4 space-y-2">
                <li><a href="#" className={`text-base ${theme === 'dark' ? 'text-gray-300 hover:text-white' : 'text-gray-500 hover:text-gray-900'} transition-colors duration-200`}>Writing Tips</a></li>
                <li><a href="#" className={`text-base ${theme === 'dark' ? 'text-gray-300 hover:text-white' : 'text-gray-500 hover:text-gray-900'} transition-colors duration-200`}>Style Guide</a></li>
                <li><a href="#" className={`text-base ${theme === 'dark' ? 'text-gray-300 hover:text-white' : 'text-gray-500 hover:text-gray-900'} transition-colors duration-200`}>FAQs</a></li>
                <li><a href="#" className={`text-base ${theme === 'dark' ? 'text-gray-300 hover:text-white' : 'text-gray-500 hover:text-gray-900'} transition-colors duration-200`}>Support</a></li>
              </ul>
            </div>

            <div className="col-span-1">
              <h3 className={`text-sm font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'} uppercase tracking-wider`}>
                Legal
              </h3>
              <ul className="mt-4 space-y-2">
                <li><a href="#" className={`text-base ${theme === 'dark' ? 'text-gray-300 hover:text-white' : 'text-gray-500 hover:text-gray-900'} transition-colors duration-200`}>Privacy Policy</a></li>
                <li><a href="#" className={`text-base ${theme === 'dark' ? 'text-gray-300 hover:text-white' : 'text-gray-500 hover:text-gray-900'} transition-colors duration-200`}>Terms of Service</a></li>
                <li><a href="#" className={`text-base ${theme === 'dark' ? 'text-gray-300 hover:text-white' : 'text-gray-500 hover:text-gray-900'} transition-colors duration-200`}>Cookie Policy</a></li>
              </ul>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-gray-700/50"> {/* Softer border */}
            <p className={`text-sm text-center ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
              © {new Date().getFullYear()} Talesy. All rights reserved.
            </p>
          </div>
        </div>
      </footer>

      {/* Floating scroll-to-top button */}
      {isMounted && (
        <motion.button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className={`fixed bottom-6 right-6 p-3 rounded-full ${theme === 'dark' ? 'bg-indigo-600' : 'bg-indigo-500'} text-white shadow-lg z-50 focus:outline-none focus:ring-2 focus:ring-offset-2 ${theme === 'dark' ? 'focus:ring-offset-gray-900' : 'focus:ring-offset-gray-50'} focus:ring-indigo-500`}
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
          <FaArrowUp className="w-6 h-6" /> {/* Used FaArrowUp icon */}
        </motion.button>
      )}
    </div>
  );
}