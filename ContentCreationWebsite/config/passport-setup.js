/**
 * Passport.js configuration for OAuth providers
 */
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const TwitterStrategy = require('passport-twitter').Strategy;
const dynamoDB = require('../db/dynamodb');
const config = require('./env-config');

// Serialize user to session
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser(async (id, done) => {
  try {
    const user = await dynamoDB.getUserById(id);
    done(null, user);
  } catch (error) {
    console.error('Error deserializing user:', error);
    done(error, null);
  }
});

// Helper function to find or create a user with OAuth
async function findOrCreateOAuthUser(profile, provider) {
  try {
    // Check if user exists with this provider ID
    const existingUserByProviderId = await dynamoDB.getUserByProviderId(provider, profile.id);
    
    if (existingUserByProviderId) {
      console.log(`User found with ${provider} ID: ${profile.id}`);
      return existingUserByProviderId;
    }
    
    // Check if user exists with the same email
    let email = profile.emails && profile.emails[0] && profile.emails[0].value;
    
    if (email) {
      const existingUserByEmail = await dynamoDB.getUserByEmail(email);
      
      if (existingUserByEmail) {
        console.log(`User found with email: ${email} - linking ${provider} account`);
        // Update with provider info
        await dynamoDB.updateUser(existingUserByEmail.id, {
          provider,
          providerId: profile.id
        });
        return { ...existingUserByEmail, provider, providerId: profile.id };
      }
    }
    
    // If we get here, we need to create a new user
    console.log(`Creating new user from ${provider} account`);
    
    // Extract user details from provider profile
    let userData = {
      provider,
      providerId: profile.id,
      email: email || `${profile.id}@${provider}.user`,
      firstName: profile.name?.givenName || profile.displayName?.split(' ')[0] || '',
      lastName: profile.name?.familyName || profile.displayName?.split(' ').slice(1).join(' ') || '',
      profilePicture: profile.photos && profile.photos[0] && profile.photos[0].value
    };
    
    // Create user
    const newUser = await dynamoDB.createUser(userData);
    return newUser;
  } catch (error) {
    console.error('Error in findOrCreateOAuthUser:', error);
    throw error;
  }
}

// Configure Google Strategy
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL || `${config.baseUrl}/auth/google/callback`,
    scope: ['profile', 'email']
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      const user = await findOrCreateOAuthUser(profile, 'google');
      done(null, user);
    } catch (error) {
      done(error, null);
    }
  }));
}

// Configure Facebook Strategy
if (process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET) {
  passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_APP_ID,
    clientSecret: process.env.FACEBOOK_APP_SECRET,
    callbackURL: process.env.FACEBOOK_CALLBACK_URL || `${config.baseUrl}/auth/facebook/callback`,
    profileFields: ['id', 'emails', 'name', 'picture.type(large)']
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      const user = await findOrCreateOAuthUser(profile, 'facebook');
      done(null, user);
    } catch (error) {
      done(error, null);
    }
  }));
}

// Configure Twitter Strategy
if (process.env.TWITTER_API_KEY && process.env.TWITTER_API_SECRET) {
  passport.use(new TwitterStrategy({
    consumerKey: process.env.TWITTER_API_KEY,
    consumerSecret: process.env.TWITTER_API_SECRET,
    callbackURL: process.env.TWITTER_CALLBACK_URL || `${config.baseUrl}/auth/twitter/callback`,
    includeEmail: true
  }, async (token, tokenSecret, profile, done) => {
    try {
      const user = await findOrCreateOAuthUser(profile, 'twitter');
      done(null, user);
    } catch (error) {
      done(error, null);
    }
  }));
}

module.exports = passport;