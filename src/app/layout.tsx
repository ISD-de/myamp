import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from '@/context/ThemeContext';
import React from 'react';

export const metadata: Metadata = {
  title: 'Web Audio Player & Visualizer',
  description: 'Music Player mit Winamp Visualizer',
};

export default function RootLayout({
                                     children,
                                   }: {
  children: React.ReactNode;
}) {
  return (
    <html lang="de" data-theme="cyberpunk">
    <body>
    <ThemeProvider>{children}</ThemeProvider>
    </body>
    </html>
  );
}