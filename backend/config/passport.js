const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');

console.log('Loading config/passport.js');

// Serialize user for session
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// Google OAuth Strategy - only initialize if credentials are available
console.log('GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID ? 'Set' : 'Not set');
console.log('GOOGLE_CLIENT_SECRET:', process.env.GOOGLE_CLIENT_SECRET ? 'Set' : 'Not set');

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(new GoogleStrategy({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL || '/api/auth/google/callback'
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Check if user already exists with this Google ID
        let existingUser = await User.findOne({ googleId: profile.id });

        if (existingUser) {
          return done(null, existingUser);
        }

        // Check if user exists with same email
        existingUser = await User.findOne({ email: profile.emails[0].value });

        if (existingUser) {
          // Link Google account to existing user
          existingUser.googleId = profile.id;
          existingUser.authProvider = 'google';
          existingUser.isVerified = true; // Google accounts are pre-verified
          await existingUser.save();
          return done(null, existingUser);
        }

        // Create new user
        const newUser = await User.create({
          name: profile.displayName,
          email: profile.emails[0].value,
          googleId: profile.id,
          authProvider: 'google',
          avatar: profile.photos[0].value,
          isVerified: true, // Google accounts are pre-verified
          role: 'subscriber' // Default role for new users
        });

        done(null, newUser);
      } catch (error) {
        done(error, null);
      }
    }
  ));
} else {
  console.log('Google OAuth not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables.');
}

module.exports = passport;