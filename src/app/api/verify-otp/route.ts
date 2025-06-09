// app/api/verify-otp/route.ts
import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongoClient';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token, otp } = body;

    const client = await clientPromise;
    const db = client.db('talesy');

    const resetTokenDoc = await db.collection('passwordResets').findOne({
      token,
      status: 'unused',
    });

    if (!resetTokenDoc) {
      return NextResponse.json(
        { error: 'Invalid or expired token.', message: 'Could not verify OTP' },
        { status: 400 }
      );
    }

    await db.collection('passwordResets').updateOne(
      { token },
      {
        $set: {
          status: 'used',
          usedAt: new Date(),
        },
      }
    );

    return NextResponse.json({ message: 'OTP verified successfully!' }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: error?.message || 'An unexpected error occurred',
        message: 'Server error',
      },
      { status: 500 }
    );
  }
}
