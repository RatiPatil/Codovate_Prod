/**
 * QueryEngine
 * Handles advanced Firestore querying, filtering, search, and pagination.
 */
class QueryEngine {
  /**
   * Applies filters, scoping, and search to a Firestore query.
   * 
   * @param {Object} query - The initial Firestore query (e.g. db.collection('users'))
   * @param {Object} queryParams - The req.query object from Express
   * @param {Object} userContext - req.dbUser or req.user for scoping
   * @returns {Object} The compiled Firestore query
   */
  static compileQuery(query, queryParams, userContext) {
    let q = query;

    // 1. Mandatory Scope Enforcement (if not a super_admin)
    if (userContext && userContext.role !== 'super_admin') {
      if (userContext.orgId) {
        q = q.where('orgId', '==', userContext.orgId);
      }
      // If strictly bound to a department
      if (userContext.deptId && userContext.role !== 'college_admin' && userContext.role !== 'company_admin') {
        q = q.where('deptId', '==', userContext.deptId);
      }
    }

    // 2. Soft Delete Filter (default hides deleted and archived)
    const statusFilter = queryParams.status;
    if (statusFilter) {
      q = q.where('recordStatus', '==', statusFilter);
    } else {
      q = q.where('recordStatus', 'in', ['ACTIVE', 'RESTORED']);
    }

    // 3. Text Search (relies on 'searchKeywords' array populated during save)
    if (queryParams.search) {
      q = q.where('searchKeywords', 'array-contains', queryParams.search.toLowerCase());
    }

    // 4. Date Range Filters
    if (queryParams.startDate) {
      q = q.where('createdAt', '>=', new Date(queryParams.startDate).toISOString());
    }
    if (queryParams.endDate) {
      // Note: Firestore only allows one inequality field. If both search and date are needed, 
      // it might require compound indexes or in-memory filtering.
      q = q.where('createdAt', '<=', new Date(queryParams.endDate).toISOString());
    }

    // 5. Dynamic field filters (e.g., ?role=student&department=engineering)
    const ignoredParams = ['search', 'status', 'startDate', 'endDate', 'limit', 'cursor', 'sort', 'order'];
    for (const [key, value] of Object.entries(queryParams)) {
      if (!ignoredParams.includes(key) && typeof value === 'string') {
        // Basic equality match
        q = q.where(key, '==', value);
      }
    }

    // 6. Sorting
    const sortBy = queryParams.sort || 'createdAt';
    const order = queryParams.order === 'asc' ? 'asc' : 'desc';
    q = q.orderBy(sortBy, order);

    return q;
  }

  /**
   * Generates a searchKeywords array from string fields for basic text search.
   * @param {Object} data 
   * @param {string[]} fieldsToTokenize 
   * @returns {string[]}
   */
  static generateSearchKeywords(data, fieldsToTokenize = ['name', 'email', 'title']) {
    const keywords = new Set();
    fieldsToTokenize.forEach(field => {
      if (data[field] && typeof data[field] === 'string') {
        const val = data[field].toLowerCase();
        // Add full string
        keywords.add(val);
        // Add parts (split by space)
        val.split(/\s+/).forEach(word => {
          if (word.length > 2) keywords.add(word);
        });
      }
    });
    return Array.from(keywords);
  }
}

module.exports = QueryEngine;
