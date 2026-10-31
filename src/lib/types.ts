export type MediaType = 'photo' | 'video';

export interface AudioTrack {
  id: string;
  title: string;
  artist: string;
  url: string; // Direct audio stream / preview URL
  durationSeconds?: number;
  artworkUrl?: string;
  albumName?: string;
  source?: 'library' | 'spotify' | 'ytmusic' | 'custom';
  externalId?: string;
}

export interface MediaItem {
  id: string;
  type: MediaType;
  url: string; // Remote URL or object URL
  thumbnailUrl?: string;
  title: string;
  caption?: string;
  takenAt: string; // ISO date string or human readable
  album: string; // Album name or category
  location?: string;
  audioTrack?: {
    title: string;
    artist: string;
    url: string;
    startOffsetSeconds: number;
    artworkUrl?: string;
    albumName?: string;
    source?: 'library' | 'spotify' | 'ytmusic' | 'custom';
  };
  audioMix?: {
    videoVolume: number; // 0 to 1 (volume of original video audio)
    musicVolume: number; // 0 to 1 (volume of paired soundtrack)
  };
  durationSeconds: number; // Duration to display in story mode (e.g. 7s for photo, or video duration)
  isFavorite?: boolean;
}

export interface Album {
  id: string;
  name: string;
  description: string;
  coverUrl: string;
  itemCount: number;
}
