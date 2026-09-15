'use client';

import React from 'react';
import DirectoryScanner from '@/components/DirectoryScanner/DirectoryScanner';

export default function Home(): React.JSX.Element {
  return (
    <main className="min-h-screen bg-slate-900 text-white p-8 flex flex-col items-center gap-6">
      <h1 className="text-3xl font-bold">Audio Visualizer</h1>
      <DirectoryScanner />
    </main>
  );
};