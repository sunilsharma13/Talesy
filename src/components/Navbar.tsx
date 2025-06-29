// components/navbar.tsx
// Yeh React component Talesy website ke liye navigation bar render karta hai.
// Isme user authentication, theme switching, search functionality,
// aur notification dropdown shamil hai.

"use client"; // Next.js App Router mein client-side rendering enable karne ke liye

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useSession, signOut } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation"; // useRouter import
import Link from "next/link"; // Next.js Link component for client-side transitions
import { motion, AnimatePresence } from "framer-motion"; // Animations ke liye

// IMPORTS FOR EXTERNAL LIBRARIES (IMPORTANT for resolving errors)
import { formatDistanceToNow, parseISO } from 'date-fns'; // date-fns functions (for date formatting)
import axios from 'axios'; // Axios for making HTTP requests
import toast from 'react-hot-toast'; // react-hot-toast for displaying notifications/toasts

// Heroicons ke icons imports
import {
  BellIcon, // Notification bell
  MagnifyingGlassIcon, // Search icon
  SunIcon, // Light theme icon
  MoonIcon, // Dark theme icon
  SparklesIcon, // "Talesy Accent" theme icon
  Bars3Icon, // Mobile menu open icon (hamburger)
  XMarkIcon, // Mobile menu close icon (X)
  UserCircleIcon, // Generic user icon (used in notification dropdown)
  ArrowRightOnRectangleIcon, // Sign Out icon
  Cog6ToothIcon, // Settings icon
  UserIcon, // Profile icon
  InboxStackIcon, // For Notifications link
  HomeIcon, // Home icon
  RectangleGroupIcon, // For Feed
  PencilSquareIcon, // For Write
  RocketLaunchIcon, // For Explore
  InformationCircleIcon, // For About
  ChatBubbleBottomCenterTextIcon, // Specific icon for comments
  HeartIcon, // Specific icon for likes
  UserPlusIcon, // Specific icon for follows
  EnvelopeIcon, // Specific icon for messages
} from "@heroicons/react/24/outline";

// --- Type Definitions ---
// Navigation links ke liye type
type NavLink = {
  name: string; // Link ka display naam
  href: string; // Link ka URL path (string type)
  icon: React.ElementType; // Mobile menu mein dikhane ke liye icon component
};

// Notification object ka structure
type Notification = {
  _id: string; // Notification ID
  message: string; // Notification message
  read: boolean; // Kya notification padh li gayi hai
  type: 'comment' | 'follow' | 'like' | 'message' | 'system'; // Specific types for filtering
  createdAt: string; // Notification creation date (ISO string format)
  link?: string; // Optional link jahan notification click karne par jaana hai
};

// Notification settings structure from user profile
interface NotificationSettings {
  comments: boolean;
  follows: boolean;
  likes: boolean;
  messages: boolean;
  system?: boolean;
}

// Theme types
type ThemeType = "dark" | "light" | "talesy-accent";

