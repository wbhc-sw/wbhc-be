# Should We Track GET Requests? - Recommendation

## Current GET Endpoints in Your App

Based on your codebase, here are all GET endpoints:

1. `GET /api/admin/users` - List all users (SUPER_ADMIN only)
2. `GET /api/admin/users/:id` - Get user by ID (SUPER_ADMIN only)
3. `GET /api/admin/users/me/profile` - Get current user profile (All authenticated)
4. `GET /api/admin/company` - Get companies (All roles, scoped)
5. `GET /api/admin/company/:companyID` - Get specific company (All roles, scoped)
6. `GET /api/investor-form` - Get investor submissions (All roles, scoped)
7. `GET /api/admin/investor-admin` - Get leads with filters/pagination (All roles, scoped)
8. `GET /api/admin/investor-admin/statistics` - Get statistics (All roles, scoped)
9. `GET /health` - Health check (Public)

---

## Analysis: Pros vs Cons

### ✅ **Pros of Tracking GET Requests**

1. **Complete Audit Trail**
   - Know exactly who accessed what data
   - Important for compliance (GDPR, SOC2, etc.)
   - Security: Track suspicious access patterns

2. **User Behavior Insights** ⭐ **HIGH VALUE**
   - See what users search for (metadata with filters)
   - Understand which data is accessed most
   - Track pagination patterns
   - Identify popular endpoints

3. **Security & Compliance**
   - Audit who viewed sensitive data
   - Track access to user profiles
   - Compliance requirements often need read access logs

4. **Debugging**
   - "User says they can't see data" → Check if they even tried to access it
   - Track failed access attempts (403 errors)

### ❌ **Cons of Tracking GET Requests**

1. **Volume of Logs**
   - GET requests are the most frequent (users browse more than they create)
   - Could generate 10-100x more logs than CREATE/UPDATE
   - Storage costs increase significantly

2. **Performance Overhead**
   - Every GET request = one database write
   - Could slow down read operations
   - Need async logging to avoid blocking

3. **Noise vs Signal**
   - Many GET requests are routine (refreshing pages, auto-refresh)
   - Hard to find important events in the noise
   - Most GET requests aren't "interesting" for audit

4. **Storage Costs**
   - If you have 1000 GET requests/day vs 50 CREATE/UPDATE
   - That's 20x more storage needed

---

## 🎯 **My Recommendation: Selective Tracking**

### **Option 1: Track Important GETs Only** ⭐ **RECOMMENDED**

Track GET requests that are:
- **High value** (contain filters, searches, specific resource access)
- **Security sensitive** (user profiles, admin data)
- **Business critical** (statistics, reports)

**Skip:**
- Simple list views without filters
- Health checks
- Profile views (unless needed for compliance)

### **Implementation Strategy:**

```typescript
// Track these GET endpoints:
✅ GET /api/admin/users/:id          // User access - security sensitive
✅ GET /api/admin/investor-admin      // With filters - HIGH VALUE for metadata
✅ GET /api/admin/investor-admin/statistics  // Business intelligence
✅ GET /api/admin/company/:companyID  // Specific company access

// Skip these:
❌ GET /api/admin/users/me/profile    // Routine, not interesting
❌ GET /api/admin/company             // Simple list, no filters
❌ GET /health                        // System endpoint
```

### **Option 2: Track All GETs with Smart Filtering**

Track all GET requests but:
- Only log if they have query parameters (filters, search)
- Skip if it's a simple list view
- Use a flag to enable/disable per endpoint

```typescript
// Only log GET if:
- Has query parameters (search, filters, pagination)
- OR is accessing a specific resource (/:id)
- OR is a sensitive endpoint (user management)
```

### **Option 3: Track Everything** (Not Recommended)

Track all GET requests:
- ✅ Complete audit trail
- ❌ High storage costs
- ❌ Lots of noise
- ❌ Performance impact

---

## 📊 **Volume Estimation**

Let's estimate log volume:

### Scenario: Medium-sized app
- **10 active users**
- **Each user makes:**
  - 50 GET requests/day (browsing, refreshing)
  - 5 CREATE/UPDATE requests/day
  - 2 DELETE requests/day

### If we track ALL GETs:
- GET logs: 10 users × 50 = **500 logs/day**
- CREATE/UPDATE: 10 users × 5 = **50 logs/day**
- DELETE: 10 users × 2 = **20 logs/day**
- **Total: 570 logs/day = ~17,000 logs/month**

### If we track SELECTIVE GETs (only with filters):
- GET logs: 10 users × 5 (only filtered searches) = **50 logs/day**
- CREATE/UPDATE: 10 users × 5 = **50 logs/day**
- DELETE: 10 users × 2 = **20 logs/day**
- **Total: 120 logs/day = ~3,600 logs/month**

**Storage savings: 80% reduction!** 🎉

---

## 🎯 **Final Recommendation**

### **Track GET Requests Selectively**

**Always Track:**
1. ✅ `GET /api/admin/investor-admin` (with filters) - **HIGH VALUE** for metadata
2. ✅ `GET /api/admin/users/:id` - Security sensitive
3. ✅ `GET /api/admin/investor-admin/statistics` - Business intelligence
4. ✅ Any GET with query parameters (filters, search, pagination)

**Skip:**
1. ❌ `GET /api/admin/users/me/profile` - Routine profile check
2. ❌ `GET /api/admin/company` - Simple list (no filters)
3. ❌ `GET /health` - System endpoint
4. ❌ Simple list views without filters

### **Implementation Logic:**

```typescript
function shouldTrackGetRequest(req: Request): boolean {
  const endpoint = req.path;
  const hasQueryParams = Object.keys(req.query).length > 0;
  const hasResourceId = req.params.id || req.params.companyID;
  
  // Always track if has query params (filters, search)
  if (hasQueryParams) return true;
  
  // Always track if accessing specific resource
  if (hasResourceId) return true;
  
  // Track sensitive endpoints
  if (endpoint.includes('/users/') && endpoint !== '/users/me/profile') {
    return true;
  }
  
  // Track statistics
  if (endpoint.includes('/statistics')) return true;
  
  // Skip simple list views
  return false;
}
```

---

## 💡 **Alternative: Sampling**

If you want to track all GETs but reduce volume:

**Option: Sample GET requests**
- Track 10% of GET requests randomly
- Or track 1 GET per user per hour
- Still get insights without full volume

---

## 📋 **Summary Table**

| Approach | Pros | Cons | Storage Impact | Recommendation |
|----------|------|------|----------------|---------------|
| **Track All GETs** | Complete audit | High volume, noise | High (10-100x) | ❌ Not recommended |
| **Selective Tracking** | Best value, manageable | Need logic | Medium (2-5x) | ✅ **RECOMMENDED** |
| **No GET Tracking** | Low volume | Miss valuable insights | Low (1x) | ⚠️ Miss metadata value |
| **Sampling** | Balance | Complex logic | Medium | ⚠️ Can miss important events |

---

## 🎯 **My Final Answer**

**YES, track GET requests, but SELECTIVELY:**

1. ✅ **Track GETs with filters** - This is where metadata shines!
2. ✅ **Track GETs for specific resources** - Security audit
3. ✅ **Track statistics endpoints** - Business intelligence
4. ❌ **Skip simple list views** - Too noisy, low value

**The metadata field is most valuable for GET requests with filters!**

Example: `GET /api/admin/investor-admin?search=John&status=new`
- This tells you: "User searched for 'John' with status 'new'"
- **This is gold for understanding user behavior!**

---

**Should we implement selective GET tracking?** This gives you the best balance of insights vs. storage costs.

