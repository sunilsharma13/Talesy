// app/writing-tips/page.tsx
"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function WritingTipsPage() {
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
          Writing Tips
        </h1>
        <p className="text-lg mb-8 text-center" style={{ color: getDynamicThemeClass('text-secondary') }}>
          Enhance your storytelling and captivate your readers.
        </p>

        <div className="space-y-8">
          <section className="p-6 rounded-lg shadow-md" style={{ backgroundColor: getDynamicThemeClass('background-secondary') }}>
            <h2 className="text-2xl font-bold mb-4" style={{ color: getDynamicThemeClass('accent-color') }}>
              1. Start with a Strong Hook
            </h2>
            <p className="text-base" style={{ color: getDynamicThemeClass('text-primary') }}>
              Grab your reader's attention from the very first sentence. This could be a compelling question, a shocking statement, or an intriguing mystery. A strong opening sets the tone and makes readers want to know more.
            </p>
          </section>

          <section className="p-6 rounded-lg shadow-md" style={{ backgroundColor: getDynamicThemeClass('background-secondary') }}>
            <h2 className="text-2xl font-bold mb-4" style={{ color: getDynamicThemeClass('accent-color') }}>
              2. Develop Memorable Characters
            </h2>
            <p className="text-base" style={{ color: getDynamicThemeClass('text-primary') }}>
              Give your characters depth, flaws, and motivations. Readers connect with characters who feel real and relatable. Show, don't just tell, their personalities through their actions and dialogue.
            </p>
          </section>

          <section className="p-6 rounded-lg shadow-md" style={{ backgroundColor: getDynamicThemeClass('background-secondary') }}>
            <h2 className="text-2xl font-bold mb-4" style={{ color: getDynamicThemeClass('accent-color') }}>
              3. Master the Art of Pacing
            </h2>
            <p className="text-base" style={{ color: getDynamicThemeClass('text-primary') }}>
              Vary the speed of your narrative. Accelerate during action sequences and slow down for emotional moments or detailed descriptions. Effective pacing keeps readers engaged and controls the emotional impact of your story.
            </p>
          </section>

          <section className="p-6 rounded-lg shadow-md" style={{ backgroundColor: getDynamicThemeClass('background-secondary') }}>
            <h2 className="text-2xl font-bold mb-4" style={{ color: getDynamicThemeClass('accent-color') }}>
              4. Show, Don't Tell
            </h2>
            <p className="text-base" style={{ color: getDynamicThemeClass('text-primary') }}>
              Instead of stating a character is angry, describe their clenched fists, tight jaw, or sharp tone. This technique allows readers to experience the story more vividly and form their own interpretations.
            </p>
          </section>
        </div>

        <div className="mt-12 text-center">
          <Link
            href="/write/new"
            className="inline-flex items-center justify-center px-8 py-3 border-2 border-transparent text-base font-medium rounded-full shadow-md text-white transition duration-300 ease-in-out transform hover:-translate-y-1"
            style={{
              background: `linear-gradient(to right, ${getDynamicThemeClass('purple-gradient-start')}, ${getDynamicThemeClass('purple-gradient-end')})`,
              color: getDynamicThemeClass('active-text'),
              borderColor: getDynamicThemeClass('button-border-color'),
            }}
          >
            Start Your Story Now
          </Link>
        </div>
      </div>
    </div>
  );
}