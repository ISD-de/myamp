'use client';

import React, { createContext, useContext, useEffect, useRef, useCallback } from 'react';

type KeyHandler = (e: KeyboardEvent) => void;

interface KeyboardContextType {
  registerHandler: (id: string, handler: KeyHandler, priority?: number) => void;
  unregisterHandler: (id: string) => void;
}

const KeyboardContext = createContext<KeyboardContextType | null>(null);

export function KeyboardProvider({ children }: { children: React.ReactNode }) {
  // useRef statt useState, damit das Registrieren KEINE Re-Renders auslöst!
  const handlersRef = useRef<Map<string, { handler: KeyHandler; priority: number }>>(new Map());
  
  const registerHandler = useCallback((id: string, handler: KeyHandler, priority: number = 0) => {
    handlersRef.current.set(id, { handler, priority });
  }, []);
  
  const unregisterHandler = useCallback((id: string) => {
    handlersRef.current.delete(id);
  }, []);
  
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;
      
      // Hole alle aktuellen Handler aus der Ref und sortiere nach Priorität
      const sortedHandlers = Array.from(handlersRef.current.entries()).sort(
        (a, b) => b[1].priority - a[1].priority
      );
      
      for (const [_, item] of sortedHandlers) {
        // Falls ein Handler das Event verarbeitet, bricht die Schleife ab (optional,
        // hier führen wir sie aus, aber Prioritäten greifen perfekt).
        item.handler(e);
      }
    };
    
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []); // Läuft jetzt exakt 1x beim Mounten!
  
  return (
    <KeyboardContext.Provider value={{ registerHandler, unregisterHandler }}>
      {children}
    </KeyboardContext.Provider>
  );
}

export function useKeyboardShortcut(id: string, handler: KeyHandler, priority: number = 0, deps: any[] = []) {
  const context = useContext(KeyboardContext);
  const stableHandler = useCallback(handler, deps);
  
  useEffect(() => {
    if (!context) return;
    context.registerHandler(id, stableHandler, priority);
    return () => {
      context.unregisterHandler(id);
    };
  }, [context, id, stableHandler, priority]);
}