// app/terms-of-service/page.tsx
"use client";

import { useState, useEffect } from 'react';

export default function TermsOfServicePage() {
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
          Terms of Service
        </h1>
        <p className="text-lg mb-8 text-center" style={{ color: getDynamicThemeClass('text-secondary') }}>
          Please read these terms carefully before using Talesy.
        </p>

        <div className="space-y-8 text-base" style={{ color: getDynamicThemeClass('text-primary') }}>
          <section className="p-6 rounded-lg shadow-md" style={{ backgroundColor: getDynamicThemeClass('background-secondary') }}>
            <h2 className="text-2xl font-bold mb-4" style={{ color: getDynamicThemeClass('accent-color') }}>
              1. Acceptance of Terms
            </h2>
            <p>
              By accessing or using the Talesy platform ("Service"), you agree to be bound by these Terms of Service ("Terms"). If you disagree with any part of the terms, then you may not access the Service.
            </p>
          </section>

          <section className="p-6 rounded-lg shadow-md" style={{ backgroundColor: getDynamicThemeClass('background-secondary') }}>
            <h2 className="text-2xl font-bold mb-4" style={{ color: getDynamicThemeClass('accent-color') }}>
              2. User Accounts
            </h2>
            <p className="mb-2">
              When you create an account with us, you must provide information that is accurate, complete, and current at all times. You are responsible for safeguarding the password that you use to access the Service and for any activities or actions under your password.
            </p>
            <p>
              You agree not to disclose your password to any third party. You must notify us immediately upon becoming aware of any breach of security or unauthorized use of your account.
            </p>
          </section>

          <section className="p-6 rounded-lg shadow-md" style={{ backgroundColor: getDynamicThemeClass('background-secondary') }}>
            <h2 className="text-2xl font-bold mb-4" style={{ color: getDynamicThemeClass('accent-color') }}>
              3. Content
            </h2>
            <p className="mb-2">
              Our Service allows you to post, link, store, share, and otherwise make available certain information, text, graphics, videos, or other material ("Content"). You are responsible for the Content that you post on or through the Service, including its legality, reliability, and appropriateness.
            </p>
            <p>
              By posting Content to the Service, you grant us the right and license to use, modify, publicly perform, publicly display, reproduce, and distribute such Content on and through the Service.
            </p>
          </section>

          <section className="p-6 rounded-lg shadow-md" style={{ backgroundColor: getDynamicThemeClass('background-secondary') }}>
            <h2 className="text-2xl font-bold mb-4" style={{ color: getDynamicThemeClass('accent-color') }}>
              4. Prohibited Uses
            </h2>
            <p className="mb-2">You may use the Service only for lawful purposes and in accordance with these Terms. You agree not to use the Service:</p>
            <ul className="list-disc list-inside">
              <li>In any way that violates any applicable national or international law or regulation.</li>
              <li>For the purpose of exploiting, harming, or attempting to exploit or harm minors in any way.</li>
              <li>To transmit, or procure the sending of, any advertising or promotional material without our prior written consent.</li>
              <li>To impersonate or attempt to impersonate Talesy, a Talesy employee, another user, or any other person or entity.</li>
            </ul>
          </section>

          <section className="p-6 rounded-lg shadow-md" style={{ backgroundColor: getDynamicThemeClass('background-secondary') }}>
            <h2 className="text-2xl font-bold mb-4" style={{ color: getDynamicThemeClass('accent-color') }}>
              5. Termination
            </h2>
            <p>
              We may terminate or suspend your account immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.
            </p>
          </section>

          <section className="p-6 rounded-lg shadow-md" style={{ backgroundColor: getDynamicThemeClass('background-secondary') }}>
            <h2 className="text-2xl font-bold mb-4" style={{ color: getDynamicThemeClass('accent-color') }}>
              6. Governing Law
            </h2>
            <p>
              These Terms shall be governed and construed in accordance with the laws of [Your Country/State], without regard to its conflict of law provisions.
            </p>
          </section>

          <section className="p-6 rounded-lg shadow-md" style={{ backgroundColor: getDynamicThemeClass('background-secondary') }}>
            <h2 className="text-2xl font-bold mb-4" style={{ color: getDynamicThemeClass('accent-color') }}>
              7. Changes to Terms
            </h2>
            <p>
              We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is material, we will provide at least 30 days' notice prior to any new terms taking effect.
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