export interface ParsedSongInfo {
  artist: string | null;
  album: string | null;
  title: string;
}

export function parseSongString(songName: string): ParsedSongInfo {
  const cleanName = songName.trim();
  
  // Prüfen, ob exakt 1 Schrägstrich '/' im String vorkommt
  const slashCount = (cleanName.match(/\//g) || []).length;
  
  if (slashCount === 1) {
    // 1. Am '/' teilen in: [Teil1 ("INTERPRET - ALBUM"), Teil2 ("TRACKNUMMER - TITEL.mp3")]
    const [part1, part2] = cleanName.split('/');
    
    // 2. Teilproblem 1: Am ersten '-' von part1 trennen -> INTERPRET und ALBUM
    const dashIndex1 = part1.indexOf('-');
    const artist = dashIndex1 !== -1 ? part1.substring(0, dashIndex1).trim() : null;
    const album = dashIndex1 !== -1 ? part1.substring(dashIndex1 + 1).trim() : null;
    
    // 3. Teilproblem 2: Am ersten '-' von part2 trennen -> TRACKNUMMER verwerfen, TITEL behalten
    const dashIndex2 = part2.indexOf('-');
    const rawTitle = dashIndex2 !== -1 ? part2.substring(dashIndex2 + 1) : part2;
    
    // Vom Titel am Ende ".mp3" entfernen (case-insensitive) und trimmen
    const title = rawTitle.replace(/\.mp3$/i, '').trim();
    
    return { artist, album, title };
  }
  
  // Fallback (mehr als 1 oder 0 Schrägstriche): Am letzten '-' trennen
  const lastDash = cleanName.lastIndexOf('-');
  const rawFallbackTitle = lastDash !== -1 ? cleanName.substring(lastDash + 1) : cleanName;
  const title = rawFallbackTitle.replace(/\.mp3$/i, '').trim();
  
  return {
    artist: null,
    album: null,
    title,
  };
}