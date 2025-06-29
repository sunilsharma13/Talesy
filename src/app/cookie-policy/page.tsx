// app/cookie-policy/page.tsx
"use client";

import { useState, useEffect } from 'react';

export default function CookiePolicyPage() {
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
          Cookie Policy
        </h1>
        <p className="text-lg mb-8 text-center" style={{ color: getDynamicThemeClass('text-secondary') }}>
          Understanding how Talesy uses cookies to enhance your experience.
        </p>

        <div className="space-y-8 text-base" style={{ color: getDynamicThemeClass('text-primary') }}>
          <section className="p-6 rounded-lg shadow-md" style={{ backgroundColor: getDynamicThemeClass('background-secondary') }}>
            <h2 className="text-2xl font-bold mb-4" style={{ color: getDynamicThemeClass('accent-color') }}>
              What are Cookies?
            </h2>
            <p>
              Cookies are small pieces of data stored on your device (computer or mobile device) when you visit a website. They are widely used to make websites work more efficiently, as well as to provide information to the site owners.
            </p>
          </section>

          <section className="p-6 rounded-lg shadow-md" style={{ backgroundColor: getDynamicThemeClass('background-secondary') }}>
            <h2 className="text-2xl font-bold mb-4" style={{ color: getDynamicThemeClass('accent-color') }}>
              How We Use Cookies
            </h2>
            <p className="mb-2">Talesy uses cookies for several purposes:</p>
            <ul className="list-disc list-inside">
              <li>**Essential Cookies:** These are strictly necessary for the operation of our website, enabling core functionalities like secure login and account management.</li>
              <li>**Performance & Analytics Cookies:** These help us understand how users interact with our website, which pages are most popular, and identify areas for improvement. This data is aggregated and anonymous.</li>
              <li>**Functionality Cookies:** These allow us to remember your preferences (like theme choice or language) to provide a more personalized experience.</li>
              <li>**Advertising Cookies:** (If applicable) These may be used to deliver more relevant advertisements to you and track the effectiveness of our advertising campaigns.</li>
            </ul>
          </section>

          <section className="p-6 rounded-lg shadow-md" style={{ backgroundColor: getDynamicThemeClass('background-secondary') }}>
            <h2 className="text-2xl font-bold mb-4" style={{ color: getDynamicThemeClass('accent-color') }}>
              Your Cookie Choices
            </h2>
            <p className="mb-2">
              Most web browsers allow you to control cookies through their settings. You can set your browser to notify you when you receive a cookie, which enables you to decide whether or not to accept it. You can also delete cookies that have already been set.
            </p>
            <p>
              Please note that disabling certain cookies may affect the functionality of the Talesy platform and your ability to use certain features.
            </p>
          </section>

          <section className="p-6 rounded-lg shadow-md" style={{ backgroundColor: getDynamicThemeClass('background-secondary') }}>
            <h2 className="text-2xl font-bold mb-4" style={{ color: getDynamicThemeClass('accent-color') }}>
              More Information
            </h2>
            <p>
              If you have any questions about our use of cookies, please contact us at <a href="mailto:privacy@talesy.com" className="font-semibold" style={{ color: getDynamicThemeClass('accent-color') }}>privacy@talesy.com</a>.
            </p>
            <p className="mt-4 text-sm italic" style={{ color: getDynamicThemeClass('text-secondary') }}>
              Last updated: June 27, 2025
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}