// src/app/page.tsx
// यह फाइल तुम्हारी नई मुख्य लैंडिंग पेज है रूट रूट (/) के लिए।

"use client"; // यह कॉम्पोनेंट एक क्लाइंट कॉम्पोनेंट है

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useTheme } from '@/context/ThemeContext'; // मान लिया है कि ThemeContext सही से सेट है
import { useSession } from 'next-auth/react'; // NEW: लॉग इन स्टेटस चेक करने के लिए useSession इम्पोर्ट करें

const LandingPage = () => {
  const router = useRouter();
  const { getDynamicThemeClass } = useTheme(); // थीम से डायनामिक क्लास प्राप्त करने के लिए
  const { data: session, status } = useSession(); // NEW: यूज़र सेशन डेटा और स्टेटस प्राप्त करें

  const handleStartWritingClick = () => {
    // अगर यूज़र लॉग इन नहीं है, तो उसे लॉग इन पेज पर रीडायरेक्ट करें
    if (status === "unauthenticated") {
      router.push('/login'); // या '/signup' पर भी रीडायरेक्ट कर सकते हैं
    } else {
      // अगर यूज़र लॉग इन है, तो उसे लिखने वाले पेज पर ले जाएँ
      router.push('/write');
    }
  };

  return (
    <div 
      className="flex flex-col items-center justify-center min-h-[calc(100vh-80px)] p-4 text-center"
      style={{ backgroundColor: getDynamicThemeClass('background-primary'), color: getDynamicThemeClass('text-primary') }}
    >
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="max-w-3xl mx-auto"
      >
        <h1 className="text-4xl md:text-6xl font-extrabold mb-6 leading-tight"
            style={{ color: getDynamicThemeClass('accent-color') }}>
          Talesy में आपका स्वागत है: आपकी कहानी, आपकी आवाज़
        </h1>
        <p className="text-lg md:text-xl mb-8 leading-relaxed"
           style={{ color: getDynamicThemeClass('text-secondary') }}>
          अपनी रचनात्मकता को उजागर करें और अपनी अनूठी कहानियों को दुनिया के साथ साझा करें। 
          Talesy लेखकों को खुद को व्यक्त करने और पाठकों से जुड़ने के लिए एक सहज मंच प्रदान करता है।
        </p>
        
        <motion.button
          onClick={handleStartWritingClick}
          // NEW: बटन डिसेबल तब भी होगा जब सेशन लोड हो रहा हो
          disabled={status === "loading"} 
          className="px-8 py-4 text-lg md:text-xl font-medium rounded-full shadow-lg transition-all transform duration-300 disabled:opacity-70 disabled:cursor-not-allowed"
          style={{
            backgroundColor: getDynamicThemeClass('accent-color'),
            color: 'white',
            border: `2px solid ${getDynamicThemeClass('accent-color')}`,
            boxShadow: `0 4px 10px ${getDynamicThemeClass('shadow-color-subtle') || 'rgba(0,0,0,0.1)'}`
          }}
          onMouseEnter={(e) => {
            // NEW: होवर इफ़ेक्ट तभी अप्लाई करें जब बटन डिसेबल न हो
            if (status !== "loading") { 
              e.currentTarget.style.backgroundColor = getDynamicThemeClass('active-bg');
              e.currentTarget.style.color = getDynamicThemeClass('text-primary');
              e.currentTarget.style.borderColor = getDynamicThemeClass('active-bg');
            }
          }}
          onMouseLeave={(e) => {
            // NEW: होवर इफ़ेक्ट तभी रीवर्ट करें जब बटन डिसेबल न हो
            if (status !== "loading") {
              e.currentTarget.style.backgroundColor = getDynamicThemeClass('accent-color');
              e.currentTarget.style.color = 'white';
              e.currentTarget.style.borderColor = getDynamicThemeClass('accent-color');
            }
          }}
          // NEW: Framer Motion एनीमेशन भी डिसेबल स्टेट के हिसाब से
          whileHover={status !== "loading" ? { scale: 1.05, y: -2, boxShadow: `0 8px 20px ${getDynamicThemeClass('shadow-color-subtle') || 'rgba(0,0,0,0.2)'}` } : {}}
          whileTap={status !== "loading" ? { scale: 0.95 } : {}}
        >
          {/* NEW: बटन टेक्स्ट लॉग इन स्टेटस के हिसाब से */}
          {status === "loading" ? 'लोड हो रहा है...' : (status === "authenticated" ? 'अभी लिखना शुरू करें' : 'शुरू करें')}
        </motion.button>
      </motion.div>
    </div>
  );
};

export default LandingPage;
