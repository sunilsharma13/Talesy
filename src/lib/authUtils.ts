import { customAlphabet } from 'nanoid';
import clientPromise from './mongoClient'; 
import { sendEmail } from './email'; 
import { ObjectId } from 'mongodb';

const generateToken = customAlphabet('0123456789', 4);

export async function generatePasswordResetToken(userId: string) { 
 try {
 const client = await clientPromise;
 const db = client.db('talesy'); // your database name
    const token = generateToken();
 const result = await db.collection('passwordResets').insertOne({
 userId,
 token,
 createdAt: new Date(),
 });


 if (result?.acknowledged) {        
 const resetLink = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password/${token}`;  // check .env        
const user = await db.collection('users').findOne({ _id: new ObjectId(userId) });
 const userEmail = user?.email || null;        

        if (userEmail) { // Ensure user has an email to send the token to.
     await sendEmail(
 userEmail,
 "Password Reset Request",
 `Your OTP for password reset is: ${token}`,
 `<div>Your OTP is: <strong>${token}</strong></div>`                
 );
 return token;
 } else {
console.error("❌ Cannot send OTP.  Invalid user email or ID.", user);
 throw new Error ("Cannot reset password.  No user or email found.");
 }        
}
} catch (error) {      
    console.error("❌ Error creating OTP or sending reset email:", error); 
       return null;
 }
 return null
}