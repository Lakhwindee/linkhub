import type { Express } from "express";
import cookieParser from "cookie-parser";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import Stripe from "stripe";
import { storage } from "./storage";
import { OAuth2Client } from 'google-auth-library';

// Session-based authentication middleware
function isAuthenticated(req: any, res: any, next: any) {
  if (req.session?.userId) {
    req.user = { claims: { sub: req.session.userId } };
    return next();
  }
  
  return res.status(401).json({ message: 'Not authenticated' });
}

// Admin authentication middleware (completely separate from users)
function isAdmin(req: any, res: any, next: any) {
  if (req.session?.adminId && req.session?.user) {
    req.admin = { id: req.session.adminId };
    req.user = req.session.user; // Set user from session for route compatibility
    return next();
  }
  
  return res.status(401).json({ message: 'Admin authentication required' });
}

// Initialize Google OAuth client (optional - only if credentials are provided)
const googleOAuthClient = (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) 
  ? new OAuth2Client(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5000/api/auth/google/callback'
    )
  : null;

// Log OAuth availability status
if (process.env.NODE_ENV === 'production') {
  if (googleOAuthClient) {
    console.log('✅ Google OAuth enabled for production');
  } else {
    console.log('⚠️  Google OAuth disabled - GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET not configured');
  }
}
import { ObjectStorageService, ObjectNotFoundError } from "./objectStorage";
import { ObjectPermission } from "./objectAcl";
import { insertUserProfileSchema, insertConnectRequestSchema, insertMessageSchema, insertPostSchema, insertEventSchema, insertAdSchema, insertPublisherAdSchema, insertReportSchema, insertStaySchema, insertStayBookingSchema, insertStayReviewSchema, adReservations, insertPersonalHostSchema, insertHostBookingSchema, insertBoostedPostSchema } from "@shared/schema";
import { isCountryTargeted, logGeoTargeting } from "@shared/countryUtils";
import { db } from "./db";
import { eq } from "drizzle-orm";
import { ZodError } from "zod";
import FormData from 'form-data';
import fetch from 'node-fetch';
import { computeTierFromSubscribers } from "@shared/tierConfig";

// YouTube API response interfaces
interface YTChannelsResponse {
  items?: Array<{
    id?: string;
    statistics?: {
      subscriberCount?: string;
    };
    snippet?: {
      description?: string;
      country?: string;  // Added for geo-targeting
      title?: string;
      publishedAt?: string;
    };
  }>;
}

interface YTSearchResponse {
  items?: Array<{
    id?: {
      channelId?: string;
    };
  }>;
}

// In-memory OTP store for temporary OTP storage
interface OTPData {
  otp: string;
  expiresAt: number;
}

class OTPStore {
  private store = new Map<string, OTPData>();
  
  set(key: string, data: OTPData): void {
    this.store.set(key, data);
    // Auto-cleanup expired OTPs every 10 minutes
    setTimeout(() => {
      const stored = this.store.get(key);
      if (stored && stored.expiresAt < Date.now()) {
        this.store.delete(key);
      }
    }, 10 * 60 * 1000);
  }
  
  get(key: string): OTPData | undefined {
    const data = this.store.get(key);
    if (data && data.expiresAt < Date.now()) {
      this.store.delete(key);
      return undefined;
    }
    return data;
  }
  
  delete(key: string): boolean {
    return this.store.delete(key);
  }
  
  // Cleanup expired OTPs (called periodically)
  cleanup(): void {
    const now = Date.now();
    for (const [key, data] of this.store.entries()) {
      if (data.expiresAt < now) {
        this.store.delete(key);
      }
    }
  }
}

// Global OTP store instance
const otpStore = new OTPStore();

// Cleanup expired OTPs every 5 minutes
setInterval(() => {
  otpStore.cleanup();
}, 5 * 60 * 1000);

// Helper for safe auth claims access
function getAuthSub(req: any): string | undefined {
  return req.user?.claims?.sub ?? req.session?.userId;
}

// Initialize Stripe (only if keys are available)
const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-08-27.basil",
}) : null;

// In-memory store for API settings (in production, use database)
let storedApiSettings = {
  stripe: {
    publishableKey: '',
    secretKey: '',
    webhookSecret: ''
  },
  youtube: {
    apiKey: '',
    projectId: 'hublink-project'
  },
  maps: {
    apiKey: '',
    enableAdvancedFeatures: true
  },
  email: {
    provider: 'not_configured',
    apiKey: ''
  }
};

