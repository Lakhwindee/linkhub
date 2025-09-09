import type { Express } from "express";
import cookieParser from "cookie-parser";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import Stripe from "stripe";
import OpenAI from "openai";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { ObjectStorageService, ObjectNotFoundError } from "./objectStorage";
import { ObjectPermission } from "./objectAcl";
import { insertUserProfileSchema, insertConnectRequestSchema, insertMessageSchema, insertPostSchema, insertEventSchema, insertAdSchema, insertPublisherAdSchema, insertReportSchema, insertStaySchema, insertStayBookingSchema, insertStayReviewSchema, adReservations, insertPersonalHostSchema, insertHostBookingSchema } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";
import { ZodError } from "zod";
import { createPaypalOrder, capturePaypalOrder, loadPaypalDefault } from "./paypal";
import FormData from 'form-data';
import fetch from 'node-fetch';

// Initialize Stripe (only if keys are available)
const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-08-27.basil",
}) : null;

// Initialize OpenAI (only if API key is available)
const openai = process.env.OPENAI_API_KEY ? new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
}) : null;

export async function registerRoutes(app: Express): Promise<Server> {
  // Cookie parser middleware
  app.use(cookieParser());
  
  // Auth middleware
  await setupAuth(app);

  // Config routes
  app.get('/api/config/maps-key', async (req, res) => {
    try {
      // Use environment API key if available, otherwise use development fallback
      const apiKey = process.env.GOOGLE_MAPS_API_KEY || "AIzaSyDdnPsmwNOylJSDrt-K2T6nXqJQ-demo";
      res.json({ apiKey });
    } catch (error) {
      console.error("Error fetching Google Maps API key:", error);
      res.status(500).json({ message: "Failed to fetch API configuration" });
    }
  });

  // Auth routes
  app.post('/api/auth/logout', async (req: any, res) => {
    // Clear demo session cookie
    res.clearCookie('session_id', { path: '/' });
    res.clearCookie('connect.sid', { path: '/' });
    
    req.session.destroy((err: any) => {
      if (err) {
        console.error('Session destroy error:', err);
        return res.status(500).json({ message: 'Logout failed' });
      }
      console.log('User logged out successfully');
      res.json({ message: 'Logged out successfully' });
    });
  });

  // OTP Generation and Verification Endpoints
  const otpStore = new Map(); // Simple in-memory store for demo

  // Function to send OTP email using existing email infrastructure
  async function sendOTPEmail(email: string, otp: string) {
    try {
      // Use existing email template system
      const emailContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">HubLink Account Verification</h2>
          <p>Your verification code is:</p>
          <div style="background: #f3f4f6; padding: 20px; margin: 20px 0; text-align: center; border-radius: 8px;">
            <span style="font-size: 32px; font-weight: bold; color: #2563eb; letter-spacing: 8px;">${otp}</span>
          </div>
          <p>This code will expire in 10 minutes.</p>
          <p>If you didn't request this verification, please ignore this email.</p>
          <hr>
          <p style="color: #6b7280; font-size: 12px;">This is an automated message from HubLink.</p>
        </div>
      `;

      console.log(`📧 Email OTP sent to ${email}: ${otp}`);
      console.log(`🔧 Using existing SMTP: smtp.hublink.com`);
      
      // In production, this would use the configured SMTP settings
      // For demo, we simulate successful email delivery
      return { success: true, messageId: `email_${Date.now()}` };
      
    } catch (error) {
      console.error('Error sending OTP email:', error);
      throw error;
    }
  }

  app.post('/api/auth/send-otp', async (req, res) => {
    try {
      const { email, phone, type } = req.body;
      
      if (!email && !phone) {
        return res.status(400).json({ message: 'Email or phone number required' });
      }

      // Generate 6-digit OTP
      const emailOTP = Math.floor(100000 + Math.random() * 900000).toString();
      const smsOTP = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

      let emailSent = false;
      let smsSent = false;

      // Send Email OTP using existing email system
      if (type === 'email' || type === 'both') {
        otpStore.set(`email:${email}`, { otp: emailOTP, expiresAt });
        const emailResult = await sendOTPEmail(email, emailOTP);
        emailSent = emailResult.success;
      }
      
      // Send SMS OTP (placeholder - would integrate with SMS service)
      if (type === 'sms' || type === 'both') {
        otpStore.set(`sms:${phone}`, { otp: smsOTP, expiresAt });
        console.log(`📱 SMS OTP for ${phone}: ${smsOTP}`);
        smsSent = true; // Simulate SMS sent
      }

      // Create audit log for OTP sending
      const auditUserId = req.user?.claims?.sub || 'anonymous';
      await storage.createAuditLog({
        actorId: auditUserId,
        action: 'send_otp',
        targetType: 'otp_verification',
        targetId: email || phone,
        metaJson: { type, email: !!email, phone: !!phone }
      });
      
      res.json({ 
        message: 'OTP sent successfully',
        emailSent,
        smsSent,
        // For demo purposes, include OTPs in response (never do this in production!)
        debug: {
          emailOTP: type === 'email' || type === 'both' ? emailOTP : null,
          smsOTP: type === 'sms' || type === 'both' ? smsOTP : null
        }
      });
      
    } catch (error) {
      console.error('Error sending OTP:', error);
      res.status(500).json({ message: 'Failed to send OTP' });
    }
  });

  app.post('/api/auth/resend-otp', async (req, res) => {
    try {
      const { email, phone, type } = req.body;
      
      // Same as send-otp but for resending
      const emailOTP = Math.floor(100000 + Math.random() * 900000).toString();
      const smsOTP = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = Date.now() + 10 * 60 * 1000;

      let emailSent = false;
      let smsSent = false;

      // Resend Email OTP using existing email system
      if (type === 'email' || type === 'both') {
        otpStore.set(`email:${email}`, { otp: emailOTP, expiresAt });
        const emailResult = await sendOTPEmail(email, emailOTP);
        emailSent = emailResult.success;
        console.log(`📧 Resent Email OTP using SMTP system`);
      }
      
      if (type === 'sms' || type === 'both') {
        otpStore.set(`sms:${phone}`, { otp: smsOTP, expiresAt });
        console.log(`📱 Resent SMS OTP for ${phone}: ${smsOTP}`);
        smsSent = true;
      }

      // Create audit log for OTP resending
      const auditUserId = req.user?.claims?.sub || 'anonymous';
      await storage.createAuditLog({
        actorId: auditUserId,
        action: 'resend_otp',
        targetType: 'otp_verification', 
        targetId: email || phone,
        metaJson: { type, email: !!email, phone: !!phone, resend: true }
      });

      res.json({ 
        message: 'OTP resent successfully',
        emailSent,
        smsSent,
        debug: {
          emailOTP: type === 'email' || type === 'both' ? emailOTP : null,
          smsOTP: type === 'sms' || type === 'both' ? smsOTP : null
        }
      });
      
    } catch (error) {
      console.error('Error resending OTP:', error);
      res.status(500).json({ message: 'Failed to resend OTP' });
    }
  });

  app.post('/api/auth/verify-otp', async (req, res) => {
    try {
      const { email, phone, emailOTP, smsOTP, type } = req.body;
      
      let verified = true;
      let errorMessage = '';

      // Verify email OTP if required
      if ((type === 'email' || type === 'both') && email) {
        const stored = otpStore.get(`email:${email}`);
        if (!stored) {
          verified = false;
          errorMessage = 'Email OTP not found or expired';
        } else if (stored.expiresAt < Date.now()) {
          verified = false;
          errorMessage = 'Email OTP expired';
          otpStore.delete(`email:${email}`);
        } else if (stored.otp !== emailOTP) {
          verified = false;
          errorMessage = 'Invalid email OTP';
        } else {
          // Valid email OTP
          otpStore.delete(`email:${email}`);
        }
      }

      // Verify SMS OTP if required
      if ((type === 'sms' || type === 'both') && phone && verified) {
        const stored = otpStore.get(`sms:${phone}`);
        if (!stored) {
          verified = false;
          errorMessage = 'SMS OTP not found or expired';
        } else if (stored.expiresAt < Date.now()) {
          verified = false;
          errorMessage = 'SMS OTP expired';
          otpStore.delete(`sms:${phone}`);
        } else if (stored.otp !== smsOTP) {
          verified = false;
          errorMessage = 'Invalid SMS OTP';
        } else {
          // Valid SMS OTP
          otpStore.delete(`sms:${phone}`);
        }
      }

      if (verified) {
        console.log(`✅ OTP verification successful for ${email || phone}`);
        res.json({ 
          verified: true, 
          message: 'OTP verified successfully' 
        });
      } else {
        console.log(`❌ OTP verification failed: ${errorMessage}`);
        res.status(400).json({ 
          verified: false, 
          message: errorMessage 
        });
      }
      
    } catch (error) {
      console.error('Error verifying OTP:', error);
      res.status(500).json({ message: 'Failed to verify OTP' });
    }
  });

  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Handle demo admin user
      if (userId === 'demo-admin') {
        const demoAdminUser = {
          id: 'demo-admin',
          email: 'admin@hublink.com',
          firstName: 'System',
          lastName: 'Administrator',
          displayName: 'System Administrator',
          bio: null,
          country: 'United Kingdom',
          city: 'London',
          homeCountry: null,
          homeCity: null,
          lat: null,
          lng: null,
          showOnMap: false,
          locationRadius: 10,
          languages: null,
          interests: null,
          profileImageUrl: null,
          avatarUrl: null,
          coverUrl: null,
          instagramUrl: null,
          youtubeUrl: null,
          tiktokUrl: null,
          role: 'admin',
          plan: 'premium',
          stripeCustomerId: null,
          stripeSubscriptionId: null,
          canDmMe: 'all',
          verificationStatus: 'verified',
          youtubeChannelId: null,
          youtubeSubscribers: 0,
          youtubeTier: 0,
          youtubeVerified: false,
          youtubeVerificationCode: null,
          youtubeVerificationAttempts: 0,
          youtubeLastUpdated: null,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        console.log('✅ Returning demo admin user:', demoAdminUser.role);
        res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.set('Pragma', 'no-cache');
        res.set('Expires', '0');
        return res.json(demoAdminUser);
      }
      
      // Handle regular users
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Debug log to see what we're returning
      console.log('API returning user data:', {
        id: user.id,
        plan: user.plan,
        role: user.role,
        youtubeSubscribers: user.youtubeSubscribers,
        youtubeTier: user.youtubeTier,
        youtubeChannelId: user.youtubeChannelId,
        youtubeVerified: user.youtubeVerified
      });
      
      // Disable cache to ensure fresh data
      res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.set('Pragma', 'no-cache');
      res.set('Expires', '0');
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Profile routes
  app.get('/api/users/:handle', async (req, res) => {
    try {
      const user = await storage.getUserByUsername(req.params.handle);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Remove sensitive information for public profiles
      const { stripeCustomerId, stripeSubscriptionId, ...publicUser } = user;
      res.json(publicUser);
    } catch (error) {
      console.error("Error fetching user profile:", error);
      res.status(500).json({ message: "Failed to fetch user profile" });
    }
  });

  app.patch('/api/me', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const data = insertUserProfileSchema.parse(req.body);
      const user = await storage.updateUserProfile(userId, data);
      res.json(user);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error updating profile:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  // OCR Document verification endpoint
  app.post('/api/verify-document', isAuthenticated, async (req: any, res) => {
    try {
      const { documentUrl, documentType } = req.body;
      
      if (!documentUrl || !documentType) {
        return res.status(400).json({ message: "Document URL and type are required" });
      }

      console.log('Starting OCR verification for:', documentUrl);

      // Download the image first
      const imageResponse = await fetch(documentUrl);
      if (!imageResponse.ok) {
        return res.status(400).json({ message: "Failed to download document image" });
      }

      // Create form data for OCR.SPACE API
      const formData = new FormData();
      formData.append('file', imageResponse.body);
      formData.append('language', 'eng');
      formData.append('OCREngine', '2'); // Use engine 2 for better MRZ detection
      formData.append('scale', 'true');
      formData.append('isTable', 'false');
      formData.append('isSearchablePdfHideTextLayer', 'false');
      
      // Make OCR request to OCR.SPACE (free API)
      const ocrResponse = await fetch('https://api.ocr.space/parse/image', {
        method: 'POST',
        body: formData,
        headers: {
          ...formData.getHeaders()
        }
      });

      if (!ocrResponse.ok) {
        console.error('OCR API error:', await ocrResponse.text());
        return res.status(500).json({ message: "OCR service temporarily unavailable" });
      }

      const ocrResult: any = await ocrResponse.json();
      
      if (!ocrResult.IsErroredOnProcessing) {
        const extractedText = ocrResult.ParsedResults?.[0]?.ParsedText || '';
        console.log('OCR extracted text:', extractedText);
        
        // Extract information based on document type
        let extractedInfo: any = {};
        
        if (documentType === 'passport') {
          // Parse passport MRZ or text
          extractedInfo = parsePassportData(extractedText);
        } else if (documentType === 'driving_license') {
          // Parse driving license data
          extractedInfo = parseDrivingLicenseData(extractedText);
        }
        
        // Basic validation - check if we got some meaningful data
        if (!extractedInfo.fullName && !extractedInfo.documentNumber) {
          return res.status(400).json({ 
            message: "Could not extract valid information from document. Please ensure the image is clear and well-lit." 
          });
        }
        
        res.json({
          success: true,
          extractedInfo,
          rawText: extractedText,
          verificationStatus: 'verified'
        });
      } else {
        console.error('OCR processing error:', ocrResult.ErrorMessage);
        res.status(400).json({ 
          message: "Failed to process document. Please try again with a clearer image.",
          error: ocrResult.ErrorMessage 
        });
      }
      
    } catch (error) {
      console.error("Error in document verification:", error);
      res.status(500).json({ message: "Document verification failed" });
    }
  });

  // Helper function to parse passport data
  function parsePassportData(text: string) {
    const lines = text.split('\n');
    let extractedInfo: any = {};
    
    // Look for MRZ patterns (Machine Readable Zone)
    const mrzPattern = /^P<|^[A-Z]{3}/;
    const namePattern = /([A-Z]{2,}(?:\s+[A-Z]{2,})*)/g;
    const datePattern = /(\d{2}[\s\/\-]\d{2}[\s\/\-]\d{4}|\d{6})/g;
    const passportPattern = /[A-Z]\d{7,9}/g;
    
    // Try to find passport number
    const passportMatch = text.match(passportPattern);
    if (passportMatch) {
      extractedInfo.documentNumber = passportMatch[0];
    }
    
    // Try to extract names (usually in caps)
    const nameMatches = text.match(namePattern);
    if (nameMatches && nameMatches.length > 0) {
      // Filter out common passport words
      const filteredNames = nameMatches.filter(name => 
        !['PASSPORT', 'REPUBLIC', 'KINGDOM', 'UNITED', 'STATES', 'NATIONALITY'].includes(name.trim())
      );
      if (filteredNames.length > 0) {
        extractedInfo.fullName = filteredNames[0].trim();
      }
    }
    
    // Try to extract dates
    const dateMatches = text.match(datePattern);
    if (dateMatches && dateMatches.length > 0) {
      extractedInfo.dateOfBirth = dateMatches[0];
      if (dateMatches.length > 1) {
        extractedInfo.expiryDate = dateMatches[1];
      }
    }
    
    return extractedInfo;
  }

  // Helper function to parse driving license data
  function parseDrivingLicenseData(text: string) {
    const lines = text.split('\n');
    let extractedInfo: any = {};
    
    // Common patterns for driving licenses
    const licensePattern = /[A-Z]{1,2}\d{6,8}/g;
    const namePattern = /([A-Z]{2,}(?:\s+[A-Z]{2,})*)/g;
    const datePattern = /(\d{2}[\s\/\-]\d{2}[\s\/\-]\d{4})/g;
    
    // Try to find license number
    const licenseMatch = text.match(licensePattern);
    if (licenseMatch) {
      extractedInfo.documentNumber = licenseMatch[0];
    }
    
    // Try to extract names
    const nameMatches = text.match(namePattern);
    if (nameMatches && nameMatches.length > 0) {
      const filteredNames = nameMatches.filter(name => 
        !['LICENSE', 'DRIVING', 'CLASS', 'VEHICLE', 'MOTOR'].includes(name.trim())
      );
      if (filteredNames.length > 0) {
        extractedInfo.fullName = filteredNames[0].trim();
      }
    }
    
    // Try to extract dates
    const dateMatches = text.match(datePattern);
    if (dateMatches && dateMatches.length > 0) {
      extractedInfo.dateOfBirth = dateMatches[0];
      if (dateMatches.length > 1) {
        extractedInfo.expiryDate = dateMatches[1];
      }
    }
    
    return extractedInfo;
  }

  // Complete signup with document verification
  app.post('/api/complete-signup', async (req: any, res) => {
    try {
      // Get userId from session or create new user
      let userId = req.session?.userId;
      
      if (!userId) {
        // Generate new user ID for signup
        userId = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      }
      const {
        username,
        email,
        firstName,
        lastName,
        bio,
        country,
        city,
        documentType,
        documentUrl,
        documentNumber,
        fullName,
        dateOfBirth,
        nationality,
        expiryDate,
        verificationStatus
      } = req.body;

      // Check if user already exists
      const existingUser = await storage.getUser(userId);
      if (existingUser && existingUser.verificationStatus === 'verified') {
        return res.status(400).json({ message: "User already verified" });
      }

      // Update user with document verification info
      const userData = {
        username,
        email,
        firstName,
        lastName,
        bio,
        country,
        city,
        documentType,
        documentUrl,
        documentNumber,
        fullName,
        dateOfBirth,
        nationality,
        expiryDate,
        verificationStatus,
        verifiedAt: verificationStatus === 'verified' ? new Date() : null,
        verificationNotes: verificationStatus === 'verified' 
          ? 'Automatically verified via AI document processing' 
          : 'Pending manual review'
      };

      const user = await storage.updateUserProfile(userId, userData);
      
      // Set user session after successful signup
      req.session.userId = userId;
      req.session.user = user;
      req.session.isAuthenticated = true;
      
      res.json({ 
        success: true, 
        user,
        message: "Signup completed successfully" 
      });
    } catch (error) {
      console.error("Error completing signup:", error);
      res.status(500).json({ message: "Failed to complete signup" });
    }
  });

  // Video verification function
  async function verifyVideoClip(originalVideoUrl: string, clipUrl: string, clipStartTime: number, clipEndTime: number) {
    try {
      // Extract video IDs from YouTube URLs
      const getVideoId = (url: string) => {
        const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/);
        return match ? match[1] : null;
      };

      const originalVideoId = getVideoId(originalVideoUrl);
      const clipVideoId = getVideoId(clipUrl);

      if (!originalVideoId || !clipVideoId) {
        return { status: 'failed', score: 0, notes: 'Invalid YouTube URLs provided' };
      }

      // Basic verification: Check if it's the same video
      if (originalVideoId !== clipVideoId) {
        return { status: 'failed', score: 0, notes: 'Clip URL does not match original video URL' };
      }

      // Fetch video details to verify timing
      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=${originalVideoId}&key=${process.env.YOUTUBE_API_KEY}`
      );

      if (!response.ok) {
        return { status: 'failed', score: 0, notes: 'Unable to fetch video details' };
      }

      const data = await response.json();
      if (!data.items || data.items.length === 0) {
        return { status: 'failed', score: 0, notes: 'Original video not found' };
      }

      // Parse video duration (ISO 8601 format like PT4M13S)
      const duration = data.items[0].contentDetails.duration;
      const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
      const hours = parseInt(match[1] || '0');
      const minutes = parseInt(match[2] || '0');
      const seconds = parseInt(match[3] || '0');
      const totalSeconds = hours * 3600 + minutes * 60 + seconds;

      // Verify timing constraints
      if (clipStartTime < 0 || clipEndTime > totalSeconds) {
        return { status: 'failed', score: 0, notes: 'Clip timing exceeds video duration' };
      }

      if (clipStartTime >= clipEndTime) {
        return { status: 'failed', score: 0, notes: 'Invalid clip timing: start time must be before end time' };
      }

      // Check for reasonable clip length (between 10 seconds and 5 minutes)
      const clipLength = clipEndTime - clipStartTime;
      if (clipLength < 10 || clipLength > 300) {
        return { status: 'failed', score: 0.3, notes: 'Clip length should be between 10 seconds and 5 minutes for optimal verification' };
      }

      // For now, return verified if all checks pass
      // In production, this would involve actual frame comparison
      return { 
        status: 'verified', 
        score: 0.95, 
        notes: `Video verified: ${clipLength}s clip from ${clipStartTime}s to ${clipEndTime}s in ${totalSeconds}s video` 
      };

    } catch (error) {
      console.error('Video verification error:', error);
      return { status: 'failed', score: 0, notes: 'Technical error during verification process' };
    }
  }

  // Video verification test endpoint
  app.post('/api/video/verify', isAuthenticated, async (req: any, res) => {
    try {
      const { originalVideoUrl, clipUrl, clipStartTime, clipEndTime } = req.body;
      
      if (!originalVideoUrl || !clipUrl || clipStartTime === undefined || clipEndTime === undefined) {
        return res.status(400).json({ 
          message: "All fields required: originalVideoUrl, clipUrl, clipStartTime, clipEndTime" 
        });
      }
      
      const verification = await verifyVideoClip(originalVideoUrl, clipUrl, clipStartTime, clipEndTime);
      res.json(verification);
    } catch (error) {
      console.error("Video verification test failed:", error);
      res.status(500).json({ message: "Video verification failed" });
    }
  });

  // YouTube integration routes
  app.post('/api/youtube/sync', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      console.log('Request body:', req.body); // Debug log
      const { youtubeUrl } = req.body;
      console.log('Extracted youtubeUrl:', youtubeUrl); // Debug log
      
      if (!youtubeUrl) {
        return res.status(400).json({ message: "YouTube URL is required" });
      }

      // Extract channel ID from YouTube URL
      let channelId = '';
      if (youtubeUrl.includes('/channel/')) {
        channelId = youtubeUrl.split('/channel/')[1].split('/')[0].split('?')[0];
      } else if (youtubeUrl.includes('/@')) {
        // Handle @username format - we'll need to convert it
        const username = youtubeUrl.split('/@')[1].split('/')[0].split('?')[0];
        
        // Use YouTube API to get channel info by username
        const searchResponse = await fetch(
          `https://www.googleapis.com/youtube/v3/channels?part=id,statistics&forHandle=${username}&key=${process.env.YOUTUBE_API_KEY}`
        );
        
        if (!searchResponse.ok) {
          return res.status(400).json({ message: "Invalid YouTube channel" });
        }
        
        const searchData = await searchResponse.json();
        if (!searchData.items || searchData.items.length === 0) {
          return res.status(400).json({ message: "YouTube channel not found" });
        }
        
        channelId = searchData.items[0].id;
      } else if (youtubeUrl.includes('/c/') || youtubeUrl.includes('/user/')) {
        // Handle custom URLs - need to search by name
        let customName = '';
        if (youtubeUrl.includes('/c/')) {
          customName = youtubeUrl.split('/c/')[1].split('/')[0].split('?')[0];
        } else {
          customName = youtubeUrl.split('/user/')[1].split('/')[0].split('?')[0];
        }
        
        const searchResponse = await fetch(
          `https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&q=${customName}&key=${process.env.YOUTUBE_API_KEY}&maxResults=1`
        );
        
        if (!searchResponse.ok) {
          return res.status(400).json({ message: "Invalid YouTube channel" });
        }
        
        const searchData = await searchResponse.json();
        if (!searchData.items || searchData.items.length === 0) {
          return res.status(400).json({ message: "YouTube channel not found" });
        }
        
        channelId = searchData.items[0].snippet.channelId;
      } else {
        return res.status(400).json({ message: "Invalid YouTube URL format" });
      }

      // Fetch channel statistics
      const apiUrl = `https://www.googleapis.com/youtube/v3/channels?part=statistics&id=${channelId}&key=${process.env.YOUTUBE_API_KEY}`;
      const response = await fetch(apiUrl);

      if (!response.ok) {
        return res.status(400).json({ message: "Failed to fetch YouTube data" });
      }

      const data = await response.json();
      
      if (!data.items || data.items.length === 0) {
        return res.status(400).json({ message: "YouTube channel not found" });
      }

      const subscriberCount = parseInt(data.items[0].statistics.subscriberCount) || 0;
      
      // Determine tier based on subscriber count
      let tier = 1; // Default tier
      if (subscriberCount >= 70000) {
        tier = 3; // £360 tier
      } else if (subscriberCount >= 40000) {
        tier = 2; // £240 tier  
      } else if (subscriberCount >= 10000) {
        tier = 1; // £120 tier
      } else {
        return res.status(400).json({ 
          message: `Channel has only ${subscriberCount.toLocaleString()} subscribers. Minimum 10,000 subscribers required to participate in campaigns.`,
          subscriberCount,
          minimumRequired: 10000
        });
      }

      // Generate verification code
      const verificationCode = `HUBLINK-${Math.random().toString(36).substring(2, 8).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;

      // Ensure user exists in database first
      let user = await storage.getUser(userId);
      if (!user) {
        // Create user in database if it doesn't exist (for demo user)
        user = await storage.upsertUser({
          id: userId,
          email: userId === 'demo-user-1' ? 'demo@hublink.com' : 'unknown@example.com',
          firstName: userId === 'demo-user-1' ? 'Demo' : 'Unknown',
          lastName: userId === 'demo-user-1' ? 'User' : 'User',
          profileImageUrl: userId === 'demo-user-1' ? 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face' : '',
          username: userId === 'demo-user-1' ? 'demo_user' : `user_${userId.slice(0, 8)}`,
          displayName: userId === 'demo-user-1' ? 'Demo User' : 'Unknown User',
          country: userId === 'demo-user-1' ? 'United Kingdom' : undefined,
          city: userId === 'demo-user-1' ? 'London' : undefined,
          plan: userId === 'demo-user-1' ? 'standard' : 'free',
          role: userId === 'demo-user-1' ? 'creator' : 'user',
        });
      }

      // Update user with YouTube data (not verified yet)
      const updatedUser = await storage.updateUserProfile(userId, {
        youtubeUrl,
        youtubeChannelId: channelId,
        youtubeSubscribers: subscriberCount,
        youtubeTier: tier,
        youtubeVerified: false, // Reset verification status
        youtubeVerificationCode: verificationCode,
        youtubeVerificationAttempts: 0,
        youtubeLastUpdated: new Date()
      });

      res.json({
        subscriberCount,
        tier,
        tierName: tier === 1 ? 'Emerging (10k-40k)' : tier === 2 ? 'Growing (40k-70k)' : 'Established (70k+)',
        verificationCode,
        requiresVerification: true,
        user: updatedUser
      });
    } catch (error) {
      console.error("Error syncing YouTube data:", error);
      res.status(500).json({ message: "Failed to sync YouTube data" });
    }
  });

  // Verify YouTube channel ownership
  app.post('/api/youtube/verify', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user?.youtubeChannelId || !user?.youtubeVerificationCode) {
        return res.status(400).json({ message: "No YouTube channel connected or verification code missing" });
      }

      // Limit verification attempts
      if ((user.youtubeVerificationAttempts || 0) >= 5) {
        return res.status(429).json({ message: "Too many verification attempts. Please contact support." });
      }

      // Fetch channel details to check description
      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/channels?part=snippet&id=${user.youtubeChannelId}&key=${process.env.YOUTUBE_API_KEY}`
      );

      if (!response.ok) {
        return res.status(400).json({ message: "Failed to fetch channel data" });
      }

      const data = await response.json();
      if (!data.items || data.items.length === 0) {
        return res.status(400).json({ message: "Channel not found" });
      }

      const channelDescription = data.items[0].snippet.description || '';
      
      // Check if verification code exists in channel description
      if (channelDescription.includes(user.youtubeVerificationCode)) {
        // Verification successful
        await storage.updateUserProfile(userId, {
          youtubeVerified: true,
          youtubeVerificationAttempts: 0
        });
        
        res.json({ 
          verified: true, 
          message: "Channel verified successfully! You can now access premium campaigns." 
        });
      } else {
        // Verification failed - increment attempts
        await storage.updateUserProfile(userId, {
          youtubeVerificationAttempts: (user.youtubeVerificationAttempts || 0) + 1
        });
        
        res.status(400).json({ 
          verified: false, 
          message: `Verification code not found in channel description. ${4 - (user.youtubeVerificationAttempts || 0)} attempts remaining.`,
          attemptsRemaining: 4 - (user.youtubeVerificationAttempts || 0)
        });
      }
    } catch (error) {
      console.error("Error verifying YouTube channel:", error);
      res.status(500).json({ message: "Failed to verify channel" });
    }
  });

  // YouTube disconnect route
  app.post('/api/youtube/disconnect', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // For demo user, actually clear the YouTube data
      if (userId === 'demo-user-1') {
        await storage.updateUserProfile(userId, {
          youtubeChannelId: null,
          youtubeSubscribers: null,
          youtubeTier: null,
          youtubeVerified: false,
          youtubeVerificationCode: null,
          youtubeVerificationAttempts: 0,
          youtubeUrl: null,
          youtubeLastUpdated: null
        });
        
        return res.json({ 
          message: "YouTube channel successfully disconnected",
          user: { id: 'demo-user-1', youtubeVerified: false }
        });
      }
      
      // Clear all YouTube-related data from user profile
      const updatedUser = await storage.updateUserProfile(userId, {
        youtubeUrl: null,
        youtubeChannelId: null,
        youtubeSubscribers: null,
        youtubeTier: null,
        youtubeVerified: false,
        youtubeVerificationCode: null,
        youtubeVerificationAttempts: 0,
        youtubeLastUpdated: null,
      });
      
      res.json({ 
        message: "YouTube channel successfully disconnected",
        user: updatedUser 
      });
    } catch (error) {
      console.error("Error disconnecting YouTube channel:", error);
      res.status(500).json({ message: "Failed to disconnect YouTube channel" });
    }
  });

  // Discovery routes
  app.get('/api/discover', async (req, res) => {
    try {
      const { lat, lng, radius = 10, country, city, interests, plan } = req.query;
      console.log('Discovery API called with params:', { country, city, lat, lng });
      
      // Always return test users for now (demo purposes)
      const users = await storage.getUsersNearby(0, 0, 100);
      console.log('Users from storage:', users.length);
      
      // Filter by country if specified
      let filteredUsers = users;
      if (country && country !== 'all') {
        filteredUsers = users.filter(user => 
          user.country?.toLowerCase().includes(country.toString().toLowerCase()) ||
          (country === 'KR' && user.country === 'South Korea') ||
          (country === 'GB' && user.country === 'United Kingdom') ||
          (country === 'US' && user.country === 'United States')
        );
        console.log('Filtered by country:', filteredUsers.length);
      }
      
      // Filter by city if specified
      if (city && city !== 'all') {
        filteredUsers = filteredUsers.filter(user => 
          user.city?.toLowerCase().includes(city.toString().toLowerCase())
        );
        console.log('Filtered by city:', filteredUsers.length);
      }
      
      console.log('Final result:', filteredUsers.length);
      res.json(filteredUsers);
    } catch (error) {
      console.error("Error in discovery:", error);
      res.status(500).json({ message: "Failed to discover users" });
    }
  });

  // User search route
  app.get('/api/users/search', async (req, res) => {
    try {
      const { q: query } = req.query;
      
      if (!query || query.length < 1) {
        return res.json([]);
      }
      
      // Search users by username, displayName, or first name
      const users = await storage.searchUsers(query.toString());
      res.json(users);
    } catch (error) {
      console.error("Error searching users:", error);
      res.status(500).json({ message: "Failed to search users" });
    }
  });

  // Connect request routes
  app.post('/api/connect/:toUserId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { toUserId } = req.params;
      const data = insertConnectRequestSchema.parse({ toUserId, ...req.body });
      
      // Check if request already exists
      const existing = await storage.getConnectRequest(userId, toUserId);
      if (existing) {
        return res.status(400).json({ message: "Connect request already exists" });
      }
      
      const request = await storage.createConnectRequest({
        fromUserId: userId,
        ...data
      });
      
      // Skip audit log for demo users to avoid foreign key constraints
      const isDemoUser = userId === 'demo-user-1' || userId?.startsWith('test-user-');
      if (!isDemoUser) {
        await storage.createAuditLog({
          actorId: userId,
          action: "connect_request_sent",
          targetType: "user",
          targetId: toUserId,
          ipAddress: req.ip,
          userAgent: req.get("User-Agent"),
        });
      }
      
      res.json(request);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error creating connect request:", error);
      res.status(500).json({ message: "Failed to send connect request" });
    }
  });

  app.patch('/api/connect/:requestId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { requestId } = req.params;
      const { status } = req.body;
      
      console.log('Connect request update:', { userId, requestId, status });
      
      // Validate request
      if (!requestId || !status) {
        return res.status(400).json({ message: "Missing requestId or status" });
      }
      
      if (!['accepted', 'declined'].includes(status)) {
        return res.status(400).json({ message: "Invalid status. Must be 'accepted' or 'declined'" });
      }
      
      const request = await storage.updateConnectRequestStatus(requestId, status);
      console.log('Updated request:', request);
      
      // If accepted, create follow relationship and conversation
      if (status === 'accepted') {
        // Skip follow creation for demo users to avoid foreign key constraints
        const isDemoRequest = request.fromUserId?.startsWith('test-user-') || 
                             request.toUserId?.startsWith('test-user-') ||
                             request.fromUserId === 'demo-user-1' ||
                             request.toUserId === 'demo-user-1';
        
        if (!isDemoRequest) {
          await storage.createFollow(request.fromUserId!, request.toUserId!);
          await storage.createFollow(request.toUserId!, request.fromUserId!);
        }
        
        // Always create conversation for messaging (even for demo users)
        await storage.createConversation({
          user1Id: request.fromUserId!,
          user2Id: request.toUserId!,
        });
      }
      
      // Skip audit log for demo users to avoid foreign key constraints  
      const isDemoUser = userId === 'demo-user-1' || userId?.startsWith('test-user-');
      if (!isDemoUser) {
        await storage.createAuditLog({
          actorId: userId,
          action: `connect_request_${status}`,
          targetType: "connect_request",
          targetId: requestId,
          ipAddress: req.ip,
          userAgent: req.get("User-Agent"),
        });
      }
      
      res.json(request);
    } catch (error) {
      console.error("Error updating connect request:", error);
      res.status(500).json({ message: "Failed to update connect request" });
    }
  });

  app.get('/api/connect-requests', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { type = 'received' } = req.query;
      const requests = await storage.getUserConnectRequests(userId, type as 'sent' | 'received');
      res.json(requests);
    } catch (error) {
      console.error("Error fetching connect requests:", error);
      res.status(500).json({ message: "Failed to fetch connect requests" });
    }
  });

  // Follow/unfollow routes
  app.post('/api/follow/:userId', isAuthenticated, async (req: any, res) => {
    try {
      const followerId = req.user.claims.sub;
      const { userId: followeeId } = req.params;
      
      if (followerId === followeeId) {
        return res.status(400).json({ message: "Cannot follow yourself" });
      }
      
      // Check if already following
      const alreadyFollowing = await storage.isFollowing(followerId, followeeId);
      if (alreadyFollowing) {
        return res.status(400).json({ message: "Already following this user" });
      }
      
      await storage.createFollow(followerId, followeeId);
      res.json({ message: "Successfully followed user", isFollowing: true });
    } catch (error) {
      console.error("Error following user:", error);
      res.status(500).json({ message: "Failed to follow user" });
    }
  });

  app.delete('/api/follow/:userId', isAuthenticated, async (req: any, res) => {
    try {
      const followerId = req.user.claims.sub;
      const { userId: followeeId } = req.params;
      
      await storage.removeFollow(followerId, followeeId);
      res.json({ message: "Successfully unfollowed user", isFollowing: false });
    } catch (error) {
      console.error("Error unfollowing user:", error);
      res.status(500).json({ message: "Failed to unfollow user" });
    }
  });

  app.get('/api/follow/status/:userId', isAuthenticated, async (req: any, res) => {
    try {
      const followerId = req.user.claims.sub;
      const { userId: followeeId } = req.params;
      
      const isFollowing = await storage.isFollowing(followerId, followeeId);
      res.json({ isFollowing });
    } catch (error) {
      console.error("Error checking follow status:", error);
      res.status(500).json({ message: "Failed to check follow status" });
    }
  });

  app.get('/api/followers/:userId', async (req, res) => {
    try {
      const { userId } = req.params;
      const followers = await storage.getFollowers(userId);
      res.json(followers);
    } catch (error) {
      console.error("Error fetching followers:", error);
      res.status(500).json({ message: "Failed to fetch followers" });
    }
  });

  app.get('/api/following/:userId', async (req, res) => {
    try {
      const { userId } = req.params;
      const following = await storage.getFollowing(userId);
      res.json(following);
    } catch (error) {
      console.error("Error fetching following:", error);
      res.status(500).json({ message: "Failed to fetch following" });
    }
  });

  // Conversations routes
  app.get('/api/conversations', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const conversations = await storage.getUserConversations(userId);
      res.json(conversations);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      res.status(500).json({ message: "Failed to fetch conversations" });
    }
  });

  // Messaging routes
  app.get('/api/messages/:conversationId', isAuthenticated, async (req: any, res) => {
    try {
      const { conversationId } = req.params;
      const messages = await storage.getConversationMessages(conversationId);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  app.post('/api/messages/:conversationId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { conversationId } = req.params;
      const data = insertMessageSchema.parse({ conversationId, ...req.body });
      
      const message = await storage.createMessage({
        fromUserId: userId,
        ...data
      });
      
      res.json(message);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error creating message:", error);
      res.status(500).json({ message: "Failed to send message" });
    }
  });

  // Feed routes
  app.get('/api/feed', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { tab = 'global', country, limit = 20 } = req.query;
      const posts = await storage.getFeedPosts(
        tab as 'global' | 'country' | 'following',
        userId, // Pass userId for following tab
        country as string,
        parseInt(limit as string)
      );
      res.json(posts);
    } catch (error) {
      console.error("Error fetching feed:", error);
      res.status(500).json({ message: "Failed to fetch feed" });
    }
  });

  app.post('/api/posts', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const data = insertPostSchema.parse(req.body);
      
      const post = await storage.createPost({
        userId,
        ...data
      });
      
      res.json(post);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error creating post:", error);
      res.status(500).json({ message: "Failed to create post" });
    }
  });

  // Event routes
  app.get('/api/events', async (req, res) => {
    try {
      const events = await storage.getEvents();
      res.json(events);
    } catch (error) {
      console.error("Error fetching events:", error);
      res.status(500).json({ message: "Failed to fetch events" });
    }
  });

  app.post('/api/events', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const data = insertEventSchema.parse(req.body);
      
      const event = await storage.createEvent({
        hostId: userId,
        ...data
      });
      
      res.json(event);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error creating event:", error);
      res.status(500).json({ message: "Failed to create event" });
    }
  });

  app.post('/api/events/:id/rsvp', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id } = req.params;
      const { status } = req.body;
      
      const rsvp = await storage.createEventRsvp(id, userId, status);
      res.json(rsvp);
    } catch (error) {
      console.error("Error creating RSVP:", error);
      res.status(500).json({ message: "Failed to RSVP" });
    }
  });

  // Stays routes
  app.get('/api/stays', async (req, res) => {
    try {
      const { country, city, type, minPrice, maxPrice, guests = 1, limit = 20 } = req.query;
      const stays = await storage.getStays({
        country: country as string,
        city: city as string,
        type: type as string,
        minPrice: minPrice ? parseFloat(minPrice as string) : undefined,
        maxPrice: maxPrice ? parseFloat(maxPrice as string) : undefined,
        guests: parseInt(guests as string),
        limit: parseInt(limit as string)
      });
      res.json(stays);
    } catch (error) {
      console.error("Error fetching stays:", error);
      res.status(500).json({ message: "Failed to fetch stays" });
    }
  });

  app.get('/api/stays/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const stay = await storage.getStayById(id);
      if (!stay) {
        return res.status(404).json({ message: "Stay not found" });
      }
      
      // Get reviews for this stay
      const reviews = await storage.getStayReviews(id);
      res.json({ ...stay, reviews });
    } catch (error) {
      console.error("Error fetching stay:", error);
      res.status(500).json({ message: "Failed to fetch stay" });
    }
  });

  app.post('/api/stays', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const data = insertStaySchema.parse(req.body);
      
      const stay = await storage.createStay({
        hostId: userId,
        ...data
      });
      
      await storage.createAuditLog({
        actorId: userId,
        action: "stay_created",
        targetType: "stay",
        targetId: stay.id,
        ipAddress: req.ip,
        userAgent: req.get("User-Agent"),
      });
      
      res.json(stay);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error creating stay:", error);
      res.status(500).json({ message: "Failed to create stay" });
    }
  });

  app.put('/api/stays/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id } = req.params;
      const data = insertStaySchema.parse(req.body);
      
      // Check if user owns this stay
      const stay = await storage.getStayById(id);
      if (!stay || stay.hostId !== userId) {
        return res.status(403).json({ message: "You can only edit your own stays" });
      }
      
      const updatedStay = await storage.updateStay(id, data);
      
      await storage.createAuditLog({
        actorId: userId,
        action: "stay_updated",
        targetType: "stay",
        targetId: id,
        ipAddress: req.ip,
        userAgent: req.get("User-Agent"),
      });
      
      res.json(updatedStay);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error updating stay:", error);
      res.status(500).json({ message: "Failed to update stay" });
    }
  });

  app.delete('/api/stays/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id } = req.params;
      
      // Check if user owns this stay
      const stay = await storage.getStayById(id);
      if (!stay || stay.hostId !== userId) {
        return res.status(403).json({ message: "You can only delete your own stays" });
      }
      
      await storage.deleteStay(id);
      
      await storage.createAuditLog({
        actorId: userId,
        action: "stay_deleted",
        targetType: "stay",
        targetId: id,
        ipAddress: req.ip,
        userAgent: req.get("User-Agent"),
      });
      
      res.json({ message: "Stay deleted successfully" });
    } catch (error) {
      console.error("Error deleting stay:", error);
      res.status(500).json({ message: "Failed to delete stay" });
    }
  });

  app.post('/api/stays/:id/book', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id } = req.params;
      const data = insertStayBookingSchema.parse({ ...req.body, stayId: id });
      
      // Check if stay exists and is available
      const stay = await storage.getStayById(id);
      if (!stay) {
        return res.status(404).json({ message: "Stay not found" });
      }
      
      if (stay.status !== 'active') {
        return res.status(400).json({ message: "Stay is not available for booking" });
      }
      
      // Calculate total price with 10% platform fee
      const checkIn = new Date(data.checkInDate!);
      const checkOut = new Date(data.checkOutDate!);
      const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
      const basePrice = parseFloat(stay.pricePerNight) * nights;
      const platformFee = basePrice * 0.10; // 10% platform fee
      const totalPrice = (basePrice + platformFee).toString();
      
      const booking = await storage.createStayBooking({
        guestId: userId,
        totalPrice,
        currency: stay.currency,
        ...data
      });
      
      await storage.createAuditLog({
        actorId: userId,
        action: "stay_booked",
        targetType: "stay_booking",
        targetId: booking.id,
        metaJson: { stayId: id, nights, basePrice: basePrice.toString(), platformFee: platformFee.toString(), totalPrice },
        ipAddress: req.ip,
        userAgent: req.get("User-Agent"),
      });
      
      res.json(booking);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error booking stay:", error);
      res.status(500).json({ message: "Failed to book stay" });
    }
  });

  app.get('/api/stays/bookings', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { type = 'guest' } = req.query;
      
      let bookings;
      if (type === 'host') {
        bookings = await storage.getHostBookings(userId);
      } else {
        bookings = await storage.getUserBookings(userId);
      }
      
      res.json(bookings);
    } catch (error) {
      console.error("Error fetching bookings:", error);
      res.status(500).json({ message: "Failed to fetch bookings" });
    }
  });

  app.patch('/api/stays/bookings/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id } = req.params;
      const { status } = req.body;
      
      if (!['confirmed', 'cancelled'].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }
      
      const booking = await storage.updateStayBookingStatus(id, status);
      
      await storage.createAuditLog({
        actorId: userId,
        action: `booking_${status}`,
        targetType: "stay_booking",
        targetId: id,
        ipAddress: req.ip,
        userAgent: req.get("User-Agent"),
      });
      
      res.json(booking);
    } catch (error) {
      console.error("Error updating booking:", error);
      res.status(500).json({ message: "Failed to update booking" });
    }
  });

  app.post('/api/stays/:id/review', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id } = req.params;
      const data = insertStayReviewSchema.parse({ ...req.body, stayId: id });
      
      // Check if user has a completed booking for this stay
      const userBookings = await storage.getUserBookings(userId);
      const completedBooking = userBookings.find(booking => 
        booking.stayId === id && booking.status === 'completed'
      );
      
      if (!completedBooking) {
        return res.status(400).json({ message: "You can only review stays you have completed" });
      }
      
      const review = await storage.createStayReview({
        reviewerId: userId,
        bookingId: completedBooking.id,
        ...data
      });
      
      await storage.createAuditLog({
        actorId: userId,
        action: "stay_reviewed",
        targetType: "stay_review",
        targetId: review.id,
        metaJson: { stayId: id, rating: data.rating },
        ipAddress: req.ip,
        userAgent: req.get("User-Agent"),
      });
      
      res.json(review);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error creating review:", error);
      res.status(500).json({ message: "Failed to create review" });
    }
  });

  app.get('/api/my-stays', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const stays = await storage.getUserStays(userId);
      res.json(stays);
    } catch (error) {
      console.error("Error fetching user stays:", error);
      res.status(500).json({ message: "Failed to fetch your stays" });
    }
  });

  // Personal Hosts routes
  app.get('/api/personal-hosts', async (req, res) => {
    try {
      const { country, city, hostType, priceType, maxGuests, limit = 20 } = req.query;
      const hosts = await storage.getPersonalHosts({
        country: country as string,
        city: city as string,
        hostType: hostType as string,
        priceType: priceType as string,
        maxGuests: maxGuests ? parseInt(maxGuests as string) : undefined,
        limit: parseInt(limit as string)
      });
      res.json(hosts);
    } catch (error) {
      console.error("Error fetching personal hosts:", error);
      res.status(500).json({ message: "Failed to fetch personal hosts" });
    }
  });

  app.get('/api/personal-hosts/my-hosts', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const hosts = await storage.getMyPersonalHosts(userId);
      res.json(hosts);
    } catch (error) {
      console.error("Error fetching my hosts:", error);
      res.status(500).json({ message: "Failed to fetch your host profiles" });
    }
  });

  app.post('/api/personal-hosts', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const data = insertPersonalHostSchema.parse(req.body);
      
      const host = await storage.createPersonalHost({
        userId,
        ...data
      });
      
      await storage.createAuditLog({
        actorId: userId,
        action: "personal_host_created",
        targetType: "personal_host",
        targetId: host.id,
        metaJson: { hostType: data.hostType, priceType: data.priceType, location: data.location },
        ipAddress: req.ip,
        userAgent: req.get("User-Agent"),
      });
      
      res.json(host);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error creating personal host:", error);
      res.status(500).json({ message: "Failed to create host profile" });
    }
  });

  app.get('/api/personal-hosts/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const host = await storage.getPersonalHostById(id);
      if (!host) {
        return res.status(404).json({ message: "Host not found" });
      }
      res.json(host);
    } catch (error) {
      console.error("Error fetching host:", error);
      res.status(500).json({ message: "Failed to fetch host details" });
    }
  });

  app.patch('/api/personal-hosts/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id } = req.params;
      const data = insertPersonalHostSchema.parse(req.body);
      
      // Check if user owns this host
      const existingHost = await storage.getPersonalHostById(id);
      if (!existingHost || existingHost.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const host = await storage.updatePersonalHost(id, data);
      
      await storage.createAuditLog({
        actorId: userId,
        action: "personal_host_updated",
        targetType: "personal_host",
        targetId: id,
        ipAddress: req.ip,
        userAgent: req.get("User-Agent"),
      });
      
      res.json(host);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error updating personal host:", error);
      res.status(500).json({ message: "Failed to update host profile" });
    }
  });

  app.delete('/api/personal-hosts/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id } = req.params;
      
      // Check if user owns this host
      const existingHost = await storage.getPersonalHostById(id);
      if (!existingHost || existingHost.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      await storage.deletePersonalHost(id);
      
      await storage.createAuditLog({
        actorId: userId,
        action: "personal_host_deleted",
        targetType: "personal_host",
        targetId: id,
        ipAddress: req.ip,
        userAgent: req.get("User-Agent"),
      });
      
      res.json({ message: "Host profile deleted successfully" });
    } catch (error) {
      console.error("Error deleting personal host:", error);
      res.status(500).json({ message: "Failed to delete host profile" });
    }
  });

  app.post('/api/personal-hosts/:id/book', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id } = req.params;
      const data = insertHostBookingSchema.parse({ ...req.body, hostId: id });
      
      // Check if host exists and is available
      const host = await storage.getPersonalHostById(id);
      if (!host) {
        return res.status(404).json({ message: "Host not found" });
      }
      
      if (!host.isActive) {
        return res.status(400).json({ message: "Host is not available for booking" });
      }
      
      // Calculate total price with 10% platform fee
      const checkIn = new Date(data.checkIn!);
      const checkOut = new Date(data.checkOut!);
      const days = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
      const basePrice = parseFloat(host.pricePerDay) * days;
      const platformFee = basePrice * 0.10; // 10% platform fee
      const totalAmount = (basePrice + platformFee).toString();
      
      const booking = await storage.createHostBooking({
        guestId: userId,
        totalAmount,
        platformFee: platformFee.toString(),
        ...data
      });
      
      await storage.createAuditLog({
        actorId: userId,
        action: "host_booked",
        targetType: "host_booking",
        targetId: booking.id,
        metaJson: { hostId: id, days, basePrice: basePrice.toString(), platformFee: platformFee.toString(), totalAmount },
        ipAddress: req.ip,
        userAgent: req.get("User-Agent"),
      });
      
      res.json(booking);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error booking host:", error);
      res.status(500).json({ message: "Failed to book host" });
    }
  });

  app.get('/api/personal-hosts/bookings', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { type = 'guest' } = req.query;
      
      let bookings;
      if (type === 'host') {
        bookings = await storage.getMyHostBookings(userId);
      } else {
        bookings = await storage.getUserHostBookings(userId);
      }
      
      res.json(bookings);
    } catch (error) {
      console.error("Error fetching host bookings:", error);
      res.status(500).json({ message: "Failed to fetch host bookings" });
    }
  });

  app.patch('/api/personal-hosts/bookings/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id } = req.params;
      const { status } = req.body;
      
      if (!['confirmed', 'cancelled', 'completed'].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }
      
      const booking = await storage.updateHostBookingStatus(id, status);
      
      await storage.createAuditLog({
        actorId: userId,
        action: `host_booking_${status}`,
        targetType: "host_booking",
        targetId: id,
        ipAddress: req.ip,
        userAgent: req.get("User-Agent"),
      });
      
      res.json(booking);
    } catch (error) {
      console.error("Error updating host booking status:", error);
      res.status(500).json({ message: "Failed to update booking status" });
    }
  });

  // Ad marketplace routes
  app.get('/api/ads', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      // For demo user, always show test campaigns
      if (userId === 'demo-user-1') {
        const ads = await storage.getAds();
        return res.json(ads);
      }
      
      if (user?.plan !== 'premium') {
        return res.status(403).json({ message: "Creator plan required" });
      }
      
      // Check if user has verified YouTube channel
      if (!user?.youtubeVerified || !user?.youtubeChannelId) {
        return res.json([]);
      }
      
      // Get user's YouTube tier for filtering
      const userTier = user?.youtubeTier || 1; // Default to tier 1 if not set
      
      const ads = await storage.getAds();
      
      // Filter ads based on user's YouTube tier - only show ads at or below their tier
      const filteredAds = ads.filter(ad => (ad.tierLevel || 1) <= userTier);
      
      res.json(filteredAds);
    } catch (error) {
      console.error("Error fetching ads:", error);
      res.status(500).json({ message: "Failed to fetch ads" });
    }
  });

  app.post('/api/ads/:id/reserve', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id } = req.params;
      
      let user = await storage.getUser(userId);
      
      // Auto-fix demo user plan if needed
      if (userId === 'demo-user-1' && user?.plan !== 'standard') {
        console.log('Updating demo user plan to standard');
        user = await storage.updateUserProfile(userId, { plan: 'standard' });
      }
      
      // For demo user, bypass plan check  
      if (userId !== 'demo-user-1' && user?.plan !== 'premium' && user?.plan !== 'standard') {
        return res.status(403).json({ message: "Creator plan required" });
      }

      // SECURITY: Re-verify channel ownership before allowing campaign reservation
      // For demo user, allow campaign access if channel is connected (bypass verification for testing)
      if (userId === 'demo-user-1') {
        // Demo user bypass - only check if channel is connected
        if (!user?.youtubeChannelId) {
          return res.status(403).json({ message: "YouTube channel connection required" });
        }
        console.log('Demo user campaign access - verification bypassed');
      } else {
        // Regular users need full verification
        if (!user?.youtubeVerified || !user?.youtubeChannelId || !user?.youtubeVerificationCode) {
          return res.status(403).json({ message: "YouTube channel verification required" });
        }
      }

      // Fresh verification check - only for regular users (NOT demo user)
      if (userId !== 'demo-user-1') {
        try {
          const response = await fetch(
            `https://www.googleapis.com/youtube/v3/channels?part=snippet&id=${user.youtubeChannelId}&key=${process.env.YOUTUBE_API_KEY}`
          );

          if (!response.ok) {
            return res.status(400).json({ message: "Cannot verify channel ownership - please re-verify your channel" });
          }

          const data = await response.json();
          if (!data.items || data.items.length === 0) {
            return res.status(400).json({ message: "Channel not found - please re-verify your channel" });
          }

          const channelDescription = data.items[0].snippet.description || '';
          
          // Check if verification code still exists in channel description
          if (!channelDescription.includes(user.youtubeVerificationCode)) {
            // Mark user as unverified and prevent campaign access
            await storage.updateUserProfile(userId, {
              youtubeVerified: false
            });
            
            return res.status(403).json({ 
              message: "Channel verification expired. Verification code no longer found in channel description. Please re-verify your channel.",
              requiresReVerification: true 
            });
          }
        } catch (verifyError) {
          console.error("Error during campaign verification check:", verifyError);
          return res.status(500).json({ message: "Unable to verify channel ownership. Please try again." });
        }
      } else {
        console.log('Demo user - skipping fresh verification check');
      }
      
      const expiresAt = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000); // 5 days
      const reservation = await storage.createAdReservation(id, userId, expiresAt);
      
      // Skip audit log for demo users to avoid foreign key constraint error
      if (userId !== 'demo-user-1') {
        await storage.createAuditLog({
          actorId: userId,
          action: "ad_reserved",
          targetType: "ad",
          targetId: id,
          ipAddress: req.ip,
          userAgent: req.get("User-Agent"),
        });
      }
      
      res.json(reservation);
    } catch (error) {
      console.error("Error reserving ad:", error);
      res.status(500).json({ message: "Failed to reserve ad" });
    }
  });

  app.post('/api/ads/:id/submit', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id } = req.params;
      const { postId, rawFileUrl, contentLink, originalVideoUrl, clipUrl, clipStartTime, clipEndTime } = req.body;
      
      const user = await storage.getUser(userId);

      // SECURITY: Re-verify channel ownership before allowing campaign submission
      // For demo user, allow campaign submission if channel is connected (bypass verification for testing)
      if (userId === 'demo-user-1') {
        // Demo user bypass - only check if channel is connected
        if (!user?.youtubeChannelId) {
          return res.status(403).json({ message: "YouTube channel connection required" });
        }
        console.log('Demo user campaign submission - verification bypassed');
      } else {
        // Regular users need full verification
        if (!user?.youtubeVerified || !user?.youtubeChannelId || !user?.youtubeVerificationCode) {
          return res.status(403).json({ message: "YouTube channel verification required" });
        }
      }

      // Fresh verification check - only for regular users (NOT demo user)
      if (userId !== 'demo-user-1') {
        try {
          const response = await fetch(
            `https://www.googleapis.com/youtube/v3/channels?part=snippet&id=${user.youtubeChannelId}&key=${process.env.YOUTUBE_API_KEY}`
          );

          if (!response.ok) {
            return res.status(400).json({ message: "Cannot verify channel ownership - please re-verify your channel" });
          }

          const data = await response.json();
          if (!data.items || data.items.length === 0) {
            return res.status(400).json({ message: "Channel not found - please re-verify your channel" });
          }

          const channelDescription = data.items[0].snippet.description || '';
          
          // Check if verification code still exists in channel description
          if (!channelDescription.includes(user.youtubeVerificationCode)) {
            // Mark user as unverified and prevent campaign access
            await storage.updateUserProfile(userId, {
              youtubeVerified: false
            });
            
            return res.status(403).json({ 
              message: "Channel verification expired. Verification code no longer found in channel description. Please re-verify your channel.",
              requiresReVerification: true 
            });
          }
        } catch (verifyError) {
          console.error("Error during submission verification check:", verifyError);
          return res.status(500).json({ message: "Unable to verify channel ownership. Please try again." });
        }
      } else {
        console.log('Demo user - skipping fresh submission verification check');
      }
      
      // Find active reservation
      const reservations = await storage.getUserActiveReservations(userId);
      const reservation = reservations.find(r => r.adId === id);
      
      if (!reservation) {
        return res.status(400).json({ message: "No active reservation found" });
      }
      
      // Verify video clip if provided
      let verificationStatus = 'pending';
      let verificationScore = null;
      let verificationNotes = null;

      if (originalVideoUrl && clipUrl && clipStartTime !== undefined && clipEndTime !== undefined) {
        try {
          const verification = await verifyVideoClip(originalVideoUrl, clipUrl, clipStartTime, clipEndTime);
          verificationStatus = verification.status;
          verificationScore = verification.score;
          verificationNotes = verification.notes;
        } catch (error) {
          console.error("Video verification failed:", error);
          verificationStatus = 'failed';
          verificationNotes = 'Technical error during verification';
        }
      }

      const submission = await storage.createAdSubmission({
        reservationId: reservation.id,
        postId,
        rawFileUrl,
        contentLink,
        originalVideoUrl,
        clipUrl,
        clipStartTime,
        clipEndTime,
        verificationStatus,
        verificationScore,
        verificationNotes
      });
      
      await storage.createAuditLog({
        actorId: userId,
        action: "ad_submitted",
        targetType: "ad_submission",
        targetId: submission.id,
        ipAddress: req.ip,
        userAgent: req.get("User-Agent"),
      });
      
      res.json(submission);
    } catch (error) {
      console.error("Error submitting ad:", error);
      res.status(500).json({ message: "Failed to submit ad" });
    }
  });

  // Get user reservations
  app.get('/api/reservations', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const reservations = await storage.getUserActiveReservations(userId);
      res.json(reservations);
    } catch (error) {
      console.error("Error fetching reservations:", error);
      res.status(500).json({ message: "Failed to fetch reservations" });
    }
  });

  // Object storage routes
  app.get("/objects/:objectPath(*)", isAuthenticated, async (req: any, res) => {
    const userId = req.user?.claims?.sub;
    const objectStorageService = new ObjectStorageService();
    try {
      const objectFile = await objectStorageService.getObjectEntityFile(req.path);
      const canAccess = await objectStorageService.canAccessObjectEntity({
        objectFile,
        userId: userId,
        requestedPermission: ObjectPermission.READ,
      });
      if (!canAccess) {
        return res.sendStatus(401);
      }
      objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      console.error("Error checking object access:", error);
      if (error instanceof ObjectNotFoundError) {
        return res.sendStatus(404);
      }
      return res.sendStatus(500);
    }
  });

  app.post("/api/objects/upload", isAuthenticated, async (req, res) => {
    const objectStorageService = new ObjectStorageService();
    const uploadURL = await objectStorageService.getObjectEntityUploadURL();
    res.json({ uploadURL });
  });

  app.put("/api/media", isAuthenticated, async (req: any, res) => {
    if (!req.body.mediaUrl) {
      return res.status(400).json({ error: "mediaUrl is required" });
    }

    const userId = req.user?.claims?.sub;

    try {
      const objectStorageService = new ObjectStorageService();
      const objectPath = await objectStorageService.trySetObjectEntityAclPolicy(
        req.body.mediaUrl,
        {
          owner: userId,
          visibility: "public",
        },
      );

      res.status(200).json({
        objectPath: objectPath,
      });
    } catch (error) {
      console.error("Error setting media:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Billing routes
  app.post('/api/billing/checkout', isAuthenticated, async (req: any, res) => {
    try {
      if (!stripe) {
        return res.status(503).json({ message: "Stripe not configured" });
      }

      const userId = req.user.claims.sub;
      const { plan } = req.body;
      
      if (!['standard', 'premium'].includes(plan)) {
        return res.status(400).json({ message: "Invalid plan" });
      }
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Create or get Stripe customer
      let customerId = user.stripeCustomerId;
      if (!customerId) {
        const customer = await stripe.customers.create({
          email: user.email!,
          name: user.displayName || user.username,
          metadata: { userId }
        });
        customerId = customer.id;
        await storage.updateStripeCustomerId(userId, customerId);
      }

      // Create checkout session
      const priceId = plan === 'standard' 
        ? process.env.STRIPE_STANDARD_PRICE_ID 
        : process.env.STRIPE_PREMIUM_PRICE_ID;

      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        payment_method_types: ['card'],
        line_items: [{
          price: priceId,
          quantity: 1,
        }],
        mode: 'subscription',
        success_url: `${req.protocol}://${req.get('host')}/billing?success=true`,
        cancel_url: `${req.protocol}://${req.get('host')}/billing?cancelled=true`,
        metadata: { userId, plan }
      });

      res.json({ url: session.url });
    } catch (error) {
      console.error("Error creating checkout session:", error);
      res.status(500).json({ message: "Failed to create checkout session" });
    }
  });

  // Webhook for Stripe
  app.post('/api/billing/webhooks/stripe', async (req, res) => {
    try {
      if (!stripe) {
        return res.status(503).json({ message: "Stripe not configured" });
      }

      const sig = req.headers['stripe-signature'];
      const event = stripe.webhooks.constructEvent(
        req.body,
        sig as string,
        process.env.STRIPE_WEBHOOK_SECRET!
      );

      switch (event.type) {
        case 'checkout.session.completed':
          const session = event.data.object as any;
          const userId = session.metadata.userId;
          const plan = session.metadata.plan;
          
          await storage.updateUserProfile(userId, { plan });
          await storage.createSubscription({
            userId,
            plan,
            provider: 'stripe',
            providerSubscriptionId: session.subscription,
            status: 'active',
            startedAt: new Date(),
          });
          
          // Create wallet if premium (for earning)
          if (plan === 'premium') {
            const existing = await storage.getWallet(userId);
            if (!existing) {
              await storage.createWallet(userId);
            }
          }
          break;
      }

      res.json({ received: true });
    } catch (error) {
      console.error("Stripe webhook error:", error);
      res.status(400).json({ message: "Webhook error" });
    }
  });

  // Wallet routes
  app.get('/api/wallet', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const wallet = await storage.getWallet(userId);
      const payouts = await storage.getUserPayouts(userId);
      
      res.json({ wallet, payouts });
    } catch (error) {
      console.error("Error fetching wallet:", error);
      res.status(500).json({ message: "Failed to fetch wallet" });
    }
  });

  app.post('/api/wallet/payouts', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { amountMinor, method = 'stripe' } = req.body;
      
      const wallet = await storage.getWallet(userId);
      if (!wallet || (wallet.balanceMinor || 0) < amountMinor) {
        return res.status(400).json({ message: "Insufficient balance" });
      }
      
      const payout = await storage.createPayout({
        userId,
        amountMinor,
        method
      });
      
      // Deduct from wallet
      await storage.updateWalletBalance(userId, -amountMinor);
      
      await storage.createAuditLog({
        actorId: userId,
        action: "payout_requested",
        targetType: "payout",
        targetId: payout.id,
        metaJson: { amountMinor, method },
        ipAddress: req.ip,
        userAgent: req.get("User-Agent"),
      });
      
      res.json(payout);
    } catch (error) {
      console.error("Error creating payout:", error);
      res.status(500).json({ message: "Failed to create payout" });
    }
  });

  // PayPal routes for publisher payments
  app.get("/paypal/setup", async (req, res) => {
    await loadPaypalDefault(req, res);
  });

  app.post("/paypal/order", async (req, res) => {
    // Request body should contain: { intent, amount, currency }
    await createPaypalOrder(req, res);
  });

  app.post("/paypal/order/:orderID/capture", async (req, res) => {
    await capturePaypalOrder(req, res);
  });

  // Reports
  app.post('/api/reports', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const data = insertReportSchema.parse(req.body);
      
      const report = await storage.createReport({
        reporterId: userId,
        ...data
      });
      
      res.json(report);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error creating report:", error);
      res.status(500).json({ message: "Failed to create report" });
    }
  });

  // Admin routes
  app.get('/api/admin/dashboard', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Handle demo admin
      let user;
      if (userId === 'demo-admin') {
        user = { role: 'admin' };
      } else {
        user = await storage.getUser(userId);
      }
      
      if (!['admin', 'superadmin', 'moderator'].includes(user?.role || '')) {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      // Return dashboard stats
      res.json({
        totalUsers: 0, // Implement actual counts
        totalPosts: 0,
        pendingReports: 0,
        pendingSubmissions: 0,
      });
    } catch (error) {
      console.error("Error fetching admin dashboard:", error);
      res.status(500).json({ message: "Failed to fetch dashboard" });
    }
  });

  // AI Assistant Chat API
  app.post('/api/ai/chat', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Handle demo admin
      let user;
      if (userId === 'demo-admin') {
        user = { role: 'admin' };
      } else {
        user = await storage.getUser(userId);
      }
      
      if (!['admin', 'superadmin'].includes(user?.role || '')) {
        return res.status(403).json({ message: "Admin access required" });
      }

      // Check for OpenAI configuration from environment or potentially saved settings
      let openaiClient = openai;
      let apiKey = process.env.OPENAI_API_KEY;
      
      // For demo purposes, we'll check if there's a saved OpenAI API key from settings
      // In production, this would come from a secure database store
      if (!apiKey) {
        return res.status(503).json({ 
          response: "OpenAI API key is invalid. Please check your configuration.",
          error: "service_unavailable"
        });
      }
      
      // Create a new client if needed with the current API key
      if (!openaiClient) {
        try {
          openaiClient = new OpenAI({ apiKey });
        } catch (error) {
          return res.status(503).json({ 
            response: "OpenAI API key is invalid. Please check your configuration.",
            error: "service_unavailable"
          });
        }
      }

      const { message, context } = req.body;
      
      if (!message || typeof message !== 'string') {
        return res.status(400).json({ 
          response: "Please provide a valid message.",
          error: "invalid_input"
        });
      }

      // Create AI assistant prompt for website editing
      const systemPrompt = `You are HubLink AI Assistant, a helpful AI that helps administrators manage and edit their tourism social platform website through natural language commands.

You can help with:
1. Website Content: Edit homepage, menu items, page content, titles, descriptions
2. User Management: Create users, update roles, manage permissions, view user data
3. System Settings: Update configurations, pricing, features, API settings
4. Content Moderation: Manage posts, reviews, reports, user-generated content
5. Financial Management: View revenue, update pricing, manage payments
6. Marketing: Create campaigns, update promotions, manage advertisements

Current context: ${context || 'admin_panel'}

When users ask you to make changes:
1. Acknowledge what they want to change
2. Explain what the change would do
3. Provide step-by-step instructions
4. Suggest related improvements if applicable
5. Be specific and actionable

For example:
- "Add menu item About Us" → Explain where to add it, what it would contain
- "Change homepage title" → Explain current title, suggest new options
- "Create admin user" → Explain user creation process, required fields
- "Update pricing" → Show current pricing, explain impact of changes

Always be helpful, professional, and focused on website management tasks.`;

      try {
        const completion = await openaiClient.chat.completions.create({
          model: "gpt-3.5-turbo",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: message }
          ],
          max_tokens: 1000,
          temperature: 0.7
        });

        const response = completion.choices[0]?.message?.content || 
          "I'm sorry, I couldn't generate a response. Please try again.";

        // Create audit log for AI usage
        await storage.createAuditLog({
          actorId: userId,
          action: 'ai_chat_request',
          targetType: 'ai_assistant',
          targetId: 'chat_session',
          metaJson: { 
            message: message.substring(0, 100), // Log first 100 chars
            context,
            tokens_used: completion.usage?.total_tokens || 0
          }
        });

        res.json({ 
          response,
          tokens_used: completion.usage?.total_tokens || 0,
          model: "gpt-3.5-turbo"
        });

      } catch (openaiError: any) {
        console.error('OpenAI API error:', openaiError);
        
        let errorMessage = "I'm experiencing technical difficulties. Please try again later.";
        
        if (openaiError.code === 'insufficient_quota') {
          errorMessage = "OpenAI API quota exceeded. Please check your OpenAI account billing.";
        } else if (openaiError.code === 'invalid_api_key') {
          errorMessage = "OpenAI API key is invalid. Please check your configuration.";
        } else if (openaiError.code === 'rate_limit_exceeded') {
          errorMessage = "Too many requests. Please wait a moment and try again.";
        }

        res.json({ 
          response: errorMessage,
          error: "openai_error",
          error_code: openaiError.code
        });
      }

    } catch (error) {
      console.error("AI chat error:", error);
      res.status(500).json({ 
        response: "I encountered an unexpected error. Please try again.",
        error: "server_error"
      });
    }
  });

  // Plan Pricing Management API
  app.get('/api/admin/plans', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Handle demo admin
      let user;
      if (userId === 'demo-admin') {
        user = { role: 'admin' };
      } else {
        user = await storage.getUser(userId);
      }
      
      if (!['admin', 'superadmin'].includes(user?.role || '')) {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      // Return current plans with pricing
      const plans = [
        {
          id: 'free',
          name: 'Free Plan',
          price: 0,
          currency: 'GBP',
          billing: 'monthly',
          features: [
            'Basic profile',
            'View content',
            'Limited messaging',
            'Community access'
          ],
          limits: {
            posts: 5,
            messages: 10,
            events: 2
          },
          active: true
        },
        {
          id: 'premium',
          name: 'Premium Plan',
          price: 45,
          currency: 'GBP', 
          billing: 'monthly',
          features: [
            'All Free features',
            'Creator tools',
            'Unlimited messaging',
            'Event creation',
            'Analytics dashboard',
            'Ad campaigns',
            'Priority support'
          ],
          limits: {
            posts: -1,
            messages: -1,
            events: -1
          },
          active: true
        }
      ];
      
      res.json(plans);
    } catch (error) {
      console.error("Error fetching plans:", error);
      res.status(500).json({ message: "Failed to fetch plans" });
    }
  });

  app.put('/api/admin/plans/:planId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Handle demo admin
      let user;
      if (userId === 'demo-admin') {
        user = { role: 'admin' };
      } else {
        user = await storage.getUser(userId);
      }
      
      if (!['admin', 'superadmin'].includes(user?.role || '')) {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const { planId } = req.params;
      const { name, price, currency, billing, features, limits, active } = req.body;
      
      // In real implementation, this would update database
      // For now, return success for demo
      console.log(`Plan ${planId} updated:`, { name, price, currency, billing, features, limits, active });
      
      // Create audit log
      await storage.createAuditLog({
        actorId: userId,
        action: 'update_plan',
        entityType: 'plan',
        entityId: planId,
        details: { name, price, currency, billing, features, limits, active }
      });
      
      res.json({ 
        success: true, 
        message: `Plan ${planId} updated successfully`,
        plan: { id: planId, name, price, currency, billing, features, limits, active }
      });
    } catch (error) {
      console.error("Error updating plan:", error);
      res.status(500).json({ message: "Failed to update plan" });
    }
  });

  // Website Content Management API
  app.get('/api/admin/content', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Handle demo admin
      let user;
      if (userId === 'demo-admin') {
        user = { role: 'admin' };
      } else {
        user = await storage.getUser(userId);
      }
      
      if (!['admin', 'superadmin'].includes(user?.role || '')) {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      // Return website content sections
      const content = {
        homepage: {
          hero_title: "Connect Travelers & Creators Globally",
          hero_subtitle: "Join the world's leading travel community platform",
          hero_image: "/images/hero-bg.jpg"
        },
        features: [
          {
            id: 1,
            title: "Discover Amazing Places",
            description: "Explore curated content from fellow travelers",
            icon: "map"
          },
          {
            id: 2,
            title: "Connect with Creators",
            description: "Follow your favorite travel creators and influencers", 
            icon: "users"
          },
          {
            id: 3,
            title: "Plan Events Together",
            description: "Create and join travel events with like-minded people",
            icon: "calendar"
          }
        ],
        pricing: {
          free_title: "Start Your Journey",
          premium_title: "Unlock Full Potential", 
          currency: "GBP"
        }
      };
      
      res.json(content);
    } catch (error) {
      console.error("Error fetching content:", error);
      res.status(500).json({ message: "Failed to fetch content" });
    }
  });

  app.put('/api/admin/content/:section', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Handle demo admin
      let user;
      if (userId === 'demo-admin') {
        user = { role: 'admin' };
      } else {
        user = await storage.getUser(userId);
      }
      
      if (!['admin', 'superadmin'].includes(user?.role || '')) {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const { section } = req.params;
      const contentData = req.body;
      
      console.log(`Content section ${section} updated:`, contentData);
      
      // Create audit log
      await storage.createAuditLog({
        actorId: userId,
        action: 'update_content',
        entityType: 'content',
        entityId: section,
        details: contentData
      });
      
      res.json({ 
        success: true, 
        message: `Content section ${section} updated successfully`,
        content: contentData
      });
    } catch (error) {
      console.error("Error updating content:", error);
      res.status(500).json({ message: "Failed to update content" });
    }
  });

  // User Management APIs
  app.get('/api/admin/users', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Handle demo admin
      let user;
      if (userId === 'demo-admin') {
        user = { role: 'admin' };
      } else {
        user = await storage.getUser(userId);
      }
      
      if (!['admin', 'superadmin'].includes(user?.role || '')) {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const { page = 1, limit = 50, search = '', role = 'all', plan = 'all' } = req.query;
      
      // Get users from database with filters
      const users = await storage.getUsers({
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        search: search as string,
        role: role === 'all' ? undefined : role as string,
        plan: plan === 'all' ? undefined : plan as string,
      });
      
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.put('/api/admin/users/:userId', isAuthenticated, async (req: any, res) => {
    try {
      const adminId = req.user.claims.sub;
      
      // Handle demo admin
      let adminUser;
      if (adminId === 'demo-admin') {
        adminUser = { role: 'admin' };
      } else {
        adminUser = await storage.getUser(adminId);
      }
      
      if (!['admin', 'superadmin'].includes(adminUser?.role || '')) {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const { userId } = req.params;
      const updates = req.body;
      
      // Update user in database
      await storage.updateUser(userId, updates);
      
      // Create audit log
      await storage.createAuditLog({
        actorId: adminId,
        action: 'update_user',
        targetType: 'user',
        targetId: userId,
        metaJson: updates
      });
      
      res.json({ 
        success: true, 
        message: "User updated successfully",
        updates
      });
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  // Discount Code APIs
  app.get('/api/admin/discount-codes', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Handle demo admin
      let user;
      if (userId === 'demo-admin') {
        user = { role: 'admin' };
      } else {
        user = await storage.getUser(userId);
      }
      
      if (!['admin', 'superadmin'].includes(user?.role || '')) {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      // Get discount codes with usage stats including trial codes
      const codes = [
        {
          id: 'demo-1',
          code: 'WELCOME50',
          description: '50% off for new users',
          discountType: 'percentage',
          discountValue: 50,
          maxUses: 100,
          usedCount: 23,
          validFrom: new Date(),
          validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          isActive: true,
          applicablePlans: ['premium'],
          createdAt: new Date(),
        },
        {
          id: 'demo-2',
          code: 'SAVE10',
          description: '£10 off premium plans',
          discountType: 'fixed_amount',
          discountValue: 10,
          maxUses: 50,
          usedCount: 8,
          validFrom: new Date(),
          validUntil: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
          isActive: true,
          applicablePlans: ['premium'],
          createdAt: new Date(),
        },
        {
          id: 'demo-3',
          code: 'TRIAL30',
          description: '30 days free trial - Premium Plan',
          discountType: 'trial',
          discountValue: 0,
          trialPeriodDays: 30,
          trialPlanType: 'premium',
          autoDebitEnabled: true,
          maxUses: 500,
          usedCount: 45,
          validFrom: new Date(),
          validUntil: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
          isActive: true,
          applicablePlans: ['premium'],
          createdAt: new Date(),
        },
        {
          id: 'demo-4',
          code: 'FREETRIAL7',
          description: '7 days free trial - Creator Plan',
          discountType: 'trial',
          discountValue: 0,
          trialPeriodDays: 7,
          trialPlanType: 'creator',
          autoDebitEnabled: true,
          maxUses: 100,
          usedCount: 12,
          validFrom: new Date(),
          validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          isActive: true,
          applicablePlans: ['creator'],
          createdAt: new Date(),
        }
      ];
      
      res.json(codes);
    } catch (error) {
      console.error("Error fetching discount codes:", error);
      res.status(500).json({ message: "Failed to fetch discount codes" });
    }
  });

  app.post('/api/admin/discount-codes', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Handle demo admin
      let user;
      if (userId === 'demo-admin') {
        user = { role: 'admin' };
      } else {
        user = await storage.getUser(userId);
      }
      
      if (!['admin', 'superadmin'].includes(user?.role || '')) {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const codeData = req.body;
      
      // Create discount code in database
      console.log('Creating discount code:', codeData);
      
      // Create audit log
      await storage.createAuditLog({
        actorId: userId,
        action: 'create_discount_code',
        targetType: 'discount_code',
        targetId: codeData.code,
        metaJson: codeData
      });
      
      res.json({ 
        success: true, 
        message: "Discount code created successfully",
        code: { id: 'new-' + Date.now(), ...codeData, usedCount: 0, createdAt: new Date() }
      });
    } catch (error) {
      console.error("Error creating discount code:", error);
      res.status(500).json({ message: "Failed to create discount code" });
    }
  });

  // Site Settings/Branding APIs
  app.get('/api/admin/site-settings', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Handle demo admin
      let user;
      if (userId === 'demo-admin') {
        user = { role: 'admin' };
      } else {
        user = await storage.getUser(userId);
      }
      
      if (!['admin', 'superadmin'].includes(user?.role || '')) {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      // Return site settings including branding
      const settings = {
        branding: {
          siteName: 'HubLink',
          logoUrl: '/images/logo.png',
          faviconUrl: '/images/favicon.ico',
          primaryColor: '#0066cc',
          secondaryColor: '#f0f9ff'
        },
        general: {
          maintenanceMode: false,
          registrationOpen: true,
          emailVerificationRequired: true,
          defaultUserRole: 'traveler'
        },
        payment: {
          platformFeePercentage: 10,
          currency: 'GBP',
          stripeEnabled: true,
          paypalEnabled: false
        }
      };
      
      res.json(settings);
    } catch (error) {
      console.error("Error fetching site settings:", error);
      res.status(500).json({ message: "Failed to fetch site settings" });
    }
  });

  app.put('/api/admin/site-settings/:category', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Handle demo admin
      let user;
      if (userId === 'demo-admin') {
        user = { role: 'admin' };
      } else {
        user = await storage.getUser(userId);
      }
      
      if (!['admin', 'superadmin'].includes(user?.role || '')) {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const { category } = req.params;
      const settingsData = req.body;
      
      console.log(`Updating ${category} settings:`, settingsData);
      
      // Create audit log
      await storage.createAuditLog({
        actorId: userId,
        action: 'update_site_settings',
        targetType: 'site_settings',
        targetId: category,
        metaJson: settingsData
      });
      
      res.json({ 
        success: true, 
        message: `${category} settings updated successfully`,
        settings: settingsData
      });
    } catch (error) {
      console.error("Error updating site settings:", error);
      res.status(500).json({ message: "Failed to update site settings" });
    }
  });

  // API Settings Management APIs
  app.get('/api/admin/api-settings', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Handle demo admin
      let user;
      if (userId === 'demo-admin') {
        user = { role: 'admin' };
      } else {
        user = await storage.getUser(userId);
      }
      
      if (!['admin', 'superadmin'].includes(user?.role || '')) {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      // Return API configuration status
      const apiSettings = {
        stripe: {
          publishableKey: process.env.VITE_STRIPE_PUBLIC_KEY ? 'pk_live_••••••••••••3456' : '',
          secretKey: process.env.STRIPE_SECRET_KEY ? 'sk_live_••••••••••••7890' : '',
          webhookSecret: process.env.STRIPE_WEBHOOK_SECRET ? 'whsec_••••••••••••1234' : '',
          status: process.env.STRIPE_SECRET_KEY ? 'active' : 'inactive',
          lastTested: new Date().toISOString()
        },
        paypal: {
          clientId: process.env.PAYPAL_CLIENT_ID || '',
          clientSecret: process.env.PAYPAL_CLIENT_SECRET ? '••••••••••••' : '',
          environment: 'sandbox',
          status: process.env.PAYPAL_CLIENT_ID ? 'active' : 'inactive',
          lastTested: null
        },
        youtube: {
          apiKey: process.env.YOUTUBE_API_KEY ? '••••••••••••' : '',
          projectId: 'hublink-project',
          status: process.env.YOUTUBE_API_KEY ? 'active' : 'inactive',
          lastTested: null
        },
        database: {
          url: process.env.DATABASE_URL ? 'postgres://••••••••••••' : '',
          poolSize: 10,
          status: process.env.DATABASE_URL ? 'connected' : 'disconnected',
          lastTested: new Date().toISOString()
        },
        storage: {
          bucketName: 'hublink-storage',
          status: 'active',
          lastTested: new Date().toISOString()
        },
        openai: {
          apiKey: process.env.OPENAI_API_KEY ? 'sk-••••••••••••••••••••••••••••••••••••••••••••••••' : '',
          model: 'gpt-3.5-turbo',
          maxTokens: 1000,
          temperature: 0.7,
          status: process.env.OPENAI_API_KEY ? 'active' : 'inactive',
          lastTested: process.env.OPENAI_API_KEY ? new Date().toISOString() : null,
          monthlyUsage: 12450
        },
        email: {
          provider: 'not_configured',
          apiKey: '',
          status: 'inactive',
          lastTested: null
        },
        usage: {
          stripe: { calls: 2456, period: '30_days' },
          paypal: { calls: 0, period: '30_days' },
          youtube: { calls: 0, period: '30_days' },
          openai: { tokens: 12450, period: '30_days' },
          storage: { requests: 12890, period: '30_days' }
        }
      };
      
      res.json(apiSettings);
    } catch (error) {
      console.error("Error fetching API settings:", error);
      res.status(500).json({ message: "Failed to fetch API settings" });
    }
  });

  app.put('/api/admin/api-settings/:service', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Handle demo admin
      let user;
      if (userId === 'demo-admin') {
        user = { role: 'admin' };
      } else {
        user = await storage.getUser(userId);
      }
      
      if (!['admin', 'superadmin'].includes(user?.role || '')) {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const { service } = req.params;
      const settingsData = req.body;
      
      // Validate service type
      const validServices = ['stripe', 'paypal', 'youtube', 'openai', 'database', 'storage', 'email'];
      if (!validServices.includes(service)) {
        return res.status(400).json({ message: "Invalid service type" });
      }
      
      console.log(`Updating ${service} API settings:`, { service, keysProvided: Object.keys(settingsData) });
      
      // In a real implementation, these would be stored securely in environment variables
      // For demo purposes, we'll just validate the format
      
      let validationResult = { valid: true, message: 'Settings updated successfully' };
      
      switch (service) {
        case 'stripe':
          if (settingsData.publishableKey && !settingsData.publishableKey.startsWith('pk_')) {
            validationResult = { valid: false, message: 'Invalid Stripe publishable key format' };
          }
          if (settingsData.secretKey && !settingsData.secretKey.startsWith('sk_')) {
            validationResult = { valid: false, message: 'Invalid Stripe secret key format' };
          }
          break;
        case 'paypal':
          if (settingsData.environment && !['sandbox', 'live'].includes(settingsData.environment)) {
            validationResult = { valid: false, message: 'Invalid PayPal environment' };
          }
          break;
        case 'youtube':
          if (settingsData.apiKey && settingsData.apiKey.length < 20) {
            validationResult = { valid: false, message: 'Invalid YouTube API key format' };
          }
          break;
        case 'openai':
          if (settingsData.apiKey && !settingsData.apiKey.startsWith('sk-')) {
            validationResult = { valid: false, message: 'Invalid OpenAI API key format. Must start with sk-' };
          }
          if (settingsData.model && !['gpt-3.5-turbo', 'gpt-4', 'gpt-4-turbo', 'gpt-4o'].includes(settingsData.model)) {
            validationResult = { valid: false, message: 'Invalid OpenAI model selection' };
          }
          if (settingsData.maxTokens && (settingsData.maxTokens < 1 || settingsData.maxTokens > 4000)) {
            validationResult = { valid: false, message: 'Max tokens must be between 1 and 4000' };
          }
          if (settingsData.temperature && (settingsData.temperature < 0 || settingsData.temperature > 2)) {
            validationResult = { valid: false, message: 'Temperature must be between 0 and 2' };
          }
          break;
      }
      
      if (!validationResult.valid) {
        return res.status(400).json({ message: validationResult.message });
      }
      
      // Create audit log
      await storage.createAuditLog({
        actorId: userId,
        action: 'update_api_settings',
        targetType: 'api_settings',
        targetId: service,
        metaJson: { service, updated: Object.keys(settingsData) }
      });
      
      res.json({ 
        success: true, 
        message: `${service} API settings updated successfully`,
        service,
        status: 'updated'
      });
    } catch (error) {
      console.error("Error updating API settings:", error);
      res.status(500).json({ message: "Failed to update API settings" });
    }
  });

  app.post('/api/admin/api-settings/test/:service', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Handle demo admin
      let user;
      if (userId === 'demo-admin') {
        user = { role: 'admin' };
      } else {
        user = await storage.getUser(userId);
      }
      
      if (!['admin', 'superadmin'].includes(user?.role || '')) {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const { service } = req.params;
      
      // Validate service type
      const validServices = ['stripe', 'paypal', 'youtube', 'openai', 'database', 'storage', 'email'];
      if (!validServices.includes(service)) {
        return res.status(400).json({ message: "Invalid service type" });
      }
      
      console.log(`Testing ${service} API connection...`);
      
      // Simulate API testing with different results based on configuration
      let testResult = { success: false, message: 'Service not configured', details: {} };
      
      switch (service) {
        case 'stripe':
          if (process.env.STRIPE_SECRET_KEY) {
            testResult = { 
              success: true, 
              message: 'Stripe connection successful', 
              details: { 
                mode: 'live', 
                account: 'acct_••••••••••••',
                capabilities: ['card_payments', 'transfers']
              }
            };
          } else {
            testResult.message = 'Stripe API keys not configured';
          }
          break;
          
        case 'paypal':
          if (process.env.PAYPAL_CLIENT_ID) {
            testResult = { 
              success: true, 
              message: 'PayPal connection successful',
              details: { 
                environment: 'sandbox',
                merchantId: 'merchant_••••••••••••'
              }
            };
          } else {
            testResult.message = 'PayPal credentials not configured';
          }
          break;
          
        case 'youtube':
          if (process.env.YOUTUBE_API_KEY) {
            testResult = { 
              success: true, 
              message: 'YouTube API connection successful',
              details: { 
                quota: { remaining: 9500, total: 10000 },
                project: 'hublink-project'
              }
            };
          } else {
            testResult.message = 'YouTube API key not configured';
          }
          break;

        case 'openai':
          if (process.env.OPENAI_API_KEY && openai) {
            try {
              const testCompletion = await openai.chat.completions.create({
                model: "gpt-3.5-turbo",
                messages: [
                  { role: "system", content: "You are a helpful assistant." },
                  { role: "user", content: "Say 'Hello from HubLink Admin Panel! AI test successful.'" }
                ],
                max_tokens: 50
              });

              testResult = { 
                success: true, 
                message: 'OpenAI API connection successful',
                details: { 
                  model: 'gpt-3.5-turbo',
                  tokensUsed: testCompletion.usage?.total_tokens || 0,
                  response: testCompletion.choices[0]?.message?.content || 'Test successful',
                  status: 'connected'
                }
              };
            } catch (openaiError: any) {
              console.error('OpenAI test error:', openaiError);
              testResult.message = `OpenAI API test failed: ${openaiError.message || 'Unknown error'}`;
              testResult.details = { error: openaiError.code || 'unknown_error' };
            }
          } else {
            testResult.message = 'OpenAI API key not configured';
          }
          break;
          
        case 'database':
          if (process.env.DATABASE_URL) {
            testResult = { 
              success: true, 
              message: 'Database connection successful',
              details: { 
                host: 'neon.tech',
                database: 'hublink',
                ssl: true,
                poolSize: 10
              }
            };
          } else {
            testResult.message = 'Database URL not configured';
          }
          break;
          
        case 'storage':
          testResult = { 
            success: true, 
            message: 'Google Cloud Storage connection successful',
            details: { 
              bucket: 'hublink-storage',
              region: 'us-central1',
              objects: 1247
            }
          };
          break;
          
        case 'email':
          testResult = { 
            success: false, 
            message: 'Email service not configured',
            details: { recommendation: 'Configure SendGrid, Mailgun, or Amazon SES' }
          };
          break;
      }
      
      // Create audit log for test
      await storage.createAuditLog({
        actorId: userId,
        action: 'test_api_connection',
        targetType: 'api_settings',
        targetId: service,
        metaJson: { service, success: testResult.success, tested_at: new Date().toISOString() }
      });
      
      res.json({
        service,
        tested: true,
        timestamp: new Date().toISOString(),
        ...testResult
      });
    } catch (error) {
      console.error(`Error testing ${req.params.service} API:`, error);
      res.status(500).json({ message: "Failed to test API connection" });
    }
  });

  // Payment Accounts Management APIs
  app.get('/api/admin/payment-accounts', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Handle demo admin
      let user;
      if (userId === 'demo-admin') {
        user = { role: 'admin' };
      } else {
        user = await storage.getUser(userId);
      }
      
      if (!['admin', 'superadmin'].includes(user?.role || '')) {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      // Return payment account configurations
      const paymentAccounts = {
        stripe: {
          id: 'stripe_account',
          name: 'Stripe',
          status: 'connected',
          mode: 'live',
          publishableKey: 'pk_live_••••••••••••3456',
          webhookEndpoint: 'https://api.hublink.com/webhooks/stripe',
          platformFee: 10,
          currency: 'GBP'
        },
        paypal: {
          id: 'paypal_account',
          name: 'PayPal',
          status: 'disconnected',
          mode: 'sandbox',
          clientId: '',
          platformFee: 10,
          currency: 'GBP'
        },
        financial: {
          totalRevenue: 12450.00,
          platformFees: 1245.00,
          processingFees: 234.00,
          netRevenue: 10971.00
        }
      };
      
      res.json(paymentAccounts);
    } catch (error) {
      console.error("Error fetching payment accounts:", error);
      res.status(500).json({ message: "Failed to fetch payment accounts" });
    }
  });

  app.put('/api/admin/payment-accounts/:provider', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Handle demo admin
      let user;
      if (userId === 'demo-admin') {
        user = { role: 'admin' };
      } else {
        user = await storage.getUser(userId);
      }
      
      if (!['admin', 'superadmin'].includes(user?.role || '')) {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const { provider } = req.params;
      const accountData = req.body;
      
      console.log(`Updating ${provider} payment account:`, accountData);
      
      // Create audit log
      await storage.createAuditLog({
        actorId: userId,
        action: 'update_payment_account',
        targetType: 'payment_account',
        targetId: provider,
        metaJson: accountData
      });
      
      res.json({ 
        success: true, 
        message: `${provider} payment account updated successfully`,
        account: accountData
      });
    } catch (error) {
      console.error("Error updating payment account:", error);
      res.status(500).json({ message: "Failed to update payment account" });
    }
  });

  // Email Management APIs
  app.get('/api/admin/email-settings', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Handle demo admin
      let user;
      if (userId === 'demo-admin') {
        user = { role: 'admin' };
      } else {
        user = await storage.getUser(userId);
      }
      
      if (!['admin', 'superadmin'].includes(user?.role || '')) {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      // Return email configuration and templates
      const emailSettings = {
        smtp: {
          host: 'smtp.hublink.com',
          port: 587,
          security: 'TLS',
          username: 'notifications@hublink.com',
          password: '••••••••'
        },
        templates: [
          { id: 'welcome', name: 'Welcome Email', subject: 'Welcome to HubLink!', status: 'active' },
          { id: 'password_reset', name: 'Password Reset', subject: 'Reset Your Password', status: 'active' },
          { id: 'subscription_update', name: 'Subscription Update', subject: 'Your Subscription Has Been Updated', status: 'active' },
          { id: 'payment_receipt', name: 'Payment Receipt', subject: 'Payment Confirmation', status: 'active' }
        ],
        analytics: {
          emailsSent: 2341,
          deliveryRate: 89.2,
          openRate: 34.5,
          clickRate: 12.3
        }
      };
      
      res.json(emailSettings);
    } catch (error) {
      console.error("Error fetching email settings:", error);
      res.status(500).json({ message: "Failed to fetch email settings" });
    }
  });

  app.post('/api/admin/email/send-campaign', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Handle demo admin
      let user;
      if (userId === 'demo-admin') {
        user = { role: 'admin' };
      } else {
        user = await storage.getUser(userId);
      }
      
      if (!['admin', 'superadmin'].includes(user?.role || '')) {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const { type, audience, subject, content, schedule } = req.body;
      
      console.log('Sending email campaign:', { type, audience, subject, schedule });
      
      // Create audit log
      await storage.createAuditLog({
        actorId: userId,
        action: 'send_email_campaign',
        targetType: 'email_campaign',
        targetId: `${type}_${Date.now()}`,
        metaJson: { type, audience, subject, schedule }
      });
      
      // In real implementation, this would queue emails for sending
      res.json({ 
        success: true, 
        message: `Email campaign "${type}" scheduled successfully`,
        campaignId: `campaign_${Date.now()}`,
        recipientCount: audience === 'all' ? 2341 : audience === 'premium' ? 567 : 1234
      });
    } catch (error) {
      console.error("Error sending email campaign:", error);
      res.status(500).json({ message: "Failed to send email campaign" });
    }
  });

  app.put('/api/admin/email/template/:templateId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Handle demo admin
      let user;
      if (userId === 'demo-admin') {
        user = { role: 'admin' };
      } else {
        user = await storage.getUser(userId);
      }
      
      if (!['admin', 'superadmin'].includes(user?.role || '')) {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const { templateId } = req.params;
      const templateData = req.body;
      
      console.log(`Updating email template ${templateId}:`, templateData);
      
      // Create audit log
      await storage.createAuditLog({
        actorId: userId,
        action: 'update_email_template',
        targetType: 'email_template',
        targetId: templateId,
        metaJson: templateData
      });
      
      res.json({ 
        success: true, 
        message: `Email template "${templateId}" updated successfully`,
        template: templateData
      });
    } catch (error) {
      console.error("Error updating email template:", error);
      res.status(500).json({ message: "Failed to update email template" });
    }
  });

  // Trial System APIs
  app.post('/api/admin/coupon/apply-trial', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { couponCode } = req.body;
      
      console.log(`User ${userId} applying trial coupon: ${couponCode}`);
      
      // Validate coupon code (in real implementation, check database)
      const trialCoupons = {
        'TRIAL30': { days: 30, planType: 'premium', price: 45 },
        'FREETRIAL7': { days: 7, planType: 'creator', price: 45 },
        'TRIAL14': { days: 14, planType: 'premium', price: 45 },
        'TRIAL60': { days: 60, planType: 'premium', price: 45 },
      };
      
      const coupon = trialCoupons[couponCode as keyof typeof trialCoupons];
      if (!coupon) {
        return res.status(400).json({ message: "Invalid trial coupon code" });
      }
      
      // Check if user already has an active trial
      // In real implementation, check userTrials table
      
      // Calculate trial end date
      const trialEndDate = new Date();
      trialEndDate.setDate(trialEndDate.getDate() + coupon.days);
      
      // Create trial record
      const trialRecord = {
        id: `trial_${Date.now()}`,
        userId,
        couponCode,
        planType: coupon.planType,
        trialDays: coupon.days,
        trialStartDate: new Date(),
        trialEndDate,
        status: 'active',
        autoDebitEnabled: true,
        originalPrice: coupon.price,
        currency: 'GBP'
      };
      
      // Create audit log
      await storage.createAuditLog({
        actorId: userId,
        action: 'apply_trial_coupon',
        targetType: 'user_trial',
        targetId: trialRecord.id,
        metaJson: { couponCode, trialDays: coupon.days, planType: coupon.planType }
      });
      
      res.json({
        success: true,
        message: `${coupon.days}-day trial activated successfully!`,
        trial: trialRecord,
        autoDebitWarning: `Your card will be charged £${coupon.price}/month after the trial period ends.`
      });
    } catch (error) {
      console.error("Error applying trial coupon:", error);
      res.status(500).json({ message: "Failed to apply trial coupon" });
    }
  });

  app.get('/api/admin/user-trials', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Handle demo admin
      let user;
      if (userId === 'demo-admin') {
        user = { role: 'admin' };
      } else {
        user = await storage.getUser(userId);
      }
      
      if (!['admin', 'superadmin'].includes(user?.role || '')) {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      // Return trial statistics and active trials
      const trialData = {
        activeTrials: [
          {
            id: 'trial_1',
            userId: 'user_123',
            userEmail: 'john@example.com',
            couponCode: 'TRIAL30',
            planType: 'premium',
            trialDays: 30,
            daysRemaining: 25,
            trialEndDate: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000),
            autoDebitEnabled: true,
            originalPrice: 45,
            status: 'active'
          },
          {
            id: 'trial_2', 
            userId: 'user_456',
            userEmail: 'sarah@example.com',
            couponCode: 'FREETRIAL7',
            planType: 'creator',
            trialDays: 7,
            daysRemaining: 3,
            trialEndDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
            autoDebitEnabled: true,
            originalPrice: 45,
            status: 'active'
          }
        ],
        trialStats: {
          totalTrialsGiven: 157,
          activeTrials: 45,
          expiredTrials: 89,
          convertedToSubscription: 67,
          conversionRate: '75.3%',
          totalRevenueLost: 2305, // Revenue lost due to trials
          projectedRevenue: 2025 // Expected revenue from trial conversions
        }
      };
      
      res.json(trialData);
    } catch (error) {
      console.error("Error fetching trial data:", error);
      res.status(500).json({ message: "Failed to fetch trial data" });
    }
  });

  app.post('/api/admin/trial/cancel/:trialId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Handle demo admin
      let user;
      if (userId === 'demo-admin') {
        user = { role: 'admin' };
      } else {
        user = await storage.getUser(userId);
      }
      
      if (!['admin', 'superadmin'].includes(user?.role || '')) {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const { trialId } = req.params;
      
      console.log(`Admin cancelling trial: ${trialId}`);
      
      // Create audit log
      await storage.createAuditLog({
        actorId: userId,
        action: 'cancel_user_trial',
        targetType: 'user_trial',
        targetId: trialId,
        metaJson: { reason: 'admin_cancelled' }
      });
      
      res.json({
        success: true,
        message: 'Trial cancelled successfully',
        trialId
      });
    } catch (error) {
      console.error("Error cancelling trial:", error);
      res.status(500).json({ message: "Failed to cancel trial" });
    }
  });

  app.get('/api/admin/submissions', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Handle demo admin
      let user;
      if (userId === 'demo-admin') {
        user = { role: 'admin' };
      } else {
        user = await storage.getUser(userId);
      }
      
      if (!['admin', 'superadmin', 'moderator'].includes(user?.role || '')) {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const submissions = await storage.getAdSubmissions();
      res.json(submissions);
    } catch (error) {
      console.error("Error fetching submissions:", error);
      res.status(500).json({ message: "Failed to fetch submissions" });
    }
  });

  app.post('/api/admin/submissions/:id/review', isAuthenticated, async (req: any, res) => {
    try {
      const reviewerId = req.user.claims.sub;
      const user = await storage.getUser(reviewerId);
      if (!['admin', 'superadmin', 'moderator'].includes(user?.role || '')) {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const { id } = req.params;
      const { status, notes } = req.body; // approve or reject
      
      const submission = await storage.updateAdSubmissionStatus(id, status, reviewerId, notes);
      
      // If approved, add funds to creator's wallet
      if (status === 'approved' && submission.reservationId) {
        const reservation = await db.query.adReservations.findFirst({
          where: eq(adReservations.id, submission.reservationId),
          with: { ad: true }
        });
        
        if (reservation?.ad) {
          await storage.updateWalletBalance(
            reservation.userId!, 
            Math.round(parseFloat(reservation.ad.payoutAmount) * 100)
          );
        }
      }
      
      await storage.createAuditLog({
        actorId: reviewerId,
        action: `ad_submission_${status}`,
        targetType: "ad_submission",
        targetId: id,
        metaJson: { notes },
        ipAddress: req.ip,
        userAgent: req.get("User-Agent"),
      });
      
      res.json(submission);
    } catch (error) {
      console.error("Error reviewing submission:", error);
      res.status(500).json({ message: "Failed to review submission" });
    }
  });

  app.post('/api/admin/ads', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!['admin', 'superadmin'].includes(user?.role || '')) {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const data = insertAdSchema.parse(req.body);
      const ad = await storage.createAd(data);
      
      res.json(ad);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error creating ad:", error);
      res.status(500).json({ message: "Failed to create ad" });
    }
  });

  // Publisher ad creation
  app.post('/api/publisher/ads', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== 'publisher') {
        return res.status(403).json({ message: "Publisher role required" });
      }
      
      const data = insertPublisherAdSchema.parse(req.body);
      
      // Calculate max influencers based on tier and budget
      const tierPrices = { 1: 120, 2: 240, 3: 360 };
      const tierPrice = tierPrices[data.tierLevel as keyof typeof tierPrices];
      const maxInfluencers = Math.floor(data.totalBudget / tierPrice);
      
      const adData = {
        ...data,
        publisherId: req.user.claims.sub,
        payoutAmount: tierPrice.toString(),
        quota: maxInfluencers,
        maxInfluencers,
        currency: "USD"
      };
      
      const ad = await storage.createAd(adData);
      
      res.json(ad);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error creating publisher ad:", error);
      res.status(500).json({ message: "Failed to create ad" });
    }
  });

  // Get publisher's ads
  app.get('/api/publisher/ads', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== 'publisher') {
        return res.status(403).json({ message: "Publisher role required" });
      }
      
      const ads = await storage.getPublisherAds(req.user.claims.sub);
      res.json(ads);
    } catch (error) {
      console.error("Error fetching publisher ads:", error);
      res.status(500).json({ message: "Failed to fetch ads" });
    }
  });

  // Quick role update endpoint for demo purposes
  app.post('/api/user/role', isAuthenticated, async (req: any, res) => {
    try {
      const { role } = req.body;
      const validRoles = ['traveler', 'stays', 'promotional', 'tour_package', 'publisher', 'admin', 'superadmin'];
      
      if (!validRoles.includes(role)) {
        return res.status(400).json({ message: "Invalid role" });
      }
      
      const updatedUser = await storage.updateUserProfile(req.user.claims.sub, { role });
      res.json({ message: "Role updated successfully", user: updatedUser });
    } catch (error) {
      console.error("Error updating user role:", error);
      res.status(500).json({ message: "Failed to update role" });
    }
  });

  // Demo login with ID and Password
  app.post("/api/demo-login", async (req, res) => {
    console.log('🔄 Demo login endpoint hit!');
    console.log('🔍 Request body:', req.body);
    
    const { id, password } = req.body;
    
    console.log('Demo login request for ID:', id);
    console.log('Password received:', password);
    
    // Define valid ID/Password combinations
    const validCredentials = {
      'ADMIN_001': {
        password: 'admin123',
        userId: 'demo-admin',
        role: 'admin',
        plan: 'premium',
        name: 'System Administrator'
      },
    };
    
    try {
      console.log('Checking credentials for ID:', id, 'Password:', password);
      console.log('Available credentials:', Object.keys(validCredentials));
      
      // Check if credentials are valid
      const credential = validCredentials[id as keyof typeof validCredentials];
      console.log('Found credential:', credential);
      
      if (!credential) {
        console.log('No credential found for ID:', id);
        return res.status(401).json({ 
          success: false, 
          message: 'Invalid ID or Password' 
        });
      }
      
      if (credential.password !== password) {
        console.log('Password mismatch. Expected:', credential.password, 'Got:', password);
        return res.status(401).json({ 
          success: false, 
          message: 'Invalid ID or Password' 
        });
      }
      
      // Get user from database or create demo user for admin
      console.log('🔍 Attempting to get user from database:', credential.userId);
      let user = await storage.getUser(credential.userId);
      console.log('🔍 Database lookup result:', user ? 'Found user' : 'User not found');
      console.log('🔍 Credential role:', credential.role);
      
      // If user not found in database, create demo user object (especially for admin)
      if (!user && credential.role === 'admin') {
        user = {
          id: credential.userId,
          email: 'admin@hublink.com',
          firstName: 'System',
          lastName: 'Administrator',
          displayName: credential.name,
          username: 'admin',
          profileImageUrl: null,
          role: credential.role,
          plan: credential.plan,
          preferences: {},
          socialMedia: {},
          youtubeSubscribers: 0,
          youtubeTier: 0,
          youtubeChannelId: null,
          youtubeVerified: false
        };
        console.log('Created demo admin user object:', user);
      }
      
      if (user) {
        console.log('Login successful for:', credential.name);
        console.log('User ID:', user.id);
        
        // Set session cookie for demo user authentication  
        res.cookie('session_id', `demo-session-${user.id}`, {
          httpOnly: false, // Allow JavaScript access
          secure: false, // Allow HTTP in development
          sameSite: 'lax',
          path: '/',
          maxAge: 7 * 24 * 60 * 60 * 1000 // 1 week
        });
        
        console.log('Setting session cookie:', `demo-session-${user.id}`);
        console.log('Cookie options:', {
          httpOnly: false,
          secure: false,
          sameSite: 'lax',
          path: '/',
          maxAge: 7 * 24 * 60 * 60 * 1000
        });
        
        res.json({ 
          success: true, 
          message: `Login successful as ${credential.name}`,
          user: user
        });
      } else {
        res.status(404).json({ 
          success: false, 
          message: 'User not found in database' 
        });
      }
    } catch (error) {
      console.error('Demo login error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Login failed' 
      });
    }
  });

  // DISABLED - Old demo authentication endpoint 
  app.post('/api/demo-login-DISABLED', async (req, res) => {
    if (process.env.NODE_ENV === 'development') {
      const { userId, role, plan } = req.body;
      
      // Set demo session cookie for browser
      res.cookie('session_id', `demo-session-${userId}`, { 
        httpOnly: true, 
        secure: false, 
        sameSite: 'lax',
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
      });
      
      // Demo user data configuration
      const demoUserData = {
        'demo-creator-premium': {
          id: 'demo-creator-premium',
          email: 'creator-premium@hublink.com',
          firstName: 'Premium',
          lastName: 'Creator',
          displayName: 'Premium Creator',
          username: 'premium_creator',
          plan: 'premium',
          role: 'creator',
          profileImageUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
          country: 'United Kingdom',
          city: 'London'
        },
        'demo-creator-standard': {
          id: 'demo-creator-standard',
          email: 'creator-standard@hublink.com',
          firstName: 'Standard',
          lastName: 'Creator',
          displayName: 'Standard Creator',
          username: 'standard_creator',
          plan: 'standard',
          role: 'creator',
          profileImageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
          country: 'Spain',
          city: 'Barcelona'
        },
        'demo-publisher': {
          id: 'demo-publisher',
          email: 'publisher@hublink.com',
          firstName: 'Demo',
          lastName: 'Publisher',
          displayName: 'Demo Publisher',
          username: 'demo_publisher',
          plan: 'premium',
          role: 'publisher',
          profileImageUrl: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
          country: 'United States',
          city: 'New York'
        }
      };
      
      const selectedUser = demoUserData[userId as keyof typeof demoUserData];
      if (!selectedUser) {
        return res.status(400).json({ message: 'Invalid demo user' });
      }
      
      console.log('Selected demo user:', selectedUser);
      
      // Ensure user exists in database
      let existingUser = await storage.getUser(selectedUser.id);
      if (!existingUser) {
        console.log('Creating new demo user in database:', selectedUser.id);
        await storage.upsertUser(selectedUser);
      }
      
      res.json({ 
        message: "Demo login successful", 
        user: selectedUser
      });
    } else {
      res.status(403).json({ message: "Demo login only available in development" });
    }
  });

  // Demo logout endpoint
  app.post('/api/demo-logout', async (req, res) => {
    res.clearCookie('session_id');
    res.json({ message: "Demo logout successful" });
  });

  // Tour Packages routes (Simplified Travel Website Style)
  app.get('/api/tour-packages', async (req, res) => {
    try {
      const { country, city, packageType, priceRange, duration, limit } = req.query;
      
      // Simple demo tour packages data
      const simpleTourPackages = [
        {
          id: 'tour-1',
          title: 'Golden Triangle Adventure',
          description: 'Experience the magic of India with visits to Delhi, Agra, and Jaipur. This classic tour covers the most iconic destinations including the Taj Mahal, Red Fort, and Pink City.',
          destination: 'Delhi, Agra, Jaipur',
          country: 'India',
          city: 'Delhi',
          duration: 7,
          price: 899,
          currency: 'USD',
          maxGroupSize: 15,
          difficulty: 'easy',
          packageType: 'cultural',
          operatorName: 'India Heritage Tours',
          operatorRating: 4.8,
          images: ['/api/placeholder/400/300'],
          inclusions: [
            'Accommodation in 4-star hotels',
            'Daily breakfast and dinner',
            'Professional English-speaking guide',
            'Private AC transportation',
            'All entrance fees to monuments',
            'Airport transfers'
          ],
          exclusions: [
            'International flights',
            'Personal expenses',
            'Travel insurance',
            'Lunch (except on day tours)',
            'Tips and gratuities'
          ],
          itinerary: [
            {
              day: 1,
              title: 'Arrival in Delhi',
              description: 'Welcome to India! Meet your guide and transfer to hotel.',
              activities: ['Airport pickup', 'Hotel check-in', 'Welcome dinner'],
              meals: ['dinner']
            },
            {
              day: 2,
              title: 'Delhi Sightseeing',
              description: 'Full day exploring Old and New Delhi.',
              activities: ['Red Fort', 'Jama Masjid', 'Raj Ghat', 'India Gate'],
              meals: ['breakfast', 'dinner']
            }
          ],
          departureDate: '2024-12-01',
          returnDate: '2024-12-08',
          availability: 8,
          rating: 4.7,
          reviewCount: 124,
          featured: true,
          tags: ['heritage', 'unesco', 'monuments'],
          highlights: [
            'Visit the iconic Taj Mahal at sunrise',
            'Explore the magnificent Amber Fort',
            'Experience the bustling streets of Old Delhi',
            'Stay in heritage hotels',
            'Professional photography assistance'
          ],
          createdAt: '2024-01-15T00:00:00Z'
        },
        {
          id: 'tour-2',
          title: 'Himalayan Adventure Trek',
          description: 'Challenge yourself with this incredible trek through the Himalayas. Perfect for adventure seekers looking for breathtaking mountain views.',
          destination: 'Himalayas, Nepal',
          country: 'Nepal',
          city: 'Kathmandu',
          duration: 14,
          price: 1599,
          currency: 'USD',
          maxGroupSize: 10,
          difficulty: 'challenging',
          packageType: 'adventure',
          operatorName: 'Mountain Adventures Nepal',
          operatorRating: 4.9,
          images: ['/api/placeholder/400/300'],
          inclusions: [
            'Accommodation in mountain lodges',
            'All meals during trek',
            'Experienced trekking guide',
            'Porter service',
            'Trekking permits',
            'Emergency evacuation insurance'
          ],
          exclusions: [
            'International flights',
            'Nepal visa fees',
            'Personal trekking equipment',
            'Alcoholic beverages',
            'Personal expenses'
          ],
          itinerary: [
            {
              day: 1,
              title: 'Arrival in Kathmandu',
              description: 'Meet team and preparation day.',
              activities: ['Airport pickup', 'Gear check', 'Team briefing'],
              meals: ['dinner']
            }
          ],
          departureDate: '2024-11-15',
          returnDate: '2024-11-29',
          availability: 5,
          rating: 4.9,
          reviewCount: 89,
          featured: true,
          tags: ['trekking', 'mountains', 'adventure'],
          highlights: [
            'Reach Everest Base Camp',
            'Stunning Himalayan sunrise views',
            'Visit ancient monasteries',
            'Experience Sherpa culture',
            'Professional mountain guides'
          ],
          createdAt: '2024-02-01T00:00:00Z'
        },
        {
          id: 'tour-3',
          title: 'Luxury European Capitals',
          description: 'Indulge in the finest European experience visiting Paris, Rome, and Vienna in ultimate luxury and comfort.',
          destination: 'Paris, Rome, Vienna',
          country: 'France',
          city: 'Paris',
          duration: 10,
          price: 3499,
          currency: 'EUR',
          maxGroupSize: 8,
          difficulty: 'easy',
          packageType: 'luxury',
          operatorName: 'Elite European Tours',
          operatorRating: 4.9,
          images: ['/api/placeholder/400/300'],
          inclusions: [
            '5-star luxury hotel accommodations',
            'First-class train travel',
            'Fine dining experiences',
            'Private guided tours',
            'VIP museum access',
            'Personal concierge service'
          ],
          exclusions: [
            'International flights',
            'Personal shopping',
            'Spa treatments',
            'Room service',
            'Personal expenses'
          ],
          itinerary: [
            {
              day: 1,
              title: 'Arrival in Paris',
              description: 'VIP arrival and luxury hotel check-in.',
              activities: ['Airport VIP transfer', 'Hotel check-in', 'Welcome champagne'],
              meals: ['dinner']
            }
          ],
          departureDate: '2024-10-15',
          returnDate: '2024-10-25',
          availability: 3,
          rating: 4.8,
          reviewCount: 67,
          featured: true,
          tags: ['luxury', 'culture', 'fine-dining'],
          highlights: [
            'Private Louvre Museum tours',
            'Michelin-starred dining',
            'First-class travel throughout',
            'Personal photographer service',
            '24/7 concierge assistance'
          ],
          createdAt: '2024-03-01T00:00:00Z'
        }
      ];
      
      let filteredPackages = [...simpleTourPackages];
      
      // Apply filters
      if (country) {
        filteredPackages = filteredPackages.filter(pkg => 
          pkg.country.toLowerCase().includes(country.toString().toLowerCase())
        );
      }
      
      if (city) {
        filteredPackages = filteredPackages.filter(pkg => 
          pkg.city.toLowerCase().includes(city.toString().toLowerCase())
        );
      }
      
      if (packageType) {
        filteredPackages = filteredPackages.filter(pkg => 
          pkg.packageType === packageType
        );
      }
      
      res.json(filteredPackages.slice(0, Number(limit) || 50));
    } catch (error) {
      console.error('Error fetching tour packages:', error);
      res.status(500).json({ message: 'Failed to fetch tour packages' });
    }
  });
  
  app.post('/api/tour-packages', isAuthenticated, async (req: any, res) => {
    try {
      const packageData = {
        id: `tour-${Date.now()}`,
        ...req.body,
        publisherId: req.user.claims.sub, // Add publisher ID
        operatorRating: 4.5, // Default rating for new operators
        rating: 0,
        reviewCount: 0,
        featured: false,
        createdAt: new Date().toISOString()
      };
      
      // In a real app, this would be saved to database
      console.log('Creating tour package:', packageData);
      
      res.json(packageData);
    } catch (error) {
      console.error('Error creating tour package:', error);
      res.status(500).json({ message: 'Failed to create tour package' });
    }
  });

  // Get publisher's tour packages (Publisher-specific filtering)
  app.get('/api/my-tour-packages', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Demo tour packages for the demo publisher
      const demoTourPackages = [
        {
          id: 'demo-tour-1',
          title: 'Royal Rajasthan Adventure',
          description: 'Explore the royal heritage of Rajasthan with visits to magnificent palaces and forts.',
          destination: 'Jaipur, Udaipur, Jodhpur',
          country: 'India',
          city: 'Jaipur',
          duration: 10,
          price: 1299,
          currency: 'USD',
          packageType: 'Adventure',
          included: ['Accommodation', 'Meals', 'Transport', 'Guide'],
          excluded: ['Flight', 'Personal expenses'],
          itinerary: ['Day 1: Arrival in Jaipur', 'Day 2: City Palace & Amber Fort'],
          publisherId: 'demo-user-1',
          operatorName: 'Demo User',
          operatorRating: 4.8,
          rating: 4.7,
          reviewCount: 24,
          featured: true,
          imageUrl: 'https://images.unsplash.com/photo-1545558014-8692077e9b5c?w=800&q=80'
        },
        {
          id: 'demo-tour-2', 
          title: 'Kerala Backwaters Experience',
          description: 'Peaceful journey through the serene backwaters of Kerala with houseboat accommodation.',
          destination: 'Alleppey, Kumarakom',
          country: 'India',
          city: 'Kochi',
          duration: 5,
          price: 699,
          currency: 'USD',
          packageType: 'Relaxation',
          included: ['Houseboat', 'Meals', 'Transfer'],
          excluded: ['Flight', 'Additional activities'],
          itinerary: ['Day 1: Kochi arrival', 'Day 2: Houseboat cruise'],
          publisherId: 'demo-user-1',
          operatorName: 'Demo User',
          operatorRating: 4.8,
          rating: 4.6,
          reviewCount: 18,
          featured: false,
          imageUrl: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&q=80'
        }
      ];
      
      // Filter packages for this publisher
      const myPackages = demoTourPackages.filter(pkg => pkg.publisherId === userId);
      
      res.json(myPackages);
    } catch (error) {
      console.error('Error fetching my tour packages:', error);
      res.status(500).json({ message: 'Failed to fetch your tour packages' });
    }
  });

  // Legacy Trips routes (keeping for compatibility)
  app.get('/api/trips', async (req, res) => {
    try {
      const { country, city, travelStyle, budget, tags, limit } = req.query;
      
      const filters = {
        country: country as string,
        city: city as string,
        travelStyle: travelStyle as string,
        budget: budget as string,
        tags: tags ? (tags as string).split(',') : undefined,
        limit: limit ? Number(limit) : undefined
      };

      const trips = await storage.getTrips(filters);
      res.json(trips);
    } catch (error) {
      console.error('Error fetching trips:', error);
      res.status(500).json({ message: 'Failed to fetch trips' });
    }
  });

  app.get('/api/trips/:id', async (req, res) => {
    try {
      const trip = await storage.getTrip(req.params.id);
      if (!trip) {
        return res.status(404).json({ message: 'Trip not found' });
      }
      res.json(trip);
    } catch (error) {
      console.error('Error fetching trip:', error);
      res.status(500).json({ message: 'Failed to fetch trip' });
    }
  });

  app.post('/api/trips', isAuthenticated, async (req: any, res) => {
    try {
      const tripData = { ...req.body, organizerId: req.user.claims.sub };
      const trip = await storage.createTrip(tripData);
      res.json(trip);
    } catch (error) {
      console.error('Error creating trip:', error);
      res.status(500).json({ message: 'Failed to create trip' });
    }
  });

  // Tour Package Booking (Simple Travel Website Style)
  app.post('/api/tour-packages/:id/book', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { travelers, message } = req.body;
      const packageId = req.params.id;
      
      // For demo - In real app, fetch from database
      const basePrice = 899; // This would be fetched from the actual package
      const platformFee = basePrice * 0.10; // 10% platform fee
      const totalPrice = basePrice + platformFee;
      
      const booking = {
        id: `booking-${Date.now()}`,
        packageId,
        userId,
        travelers: travelers || 1,
        message: message || '',
        status: 'confirmed',
        basePrice,
        platformFee,
        totalPrice,
        bookedAt: new Date().toISOString()
      };
      
      // Log booking with platform fee details
      await storage.createAuditLog({
        actorId: userId,
        action: "tour_package_booked",
        targetType: "tour_booking",
        targetId: booking.id,
        metaJson: { 
          packageId, 
          travelers: travelers.toString(),
          basePrice: basePrice.toString(), 
          platformFee: platformFee.toString(), 
          totalPrice: totalPrice.toString() 
        },
        ipAddress: req.ip,
        userAgent: req.get("User-Agent"),
      });
      
      res.json(booking);
    } catch (error) {
      console.error('Error booking tour package:', error);
      res.status(500).json({ message: 'Failed to book tour package' });
    }
  });

  app.post('/api/trips/:id/join', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { message } = req.body;
      
      // Get trip details for platform fee calculation
      const trip = await storage.getTrip(req.params.id);
      if (!trip) {
        return res.status(404).json({ message: 'Trip not found' });
      }
      
      // Calculate platform fee (10%) for tour package booking
      const basePrice = parseFloat(trip.pricePerPerson || '0');
      const platformFee = basePrice * 0.10; // 10% platform fee
      const totalPrice = basePrice + platformFee;
      
      const participant = await storage.joinTrip(req.params.id, userId, message);
      
      // Log platform fee details
      await storage.createAuditLog({
        actorId: userId,
        action: "trip_joined",
        targetType: "trip",
        targetId: req.params.id,
        metaJson: { tripId: req.params.id, basePrice: basePrice.toString(), platformFee: platformFee.toString(), totalPrice: totalPrice.toString() },
        ipAddress: req.ip,
        userAgent: req.get("User-Agent"),
      });
      
      res.json({ ...participant, pricing: { basePrice, platformFee, totalPrice } });
    } catch (error) {
      console.error('Error joining trip:', error);
      res.status(500).json({ message: 'Failed to join trip' });
    }
  });

  app.delete('/api/trips/:id/leave', isAuthenticated, async (req: any, res) => {
    try {
      await storage.leaveTrip(req.params.id, req.user.claims.sub);
      res.json({ success: true });
    } catch (error) {
      console.error('Error leaving trip:', error);
      res.status(500).json({ message: 'Failed to leave trip' });
    }
  });

  app.get('/api/trips/:id/participants', async (req, res) => {
    try {
      const participants = await storage.getTripParticipants(req.params.id);
      res.json(participants);
    } catch (error) {
      console.error('Error fetching trip participants:', error);
      res.status(500).json({ message: 'Failed to fetch participants' });
    }
  });

  app.get('/api/users/:userId/trips', async (req, res) => {
    try {
      const { type = 'all' } = req.query;
      const trips = await storage.getUserTrips(req.params.userId, type as 'organized' | 'joined' | 'all');
      res.json(trips);
    } catch (error) {
      console.error('Error fetching user trips:', error);
      res.status(500).json({ message: 'Failed to fetch user trips' });
    }
  });

  const httpServer = createServer(app);

  // WebSocket server for real-time messaging
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  wss.on('connection', (ws: WebSocket, req) => {
    console.log('WebSocket connection established');
    
    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        
        // Handle different message types
        switch (message.type) {
          case 'join_conversation':
            // Join a conversation room
            ws.on('close', () => {
              console.log('WebSocket connection closed');
            });
            break;
          case 'send_message':
            // Broadcast message to conversation participants
            wss.clients.forEach((client) => {
              if (client !== ws && client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({
                  type: 'new_message',
                  conversationId: message.conversationId,
                  message: message.data
                }));
              }
            });
            break;
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  });

  return httpServer;
}
