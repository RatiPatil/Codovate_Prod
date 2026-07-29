const { execSync } = require('child_process');
const path = require('path');

const serviceAccountPath = path.resolve(__dirname, 'backend/config/serviceAccountKey.json');
console.log('Using Service Account:', serviceAccountPath);

try {
  const output = execSync('npx firebase deploy --only firestore:indexes --project codovate-784ab --force --non-interactive', {
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
