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

// Send subscription welcome email (after trial starts or immediate activation)
export const sendSubscriptionWelcomeEmail = async (email: string, userName: string, planName: string, isTrialing: boolean, trialDays?: number) => {
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 8px;">
        <h1 style="margin: 0; font-size: 28px;">🎉 Welcome to ${planName}!</h1>
        <p style="margin: 10px 0 0 0; font-size: 16px;">HubLink Tourism Platform</p>
      </div>
      
      <div style="background: #f8f9fa; padding: 30px; border-radius: 8px; margin-top: 20px;">
        <h2 style="color: #333; margin-top: 0;">Hi ${userName},</h2>
        <p style="color: #666; line-height: 1.6;">
          ${isTrialing 
            ? `🎁 Your ${trialDays}-day free trial has started! Explore all premium features at no cost.`
            : `✨ Your ${planName} subscription is now active!`
          }
        </p>
        
        ${isTrialing ? `
        <div style="background: #fff3cd; padding: 15px; border-radius: 6px; border-left: 4px solid #ffc107; margin: 20px 0;">
          <p style="margin: 0; color: #856404; font-size: 14px;">
            <strong>⏰ Trial Details:</strong><br>
            • Trial period: ${trialDays} days<br>
            • Auto-debit after trial ends<br>
            • Cancel anytime before trial ends
          </p>
        </div>
        ` : ''}
        
        <h3 style="color: #333;">What's Included:</h3>
        <ul style="color: #666; line-height: 1.8;">
          <li>✅ Full map access with travelers worldwide</li>
          <li>✅ Send connect requests to any user</li>
          <li>✅ Direct messaging with connections</li>
          <li>✅ Create and join travel events</li>
          <li>✨ Access to Campaign Marketplace</li>
          <li>✨ Apply to brand advertising campaigns</li>
          <li>✨ Earnings dashboard and analytics</li>
        </ul>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.REPLIT_DOMAINS?.split(',')[0] || 'http://localhost:5000'}/feed" 
             style="background: #10b981; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
            🚀 Get Started
          </a>
        </div>
        
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        
        <p style="color: #999; font-size: 12px; text-align: center;">
          Need help? Contact us anytime at ${process.env.GMAIL_EMAIL}<br>
          © 2025 HubLink Tourism Platform
        </p>
      </div>
    </div>
  `;

  try {
    const result = await sendEmailViaGmailAPI(
      email,
      `🎉 Welcome to ${planName} - ${isTrialing ? 'Trial Started!' : 'Subscription Active!'}`,
      htmlContent
    );
    console.log('✅ Welcome email sent:', { email: email.replace(/(.{2}).*(@.*)/, '$1***$2'), isTrialing });
    return result;
  } catch (error) {
    console.error('❌ Failed to send welcome email:', error);
    return { success: false, error };
  }
};

// Send trial ending reminder email
export const sendTrialEndingEmail = async (email: string, userName: string, daysLeft: number, planName: string, pricePerMonth: number) => {
  const urgencyColor = daysLeft <= 1 ? '#dc2626' : daysLeft <= 3 ? '#f59e0b' : '#10b981';
  
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, ${urgencyColor} 0%, ${urgencyColor}dd 100%); color: white; padding: 30px; text-align: center; border-radius: 8px;">
        <h1 style="margin: 0; font-size: 28px;">⏰ Your Trial Ends ${daysLeft === 1 ? 'Tomorrow' : `in ${daysLeft} Days`}</h1>
        <p style="margin: 10px 0 0 0; font-size: 16px;">HubLink ${planName}</p>
      </div>
      
      <div style="background: #f8f9fa; padding: 30px; border-radius: 8px; margin-top: 20px;">
        <h2 style="color: #333; margin-top: 0;">Hi ${userName},</h2>
        <p style="color: #666; line-height: 1.6;">
          ${daysLeft === 1 
            ? '🚨 This is your last day to enjoy all premium features for free!' 
            : `Your free trial ends in ${daysLeft} days.`
          }
        </p>
        
        <div style="background: #fff3cd; padding: 20px; border-radius: 6px; border-left: 4px solid #ffc107; margin: 20px 0;">
          <p style="margin: 0; color: #856404; font-size: 14px;">
            <strong>📅 What Happens Next:</strong><br><br>
            • Your card will be charged <strong>$${pricePerMonth}/month</strong> when your trial ends<br>
            • You'll continue to enjoy all premium features<br>
            • Cancel anytime from your account dashboard
          </p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.REPLIT_DOMAINS?.split(',')[0] || 'http://localhost:5000'}/billing" 
             style="background: ${urgencyColor}; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; margin: 5px;">
            💳 Manage Subscription
          </a>
        </div>
        
        <p style="color: #666; font-size: 14px; text-align: center;">
          Want to cancel? Visit your <a href="${process.env.REPLIT_DOMAINS?.split(',')[0] || 'http://localhost:5000'}/billing" style="color: #10b981;">billing dashboard</a> anytime.
        </p>
        
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        
        <p style="color: #999; font-size: 12px; text-align: center;">
          © 2025 HubLink Tourism Platform<br>
          This is an automated reminder.
        </p>
      </div>
    </div>
  `;

  try {
    const result = await sendEmailViaGmailAPI(
      email,
      `⏰ Trial Ends ${daysLeft === 1 ? 'Tomorrow' : `in ${daysLeft} Days`} - HubLink`,
      htmlContent
    );
    console.log('✅ Trial ending email sent:', { email: email.replace(/(.{2}).*(@.*)/, '$1***$2'), daysLeft });
    return result;
  } catch (error) {
    console.error('❌ Failed to send trial ending email:', error);
    return { success: false, error };
  }
};

