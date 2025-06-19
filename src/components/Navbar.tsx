// components/navbar.tsx
"use client"; // This is correct and necessary

import React, { useState, useEffect, useRef } from "react";
import { useSession, signOut } from "next-auth/react";
import { usePathname } from "next/navigation"; // Correct for App Router
import Link from "next/link"; // Correct import for Next.js Link component
import { motion, AnimatePresence } from "framer-motion"; // For animations

// Define types for better readability and safety
type NavLink = {
  name: string;
  href: string;
};

type Notification = {
  _id: string;
  message: string;
  read: boolean;
  type: string;
  createdAt: string;
};

export default function Navbar() {
  const { data: session } = useSession();
  const pathname = usePathname();

  // State variables for UI elements and data
  const [searchQuery, setSearchQuery] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [theme, setTheme] = useState<"dark" | "light">("dark"); // Default theme

  // Refs for click-outside detection to close menus
  const dropdownRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);

  // User profile and notification data
  const [userName, setUserName] = useState("User");
  const [userAvatar, setUserAvatar] = useState("/default-avatar.png");
  const [isLoading, setIsLoading] = useState(false); // Loading state for user profile
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [hasNewNotifications, setHasNewNotifications] = useState(false);

  // --- Theme Management ---
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "light" || savedTheme === "dark") {
      setTheme(savedTheme);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("theme", theme);
    // Ensure you have these CSS classes defined, or adjust as needed for your setup
    document.documentElement.classList.remove("dark-theme", "light-theme");
    document.documentElement.classList.add(`${theme}-theme`);
    document.documentElement.setAttribute('data-theme', theme); // For Tailwind config or CSS variables
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === "dark" ? "light" : "dark"));
  };

  // --- Data Fetching (User Profile & Notifications) ---
  const fetchUserProfile = async () => {
    if (!session?.user?.email) return;

    try {
      setIsLoading(true);
      const res = await fetch("/api/users/profile"); // Ensure this API endpoint exists and works

      if (!res.ok) {
        console.error(`Failed to fetch profile: ${res.status} ${res.statusText}`);
        throw new Error("Failed to fetch profile");
      }

      const data = await res.json();
      if (data.user) {
        setUserName(data.user.name || session.user.name || "User");
        setUserAvatar(data.user.avatar ? `${data.user.avatar}?t=${Date.now()}` : (session.user.image || "/default-avatar.png"));
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      // Fallback in case of API error
      setUserName(session.user.name || "User");
      setUserAvatar(session.user.image || "/default-avatar.png");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchNotifications = async () => {
    if (!session?.user?.id) return;

    try {
      const res = await fetch("/api/notifications"); // Ensure this API endpoint exists and works
      if (res.ok) {
        const data: Notification[] = await res.json();
        setNotifications(data);
        setHasNewNotifications(data.some((notification) => !notification.read));
      } else {
        console.error(`Failed to fetch notifications: ${res.status} ${res.statusText}`);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  };

  useEffect(() => {
    if (session) {
      fetchUserProfile();
      fetchNotifications();
    }

    // --- Click Outside Handlers for dropdowns/menus ---
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
        setMobileMenuOpen(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setNotificationsOpen(false);
      }
    };

    // --- Custom Event Listener for Profile Updates (if dispatched from other components) ---
    // Make sure this custom event is dispatched correctly elsewhere if needed
    const handleProfileUpdated = (event: Event) => {
      const customEvent = event as CustomEvent;
      const { name, avatar } = customEvent.detail || {};
      if (name) setUserName(name);
      if (avatar) setUserAvatar(`${avatar}?t=${Date.now()}`);
      fetchUserProfile(); // Re-fetch full profile to ensure consistency
    };

    // Add event listeners
    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("profileUpdated", handleProfileUpdated as EventListener); // Cast as EventListener
    // Make sure your custom event dispatch looks like:
    // const event = new CustomEvent('profileUpdated', { detail: { name: 'New Name' } });
    // window.dispatchEvent(event);

    // Cleanup on component unmount
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("profileUpdated", handleProfileUpdated as EventListener);
    };
  }, [session]); // Re-run effect if session changes (login/logout)

  // --- Notification Actions ---
  const markNotificationsAsRead = async () => {
    if (!session?.user?.id || notifications.length === 0) return;

    try {
      const res = await fetch("/api/notifications/mark-read", {
        method: "POST",
      });
      if (res.ok) {
        setNotifications((prev) => prev.map((notification) => ({ ...notification, read: true })));
        setHasNewNotifications(false);
      } else {
        console.error(`Failed to mark notifications as read: ${res.status} ${res.statusText}`);
      }
    } catch (error) {
      console.error("Error marking notifications as read:", error);
    }
  };

  // --- UI Toggle Handlers ---
  const toggleDropdown = () => setDropdownOpen((prev) => !prev);
  const toggleMobileMenu = () => setMobileMenuOpen((prev) => !prev);
  const toggleNotifications = () => {
    const newState = !notificationsOpen;
    setNotificationsOpen(newState);
    if (newState && hasNewNotifications) {
      markNotificationsAsRead();
    }
  };

  // --- Search Handler ---
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Using window.location.href for a full page reload, or router.push for client-side navigation
      window.location.href = `/search?q=${encodeURIComponent(searchQuery.trim())}`;
      setSearchQuery("");
    }
  };

  // --- Navigation Link Data ---
  const navLinks: NavLink[] = [
    { name: "Home", href: "/homepage" },
    { name: "Feed", href: "/feed" },
    { name: "Write", href: "/write/new" },
    { name: "Explore", href: "/explore" },
    { name: "Pricing", href: "/pricing" },
    { name: "About", href: "/about" },
  ];

  // Helper to determine active link for styling
  const isActive = (path: string) => {
    return pathname === path;
  };

  // Dynamic background styling based on current theme
  const navBarBg = theme === 'dark'
    ? "bg-gradient-to-r from-[#0e0e2c] via-[#1a1a3a] to-[#252550]"
    : "bg-white border-b border-gray-200 text-gray-800";

  // --- Component JSX ---
  return (
    <nav className={`${navBarBg} shadow-lg sticky top-0 z-50 transition-colors duration-300`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">

          {/* Logo and Desktop Navigation */}
          <div className="flex items-center">
            <Link
              href="/landing" // Link to your landing or home page
              className="flex items-center gap-2 transform transition-transform hover:scale-105 focus:outline-none"
            >
              <motion.img
                src={theme === 'dark' ? "/logo.png" : "/logo-dark.png"}
                alt="Talesy Logo"
                className="w-10 h-10 object-contain rounded-md shadow"
                initial={{ scale: 0.9, opacity: 0.8 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.3 }}
              />
              <motion.span
                className={`text-xl font-bold select-none ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}
                initial={{ opacity: 0.8, x: -5 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2, duration: 0.3 }}
              >
                Talesy <span className="text-yellow-300 animate-pulse">✦</span>
              </motion.span>
            </Link>

            {/* Desktop Navigation Links */}
            <div className="hidden md:ml-8 md:flex space-x-4">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  // @ts-ignore
                  // eslint-disable-next-line @next/next/no-img-element, @next/next/no-html-link-for-pages, @typescript-eslint/ban-ts-comment
                  href={link.href}
                  className={`inline-flex items-center px-2 py-1 font-medium transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-indigo-300 rounded-md ${
                    isActive(link.href)
                      ? theme === 'dark'
                          ? "text-white border-b-2 border-indigo-300"
                          : "text-indigo-700 border-b-2 border-indigo-500"
                      : theme === 'dark'
                          ? "text-gray-300 hover:text-white hover:border-b-2 hover:border-indigo-400/50"
                          : "text-gray-600 hover:text-gray-900 hover:border-b-2 hover:border-indigo-300/50"
                  }`}
                >
                  <motion.span whileHover={{ scale: 1.05 }} transition={{ duration: 0.2 }}>
                    {link.name}
                  </motion.span>
                </Link>
              ))}
            </div>
          </div>

          {/* Right Section: Theme Toggle, Search, Notifications, User Dropdown */}
          <div className="hidden md:flex md:items-center md:gap-4">
            {/* Theme Toggle Button */}
            <motion.button
              onClick={toggleTheme}
              className={`p-2 rounded-full focus:outline-none transition-colors duration-300 ${
                theme === 'dark'
                  ? 'bg-gray-700 hover:bg-gray-600 text-yellow-300'
                  : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
              }`}
              aria-label="Toggle Theme"
              whileTap={{ scale: 0.9 }}
            >
              {theme === 'dark' ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                </svg>
              )}
            </motion.button>

            {/* Search Bar */}
            <motion.form
              onSubmit={handleSearch}
              className="relative"
              initial={{ opacity: 0.8 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search stories..."
                className={`w-64 px-4 py-2 text-sm ${
                  theme === 'dark'
                    ? 'bg-white/10 border border-white/20 placeholder-white/60 text-white'
                    : 'bg-gray-100 border border-gray-300 placeholder-gray-500 text-gray-900'
                } rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors duration-300`}
              />
              <button
                type="submit"
                className={`absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 ${
                  theme === 'dark' ? 'text-white/70 hover:text-white' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </button>
            </motion.form>

            {/* Notifications Icon and Dropdown */}
            <div className="relative" ref={notificationsRef}>
              <motion.button
                onClick={toggleNotifications}
                className="relative p-1 focus:outline-none transition-transform hover:scale-110"
                whileTap={{ scale: 0.95 }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className={`h-6 w-6 ${theme === 'dark' ? 'text-white/80 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                  />
                </svg>
                <AnimatePresence>
                  {hasNewNotifications && (
                    <motion.span
                      className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white"
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
                    className={`absolute right-0 mt-3 w-72 ${theme === 'dark' ? 'bg-gray-800 text-white border-gray-700' : 'bg-white text-gray-800 border-gray-200'} rounded-md shadow-lg z-50 overflow-hidden`}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className={`p-3 ${theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'} border-b`}>
                      <h3 className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-700'}`}>Notifications</h3>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className={`p-4 text-center text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                          No notifications yet
                        </div>
                      ) : (
                        <div>
                          {notifications.map((notification) => (
                            <div
                              key={notification._id}
                              className={`p-3 border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-100'} hover:${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'} ${!notification.read ? (theme === 'dark' ? 'bg-blue-900/30' : 'bg-blue-50') : ''}`}
                            >
                              <div className="flex items-start">
                                {notification.type === 'follow' && (
                                  <div className={`rounded-full p-2 mr-3 ${theme === 'dark' ? 'bg-indigo-700' : 'bg-indigo-100'}`}>
                                    <svg className={`h-4 w-4 ${theme === 'dark' ? 'text-indigo-300' : 'text-indigo-600'}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                  </div>
                                )}
                                <div className="flex-1 text-sm">
                                  <p className={`${theme === 'dark' ? 'text-white' : 'text-gray-900'} mb-0.5`}>{notification.message}</p>
                                  <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} text-xs`}>
                                    {new Date(notification.createdAt).toLocaleString()}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <Link
                      // @ts-ignore
                      // eslint-disable-next-line @next/next/no-img-element, @next/next/no-html-link-for-pages, @typescript-eslint/ban-ts-comment
                      href="/notifications"
                      className={`block p-2 text-xs text-center font-medium ${theme === 'dark' ? 'text-indigo-300 hover:bg-gray-700 hover:text-white' : 'text-indigo-600 hover:bg-gray-100 hover:text-indigo-800'}`}
                      onClick={() => setNotificationsOpen(false)}
                    >
                      View all notifications
                    </Link>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* User Profile and Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <div className="flex items-center gap-2">
                <span className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
                  {userName}
                </span>
                <motion.button
                  onClick={toggleDropdown}
                  className="focus:outline-none rounded-full border-2 border-indigo-400 p-0.5 overflow-hidden transition-transform hover:scale-105"
                  whileTap={{ scale: 0.95 }}
                >
                  {isLoading ? (
                    <div className="w-8 h-8 bg-gray-300 animate-pulse rounded-full"></div>
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
                    className={`absolute right-0 mt-3 w-48 ${theme === 'dark' ? 'bg-gray-800 text-white border-gray-700' : 'bg-white text-gray-800 border-gray-200'} rounded-md shadow-lg z-50 overflow-hidden`}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="py-1">
                      <Link
                        // @ts-ignore
                        // eslint-disable-next-line @next/next/no-img-element, @next/next/no-html-link-for-pages, @typescript-eslint/ban-ts-comment
                        href="/profile"
                        className={`block px-4 py-2 text-sm ${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} transition`}
                        onClick={() => setDropdownOpen(false)}
                      >
                        Your Profile
                      </Link>
                      <Link
                        // @ts-ignore
                        // eslint-disable-next-line @next/next/no-img-element, @next/next/no-html-link-for-pages, @typescript-eslint/ban-ts-comment
                        href="/dashboard"
                        className={`block px-4 py-2 text-sm ${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} transition`}
                        onClick={() => setDropdownOpen(false)}
                      >
                        Dashboard
                      </Link>
                      <Link
                        // @ts-ignore
                        // eslint-disable-next-line @next/next/no-img-element, @next/next/no-html-link-for-pages, @typescript-eslint/ban-ts-comment
                        href="/settings"
                        className={`block px-4 py-2 text-sm ${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} transition`}
                        onClick={() => setDropdownOpen(false)}
                      >
                        Settings
                      </Link>
                      <hr className={`my-1 ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`} />
                      <button
                        onClick={() => {
                          setDropdownOpen(false);
                          signOut();
                        }}
                        className={`w-full text-left px-4 py-2 text-sm ${theme === 'dark' ? 'text-red-400 hover:bg-gray-700' : 'text-red-600 hover:bg-gray-100'} transition`}
                      >
                        Sign Out
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Mobile Menu Button (Hamburger) */}
          <div className="-mr-2 flex md:hidden">
            <motion.button
              onClick={toggleMobileMenu}
              className={`inline-flex items-center justify-center p-2 rounded-md ${
                theme === 'dark'
                  ? 'text-gray-300 hover:text-white hover:bg-indigo-800'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              } focus:outline-none`}
              aria-expanded={mobileMenuOpen}
              whileTap={{ scale: 0.9 }}
            >
              <span className="sr-only">Open main menu</span>
              <svg
                className={`${mobileMenuOpen ? 'hidden' : 'block'} h-6 w-6`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
              <svg
                className={`${mobileMenuOpen ? 'block' : 'hidden'} h-6 w-6`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </motion.button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Content (animated) */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            className="md:hidden"
            ref={mobileMenuRef}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <div className={`px-2 pt-2 pb-3 space-y-1 sm:px-3 ${theme === 'dark' ? 'bg-[#1a1a3a]' : 'bg-gray-50'} shadow-lg`}>
              {/* Mobile Search */}
              <motion.form onSubmit={handleSearch} className="px-3 py-2 mb-2" initial={{ y: -10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }}>
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search stories..."
                    className={`w-full px-4 py-2 text-sm rounded-full ${
                      theme === 'dark'
                        ? 'bg-white/10 border border-white/20 text-white placeholder-white/60'
                        : 'bg-white border border-gray-300 text-gray-900 placeholder-gray-500'
                    } focus:outline-none`}
                  />
                  <button
                    type="submit"
                    className={`absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 ${theme === 'dark' ? 'text-white/70' : 'text-gray-500'}`}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                  </button>
                </div>
              </motion.form>

              {/* Mobile Theme toggle */}
              <motion.div className="px-3 py-2 flex justify-between items-center" initial={{ y: -10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.15 }}>
                <span className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
                  Theme
                </span>
                <motion.button
                  onClick={toggleTheme}
                  className={`px-4 py-2 rounded-lg text-sm ${
                    theme === 'dark'
                      ? 'bg-gray-700 text-yellow-300'
                      : 'bg-gray-200 text-gray-800'
                  }`}
                  whileTap={{ scale: 0.95 }}
                >
                  {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                </motion.button>
              </motion.div>

              {/* Mobile Navigation Links */}
              {navLinks.map((link, index) => {
                if (link.href === "/pricing" || link.href === "/about") {
                  return null;
                }
                return (
                  <motion.div key={link.name} initial={{ x: -10, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.2 + index * 0.05 }}>
                    <Link
                      // @ts-ignore
                      // eslint-disable-next-line @next/next/no-img-element, @next/next/no-html-link-for-pages, @typescript-eslint/ban-ts-comment
                      href={link.href}
                      className={`block px-3 py-2 rounded-md text-base font-medium no-underline ${ // Added no-underline class
                        isActive(link.href)
                          ? theme === 'dark'
                            ? 'bg-indigo-900 text-white'
                            : 'bg-indigo-100 text-indigo-800'
                          : theme === 'dark'
                            ? 'text-gray-300 hover:bg-indigo-800 hover:text-white'
                            : 'text-gray-700 hover:bg-gray-200 hover:text-gray-900'
                      }`}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {link.name}
                    </Link>
                  </motion.div>
                );
              })}
              {/* Mobile User Section */}
              {session && (
                <motion.div
                  className={`mt-4 pt-4 border-t ${theme === 'dark' ? 'border-gray-700' : 'border-gray-300'}`}
                  initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }}
                >
                  <div className="flex items-center px-3">
                    {isLoading ? (
                      <div className="w-10 h-10 bg-gray-300 animate-pulse rounded-full mr-3"></div>
                    ) : (
                      <img
                        src={userAvatar}
                        alt="User Avatar"
                        className="w-10 h-10 rounded-full object-cover mr-3 border border-indigo-400"
                        onError={(e) => { e.currentTarget.src = "/default-avatar.png"; }}
                      />
                    )}
                    <div>
                      <div className={`text-base font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                        {userName}
                      </div>
                      {session?.user?.email && (
                        <div className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} truncate max-w-[200px]`}>
                          {session.user.email}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="mt-3 space-y-1">
                    <Link
                      // @ts-ignore
                      // eslint-disable-next-line @next/next/no-img-element, @next/next/no-html-link-for-pages, @typescript-eslint/ban-ts-comment
                      href="/profile"
                      className={`block px-3 py-2 rounded-md text-base font-medium ${
                        theme === 'dark'
                          ? 'text-gray-300 hover:bg-indigo-800 hover:text-white'
                          : 'text-gray-700 hover:bg-gray-200 hover:text-gray-900'
                      }`}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Your Profile
                    </Link>
                    <Link
                      // @ts-ignore
                      // eslint-disable-next-line @next/next/no-img-element, @next/next/no-html-link-for-pages, @typescript-eslint/ban-ts-comment
                      href="/notifications"
                      className={`block px-3 py-2 rounded-md text-base font-medium ${
                        theme === 'dark'
                          ? 'text-gray-300 hover:bg-indigo-800 hover:text-white'
                          : 'text-gray-700 hover:bg-gray-200 hover:text-gray-900'
                      }`}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Notifications
                      {hasNewNotifications && (
                        <span className={`ml-2 inline-block w-2 h-2 ${theme === 'dark' ? 'bg-red-500' : 'bg-red-600'} rounded-full`}></span>
                      )}
                    </Link>
                    <Link
                      // @ts-ignore
                      // eslint-disable-next-line @next/next/no-img-element, @next/next/no-html-link-for-pages, @typescript-eslint/ban-ts-comment
                      href="/settings"
                      className={`block px-3 py-2 rounded-md text-base font-medium ${
                        theme === 'dark'
                          ? 'text-gray-300 hover:bg-indigo-800 hover:text-white'
                          : 'text-gray-700 hover:bg-gray-200 hover:text-gray-900'
                      }`}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Settings
                    </Link>
                    <button
                      onClick={() => {
                        setMobileMenuOpen(false);
                        signOut();
                      }}
                      className={`block w-full text-left px-3 py-2 rounded-md text-base font-medium ${
                        theme === 'dark'
                          ? 'text-red-400 hover:bg-indigo-800 hover:text-red-300'
                          : 'text-red-600 hover:bg-gray-200'
                      }`}
                    >
                      Sign Out
                    </button>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}