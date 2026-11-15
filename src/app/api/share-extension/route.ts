import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get('content-type') || '';
    
    // Case 1: Direct File upload from iOS Share Sheet (video/photo)
    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const file = formData.get('file') as File | null;
      const title = (formData.get('title') as string) || 'Shared Instagram Story';
      const album = (formData.get('album') as string) || 'all';
      const songTitle = formData.get('songTitle') as string | null;
      const artistName = formData.get('artistName') as string | null;

      if (!file) {
        return NextResponse.json({ error: 'No media payload received from Share Extension' }, { status: 400 });
      }

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const uploadDir = path.join(process.cwd(), 'uploads');
      const publicDir = path.join(process.cwd(), 'public', 'uploads');
      await mkdir(uploadDir, { recursive: true });
      await mkdir(publicDir, { recursive: true });

      const safeName = `ios-share-${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      await writeFile(path.join(uploadDir, safeName), buffer);
      await writeFile(path.join(publicDir, safeName), buffer);

      const mediaUrl = `/api/media/${safeName}`;
      const isVideo = file.type.startsWith('video') || file.name.endsWith('.mp4') || file.name.endsWith('.mov');

      return NextResponse.json({
        success: true,
        source: 'ios-share-extension',
        item: {
          id: `share-${Date.now()}`,
          type: isVideo ? 'video' : 'photo',
          url: mediaUrl,
          thumbnailUrl: mediaUrl,
          title,
          album,
          takenAt: new Date().toISOString().split('T')[0],
          durationSeconds: isVideo ? 15 : 7,
          isFavorite: false,
          cardStyle: {
            rarity: 'trap-magenta',
            mood: isVideo ? 'STORY' : 'SNAP',
          },
          audioTrack: songTitle ? {
            title: songTitle,
            artist: artistName || 'Instagram Audio',
            url: mediaUrl,
            startOffsetSeconds: 0,
            source: 'library',
          } : undefined,
        },
      });
    }

    // Case 2: JSON URL Share from Instagram App (Share Sheet -> Link)
    const body = await req.json();
    const { url, title, songTitle, artistName } = body;

    if (!url) {
      return NextResponse.json({ error: 'No URL provided' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      source: 'ios-share-extension-link',
      item: {
        id: `share-link-${Date.now()}`,
        type: 'video',
        url,
        thumbnailUrl: url,
        title: title || 'Instagram Shared Story',
        album: 'all',
        takenAt: new Date().toISOString().split('T')[0],
        durationSeconds: 15,
        isFavorite: false,
        cardStyle: {
          rarity: 'trap-magenta',
          mood: 'STORY',
        },
        audioTrack: songTitle ? {
          title: songTitle,
          artist: artistName || 'Instagram Audio',
          url,
          startOffsetSeconds: 0,
          source: 'library',
        } : undefined,
      },
    });
  } catch (error) {
    console.error('Share extension ingest error:', error);
    return NextResponse.json({ error: 'Failed to ingest shared media' }, { status: 500 });
  }
}
