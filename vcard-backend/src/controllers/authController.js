// controllers/authController.js
const bcrypt = require('bcryptjs');
const db = require('../config/database');
const { generateToken, generateRandomToken, sendEmail } = require('../utils/helpers');
const crypto = require('crypto'); 
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;

// @desc    Register user
// @route   POST /api/v1/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    const { email, phone, country_code = '+237', first_name, last_name, password } = req.body;

    // Check existing user
    const [existing] = await db.query(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (existing.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Email already registered'
      });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Insert user WITH country_code (Cameroon default)
    const [result] = await db.query(
      `INSERT INTO users 
       (email, country_code, phone, first_name, last_name, password_hash, created_at) 
       VALUES (?, ?, ?, ?, ?, ?, NOW())`,
      [email, country_code, phone || null, first_name, last_name, passwordHash]
    );

    // Generate token
    const token = generateToken({
      id: result.insertId,
      role: 'USER'
    });

    const verificationToken = crypto.randomBytes(32).toString('hex');
    await db.query(
      'UPDATE users SET verification_token = ? WHERE id = ?',
      [verificationToken, result.insertId]
    );

    // Send verification email with link
    const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?token=${verificationToken}`;
    
    await sendEmail(
      email,
      'Verify Your Email - Virtual Card Provider',
      `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
        <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <h1 style="color: #1976d2; margin-top: 0;">Welcome ${first_name}!</h1>
          <p style="color: #333; font-size: 16px; line-height: 1.6;">
            Thank you for registering with Virtual Card Provider. To complete your registration, please verify your email address by clicking the button below.
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" 
               style="display: inline-block; padding: 12px 30px; background-color: #1976d2; color: white; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px;">
              Verify Email Address
            </a>
          </div>
          <p style="color: #666; font-size: 14px; line-height: 1.6;">
            If the button doesn't work, copy and paste this link into your browser:
          </p>
          <p style="color: #1976d2; font-size: 12px; word-break: break-all;">
            ${verificationUrl}
          </p>
          <p style="color: #999; font-size: 12px; margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px;">
            This verification link will expire in 24 hours. If you didn't create an account, please ignore this email.
          </p>
        </div>
      </div>
      `
    );

    return res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: {
        user: {
          id: result.insertId,
          email,
          country_code,
          phone: phone || null,
          first_name,
          last_name
        },
        token
      }
    });

  } catch (error) {
    console.error('REGISTER ERROR:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during registration',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Login user
// @route   POST /api/v1/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log('🔐 Login attempt for:', email);

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    // Find user
    const [users] = await db.query(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      console.log('❌ User not found:', email);
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    const user = users[0];
    console.log('✅ User found:', email, 'ID:', user.id);

    // Check if user has password (not OAuth-only)
    if (!user.password_hash) {
      console.log('⚠️ User has no password hash (OAuth account):', email);
      return res.status(401).json({
        success: false,
        message: 'This account uses social login. Please use Google login.'
      });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      console.log('❌ Invalid password for user:', email);
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    console.log('✅ Password valid for:', email);

    // Generate token
    const token = generateToken({
      id: user.id,
      role: user.role || 'USER'
    });

    console.log('✅ Token generated for user:', user.id);

    // Prepare user data to send - ✅ FIXED: Include wallet_balance
    const userData = {
      id: user.id,
      email: user.email,
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      phone: user.phone || null,
      country_code: user.country_code || '+237',
      wallet_balance: parseFloat(user.wallet_balance) || 0,  // ✅ ADD THIS
      is_verified: Boolean(user.is_verified),
      role: user.role || 'USER',
      created_at: user.created_at
    };

    console.log('✅ Login successful for:', email, 'Balance:', userData.wallet_balance);

    // ✅ FIXED: Return proper response structure with success and data wrapper
    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: userData,
        token: token
      }
    });

  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Forgot password
// @route   POST /api/v1/auth/forgot-password
// @access  Public
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    // Find user
    const [users] = await db.query(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      // Don't reveal that user doesn't exist for security
      return res.json({
        success: true,
        message: 'If an account exists with this email, you will receive a password reset link'
      });
    }

    // Generate reset token
    const resetToken = generateRandomToken();

    // Save reset token
    await db.query(
      'UPDATE users SET reset_token = ?, reset_token_expires = DATE_ADD(NOW(), INTERVAL 1 HOUR) WHERE email = ?',
      [resetToken, email]
    );

    // Send reset email
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;

    const emailSent = await sendEmail(
      email,
      'Password Reset Request - Virtual Card Provider',
      `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
        <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <h1 style="color: #1976d2; margin-top: 0;">Password Reset Request</h1>
          <p style="color: #333; font-size: 16px; line-height: 1.6;">
            You requested a password reset. Click the button below to reset your password:
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" 
               style="display: inline-block; padding: 12px 30px; background-color: #1976d2; color: white; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px;">
              Reset Password
            </a>
          </div>
          <p style="color: #666; font-size: 14px; line-height: 1.6;">
            If the button doesn't work, copy and paste this link into your browser:
          </p>
          <p style="color: #1976d2; font-size: 12px; word-break: break-all;">
            ${resetUrl}
          </p>
          <p style="color: #999; font-size: 12px; margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px;">
            This link will expire in 1 hour. If you didn't request a password reset, please ignore this email.
          </p>
        </div>
      </div>
      `
    );

    if (!emailSent) {
      console.error('Failed to send password reset email to:', email);
      return res.status(500).json({
        success: false,
        message: 'Failed to send password reset email. Please try again later.'
      });
    }

    res.json({
      success: true,
      message: 'Password reset email sent'
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing request'
    });
  }
};

// @desc    Reset password
// @route   POST /api/v1/auth/reset-password
// @access  Public
exports.resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    // Verify token
    const [users] = await db.query(
      'SELECT id FROM users WHERE reset_token = ? AND reset_token_expires > NOW()',
      [token]
    );

    if (users.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token'
      });
    }

    const user = users[0];

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, 12);

    // Update password and clear reset token
    await db.query(
      'UPDATE users SET password_hash = ?, reset_token = NULL, reset_token_expires = NULL WHERE id = ?',
      [passwordHash, user.id]
    );

    res.json({
      success: true,
      message: 'Password has been reset successfully'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Error resetting password'
    });
  }
};

// @desc    Get current user
// @route   GET /api/v1/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    // User is already attached by authMiddleware
    res.json({
      success: true,
      data: { user: req.user }
    });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user data'
    });
  }
};

// @desc    Logout user
// @route   POST /api/v1/auth/logout
// @access  Private
exports.logout = async (req, res) => {
  try {
    // In JWT, logout is handled client-side by removing the token
    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Error logging out'
    });
  }
};

// @desc    Update user profile
// @route   PUT /api/v1/auth/update-profile
// @access  Private
exports.updateProfile = async (req, res) => {
  try {
    const { first_name, last_name, phone, country_code } = req.body;
    const userId = req.user.id;

    // Update user profile
    await db.query(
      `UPDATE users 
       SET first_name = ?, last_name = ?, phone = ?, country_code = ?, updated_at = NOW()
       WHERE id = ?`,
      [first_name, last_name, phone || null, country_code || '+237', userId]
    );

    // Fetch updated user data
    const [users] = await db.query(
      `SELECT id, email, first_name, last_name, phone, country_code, 
              wallet_balance, is_verified, role, created_at
       FROM users WHERE id = ?`,
      [userId]
    );

    const updatedUser = users[0];

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: { user: updatedUser }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating profile'
    });
  }
};

// @desc    Verify email
// @route   GET /api/v1/auth/verify-email
// @access  Public
exports.verifyEmail = async (req, res) => {
  try {
    const { token } = req.query;

    const [users] = await db.query(
      'SELECT id, email FROM users WHERE verification_token = ?',
      [token]
    );

    if (users.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid verification token'
      });
    }

    const user = users[0];

    await db.query(
      'UPDATE users SET is_verified = 1, verification_token = NULL WHERE id = ?',
      [user.id]
    );

    await sendEmail(
      user.email,
      'Email Verified Successfully - Virtual Card Provider',
      `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
        <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <h1 style="color: #1976d2; margin-top: 0;">✅ Email Verified Successfully!</h1>
          <p style="color: #333; font-size: 16px; line-height: 1.6;">
            Congratulations! Your email address has been successfully verified. You now have full access to all features of our Virtual Card Provider platform.
          </p>
          <div style="background-color: #e3f2fd; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="color: #1976d2; margin: 0; font-weight: bold;">What's next?</p>
            <ul style="color: #555; margin: 10px 0 0 20px;">
              <li>Fund your wallet</li>
              <li>Create virtual cards</li>
              <li>Make secure online payments</li>
              <li>Track your transactions</li>
            </ul>
          </div>
          <p style="color: #999; font-size: 12px; margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px;">
            Thank you for choosing Virtual Card Provider!
          </p>
        </div>
      </div>
      `
    );

    res.json({
      success: true,
      message: 'Email verified successfully!',
      data: {
        email: user.email,
        verified: true
      }
    });
  } catch (error) {
    console.error('Verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Verification failed'
    });
  }
};

// @desc    Resend verification email
// @route   POST /api/v1/auth/resend-verification
// @access  Private
exports.resendVerification = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Check if already verified
    const [users] = await db.query(
      'SELECT email, is_verified FROM users WHERE id = ?',
      [userId]
    );
    
    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    const user = users[0];
    
    if (user.is_verified) {
      return res.status(400).json({
        success: false,
        message: 'Email is already verified'
      });
    }
    
    // Generate new verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    
    // Update user with new token
    await db.query(
      'UPDATE users SET verification_token = ? WHERE id = ?',
      [verificationToken, userId]
    );

    // Send verification email
    const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?token=${verificationToken}`;

    const emailSent = await sendEmail(
      user.email,
      'Verify Your Email - Virtual Card Provider',
      `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
        <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <h1 style="color: #1976d2; margin-top: 0;">Email Verification</h1>
          <p style="color: #333; font-size: 16px; line-height: 1.6;">
            Please click the button below to verify your email address:
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" 
               style="display: inline-block; padding: 12px 30px; background-color: #1976d2; color: white; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px;">
              Verify Email
            </a>
          </div>
          <p style="color: #666; font-size: 14px; line-height: 1.6;">
            If the button doesn't work, copy and paste this link into your browser:
          </p>
          <p style="color: #1976d2; font-size: 12px; word-break: break-all;">
            ${verificationUrl}
          </p>
          <p style="color: #999; font-size: 12px; margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px;">
            This link will expire in 24 hours. If you didn't request this verification, please ignore this email.
          </p>
        </div>
      </div>
      `
    );

    if (!emailSent) {
      console.error('Failed to send verification email to:', user.email);
      return res.status(500).json({
        success: false,
        message: 'Failed to send verification email. Please try again later.'
      });
    }

    res.json({
      success: true,
      message: 'Verification email sent successfully. Please check your inbox.'
    });
  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to resend verification email. Please try again.'
    });
  }
};

