// Enhanced app/landing/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LandingPage() {
  const router = useRouter();
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  
  // Get current theme from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light' || savedTheme === 'dark') {
      setTheme(savedTheme);
    }
  }, []);

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Hero section */}
      <div className="relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-indigo-900/30 to-transparent pointer-events-none"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="pt-16 pb-24 text-center">
            {/* Logo */}
            <div className="flex justify-center mb-8">
              <img 
                src={theme === 'dark' ? "/logo.png" : "/logo-dark.png"}
                alt="Talesy" 
                className="h-20 w-auto animate-pulse"
              />
            </div>
            
            {/* Main title */}
            <h1 className={`text-4xl md:text-6xl font-extrabold tracking-tight mb-6 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              Welcome to <span className="text-indigo-500">Talesy</span>
            </h1>
            
            {/* Subtitle */}
            <p className={`text-xl md:text-2xl max-w-3xl mx-auto ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
              Your stories matter. Create, share, and connect with readers around the world.
            </p>
            
            {/* CTA buttons */}
            <div className="mt-10 flex flex-col sm:flex-row justify-center gap-4">
              <Link 
                href="/feed" 
                className="px-8 py-3 text-base font-medium rounded-md shadow bg-indigo-600 text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                Explore Stories
              </Link>
              <Link 
                href="/write/new" 
                className={`px-8 py-3 text-base font-medium rounded-md shadow ${
                  theme === 'dark' 
                    ? 'bg-white text-gray-900 hover:bg-gray-100' 
                    : 'bg-gray-800 text-white hover:bg-gray-700'
                }`}
              >
                Start Writing
              </Link>
            </div>
            
            {/* Social Media Links */}
            <div className="mt-12">
              <div className="flex justify-center space-x-6">
                <a 
                  href="https://instagram.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className={`h-10 w-10 rounded-full flex items-center justify-center ${theme === 'dark' ? 'bg-gray-800 hover:bg-pink-600' : 'bg-gray-200 hover:bg-pink-500'} hover:text-white transition-colors duration-300`}
                >
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                  </svg>
                </a>
                <a 
                  href="https://twitter.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className={`h-10 w-10 rounded-full flex items-center justify-center ${theme === 'dark' ? 'bg-gray-800 hover:bg-blue-500' : 'bg-gray-200 hover:bg-blue-400'} hover:text-white transition-colors duration-300`}
                >
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                  </svg>
                </a>
                <a 
                  href="https://facebook.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className={`h-10 w-10 rounded-full flex items-center justify-center ${theme === 'dark' ? 'bg-gray-800 hover:bg-blue-600' : 'bg-gray-200 hover:bg-blue-500'} hover:text-white transition-colors duration-300`}
                >
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                </a>
                <a 
                  href="https://reddit.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className={`h-10 w-10 rounded-full flex items-center justify-center ${theme === 'dark' ? 'bg-gray-800 hover:bg-orange-500' : 'bg-gray-200 hover:bg-orange-500'} hover:text-white transition-colors duration-300`}
                >
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z" />
                  </svg>
                </a>
                <a 
                  href="https://linkedin.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className={`h-10 w-10 rounded-full flex items-center justify-center ${theme === 'dark' ? 'bg-gray-800 hover:bg-blue-700' : 'bg-gray-200 hover:bg-blue-600'} hover:text-white transition-colors duration-300`}
                >
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Features section */}
      <div className={`py-16 ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className={`text-3xl font-extrabold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              Why Choose Talesy?
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className={`p-6 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'} transform hover:scale-105 transition-all duration-300`}>
              <div className="flex justify-center mb-4">
                <div className="bg-indigo-500 rounded-full p-3">
                  <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </div>
              </div>
              <h3 className={`text-xl font-bold mb-2 text-center ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                Easy Writing
              </h3>
              <p className={`text-center ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                Our intuitive editor makes it simple to create beautiful stories with rich formatting and images.
              </p>
            </div>
            
            {/* Feature 2 */}
            <div className={`p-6 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'} transform hover:scale-105 transition-all duration-300`}>
              <div className="flex justify-center mb-4">
                <div className="bg-indigo-500 rounded-full p-3">
                  <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
              </div>
              <h3 className={`text-xl font-bold mb-2 text-center ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                Connect with Readers
              </h3>
              <p className={`text-center ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                Build your audience and connect with readers who appreciate your unique voice.
              </p>
            </div>
            
            {/* Feature 3 */}
            <div className={`p-6 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'} transform hover:scale-105 transition-all duration-300`}>
              <div className="flex justify-center mb-4">
                <div className="bg-indigo-500 rounded-full p-3">
                  <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <h3 className={`text-xl font-bold mb-2 text-center ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                Publish Instantly
              </h3>
              <p className={`text-center ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                Share your stories with the world in seconds, no complicated publishing process.
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Testimonials section with animation */}
      <div className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className={`text-3xl font-extrabold ${theme === 'dark' ? 'text-white' : 'text-gray-900'} animate-fade-in`}>
              What Writers Say About Us
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Testimonial 1 */}
            <div className={`p-6 rounded-lg transform hover:-translate-y-2 transition-all duration-500 ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'}`}>
              <p className={`text-lg mb-4 italic ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                "Talesy has transformed how I share my stories. The community feedback is invaluable!"
              </p>
              <div className="flex items-center">
                <div className="h-10 w-10 rounded-full bg-indigo-500 flex items-center justify-center">
                  <span className="text-white font-bold">JS</span>
                </div>
                <div className="ml-3">
                  <p className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    James Smith
                  </p>
                  <p className="text-sm text-gray-500">Fiction Writer</p>
                </div>
              </div>
            </div>
            
            {/* Testimonial 2 */}
            <div className={`p-6 rounded-lg transform hover:-translate-y-2 transition-all duration-500 ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'}`}>
              <p className={`text-lg mb-4 italic ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                "The simplicity of the platform lets me focus on what matters most - my writing."
              </p>
              <div className="flex items-center">
                <div className="h-10 w-10 rounded-full bg-pink-500 flex items-center justify-center">
                  <span className="text-white font-bold">MJ</span>
                </div>
                <div className="ml-3">
                  <p className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    Maria Johnson
                  </p>
                  <p className="text-sm text-gray-500">Journalist</p>
                </div>
              </div>
            </div>
            
            {/* Testimonial 3 */}
            <div className={`p-6 rounded-lg transform hover:-translate-y-2 transition-all duration-500 ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'}`}>
              <p className={`text-lg mb-4 italic ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                "I've gained more readers in one month on Talesy than a year on my personal blog."
              </p>
              <div className="flex items-center">
                <div className="h-10 w-10 rounded-full bg-green-500 flex items-center justify-center">
                  <span className="text-white font-bold">DP</span>
                </div>
                <div className="ml-3">
                  <p className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    David Parker
                  </p>
                  <p className="text-sm text-gray-500">Sci-Fi Author</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* CTA section with gradient */}
      <div className={`py-16 bg-gradient-to-r ${theme === 'dark' ? 'from-indigo-900 to-purple-900' : 'from-indigo-600 to-purple-600'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-extrabold text-white mb-4 animate-pulse">
            Ready to Share Your Story?
          </h2>
          <p className="text-xl text-indigo-100 mb-8">
            Join thousands of writers who have already found their audience.
          </p>
          <Link 
            href="/feed" 
            className="px-8 py-3 text-base font-medium rounded-md shadow bg-white text-indigo-700 hover:bg-gray-100 transform hover:scale-105 transition-all"
          >
            Get Started Now
          </Link>
        </div>
      </div>
      
      {/* Newsletter section */}
      <div className={`py-12 ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:flex lg:items-center lg:justify-between">
            <div className="lg:w-1/2">
              <h3 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                Stay updated with Talesy news
              </h3>
              <p className={`mt-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                Get writing tips, feature updates, and inspiration delivered to your inbox.
              </p>
            </div>
            <div className="mt-6 lg:mt-0 lg:w-1/2">
              <form className="sm:flex">
                <input
                  type="email"
                  required
                  placeholder="Enter your email"
                  className="w-full px-4 py-3 rounded-md border-2 border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
                />
                <button
                  type="submit"
                  className="mt-3 sm:mt-0 sm:ml-3 w-full sm:w-auto flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  Subscribe
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
      
      {/* Footer with social links */}
      <footer className={`py-12 ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-100'}`}>
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
                <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-blue-500">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                  </svg>
                </a>
                <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-blue-600">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                </a>
                <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-pink-500">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                  </svg>
                </a>
                <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-blue-700">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                  </svg>
                </a>
              </div>
            </div>
            
            <div className="col-span-1">
              <h3 className={`text-sm font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'} uppercase tracking-wider`}>
                Navigation
              </h3>
              <ul className="mt-4 space-y-2">
                <li><Link href="/" className={`text-sm ${theme === 'dark' ? 'text-gray-300 hover:text-white' : 'text-gray-500 hover:text-gray-900'}`}>Home</Link></li>
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
              © {new Date().getFullYear()} Talesy. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}