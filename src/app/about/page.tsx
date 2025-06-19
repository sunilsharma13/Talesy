// app/about/page.tsx (or pages/about.tsx)
import React from 'react';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center p-8">
      <h1 className="text-5xl font-extrabold mb-10 text-center text-purple-400">About Talesy</h1>

      <div className="max-w-4xl mx-auto space-y-8 text-lg text-gray-300 leading-relaxed">
        <p>
          Welcome to **Talesy**, your premier platform for creative expression and storytelling. We believe that everyone has a unique story to tell, and our mission is to provide the most intuitive, powerful, and beautiful tools to bring those narratives to life.
        </p>
        <p>
          Founded in 2023, Talesy emerged from a simple idea: to remove the barriers between inspiration and publication. Whether you're an aspiring novelist, a passionate blogger, a meticulous journalist, or simply someone with an idea to share, Talesy is built for you.
        </p>
        <p>
          Our platform focuses on a seamless writing experience, robust publishing tools, and a vibrant community where stories can find their audience. We are constantly evolving, driven by the feedback of our users and the ever-changing landscape of digital storytelling.
        </p>
        <h2 className="text-3xl font-bold mt-10 mb-4 text-indigo-400">Our Values</h2>
        <ul className="list-disc list-inside space-y-2">
          <li>**Creativity First:** Empowering creators with freedom and flexibility.</li>
          <li>**Simplicity:** Making complex tools feel effortless.</li>
          <li>**Community:** Fostering a supportive and engaging environment for readers and writers alike.</li>
          <li>**Innovation:** Continuously pushing the boundaries of what's possible in digital publishing.</li>
          <li>**Integrity:** Maintaining transparency and trust with our users.</li>
        </ul>
        <p className="mt-8">
          Join the Talesy family today and start sharing your unique voice with the world. We're excited to see what stories you'll tell.
        </p>
        <div className="mt-10 pt-6 border-t border-gray-700 text-center">
          <p className="text-xl font-semibold text-gray-400">Team Talesy</p>
          <p className="text-md text-gray-500">Bringing your stories to life.</p>
        </div>
      </div>
    </div>
  );
}