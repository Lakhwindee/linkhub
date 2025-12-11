import nodemailer from 'nodemailer';
import { storage } from './storage.js';

export async function sendEmailViaSMTP(to: string, subject: string, htmlContent: string) {
  try {
    console.log('📧 Sending email via SMTP to:', to);
    
    const emailSetting = await storage.getApiSetting('email');
    
    if (!emailSetting || !emailSetting.settingsJson.email || !emailSetting.settingsJson.appPassword) {
      throw new Error('Email service not configured. Please configure email settings in admin panel.');
    }
    
    const { email, appPassword } = emailSetting.settingsJson;
    
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: email,
        pass: appPassword
      }
    });
    
    const mailOptions = {
      from: `"ThePicStory Platform" <${email}>`,
      to: to,
      subject: subject,
      html: htmlContent
    };
    
    const info = await transporter.sendMail(mailOptions);
    
    console.log('✅ Email sent successfully via SMTP! MessageId:', info.messageId);
    return { success: true, messageId: info.messageId };
    
  } catch (error: any) {
    console.error('❌ SMTP email sending failed:', error.message);
    return { success: false, error: error.message };
  }
}