// Send payment confirmation email
export const sendPaymentConfirmationEmail = async (email: string, userName: string, amount: number, invoiceUrl: string, nextBillingDate: string) => {
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; padding: 30px; text-align: center; border-radius: 8px;">
        <h1 style="margin: 0; font-size: 28px;">✅ Payment Confirmed</h1>
        <p style="margin: 10px 0 0 0; font-size: 16px;">HubLink Tourism Platform</p>
      </div>
      
      <div style="background: #f8f9fa; padding: 30px; border-radius: 8px; margin-top: 20px;">
        <h2 style="color: #333; margin-top: 0;">Hi ${userName},</h2>
        <p style="color: #666; line-height: 1.6;">
          Your payment of <strong>$${amount}</strong> was successfully processed.
        </p>
        
        <div style="background: white; padding: 20px; border-radius: 6px; border: 1px solid #e5e7eb; margin: 20px 0;">
          <p style="margin: 5px 0; color: #666;"><strong>Amount Paid:</strong> $${amount}</p>
          <p style="margin: 5px 0; color: #666;"><strong>Next Billing Date:</strong> ${nextBillingDate}</p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${invoiceUrl}" 
             style="background: #3b82f6; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; margin: 5px;">
            📄 View Invoice
          </a>
          <a href="${process.env.REPLIT_DOMAINS?.split(',')[0] || 'http://localhost:5000'}/billing" 
             style="background: white; border: 2px solid #3b82f6; color: #3b82f6; padding: 12px 26px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; margin: 5px;">
            💳 Manage Billing
          </a>
        </div>
        
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        
        <p style="color: #999; font-size: 12px; text-align: center;">
          Questions? Contact us at ${process.env.GMAIL_EMAIL}<br>
          © 2025 HubLink Tourism Platform
        </p>
      </div>
    </div>
  `;

  try {
    const result = await sendEmailViaGmailAPI(
      email,
      `✅ Payment Confirmed - $${amount} - HubLink`,
      htmlContent
    );
    console.log('✅ Payment confirmation email sent:', { email: email.replace(/(.{2}).*(@.*)/, '$1***$2'), amount });
    return result;
  } catch (error) {
    console.error('❌ Failed to send payment confirmation email:', error);
    return { success: false, error };
  }
};

// Send payment failed email
export const sendPaymentFailedEmail = async (email: string, userName: string, amount: number, retryDate: string) => {
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); color: white; padding: 30px; text-align: center; border-radius: 8px;">
        <h1 style="margin: 0; font-size: 28px;">⚠️ Payment Failed</h1>
        <p style="margin: 10px 0 0 0; font-size: 16px;">Action Required</p>
      </div>
      
      <div style="background: #f8f9fa; padding: 30px; border-radius: 8px; margin-top: 20px;">
        <h2 style="color: #333; margin-top: 0;">Hi ${userName},</h2>
        <p style="color: #666; line-height: 1.6;">
          We couldn't process your payment of <strong>$${amount}</strong>. Please update your payment method to continue your subscription.
        </p>
        
        <div style="background: #fee2e2; padding: 20px; border-radius: 6px; border-left: 4px solid #dc2626; margin: 20px 0;">
          <p style="margin: 0; color: #991b1b; font-size: 14px;">
            <strong>🔔 What to Do:</strong><br><br>
            1. Update your payment method<br>
            2. We'll automatically retry on <strong>${retryDate}</strong><br>
            3. Your access will be restored once payment succeeds
          </p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.REPLIT_DOMAINS?.split(',')[0] || 'http://localhost:5000'}/billing" 
             style="background: #dc2626; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
            💳 Update Payment Method
          </a>
        </div>
        
        <p style="color: #666; font-size: 14px; text-align: center;">
          Need help? Contact support at ${process.env.GMAIL_EMAIL}
        </p>
        
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        
        <p style="color: #999; font-size: 12px; text-align: center;">
          © 2025 HubLink Tourism Platform<br>
          This is an automated notice.
        </p>
      </div>
    </div>
  `;

  try {
    const result = await sendEmailViaGmailAPI(
      email,
      `⚠️ Payment Failed - Action Required - HubLink`,
      htmlContent
    );
    console.log('✅ Payment failed email sent:', { email: email.replace(/(.{2}).*(@.*)/, '$1***$2'), amount });
    return result;
  } catch (error) {
    console.error('❌ Failed to send payment failed email:', error);
    return { success: false, error };
  }
};

