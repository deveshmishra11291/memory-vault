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

    // If Cloudflare R2 / AWS S3 environment variables are configured, upload to S3/R2:
    if (process.env.R2_BUCKET_NAME && process.env.R2_ACCESS_KEY_ID && process.env.R2_SECRET_ACCESS_KEY) {
      // In production, instantiate S3Client with endpoint: https://<account_id>.r2.cloudflarestorage.com
      // Upload using PutObjectCommand and return public R2/CDN URL.
    }

    // Default self-hosted storage: Save to /public/uploads/
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    await mkdir(uploadDir, { recursive: true });

    const safeName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const filePath = path.join(uploadDir, safeName);
    await writeFile(filePath, buffer);

    const publicUrl = `/uploads/${safeName}`;
    return NextResponse.json({ url: publicUrl, filename: safeName });
  } catch (error) {
    console.error('Upload processing error:', error);
    return NextResponse.json({ error: 'Failed to process file' }, { status: 500 });
  }
}
