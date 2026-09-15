'use client';

import React, {useEffect, useState} from 'react';
import {getSubfolders} from '@/actions/getFolders';

const CACHE_KEY = 'music_subfolders_cache';

interface FolderListerProps {
  onSelectFolder?: (folderName: string) => void;
}

export const FolderLister = ({onSelectFolder}: FolderListerProps) => {
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
  
  const handleFolderClick = (folder: string) => {
    if (onSelectFolder) {
      onSelectFolder(folder);
    }
  };
  
  return (
    <div
      className="w-full h-full overflow-auto overflow-y-auto snap-y snap-mandatory bg-background flex flex-col gap-4">
      {loading && <div className="p-3 text-main border border-border">Lade Ordner...</div>}
      {error && <div className="text-main text-sm bg-red-950/50 p-3 border border-border">{error}</div>}
      {!loading && !error && folders.length > 0 && (
        <div className="border border-border bg-background">
          <ul className="flex flex-col ">
            {folders.map((folder, index) => (
              <li key={index}
                  onClick={() => handleFolderClick(folder)}
                  className="snap-start text-text-light hover:bg-background-hover text-sm break-all border border-border p-1 -mb-px">
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