# Homepage category totals

The category strip uses four Firestore server aggregation queries over `opportunities`: `status == published`, the category's `type`, and `closesAt > Timestamp.now()`. It counts the complete matching collection, independent of catalog page size, and downloads counts rather than all documents. It performs no database writes.

Counts refresh on mount, every 60 seconds, and when the page regains focus/visibility. Failed or unavailable queries show a dash instead of a fabricated zero. Loading is shown explicitly. A valid zero means Firebase returned no matching active published records. Bundled external snapshots are not added to database totals; the Hackathons category total adds its automatically derived directory resource count to its database count. The strip displays one number without sublabels.

Deploy the `opportunities` composite index in `firestore.indexes.json` (status/type/closesAt) before the Hosting release. If the index is building, the count remains unavailable until a later refresh succeeds. Existing read rules continue to enforce the published-only query. No counters or student records need initialization.
