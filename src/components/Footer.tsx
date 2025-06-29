// Assuming this is src/components/Footer.tsx or a similar path

import React from 'react';

interface FooterProps {
  theme?: 'light' | 'dark' | 'talesy-accent';
}

const Footer: React.FC<FooterProps> = ({ theme = 'dark' }) => { // Default to dark if no theme provided
  // Helper function to get dynamic CSS variables
  const getDynamicThemeClass = (prop: string) => `var(--${prop})`;

  return (
    <footer
      className="p-4 mt-8 text-center transition-colors duration-300" // Added transition for smooth theme change
      style={{
        backgroundColor: getDynamicThemeClass('background-secondary'), // Use theme-aware background
        color: getDynamicThemeClass('text-primary'), // Use theme-aware text color
        borderTop: `1px solid ${getDynamicThemeClass('border-color')}` // Optional: add a top border for separation
      }}
    >
      <p>&copy; {new Date().getFullYear()} My Writing Platform. All rights reserved.</p>
    </footer>
  );
};

export default Footer;