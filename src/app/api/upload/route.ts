import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Save to server-side uploads directory
    const uploadDir = path.join(process.cwd(), 'uploads');
    await mkdir(uploadDir, { recursive: true });

    // Also mirror to public/uploads for direct static access
    const publicDir = path.join(process.cwd(), 'public', 'uploads');
    await mkdir(publicDir, { recursive: true });

    const safeName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    
    await writeFile(path.join(uploadDir, safeName), buffer);
    await writeFile(path.join(publicDir, safeName), buffer);

    // Permanent API streaming URL
    const mediaUrl = `/api/media/${safeName}`;

    return NextResponse.json({ 
      success: true,
      url: mediaUrl, 
      filename: safeName 
    });
  } catch (error) {
    console.error('Upload processing error:', error);
    return NextResponse.json({ error: 'Failed to process file' }, { status: 500 });
  }
}
