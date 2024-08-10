if(process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const http = require('http');
const https = require('https');
const url = require('url');
const { google } = require('googleapis');
const crypto = require('crypto');
const express = require('express');
const session = require('express-session');

/**
 * To use OAuth2 authentication, we need access to a CLIENT_ID, CLIENT_SECRET, AND REDIRECT_URI.
 * To get these credentials for your application, visit
 * https://console.cloud.google.com/apis/credentials.
 */
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URL
);

// Access scopes for read-only Drive activity.
const scopes = [
  'https://www.googleapis.com/auth/userinfo.profile',
  'https://www.googleapis.com/auth/userinfo.email'
];

let userCredential = null;

async function main() {
  const app = express();

  app.use(session({
    secret: 'your_secure_secret_key', // Replace with a strong secret
    resave: false,
    saveUninitialized: false,
  }));

  // Example on redirecting user to Google's OAuth 2.0 server.
  app.get('/', async (req, res) => {
    // Generate a secure random state value.
    const state = crypto.randomBytes(32).toString('hex');
    // Store state in the session
    req.session.state = state;

    // Generate a url that asks permissions for the Drive activity scope
    const authorizationUrl = oauth2Client.generateAuthUrl({
      // 'online' (default) or 'offline' (gets refresh_token)
      access_type: 'offline',
      /** Pass in the scopes array defined above.
        * Alternatively, if only one scope is needed, you can pass a scope URL as a string */
      scope: scopes,
      // Enable incremental authorization. Recommended as a best practice.
      include_granted_scopes: true,
      // Include the state parameter to reduce the risk of CSRF attacks.
      state: state
    });

    res.redirect(authorizationUrl);
  });

  // Receive the callback from Google's OAuth 2.0 server.
  app.get('/oauth2callback', async (req, res) => {
    // Handle the OAuth 2.0 server response
    let q = url.parse(req.url, true).query;
    let {code} = q;
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Create an OAuth2 client
    const oauth2 = google.oauth2({
      auth: oauth2Client,
      version: 'v2'
    });

    // Fetch the user's profile
    const { data } = await oauth2.userinfo.get();

    console.log(data);
    res.redirect('/loggedIn');
  });

  app.get('/loggedIn', async (req,res) => {
    res.send('<h1>hi</h1>');
  });

  


  const server = http.createServer(app);
  server.listen(3000);
}
main().catch(console.error);