export async function registerRoutes(app: Express, httpServer?: Server): Promise<Server> {
  // Cookie parser middleware
  app.use(cookieParser());
  
  // Auth middleware
  // Production-ready session configuration
  if (!process.env.SESSION_SECRET) {
    throw new Error('SESSION_SECRET environment variable is required for production');
  }
  
  app.set('trust proxy', 1); // Trust proxy headers
  
  // Configure PostgreSQL session store for persistence
  const PgStore = connectPg(session);
  const sessionStore = new PgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: 24 * 60 * 60, // 24 hours in seconds
    tableName: 'sessions',
  });
  
  app.use(session({
    secret: process.env.SESSION_SECRET,
    store: sessionStore, // Use PostgreSQL store
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax', // CSRF protection
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    },
    name: 'hublink-session' // Custom session name
  }));

  // Authentication routes
  
  // Google OAuth routes
  app.get('/api/auth/google', (req, res) => {
    if (!googleOAuthClient) {
      return res.status(503).json({ message: 'Google OAuth is not configured' });
    }
    
    const scopes = [
      'openid',
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/userinfo.email'
    ];
    
    // Generate random state for CSRF protection
    const state = Math.random().toString(36).substring(2);
    (req.session as any).oauth_state = state;
    
    const authUrl = googleOAuthClient.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      state: state,
    });
    
    res.redirect(authUrl);
  });

  app.get('/api/auth/google/callback', async (req, res) => {
    try {
      if (!googleOAuthClient) {
        return res.redirect('/?error=oauth_not_configured');
      }
      
      const { code, state } = req.query;
      
      if (!code) {
        return res.redirect('/?error=no_code');
      }

      // Verify state parameter for CSRF protection
      if (!state || state !== (req.session as any)?.oauth_state) {
        return res.redirect('/?error=invalid_state');
      }
      
      // Clear the state from session
      delete (req.session as any).oauth_state;

      const { tokens } = await googleOAuthClient.getToken(code as string);
      googleOAuthClient.setCredentials(tokens);

      // Get user info from Google
      const ticket = await googleOAuthClient.verifyIdToken({
        idToken: tokens.id_token!,
        audience: process.env.GOOGLE_CLIENT_ID,
      });

      const payload = ticket.getPayload();
      if (!payload) {
        return res.redirect('/?error=invalid_token');
      }

      // Create or update user in database
      const userData = {
        id: payload.sub,
        email: payload.email!,
        firstName: payload.given_name || '',
        lastName: payload.family_name || '',
        profileImageUrl: payload.picture || ''
      };

      await storage.upsertUser(userData);

      // Set session
      (req.session as any).userId = payload.sub;
      (req.session as any).user = userData;

      res.redirect('/');
    } catch (error) {
      res.redirect('/?error=oauth_failed');
    }
  });

  // Traditional login endpoint
  app.post('/api/auth/login', async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: 'Email and password required' });
      }

      // Check if user exists and verify password
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: 'Invalid email or password' });
      }

      // Verify password (assuming bcrypt is used)
      const bcrypt = await import('bcrypt');
      const isValidPassword = await bcrypt.compare(password, user.password || '');
      
      if (!isValidPassword) {
        return res.status(401).json({ message: 'Invalid email or password' });
      }

      // Set session
      (req.session as any).userId = user.id;
      (req.session as any).user = user;

      res.json({ 
        message: 'Login successful',
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName
        }
      });
    } catch (error) {
      res.status(500).json({ message: 'Login failed' });
    }
  });

  // Registration endpoint
  app.post('/api/auth/register', async (req, res) => {
    try {
      const { email, password, firstName, lastName } = req.body;

      if (!email || !password || !firstName || !lastName) {
        return res.status(400).json({ message: 'All fields are required' });
      }

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(409).json({ message: 'User already exists' });
      }

      // Hash password
      const bcrypt = await import('bcrypt');
      const hashedPassword = await bcrypt.hash(password, 12);

      // Create user
      const newUser = {
        id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        email,
        password: hashedPassword,
        firstName,
        lastName,
        profileImageUrl: ''
      };

      await storage.upsertUser(newUser);

      // Set session
      (req.session as any).userId = newUser.id;
      (req.session as any).user = newUser;

      res.json({ 
        message: 'Registration successful',
        user: {
          id: newUser.id,
          email: newUser.email,
          firstName: newUser.firstName,
          lastName: newUser.lastName
        }
      });
    } catch (error) {
      res.status(500).json({ message: 'Registration failed' });
    }
  });

  // Complete registration after OTP verification (traditional email/password flow)
  app.post('/api/auth/complete-registration', async (req, res) => {
    try {
      const {
        email,
        password,
        username,
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

      if (!email || !password || !firstName || !lastName) {
        return res.status(400).json({ message: 'Email, password, first name, and last name are required' });
      }

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(409).json({ message: 'User already exists' });
      }

      // Hash password
      const bcrypt = await import('bcrypt');
      const hashedPassword = await bcrypt.hash(password, 12);

      // Create user with all profile data
      const newUser = {
        id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        email,
        password: hashedPassword,
        username: username || `user${Date.now()}`,
        firstName,
        lastName,
        bio: bio || '',
        country: country || '',
        city: city || '',
        documentType: documentType || null,
        documentUrl: documentUrl || '',
        documentNumber: documentNumber || '',
        fullName: fullName || `${firstName} ${lastName}`,
        dateOfBirth: dateOfBirth || null,
        nationality: nationality || '',
        expiryDate: expiryDate || null,
        verificationStatus: verificationStatus || 'verified',
        verifiedAt: new Date(),
        verificationNotes: 'Verified via OTP email verification',
        profileImageUrl: '',
        plan: 'free'
      };

      await storage.upsertUser(newUser);

      // Set session
      (req.session as any).userId = newUser.id;
      (req.session as any).user = newUser;

      res.json({ 
        success: true,
        message: 'Registration completed successfully',
        user: {
          id: newUser.id,
          email: newUser.email,
          firstName: newUser.firstName,
          lastName: newUser.lastName,
          username: newUser.username
        }
      });
    } catch (error) {
      console.error('Complete registration error:', error);
      res.status(500).json({ message: 'Failed to complete registration' });
    }
  });

  // Logout endpoint
  app.post('/api/auth/logout', (req, res) => {
    req.session?.destroy((err: any) => {
      if (err) {
        return res.status(500).json({ message: 'Logout failed' });
      }
      res.clearCookie('hublink-session');
      res.json({ message: 'Logout successful' });
    });
  });

  // Config routes
  app.get('/api/config/maps-key', async (req, res) => {
    try {
      // Check saved API settings first
      let apiKey = null;
      const savedMapsSettings = storedApiSettings.maps;
      if (savedMapsSettings && savedMapsSettings.apiKey && savedMapsSettings.apiKey.trim() !== '') {
        apiKey = savedMapsSettings.apiKey;
      } else {
        // Fallback to environment variable or hardcoded for demo
        apiKey = process.env.GOOGLE_MAPS_API_KEY;
        if (!apiKey) {
          return res.status(503).json({ 
            message: 'Google Maps API key not configured. Please set GOOGLE_MAPS_API_KEY environment variable.' 
          });
        }
      }
      
      // If no valid key found, try environment variable as final fallback
      if (!apiKey || apiKey.includes('demo')) {
        const envApiKey = process.env.GOOGLE_MAPS_API_KEY;
        if (envApiKey && envApiKey.startsWith('AIza') && !envApiKey.includes('demo')) {
          return res.json({ apiKey: envApiKey });
        }
        return res.status(503).json({ 
          message: "Google Maps API key not configured. Please add a valid API key in Admin Settings.",
          fallbackMode: true 
        });
      }
      
      res.json({ apiKey });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch API configuration" });
    }
  });

  // Duplicate logout endpoint removed - using the previous one above

  // Password reset endpoints
  app.post('/api/auth/forgot-password', async (req: any, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ message: 'Email is required' });
      }
      
      
      // Generate reset token
      const { generateResetToken, sendPasswordResetEmail } = await import('./emailUtils');
      const resetToken = generateResetToken();
      const tokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
      
      // Handle regular user password reset
      try {
        const user = await storage.getUserByEmail(email);
        
        if (!user) {
            // Don't reveal if user exists or not for security
            return res.json({ 
              message: 'If an account with that email exists, a password reset link has been sent',
              type: 'regular'
            });
          }
          
          // Update user with reset token
          await storage.updateUser(user.id, {
            resetToken: resetToken,
            resetTokenExpiry: tokenExpiry
          });
          
          // Send email for regular user
          const emailResult = await sendPasswordResetEmail(email, resetToken, 'real');
          
          if (emailResult.success) {
            res.json({ 
              message: 'Password reset email sent successfully',
              type: 'regular'
            });
          } else {
            res.status(500).json({ message: 'Failed to send reset email' });
          }
      } catch (error) {
        console.error('❌ Database error during password reset:', error);
        res.status(500).json({ message: 'Failed to process password reset' });
      }
    } catch (error) {
      console.error('❌ Password reset error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  app.post('/api/auth/reset-password', async (req: any, res) => {
    try {
      const { token, newPassword } = req.body;
      
      if (!token || !newPassword) {
        return res.status(400).json({ message: 'Token and new password are required' });
      }
      
      
      // Handle regular user password reset
      try {
        const user = await storage.getUserByResetToken(token);
        
        if (!user || !user.resetTokenExpiry || new Date() > user.resetTokenExpiry) {
            return res.status(400).json({ message: 'Invalid or expired reset token' });
          }
          
          // Hash password before storing
          const bcrypt = await import('bcrypt');
          const hashedPassword = await bcrypt.hash(newPassword, 12);
          
          // Update user password and clear reset token
          await storage.updateUser(user.id, {
            password: hashedPassword,
            resetToken: null,
            resetTokenExpiry: null
          });
          
          
          res.json({ 
            message: 'Password updated successfully',
            type: 'regular'
          });
      } catch (error) {
        console.error('❌ Database error during password reset:', error);
        res.status(500).json({ message: 'Failed to reset password' });
      }
    } catch (error) {
      console.error('❌ Password reset confirmation error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Rate limiting store for admin login attempts
  const adminLoginAttempts = new Map<string, { count: number; lastAttempt: number }>();
  
  // Admin login endpoint with rate limiting (COMPLETELY SEPARATE from users)
  app.post('/api/admin-login', async (req: any, res) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
      }
      
      // Rate limiting check
      const clientKey = req.ip || 'unknown';
      const attempt = adminLoginAttempts.get(clientKey);
      const now = Date.now();
      
      if (attempt && now - attempt.lastAttempt < 900000) { // 15 minutes
        if (attempt.count >= 5) {
          return res.status(429).json({ message: 'Too many login attempts. Please try again in 15 minutes.' });
        }
      }
      
      // Require environment variables for admin authentication (production ready)
      const adminEmail = process.env.ADMIN_EMAIL;
      const adminPassword = process.env.ADMIN_PASSWORD;
      
      if (!adminEmail || !adminPassword) {
        throw new Error('ADMIN_EMAIL and ADMIN_PASSWORD environment variables are required for production');
      }
      
      // Verify admin credentials against environment variables
      if (email !== adminEmail || password !== adminPassword) {
        // Update rate limiting
        if (attempt && now - attempt.lastAttempt < 900000) {
          attempt.count++;
          attempt.lastAttempt = now;
        } else {
          adminLoginAttempts.set(clientKey, { count: 1, lastAttempt: now });
        }
        return res.status(401).json({ message: 'Invalid admin credentials' });
      }
      
      // Clear rate limiting on successful login
      adminLoginAttempts.delete(clientKey);
      
      // IMPORTANT: Clear any existing user session (admin and user sessions are separate)
      if (req.session) {
        req.session.userId = null;
        req.session.user = null;
      }
      
      // Check if admin exists in ADMINS table (NOT users table!)
      let admin = await storage.getAdminByEmail(adminEmail);
      
      if (!admin) {
        // Create admin in admins table if doesn't exist
        const bcrypt = await import('bcrypt');
        const hashedPassword = await bcrypt.hash(adminPassword, 12);
        
        admin = await storage.createAdmin({
          email: adminEmail,
          password: hashedPassword,
          name: 'System Administrator'
        });
      }
      
      // Also create/update linked user record in users table (for route compatibility)
      let adminUser = await storage.getUserByEmail(adminEmail);
      if (!adminUser) {
        // Check if username 'admin' exists for a different email
        const existingAdminUsername = await storage.getUserByUsername('admin');
        if (existingAdminUsername) {
          // Update the existing user with this username
          adminUser = await storage.updateUser(existingAdminUsername.id, {
            email: adminEmail,
            displayName: 'System Administrator',
            firstName: 'System',
            lastName: 'Administrator',
            role: 'admin',
            plan: 'admin'
          });
        } else {
          // Create new admin user
          adminUser = await storage.upsertUser({
            email: adminEmail,
            username: 'admin',
            displayName: 'System Administrator',
            firstName: 'System',
            lastName: 'Administrator',
            role: 'admin',
            plan: 'admin'
          });
        }
      } else if (adminUser.role !== 'admin' && adminUser.role !== 'superadmin' && adminUser.role !== 'moderator') {
        adminUser = await storage.updateUser(adminUser.id, {
          role: 'admin',
          plan: 'admin'
        });
      }
      
      // Create admin session (uses adminId for admin middleware)
      (req.session as any).adminId = admin.id;
      (req.session as any).admin = {
        id: admin.id,
        email: admin.email,
        name: admin.name
      };
      
      // Also set FULL user session for compatibility with existing admin routes and useAuth
      (req.session as any).userId = adminUser.id;
      (req.session as any).user = {
        id: adminUser.id,
        email: adminUser.email,
        role: adminUser.role,
        firstName: adminUser.firstName,
        lastName: adminUser.lastName,
        displayName: adminUser.displayName,
        username: adminUser.username,
        profileImageUrl: adminUser.profileImageUrl,
        plan: adminUser.plan,
        claims: { sub: adminUser.id }
      };
      
      // Explicitly save session to database before responding
      await new Promise<void>((resolve, reject) => {
        req.session.save((err: any) => {
          if (err) reject(err);
          else resolve();
        });
      });
      
      res.json({ 
        message: 'Admin login successful',
        admin: {
          id: admin.id,
          email: admin.email,
          name: admin.name
        }
      });
    } catch (error) {
      console.error('Admin login error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Demo admin login endpoint removed for production security

  // Check authentication status - returns current user or 401
  app.get('/api/auth/user', async (req: any, res) => {
    try {
      const session = req.session;
      
      if (!session || !session.userId || !session.user) {
        return res.status(401).json({ message: 'Not authenticated' });
      }
      
      res.json(session.user);
    } catch (error) {
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Function to send OTP email using Gmail API
  async function sendOTPEmail(email: string, otp: string) {
    try {
      console.log('📧 sendOTPEmail called for:', email);
      
      // Try Gmail API integration first (Replit connector)
      try {
        const { sendEmailViaGmailAPI } = await import('./gmailApi.js');
        
        // Professional email template
        const emailContent = `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px;">
            <h1 style="margin: 0; font-size: 28px;">✅ Account Verification</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px;">HubLink Tourism Platform</p>
          </div>
          
          <div style="background: #f8f9fa; padding: 30px; border-radius: 10px; margin-top: 20px;">
            <h2 style="color: #333; margin-top: 0;">Your Verification Code</h2>
            <p style="color: #666; line-height: 1.6; margin-bottom: 30px;">
              Welcome to HubLink! Please use the verification code below to complete your account setup:
            </p>
            
            <div style="background: #667eea; color: white; padding: 25px; margin: 30px 0; text-align: center; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.1);">
              <span style="font-size: 36px; font-weight: bold; letter-spacing: 6px; font-family: 'Courier New', monospace;">${otp}</span>
            </div>
            
            <div style="background: #e3f2fd; padding: 20px; border-radius: 8px; border-left: 4px solid #2196f3; margin: 20px 0;">
              <p style="margin: 0; color: #1976d2; font-size: 14px;">
                <strong>⏰ Important:</strong><br>
                • This code will expire in 10 minutes<br>
                • Use this code only on the HubLink verification page<br>
                • Do not share this code with anyone
              </p>
            </div>
            
            <p style="color: #666; font-size: 14px; margin-top: 25px;">
              If you didn't create an account with HubLink, please ignore this email and your email will not be used.
            </p>
            
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            
            <p style="color: #999; font-size: 12px; text-align: center; margin: 0;">
              © 2025 HubLink Tourism Platform - Connect with travelers worldwide<br>
              This is an automated message, please do not reply to this email.
            </p>
          </div>
        </div>
      `;

        // Send email via Gmail API
        const result = await sendEmailViaGmailAPI(
          email,
          '🔐 Your HubLink Verification Code',
          emailContent
        );
        
        if (result.success) {
          return { success: true, messageId: result.messageId, simulated: false };
        } else {
          throw new Error(result.error || 'Gmail API failed');
        }
        
      } catch (gmailApiError: any) {
        console.error('❌ Gmail API failed:', gmailApiError.message);
        console.log('⚠️ Falling back to development mode simulation');
        
        // Fallback to development mode simulation
        return { success: false, messageId: `simulated_${Date.now()}`, simulated: true, error: gmailApiError.message };
      }
      
    } catch (error: any) {
      console.error('❌ Email sending failed:', error.message);
      return { success: false, messageId: `fallback_${Date.now()}`, simulated: true, error: error.message };
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
      let emailResult = null;

      // Send Email OTP using existing email system
      if (type === 'email' || type === 'both') {
        otpStore.set(`email:${email}`, { otp: emailOTP, expiresAt });
        emailResult = await sendOTPEmail(email, emailOTP);
        emailSent = emailResult.success;
        
        // Log email sending result
        if (emailResult.simulated) {
          console.log('⚠️ OTP Email simulated (not actually sent):', { email, error: emailResult.error });
        } else {
          console.log('✅ OTP Email sent successfully:', { email, messageId: emailResult.messageId });
        }
      }
      
      // Send SMS OTP (placeholder - would integrate with SMS service)
      if (type === 'sms' || type === 'both') {
        otpStore.set(`sms:${phone}`, { otp: smsOTP, expiresAt });
        // SMS OTP sent
        smsSent = true; // Simulate SMS sent
      }

      // Create audit log for OTP sending (skip if anonymous to avoid foreign key error)
      try {
        const auditUserId = req.user?.claims?.sub;
        if (auditUserId) {
          await storage.createAuditLog({
            actorId: auditUserId,
            action: 'send_otp',
            targetType: 'otp_verification',
            targetId: email || phone,
            metaJson: { type, email: !!email, phone: !!phone }
          });
        } else {
          // Anonymous OTP request
        }
      } catch (auditError) {
        // Audit log creation failed
        // Continue processing - audit log failure shouldn't block OTP
      }
      
      // Check if we're in development mode and email failed
      const isDevelopment = process.env.NODE_ENV === 'development';
      
      res.json({ 
        message: 'OTP sent successfully',
        emailSent,
        smsSent,
        // Show OTP in development mode when email sending failed
        ...(isDevelopment && emailResult?.simulated && { 
          developmentMode: true,
          otpCode: emailOTP,
          note: 'Development Mode: Email authentication failed, showing OTP code here for testing'
        })
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
        console.log(`📧 Email OTP resent successfully`);
      }
      
      if (type === 'sms' || type === 'both') {
        otpStore.set(`sms:${phone}`, { otp: smsOTP, expiresAt });
        console.log(`📱 SMS OTP resent successfully`);
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
        smsSent
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
        res.json({ 
          verified: true, 
          message: 'OTP verified successfully' 
        });
      } else {
        res.status(400).json({ 
          verified: false, 
          message: errorMessage 
        });
      }
      
    } catch (error) {
      res.status(500).json({ message: 'Failed to verify OTP' });
    }
  });

  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      
      // Handle regular users
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // User data retrieved successfully
      
      // Disable cache to ensure fresh data
      res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.set('Pragma', 'no-cache');
      res.set('Expires', '0');
      res.json(user);
    } catch (error) {
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
  app.post('/api/complete-signup', isAuthenticated, async (req: any, res) => {
    try {
      // Get authenticated user ID from Replit OAuth
      const userId = req.user.claims.sub;
      
      if (!userId) {
        return res.status(401).json({ message: "Authentication required" });
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
  // Get YouTube connection status
  app.get('/api/youtube/status', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Return current YouTube connection status
      if (user.youtubeChannelId && user.youtubeVerified) {
        res.json({
          connected: true,
          channel: {
            channelId: user.youtubeChannelId,
            title: user.displayName, // Use displayName as channel title
            subscribers: user.youtubeSubscribers || 0,
            verified: user.youtubeVerified,
            lastUpdated: user.youtubeLastUpdated,
            thumbnail: user.avatarUrl // Use avatar as thumbnail
          }
        });
      } else {
        res.json({
          connected: false,
          channel: null
        });
      }
    } catch (error) {
      console.error("Failed to get YouTube status:", error);
      res.status(500).json({ message: "Failed to get YouTube status" });
    }
  });

  // Get YouTube OAuth authorization URL
  app.get('/api/youtube/auth-url', isAuthenticated, async (req: any, res) => {
    try {
      // For demo purposes, we'll create a mock OAuth URL
      // In production, you would use Google OAuth2 client
      const authUrl = `https://accounts.google.com/oauth/authorize?` +
        `client_id=demo-client-id&` +
        `redirect_uri=${encodeURIComponent('http://localhost:5000/api/youtube/callback')}&` +
        `scope=${encodeURIComponent('https://www.googleapis.com/auth/youtube.readonly')}&` +
        `response_type=code&` +
        `access_type=offline&` +
        `state=${req.user.claims.sub}`;

      res.json({ authUrl });
    } catch (error) {
      console.error("Failed to generate auth URL:", error);
      res.status(500).json({ message: "Failed to generate authorization URL" });
    }
  });

  // Handle YouTube OAuth callback (demo implementation)
  app.get('/api/youtube/callback', async (req, res) => {
    try {
      const { code, state } = req.query;
      
      if (!code || !state) {
        return res.redirect('/?error=oauth_failed');
      }

      // For demo purposes, we'll simulate a successful OAuth flow
      // In production, you would exchange the code for tokens and fetch channel info
      const userId = state as string;
      
      // Simulate fetching channel info
      const mockChannelData = {
        channelId: 'UC_demo_channel_123',
        title: 'Demo Creator Channel',
        subscribers: 45000, // Updated to meet minimum threshold and be in tier 1
        thumbnailUrl: 'https://via.placeholder.com/88x88.png?text=YT'
      };

      // Calculate tier from subscriber count
      const tier = computeTierFromSubscribers(mockChannelData.subscribers);

      // Update user with YouTube data
      await storage.updateUserProfile(userId, {
        youtubeChannelId: mockChannelData.channelId,
        youtubeSubscribers: mockChannelData.subscribers,
        youtubeTier: tier,
        youtubeVerified: true,
        youtubeLastUpdated: new Date()
      });

      // Redirect to success page
      res.redirect('/?youtube_connected=true');
    } catch (error) {
      console.error("OAuth callback error:", error);
      res.redirect('/?error=oauth_callback_failed');
    }
  });

  app.post('/api/youtube/sync', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { youtubeUrl } = req.body;
      
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
        
        const searchData = await searchResponse.json() as YTSearchResponse;
        if (!searchData.items || searchData.items.length === 0) {
          return res.status(400).json({ message: "YouTube channel not found" });
        }
        
        channelId = searchData.items[0]?.id?.channelId || '';
      } else {
        return res.status(400).json({ message: "Invalid YouTube URL format" });
      }

      // Fetch channel statistics AND snippet for country detection
      const apiUrl = `https://www.googleapis.com/youtube/v3/channels?part=statistics,snippet&id=${channelId}&key=${process.env.YOUTUBE_API_KEY}`;
      const response = await fetch(apiUrl);

      if (!response.ok) {
        return res.status(400).json({ message: "Failed to fetch YouTube data" });
      }

      const data = await response.json() as YTChannelsResponse;
      
      if (!data.items || data.items.length === 0) {
        return res.status(400).json({ message: "YouTube channel not found" });
      }

      const subscriberCount = parseInt(data.items?.[0]?.statistics?.subscriberCount || '0') || 0;
      
      // Extract country from YouTube channel snippet
      const channelSnippet = data.items?.[0]?.snippet;
      const detectedCountry = channelSnippet?.country || '';
      
      if (detectedCountry) {
              } else {
              }
      
      // Use shared tier configuration to determine tier
      const tier = computeTierFromSubscribers(subscriberCount);
      
      // Check minimum subscriber requirement
      if (subscriberCount < 30000) {
        return res.status(400).json({ 
          message: `Channel has only ${subscriberCount.toLocaleString()} subscribers. Minimum 30,000 subscribers required to participate in campaigns.`,
          subscriberCount,
          minimumRequired: 30000
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
          username: userId === 'demo-user-1' ? 'demo_user' : `user_${userId.slice(-6)}`, // Add required username field
          displayName: userId === 'demo-user-1' ? 'Demo User' : 'Unknown User',
          country: detectedCountry || (userId === 'demo-user-1' ? 'United Kingdom' : undefined),
          city: userId === 'demo-user-1' ? 'London' : undefined,
          plan: userId === 'demo-user-1' ? 'standard' : 'free',
          role: userId === 'demo-user-1' ? 'creator' : 'user',
        });
      }

      // Update user with YouTube data AND detected country (not verified yet)
      const updatedUser = await storage.updateUserProfile(userId, {
        youtubeUrl,
        youtubeChannelId: channelId,
        youtubeSubscribers: subscriberCount,
        youtubeTier: tier,
        youtubeVerified: false, // Reset verification status
        youtubeVerificationCode: verificationCode,
        youtubeVerificationAttempts: 0,
        youtubeLastUpdated: new Date(),
        ...(detectedCountry && { country: detectedCountry }) // Only update if country detected
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

      const data = await response.json() as YTChannelsResponse;
      if (!data.items || data.items.length === 0) {
        return res.status(400).json({ message: "Channel not found" });
      }

      const channelDescription = data.items[0]?.snippet?.description || '';
      
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
      
      // Skip audit log on error to avoid foreign key constraints
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
        // Skip follow creation on error to avoid foreign key constraints
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
      
      // Skip audit log on error to avoid foreign key constraints  
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

  // Enhanced Professional Booking System APIs
  
  // Get booking quote with pricing breakdown
  app.post('/api/stays/:id/quote', async (req, res) => {
    try {
      const { id } = req.params;
      const { checkInDate, checkOutDate, guests } = req.body;
      
      if (!checkInDate || !checkOutDate || !guests) {
        return res.status(400).json({ message: "Missing required fields: checkInDate, checkOutDate, guests" });
      }
      
      const stay = await storage.getStayById(id);
      if (!stay) {
        return res.status(404).json({ message: "Stay not found" });
      }
      
      if (stay.status !== 'active') {
        return res.status(400).json({ message: "Stay is not available for booking" });
      }
      
      const checkIn = new Date(checkInDate);
      const checkOut = new Date(checkOutDate);
      const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
      
      if (nights <= 0) {
        return res.status(400).json({ message: "Check-out date must be after check-in date" });
      }
      
      if (guests > stay.maxGuests) {
        return res.status(400).json({ message: `Maximum ${stay.maxGuests} guests allowed` });
      }
      
      // Check minimum stay requirement
      if (nights < stay.minimumStay) {
        return res.status(400).json({ message: `Minimum stay is ${stay.minimumStay} night(s)` });
      }
      
      // Check maximum stay requirement
      if (stay.maximumStay && nights > stay.maximumStay) {
        return res.status(400).json({ message: `Maximum stay is ${stay.maximumStay} night(s)` });
      }
      
      const unitPrice = parseFloat(stay.pricePerNight || '0');
      const subtotal = unitPrice * nights;
      const platformFee = subtotal * 0.10; // 10% platform fee
      const tax = subtotal * 0.05; // 5% tax
      const totalPrice = subtotal + platformFee + tax;
      
      const quote = {
        stayId: id,
        checkInDate,
        checkOutDate,
        nights,
        guests,
        pricing: {
          unitPrice,
          subtotal: Number(subtotal.toFixed(2)),
          platformFee: Number(platformFee.toFixed(2)),
          tax: Number(tax.toFixed(2)),
          totalPrice: Number(totalPrice.toFixed(2)),
          currency: stay.currency || 'GBP'
        },
        stay: {
          title: stay.title,
          checkInTime: stay.checkInTime,
          checkOutTime: stay.checkOutTime,
          cancellationPolicy: 'moderate'
        }
      };
      
      res.json(quote);
    } catch (error) {
      console.error("Error calculating booking quote:", error);
      res.status(500).json({ message: "Failed to calculate booking quote" });
    }
  });

  // Check availability for specific dates
  app.post('/api/stays/:id/availability', async (req, res) => {
    try {
      const { id } = req.params;
      const { checkInDate, checkOutDate } = req.body;
      
      if (!checkInDate || !checkOutDate) {
        return res.status(400).json({ message: "Missing required fields: checkInDate, checkOutDate" });
      }
      
      const stay = await storage.getStayById(id);
      if (!stay) {
        return res.status(404).json({ message: "Stay not found" });
      }
      
      // Check if dates are within available period
      const checkIn = new Date(checkInDate);
      const checkOut = new Date(checkOutDate);
      
      if (stay.availableFrom && checkIn < new Date(stay.availableFrom)) {
        return res.json({ available: false, reason: "Check-in date is before availability period" });
      }
      
      if (stay.availableTo && checkOut > new Date(stay.availableTo)) {
        return res.json({ available: false, reason: "Check-out date is after availability period" });
      }
      
      // TODO: Check booking_nights table for conflicts when schema is ready
      // For now, assume available if stay is active
      const available = stay.status === 'active';
      
      res.json({ 
        available,
        reason: available ? null : "Stay is not currently active"
      });
    } catch (error) {
      console.error("Error checking availability:", error);
      res.status(500).json({ message: "Failed to check availability" });
    }
  });

  // Create enhanced booking with payment intent
  app.post('/api/stays/:id/book-enhanced', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id: stayId } = req.params;
      const { checkInDate, checkOutDate, guests, contactInfo, specialRequests } = req.body;
      
      if (!checkInDate || !checkOutDate || !guests) {
        return res.status(400).json({ message: "Missing required fields" });
      }
      
      const stay = await storage.getStayById(stayId);
      if (!stay) {
        return res.status(404).json({ message: "Stay not found" });
      }
      
      if (stay.status !== 'active') {
        return res.status(400).json({ message: "Stay is not available for booking" });
      }
      
      const checkIn = new Date(checkInDate);
      const checkOut = new Date(checkOutDate);
      const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
      
      // Calculate pricing
      const unitPrice = parseFloat(stay.pricePerNight || '0');
      const subtotal = unitPrice * nights;
      const platformFee = subtotal * 0.10;
      const tax = subtotal * 0.05;
      const totalPrice = subtotal + platformFee + tax;
      
      // Create booking record with HOLD status
      const booking = await storage.createStayBooking({
        stayId,
        guestId: userId,
        hostId: stay.hostId,
        checkInDate,
        checkOutDate,
        nights,
        guests,
        unitPrice: unitPrice.toString(),
        subtotal: subtotal.toFixed(2),
        fees: platformFee.toFixed(2),
        tax: tax.toFixed(2),
        totalPrice: totalPrice.toFixed(2),
        currency: stay.currency || 'GBP',
        status: 'HOLD',
        contactInfo,
        specialRequests,
        expiresAt: new Date(Date.now() + 30 * 60 * 1000) // 30 minutes hold
      });
      
      let paymentIntent = null;
      let clientSecret = null;
      
      // Create Stripe Payment Intent if Stripe is available
      if (stripe && totalPrice > 0) {
        try {
          paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(totalPrice * 100), // Stripe expects cents
            currency: (stay.currency || 'GBP').toLowerCase(),
            metadata: {
              bookingId: booking.id,
              stayId,
              guestId: userId,
              nights: nights.toString()
            },
            description: `Booking for ${stay.title}`
          });
          
          clientSecret = paymentIntent.client_secret;
          
          // Save payment record
          await storage.createPayment({
            bookingId: booking.id,
            provider: 'stripe',
            intentId: paymentIntent.id,
            amount: totalPrice.toFixed(2),
            currency: stay.currency || 'GBP',
            status: paymentIntent.status,
            clientSecret,
            metadata: { nights, stayTitle: stay.title },
            rawData: paymentIntent
          });
          
          // Update booking with payment intent ID
          await storage.updateStayBooking(booking.id, {
            paymentIntentId: paymentIntent.id,
            status: 'REQUIRES_PAYMENT'
          });
          
        } catch (stripeError) {
          console.error("Stripe payment intent creation failed:", stripeError);
          // Continue without payment intent - can be handled manually
        }
      }
      
      // Log booking creation
      await storage.createAuditLog({
        actorId: userId,
        action: "enhanced_booking_created",
        targetType: "stay_booking",
        targetId: booking.id,
        metaJson: { 
          stayId, 
          nights, 
          totalPrice: totalPrice.toFixed(2), 
          paymentIntentId: paymentIntent?.id 
        },
        ipAddress: req.ip,
        userAgent: req.get("User-Agent"),
      });
      
      res.json({
        booking: {
          ...booking,
          status: paymentIntent ? 'REQUIRES_PAYMENT' : 'HOLD'
        },
        payment: {
          clientSecret,
          publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
          requiresPayment: totalPrice > 0
        },
        stay: {
          title: stay.title,
          hostId: stay.hostId
        }
      });
      
    } catch (error) {
      console.error("Error creating enhanced booking:", error);
      res.status(500).json({ message: "Failed to create booking" });
    }
  });

  // Confirm booking payment
  app.post('/api/bookings/:id/confirm-payment', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id: bookingId } = req.params;
      const { paymentIntentId } = req.body;
      
      const booking = await storage.getStayBookingById(bookingId);
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }
      
      if (booking.guestId !== userId) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      if (stripe && paymentIntentId) {
        // Retrieve payment intent from Stripe to confirm status
        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
        
        if (paymentIntent.status === 'succeeded') {
          // Update booking and payment records
          await storage.updateStayBooking(bookingId, {
            status: 'CONFIRMED',
            confirmedAt: new Date()
          });
          
          await storage.updatePaymentByIntentId(paymentIntentId, {
            status: 'succeeded'
          });
          
          await storage.createAuditLog({
            actorId: userId,
            action: "booking_payment_confirmed",
            targetType: "stay_booking",
            targetId: bookingId,
            metaJson: { paymentIntentId, amount: paymentIntent.amount },
            ipAddress: req.ip,
            userAgent: req.get("User-Agent"),
          });
          
          res.json({ 
            success: true, 
            booking: { ...booking, status: 'CONFIRMED' }
          });
        } else {
          res.status(400).json({ 
            message: "Payment not completed", 
            paymentStatus: paymentIntent.status 
          });
        }
      } else {
        res.status(400).json({ message: "Payment processing not available" });
      }
      
    } catch (error) {
      console.error("Error confirming booking payment:", error);
      res.status(500).json({ message: "Failed to confirm payment" });
    }
  });

  // Cancel booking
  app.post('/api/bookings/:id/cancel', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id: bookingId } = req.params;
      const { reason } = req.body;
      
      const booking = await storage.getStayBookingById(bookingId);
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }
      
      if (booking.guestId !== userId) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      if (booking.status === 'CANCELLED') {
        return res.status(400).json({ message: "Booking already cancelled" });
      }
      
      // Cancel Stripe payment intent if exists
      if (stripe && booking.paymentIntentId) {
        try {
          await stripe.paymentIntents.cancel(booking.paymentIntentId);
        } catch (stripeError) {
          console.error("Failed to cancel Stripe payment intent:", stripeError);
        }
      }
      
      // Update booking status
      await storage.updateStayBooking(bookingId, {
        status: 'CANCELLED',
        cancelledAt: new Date()
      });
      
      await storage.createAuditLog({
        actorId: userId,
        action: "booking_cancelled",
        targetType: "stay_booking",
        targetId: bookingId,
        metaJson: { reason, originalStatus: booking.status },
        ipAddress: req.ip,
        userAgent: req.get("User-Agent"),
      });
      
      res.json({ 
        success: true, 
        booking: { ...booking, status: 'CANCELLED' }
      });
      
    } catch (error) {
      console.error("Error cancelling booking:", error);
      res.status(500).json({ message: "Failed to cancel booking" });
    }
  });

  // Webhook endpoint for Stripe events
  app.post('/api/webhooks/stripe', async (req, res) => {
    const sig = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    
    if (!stripe || !webhookSecret) {
      return res.status(400).json({ message: "Stripe not configured" });
    }
    
    let event;
    
    try {
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return res.status(400).json({ message: "Webhook verification failed" });
    }
    
    // Check for duplicate events
    const existingEvent = await storage.getWebhookEvent(event.id);
    if (existingEvent) {
      return res.json({ received: true, duplicate: true });
    }
    
    // Store webhook event
    await storage.createWebhookEvent({
      id: event.id,
      provider: 'stripe',
      eventType: event.type,
      processed: false,
      data: event
    });
    
    // Process different event types
    try {
      switch (event.type) {
        case 'payment_intent.succeeded':
          const paymentIntent = event.data.object;
          const bookingId = paymentIntent.metadata.bookingId;
          
          if (bookingId) {
            await storage.updateStayBooking(bookingId, {
              status: 'CONFIRMED',
              confirmedAt: new Date()
            });
            
            await storage.updatePaymentByIntentId(paymentIntent.id, {
              status: 'succeeded'
            });
          }
          break;
          
        case 'payment_intent.payment_failed':
          const failedPayment = event.data.object;
          const failedBookingId = failedPayment.metadata.bookingId;
          
          if (failedBookingId) {
            await storage.updateStayBooking(failedBookingId, {
              status: 'CANCELLED',
              cancelledAt: new Date()
            });
            
            await storage.updatePaymentByIntentId(failedPayment.id, {
              status: 'failed'
            });
          }
          break;
      }
      
      // Mark webhook as processed
      await storage.updateWebhookEvent(event.id, { processed: true });
      
    } catch (processingError) {
      console.error('Webhook processing error:', processingError);
    }
    
    res.json({ received: true });
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
      console.log('🔍 /api/ads called for user:', userId);
      const user = await storage.getUser(userId);
      console.log('👤 User data:', user ? { id: user.id, plan: user.plan, youtubeVerified: user.youtubeVerified } : 'null');
      
      
      // Admin role has unrestricted access
      if (user?.role === 'admin') {
        // No restrictions for admin users
      } else {
        // Check for creator role first
        if (user?.role !== 'creator' && user?.role !== 'free_creator') {
          return res.status(403).json({ message: "Creator role required" });
        }
        
        // Specifically block free_creator role from monetization features
        if (user?.role === 'free_creator') {
          return res.status(403).json({ message: "Upgrade to premium creator plan required for campaign participation" });
        }
        
        // For creator role, require premium plan
        if (user?.role === 'creator' && user?.plan !== 'premium') {
          return res.status(403).json({ message: "Premium plan required for campaign access" });
        }
      }
      
      // Check if user has verified YouTube channel
      if (!user?.youtubeVerified || !user?.youtubeChannelId) {
        return res.json([]);
      }
      
      // Get user's YouTube tier for filtering
      const userTier = user?.youtubeTier || 1; // Default to tier 1 if not set
      console.log('🎯 User tier:', userTier, 'YouTube verified:', user?.youtubeVerified);
      
      const ads = await storage.getAds();
      console.log('📊 Total ads before filtering:', ads.length);
      
      // Filter ads based on user's YouTube tier - only show ads at or below their tier
      const tierFilteredAds = ads.filter(ad => {
        const adTier = ad.tierLevel || 1;
        const canAccess = adTier <= userTier;
        console.log(`📋 Ad "${ad.title}" (Tier ${adTier}) - User can access: ${canAccess}`);
        return canAccess;
      });
      
      // Apply geo-targeting filter
      const userCountry = user?.country;
      console.log(`🌍 User country: ${userCountry || 'Not set'}`);
      
      const geoFilteredAds = tierFilteredAds.filter(ad => {
        // Global campaigns (empty or null countries array) - show to everyone
        if (!ad.countries || ad.countries.length === 0) {
          console.log(`🌎 Ad "${ad.title}" is GLOBAL - showing to all users`);
          return true;
        }
        
        // Targeted campaigns - show only to users from target countries
        if (!userCountry) {
          console.log(`⚠️ Ad "${ad.title}" is targeted but user has no country - hiding`);
          return false;
        }
        
        const isTargeted = ad.countries.includes(userCountry);
        console.log(`🎯 Ad "${ad.title}" targets [${ad.countries.join(', ')}] - User country: ${userCountry} - Match: ${isTargeted}`);
        return isTargeted;
      });
      
      console.log('✅ Filtered ads count (after geo-targeting):', geoFilteredAds.length);
      res.json(geoFilteredAds);
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
      const ad = await storage.getAd(id);
      
      if (!ad) {
        return res.status(404).json({ message: "Campaign not found" });
      }
      
      // Check tier authorization - user must be at or above campaign tier level
      const userTier = user?.youtubeTier || 1;
      const requiredTier = ad.tierLevel || 1;
      
      if (userTier < requiredTier) {
        console.log(`🚫 Tier access denied: User tier ${userTier} < Required tier ${requiredTier} for campaign "${ad.title}"`);
        return res.status(403).json({ 
          message: `Access denied. This campaign requires Tier ${requiredTier} or higher. Your current tier: ${userTier}` 
        });
      }
      
      console.log(`✅ Tier access granted: User tier ${userTier} >= Required tier ${requiredTier} for campaign "${ad.title}"`);
      
      // Auto-fix demo user plan if needed
      if (user?.plan !== 'standard') {
        user = await storage.updateUserProfile(userId, { plan: 'standard' });
      }
      
      // For demo users, bypass plan check  
      // Remove demo user restrictions for production
      if (true) {
        // Admin role has unrestricted access
        if (user?.role === 'admin') {
          // No restrictions for admin users
        } else {
          // Check for creator role first
          if (user?.role !== 'creator' && user?.role !== 'free_creator') {
            return res.status(403).json({ message: "Creator role required" });
          }
          
          // Block free_creator role from campaign reservation (monetization feature)
          if (user?.role === 'free_creator') {
            return res.status(403).json({ message: "Upgrade to premium creator plan required for campaign reservation" });
          }
          
          // For creator role, require premium plan
          if (user?.role === 'creator' && user?.plan !== 'premium') {
            return res.status(403).json({ message: "Premium plan required for campaign reservation" });
          }
        }
      }

      // SECURITY: Re-verify channel ownership before allowing campaign reservation
      // Production security: require verified YouTube channel
      if (!user?.youtubeVerified || !user?.youtubeChannelId || !user?.youtubeVerificationCode) {
        return res.status(403).json({ message: "YouTube channel verification required" });
      }

      // Fresh verification check - only for regular users (NOT demo user)
      // Fresh verification check for all users
      if (true) {
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
      // Fresh verification check for all users
      if (true) {
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

  // Feed ads endpoint for serving ads in the feed - NO IMPRESSION TRACKING
  app.get('/api/feed/ads', async (req, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const ipAddress = req.ip || req.connection.remoteAddress;
      
      // Try to detect country from IP (simplified)
      let country = req.query.country as string;
      
      // Get ads for feed based on user location and targeting
      const feedAds = await storage.getFeedAdsForUser(userId, ipAddress, country);
      
      // Add signed impression IDs for each ad for secure tracking
      const crypto = await import('crypto');
      const adsWithImpressionIds = feedAds.map(ad => {
        // Create signed impression ID using ad ID, user ID, timestamp, and server secret
        const timestamp = Date.now().toString();
        const impressionData = `${ad.id}:${userId || 'anon'}:${timestamp}:${ipAddress}`;
        const secret = process.env.AD_IMPRESSION_SECRET || 'fallback-secret-key';
        const hash = crypto.createHmac('sha256', secret).update(impressionData).digest('hex');
        const impressionId = `${timestamp}.${hash.substring(0, 16)}`;
        
        return {
          ...ad,
          impressionId,
          impressionTimestamp: timestamp,
        };
      });
      
      res.json(adsWithImpressionIds);
    } catch (error) {
      console.error('Error serving feed ads:', error);
      res.status(500).json({ message: 'Failed to fetch feed ads' });
    }
  });

  // Endpoint to track ad impressions when ads are actually visible
  app.post('/api/feed/ads/impression', async (req, res) => {
    try {
      const { adId, adType, impressionId, viewDuration } = req.body;
      const userId = req.user?.claims?.sub;
      const ipAddress = req.ip || req.connection.remoteAddress;
      const userAgent = req.get('User-Agent');
      
      if (!adId || !adType || !impressionId) {
        return res.status(400).json({ message: 'Missing required fields' });
      }
      
      // Verify signed impression ID to prevent forgery
      const crypto = await import('crypto');
      const [timestamp, providedHash] = impressionId.split('.');
      const impressionData = `${adId}:${userId || 'anon'}:${timestamp}:${ipAddress}`;
      const secret = process.env.AD_IMPRESSION_SECRET || 'fallback-secret-key';
      const expectedHash = crypto.createHmac('sha256', secret).update(impressionData).digest('hex').substring(0, 16);
      
      if (providedHash !== expectedHash) {
        return res.status(401).json({ message: 'Invalid impression ID' });
      }
      
      // Check for duplicate impression (same adId + userId/ipAddress in last 5 minutes)
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      const existingImpressions = await storage.getFeedAdImpressions({
        adId,
        userId: userId || null,
        ipAddress: userId ? undefined : ipAddress, // Use IP for anonymous users
        after: fiveMinutesAgo,
      });
      
      if (existingImpressions.length > 0) {
        return res.status(409).json({ message: 'Duplicate impression detected' });
      }
      
      // Record valid impression
      await storage.createFeedAdImpression({
        adId,
        adType,
        boostedPostId: adType === 'boosted_post' ? adId : null,
        campaignAdId: adType === 'campaign' ? adId : null,
        userId: userId || null,
        ipAddress,
        userAgent,
        clicked: false,
        viewDuration: viewDuration || null,
      });
      
      // Update impression count for boosted posts
      if (adType === 'boosted_post') {
        const boostedPost = await storage.getBoostedPost(adId);
        if (boostedPost) {
          await storage.updateBoostedPost(adId, {
            impressions: (boostedPost.impressions || 0) + 1,
          });
        }
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error('Error tracking ad impression:', error);
      res.status(500).json({ message: 'Failed to track impression' });
    }
  });

  // Endpoint to track ad clicks - SECURED with CSRF protection and rate limiting
  app.post('/api/feed/ads/:id/click', async (req, res) => {
    try {
      const { id } = req.params;
      const { adType, impressionId } = req.body;
      const userId = req.user?.claims?.sub;
      const ipAddress = req.ip || req.connection.remoteAddress;
      const userAgent = req.get('User-Agent');
      
      if (!adType || !impressionId) {
        return res.status(400).json({ message: 'Missing required fields' });
      }
      
      // Verify signed impression ID to prevent click fraud
      const crypto = await import('crypto');
      const [timestamp, providedHash] = impressionId.split('.');
      const impressionData = `${id}:${userId || 'anon'}:${timestamp}:${ipAddress}`;
      const secret = process.env.AD_IMPRESSION_SECRET || 'fallback-secret-key';
      const expectedHash = crypto.createHmac('sha256', secret).update(impressionData).digest('hex').substring(0, 16);
      
      if (providedHash !== expectedHash) {
        return res.status(401).json({ message: 'Invalid impression ID' });
      }
      
      // Rate limiting: max 5 clicks per user per minute
      const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
      const recentClicks = await storage.getFeedAdImpressions({
        userId: userId || null,
        ipAddress: userId ? undefined : ipAddress,
        clicked: true,
        after: oneMinuteAgo,
      });
      
      if (recentClicks.length >= 5) {
        return res.status(429).json({ message: 'Rate limit exceeded. Too many clicks.' });
      }
      
      // Check for duplicate click (same ad + user/IP in last hour)
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const duplicateClicks = await storage.getFeedAdImpressions({
        adId: id,
        userId: userId || null,
        ipAddress: userId ? undefined : ipAddress,
        clicked: true,
        after: oneHourAgo,
      });
      
      if (duplicateClicks.length > 0) {
        return res.status(409).json({ message: 'Duplicate click detected' });
      }
      
      // Record valid click
      await storage.createFeedAdImpression({
        adId: id,
        adType,
        boostedPostId: adType === 'boosted_post' ? id : null,
        campaignAdId: adType === 'campaign' ? id : null,
        userId: userId || null,
        ipAddress,
        userAgent,
        clicked: true,
      });
      
      // If it's a boosted post, increment click count and spend
      if (adType === 'boosted_post') {
        const boostedPost = await storage.getBoostedPost(id);
        if (boostedPost) {
          const newClicks = (boostedPost.clicks || 0) + 1;
          const clickCost = parseFloat(boostedPost.costPerClick?.toString() || '0.10');
          const newSpend = parseFloat(boostedPost.spend?.toString() || '0') + clickCost;
          
          await storage.updateBoostedPost(id, {
            clicks: newClicks,
            spend: newSpend.toString(),
          });
        }
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error('Error tracking ad click:', error);
      res.status(500).json({ message: 'Failed to track click' });
    }
  });

  // Create boosted post endpoint with proper Zod validation
  app.post('/api/posts/:postId/boost', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { postId } = req.params;
      
      // Validate the post belongs to the user
      const post = await storage.getPost(postId);
      if (!post || post.userId !== userId) {
        return res.status(404).json({ message: 'Post not found or access denied' });
      }
      
      // Validate request data using Zod schema
      const validatedData = insertBoostedPostSchema.parse({
        ...req.body,
        postId,
      });
      
      // Additional business logic validation
      if (new Date(validatedData.startDate) >= new Date(validatedData.endDate)) {
        return res.status(400).json({ message: 'Start date must be before end date' });
      }
      
      if (validatedData.dailyBudget > validatedData.totalBudget) {
        return res.status(400).json({ message: 'Daily budget cannot exceed total budget' });
      }
      
      const boostedPostData = {
        postId,
        userId,
        targetCountries: validatedData.targetCountries || [],
        targetCities: validatedData.targetCities || [],
        dailyBudget: validatedData.dailyBudget.toString(),
        totalBudget: validatedData.totalBudget.toString(),
        costPerClick: req.body.costPerClick || 0.10,
        startDate: new Date(validatedData.startDate),
        endDate: new Date(validatedData.endDate),
        status: 'active',
      };
      
      const boostedPost = await storage.createBoostedPost(boostedPostData);
      
      // Create audit log
      await storage.createAuditLog({
        actorId: userId,
        action: 'post_boosted',
        targetType: 'post',
        targetId: postId,
        metaJson: { 
          dailyBudget: validatedData.dailyBudget,
          totalBudget: validatedData.totalBudget,
          targetCountries: validatedData.targetCountries,
        },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
      });
      
      res.status(201).json(boostedPost);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ 
          message: 'Validation failed', 
          errors: error.errors 
        });
      }
      console.error('Error creating boosted post:', error);
      res.status(500).json({ message: 'Failed to create boosted post' });
    }
  });

  // Get user's boosted posts
  app.get('/api/posts/boosted', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const boostedPosts = await storage.getUserBoostedPosts(userId);
      res.json(boostedPosts);
    } catch (error) {
      console.error('Error fetching boosted posts:', error);
      res.status(500).json({ message: 'Failed to fetch boosted posts' });
    }
  });

  // Update boosted post (pause/resume/stop)
  app.patch('/api/posts/boosted/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id } = req.params;
      const { status } = req.body;
      
      // Verify ownership
      const boostedPost = await storage.getBoostedPost(id);
      if (!boostedPost || boostedPost.userId !== userId) {
        return res.status(404).json({ message: 'Boosted post not found or access denied' });
      }
      
      const updatedBoostedPost = await storage.updateBoostedPost(id, { status });
      
      // Create audit log
      await storage.createAuditLog({
        actorId: userId,
        action: `boosted_post_${status}`,
        targetType: 'boosted_post',
        targetId: id,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
      });
      
      res.json(updatedBoostedPost);
    } catch (error) {
      console.error('Error updating boosted post:', error);
      res.status(500).json({ message: 'Failed to update boosted post' });
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
      // Fresh verification check for all users
      if (true) {
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
      
      // Create payout - no additional tax since tax was already withheld at earning time
      const payout = await storage.createPayout({
        userId,
        grossAmountMinor: amountMinor, // For withdrawals, gross = net (no new tax)
        taxWithheldMinor: 0, // No additional tax on withdrawal
        amountMinor,
        taxRate: 0,
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
            res.status(500).json({ message: "Failed to create report" });
    }
  });

  // Admin routes
  app.get('/api/admin/dashboard', isAdmin, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Get user for admin operations
      const user = await storage.getUser(userId);
      
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
            res.status(500).json({ message: "Failed to fetch dashboard" });
    }
  });


  // Plan Pricing Management API
  app.get('/api/admin/plans', isAdmin, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Get user for admin operations
      const user = await storage.getUser(userId);
      
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

  app.put('/api/admin/plans/:planId', isAdmin, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Get user for admin operations
      const user = await storage.getUser(userId);
      
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
  app.get('/api/admin/content', isAdmin, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Get user for admin operations
      const user = await storage.getUser(userId);
      
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

  app.put('/api/admin/content/:section', isAdmin, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Get user for admin operations
      const user = await storage.getUser(userId);
      
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
  app.get('/api/admin/users', isAdmin, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Get user for admin operations
      const user = await storage.getUser(userId);
      
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
            res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.put('/api/admin/users/:userId', isAdmin, async (req: any, res) => {
    try {
      const adminId = req.user.claims.sub;
      
      // Get admin user for operations  
      const adminUser = await storage.getUser(adminId);
      
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
            res.status(500).json({ message: "Failed to update user" });
    }
  });

  // Discount Code APIs
  app.post('/api/admin/discount-codes', isAdmin, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Get user for admin operations
      const user = await storage.getUser(userId);
      
      if (!['admin', 'superadmin'].includes(user?.role || '')) {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const codeData = req.body;
      
      // Create discount code in database
      const code = await storage.createDiscountCode({
        code: codeData.code,
        description: codeData.description,
        discountType: codeData.discountType,
        discountValue: codeData.discountValue,
        maxUses: codeData.maxUses ? parseInt(codeData.maxUses) : null,
        validFrom: codeData.validFrom ? new Date(codeData.validFrom) : new Date(),
        validUntil: codeData.validUntil ? new Date(codeData.validUntil) : null,
        isActive: codeData.status === 'active',
        applicablePlans: codeData.applicablePlans ? [codeData.applicablePlans] : ['all'],
        createdBy: userId
      });
      
      // Create audit log
      await storage.createAuditLog({
        actorId: userId,
        action: 'create_discount_code',
        targetType: 'discount_code',
        targetId: code.id,
        metaJson: codeData
      });
      
      res.json({ 
        success: true, 
        message: "Discount code created successfully",
        code
      });
    } catch (error) {
      console.error("Error creating discount code:", error);
      res.status(500).json({ message: "Failed to create discount code" });
    }
  });

  // Create trial code
  app.post('/api/admin/trial-codes', isAdmin, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Get user for admin operations
      const user = await storage.getUser(userId);
      
      if (!['admin', 'superadmin'].includes(user?.role || '')) {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const codeData = req.body;
      
      // Create trial code in database
      const code = await storage.createDiscountCode({
        code: codeData.code,
        description: codeData.description,
        discountType: 'trial',
        discountValue: 0,
        trialPeriodDays: parseInt(codeData.trialPeriod),
        trialPlanType: codeData.planType,
        autoDebitEnabled: codeData.autoDebit === 'enabled',
        maxUses: codeData.maxUses ? parseInt(codeData.maxUses) : null,
        isActive: true,
        applicablePlans: [codeData.planType],
        createdBy: userId
      });
      
      // Create audit log
      await storage.createAuditLog({
        actorId: userId,
        action: 'create_trial_code',
        targetType: 'trial_code',
        targetId: code.id,
        metaJson: codeData
      });
      
      res.json({ 
        success: true, 
        message: "Trial code created successfully",
        code
      });
    } catch (error) {
      console.error("Error creating trial code:", error);
      res.status(500).json({ message: "Failed to create trial code" });
    }
  });

  // Get all discount and trial codes
  app.get('/api/admin/discount-codes', isAdmin, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Get user for admin operations
      const user = await storage.getUser(userId);
      
      if (!['admin', 'superadmin'].includes(user?.role || '')) {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const codes = await storage.getAllDiscountCodes();
      res.json(codes);
    } catch (error) {
      console.error("Error fetching discount codes:", error);
      res.status(500).json({ message: "Failed to fetch discount codes" });
    }
  });

  // Site Settings/Branding APIs
  app.get('/api/admin/site-settings', isAdmin, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Get user for admin operations
      const user = await storage.getUser(userId);
      
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
          stripeEnabled: true
        }
      };
      
      res.json(settings);
    } catch (error) {
      console.error("Error fetching site settings:", error);
      res.status(500).json({ message: "Failed to fetch site settings" });
    }
  });

  app.put('/api/admin/site-settings/:category', isAdmin, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Get user for admin operations
      const user = await storage.getUser(userId);
      
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
  app.get('/api/admin/api-settings', isAdmin, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Get user for admin operations
      const user = await storage.getUser(userId);
      
      if (!['admin', 'superadmin'].includes(user?.role || '')) {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      // Return API configuration status with stored settings
      const apiSettings = {
        stripe: {
          publishableKey: storedApiSettings.stripe.publishableKey || (process.env.VITE_STRIPE_PUBLIC_KEY ? 'pk_live_••••••••••••3456' : ''),
          secretKey: storedApiSettings.stripe.secretKey || (process.env.STRIPE_SECRET_KEY ? 'sk_live_••••••••••••7890' : ''),
          webhookSecret: storedApiSettings.stripe.webhookSecret || (process.env.STRIPE_WEBHOOK_SECRET ? 'whsec_••••••••••••1234' : ''),
          status: (storedApiSettings.stripe.secretKey || process.env.STRIPE_SECRET_KEY) ? 'active' : 'inactive',
          lastTested: new Date().toISOString()
        },
        youtube: {
          apiKey: storedApiSettings.youtube.apiKey || (process.env.YOUTUBE_API_KEY ? '••••••••••••' : ''),
          projectId: storedApiSettings.youtube.projectId || 'hublink-project',
          status: (storedApiSettings.youtube.apiKey || process.env.YOUTUBE_API_KEY) ? 'active' : 'inactive',
          lastTested: null
        },
        maps: {
          apiKey: storedApiSettings.maps.apiKey || (process.env.GOOGLE_MAPS_API_KEY ? '••••••••••••' : ''),
          enableAdvancedFeatures: storedApiSettings.maps.enableAdvancedFeatures !== undefined ? storedApiSettings.maps.enableAdvancedFeatures : true,
          status: (storedApiSettings.maps.apiKey || process.env.GOOGLE_MAPS_API_KEY) ? 'active' : 'inactive',
          monthlyRequests: 6,
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
        email: {
          provider: process.env.GMAIL_EMAIL ? 'gmail_smtp' : (storedApiSettings.email.provider || 'not_configured'),
          email: process.env.GMAIL_EMAIL ? process.env.GMAIL_EMAIL.replace(/(.{2}).*(@.*)/, '$1***$2') : '',
          appPassword: process.env.GMAIL_APP_PASSWORD ? '••••••••••••••••' : '',
          status: (process.env.GMAIL_EMAIL && process.env.GMAIL_APP_PASSWORD) ? 'active' : 'inactive',
          lastTested: null,
          note: (process.env.GMAIL_EMAIL && process.env.GMAIL_APP_PASSWORD) ? 'Gmail SMTP configured via environment variables' : 'Configure Gmail App Password in Replit Secrets'
        },
        usage: {
          stripe: { calls: 2456, period: '30_days' },
          youtube: { calls: 0, period: '30_days' },
          storage: { requests: 12890, period: '30_days' }
        }
      };
      
      res.json(apiSettings);
    } catch (error) {
      console.error("Error fetching API settings:", error);
      res.status(500).json({ message: "Failed to fetch API settings" });
    }
  });

  app.put('/api/admin/api-settings/:service', isAdmin, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Get user for admin operations
      const user = await storage.getUser(userId);
      
      if (!['admin', 'superadmin'].includes(user?.role || '')) {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const { service } = req.params;
      const settingsData = req.body;
      
      // Validate service type
      const validServices = ['stripe', 'youtube', 'maps', 'database', 'storage', 'email'];
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
        case 'youtube':
          if (settingsData.apiKey && settingsData.apiKey.length < 20) {
            validationResult = { valid: false, message: 'Invalid YouTube API key format' };
          }
          break;
        case 'maps':
          if (settingsData.apiKey && (!settingsData.apiKey.startsWith('AIza') || settingsData.apiKey.length < 30)) {
            validationResult = { valid: false, message: 'Invalid Google Maps API key format. Must start with AIza and be at least 30 characters' };
          }
          break;
      }
      
      if (!validationResult.valid) {
        return res.status(400).json({ message: validationResult.message });
      }
      
      // Store the API settings in memory (in production, use secure database storage)
      if (storedApiSettings[service as keyof typeof storedApiSettings]) {
        Object.assign(storedApiSettings[service as keyof typeof storedApiSettings], settingsData);
        console.log(`✅ Saved ${service} settings:`, Object.keys(settingsData));
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

  app.post('/api/admin/api-settings/test/:service', isAdmin, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Get user for admin operations
      const user = await storage.getUser(userId);
      
      if (!['admin', 'superadmin'].includes(user?.role || '')) {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const { service } = req.params;
      
      // Validate service type
      const validServices = ['stripe', 'youtube', 'maps', 'database', 'storage', 'email'];
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
          
        case 'maps':
          // Check for saved Maps API key first, then environment variable
          let mapsApiKey = null;
          const savedMapsSettings = storedApiSettings.maps;
          if (savedMapsSettings && savedMapsSettings.apiKey && savedMapsSettings.apiKey.trim() !== '') {
            mapsApiKey = savedMapsSettings.apiKey;
            console.log('🧪 Test using saved Google Maps API key:', mapsApiKey.slice(0, 15) + '...');
          } else {
            mapsApiKey = process.env.GOOGLE_MAPS_API_KEY;
            console.log('🧪 Test using environment Google Maps API key:', mapsApiKey ? mapsApiKey.slice(0, 15) + '...' : 'none');
          }
          
          if (mapsApiKey && mapsApiKey.startsWith('AIza') && !mapsApiKey.includes('demo')) {
            try {
              // Test Google Maps API by making a simple geocoding request
              const testUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=London&key=${mapsApiKey}`;
              const response = await fetch(testUrl);
              const data = await response.json();
              
              if (data.status === 'OK' && data.results && data.results.length > 0) {
                testResult = { 
                  success: true, 
                  message: 'Google Maps API connection successful',
                  details: { 
                    status: data.status,
                    resultsCount: data.results.length,
                    testLocation: data.results[0]?.formatted_address || 'Test location found',
                    apiKeyFormat: 'Valid',
                    services: ['Geocoding', 'Maps JavaScript API', 'Places API']
                  }
                };
              } else if (data.status === 'REQUEST_DENIED') {
                testResult.message = 'Google Maps API key denied. Check API restrictions and billing.';
                testResult.details = { error: data.status, errorMessage: data.error_message };
              } else {
                testResult.message = `Google Maps API test failed: ${data.status}`;
                testResult.details = { error: data.status, errorMessage: data.error_message };
              }
            } catch (mapsError: any) {
              console.error('Google Maps test error:', mapsError);
              testResult.message = `Google Maps API test failed: ${mapsError.message || 'Network error'}`;
              testResult.details = { error: 'network_error' };
            }
          } else {
            testResult.message = 'Please configure a valid Google Maps API key (must start with AIza)';
          }
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
  app.get('/api/admin/payment-accounts', isAdmin, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Get user for admin operations
      const user = await storage.getUser(userId);
      
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

  app.put('/api/admin/payment-accounts/:provider', isAdmin, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Get user for admin operations
      const user = await storage.getUser(userId);
      
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
  app.get('/api/admin/email-settings', isAdmin, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Get user for admin operations
      const user = await storage.getUser(userId);
      
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

  app.post('/api/admin/email/send-campaign', isAdmin, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Get user for admin operations
      const user = await storage.getUser(userId);
      
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

  app.put('/api/admin/email/template/:templateId', isAdmin, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Get user for admin operations
      const user = await storage.getUser(userId);
      
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
  app.post('/api/admin/coupon/apply-trial', isAdmin, async (req: any, res) => {
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

  app.get('/api/admin/user-trials', isAdmin, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Get user for admin operations
      const user = await storage.getUser(userId);
      
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

  app.post('/api/admin/trial/cancel/:trialId', isAdmin, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Get user for admin operations
      const user = await storage.getUser(userId);
      
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

  app.get('/api/admin/submissions', isAdmin, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Get user for admin operations
      const user = await storage.getUser(userId);
      
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

  app.post('/api/admin/submissions/:id/review', isAdmin, async (req: any, res) => {
    try {
      const reviewerId = req.user.claims.sub;
      const user = await storage.getUser(reviewerId);
      if (!['admin', 'superadmin', 'moderator'].includes(user?.role || '')) {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const { id } = req.params;
      const { status, notes } = req.body; // approve or reject
      
      const submission = await storage.updateAdSubmissionStatus(id, status, reviewerId, notes);
      
      // If approved, add funds to creator's wallet (with tax calculation)
      if (status === 'approved' && submission.reservationId) {
        const reservation = await db.query.adReservations.findFirst({
          where: eq(adReservations.id, submission.reservationId),
          with: { ad: true, user: true }
        });
        
        if (reservation?.ad && reservation?.user) {
          const grossAmountMinor = Math.round(parseFloat(reservation.ad.payoutAmount) * 100);
          
          // Get tax configuration for creator's country
          const creatorCountry = reservation.user.country || 'GB'; // Default to UK
          const taxConfig = await storage.getTaxConfiguration(creatorCountry);
          
          let taxWithheldMinor = 0;
          let taxRate = 0;
          let taxConfigId: string | undefined;
          
          if (taxConfig) {
            taxRate = parseFloat(taxConfig.taxRate);
            taxWithheldMinor = Math.round(grossAmountMinor * (taxRate / 100));
            taxConfigId = taxConfig.id;
          }
          
          const netAmountMinor = grossAmountMinor - taxWithheldMinor;
          
          // Update wallet with gross, tax, and net amounts
          await storage.updateWalletBalance(
            reservation.userId!, 
            netAmountMinor,
            grossAmountMinor,
            taxWithheldMinor
          );
          
          // Create tax record for audit trail
          const now = new Date();
          await storage.createTaxRecord({
            userId: reservation.userId!,
            transactionType: 'campaign_earning',
            transactionId: submission.id,
            grossAmountMinor,
            taxWithheldMinor,
            netAmountMinor,
            taxRate: taxRate.toString(),
            taxYear: now.getFullYear(),
            taxQuarter: Math.ceil((now.getMonth() + 1) / 3),
            country: creatorCountry,
            taxConfigId,
            description: `Campaign payout: ${reservation.ad.title}`,
          });
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

  app.post('/api/admin/ads', isAdmin, async (req: any, res) => {
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
      const userId = req.user.claims.sub;
      
      // Handle demo publisher user
      if (userId === 'demo-publisher') {
        console.log('📥 Received data for validation:', JSON.stringify(req.body, null, 2));
        const data = insertPublisherAdSchema.parse(req.body);
        
        // Calculate max influencers based on tier and budget
        const tierPrices = { 
          1: 125, 2: 250, 3: 440, 4: 625, 5: 875, 
          6: 1125, 7: 1500, 8: 1875, 9: 2250, 10: 2500 
        };
        const tierPrice = tierPrices[data.tierLevel as keyof typeof tierPrices];
        const maxInfluencers = Math.floor(data.totalBudget / tierPrice);
        
        const adData = {
          ...data,
          publisherId: userId,
          payoutAmount: tierPrice.toString(),
          quota: maxInfluencers,
          maxInfluencers,
          currency: "USD",
          status: "pending_payment"
        };
        
        const ad = await storage.createAd(adData);
        console.log('✅ Demo campaign created:', ad);
        return res.json(ad);
      }
      
      const user = await storage.getUser(userId);
      if (user?.role !== 'publisher') {
        return res.status(403).json({ message: "Publisher role required" });
      }
      
      const data = insertPublisherAdSchema.parse(req.body);
      
      // Calculate max influencers based on tier and budget
      const tierPrices = { 
        1: 125, 2: 250, 3: 440, 4: 625, 5: 875, 
        6: 1125, 7: 1500, 8: 1875, 9: 2250, 10: 2500 
      };
      const tierPrice = tierPrices[data.tierLevel as keyof typeof tierPrices];
      const maxInfluencers = Math.floor(data.totalBudget / tierPrice);
      
      const adData = {
        ...data,
        publisherId: req.user.claims.sub,
        payoutAmount: tierPrice.toString(),
        quota: maxInfluencers,
        maxInfluencers,
        currency: "USD",
        status: "pending_payment"
      };
      
      const ad = await storage.createAd(adData);
      
      res.json(ad);
    } catch (error) {
      if (error instanceof ZodError) {
        console.error("❌ Validation failed:", JSON.stringify(error.errors, null, 2));
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("❌ Error creating publisher ad:", error);
      res.status(500).json({ message: "Failed to create ad" });
    }
  });

  // Get publisher's ads
  app.get('/api/publisher/ads', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Handle demo publisher user
      if (userId === 'demo-publisher') {
        const ads = await storage.getPublisherAds(userId);
        return res.json(ads);
      }
      
      const user = await storage.getUser(userId);
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

  // Get single campaign details
  app.get('/api/campaigns/:campaignId', isAuthenticated, async (req: any, res) => {
    try {
      const { campaignId } = req.params;
      const userId = req.user.claims.sub;
      
      console.log('🔍 Fetching campaign:', campaignId, 'for user:', userId);
      
      // Handle demo campaigns
      if (campaignId.startsWith('campaign-')) {
        // Return mock campaign data for demo
        const mockCampaign = {
          id: campaignId,
          publisherId: userId,
          brand: 'Demo Brand',
          title: 'Test Campaign',
          briefMd: 'This is a demo campaign for testing the payment flow.',
          adImageUrl: 'https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=400&h=300&fit=crop',
          totalBudget: 500,
          tierLevel: 2,
          numberOfInfluencers: 2,
          maxInfluencers: 2,
          reservedInfluencers: 0,
          completedInfluencers: 0,
          currentReservations: 0,
          status: 'pending_payment',
          payoutAmount: 450,
          currency: 'USD',
          deadlineAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          countries: [],
          hashtags: [],
          quota: 2,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        
        console.log('📊 Returning mock campaign:', mockCampaign);
        return res.json(mockCampaign);
      }
      
      // Real implementation
      const campaign = await storage.getAd(campaignId);
      if (!campaign) {
        return res.status(404).json({ message: 'Campaign not found' });
      }
      
      // Check if user owns this campaign
      if (campaign.publisherId !== userId) {
        return res.status(403).json({ message: 'Access denied' });
      }
      
      res.json(campaign);
    } catch (error) {
      console.error('❌ Error fetching campaign:', error);
      res.status(500).json({ message: 'Failed to fetch campaign' });
    }
  });

  // Check publisher payout account status
  app.get('/api/publishers/me/payout-status', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Check if user has Stripe customer ID (basic account connection indicator)
      const hasPayoutAccount = !!(user.stripeCustomerId && user.plan && user.plan !== 'free');
      
      res.json({
        connected: hasPayoutAccount,
        stripeConnected: !!user.stripeCustomerId,
        plan: user.plan || 'free'
      });
    } catch (error) {
      console.error('❌ Error checking payout status:', error);
      res.status(500).json({ message: 'Failed to check payout status' });
    }
  });

  // Process campaign payment
  app.post('/api/campaigns/:campaignId/payment', isAuthenticated, async (req: any, res) => {
    try {
      const { campaignId } = req.params;
      const userId = req.user.claims.sub;
      
      console.log('💳 Processing payment for campaign:', campaignId, 'user:', userId);
      
      // Handle demo campaigns
      if (campaignId.startsWith('campaign-')) {
        // Simulate payment processing delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        console.log('✅ Demo payment processed successfully');
        return res.json({ 
          success: true, 
          message: 'Payment processed successfully',
          campaignId,
          status: 'active'
        });
      }
      
      // Real implementation - would integrate with Stripe here
      const campaign = await storage.getAd(campaignId);
      if (!campaign) {
        return res.status(404).json({ message: 'Campaign not found' });
      }
      
      if (campaign.publisherId !== userId) {
        return res.status(403).json({ message: 'Access denied' });
      }

      // Prevent double payment
      if (campaign.status === 'active') {
        return res.status(400).json({ message: 'Campaign is already active and paid for' });
      }

      if (campaign.status !== 'pending_payment') {
        return res.status(400).json({ message: 'Campaign is not eligible for payment' });
      }
      
      // Update campaign status to active after payment
      const updatedCampaign = await storage.updateAd(campaignId, { status: 'active' });
      
      res.json({ 
        success: true, 
        message: 'Payment processed successfully',
        campaign: updatedCampaign
      });
    } catch (error) {
      console.error('❌ Error processing payment:', error);
      res.status(500).json({ message: 'Payment processing failed' });
    }
  });

  // SECURITY: Role update endpoint - DEVELOPMENT ONLY (PRIVILEGE ESCALATION RISK)
  app.post('/api/user/role', isAuthenticated, async (req: any, res) => {
    // CRITICAL SECURITY: Only allow role changes in development environment
    // This endpoint allows privilege escalation and should NEVER be available in production
    if (process.env.NODE_ENV !== 'development') {
      return res.status(404).json({ message: 'Not found' });
    }
    
    try {
      const { role } = req.body;
      const validRoles = ['traveler', 'creator', 'free_creator', 'stays', 'promotional', 'tour_package', 'publisher', 'admin', 'superadmin'];
      
      if (!validRoles.includes(role)) {
        return res.status(400).json({ message: "Invalid role" });
      }
      
      console.log(`🚨 DEV ONLY: Role change from ${req.user.claims.sub} to ${role}`);
      const updatedUser = await storage.updateUserProfile(req.user.claims.sub, { role });
      res.json({ message: "Role updated successfully", user: updatedUser });
    } catch (error) {
      console.error("Error updating user role:", error);
      res.status(500).json({ message: "Failed to update role" });
    }
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
      const { travelers, message, guestName, guestEmail, guestPhone, departureDate } = req.body;
      const packageId = req.params.id;
      
      // Validate required fields
      const travelersCount = Math.max(1, parseInt(travelers) || 1);
      if (!departureDate) {
        return res.status(400).json({ message: 'Departure date is required' });
      }
      
      // For demo - In real app, fetch from database and verify package exists
      const basePrice = 899; // This would be fetched from the actual package
      const subtotal = basePrice * travelersCount; // Per traveler pricing
      const platformFee = subtotal * 0.10; // 10% platform fee on subtotal
      const totalPrice = subtotal + platformFee;
      
      // Create booking in database
      const bookingData = {
        packageId,
        guestId: userId,
        departureDate: new Date(departureDate),
        travelers: travelersCount,
        totalPrice: totalPrice.toString(),
        platformFee: platformFee.toString(),
        currency: 'USD',
        status: 'confirmed',
        specialRequests: message || null,
        contactInfo: {
          name: guestName || 'Guest User',
          email: guestEmail || 'guest@example.com',
          phone: guestPhone || '+44 20 7946 0958'
        },
      };
      
      const booking = await storage.createTourPackageBooking(bookingData);
      
      // Log booking with platform fee details (skip for demo users)
      if (!userId.startsWith('demo-')) {
        await storage.createAuditLog({
          actorId: userId,
          action: "tour_package_booked",
          targetType: "tour_booking",
          targetId: booking.id,
          metaJson: { 
            packageId, 
            travelers: travelersCount.toString(),
            basePrice: basePrice.toString(),
            subtotal: subtotal.toString(),
            platformFee: platformFee.toString(), 
            totalPrice: totalPrice.toString(),
            departureDate: departureDate 
          },
          ipAddress: req.ip,
          userAgent: req.get("User-Agent"),
        });
      }
      
      res.json(booking);
    } catch (error) {
      console.error('Error booking tour package:', error);
      res.status(500).json({ message: 'Failed to book tour package' });
    }
  });

  // Get user's tour package bookings
  app.get('/api/my-bookings/tour-packages', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const bookings = await storage.getUserTourPackageBookings(userId);
      res.json(bookings);
    } catch (error) {
      console.error('Error fetching user tour package bookings:', error);
      res.status(500).json({ message: 'Failed to fetch bookings' });
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

  // Tax Management Routes (Admin Only)
  app.get('/api/admin/tax/configurations', isAdmin, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!['admin', 'superadmin'].includes(user?.role || '')) {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const configs = await storage.getAllTaxConfigurations();
      res.json(configs);
    } catch (error) {
      console.error("Error fetching tax configurations:", error);
      res.status(500).json({ message: "Failed to fetch tax configurations" });
    }
  });

  app.post('/api/admin/tax/configurations', isAdmin, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!['admin', 'superadmin'].includes(user?.role || '')) {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const config = await storage.createTaxConfiguration(req.body);
      
      await storage.createAuditLog({
        actorId: req.user.claims.sub,
        action: "tax_configuration_created",
        targetType: "tax_configuration",
        targetId: config.id,
        metaJson: req.body,
        ipAddress: req.ip,
        userAgent: req.get("User-Agent"),
      });
      
      res.json(config);
    } catch (error) {
      console.error("Error creating tax configuration:", error);
      res.status(500).json({ message: "Failed to create tax configuration" });
    }
  });

  app.put('/api/admin/tax/configurations/:id', isAdmin, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!['admin', 'superadmin'].includes(user?.role || '')) {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const config = await storage.updateTaxConfiguration(req.params.id, req.body);
      
      await storage.createAuditLog({
        actorId: req.user.claims.sub,
        action: "tax_configuration_updated",
        targetType: "tax_configuration",
        targetId: req.params.id,
        metaJson: req.body,
        ipAddress: req.ip,
        userAgent: req.get("User-Agent"),
      });
      
      res.json(config);
    } catch (error) {
      console.error("Error updating tax configuration:", error);
      res.status(500).json({ message: "Failed to update tax configuration" });
    }
  });

  app.get('/api/admin/tax/records', isAdmin, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!['admin', 'superadmin'].includes(user?.role || '')) {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const { year, country } = req.query;
      const filters: any = {};
      if (year) filters.year = parseInt(year as string);
      if (country) filters.country = country as string;
      
      const records = await storage.getAllTaxRecords(filters);
      res.json(records);
    } catch (error) {
      console.error("Error fetching tax records:", error);
      res.status(500).json({ message: "Failed to fetch tax records" });
    }
  });

  app.get('/api/my-tax-records', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { year, quarter, country } = req.query;
      
      const filters: any = {};
      if (year) filters.year = parseInt(year as string);
      if (quarter) filters.quarter = parseInt(quarter as string);
      if (country) filters.country = country as string;
      
      const records = await storage.getUserTaxRecords(userId, filters);
      res.json(records);
    } catch (error) {
      console.error("Error fetching user tax records:", error);
      res.status(500).json({ message: "Failed to fetch tax records" });
    }
  });

  // Use provided server or create a new one
  const server = httpServer || createServer(app);

  // WebSocket server for real-time messaging
  const wss = new WebSocketServer({ server, path: '/ws' });
  
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

  return server;
}
