// app/privacy-policy/page.tsx
"use client";

import { useState, useEffect } from 'react';

export default function PrivacyPolicyPage() {
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
          Privacy Policy
        </h1>
        <p className="text-lg mb-8 text-center" style={{ color: getDynamicThemeClass('text-secondary') }}>
          Your privacy is important to us. This policy explains how we collect, use, and protect your data.
        </p>

        <div className="space-y-8 text-base" style={{ color: getDynamicThemeClass('text-primary') }}>
          <section className="p-6 rounded-lg shadow-md" style={{ backgroundColor: getDynamicThemeClass('background-secondary') }}>
            <h2 className="text-2xl font-bold mb-4" style={{ color: getDynamicThemeClass('accent-color') }}>
              Information We Collect
            </h2>
            <p className="mb-2">
              We collect information you provide directly to us when you create an account, publish content, or interact with our services. This may include your name, email address, profile picture, and any content you upload.
            </p>
            <p>
              We also automatically collect certain information when you access and use Talesy, such as your IP address, device information, browser type, and usage data (e.g., pages viewed, time spent on site).
            </p>
          </section>

          <section className="p-6 rounded-lg shadow-md" style={{ backgroundColor: getDynamicThemeClass('background-secondary') }}>
            <h2 className="text-2xl font-bold mb-4" style={{ color: getDynamicThemeClass('accent-color') }}>
              How We Use Your Information
            </h2>
            <p className="mb-2">We use the information we collect for various purposes, including:</p>
            <ul className="list-disc list-inside">
              <li>To provide, maintain, and improve our services.</li>
              <li>To personalize your experience and deliver relevant content.</li>
              <li>To communicate with you about updates, promotions, and important notices.</li>
              <li>To analyze usage trends and enhance the platform's functionality.</li>
              <li>To detect, prevent, and address technical issues or fraudulent activities.</li>
            </ul>
          </section>

          <section className="p-6 rounded-lg shadow-md" style={{ backgroundColor: getDynamicThemeClass('background-secondary') }}>
            <h2 className="text-2xl font-bold mb-4" style={{ color: getDynamicThemeClass('accent-color') }}>
              Data Sharing and Disclosure
            </h2>
            <p className="mb-2">
              We do not sell your personal information to third parties. We may share information with trusted third-party service providers who assist us in operating our platform, such as hosting providers, analytics services, and payment processors. These providers are obligated to protect your information.
            </p>
            <p>
              We may also disclose your information if required by law or in response to valid requests by public authorities (e.g., a court order or government agency).
            </p>
          </section>

          <section className="p-6 rounded-lg shadow-md" style={{ backgroundColor: getDynamicThemeClass('background-secondary') }}>
            <h2 className="text-2xl font-bold mb-4" style={{ color: getDynamicThemeClass('accent-color') }}>
              Your Choices and Rights
            </h2>
            <p className="mb-2">You have certain rights regarding your personal data:</p>
            <ul className="list-disc list-inside">
              <li>You can access and update your account information at any time.</li>
              <li>You can request a copy of your data or request its deletion (subject to legal obligations).</li>
              <li>You can opt out of receiving promotional communications from us.</li>
            </ul>
            <p className="mt-2">
              For any privacy-related requests or questions, please contact us at <a href="mailto:privacy@talesy.com" className="font-semibold" style={{ color: getDynamicThemeClass('accent-color') }}>privacy@talesy.com</a>.
            </p>
          </section>

          <section className="p-6 rounded-lg shadow-md" style={{ backgroundColor: getDynamicThemeClass('background-secondary') }}>
            <h2 className="text-2xl font-bold mb-4" style={{ color: getDynamicThemeClass('accent-color') }}>
              Changes to This Policy
            </h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of any significant changes by posting the new policy on this page and updating the "Last updated" date.
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