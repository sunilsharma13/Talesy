// src/app/layout.tsx
import './globals.css';
import { Inter, Roboto_Mono } from 'next/font/google';
import Footer from '@/components/Footer'; 
import ClientProviders from '@/components/ClientProviders';
import NavbarWrapper from '@/components/NavbarWrapper'; // NEW: NavbarWrapper इम्पोर्ट करें

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
        <ClientProviders>
          <NavbarWrapper /> 
          {children} 
        </ClientProviders>
        <Footer /> 
      </body>
    </html>
  );
}
