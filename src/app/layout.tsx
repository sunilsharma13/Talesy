// src/app/layout.tsx
import './globals.css';
import { Inter, Roboto_Mono } from 'next/font/google';
import Footer from '@/components/Footer'; // Keep Footer here if it's a global, non-context-dependent footer
import ClientProviders from '@/components/ClientProviders'; // Import your new consolidated client wrapper

// Define your Google Fonts with subsets and variable names
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

const roboto_mono = Roboto_Mono({
  subsets: ['latin'],
  variable: '--font-roboto-mono',
});

export const metadata = {
  title: 'Talesy - Share Your Stories',
  description: 'A platform for writers to share their stories and connect with readers.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${roboto_mono.variable}`}>
      <body>
        {/* All client-side providers are now safely wrapped within ClientProviders */}
        <ClientProviders>
          {children} {/* This will be the rest of your application */}
        </ClientProviders>
        <Footer /> {/* Footer is outside ClientProviders if it doesn't need its context */}
      </body>
    </html>
  );
}