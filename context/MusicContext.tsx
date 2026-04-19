import React, { createContext, useContext, useState, useEffect } from 'react';
import { Audio } from 'expo-av';

interface MusicContextType {
  currentTrack: any;
  isPlaying: boolean;
  playTrack: (track: any) => Promise<void>;
  togglePlay: () => Promise<void>;
}

const MusicContext = createContext<MusicContextType | undefined>(undefined);

export function MusicProvider({ children }: { children: React.ReactNode }) {
  const [currentTrack, setCurrentTrack] = useState<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [sound, setSound] = useState<Audio.Sound | null>(null);

  async function playTrack(track: any) {
    if (sound) {
      await sound.unloadAsync();
    }
    
    const { sound: newSound } = await Audio.Sound.createAsync(
      { uri: track.uri || track.url },
      { shouldPlay: true }
    );
    
    setSound(newSound);
    setCurrentTrack(track);
    setIsPlaying(true);
    
    newSound.setOnPlaybackStatusUpdate((status) => {
      if (status.isLoaded && status.didJustFinish) {
        setIsPlaying(false);
      }
    });
  }

  async function togglePlay() {
    if (!sound) return;
    if (isPlaying) {
      await sound.pauseAsync();
    } else {
      await sound.playAsync();
    }
    setIsPlaying(!isPlaying);
  }

  return (
    <MusicContext.Provider value={{ currentTrack, isPlaying, playTrack, togglePlay }}>
      {children}
    </MusicContext.Provider>
  );
}

export function useMusic() {
  const context = useContext(MusicContext);
  if (context === undefined) {
    throw new Error('useMusic must be used within a MusicProvider');
  }
  return context;
}
