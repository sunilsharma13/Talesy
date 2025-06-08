// components/navbar.tsx
"use client";

import React, { useState, useEffect, useRef } from "react";
import { useSession, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";

type NavLink = {
  name: string;
  href: string;
};

export default function Navbar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);

  const [userName, setUserName] = useState("User");
  const [userAvatar, setUserAvatar] = useState("/default-avatar.png");
  const [isLoading, setIsLoading] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [hasNewNotifications, setHasNewNotifications] = useState(false);

  // Check for theme preference
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light' || savedTheme === 'dark') {
      setTheme(savedTheme);
    }
  }, []);

  // Update theme in localStorage and apply class to document
  useEffect(() => {
    localStorage.setItem('theme', theme);
    document.documentElement.classList.toggle('dark-theme', theme === 'dark');
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'dark' ? 'light' : 'dark');
  };

  const fetchUserProfile = async () => {
    if (!session?.user?.email) return;
    
    try {
      setIsLoading(true);
      const res = await fetch("/api/users/profile");
      
      if (!res.ok) {
        console.error(`Failed to fetch profile with status ${res.status}`);
        throw new Error("Failed to fetch profile");
      }
      
      const data = await res.json();

      if (data.user) {
        setUserName(data.user.name || session?.user?.name || "User");

        if (data.user.avatar) {
          // Add cache-busting parameter to prevent browser caching
          setUserAvatar(`${data.user.avatar}?t=${Date.now()}`);
        } else {
          setUserAvatar(session?.user?.image || "/default-avatar.png");
        }
      }
    } catch (error) {
      console.error("Failed to fetch profile:", error);
      if (session?.user?.name) setUserName(session.user.name);
      if (session?.user?.image) setUserAvatar(session.user.image);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchNotifications = async () => {
    if (!session?.user?.id) return;

    try {
      const res = await fetch('/api/notifications');
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
        setHasNewNotifications(data.some((notification: any) => !notification.read));
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  };

  useEffect(() => {
    if (session) {
      fetchUserProfile();
      fetchNotifications();
    }

    function handleProfileUpdated(event: Event) {
      const customEvent = event as CustomEvent;
      const { name, avatar } = customEvent.detail || {};
      
      if (name) setUserName(name);
      if (avatar) {
        setUserAvatar(`${avatar}?t=${Date.now()}`);
      }
      
      fetchUserProfile();
    }

    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
      }
      
      if (
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(event.target as Node)
      ) {
        setMobileMenuOpen(false);
      }

      if (
        notificationsRef.current &&
        !notificationsRef.current.contains(event.target as Node)
      ) {
        setNotificationsOpen(false);
      }
    }

    window.addEventListener("profileUpdated", handleProfileUpdated as EventListener);
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      window.removeEventListener("profileUpdated", handleProfileUpdated as EventListener);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [session]);

  const markNotificationsAsRead = async () => {
    if (!session?.user?.id || notifications.length === 0) return;

    try {
      const res = await fetch('/api/notifications/mark-read', {
        method: 'POST',
      });
      
      if (res.ok) {
        setNotifications(prev => prev.map(notification => ({ ...notification, read: true })));
        setHasNewNotifications(false);
      }
    } catch (error) {
      console.error('Failed to mark notifications as read:', error);
    }
  };

  const toggleDropdown = () => setDropdownOpen((prev) => !prev);
  const toggleMobileMenu = () => setMobileMenuOpen((prev) => !prev);
  
  const toggleNotifications = () => {
    const newState = !notificationsOpen;
    setNotificationsOpen(newState);
    if (newState && hasNewNotifications) {
      markNotificationsAsRead();
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
    }
  };

  const navLinks: NavLink[] = [
    { name: "Home", href: "/" },
    { name: "Feed", href: "/feed" },
    { name: "Write", href: "/write/new" },
    { name: "Dashboard", href: "/dashboard" },
    { name: "Explore", href: "/explore" },
  ];

  const isActive = (path: string) => {
    return pathname === path;
  };
  
  // Determine the navbar color scheme based on theme
  const navBarBg = theme === 'dark'
    ? "bg-gradient-to-r from-[#0e0e2c] via-[#1a1a3a] to-[#252550]"
    : "bg-white border-b border-gray-200 text-gray-800";

  const handleNavigation = (path: string) => {
    router.push(path);
  };

  return (
    <nav className={`${navBarBg} shadow-lg sticky top-0 z-50 transition-colors`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <a 
              href="/" 
              className="flex items-center gap-3 transition-transform hover:scale-105"
              onClick={(e) => {
                e.preventDefault();
                handleNavigation("/");
              }}
            >
              <img 
                src={theme === 'dark' ? "/logo.png" : "/logo-dark.png"} 
                alt="Logo" 
                className="w-10 h-10 object-contain"
              />
              <span className="text-xl font-bold select-none">
                <span className="animate-pulse">✦</span>
              </span>
            </a>
            
            <div className="hidden md:ml-10 md:flex md:space-x-8">
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  className={`inline-flex items-center px-1 pt-1 text-sm font-medium transition-all duration-300 ${
                    isActive(link.href)
                      ? theme === 'dark' 
                          ? "text-white border-b-2 border-indigo-300" 
                          : "text-indigo-700 border-b-2 border-indigo-500"
                      : theme === 'dark'
                          ? "text-gray-300 hover:text-white hover:border-b-2 hover:border-indigo-400/50"
                          : "text-gray-600 hover:text-gray-900 hover:border-b-2 hover:border-indigo-300/50"
                  }`}
                  onClick={(e) => {
                    e.preventDefault();
                    handleNavigation(link.href);
                  }}
                >
                  {link.name}
                </a>
              ))}
            </div>
          </div>

          <div className="flex items-center md:hidden">
            <button
              onClick={toggleMobileMenu}
              className={`inline-flex items-center justify-center p-2 rounded-md ${
                theme === 'dark' 
                  ? 'text-gray-300 hover:text-white hover:bg-indigo-800' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              } focus:outline-none`}
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
            </button>
          </div>

          <div className="hidden md:flex md:items-center md:gap-4">
            {/* Theme toggle button */}
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-full ${
                theme === 'dark' 
                  ? 'bg-gray-700 hover:bg-gray-600 text-yellow-300' 
                  : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
              }`}
              aria-label="Toggle dark mode"
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
            </button>
            
            <form onSubmit={handleSearch} className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search stories..."
                className={`w-64 px-4 py-2 text-sm ${
                  theme === 'dark'
                    ? 'bg-white/10 border border-white/20 placeholder-white/60 text-white'
                    : 'bg-gray-100 border border-gray-300 placeholder-gray-500 text-gray-900'
                } rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500`}
              />
              <button 
                type="submit"
                className={`absolute right-3 top-2.5 h-4 w-4 ${
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
            </form>

            <div className="relative" ref={notificationsRef}>
              <button 
                onClick={toggleNotifications}
                className={`relative p-1 ${
                  theme === 'dark' ? 'text-white/80 hover:text-white' : 'text-gray-600 hover:text-gray-900'
                } focus:outline-none transition duration-150`}
              >
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="h-6 w-6" 
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
                {hasNewNotifications && (
                  <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-400 ring-2 ring-[#252550]"></span>
                )}
              </button>

              {notificationsOpen && (
                <div className="absolute right-0 mt-3 w-72 bg-white text-gray-800 rounded-md shadow-lg z-50 overflow-hidden border border-gray-200">
                  <div className="p-3 bg-gray-50 border-b border-gray-200">
                    <h3 className="text-sm font-medium text-gray-700">Notifications</h3>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-4 text-center text-gray-500 text-sm">
                        No notifications yet
                      </div>
                    ) : (
                      <div>
                        {notifications.map((notification) => (
                          <div 
                            key={notification._id} 
                            className={`p-3 border-b border-gray-100 hover:bg-gray-50 ${!notification.read ? 'bg-blue-50' : ''}`}
                          >
                            <div className="flex items-start">
                              {notification.type === 'follow' && (
                                <div className="bg-indigo-100 rounded-full p-2 mr-3">
                                  <svg className="h-4 w-4 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                  </svg>
                                </div>
                              )}
                              {notification.type === 'like' && (
                                <div className="bg-red-100 rounded-full p-2 mr-3">
                                  <svg className="h-4 w-4 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                  </svg>
                                </div>
                              )}
                              {notification.type === 'comment' && (
                                <div className="bg-blue-100 rounded-full p-2 mr-3">
                                  <svg className="h-4 w-4 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                  </svg>
                                </div>
                              )}
                              <div className="flex-1 text-sm">
                                <p className="text-gray-900 mb-0.5">{notification.message}</p>
                                <p className="text-gray-500 text-xs">
                                  {new Date(notification.createdAt).toLocaleString()}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="p-2 bg-gray-50 border-t border-gray-200">
                    <a
                      href="/notifications"
                      className="block text-xs text-center text-indigo-600 hover:text-indigo-800 font-medium"
                      onClick={(e) => {
                        e.preventDefault();
                        setNotificationsOpen(false);
                        handleNavigation('/notifications');
                      }}
                    >
                      View all notifications
                    </a>
                  </div>
                </div>
              )}
            </div>

            <div className="relative" ref={dropdownRef}>
              <div className="flex items-center gap-3">
                <span className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
                  {userName}
                </span>
                <button
                  onClick={toggleDropdown}
                  className="focus:outline-none rounded-full border-2 border-indigo-400 p-0.5 overflow-hidden transition-transform hover:scale-105"
                >
                  {isLoading ? (
                    <div className="w-8 h-8 bg-gray-300 animate-pulse rounded-full"></div>
                  ) : (
                    <img
                      src={userAvatar}
                      alt="User Avatar"
                      className="w-8 h-8 rounded-full object-cover"
                      onError={(e) => {
                        // Fallback if image fails to load
                        e.currentTarget.src = "/default-avatar.png";
                      }}
                    />
                  )}
                </button>
              </div>

              {dropdownOpen && (
                <div className="absolute right-0 mt-3 w-48 bg-white text-gray-800 rounded-md shadow-lg z-50 overflow-hidden border border-gray-200 animate-fadeIn">
                  <div className="py-1">
                    <a
                      href="/profile"
                      className="block px-4 py-2 text-sm hover:bg-gray-100 cursor-pointer transition"
                      onClick={(e) => {
                        e.preventDefault();
                        setDropdownOpen(false);
                        handleNavigation('/profile');
                      }}
                    >
                      Your Profile
                    </a>
                    <a
                      href="/dashboard"
                      className="block px-4 py-2 text-sm hover:bg-gray-100 cursor-pointer transition"
                      onClick={(e) => {
                        e.preventDefault();
                        setDropdownOpen(false);
                        handleNavigation('/dashboard');
                      }}
                    >
                      Dashboard
                    </a>
                    <a
                      href="/settings"
                      className="block px-4 py-2 text-sm hover:bg-gray-100 cursor-pointer transition"
                      onClick={(e) => {
                        e.preventDefault();
                        setDropdownOpen(false);
                        handleNavigation('/settings');
                      }}
                    >
                      Settings
                    </a>
                    <hr className="my-1 border-gray-200" />
                    <button
                      onClick={() => {
                        setDropdownOpen(false);
                        signOut();
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 cursor-pointer transition"
                    >
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div 
        className={`${mobileMenuOpen ? 'block' : 'hidden'} md:hidden`} 
        ref={mobileMenuRef}
      >
        <div className={`px-2 pt-2 pb-3 space-y-1 ${theme === 'dark' ? 'bg-[#1a1a3a]' : 'bg-gray-50'} shadow-lg`}>
          {/* Mobile Search */}
          <form onSubmit={handleSearch} className="px-3 py-2 mb-2">
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
                className={`absolute right-3 top-2 h-4 w-4 ${theme === 'dark' ? 'text-white/70' : 'text-gray-500'}`}
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
          </form>
          
          {/* Theme toggle in mobile menu */}
          <div className="px-3 py-2 flex justify-between items-center">
            <span className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
              Theme
            </span>
            <button
              onClick={toggleTheme}
              className={`px-4 py-2 rounded-lg text-sm ${
                theme === 'dark' 
                  ? 'bg-gray-700 text-yellow-300' 
                  : 'bg-gray-200 text-gray-800'
              }`}
            >
              {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
            </button>
          </div>
          
          {/* Navigation links */}
          {navLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              className={`block px-3 py-2 rounded-md text-base font-medium ${
                isActive(link.href)
                  ? theme === 'dark'
                      ? "bg-indigo-900 text-white"
                      : "bg-indigo-100 text-indigo-800"
                  : theme === 'dark'
                      ? "text-gray-300 hover:bg-indigo-800 hover:text-white"
                      : "text-gray-700 hover:bg-gray-200 hover:text-gray-900"
              }`}
              onClick={(e) => {
                e.preventDefault();
                setMobileMenuOpen(false);
                handleNavigation(link.href);
              }}
            >
              {link.name}
            </a>
          ))}
          
          {/* User section */}
          <div className={`mt-4 pt-4 border-t ${theme === 'dark' ? 'border-gray-700' : 'border-gray-300'}`}>
            <div className="flex items-center px-3">
              {isLoading ? (
                <div className="w-10 h-10 bg-gray-300 animate-pulse rounded-full mr-3"></div>
              ) : (
                <img
                  src={userAvatar}
                  alt="User Avatar"
                  className="w-10 h-10 rounded-full object-cover mr-3 border border-indigo-400"
                  onError={(e) => {
                    e.currentTarget.src = "/default-avatar.png";
                  }}
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
              <a
                href="/profile"
                className={`block px-3 py-2 rounded-md text-base font-medium ${
                  theme === 'dark'
                    ? 'text-gray-300 hover:bg-indigo-800 hover:text-white'
                    : 'text-gray-700 hover:bg-gray-200 hover:text-gray-900'
                }`}
                onClick={(e) => {
                  e.preventDefault();
                  setMobileMenuOpen(false);
                  handleNavigation('/profile');
                }}
              >
                Your Profile
              </a>
              <a
                href="/notifications"
                className={`block px-3 py-2 rounded-md text-base font-medium ${
                  theme === 'dark'
                    ? 'text-gray-300 hover:bg-indigo-800 hover:text-white'
                    : 'text-gray-700 hover:bg-gray-200 hover:text-gray-900'
                }`}
                onClick={(e) => {
                  e.preventDefault();
                  setMobileMenuOpen(false);
                  handleNavigation('/notifications');
                }}
              >
                Notifications
                {hasNewNotifications && (
                  <span className={`ml-2 inline-block w-2 h-2 ${theme === 'dark' ? 'bg-red-500' : 'bg-red-600'} rounded-full`}></span>
                )}
              </a>
              <a
                href="/settings"
                className={`block px-3 py-2 rounded-md text-base font-medium ${
                  theme === 'dark'
                    ? 'text-gray-300 hover:bg-indigo-800 hover:text-white'
                    : 'text-gray-700 hover:bg-gray-200 hover:text-gray-900'
                }`}
                onClick={(e) => {
                  e.preventDefault();
                  setMobileMenuOpen(false);
                  handleNavigation('/settings');
                }}
              >
                Settings
              </a>
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
          </div>
        </div>
      </div>
    </nav>
  );
}