// Send premium upgrade confirmation email (via trial code or direct purchase)
export const sendPremiumUpgradeEmail = async (email: string, userName: string, planName: string, isTrialing: boolean, trialDays?: number, promoCode?: string) => {
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%); color: white; padding: 30px; text-align: center; border-radius: 8px;">
        <h1 style="margin: 0; font-size: 32px;">🎉 Congratulations!</h1>
        <p style="margin: 10px 0 0 0; font-size: 18px; font-weight: bold;">You're Now Premium!</p>
      </div>
      
      <div style="background: #f8f9fa; padding: 30px; border-radius: 8px; margin-top: 20px;">
        <h2 style="color: #333; margin-top: 0;">Welcome to ${planName}, ${userName}! 🚀</h2>
        <p style="color: #666; line-height: 1.6; font-size: 16px;">
          ${isTrialing 
            ? `🎁 Fantastic! You've unlocked a <strong>${trialDays}-day free trial</strong> of ${planName}.${promoCode ? ` Your promo code <strong>${promoCode}</strong> has been successfully applied.` : ''}`
            : `✨ Your account has been successfully upgraded to ${planName}!`
          }
        </p>
        
        ${isTrialing ? `
        <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); padding: 20px; border-radius: 8px; border-left: 4px solid #f59e0b; margin: 25px 0;">
          <p style="margin: 0; color: #92400e; font-size: 15px; line-height: 1.7;">
            <strong>📅 Trial Information:</strong><br><br>
            ⏰ <strong>Duration:</strong> ${trialDays} days of full premium access<br>
            💳 <strong>Auto-renewal:</strong> After trial ends, standard billing applies<br>
            🛑 <strong>Cancel anytime:</strong> Manage from your billing dashboard
          </p>
        </div>
        ` : ''}
        
        <div style="background: white; padding: 25px; border-radius: 8px; margin: 25px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <h3 style="color: #8b5cf6; margin-top: 0; font-size: 18px;">✨ Your Premium Features:</h3>
          <ul style="color: #666; line-height: 2; padding-left: 20px;">
            <li><strong>🗺️ Full Map Access</strong> - Connect with travelers worldwide</li>
            <li><strong>💬 Unlimited Messaging</strong> - Chat with all your connections</li>
            <li><strong>🎯 Campaign Marketplace</strong> - Apply to brand advertising campaigns</li>
            <li><strong>💰 Earnings Dashboard</strong> - Track your income and analytics</li>
            <li><strong>🌟 Creator Profile Badge</strong> - Stand out in the community</li>
            <li><strong>📊 Advanced Analytics</strong> - Deep insights into your performance</li>
          </ul>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.REPLIT_DOMAINS?.split(',')[0] || 'http://localhost:5000'}/feed" 
             style="background: linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; font-size: 16px; box-shadow: 0 4px 6px rgba(139, 92, 246, 0.3);">
            🚀 Explore Premium Features
          </a>
        </div>
        
        <div style="background: #e0e7ff; padding: 20px; border-radius: 8px; margin: 25px 0; text-align: center;">
          <p style="margin: 0; color: #4c1d95; font-size: 14px; line-height: 1.6;">
            💡 <strong>Pro Tip:</strong> Visit your <a href="${process.env.REPLIT_DOMAINS?.split(',')[0] || 'http://localhost:5000'}/billing" style="color: #6d28d9; font-weight: bold; text-decoration: underline;">billing dashboard</a> to manage your subscription anytime
          </p>
        </div>
        
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
        
        <p style="color: #999; font-size: 12px; text-align: center; line-height: 1.6;">
          Need help? We're here for you at ${process.env.GMAIL_EMAIL}<br>
          © 2025 HubLink Tourism Platform<br>
          <em>This is an automated email. Please do not reply.</em>
        </p>
      </div>
    </div>
  `;

  try {
    const result = await sendEmailViaGmailAPI(
      email,
      `🎉 Congratulations! You're Now Premium - HubLink`,
      htmlContent
    );
    console.log('✅ Premium upgrade email sent:', { 
      email: email.replace(/(.{2}).*(@.*)/, '$1***$2'), 
      isTrialing, 
      trialDays,
      promoCode: promoCode ? '***' : 'none'
    });
    return result;
  } catch (error) {
    console.error('❌ Failed to send premium upgrade email:', error);
    return { success: false, error };
  }
};

