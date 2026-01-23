const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const db = require('../config/database');
const { generateToken } = require('../utils/helpers');
const crypto = require('crypto');

// Check for required environment variables
if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
  console.error('Missing Google OAuth credentials in environment variables');
  console.error('Please add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to your .env file');
  // IMPORTANT: don't crash the whole backend if Google OAuth isn't configured yet.
  // We'll skip registering the Google strategy; non-OAuth auth flows should still work.
}

// Configure Google OAuth Strategy (only if configured)
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/api/v1/auth/google/callback'
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      // Extract user info from Google profile
      const email = profile?.emails?.[0]?.value;
      const firstName = profile?.name?.givenName || '';
      const lastName = profile?.name?.familyName || '';
      const googleId = profile?.id;

      if (!email || !googleId) {
        return done(new Error('Google profile missing required fields'), null);
      }

      // Check if user exists
      const [existingUsers] = await db.query(
        'SELECT * FROM users WHERE email = ? OR google_id = ?',
        [email, googleId]
      );

      if (existingUsers.length > 0) {
        // User exists, update Google ID if needed
        const user = existingUsers[0];
        if (!user.google_id) {
          await db.query(
            'UPDATE users SET google_id = ? WHERE id = ?',
            [googleId, user.id]
          );
        }
        return done(null, user);
      }

      // Create new user
      const [result] = await db.query(
        `INSERT INTO users
         (email, first_name, last_name, google_id, is_verified, password_hash, created_at)
         VALUES (?, ?, ?, ?, 1, ?, NOW())`,
        [email, firstName, lastName, googleId, 'oauth_user_no_password_' + crypto.randomBytes(16).toString('hex')]
      );

      const [newUsers] = await db.query(
        'SELECT * FROM users WHERE id = ?',
        [result.insertId]
      );

      return done(null, newUsers[0]);
    } catch (error) {
      console.error('Google OAuth error:', error);
      return done(error, null);
    }
  }));
}

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const [users] = await db.query('SELECT * FROM users WHERE id = ?', [id]);
    done(null, users[0] || null);
  } catch (error) {
    done(error, null);
  }
});

// Initiate Google OAuth
exports.googleAuth = (req, res, next) => {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    return res.status(501).json({
      success: false,
      message: 'Google OAuth is not configured on the server yet.'
    });
  }
  return passport.authenticate('google', { scope: ['profile', 'email'] })(req, res, next);
};

// Handle Google OAuth callback
exports.googleCallback = async (req, res, next) => {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/login?error=google_oauth_not_configured`);
  }
  passport.authenticate('google', async (err, user) => {
    if (err) {
      console.error('Google OAuth callback error:', err);
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/login?error=oauth_failed`);
    }

    if (!user) {
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/login?error=oauth_failed`);
    }

    try {
      // Generate JWT token
      const token = generateToken({
        id: user.id,
        role: user.role || 'USER'
      });

      // Redirect to frontend with token
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      res.redirect(`${frontendUrl}/auth/google/callback?token=${token}&userId=${user.id}`);
    } catch (error) {
      console.error('Token generation error:', error);
      res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/login?error=token_generation_failed`);
    }
  })(req, res, next);
};

// Handle OAuth login (alternative: direct API call)
exports.googleLogin = async (req, res) => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({
        success: false,
        message: 'Google ID token is required'
      });
    }

    // Verify Google ID token (you would use google-auth-library here)
    // For now, this is a placeholder - you'll need to install google-auth-library
    // and verify the token server-side

    res.status(501).json({
      success: false,
      message: 'Google OAuth login via ID token not yet implemented. Please use OAuth redirect flow.'
    });
  } catch (error) {
    console.error('Google login error:', error);
    res.status(500).json({
      success: false,
      message: 'Google login failed'
    });
  }
};
