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
    await execPromise('firebase --version');
    console.log('Firebase CLI found');
  } catch (error) {
    console.error('Firebase CLI not found. Please install it first:');
    console.error('npm install -g firebase-tools');
    process.exit(1);
  }
  
  try {
    // Deploy Firestore, Realtime Database, and Storage rules
    console.log('Deploying Firestore, Realtime Database, and Storage rules...');
    const { stdout, stderr } = await execPromise('firebase deploy --only firestore:rules,database:rules,storage:rules');
    
    if (stdout) console.log(stdout);
    if (stderr) console.error(stderr);
    
    console.log('Firebase rules deployed successfully!');
  } catch (error: any) {
    console.error('Error deploying Firebase rules:', error.message);
    process.exit(1);
  }
}

// Run the deployment if this script is executed directly
deployFirebaseRules();

export default deployFirebaseRules;