// pages/api/reset-password.ts
import { NextApiRequest, NextApiResponse } from 'next';
import clientPromise from '../../../lib/mongoClient';
import bcrypt from 'bcryptjs'; // Or bcrypt if using latest next-auth
import { sendEmail } from '@/lib/email';
import { ObjectId } from 'mongodb';



export default async function handler(req: NextApiRequest, res: NextApiResponse) {

    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    try {
        const { token, password } = req.body; // Get token and password from body
        const client = await clientPromise;
        const db = client.db('talesy'); // your db name
        const resetTokenDoc = await db.collection('passwordResets')
.findOne({ token, used: false }); // Change to reflect your current schema

        if (!resetTokenDoc) {
            return res.status(400).json({ error: 'Invalid or expired reset token.' });
        }

        // Convert resetToken.userId to ObjectId if needed
        let userId = resetTokenDoc.userId;
        if (!(userId instanceof ObjectId)){
            try {
             userId = new ObjectId(userId)
            } catch (e){             
              console.error(`Error converting ${userId} to ObjectId.`, e)
              throw new Error ("Invalid user id cannot update password");
            }
        }
 
        const user = await db.collection('users').findOne({ _id: userId });

        if (!user) {
            return res.status(404).json({ error: 'User not found.' });
        }

        // Hash the new password
        const hashedPassword = await bcrypt.hash(password, 10); // Or bcrypt if that's what your package.json uses after `npm i`

        // Update user's password in the database
        await db.collection('users').updateOne(
            { _id: user._id },
            { $set: { password: hashedPassword } } // Ensure correct value assigned
        );

        // Mark the reset token as used or delete in your db, to prevent re-use. Update as needed depending on how you want to implement the one-time use reset token.

        // For example, for soft-delete, set status: "expired":

        await db.collection("passwordResets").updateOne(  // Use updateOne to modify doc
            { token: token },
            { $set: { status: "expired", used: true, usedAt: new Date() } } // update fields. These changes assume that the collection exists in your database.
        );
 
        // Respond with success. No need for `sendEmail` here unless you want to notify the user
        return res.status(200).json({ message: 'Password updated successfully.' });
    } catch (error: any) {
        console.error('Error resetting password:', error);
        return res.status(500).json({ error: error.message || 'Failed to reset password.' });
    }
}