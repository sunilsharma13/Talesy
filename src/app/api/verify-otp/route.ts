// app/api/verify-otp/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getMongoClient } from '@/lib/dbConnect'; // <--- Change here
// import { ObjectId } from 'mongodb'; // Not needed for this route

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token, otp } = body; // 'otp' parameter is not used in the logic, consider if it's meant to be validated.

    if (!token) { // Ensure token is provided
      return NextResponse.json(
        { error: 'Token is required.', message: 'Missing token for OTP verification' },
        { status: 400 }
      );
    }

    const client = await getMongoClient(); // <--- Change here
    const db = client.db('talesy');

    const resetTokenDoc = await db.collection('passwordResets').findOne({
      token,
      status: 'unused',
      // Add expiry check if not already handled by status field implicitly
      // expiresAt: { $gt: new Date() } 
    });

    if (!resetTokenDoc) {
      return NextResponse.json(
        { error: 'Invalid or expired token.', message: 'Could not verify OTP' },
        { status: 400 }
      );
    }

    // Optional: If 'otp' is actually sent, you might want to validate it here.
    // E.g., if (resetTokenDoc.otp !== otp) { return NextResponse.json({ error: 'Invalid OTP' }, { status: 400 }); }

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
    console.error('Verify OTP error:', error); // More specific logging
    return NextResponse.json(
      {
        error: error?.message || 'An unexpected error occurred',
        message: 'Server error',
      },
      { status: 500 }
    );
  }
}