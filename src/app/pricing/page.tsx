// app/pricing/page.tsx (or pages/pricing.tsx)
import React from 'react';

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center p-8">
      <h1 className="text-5xl font-extrabold mb-12 text-center text-green-400">Choose Your Plan</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl w-full">
        {/* Free Plan */}
        <div className="bg-gray-800 rounded-lg shadow-xl p-8 flex flex-col items-center border border-gray-700 hover:border-indigo-500 transition-all duration-300">
          <h2 className="text-3xl font-bold mb-4 text-white">Free</h2>
          <p className="text-4xl font-extrabold mb-6 text-indigo-400">$0<span className="text-xl font-normal text-gray-400">/month</span></p>
          <ul className="text-lg text-gray-300 space-y-3 mb-8 text-center">
            <li>✅ 5 Story Posts/Month</li>
            <li>✅ Basic Analytics</li>
            <li>✅ Community Support</li>
            <li>❌ Premium Templates</li>
            <li>❌ Priority Support</li>
          </ul>
          <button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-300">
            Get Started
          </button>
        </div>

        {/* Pro Plan */}
        <div className="bg-gray-800 rounded-lg shadow-xl p-8 flex flex-col items-center border-2 border-indigo-500 transform scale-105 z-10">
          <h2 className="text-3xl font-bold mb-4 text-indigo-400">Pro</h2>
          <p className="text-4xl font-extrabold mb-6 text-indigo-400">$9<span className="text-xl font-normal text-gray-400">/month</span></p>
          <ul className="text-lg text-gray-300 space-y-3 mb-8 text-center">
            <li>✅ Unlimited Story Posts</li>
            <li>✅ Advanced Analytics</li>
            <li>✅ Premium Templates</li>
            <li>✅ Email Support</li>
            <li>✅ Custom Domain</li>
          </ul>
          <button className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-300">
            Choose Pro
          </button>
        </div>

        {/* Enterprise Plan */}
        <div className="bg-gray-800 rounded-lg shadow-xl p-8 flex flex-col items-center border border-gray-700 hover:border-indigo-500 transition-all duration-300">
          <h2 className="text-3xl font-bold mb-4 text-white">Enterprise</h2>
          <p className="text-4xl font-extrabold mb-6 text-indigo-400">Custom</p>
          <ul className="text-lg text-gray-300 space-y-3 mb-8 text-center">
            <li>✅ All Pro Features</li>
            <li>✅ Dedicated Account Manager</li>
            <li>✅ Custom Integrations</li>
            <li>✅ On-site Training</li>
            <li>✅ 24/7 Priority Support</li>
          </ul>
          <button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-300">
            Contact Us
          </button>
        </div>
      </div>

      <div className="mt-16 text-center text-gray-400">
        <p className="text-lg mb-2">Have questions? We're here to help!</p>
        <a href="mailto:support@talesy.com" className="text-indigo-400 hover:text-indigo-300 transition-colors duration-300 text-xl font-semibold">support@talesy.com</a>
      </div>
    </div>
  );
}