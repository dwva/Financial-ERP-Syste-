# Firebase Integration Guide

## Setup Instructions

1. **Create a Firebase Project:**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Click "Add project" and follow the setup wizard
   - Name your project "Financial-ERP-Sys"

2. **Enable Authentication:**
   - In the Firebase Console, go to "Authentication" > "Sign-in method"
   - Enable "Email/Password" sign-in provider

3. **Enable Firestore Database:**
   - In the Firebase Console, go to "Firestore Database"
   - Click "Create database" and start in "test mode" for development

4. **Register Web App:**
   - In the Firebase Console, click the gear icon > "Project settings"
   - Under "Your apps", click the web icon (</>)
   - Register your app with the name "Financial ERP Sys"
   - Copy the Firebase configuration object

5. **Configure Environment Variables:**
   - Create a `.env` file in the root of your project
   - Copy the contents from `.env.example` and replace with your actual Firebase config values

6. **Install Dependencies:**
   ```bash
   npm install firebase
   ```

## Firebase Configuration

Replace the placeholder values in your `.env` file with your actual Firebase configuration:

```
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

## Data Structure

The application uses the following Firestore collections:

### Employees Collection
```javascript
{
  id: string,
  email: string,
  password: string,
  name: string (optional),
  sector: string (optional),
  age: number (optional),
  status: string (employee|founder|manager|intern) (optional)
}
```

### Expenses Collection
```javascript
{
  id: string,
  userId: string,
  amount: number,
  description: string,
  file: string (base64 or URL),
  fileName: string,
  timestamp: string (YYYY-MM-DD),
  date: string (YYYY-MM-DD),
  company: string,
  sector: string
}
```

### Messages Collection
```javascript
{
  id: string,
  senderId: string,
  senderName: string,
  receiverId: string,
  receiverName: string,
  subject: string,
  content: string,
  fileUrl: string (optional),
  fileName: string (optional),
  timestamp: timestamp,
  read: boolean
}
```

## Security Rules

For development, you can use these basic Firestore rules in the Firebase Console:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

For production, you should implement more specific rules based on user roles and data access patterns.

Alternatively, you can deploy the rules files included in this project:

1. Install Firebase CLI:
   ```bash
   npm install -g firebase-tools
   ```

2. Login to Firebase:
   ```bash
   firebase login
   ```

3. Deploy the rules:
   ```bash
   firebase deploy --only firestore:rules,database:rules,storage:rules
   ```

## Authentication

The application uses Firebase Authentication with email/password sign-in method. The default admin user is:
- Email: admin@company.com
- Password: admin123

## Real-time Updates

The application uses Firebase's real-time capabilities to sync data between users and admin dashboard. When a user adds an expense, it immediately appears in the admin dashboard.

## Deployment

To deploy your application with Firebase:

1. Install Firebase CLI:
   ```bash
   npm install -g firebase-tools
   ```

2. Login to Firebase:
   ```bash
   firebase login
   ```

3. Initialize Firebase in your project:
   ```bash
   firebase init
   ```

4. Deploy your application:
   ```bash
   firebase deploy
   ```

## Verifying Firebase Connection

To confirm that Firebase is properly connected to your project:

1. Check that all environment variables are set correctly in your `.env` file
2. Verify that the Firebase configuration in `src/lib/firebase.ts` matches your project settings
3. Test the connection by running the application and checking the browser console for any Firebase-related errors
4. Try logging in with the default admin credentials (admin@company.com / admin123)
5. Check the Firebase Console to see if data is being written to Firestore when you add expenses or update profiles

If everything is set up correctly, you should see data appearing in your Firebase Console in real-time as users interact with the application.