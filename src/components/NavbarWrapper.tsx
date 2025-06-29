// src/components/NavbarWrapper.tsx
"use client"; // This must be a client component

import { usePathname } from 'next/navigation';
import Navbar from './Navbar'; // Your existing Navbar component

export default function NavbarWrapper() {
  const pathname = usePathname();
  
  // Decide if Navbar should be shown
  // Navbar will only appear if the pathname is NOT '/' (landing page)
  const shouldShowNavbar = pathname !== '/';

  return (
    <>
      {shouldShowNavbar && <Navbar />}
    </>
  );
}
