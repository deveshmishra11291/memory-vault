import { NextRequest, NextResponse } from 'next/server';

interface ITunesTrack {
  trackId: number;
  trackName: string;
  artistName: string;
  collectionName: string;
  previewUrl: string;
  artworkUrl100: string;
  trackTimeMillis: number;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q')?.trim() || '';
    const category = searchParams.get('category')?.trim() || '';
    const limit = parseInt(searchParams.get('limit') || '25', 10);

    // Determine search term: if user typed something, use it; otherwise use category/trending
    let searchTerm = query;
    if (!searchTerm) {
      if (category === 'trending') searchTerm = 'billboard top hits 2024';
      else if (category === 'lofi') searchTerm = 'lofi chill beats';
      else if (category === 'roadtrip') searchTerm = 'road trip acoustic rock';
      else if (category === 'chill') searchTerm = 'indie acoustic sunset';
      else searchTerm = 'top global hits';
    }

    const itunesUrl = `https://itunes.apple.com/search?term=${encodeURIComponent(
      searchTerm
    )}&entity=song&limit=${Math.min(limit, 50)}`;

    const response = await fetch(itunesUrl, {
      headers: {
        'User-Agent': 'MemoryVault/1.0',
      },
      next: { revalidate: 3600 }, // Cache search results for 1 hour
    });

    if (!response.ok) {
      throw new Error(`iTunes API responded with status ${response.status}`);
    }

    const data = await response.json();

    const tracks = (data.results || [])
      .filter((item: ITunesTrack) => item.previewUrl && item.trackName)
      .map((item: ITunesTrack) => {
        // Upgrade artwork from 100x100 to 600x600 for sharp crisp album art
        const highResArtwork = item.artworkUrl100
          ? item.artworkUrl100.replace('100x100bb.jpg', '600x600bb.jpg')
          : '';

        return {
          id: `itunes-${item.trackId}`,
          title: item.trackName,
          artist: item.artistName,
          albumName: item.collectionName || 'Single',
          artworkUrl: highResArtwork || item.artworkUrl100,
          url: item.previewUrl,
          durationSeconds: Math.round(item.trackTimeMillis / 1000) || 30,
          source: 'library' as const,
        };
      });

    return NextResponse.json({
      query: searchTerm,
      count: tracks.length,
      tracks,
    });
  } catch (error) {
    console.error('Music search error:', error);
    return NextResponse.json(
      {
        error: 'Failed to search music catalog',
        tracks: [],
      },
      { status: 500 }
    );
  }
}