// Send trial code redeemed confirmation email
export const sendTrialCodeRedeemedEmail = async (
  email: string, 
  userName: string, 
  promoCode: string, 
  planName: string, 
  trialDays: number
) => {
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 8px;">
        <h1 style="margin: 0; font-size: 32px;">🎟️ Code Redeemed!</h1>
        <p style="margin: 10px 0 0 0; font-size: 18px;">Your Free Trial Starts Now</p>
      </div>
      
      <div style="background: #f8f9fa; padding: 30px; border-radius: 8px; margin-top: 20px;">
        <h2 style="color: #333; margin-top: 0;">Great News, ${userName}! 🎊</h2>
        <p style="color: #666; line-height: 1.6; font-size: 16px;">
          You've successfully redeemed promo code <strong style="color: #10b981; font-size: 18px;">${promoCode}</strong>
        </p>
        
        <div style="background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%); padding: 25px; border-radius: 8px; margin: 25px 0; text-align: center; border: 2px solid #10b981;">
          <p style="margin: 0; color: #065f46; font-size: 18px; font-weight: bold;">
            ${trialDays}-Day Free Trial Activated! 🎁
          </p>
          <p style="margin: 10px 0 0 0; color: #047857; font-size: 14px;">
            Enjoy full ${planName} access at no cost
          </p>
        </div>
        
        <div style="background: white; padding: 25px; border-radius: 8px; margin: 25px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <h3 style="color: #10b981; margin-top: 0; font-size: 18px;">📋 Trial Details:</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; color: #666;"><strong>Trial Period:</strong></td>
              <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; color: #333; font-weight: bold;">${trialDays} Days</td>
            </tr>
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; color: #666;"><strong>Plan Level:</strong></td>
              <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; color: #333; font-weight: bold;">${planName}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; color: #666;"><strong>Promo Code:</strong></td>
              <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; color: #10b981; font-weight: bold;">${promoCode}</td>
            </tr>
            <tr>
              <td style="padding: 10px; color: #666;"><strong>Status:</strong></td>
              <td style="padding: 10px; color: #10b981; font-weight: bold;">✅ Active Now</td>
            </tr>
          </table>
        </div>
        
        <div style="background: #fff3cd; padding: 20px; border-radius: 8px; border-left: 4px solid #ffc107; margin: 25px 0;">
          <p style="margin: 0; color: #856404; font-size: 14px; line-height: 1.7;">
            <strong>⚠️ Important:</strong><br><br>
            • Your trial will automatically end in ${trialDays} days<br>
            • Standard billing will apply after trial ends<br>
            • You can cancel anytime before trial expires to avoid charges
          </p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.REPLIT_DOMAINS?.split(',')[0] || 'http://localhost:5000'}/feed" 
             style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; font-size: 16px; box-shadow: 0 4px 6px rgba(16, 185, 129, 0.3); margin: 5px;">
            🚀 Start Exploring
          </a>
          <a href="${process.env.REPLIT_DOMAINS?.split(',')[0] || 'http://localhost:5000'}/billing" 
             style="background: white; border: 2px solid #10b981; color: #10b981; padding: 14px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; font-size: 16px; margin: 5px;">
            💳 Manage Trial
          </a>
        </div>
        
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
        
        <p style="color: #999; font-size: 12px; text-align: center; line-height: 1.6;">
          Questions? Contact us at ${process.env.GMAIL_EMAIL}<br>
          © 2025 HubLink Tourism Platform<br>
          <em>This is an automated confirmation email.</em>
        </p>
      </div>
    </div>
  `;

  try {
    const result = await sendEmailViaGmailAPI(
      email,
      `🎟️ Trial Code ${promoCode} Redeemed - ${trialDays} Days Free! - HubLink`,
      htmlContent
    );
    console.log('✅ Trial code redeemed email sent:', { 
      email: email.replace(/(.{2}).*(@.*)/, '$1***$2'), 
      promoCode: '***',
      trialDays 
    });
    return result;
  } catch (error) {
    console.error('❌ Failed to send trial code redeemed email:', error);
    return { success: false, error };
  }
};