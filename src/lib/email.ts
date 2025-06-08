// lib/email.ts
import { Resend } from 'resend';

// Initialize Resend with API key
const resend = new Resend(process.env.RESEND_API_KEY);

// Basic email sending function
export async function sendEmail(
  to: string,
  subject: string,
  text: string,
  html: string
) {
  try {
    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'onboarding@resend.dev',
      to: to,
      subject: subject,
      text: text,
      html: html,
    });
    
    if (error) {
      console.error('Email sending error:', error);
      return { success: false, error };
    }
    
    console.log('Email sent successfully:', data);
    return { success: true, data };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error };
  }
}

// Type-safe helper for template-based emails
export async function sendTemplateEmail(
  to: string,
  templateType: 'newFollower' | 'newComment' | 'newLike' | 'weeklyDigest',
  templateData: any[]
) {
  try {
    let subject = '';
    let text = '';
    let html = '';
    
    // Select the right template based on the type
    switch(templateType) {
      case 'newFollower': {
        const [userName, followerName] = templateData as [string, string];
        subject = `${followerName} started following you on Talesy`;
        text = `Hi ${userName},\n\n${followerName} started following you on Talesy. Check out their profile!`;
        html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>New Follower on Talesy</h2>
            <p>Hi ${userName},</p>
            <p><strong>${followerName}</strong> started following you on Talesy.</p>
          </div>
        `;
        break;
      }
      
      case 'newComment': {
        const [userName, commenterName, postTitle, postId, comment] = templateData as [string, string, string, string, string];
        subject = `${commenterName} commented on your story`;
        text = `Hi ${userName},\n\n${commenterName} commented on your story "${postTitle}": "${comment}"`;
        html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>New Comment on Your Story</h2>
            <p>Hi ${userName},</p>
            <p><strong>${commenterName}</strong> commented on your story <strong>"${postTitle}"</strong>:</p>
            <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 15px 0;">
              "${comment}"
            </div>
          </div>
        `;
        break;
      }
      
      case 'newLike': {
        const [userName, likerName, postTitle, postId] = templateData as [string, string, string, string];
        subject = `${likerName} liked your story`;
        text = `Hi ${userName},\n\n${likerName} liked your story "${postTitle}".`;
        html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Someone Liked Your Story</h2>
            <p>Hi ${userName},</p>
            <p><strong>${likerName}</strong> liked your story <strong>"${postTitle}"</strong>.</p>
          </div>
        `;
        break;
      }
      
      case 'weeklyDigest': {
        const [userName, stats] = templateData as [string, { newFollowers: number, newLikes: number, newComments: number }];
        subject = `Your Weekly Talesy Digest`;
        text = `Hi ${userName},\n\nHere's your weekly activity digest from Talesy:\n- ${stats.newFollowers} new followers\n- ${stats.newLikes} new likes on your stories\n- ${stats.newComments} new comments`;
        html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Your Weekly Digest</h2>
            <p>Hi ${userName},</p>
            <p>Here's a summary of your activity this week on Talesy:</p>
            <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
              <tr style="background-color: #f3f4f6;">
                <td style="padding: 10px; border: 1px solid #ddd;">New Followers</td>
                <td style="padding: 10px; border: 1px solid #ddd; text-align: center;"><strong>${stats.newFollowers}</strong></td>
              </tr>
              <tr>
                <td style="padding: 10px; border: 1px solid #ddd;">New Likes</td>
                <td style="padding: 10px; border: 1px solid #ddd; text-align: center;"><strong>${stats.newLikes}</strong></td>
              </tr>
              <tr style="background-color: #f3f4f6;">
                <td style="padding: 10px; border: 1px solid #ddd;">New Comments</td>
                <td style="padding: 10px; border: 1px solid #ddd; text-align: center;"><strong>${stats.newComments}</strong></td>
              </tr>
            </table>
          </div>
        `;
        break;
      }
    }
    
    return sendEmail(to, subject, text, html);
  } catch (error) {
    console.error('Error sending template email:', error);
    return { success: false, error };
  }
}