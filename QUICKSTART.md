# Quick Start Guide - Authentication Setup

## Step 1: Firebase Console (5 minutes)

1. Go to https://console.firebase.google.com/
2. Create a new project (or use existing)
3. Enable Authentication:
   - Click "Authentication" → "Get Started"
   - Enable "Email/Password" provider
   - Enable "Google" provider (add support email)
4. Create Firestore Database:
   - Click "Firestore Database" → "Create database"
   - Start in "test mode"
5. Get your config:
   - Click ⚙️ (Settings) → "Project settings"
   - Scroll to "Your apps" → Click Web icon `</>`
   - Copy the config object

## Step 2: Local Setup (2 minutes)

1. Create `.env` file in the `ui` folder:

```bash
cd ui
cp .env.example .env
```

2. Edit `ui/.env` and paste your Firebase values:

```env
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=your-app-id
```

3. Restart the dev server:

```bash
npm run dev
```

## Step 3: Test It! (1 minute)

1. Open http://localhost:5173
2. Click "Sign Up" in the top right
3. Create an account
4. You should see "Welcome, [username]!" in the header

## That's It! 🎉

You now have:

- ✅ User registration with username
- ✅ Email/password login
- ✅ Google sign-in
- ✅ User authentication state
- ✅ Protected user data in Firestore

## Troubleshooting

**"Configuration not found" error?**

- Make sure `.env` file is in the `ui` folder
- Restart the dev server after creating `.env`

**Google sign-in not working?**

- Check you enabled Google provider in Firebase Console
- Add support email in Google provider settings

**Need more help?**

- See [FIREBASE_SETUP.md](FIREBASE_SETUP.md) for detailed instructions
- See [IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md) for technical details
