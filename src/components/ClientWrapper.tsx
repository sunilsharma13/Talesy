// components/ClientWrapper.tsx

"use client";

import React from "react";
import { Toaster } from "react-hot-toast";

export default function ClientWrapper({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
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
    </>
  );
}