// Navbar component ka default export
export default function Navbar() {
  const { data: session } = useSession(); // User session data NextAuth.js se
  const pathname = usePathname(); // Current URL path Next.js se
  const router = useRouter(); // Next.js router instance for programmatic navigation

  // --- State Variables ---
  const [searchQuery, setSearchQuery] = useState(""); // Search input ki value
  const [dropdownOpen, setDropdownOpen] = useState(false); // User profile dropdown ki visibility
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false); // Mobile menu ki visibility
  const [notificationsOpen, setNotificationsOpen] = useState(false); // Notifications dropdown ki visibility
  const [theme, setTheme] = useState<ThemeType>("dark"); // Current theme state (default: dark)
  const [userName, setUserName] = useState("User"); // User ka naam display karne ke liye
  const [userAvatar, setUserAvatar] = useState("/default-avatar.png"); // User ka avatar URL
  const [isLoading, setIsLoading] = useState(true); // User profile loading state
  const [notifications, setNotifications] = useState<Notification[]>([]); // Navbar dropdown ke liye latest notifications
  const [hasNewNotifications, setHasNewNotifications] = useState(false); // Kya koi unread notification hai (red dot ke liye)

  // --- Refs for Click Outside Detection ---
  const dropdownRef = useRef<HTMLDivElement>(null); // User dropdown ke liye ref
  const mobileMenuRef = useRef<HTMLDivElement>(null); // Mobile menu ke liye ref
  const notificationsRef = useRef<HTMLDivElement>(null); // Notifications dropdown ke liye ref
  const searchInputRef = useRef<HTMLInputElement>(null); // Search input field ke liye ref

  // --- Theme Logic ---
  // Component mount hone par saved theme load karein ya system preference set karein
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as ThemeType;
    if (savedTheme) {
      setTheme(savedTheme);
    } else {
      const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      setTheme(prefersDark ? 'dark' : 'light');
    }
  }, []); // Empty array matlab sirf mount par run hoga

  // Theme state change hone par localStorage aur documentElement par update karein
  useEffect(() => {
    localStorage.setItem("theme", theme);
    document.documentElement.removeAttribute('data-theme'); // Purana data-theme attribute hatayein
    document.documentElement.setAttribute('data-theme', theme); // Naya data-theme attribute set karein
  }, [theme]); // Theme state change hone par run hoga

  // Theme cycle karne ke liye function
  const cycleTheme = useCallback(() => {
    setTheme((prevTheme) => {
      if (prevTheme === "dark") return "light"; // Dark se Light
      if (prevTheme === "light") return "talesy-accent"; // Light se Talesy Accent
      return "dark"; // Talesy Accent se Dark (cycle complete)
    });
  }, []);

  // Current theme ke hisaab se icon return karein
  const getThemeIcon = useCallback((currentTheme: ThemeType) => {
    if (currentTheme === "dark") return <MoonIcon className="h-5 w-5" />;
    if (currentTheme === "light") return <SunIcon className="h-5 w-5" />;
    return <SparklesIcon className="h-5 w-5 text-purple-400" />;
  }, []);

  // Current theme ke hisaab se button text return karein
  const getThemeButtonText = useCallback((currentTheme: ThemeType) => {
    if (currentTheme === "dark") return "Light Mode";
    if (currentTheme === "light") return "Talesy Mode";
    return "Dark Mode";
  }, []);

  // --- User Profile Fetch Logic ---
  const fetchUserProfile = useCallback(async () => {
    if (!session?.user?.id) { // Agar session ya user ID nahi hai, loading false karein
        setIsLoading(false);
        return;
    }
    setIsLoading(true); // Loading state on karein
    try {
      const res = await axios.get(`/api/users/${session.user.id}`); // User profile API call
      const userData = res.data;
      setUserName(userData.name || "User"); // User ka naam set karein
      // Avatar URL set karein, cache bust karne ke liye timestamp add karein
      setUserAvatar(userData.avatar ? `${userData.avatar}?t=${Date.now()}` : "/default-avatar.png");
    } catch (error) {
      console.error("Error fetching profile for navbar:", error);
      setUserName(session.user.name || "User"); // Error par session name use karein
      setUserAvatar(session.user.image || "/default-avatar.png"); // Error par session image use karein
    } finally {
      setIsLoading(false); // Loading state off karein
    }
  }, [session?.user?.id, session?.user?.name, session?.user?.image]); // Dependencies

  // --- Notifications Fetch Logic (with settings filtering) ---
  const fetchNotifications = useCallback(async () => {
    if (!session?.user?.id) { // Agar session ya user ID nahi hai
        setNotifications([]); // Notifications clear karein
        setHasNewNotifications(false); // Red dot remove karein
        return;
    }
    try {
      // 1. Fetch user's notification preferences from settings API
      const settingsRes = await axios.get('/api/user/settings');
      const userSettings: NotificationSettings = settingsRes.data.notificationSettings || {
        comments: true, follows: true, likes: true, messages: true, system: true
      };

      // 2. Fetch all notifications for the user
      const notificationsRes = await axios.get("/api/notifications");
      const fetchedData: Notification[] = notificationsRes.data;

      // 3. Filter notifications based on user settings
      const filteredNotifications = fetchedData.filter(notif => {
        switch (notif.type) {
          case 'comment': return userSettings.comments;
          case 'follow': return userSettings.follows;
          case 'like': return userSettings.likes;
          case 'message': return userSettings.messages;
          case 'system': return userSettings.system;
          default: return true; // Show unknown types by default
        }
      });

      // Sabse latest notifications upar dikhane ke liye sort karein
      filteredNotifications.sort((a, b) => parseISO(b.createdAt).getTime() - parseISO(a.createdAt).getTime());

      // Check overall unread status among *filtered* notifications (for red dot)
      setHasNewNotifications(filteredNotifications.some((notification) => !notification.read));

      // Notifications dropdown mein dikhane ke liye latest 3 filtered notifications lein
      let latestThree: Notification[] = [];
      const unreadFiltered = filteredNotifications.filter(n => !n.read); // Unread filtered notifications
      const readFiltered = filteredNotifications.filter(n => n.read); // Read filtered notifications

      latestThree = unreadFiltered.slice(0, 3); // Pehle 3 unread filtered notifications lein
      // Agar 3 se kam unread hain, toh bache hue slots ko read notifications se fill karein
      if (latestThree.length < 3) {
        latestThree = [...latestThree, ...readFiltered.slice(0, 3 - latestThree.length)];
      }
      
      setNotifications(latestThree); // State update karein

    } catch (error) {
      console.error("Error fetching notifications for navbar dropdown:", error);
      setNotifications([]);
      setHasNewNotifications(false);
      toast.error("Failed to load notifications."); // User-friendly toast
    }
  }, [session?.user?.id]); // Depend on session ID to refetch on login/logout

  // Component mount aur session change par user profile aur notifications fetch karein
  useEffect(() => {
    if (session) {
      fetchUserProfile();
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 30000); // Har 30 seconds mein notifications refresh karein
      return () => clearInterval(interval); // Component unmount par interval clear karein
    } else {
      // Agar user logged out hai toh states reset karein
      setUserName("User");
      setUserAvatar("/default-avatar.png");
      setIsLoading(false);
      setNotifications([]);
      setHasNewNotifications(false);
    }
  }, [session, fetchUserProfile, fetchNotifications]);


  // --- Click Outside Logic ---
  // Dropdowns ko band karne ke liye click outside event listener
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // User dropdown
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
      // Mobile menu
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
        setMobileMenuOpen(false);
      }
      // Notifications dropdown
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setNotificationsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside); // Mousedown event listener add karein
    return () => {
      document.removeEventListener("mousedown", handleClickOutside); // Cleanup
    };
  }, []);

  // --- Mark visible notifications as read when dropdown opens ---
  const markAllDisplayedNotificationsAsRead = useCallback(async () => {
    // Get _id of currently displayed UNREAD notifications in the dropdown
    const unreadDisplayedIds = notifications.filter(n => !n.read).map(n => n._id);

    if (unreadDisplayedIds.length === 0) return; // Agar koi unread nahi hai toh return karein

    try {
      // Call the API to mark these specific notifications as read
      // Assuming you have a PUT endpoint at /api/notifications/mark-read that accepts an array of IDs
      await axios.put("/api/notifications/mark-read", { notificationIds: unreadDisplayedIds, markAsRead: true });
      
      // Optimistically update the UI: mark these as read in local state
      setNotifications((prev) => 
        prev.map((notif) => 
          unreadDisplayedIds.includes(notif._id) ? { ...notif, read: true } : notif
        )
      );
      // Re-fetch ALL notifications to accurately update the red dot status (hasNewNotifications)
      fetchNotifications(); 

    } catch (error) {
      console.error("Error marking notifications as read:", error);
      toast.error("Failed to mark notifications as read.");
    }
  }, [notifications, fetchNotifications, session?.user?.id]); // Dependencies

  // Toggle functions for dropdowns
  const toggleDropdown = useCallback(() => setDropdownOpen((prev) => !prev), []);
  const toggleMobileMenu = useCallback(() => setMobileMenuOpen((prev) => !prev), []);
  
  // Notifications dropdown toggle function
  const toggleNotifications = useCallback(() => {
    const newState = !notificationsOpen; // Calculate new state (open/close)
    setNotificationsOpen(newState); // Update notifications dropdown state
    if (newState && hasNewNotifications) { // Agar dropdown open ho raha hai aur koi nayi notification hai
      markAllDisplayedNotificationsAsRead(); // Toh unko read mark karein
    }
  }, [notificationsOpen, hasNewNotifications, markAllDisplayedNotificationsAsRead]);


  // Handle search form submission
  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault(); // Prevent default form submission (page reload)
    if (searchQuery.trim()) { // If search query is not empty
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}` as any); // Type assertion 'as any'
      setSearchQuery(""); // Clear search bar
      if (mobileMenuOpen) setMobileMenuOpen(false); // Mobile menu band karein agar open hai
    }
  }, [searchQuery, router, mobileMenuOpen]);

  // Handle click on a single notification item in the dropdown
  const handleNotificationItemClick = useCallback((notification: Notification) => {
    if (!notification.read) { // Agar the clicked notification is unread
      markAllDisplayedNotificationsAsRead(); // Toh use read mark karein
    }
    
    const linkToNavigate = notification.link; // Notification ka link lein

    // Validate link before navigating
    if (typeof linkToNavigate === 'string' && linkToNavigate.trim().length > 0) {
      try {
        router.push(linkToNavigate as any); // Type assertion 'as any'
      } catch (navigationError: any) {
        console.error("ERROR: Failed to navigate using router.push:", navigationError);
        toast.error("Failed to navigate to content.");
      }
    } else {
      // If no valid link, show a toast
      toast('This notification does not have a clickable link.', { icon: 'ℹ️' });
    }
    setNotificationsOpen(false); // Close the notification dropdown after click
  }, [router, markAllDisplayedNotificationsAsRead]);


  // Helper to get icon based on notification type
  const getNotificationIcon = useCallback((type: Notification['type']) => {
    switch (type) {
      case 'comment': return <ChatBubbleBottomCenterTextIcon className="h-4 w-4" />;
      case 'follow': return <UserPlusIcon className="h-4 w-4" />;
      case 'like': return <HeartIcon className="h-4 w-4" />;
      case 'message': return <EnvelopeIcon className="h-4 w-4" />; // Using Envelope for messages
      case 'system': return <Cog6ToothIcon className="h-4 w-4" />;
      default: return <BellIcon className="h-4 w-4" />; // Default fallback icon
    }
  }, []); // Icons are static, so empty dependency array

  // Navigation links for desktop and mobile menus
  const navLinks: NavLink[] = [
    { name: "Home", href: "/homepage", icon: HomeIcon },
    { name: "Feed", href: "/feed", icon: RectangleGroupIcon },
    { name: "Write", href: "/write/new", icon: PencilSquareIcon },
    { name: "Explore", href: "/explore", icon: RocketLaunchIcon },
    { name: "About", href: "/about", icon: InformationCircleIcon },
  ];

  // Function to check if a navigation link is active based on current pathname
  const isActive = useCallback((path: string) => {
    // Checks for exact match or if current path starts with the link path (for sub-pages)
    return pathname === path || pathname.startsWith(`${path}/`);
  }, [pathname]);

  return (
    <nav className="relative w-full sticky top-0 z-50">
      <div className="relative z-50 bg-[var(--background-primary)] bg-opacity-90 backdrop-filter backdrop-blur-lg shadow-lg transition-colors duration-500 w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex justify-between items-center">
          <div className="flex items-center">
            {/* Logo and Site Name */}
            <Link
              href="/landing"
              className="flex items-center gap-2 transform transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)] rounded-md py-1"
            >
              <motion.img
                src="/logo.png"
                alt="Talesy Logo"
                className="w-8 h-8 object-contain"
                initial={{ scale: 0.9, opacity: 0.8 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.3 }}
              />
              <motion.span
                className="text-xl font-bold select-none text-[var(--text-primary)]"
                initial={{ opacity: 0.8, x: -5 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2, duration: 0.3 }}
              >
                Talesy <span className="text-[var(--accent-color)] animate-pulse">✦</span>
              </motion.span>
            </Link>

            {/* Desktop Navigation Links */}
            <div className="hidden md:ml-6 lg:ml-8 md:flex space-x-2 lg:space-x-4">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href as any} // Type assertion 'as any' for href
                  className={`inline-flex items-center px-3 py-2 font-medium text-sm rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)] group ${
                    isActive(link.href)
                      ? "bg-[var(--active-bg)] text-[var(--accent-color)]"
                      : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--hover-bg)]"
                  }`}
                >
                  <motion.span whileHover={{ scale: 1.05 }} transition={{ duration: 0.2 }}>
                    {link.name}
                  </motion.span>
                </Link>
              ))}
            </div>
          </div>

          <div className="hidden md:flex md:items-center md:gap-4">
            {/* Theme Toggle Button */}
            <motion.button
              onClick={cycleTheme}
              className="p-2 rounded-full focus:outline-none transition-colors duration-300 bg-[var(--hover-bg)] text-[var(--text-secondary)] hover:bg-[var(--accent-color)] hover:text-[var(--active-text)]"
              aria-label="Toggle Theme"
              whileTap={{ scale: 0.9 }}
              title={`Switch to ${getThemeButtonText(theme)}`}
            >
              {getThemeIcon(theme)}
            </motion.button>

            {/* Desktop Search Bar (Responsive with right-side button) */}
            {/* hidden on small, flex on md, width controlled for responsiveness */}
            <form onSubmit={handleSearch} className="relative hidden md:flex w-48 lg:w-64 xl:w-72">
                <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search..."
                    // Increased pr- value to make space for the button
                    className="w-full py-2 pl-3 pr-10 rounded-full text-sm border-2 border-[var(--border-color)] bg-[var(--background-primary)] text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)] transition-colors duration-300"
                />
                {/* Search button with icon on the right */}
                <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 p-1 focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)] rounded-full text-[var(--text-secondary)] hover:text-[var(--accent-color)] transition-colors duration-200" aria-label="Perform Search">
                    <MagnifyingGlassIcon className="h-5 w-5" />
                </button>
            </form>

            {/* Notification Icon and Dropdown (Visible only if user is logged in) */}
            {session && (
                <div className="relative" ref={notificationsRef}>
                <motion.button
                    onClick={toggleNotifications}
                    className="relative p-2 rounded-full focus:outline-none transition-colors duration-300 bg-[var(--hover-bg)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--accent-color)] hover:text-white"
                    whileTap={{ scale: 0.95 }}
                    aria-label="Notifications"
                >
                    <BellIcon className="h-5 w-5" />
                    <AnimatePresence>
                    {hasNewNotifications && ( // Only show red dot if there are unread notifications
                        <motion.span
                        className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-[var(--background-primary)]"
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        transition={{ duration: 0.5 }}
                        ></motion.span>
                    )}
                    </AnimatePresence>
                </motion.button>

                <AnimatePresence>
                    {notificationsOpen && (
                    <motion.div
                        className="absolute right-0 mt-3 w-72 bg-[var(--background-secondary)] text-[var(--text-primary)] border border-[var(--border-color)] rounded-md shadow-lg z-50 overflow-hidden"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                    >
                        <div className="p-3 bg-[var(--hover-bg)] border-b border-[var(--border-color)]">
                        <h3 className="text-sm font-medium text-[var(--text-primary)]">Notifications</h3>
                        </div>
                        <div className="max-h-96 overflow-y-auto custom-scrollbar">
                        {notifications.length === 0 ? (
                            <div className="p-4 text-center text-sm text-[var(--text-secondary)]">
                            No notifications yet
                            </div>
                        ) : (
                            <div>
                            {/* Map through notifications to display */}
                            {notifications.map((notification) => (
                                <motion.div
                                key={notification._id}
                                className={`p-3 border-b border-[var(--border-color)] hover:bg-[var(--hover-bg)] flex items-start cursor-pointer ${!notification.read ? 'bg-[var(--active-bg)]' : ''}`}
                                onClick={() => handleNotificationItemClick(notification)} // Click handler for item
                                whileHover={{ scale: 1.01 }}
                                whileTap={{ scale: 0.99 }}
                                >
                                <div className="flex-shrink-0 mr-3 mt-0.5 text-[var(--accent-color)]">
                                    {getNotificationIcon(notification.type)}
                                </div>
                                <div className="flex-1 text-sm">
                                    <p className="text-[var(--text-primary)] mb-0.5">{notification.message}</p>
                                    <p className="text-[var(--text-secondary)] text-xs">
                                    {formatDistanceToNow(parseISO(notification.createdAt), { addSuffix: true })}
                                    </p>
                                </div>
                                {!notification.read && (
                                    <div className="flex-shrink-0 ml-2 mt-1">
                                    <span className="block h-2 w-2 rounded-full bg-red-500" title="Unread"></span>
                                    </div>
                                )}
                                </motion.div>
                            ))}
                            </div>
                        )}
                        </div>
                        <Link
                        href="/notifications"
                        className="block p-2 text-xs text-center font-medium text-[var(--accent-color)] hover:bg-[var(--hover-bg)] transition-colors"
                        onClick={() => {
                            setNotificationsOpen(false); // Close dropdown
                            markAllDisplayedNotificationsAsRead(); // Mark visible as read
                        }}
                        >
                        View all notifications
                        </Link>
                    </motion.div>
                    )}
                </AnimatePresence>
                </div>
            )}

            {/* User Profile Dropdown (Visible only if user is logged in) */}
            {session && (
                <div className="relative" ref={dropdownRef}>
                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-[var(--text-primary)] hidden lg:block">
                    {userName}
                    </span>
                    <motion.button
                    onClick={toggleDropdown}
                    className="focus:outline-none rounded-full border-2 border-[var(--accent-color)] p-0.5 overflow-hidden transition-transform hover:scale-105"
                    whileTap={{ scale: 0.95 }}
                    aria-label="User menu"
                    >
                    {isLoading ? (
                        <div className="w-8 h-8 bg-[var(--hover-bg)] animate-pulse rounded-full"></div>
                    ) : (
                        <img
                        src={userAvatar}
                        alt="User Avatar"
                        className="w-8 h-8 rounded-full object-cover"
                        onError={(e) => {
                            e.currentTarget.src = "/default-avatar.png";
                        }}
                        />
                    )}
                    </motion.button>
                </div>

                <AnimatePresence>
                    {dropdownOpen && (
                    <motion.div
                        className="absolute right-0 mt-3 w-48 bg-[var(--background-secondary)] text-[var(--text-primary)] border border-[var(--border-color)] rounded-md shadow-lg z-50 overflow-hidden"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                    >
                        <div className="py-1">
                        <Link
                            href="/profile"
                            className="flex items-center px-4 py-2 text-sm hover:bg-[var(--hover-bg)] transition-colors"
                            onClick={() => setDropdownOpen(false)}
                        >
                            <UserIcon className="h-4 w-4 mr-2 text-[var(--text-secondary)]" /> Your Profile
                        </Link>
                        <Link
                            href="/dashboard"
                            className="flex items-center px-4 py-2 text-sm hover:bg-[var(--hover-bg)] transition-colors"
                            onClick={() => setDropdownOpen(false)}
                        >
                            <InboxStackIcon className="h-4 w-4 mr-2 text-[var(--text-secondary)]" /> Dashboard
                        </Link>
                        <Link
                            href="/settings"
                            className="flex items-center px-4 py-2 text-sm hover:bg-[var(--hover-bg)] transition-colors"
                            onClick={() => setDropdownOpen(false)}
                        >
                            <Cog6ToothIcon className="h-4 w-4 mr-2 text-[var(--text-secondary)]" /> Settings
                        </Link>
                        <hr className="my-1 border-[var(--border-color)]" />
                        <button
                            onClick={() => {
                            setDropdownOpen(false);
                            signOut();
                            }}
                            className="w-full text-left flex items-center px-4 py-2 text-sm text-[var(--red-color)] hover:bg-[var(--hover-bg)] transition-colors"
                        >
                            <ArrowRightOnRectangleIcon className="h-4 w-4 mr-2 text-[var(--red-color)]" /> Sign Out
                        </button>
                        </div>
                    </motion.div>
                    )}
                </AnimatePresence>
                </div>
            )}

            {/* Sign In Button (Visible only if user is NOT logged in) */}
            {!session && (
                <div className="hidden md:flex items-center ml-4 space-x-2">
                    <Link
                        href="/login" // Your only login/auth page
                        className="px-4 py-2 text-sm font-medium rounded-full bg-[var(--accent-color)] text-[var(--active-text)] hover:bg-[var(--accent-color-hover)] transition-colors"
                    >
                        Login
                    </Link>
                </div>
            )}

          </div>

          {/* Mobile menu button and search icon */}
          <div className="-mr-2 flex md:hidden items-center gap-2">
            <motion.button
              onClick={() => {
                setMobileMenuOpen(prev => !prev); // Toggle mobile menu to show search input
                setTimeout(() => searchInputRef.current?.focus(), 300); // Focus search input after animation
              }}
              className="p-2 rounded-full focus:outline-none transition-colors duration-300 bg-[var(--hover-bg)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              aria-label="Search"
              whileTap={{ scale: 0.9 }}
            >
              <MagnifyingGlassIcon className="h-6 w-6" />
            </motion.button>
            <motion.button
              onClick={toggleMobileMenu}
              className="inline-flex items-center justify-center p-2 rounded-md bg-[var(--hover-bg)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] focus:outline-none"
              aria-expanded={mobileMenuOpen}
              whileTap={{ scale: 0.9 }}
              aria-label="Open mobile menu"
            >
              {mobileMenuOpen ? ( // Icon mobile menu open/close state ke hisaab se
                <XMarkIcon className="h-6 w-6" />
              ) : (
                <Bars3Icon className="h-6 w-6" />
              )}
            </motion.button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            className="md:hidden fixed inset-0 top-16 bg-[var(--background-secondary)] z-40 flex flex-col"
            ref={mobileMenuRef}
            initial={{ x: "100%" }}
            animate={{ x: "0%" }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <div className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">

              {/* Mobile Search Bar */}
              <motion.div initial={{ y: -10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }}>
                <form onSubmit={handleSearch} className="w-full relative mb-4">
                    <input
                        ref={searchInputRef}
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search..."
                        className="w-full py-2 pl-3 pr-10 rounded-full text-base border-2 border-[var(--border-color)] bg-[var(--background-primary)] text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)] transition-colors duration-300"
                    />
                    {/* Search button with icon on the right (for mobile too) */}
                    <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 p-1 focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)] rounded-full text-[var(--text-secondary)] hover:text-[var(--accent-color)] transition-colors duration-200" aria-label="Perform Search">
                        <MagnifyingGlassIcon className="h-5 w-5" />
                    </button>
                </form>
              </motion.div>

              {/* Mobile Theme Toggle */}
              <motion.div className="px-3 py-2 flex justify-between items-center bg-[var(--hover-bg)] rounded-md" initial={{ y: -10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.15 }}>
                <span className="text-base font-medium text-[var(--text-primary)]">
                  Theme
                </span>
                <motion.button
                  onClick={cycleTheme}
                  className="px-4 py-2 rounded-lg text-sm bg-[var(--accent-color)] text-[var(--active-text)] hover:opacity-90"
                  whileTap={{ scale: 0.95 }}
                  aria-label="Toggle Theme"
                >
                  {getThemeButtonText(theme)}
                </motion.button>
              </motion.div>

              {/* Mobile Nav Links */}
              {navLinks.map((link, index) => {
                const Icon = link.icon;
                return (
                  <motion.div key={link.name} initial={{ x: -10, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.2 + index * 0.05 }}>
                    <Link
                      href={link.href as any} // Type assertion 'as any' for href
                      className={`block px-3 py-2 rounded-md text-base font-medium no-underline flex items-center gap-2 ${
                        isActive(link.href)
                          ? 'bg-[var(--active-bg)] text-[var(--accent-color)]'
                          : 'text-[var(--text-primary)] hover:bg-[var(--hover-bg)]'
                      }`}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Icon className="h-5 w-5" /> {link.name}
                    </Link>
                  </motion.div>
                );
              })}

              {/* Mobile User Section (visible if logged in) */}
              {session ? (
                <motion.div
                  className="mt-4 pt-4 border-t border-[var(--border-color)]"
                  initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }}
                >
                  <div className="flex items-center px-3">
                    {isLoading ? (
                      <div className="w-10 h-10 bg-[var(--hover-bg)] animate-pulse rounded-full mr-3"></div>
                    ) : (
                      <img
                        src={userAvatar}
                        alt="User Avatar"
                        className="w-10 h-10 rounded-full object-cover"
                        onError={(e) => { e.currentTarget.src = "/default-avatar.png"; }}
                      />
                    )}
                    <div>
                      <div className="text-base font-medium text-[var(--text-primary)]">
                        {userName}
                      </div>
                      {session?.user?.email && (
                        <div className="text-sm font-medium text-[var(--text-secondary)] truncate max-w-[200px]">
                          {session.user.email}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="mt-3 space-y-1">
                    <Link
                      href="/profile"
                      className="block px-3 py-2 rounded-md text-base font-medium text-[var(--text-primary)] hover:bg-[var(--hover-bg)] flex items-center gap-2"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <UserIcon className="h-5 w-5 text-[var(--text-secondary)]" /> Your Profile
                    </Link>
                    <Link
                      href="/notifications"
                      className="block px-3 py-2 rounded-md text-base font-medium text-[var(--text-primary)] hover:bg-[var(--hover-bg)] flex items-center gap-2"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <BellIcon className="h-5 w-5 text-[var(--text-secondary)]" /> Notifications
                      {hasNewNotifications && (
                        <span className="ml-2 inline-block w-2 h-2 bg-red-500 rounded-full"></span>
                      )}
                    </Link>
                    <Link
                      href="/settings"
                      className="block px-3 py-2 rounded-md text-base font-medium text-[var(--text-primary)] hover:bg-[var(--hover-bg)] flex items-center gap-2"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Cog6ToothIcon className="h-5 w-5 text-[var(--text-secondary)]" /> Settings
                    </Link>
                    <button
                      onClick={() => {
                        setMobileMenuOpen(false);
                        signOut();
                      }}
                      className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-[var(--red-color)] hover:bg-[var(--hover-bg)] flex items-center gap-2"
                    >
                      <ArrowRightOnRectangleIcon className="h-5 w-5 text-[var(--red-color)]" /> Sign Out
                    </button>
                  </div>
                </motion.div>
              ) : ( // Mobile Login button if not logged in
                <motion.div className="mt-4 pt-4 border-t border-[var(--border-color)]" initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }}>
                    <Link
                        href="/login" // Your login page
                        className="block w-full px-3 py-2 rounded-md text-base font-medium text-center bg-[var(--accent-color)] text-[var(--active-text)] hover:bg-[var(--accent-color-hover)] transition-colors mb-2"
                        onClick={() => setMobileMenuOpen(false)}
                    >
                        Login
                    </Link>
                </motion.div>
              )}
            </div>
            <div className="flex justify-center p-4 border-t border-[var(--border-color)]">
                <motion.button
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-3 rounded-full bg-[var(--hover-bg)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] focus:outline-none"
                    whileTap={{ scale: 0.9 }}
                    aria-label="Close mobile menu"
                >
                    <XMarkIcon className="h-6 w-6" />
                </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}