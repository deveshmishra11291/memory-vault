import { MediaItem, Album } from './types';
import { INITIAL_ALBUMS, INITIAL_MEMORIES } from './sampleData';

const STORAGE_KEY_MEMORIES = 'memory_vault_items_v1';
const STORAGE_KEY_ALBUMS = 'memory_vault_albums_v1';

export function loadMemories(): MediaItem[] {
  if (typeof window === 'undefined') return INITIAL_MEMORIES;
  try {
    const stored = localStorage.getItem(STORAGE_KEY_MEMORIES);
    if (!stored) {
      localStorage.setItem(STORAGE_KEY_MEMORIES, JSON.stringify(INITIAL_MEMORIES));
      return INITIAL_MEMORIES;
    }
    return JSON.parse(stored);
  } catch (err) {
    console.error('Failed to load memories from localStorage', err);
    return INITIAL_MEMORIES;
  }
}

export function saveMemories(memories: MediaItem[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_MEMORIES, JSON.stringify(memories));
  } catch (err) {
    console.error('Failed to save memories to localStorage', err);
  }
}

export function loadAlbums(): Album[] {
  if (typeof window === 'undefined') return INITIAL_ALBUMS;
  try {
    const stored = localStorage.getItem(STORAGE_KEY_ALBUMS);
    if (!stored) {
      localStorage.setItem(STORAGE_KEY_ALBUMS, JSON.stringify(INITIAL_ALBUMS));
      return INITIAL_ALBUMS;
    }
    return JSON.parse(stored);
  } catch (err) {
    console.error('Failed to load albums from localStorage', err);
    return INITIAL_ALBUMS;
  }
}

export function saveAlbums(albums: Album[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_ALBUMS, JSON.stringify(albums));
  } catch (err) {
    console.error('Failed to save albums to localStorage', err);
  }
}

/**
 * Cloud Storage Upload Integration Helper (Cloudflare R2 / AWS S3)
 * For production deployment: requests pre-signed URL from API route, uploads binary, returns permanent URL.
 */
export async function uploadToStorage(file: File, endpoint = '/api/upload'): Promise<string> {
  // If cloud storage backend is configured, send to server route
  try {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(endpoint, {
      method: 'POST',
      body: formData,
    });
    if (res.ok) {
      const data = await res.json();
      return data.url;
    }
  } catch {
    // Fallback gracefully for local-only demo mode
  }

  // Local fallback: convert to base64 or blob URL
  return URL.createObjectURL(file);
}
