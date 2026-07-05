export const parseDate = (dateVal) => {
  if (!dateVal) return new Date();
  
  // Handle Firestore Timestamp object over JSON
  if (dateVal._seconds !== undefined) {
    return new Date(dateVal._seconds * 1000);
  }
  if (dateVal.seconds !== undefined) {
    return new Date(dateVal.seconds * 1000);
  }
  
  // Handle native Firestore Timestamp
  if (typeof dateVal.toDate === 'function') {
    return dateVal.toDate();
  }
  
  // Handle ISO string or timestamp number
  return new Date(dateVal);
};

export const formatDate = (dateVal, options = {}) => {
  if (!dateVal) return '—';
  try {
    const d = parseDate(dateVal);
    if (isNaN(d.getTime())) return 'Invalid Date';
    return d.toLocaleDateString('en-IN', options);
  } catch (err) {
    return 'Invalid Date';
  }
};

export const formatTime = (dateVal, options = { hour: '2-digit', minute: '2-digit' }) => {
  if (!dateVal) return '—';
  try {
    const d = parseDate(dateVal);
    if (isNaN(d.getTime())) return 'Invalid Time';
    return d.toLocaleTimeString([], options);
  } catch (err) {
    return 'Invalid Time';
  }
};

export const formatDateTime = (dateVal, options = { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) => {
  if (!dateVal) return '—';
  try {
    const d = parseDate(dateVal);
    if (isNaN(d.getTime())) return 'Invalid Date';
    return d.toLocaleString('en-IN', options);
  } catch (err) {
    return 'Invalid Date';
  }
};

export const getISODate = (dateVal) => {
  if (!dateVal) return '';
  try {
    const d = parseDate(dateVal);
    if (isNaN(d.getTime())) return '';
    return d.toISOString().split('T')[0];
  } catch (err) {
    return '';
  }
};
