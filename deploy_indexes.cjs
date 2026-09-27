const { execSync } = require('child_process');
const path = require('path');

// Use GOOGLE_APPLICATION_CREDENTIALS env var if set, otherwise fall back to local secret file
const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS
  || path.resolve(__dirname, 'backend/config/serviceAccountKey.json');

const projectId = process.env.FIREBASE_PROJECT_ID || 'codovateprod';

console.log('Deploying Firestore indexes to project:', projectId);
console.log('Using Service Account:', serviceAccountPath);

try {
  execSync(`npx firebase deploy --only firestore:indexes --project ${projectId} --force --non-interactive`, {
    env: {
      ...process.env,
      GOOGLE_APPLICATION_CREDENTIALS: serviceAccountPath
    },
    stdio: 'inherit'
  });
  console.log('Deploy success');
} catch (error) {
  console.error('Deploy failed:', error.message);
}
