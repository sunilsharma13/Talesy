// src/components/ClientProviders.tsx
'use client'; // Bahut zaroori! Ye Client Component hai

import React from 'react';
import { SessionProvider } from 'next-auth/react';
import { Toaster } from 'react-hot-toast';
import { usePathname } from 'next/navigation';
import Navbar from '@/components/Navbar';

// Naya ThemeProvider import kiya
import { ThemeProvider } from '@/context/ThemeContext'; // Ensure this path is correct based on Step 1

// Agar QueryProvider ya koi aur global provider hai, use bhi import kar lena
// import QueryProvider from './QueryProvider'; // Uncomment and adjust path if you have this

interface ClientProvidersProps {
  children: React.ReactNode;
  // Agar tu session ko layout.tsx mein fetch karke yahan pass kar raha hai, to isko uncomment kar:
  // session?: any; 
}

export default function ClientProviders({ children /*, session */ }: ClientProvidersProps) {
  const pathname = usePathname();
  const isLogin = pathname === "/login"; // Check if current path is login page

  return (
    // NextAuth ka SessionProvider sabse bahar hona chahiye client side par
    <SessionProvider /* session={session} */> 
      {/* Agar QueryProvider hai, to SessionProvider ke andar aur ThemeProvider ke bahar rakho */}
      {/* <QueryProvider> */}

        {/* Naya ThemeProvider ab yahan wrap karega baki sab components ko */}
        <ThemeProvider>
          {/* Navbar, conditional render hoga */}
          {!isLogin && <Navbar />}

          {/* Main content area */}
          <main className={isLogin ? "" : "container mx-auto p-4"}>
            {children}
          </main>
        </ThemeProvider>

        {/* Toaster for notifications */}
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#333',
              color: '#fff',
              borderRadius: '0.5rem',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            },
            success: {
              style: {
                background: 'rgba(34, 197, 94, 0.2)',
                border: '1px solid rgba(34, 197, 94, 0.4)',
                color: '#fff',
              },
            },
            error: {
              style: {
                background: 'rgba(239, 68, 68, 0.2)',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                color: '#fff',
              },
            },
          }}
        />

      {/* </QueryProvider> */}
    </SessionProvider>
  );
}