// @desc    Get verification status
// @route   GET /api/v1/auth/verification-status
// @access  Private
exports.getVerificationStatus = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const [users] = await db.query(
      'SELECT is_verified, verification_token FROM users WHERE id = ?',
      [userId]
    );
    
    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    const user = users[0];
    
    res.json({
      success: true,
      data: {
        is_verified: Boolean(user.is_verified),
        has_pending_verification: !!user.verification_token
      }
    });
  } catch (error) {
    console.error('Get verification status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get verification status'
    });
  }
};

// KYC Verification
exports.uploadKYC = async (req, res) => {
  try {
    const { document_type, document_number } = req.body;
    const userId = req.user.id;

    // In production, you would upload files to S3/Cloudinary
    // For now, we'll just store the metadata
    await db.query(
      `INSERT INTO kyc_documents 
       (user_id, document_type, document_number, status)
       VALUES (?, ?, ?, 'pending')`,
      [userId, document_type, document_number]
    );

    res.json({
      success: true,
      message: 'KYC document submitted for review'
    });
  } catch (error) {
    console.error('KYC upload error:', error);
    res.status(500).json({
      success: false,
      message: 'KYC upload failed'
    });
  }
};

// Initialize Google OAuth Strategy
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL,
    passReqToCallback: true
  },
  async (req, accessToken, refreshToken, profile, done) => {
    try {
      // Check if user exists
      const [existingUser] = await db.query(
        'SELECT * FROM users WHERE google_id = ? OR email = ?',
        [profile.id, profile.emails[0].value]
      );

      if (existingUser.length > 0) {
        // Update existing user with Google ID if not already set
        if (!existingUser[0].google_id) {
          await db.query(
            'UPDATE users SET google_id = ? WHERE id = ?',
            [profile.id, existingUser[0].id]
          );
        }
        return done(null, existingUser[0]);
      }

      // Create new user
      const [result] = await db.query(
        `INSERT INTO users 
         (google_id, email, first_name, last_name, is_verified, created_at)
         VALUES (?, ?, ?, ?, 1, NOW())`,
        [
          profile.id,
          profile.emails[0].value,
          profile.name.givenName,
          profile.name.familyName
        ]
      );

      const [newUser] = await db.query(
        'SELECT * FROM users WHERE id = ?',
        [result.insertId]
      );

      return done(null, newUser[0]);
    } catch (error) {
      console.error('Google OAuth error:', error);
      return done(error, null);
    }
  }
));

