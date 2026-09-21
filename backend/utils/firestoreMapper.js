function mapDoc(doc) {
  if (!doc) return null;
  if (typeof doc.data === 'function') {
    const data = doc.data() || {};
    return { id: doc.id, ...data };
  }
  if (doc.data && typeof doc.data === 'object') {
    return { id: doc.id, ...doc.data };
  }
  if (typeof doc === 'object') return { ...doc };
  return null;
}

function mapDocs(snapshot) {
  if (!snapshot) return [];
  if (Array.isArray(snapshot)) return snapshot.map(mapDoc).filter(Boolean);
  if (Array.isArray(snapshot.docs)) return snapshot.docs.map(mapDoc).filter(Boolean);
  if (typeof snapshot.forEach === 'function') {
    const result = [];
    snapshot.forEach(doc => {
      const mapped = mapDoc(doc);
      if (mapped) result.push(mapped);
    });
    return result;
  }
  return [];
}

module.exports = { mapDoc, mapDocs };
