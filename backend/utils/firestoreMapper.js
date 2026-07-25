const mapDoc = (doc) => {
  if (!doc || !doc.exists) return null;
  return {
    id: doc.id,
    ...doc.data()
  };
};

const mapDocs = (snapshot) => {
  if (!snapshot || snapshot.empty) return [];
  return snapshot.docs.map(doc => mapDoc(doc));
};

module.exports = { mapDoc, mapDocs };