// Serialize user
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user
passport.deserializeUser(async (id, done) => {
  try {
    const [users] = await db.query('SELECT * FROM users WHERE id = ?', [id]);
    done(null, users[0]);
  } catch (error) {
    done(error, null);
  }
});

// Google OAuth routes
exports.googleAuth = (req, res, next) => {
  // Optional: Save redirect URL in session for after auth
  if (req.query.redirect) {
    req.session.redirectUrl = req.query.redirect;
  }
  
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    accessType: 'offline',
    prompt: 'consent'
  })(req, res, next);
};

exports.googleCallback = (req, res, next) => {
  passport.authenticate('google', {
    failureRedirect: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/login?error=auth_failed`,
    session: false
  }, (err, user) => {
    if (err || !user) {
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/login?error=auth_failed`);
    }

    // Generate JWT token
    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role || 'USER'
    });

    // Redirect to frontend with token
    const redirectUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/oauth/callback?token=${token}&user=${encodeURIComponent(JSON.stringify({
      id: user.id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      is_verified: user.is_verified,
      role: user.role
    }))}`;
    
    res.redirect(redirectUrl);
  })(req, res, next);
};

// Optional: Disconnect Google account
exports.disconnectGoogle = async (req, res) => {
  try {
    const userId = req.user.id;
    
    await db.query(
      'UPDATE users SET google_id = NULL WHERE id = ?',
      [userId]
    );
    
    res.json({
      success: true,
      message: 'Google account disconnected successfully'
    });
  } catch (error) {
    console.error('Disconnect Google error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to disconnect Google account'
    });
  }
};