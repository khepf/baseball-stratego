# Firebase Authentication Setup Guide

This guide will help you configure Firebase authentication for the Baseball Stratego application.

## Prerequisites

1. A Google/Firebase account
2. Node.js and npm installed

## Firebase Console Setup

### 1. Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" or select an existing project
3. Follow the setup wizard (you can disable Google Analytics if not needed)

### 2. Enable Authentication Methods

1. In your Firebase project, go to **Build** → **Authentication**
2. Click **Get Started** if this is your first time
3. Go to the **Sign-in method** tab
4. Enable the following providers:
   - **Email/Password**: Click on it, toggle "Enable", and save
   - **Google**: Click on it, toggle "Enable", provide a project support email, and save

### 3. Create a Web App

1. In Firebase Console, go to **Project Settings** (gear icon)
2. Scroll down to "Your apps" section
3. Click the **Web** icon (`</>`)
4. Register your app with a nickname (e.g., "Baseball Stratego Web")
5. You'll see your Firebase configuration object - **keep this page open**

### 4. Enable Firestore Database

1. Go to **Build** → **Firestore Database**
2. Click **Create database**
3. Choose **Start in test mode** (for development)
4. Select a location for your database
5. Click **Enable**

⚠️ **Important for Production**: Update Firestore security rules before deploying:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## Local Environment Configuration

### 1. Create Environment File

In the `ui` directory, create a `.env` file (copy from `.env.example`):

```bash
cd ui
cp .env.example .env
```

### 2. Add Your Firebase Configuration

Open the `.env` file and replace the placeholder values with your Firebase config values:

```env
VITE_FIREBASE_API_KEY=your-actual-api-key-here
VITE_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

You can find these values in:

- Firebase Console → Project Settings → General → Your apps → SDK setup and configuration

### 3. Secure Your Environment File

Make sure `.env` is in your `.gitignore` file:

```gitignore
# Environment variables
.env
.env.local
.env.production
```

## Running the Application

1. Install dependencies (if you haven't already):

```bash
npm install
```

2. Start the development server:

```bash
npm run dev
```

3. Open your browser and navigate to the local development URL (usually `http://localhost:5173`)

## Testing Authentication

### Test Email/Password Registration

1. Navigate to `/register`
2. Fill in:
   - Username: Choose a unique username (3-20 characters)
   - Email: Use a valid email address
   - Password: At least 6 characters
3. Click "Sign Up"
4. You should be redirected to the home page as a logged-in user

### Test Google Sign-In

1. Navigate to `/login`
2. Click "Sign in with Google"
3. Select your Google account
4. You should be redirected to the home page as a logged-in user

### Verify in Firebase Console

1. Go to **Authentication** → **Users** tab
2. You should see your newly created user(s) listed

## Firestore Database Structure

The application creates user documents in Firestore with the following structure:

```
users (collection)
  └── {userId} (document)
      ├── uid: string
      ├── email: string
      ├── username: string
      ├── displayName: string | null
      ├── photoURL: string | null
      └── createdAt: string (ISO date)
```

## Troubleshooting

### "Firebase: Error (auth/configuration-not-found)"

- Make sure your `.env` file exists in the `ui` directory
- Verify all environment variables are set correctly
- Restart your development server after changing `.env`

### "Firebase: Error (auth/unauthorized-domain)"

- Go to Firebase Console → Authentication → Settings → Authorized domains
- Add your development domain (e.g., `localhost`)

### Google Sign-In Popup Closes Immediately

- Check browser console for errors
- Verify Google provider is enabled in Firebase Console
- Make sure you've set a support email in the Google provider settings

### User Document Not Created

- Check Firestore rules allow writes
- Verify Firestore database is created and enabled
- Check browser console for any Firestore errors

## Next Steps

- Implement username uniqueness validation
- Add password reset functionality
- Create user profile pages
- Implement leaderboards and high scores
- Add social features (friends, challenges, etc.)

## Security Best Practices

1. **Never commit `.env` files** to version control
2. **Update Firestore security rules** before production deployment
3. **Enable App Check** for additional security (Firebase Console → Build → App Check)
4. **Set up proper CORS** for your production domain
5. **Review and update authentication settings** regularly

## Resources

- [Firebase Authentication Documentation](https://firebase.google.com/docs/auth)
- [Firestore Documentation](https://firebase.google.com/docs/firestore)
- [React Router Documentation](https://reactrouter.com/)
