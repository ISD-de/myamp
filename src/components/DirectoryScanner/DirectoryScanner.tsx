'use client';

import React, { useState, useEffect } from 'react';
import { getSubfolders } from '@/actions/getFolders';

const CACHE_KEY = 'music_subfolders_cache';

export const FolderLister=()=> {
  const [folders, setFolders] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const loadFolders = async () => {
      setLoading(true);
      setError(null);
      
      const cachedData = localStorage.getItem(CACHE_KEY);
      if (cachedData) {
        try {
          const parsed = JSON.parse(cachedData);
          setFolders(parsed);
          setLoading(false);
          console.log('⚡ Ordner aus localStorage geladen!');
          return;
        } catch (e) {
          localStorage.removeItem(CACHE_KEY);
        }
      }
      
      console.log('📁 Kein Cache gefunden. Rufe Server Action auf...');
      try {
        const result = await getSubfolders();
        setFolders(result);
        
        localStorage.setItem(CACHE_KEY, JSON.stringify(result));
      } catch (err: any) {
        setError(err.message);
        setFolders([]);
      } finally {
        setLoading(false);
      }
    };
    
    loadFolders();
  }, []);
  
  const handleRefresh = async () => {
    localStorage.removeItem(CACHE_KEY);
    setLoading(true);
    try {
      const result = await getSubfolders();
      setFolders(result);
      localStorage.setItem(CACHE_KEY, JSON.stringify(result));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="w-full max-w-xl bg-slate-800 p-6 rounded-xl text-white shadow-lg flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Unterordner (mit localStorage)</h2>
        <button
          onClick={handleRefresh}
          className="text-xs bg-slate-700 hover:bg-slate-600 px-3 py-1.5 rounded transition"
        >
          🔄 Cache erneuern
        </button>
      </div>
      
      {loading && <p className="text-slate-400">Lade Ordner...</p>}
      
      {error && <div className="text-red-400 text-sm bg-red-950/50 p-3 rounded">{error}</div>}
      
      {!loading && !error && folders.length > 0 && (
        <div className="mt-2 border border-slate-700 rounded-lg p-4 bg-slate-900">
          <h3 className="text-sm font-semibold text-slate-400 mb-2">Gefundene Unterordner ({folders.length}):</h3>
          <ul className="flex flex-col gap-1">
            {folders.map((folder, index) => (
              <li key={index} className="flex items-center gap-2 text-amber-400 text-sm">
                <span>📁</span>
                <span>{folder}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default FolderLister;