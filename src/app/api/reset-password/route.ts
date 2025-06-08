import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongoClient';
import bcrypt from 'bcryptjs';
import { ObjectId } from 'mongodb';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { token, password } = body;
        
        const client = await clientPromise;
        const db = client.db('talesy');
        
        const resetTokenDoc = await db.collection('passwordResets').findOne({ token, used: false });

        if (!resetTokenDoc) {
            return NextResponse.json({ error: 'Invalid or expired reset token.' }, { status: 400 });
        }

        // Convert resetToken.userId to ObjectId if needed
        let userId = resetTokenDoc.userId;
        if (!(userId instanceof ObjectId)){
            try {
             userId = new ObjectId(userId)
            } catch (e){             
              console.error(`Error converting ${userId} to ObjectId.`, e)
              throw new Error ("Invalid user id cannot update password");
            }
        }
 
        const user = await db.collection('users').findOne({ _id: userId });

        if (!user) {
            return NextResponse.json({ error: 'User not found.' }, { status: 404 });
        }

        // Hash the new password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Update user's password in the database
        await db.collection('users').updateOne(
            { _id: user._id },
            { $set: { password: hashedPassword } }
        );

        await db.collection("passwordResets").updateOne(
            { token: token },
            { $set: { status: "expired", used: true, usedAt: new Date() } }
        );
 
        return NextResponse.json({ message: 'Password updated successfully.' });
    } catch (error: any) {
        console.error('Error resetting password:', error);
        return NextResponse.json({ error: error.message || 'Failed to reset password.' }, { status: 500 });
    }
}

// Handle other HTTP methods
export async function GET(request: NextRequest) {
    return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}