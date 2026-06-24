export interface MusicTrack {
  id: string
  track: string
  artist: string
  artwork: string
  previewUrl: string
  duration: number
  genre: string
}

export const MUSIC_LIBRARY: MusicTrack[] = [
  {
    id: '1',
    track: 'Virtual Reality',
    artist: 'Data Stream',
    artwork: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=300&auto=format&fit=crop',
    previewUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    duration: 30,
    genre: 'Electronic',
  },
  {
    id: '2',
    track: 'Digital Dreams',
    artist: 'Techno Vibe',
    artwork: 'https://images.unsplash.com/photo-1571266028243-e4733b0f0bb0?q=80&w=300&auto=format&fit=crop',
    previewUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
    duration: 30,
    genre: 'Electronic',
  },
  {
    id: '3',
    track: 'Neon Nights',
    artist: 'Cyber Synth',
    artwork: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=300&auto=format&fit=crop',
    previewUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
    duration: 30,
    genre: 'Synthwave',
  },
  {
    id: '4',
    track: 'Future Bass',
    artist: 'Wavetable',
    artwork: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=300&auto=format&fit=crop',
    previewUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
    duration: 30,
    genre: 'Bass',
  },
  {
    id: '5',
    track: 'Ocean View',
    artist: 'Analog Heart',
    artwork: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?q=80&w=300&auto=format&fit=crop',
    previewUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3',
    duration: 30,
    genre: 'Ambient',
  },
  {
    id: '6',
    track: 'Crystal Cave',
    artist: 'Ethereal Wave',
    artwork: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=300&auto=format&fit=crop',
    previewUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3',
    duration: 30,
    genre: 'Ambient',
  },
  {
    id: '7',
    track: 'Starlight Drive',
    artist: 'Neon Pulse',
    artwork: 'https://images.unsplash.com/photo-1506157786151-b8491531f063?q=80&w=300&auto=format&fit=crop',
    previewUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3',
    duration: 30,
    genre: 'Synthwave',
  },
  {
    id: '8',
    track: 'Midnight Signal',
    artist: 'Cipher',
    artwork: 'https://images.unsplash.com/photo-1557672172-298e090bd0f1?q=80&w=300&auto=format&fit=crop',
    previewUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3',
    duration: 30,
    genre: 'Electronic',
  },
]
