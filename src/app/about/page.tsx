// app/about/page.tsx
"use client"; // Ensure it's a client component

import React from 'react';
import Image from 'next/image'; // Import the Image component for optimized images

import { SparklesIcon, LightBulbIcon, ChatBubbleLeftRightIcon, RocketLaunchIcon, ShieldCheckIcon, UserCircleIcon, BookOpenIcon, EnvelopeIcon, GlobeAltIcon } from '@heroicons/react/24/outline'; // Icons for visual flair

// Define social media links here. Remember to replace '#' with your actual URLs!
const SOCIAL_MEDIA_LINKS = {
  twitter: "#",   // Replace with your actual Twitter link, e.g., "https://twitter.com/talesy_official"
  instagram: "#", // Replace with your actual Instagram link, e.g., "https://instagram.com/talesy_app"
  linkedin: "#",  // Replace with your actual LinkedIn link, e.g., "https://linkedin.com/company/talesy"
  // Add more as needed: facebook: "#", youtube: "#"
};

export default function AboutPage() {
  return (
    // Main container now uses primary background and text colors from CSS variables
    <div className="min-h-screen bg-[var(--background-primary)] text-[var(--text-primary)] flex flex-col items-center p-8 sm:p-12 transition-colors duration-500">
      <div className="max-w-5xl mx-auto">
        {/* Removed the top logo section as requested */}
        {/* <div className="mb-10 flex justify-center animate-fade-in">
          <Image
            src="/images/talesy-logo.png"
            alt="Talesy Logo"
            width={200}
            height={200}
            className="rounded-full shadow-lg"
          />
        </div> */}

        {/* Heading gradient kept as it is a specific design element */}
        <h1 className="text-5xl md:text-6xl font-extrabold mb-10 text-center bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600 animate-fade-in-down">
          Unleash Your Narrative: The Talesy Story
        </h1>

        {/* Text color now uses secondary text variable */}
        <div className="space-y-10 text-lg text-[var(--text-secondary)] leading-relaxed font-light">
          {/* Section 1: Introduction to Talesy */}
          {/* Background, text, border colors now use CSS variables */}
          <section className="bg-[var(--background-secondary)] p-8 rounded-xl shadow-lg border border-[var(--border-color)] animate-slide-in-up transition-colors duration-500">
            {/* Header text and icon color adjusted to accent or primary text */}
            <h2 className="text-3xl font-bold mb-4 text-[var(--accent-color)] flex items-center">
              <SparklesIcon className="h-8 w-8 mr-3 text-[var(--accent-color)]" />
              Where Every Voice Finds Its Echo
            </h2>
            <p className="mb-4">
              Welcome to **Talesy**, more than just a platform—it's a vibrant universe meticulously crafted for creators, thinkers, and dreamers alike. We deeply believe that within every individual lies a compelling narrative, a unique perspective, a heartfelt experience waiting to unfold. Our fundamental mission is elegantly simple: to dissolve the barriers between a fleeting spark of inspiration and its beautifully published reality.
            </p>
            <p>
              Born in **2025** from a fervent desire to revolutionize digital storytelling, Talesy was conceived to empower. Whether you're meticulously penning your magnum opus, sharing insightful daily reflections, reporting groundbreaking news, or simply have a thought too profound to keep, Talesy offers the intuitive, powerful, and aesthetically pleasing canvas you truly deserve.
            </p>
          </section>

          {/* Section 2: The Genesis / Our Origin Story (Generalised Founder's Message) */}
          {/* Background, text, border colors now use CSS variables */}
          <section className="bg-[var(--background-secondary)] p-8 rounded-xl shadow-lg border border-[var(--border-color)] animate-slide-in-up delay-200 transition-colors duration-500">
            {/* Header text and icon color adjusted to accent or primary text */}
            <h2 className="text-3xl font-bold mb-4 text-[var(--accent-color)] flex items-center">
              <BookOpenIcon className="h-8 w-8 mr-3 text-[var(--accent-color)]" />
              The Genesis of Talesy: A Journey of Passion
            </h2>
            <p className="mb-4">
              "Talesy's journey began with a singular, profound passion: the love for writing itself. Our founder, driven by a personal dream to become a writer and share their own experiences and thoughts, quickly realized the existing digital landscape often felt cluttered and restrictive. This personal journey ignited a powerful idea: to forge a new space, a truly dedicated platform."
            </p>
            <p className="mb-4">
              "It was a path marked by immense challenges and countless late nights, yet fueled by an unshakeable self-belief. Starting from the very foundations, learning the nuances of design and meticulously crafting every line of code, Talesy slowly took shape. This platform stands today as a testament to that unwavering dedication – a culmination of persistent effort, transformed from a simple thought into a thriving reality."
            </p>
            {/* UPDATED: Mini logo added, not rounded, larger size, dash removed, name kept */}
            {/* Text color for founder's name adjusted */}
            <p className="italic text-[var(--text-secondary)] text-right flex items-center justify-end">
              <Image
                src="/logo.png" // Path to your mini logo in the public folder
                alt="Talesy Mini Logo"
                width={40}  // Increased size
                height={40} // Increased size
                className="mr-2"
              />
              Sunil Sharma, Founder, Talesy
            </p>
          </section>

          {/* Section 3: Our Philosophy & Unique Proposition */}
          {/* Background, text, border colors now use CSS variables */}
          <section className="bg-[var(--background-secondary)] p-8 rounded-xl shadow-lg border border-[var(--border-color)] animate-slide-in-up delay-400 transition-colors duration-500">
            {/* Header text and icon color adjusted to accent or primary text */}
            <h2 className="text-3xl font-bold mb-4 text-[var(--accent-color)] flex items-center">
              <ChatBubbleLeftRightIcon className="h-8 w-8 mr-3 text-[var(--accent-color)]" />
              Our Core Philosophy: Unlocking Authentic Stories
            </h2>
            <p className="mb-6">
              In a rapidly evolving digital landscape, Talesy distinguishes itself through a steadfast commitment to authentic expression, seamless user experience, and a vibrant community of discovery:
            </p>
            <ul className="list-none space-y-4">
              <li className="flex items-start">
                {/* Bullet point and header text colors use accent/primary text */}
                <span className="text-[var(--accent-color)] text-2xl font-bold mr-3 mt-1">•</span>
                <div>
                  <h3 className="text-xl font-semibold text-[var(--text-primary)]">A Sanctuary for Untold Narratives:</h3>
                  <p className="text-[var(--text-secondary)]">Beyond just polished articles, Talesy is designed as the ultimate home for your most genuine thoughts, deeply personal journeys, and unique experiences – the 'ankahi baatein' that truly resonate and deserve to be explored by a curious and engaged audience.</p>
                </div>
              </li>
              <li className="flex items-start">
                <span className="text-[var(--accent-color)] text-2xl font-bold mr-3 mt-1">•</span>
                <div>
                  <h3 className="text-xl font-semibold text-[var(--text-primary)]">Simplicity, Redefined for Creativity:</h3>
                  <p className="text-[var(--text-secondary)]">We meticulously strip away complexity, providing an intuitive and utterly seamless writing environment. Your focus remains entirely on crafting your masterpiece, free from the frustration of battling complicated tools.</p>
                </div>
              </li>
              <li className="flex items-start">
                <span className="text-[var(--accent-color)] text-2xl font-bold mr-3 mt-1">•</span>
                <div>
                  <h3 className="text-xl font-semibold text-[var(--text-primary)]">A Thriving Community of Explorers:</h3>
                  <p className="text-[var(--text-secondary)]">Talesy isn't exclusively for writers; it's a dynamic hub for passionate readers too. Dive into diverse voices, uncover unexpected perspectives, and forge genuine connections within a community that values authenticity and exploration.</p>
                </div>
              </li>
              <li className="flex items-start">
                {/* Note: This specific bullet had 'text-indigo-400' - I've changed it to accent for consistency,
                    but you can introduce another variable if you need multiple accent colors */}
                <span className="text-[var(--accent-color)] text-2xl font-bold mr-3 mt-1">•</span>
                <div>
                  <h3 className="text-xl font-semibold text-[var(--text-primary)]">Unwavering Integrity & Innovation:</h3>
                  <p className="text-[var(--text-secondary)]">We are committed to continuous improvement, guided by your invaluable feedback and a steadfast dedication to transparency and trust. We constantly push the boundaries of what's possible in digital storytelling.</p>
                </div>
              </li>
            </ul>
          </section>

          {/* Section 4: Join the Movement */}
          {/* Background, text, border colors now use CSS variables */}
          <section className="bg-[var(--background-secondary)] p-8 rounded-xl shadow-lg border border-[var(--border-color)] text-center animate-slide-in-up delay-800 transition-colors duration-500">
            {/* Header text and icon color adjusted to accent or primary text */}
            <h2 className="text-3xl font-bold mb-4 text-[var(--accent-color)] flex items-center justify-center">
              <RocketLaunchIcon className="h-8 w-8 mr-3 text-[var(--accent-color)]" />
              Join the Movement
            </h2>
            <p className="text-xl text-[var(--text-primary)] mb-6">
              Step into the expansive world of Talesy. Your unique voice is waiting to captivate, to inspire, and to be discovered.
            </p>
            <p className="text-[var(--text-secondary)] font-light">
              We are a passionate team, entirely dedicated to the continuous evolution and refinement of Talesy. Our journey is intrinsically intertwined with yours, as we collectively nurture a vibrant movement of impactful and authentic storytelling. Come, unleash your narrative, and become a cherished part of the Talesy family.
            </p>
          </section>

          {/* Section 5: Connect with Us - Email as a beautiful button + Social Links */}
          {/* Background, text, border colors now use CSS variables */}
          <section className="bg-[var(--background-secondary)] p-8 rounded-xl shadow-lg border border-[var(--border-color)] text-center animate-slide-in-up delay-1000 transition-colors duration-500">
            {/* Header text and icon color adjusted to accent or primary text */}
            <h2 className="text-3xl font-bold mb-6 text-[var(--accent-color)] flex items-center justify-center">
              <GlobeAltIcon className="h-8 w-8 mr-3 text-[var(--accent-color)]" />
              Connect With Us
            </h2>
            <p className="text-lg text-[var(--text-primary)] mb-6">
              Your insights are invaluable. Whether it's feedback, a suggestion, or just a hello, we're eager to hear from you.
            </p>
            
            {/* Email button: Kept existing gradient as it's a specific stylistic choice.
                If you want this to change with themes, you'd need to define gradient stops as CSS variables
                or provide different gradient classes for each theme. */}
            <a href="mailto:usetalesy@gmail.com" 
               className="inline-flex items-center px-8 py-4 rounded-lg text-white font-semibold 
                          bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 
                          transition-all duration-300 shadow-xl transform hover:scale-105 mb-8">
                <EnvelopeIcon className="h-6 w-6 mr-3" />
                Share Your Feedback
            </a>

            {/* Social Media Links - Using <a> tags */}
            <div className="flex justify-center space-x-6 mt-6">
              {SOCIAL_MEDIA_LINKS.twitter !== "#" && ( // Only show if link is not default '#'
                <a href={SOCIAL_MEDIA_LINKS.twitter} target="_blank" rel="noopener noreferrer" className="text-[var(--text-secondary)] hover:text-[var(--accent-color)] transition-colors duration-200">
                  <svg className="h-8 w-8" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    {/* Twitter/X icon path */}
                    <path d="M18.244 2.25h3.308l-7.227 8.261L22 21.75h-7.112L10.384 13.98 4.664 21.75H1.616l7.73-8.831L1 2.25h7.525L12.024 9.352 18.244 2.25zm-2.91 16.5h1.766L7.43 5.4H5.462l10.872 13.35z"/>
                  </svg>
                </a>
              )}
              {SOCIAL_MEDIA_LINKS.instagram !== "#" && (
                <a href={SOCIAL_MEDIA_LINKS.instagram} target="_blank" rel="noopener noreferrer" className="text-[var(--text-secondary)] hover:text-[var(--accent-color)] transition-colors duration-200">
                  <svg className="h-8 w-8" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    {/* Instagram icon path */}
                    <path fillRule="evenodd" d="M12.315 2c2.43 0 2.715.01 3.655.047 1.052.035 1.524.084 1.84.188.951.256 1.417.556 1.902 1.006.486.447.813.921 1.047 1.417.1.324.152.753.188 1.805.035.94.047 1.255.047 3.655s-.01 2.715-.047 3.655c-.035 1.052-.084 1.524-.188 1.84-.256.951-.556 1.417-1.006 1.902-.447.486-.921.813-1.417 1.047-.324.1-.753.152-1.805.188-.94.035-1.255.047-3.655.047s-2.715-.01-3.655-.047c-1.052-.035-1.524-.084-1.84-.188-.951-.256-1.417-.556-1.902-1.006-.486-.447-.813-.921-1.047-1.417-.1-.324-.152-.753-.188-1.805-.035-.94-.047-1.255-.047-3.655s.01-2.715.047-3.655c.035-1.052.084-1.524.188-1.84.256-.951.556-1.417 1.006-1.902.447-.486.921-.813 1.417-1.047.324-.1.753-.152.188-1.805zM12 2.833c-2.096 0-2.352.008-3.187.046-.867.038-1.32.083-1.597.17-.689.218-1.01.405-1.312.707-.29.289-.475.61-.7.904-.09.12-.178.267-.25.405-.072.138-.13.29-.17.43-.04.14-.07.288-.09.436-.02.148-.03.3-.03.454v5.666c0 .154.01.306.03.454.02.148.05.288.09.436.072.138.158.287.25.405.225.294.41.615.7.904.302.302.623.49 1.312.707.278.087.73.132 1.597.17.835.038 1.091.046 3.187.046s2.352-.008 3.187-.046c.867-.038 1.32-.083 1.597-.17.689-.218 1.01-.405 1.312-.707.29-.289.475-.61.7-.904.09-.12.178.267-.25.405-.072.138-.13.29-.17.43-.04.14-.07.288-.09.436-.02.148-.03.3-.03.454V8.333c0-.154-.01-.306-.03-.454-.02-.148-.05-.288-.09-.436-.072-.138-.158-.287-.25-.405-.225-.294-.41-.615-.7-.904-.302-.302-.623-.49-1.312-.707-.278-.087-.73-.132-1.597-.17-.835-.038-1.091-.046-3.187-.046zM12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zm0 8c-1.656 0-3-1.344-3-3s1.344-3 3-3 3 1.344 3 3-1.344 3-3 3zM18.14 3.733a1.047 1.047 0 11-2.093 0 1.047 1.047 0 012.093 0z" clipRule="evenodd"/>
                  </svg>
                </a>
              )}
              {SOCIAL_MEDIA_LINKS.linkedin !== "#" && (
                <a href={SOCIAL_MEDIA_LINKS.linkedin} target="_blank" rel="noopener noreferrer" className="text-[var(--text-secondary)] hover:text-[var(--accent-color)] transition-colors duration-200">
                  <svg className="h-8 w-8" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    {/* LinkedIn icon path */}
                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.765s.784-1.765 1.75-1.765 1.75.79 1.75 1.765-.783 1.765-1.75 1.765zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                  </svg>
                </a>
              )}
              {/* Add more social media icons here as needed */}
            </div>
          </section>

          <div className="mt-10 pt-6 border-t border-[var(--border-color)] text-center animate-fade-in delay-1200 transition-colors duration-500">
            {/* Text colors adjusted to use CSS variables */}
            <p className="text-2xl font-semibold text-[var(--text-primary)] mb-2">Team Talesy</p>
            <p className="text-md text-[var(--text-secondary)]">Bringing your stories to life, one tale at a time.</p>
          </div>
        </div>
      </div>
    </div>
  );
}