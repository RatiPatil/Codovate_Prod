const fs = require('fs');

const collections = [
  'users',
  'organizations',
  'colleges',
  'academic_years',
  'students',
  'faculty',
  'mentors',
  'companies',
  'recruiters',
  'opportunities',
  'applications',
  'interviews',
  'offers',
  'placement_records',
  'departments',
  'programs',
  'semesters',
  'events',
  'community_posts',
  'resumeReviews',
  'mockInterviews',
  'achievements',
  'activityLogs',
  'import_history'
];

const indexes = [];

collections.forEach(collection => {
  // QueryEngine default: where(recordStatus) + orderBy(createdAt, desc)
  indexes.push({
    collectionGroup: collection,
    queryScope: "COLLECTION",
    fields: [
      { fieldPath: "recordStatus", order: "ASCENDING" },
      { fieldPath: "createdAt", order: "DESCENDING" }
    ]
  });
  
  // Also add ASCENDING just in case the UI flips the date sort
  indexes.push({
    collectionGroup: collection,
    queryScope: "COLLECTION",
    fields: [
      { fieldPath: "recordStatus", order: "ASCENDING" },
      { fieldPath: "createdAt", order: "ASCENDING" }
    ]
  });
  
  // Specific indexes found in grep
  if (collection === 'events') {
    indexes.push({
      collectionGroup: 'events',
      queryScope: "COLLECTION",
      fields: [
        { fieldPath: "date", order: "ASCENDING" }
      ]
    });
    indexes.push({
      collectionGroup: 'events',
      queryScope: "COLLECTION",
      fields: [
        { fieldPath: "date", order: "DESCENDING" }
      ]
    });
  }
});

// Some additional ones for UID lookups
const uidCollections = ['resumeReviews', 'mockInterviews', 'achievements', 'activityLogs', 'skillAssessments'];
uidCollections.forEach(col => {
  indexes.push({
    collectionGroup: col,
    queryScope: "COLLECTION",
    fields: [
      { fieldPath: "uid", order: "ASCENDING" },
      { fieldPath: "createdAt", order: "DESCENDING" }
    ]
  });
  if (col === 'achievements') {
    indexes.push({
      collectionGroup: col,
      queryScope: "COLLECTION",
      fields: [
        { fieldPath: "uid", order: "ASCENDING" },
        { fieldPath: "earnedAt", order: "DESCENDING" }
      ]
    });
  }
});

// Remove duplicates if any
const uniqueIndexes = Array.from(new Set(indexes.map(JSON.stringify))).map(JSON.parse);

// Write to root firestore.indexes.json
const output = {
  indexes: uniqueIndexes,
  fieldOverrides: []
};

fs.writeFileSync('../firestore.indexes.json', JSON.stringify(output, null, 2));
console.log('Successfully generated ../firestore.indexes.json with', uniqueIndexes.length, 'indexes.');
