const { admin, getStorage } = require('./config/firebase');

const bucketsToTest = [
  "codovate-784ab.firebasestorage.app",
  "codovate-784ab.appspot.com",
  "codovate-784ab"
];

async function run() {
  console.log("=== CODOVATE FIREBASE STORAGE CORS & DIAGNOSTIC INSPECTOR ===");

  const corsConfiguration = [
    {
      origin: [
        "https://codovate.in",
        "https://www.codovate.in",
        "http://localhost:5173",
        "http://localhost:3000",
        "http://localhost:5000"
      ],
      method: ["GET", "HEAD", "PUT", "POST", "DELETE", "OPTIONS"],
      responseHeader: [
        "Authorization",
        "Content-Type",
        "x-goog-resumable",
        "x-firebase-storage-version",
        "*"
      ],
      maxAgeSeconds: 3600
    }
  ];

  let verifiedBucket = null;

  for (const bName of bucketsToTest) {
    try {
      console.log(`\n🔍 Checking bucket: ${bName}...`);
      const bucket = getStorage().bucket(bName);
      const [exists] = await bucket.exists();
      console.log(`  └─ Bucket "${bName}" exists: ${exists}`);

      if (exists) {
        verifiedBucket = bName;
        console.log(`  └─ Applying CORS configuration to gs://${bName}...`);
        await bucket.setCorsConfiguration(corsConfiguration);
        console.log(`  └─ ✅ Successfully applied CORS configuration to gs://${bName}!`);

        // Test uploading a test file
        const testFile = bucket.file('diagnostics/test.txt');
        await testFile.save('Codovate Storage Test', { contentType: 'text/plain', public: true });
        console.log(`  └─ ✅ Successfully uploaded test file to gs://${bName}/diagnostics/test.txt`);
      }
    } catch (err) {
      console.error(`  └─ ❌ Bucket error for ${bName}:`, err.message);
    }
  }

  if (verifiedBucket) {
    console.log(`\n🎉 VERIFIED ACTIVE STORAGE BUCKET: gs://${verifiedBucket}`);
  } else {
    console.error("\n❌ Could not verify any active storage bucket.");
  }
}

run().then(() => process.exit(0)).catch((err) => {
  console.error(err);
  process.exit(1);
});
