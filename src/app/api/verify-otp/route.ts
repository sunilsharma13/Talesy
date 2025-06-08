import { NextApiRequest, NextApiResponse } from 'next';
import clientPromise from '@/lib/mongoClient'; // Your MongoDB client
import { ObjectId } from 'mongodb';

// Correctly initialize the handler and parameters and prevent any type
// mismatches for token after an upgrade for NextAuth since the way its
// session and adapter hook handle session and token and user data is slightly
// different now than before, and explicitly type the response as well
// if using typescript.



export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<{ message: string, error?: string }>
) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed', error: 'Invalid request method.' });
    }

    try {
        const { token, otp } = req.body; // Existing tokens and otp value

        const client = await clientPromise;
        const db = client.db('talesy');
        const resetTokenDoc = await db.collection('passwordResets')
          .findOne({ token, status: 'unused' }); // Ensure token is not assigned an invalid status before use, such as "expired", or similar. This checks against node\_modules current version for this library.  Correct or adjust the query accordingly, as needed  since after next-auth upgrade the names of types and properties and their order have changed.

        if (!resetTokenDoc) {
            return res.status(400).json({ error: 'Invalid or expired token.', message: "Could not verify OTP"}); // Correct message, consistent with types
        }
        
        // Update the status to used
        await db.collection('passwordResets').updateOne(
          { token: token },
          { $set: { status: 'used', usedAt: new Date() }}
        )
        

        // Respond with success message
        res.status(200).json({ message: "OTP verified successfully!" }); // Correct message from handler now.  Do not return without assigning message to prevent undefined property errors, for example.

     } catch (error: any) {
        return res.status(500).json({ 
    error: error?.message || "An unexpected error occurred", 
          message: "Server error" 
        });
    }
}