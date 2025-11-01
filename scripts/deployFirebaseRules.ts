#!/usr/bin/env tsx

/**
 * Script to deploy Firebase security rules
 * 
 * Usage:
 * npm run deploy-firebase-rules
 */

import { exec } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);

async function deployFirebaseRules() {
  console.log('Deploying Firebase security rules...');
  
  try {
    // Check if Firebase CLI is installed
    await execPromise('npx firebase-tools --version');
    console.log('Firebase CLI found');
  } catch (error) {
    console.error('Firebase CLI not found. Please install it first:');
    console.error('npm install -g firebase-tools');
    process.exit(1);
  }
  
  try {
    // Deploy only Firestore rules (since we're not using Realtime Database)
    console.log('Deploying Firestore rules...');
    const { stdout, stderr } = await execPromise('npx firebase-tools deploy --only firestore:rules');
    
    if (stdout) console.log(stdout);
    if (stderr) console.error(stderr);
    
    console.log('Firestore rules deployed successfully!');
  } catch (error: any) {
    console.error('Error deploying Firestore rules:', error.message);
    console.log('Please manually deploy the rules using the Firebase Console:');
    console.log('1. Go to https://console.firebase.google.com/');
    console.log('2. Select your project "financial-erp-system"');
    console.log('3. Go to Firestore Database > Rules');
    console.log('4. Paste the content of firestore.rules file:');
    console.log('```');
    console.log('rules_version = \'2\';');
    console.log('service cloud.firestore {');
    console.log('  match /databases/{database}/documents {');
    console.log('    // Allow authenticated users to read and write all documents');
    console.log('    match /{document=**} {');
    console.log('      allow read, write: if request.auth != null;');
    console.log('    }');
    console.log('  }');
    console.log('}');
    console.log('```');
    console.log('5. Click "Publish"');
    process.exit(1);
  }
}

// Run the deployment if this script is executed directly
deployFirebaseRules();

export default deployFirebaseRules;