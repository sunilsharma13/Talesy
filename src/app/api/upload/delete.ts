import { NextResponse } from 'next/server';
import path from 'path';
import { unlink } from 'fs/promises';

export async function POST(req: Request) {
  const { filePath } = await req.json();

  if (!filePath || !filePath.startsWith('/uploads/')) {
    return NextResponse.json({ error: 'Invalid file path' }, { status: 400 });
  }

  const absolutePath = path.join(process.cwd(), 'public', filePath);

  try {
    await unlink(absolutePath);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete file' }, { status: 500 });
  }
}
