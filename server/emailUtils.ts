import nodemailer from 'nodemailer';
import { sendEmailViaGmailAPI } from './gmailApi';

// Create Gmail transporter (fallback - Gmail API is preferred)
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_EMAIL,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });
};

// Send password reset email using Gmail API (more reliable than SMTP)
export const sendPasswordResetEmail = async (email: string, resetToken: string, userType: 'demo' | 'real') => {
  
  const resetUrl = `${process.env.REPLIT_DOMAINS?.split(',')[0] || 'http://localhost:5000'}/reset-password?token=${resetToken}`;
  
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px;">
        <h1 style="margin: 0; font-size: 28px;">🔐 Password Reset</h1>
        <p style="margin: 10px 0 0 0; font-size: 16px;">HubLink Tourism Platform</p>
      </div>
      
      <div style="background: #f8f9fa; padding: 30px; border-radius: 8px; margin-top: 20px;">
        <h2 style="color: #333; margin-top: 0;">Reset Your Password</h2>
        <p style="color: #666; line-height: 1.6;">
          We received a password reset request for your account. If you made this request, please click the button below to reset your password:
        </p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" 
             style="background: #667eea; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
            🔄 Reset Password
          </a>
        </div>
        
        <div style="background: #e3f2fd; padding: 15px; border-radius: 6px; border-left: 4px solid #2196f3;">
          <p style="margin: 0; color: #1976d2; font-size: 14px;">
            <strong>Link Details:</strong><br>
            This link will expire in 1 hour<br>
            Account Type: ${userType === 'demo' ? 'Demo User' : 'Regular User'}
          </p>
        </div>
        
        <p style="color: #666; font-size: 14px; margin-top: 20px;">
          If you did not request this password reset, please ignore this email. Your password will not be changed.
        </p>
        
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        
        <p style="color: #999; font-size: 12px; text-align: center;">
          © 2025 HubLink Tourism Platform<br>
          This is an automated email. Please do not reply.
        </p>
      </div>
    </div>
  `;

  // Try Gmail API first (more reliable)
  try {
    console.log('📧 Attempting to send password reset email via Gmail API to:', email.replace(/(.{2}).*(@.*)/, '$1***$2'));
    const result = await sendEmailViaGmailAPI(
      email,
      '🔐 Password Reset Request - HubLink',
      htmlContent
    );
    
    if (result.success) {
      console.log('✅ Password reset email sent successfully via Gmail API:', { 
        messageId: result.messageId, 
        email: email.replace(/(.{2}).*(@.*)/, '$1***$2'),
        userType,
        method: 'Gmail API'
      });
      return { success: true, messageId: result.messageId };
    }
    
    // If Gmail API fails, fall back to SMTP
    console.log('⚠️ Gmail API failed, falling back to SMTP...');
    throw new Error('Gmail API failed');
    
  } catch (gmailError) {
    console.log('📧 Using SMTP fallback for password reset email');
    
    // Fallback to Nodemailer SMTP
    try {
      const transporter = createTransporter();
      const mailOptions = {
        from: `"HubLink Support" <${process.env.GMAIL_EMAIL}>`,
        to: email,
        subject: '🔐 Password Reset Request - HubLink',
        html: htmlContent,
      };
      
      const result = await transporter.sendMail(mailOptions);
      console.log('✅ Password reset email sent successfully via SMTP:', { 
        messageId: result.messageId, 
        email: email.replace(/(.{2}).*(@.*)/, '$1***$2'),
        userType,
        method: 'SMTP Fallback'
      });
      return { success: true, messageId: result.messageId };
    } catch (smtpError) {
      console.error('❌ Failed to send password reset email (both Gmail API and SMTP):', smtpError);
      return { success: false, error: smtpError instanceof Error ? smtpError.message : 'Unknown error' };
    }
  }
};

// Generate secure reset token
export const generateResetToken = (): string => {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15) +
         Date.now().toString(36);
};