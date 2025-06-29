// app/style-guide/page.tsx
"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function StyleGuidePage() {
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
          Talesy Style Guide
        </h1>
        <p className="text-lg mb-8 text-center" style={{ color: getDynamicThemeClass('text-secondary') }}>
          Guidelines for consistent and engaging content on Talesy.
        </p>

        <div className="space-y-8">
          <section className="p-6 rounded-lg shadow-md" style={{ backgroundColor: getDynamicThemeClass('background-secondary') }}>
            <h2 className="text-2xl font-bold mb-4" style={{ color: getDynamicThemeClass('accent-color') }}>
              Voice & Tone
            </h2>
            <p className="text-base mb-2" style={{ color: getDynamicThemeClass('text-primary') }}>
              Maintain an engaging, clear, and respectful tone. Be encouraging and supportive in your narratives. Avoid overly complex jargon unless specific to your genre.
            </p>
            <ul className="list-disc list-inside text-base" style={{ color: getDynamicThemeClass('text-primary') }}>
              <li>**Enthusiastic:** Show passion for your subject.</li>
              <li>**Accessible:** Write for a broad audience.</li>
              <li>**Original:** Let your unique voice shine.</li>
            </ul>
          </section>

          <section className="p-6 rounded-lg shadow-md" style={{ backgroundColor: getDynamicThemeClass('background-secondary') }}>
            <h2 className="text-2xl font-bold mb-4" style={{ color: getDynamicThemeClass('accent-color') }}>
              Formatting Best Practices
            </h2>
            <p className="text-base mb-2" style={{ color: getDynamicThemeClass('text-primary') }}>
              Use markdown effectively to enhance readability.
            </p>
            <ul className="list-disc list-inside text-base" style={{ color: getDynamicThemeClass('text-primary') }}>
              <li>**Headings:** Use `#` for main titles, `##` for sections, etc., for clear hierarchy.</li>
              <li>**Bold/Italic:** Use `**bold**` and `*italic*` for emphasis.</li>
              <li>**Lists:** Use `-` or `*` for bullet points and `1.` for numbered lists.</li>
              <li>**Paragraphs:** Break up long blocks of text into shorter, digestible paragraphs.</li>
            </ul>
          </section>

          <section className="p-6 rounded-lg shadow-md" style={{ backgroundColor: getDynamicThemeClass('background-secondary') }}>
            <h2 className="text-2xl font-bold mb-4" style={{ color: getDynamicThemeClass('accent-color') }}>
              Image & Media Usage
            </h2>
            <p className="text-base mb-2" style={{ color: getDynamicThemeClass('text-primary') }}>
              Images can greatly enhance your story.
            </p>
            <ul className="list-disc list-inside text-base" style={{ color: getDynamicThemeClass('text-primary') }}>
              <li>**Relevance:** Ensure images are directly relevant to your content.</li>
              <li>**Quality:** Use high-resolution images that are visually appealing.</li>
              <li>**Copyright:** Only use images you have the rights to.</li>
            </ul>
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