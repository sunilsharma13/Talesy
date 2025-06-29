// app/support/page.tsx
"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { FaEnvelope, FaQuestionCircle, FaBug } from 'react-icons/fa';

export default function SupportPage() {
  const [theme, setTheme] = useState<"light" | "dark" | "talesy-accent">("dark");

  useEffect(() => {
    const storedTheme = localStorage.getItem('theme');
    if (storedTheme && ['light', 'dark', 'talesy-accent'].includes(storedTheme)) {
      setTheme(storedTheme as "light" | "dark" | "talesy-accent");
      document.documentElement.setAttribute('data-theme', storedTheme);
    } else {
      setTheme("dark");
      localStorage.setItem("theme", "dark");
      document.documentElement.setAttribute('data-theme', 'dark');
    }
  }, []);

  const getDynamicThemeClass = (prop: string) => `var(--${prop})`;

  return (
    <div className="min-h-screen py-12" style={{ backgroundColor: getDynamicThemeClass('background-primary') }}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-extrabold mb-8 text-center" style={{ color: getDynamicThemeClass('text-primary') }}>
          Support Center
        </h1>
        <p className="text-lg mb-12 text-center" style={{ color: getDynamicThemeClass('text-secondary') }}>
          We're here to help you with any questions or issues.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-6 rounded-lg shadow-md text-center" style={{ backgroundColor: getDynamicThemeClass('background-secondary') }}>
            <FaQuestionCircle className="h-12 w-12 mx-auto mb-4" style={{ color: getDynamicThemeClass('accent-color') }} />
            <h2 className="text-xl font-bold mb-2" style={{ color: getDynamicThemeClass('text-primary') }}>
              Visit our FAQs
            </h2>
            <p className="text-base mb-4" style={{ color: getDynamicThemeClass('text-secondary') }}>
              Find quick answers to common questions in our Frequently Asked Questions section.
            </p>
            <Link
              href="/landing#faqs"
              className="inline-flex items-center justify-center px-6 py-2 border-2 text-sm font-medium rounded-full shadow-sm transition duration-300 ease-in-out transform hover:-translate-y-1"
              style={{
                backgroundColor: getDynamicThemeClass('button-secondary-bg'),
                color: getDynamicThemeClass('button-secondary-text'),
                borderColor: getDynamicThemeClass('button-secondary-border'),
              }}
            >
              Go to FAQs
            </Link>
          </div>

          <div className="p-6 rounded-lg shadow-md text-center" style={{ backgroundColor: getDynamicThemeClass('background-secondary') }}>
            <FaEnvelope className="h-12 w-12 mx-auto mb-4" style={{ color: getDynamicThemeClass('accent-color') }} />
            <h2 className="text-xl font-bold mb-2" style={{ color: getDynamicThemeClass('text-primary') }}>
              Email Us
            </h2>
            <p className="text-base mb-4" style={{ color: getDynamicThemeClass('text-secondary') }}>
              Can't find what you're looking for? Send us an email and we'll get back to you.
            </p>
            <a
              href="mailto:support@talesy.com"
              className="inline-flex items-center justify-center px-6 py-2 border-2 text-sm font-medium rounded-full shadow-sm transition duration-300 ease-in-out transform hover:-translate-y-1"
              style={{
                background: `linear-gradient(to right, ${getDynamicThemeClass('purple-gradient-start')}, ${getDynamicThemeClass('purple-gradient-end')})`,
                color: getDynamicThemeClass('active-text'),
                borderColor: getDynamicThemeClass('button-border-color'),
              }}
            >
              Send Email
            </a>
          </div>

          <div className="p-6 rounded-lg shadow-md text-center" style={{ backgroundColor: getDynamicThemeClass('background-secondary') }}>
            <FaBug className="h-12 w-12 mx-auto mb-4" style={{ color: getDynamicThemeClass('accent-color') }} />
            <h2 className="text-xl font-bold mb-2" style={{ color: getDynamicThemeClass('text-primary') }}>
              Report a Bug
            </h2>
            <p className="text-base mb-4" style={{ color: getDynamicThemeClass('text-secondary') }}>
              Help us improve by reporting any bugs or technical issues you encounter.
            </p>
            <a
              href="mailto:bugs@talesy.com" // You might want a dedicated bug reporting form/system
              className="inline-flex items-center justify-center px-6 py-2 border-2 text-sm font-medium rounded-full shadow-sm transition duration-300 ease-in-out transform hover:-translate-y-1"
              style={{
                backgroundColor: getDynamicThemeClass('button-secondary-bg'),
                color: getDynamicThemeClass('button-secondary-text'),
                borderColor: getDynamicThemeClass('button-secondary-border'),
              }}
            >
              Report Bug
            </a>
          </div>
        </div>

        <div className="mt-12 text-center">
          <p className="text-lg" style={{ color: getDynamicThemeClass('text-secondary') }}>
            Our support team is available during business hours. We aim to respond within 24-48 hours.
          </p>
        </div>
      </div>
    </div>
  );
}