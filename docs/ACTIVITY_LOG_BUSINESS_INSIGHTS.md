# 📊 ActivityLog Business Insights & Analytics

## Overview
Your ActivityLog captures rich data that can provide valuable business intelligence. This document outlines all the insights you can extract and how to use them.

---

## 📈 **1. User Productivity & Performance Metrics**

### **1.1 Most Active Users**
**Business Value:** Identify top performers, reward active users, spot inactive accounts

```sql
-- Top 10 most active users (by action count)
SELECT 
  "username",
  "userRole",
  COUNT(*) as total_actions,
  COUNT(CASE WHEN "action" = 'CREATE' THEN 1 END) as creates,
  COUNT(CASE WHEN "action" = 'UPDATE' THEN 1 END) as updates,
  COUNT(CASE WHEN "action" = 'DELETE' THEN 1 END) as deletes
FROM "ActivityLog"
WHERE "createdAt" >= NOW() - INTERVAL '30 days'
GROUP BY "username", "userRole"
ORDER BY total_actions DESC
LIMIT 10;
```

**Insights:**
- Who's creating the most leads?
- Who's updating records most frequently?
- Identify power users vs. occasional users

---

### **1.2 User Activity Timeline**
**Business Value:** Understand work patterns, peak activity times, identify burnout risks

```sql
-- Activity by hour of day
SELECT 
  EXTRACT(HOUR FROM "createdAt") as hour,
  COUNT(*) as action_count,
  COUNT(DISTINCT "userId") as unique_users
FROM "ActivityLog"
WHERE "createdAt" >= NOW() - INTERVAL '7 days'
GROUP BY hour
ORDER BY hour;
```

**Insights:**
- Peak working hours
- After-hours activity (overtime tracking)
- Weekend vs. weekday patterns

---

### **1.3 Actions Per User Per Day/Week/Month**
**Business Value:** Track productivity trends, set performance benchmarks

```sql
-- Daily activity per user
SELECT 
  username,
  DATE("createdAt") as date,
  COUNT(*) as actions_per_day
FROM "ActivityLog"
WHERE "createdAt" >= NOW() - INTERVAL '30 days'
GROUP BY username, DATE("createdAt")
ORDER BY date DESC, actions_per_day DESC;
```

---

## 🏢 **2. Company-Level Analytics**

### **2.1 Company Activity Comparison**
**Business Value:** Compare performance across companies, identify high-performing teams

```sql
-- Activity by company
SELECT 
  c.name as company_name,
  COUNT(*) as total_actions,
  COUNT(DISTINCT al."userId") as active_users,
  COUNT(CASE WHEN al.action = 'CREATE' THEN 1 END) as leads_created,
  COUNT(CASE WHEN al.action = 'UPDATE' THEN 1 END) as records_updated
FROM "ActivityLog" al
JOIN "Company" c ON al."companyId" = c."companyID"
WHERE al."createdAt" >= NOW() - INTERVAL '30 days'
GROUP BY c.name
ORDER BY total_actions DESC;
```

---

### **2.2 Company-Specific User Performance**
**Business Value:** Team performance reviews, identify training needs

```sql
-- Top performers per company
SELECT 
  c.name as company_name,
  al.username,
  COUNT(*) as actions,
  COUNT(CASE WHEN al.action = 'CREATE' THEN 1 END) as creates
FROM "ActivityLog" al
JOIN "Company" c ON al."companyId" = c."companyID"
WHERE al."createdAt" >= NOW() - INTERVAL '30 days'
GROUP BY c.name, al.username
ORDER BY c.name, actions DESC;
```

---

## 📊 **3. Business Operations Insights**

### **3.1 Lead Creation Trends**
**Business Value:** Track growth, identify successful campaigns, forecast capacity

```sql
-- Leads created over time
SELECT 
  DATE("createdAt") as date,
  COUNT(*) as leads_created,
  COUNT(DISTINCT "userId") as creators
FROM "ActivityLog"
WHERE action = 'CREATE' 
  AND "resourceType" = 'InvestorAdmin'
  AND "createdAt" >= NOW() - INTERVAL '90 days'
GROUP BY DATE("createdAt")
ORDER BY date DESC;
```

**Insights:**
- Daily/weekly/monthly growth trends
- Which days are most productive?
- Seasonal patterns

---

### **3.2 Update Frequency Analysis**
**Business Value:** Understand lead management patterns, identify stale records

```sql
-- Records updated multiple times (high engagement)
SELECT 
  "resourceId",
  COUNT(*) as update_count,
  MIN("createdAt") as first_update,
  MAX("createdAt") as last_update,
  COUNT(DISTINCT "userId") as unique_updaters
FROM "ActivityLog"
WHERE action = 'UPDATE' 
  AND "resourceType" = 'InvestorAdmin'
  AND "createdAt" >= NOW() - INTERVAL '30 days'
GROUP BY "resourceId"
HAVING COUNT(*) > 1
ORDER BY update_count DESC
LIMIT 20;
```

**Insights:**
- Which leads are being actively worked on?
- Identify high-value leads (frequent updates)
- Find records that need attention (no updates)

---

### **3.3 Transfer Activity**
**Business Value:** Track investor-to-lead conversions, measure transfer efficiency

```sql
-- Transfer activity
SELECT 
  DATE("createdAt") as date,
  COUNT(*) as transfers,
  COUNT(DISTINCT "userId") as users_transferring
FROM "ActivityLog"
WHERE action = 'TRANSFER'
  AND "createdAt" >= NOW() - INTERVAL '30 days'
GROUP BY DATE("createdAt")
ORDER BY date DESC;
```

---

## 🔍 **4. InvestorAdmin Tracking with Names & Update History**

### **4.1 InvestorAdmin Activity with Names**
**Business Value:** See which InvestorAdmin records were accessed/updated with their actual names

```sql
-- Activity on InvestorAdmin records with full names
SELECT 
  al."resourceId",
  ia."fullName" as investor_name,
  ia."phoneNumber",
  al.action,
  al.username as action_by,
  al."userRole",
  al."createdAt" as action_time,
  al.endpoint
FROM "ActivityLog" al
LEFT JOIN "InvestorAdmin" ia ON al."resourceId" = CAST(ia.id AS TEXT)
WHERE al."resourceType" = 'InvestorAdmin'
  AND al."createdAt" >= NOW() - INTERVAL '30 days'
ORDER BY al."createdAt" DESC;
```

---

### **4.2 InvestorAdmin Update History (Who Updated What)**
**Business Value:** Complete audit trail of who updated each InvestorAdmin record

```sql
-- Full update history for each InvestorAdmin with names
SELECT 
  ia.id as investor_id,
  ia."fullName" as investor_name,
  ia."phoneNumber",
  al.username as updated_by,
  al."userRole" as updater_role,
  al."createdAt" as update_time,
  al."requestBody" as update_data,
  al."ipAddress",
  al.location
FROM "ActivityLog" al
LEFT JOIN "InvestorAdmin" ia ON al."resourceId" = CAST(ia.id AS TEXT)
WHERE al."resourceType" = 'InvestorAdmin'
  AND al.action = 'UPDATE'
  AND al."createdAt" >= NOW() - INTERVAL '30 days'
ORDER BY ia.id, al."createdAt" DESC;
```

---

### **4.3 InvestorAdmin Update Count & Updaters**
**Business Value:** See how many times each InvestorAdmin was updated and by whom

**Note:** The `updatedBy` field in InvestorAdmin stores the **FIRST** person who updated the record, not the last. For the last updater, use `last_updated_by_from_log` from ActivityLog.

```sql
-- Summary: Update count and updaters for each InvestorAdmin
SELECT 
  ia.id as investor_id,
  ia."fullName" as investor_name,
  ia."phoneNumber",
  ia."leadStatus",
  COUNT(al.id) as total_updates,
  MAX(al."createdAt") as last_update_time,
  (SELECT username FROM "ActivityLog" 
   WHERE "resourceId" = CAST(ia.id AS TEXT) 
     AND action = 'UPDATE' 
   ORDER BY "createdAt" DESC LIMIT 1) as last_updated_by_from_log,
  u.username as first_updated_by_user
FROM "InvestorAdmin" ia
LEFT JOIN "ActivityLog" al ON al."resourceId" = CAST(ia.id AS TEXT) 
  AND al.action = 'UPDATE'
  AND al."createdAt" >= NOW() - INTERVAL '30 days'
LEFT JOIN "User" u ON ia."updatedBy" = u.id
GROUP BY ia.id, ia."fullName", ia."phoneNumber", ia."leadStatus", u.username
HAVING COUNT(al.id) > 0
ORDER BY total_updates DESC, last_update_time DESC;
```

---

### **4.4 All Users Who Updated Each InvestorAdmin**
**Business Value:** See the complete list of users who worked on each InvestorAdmin

```sql
-- All users who updated each InvestorAdmin (with names)
SELECT 
  ia.id as investor_id,
  ia."fullName" as investor_name,
  ia."phoneNumber",
  STRING_AGG(DISTINCT al.username, ', ' ORDER BY al.username) as all_updaters,
  COUNT(DISTINCT al.username) as unique_updater_count,
  COUNT(al.id) as total_updates,
  MIN(al."createdAt") as first_update,
  MAX(al."createdAt") as last_update
FROM "InvestorAdmin" ia
LEFT JOIN "ActivityLog" al ON al."resourceId" = CAST(ia.id AS TEXT) 
  AND al.action = 'UPDATE'
  AND al."createdAt" >= NOW() - INTERVAL '30 days'
GROUP BY ia.id, ia."fullName", ia."phoneNumber"
HAVING COUNT(al.id) > 0
ORDER BY total_updates DESC;
```

---

### **4.5 Detailed Update Timeline for Specific InvestorAdmin**
**Business Value:** Complete history of a specific InvestorAdmin record

```sql
-- Replace '123' with the actual InvestorAdmin ID
SELECT 
  ia.id as investor_id,
  ia."fullName" as investor_name,
  al.username as updated_by,
  al."userRole",
  al."createdAt" as update_time,
  al."requestBody"->>'leadStatus' as new_status,
  al."requestBody"->>'notes' as notes_added,
  al."ipAddress",
  al.location
FROM "ActivityLog" al
JOIN "InvestorAdmin" ia ON al."resourceId" = CAST(ia.id AS TEXT)
WHERE ia.id = 123  -- Replace with actual ID
  AND al.action = 'UPDATE'
ORDER BY al."createdAt" DESC;
```

---

## 🔍 **5. Search & Filter Behavior**

### **4.1 Most Common Search Filters**
**Business Value:** Understand what users are looking for, optimize UI, identify data needs

```sql
-- Extract from metadata JSON
SELECT 
  "metadata"->>'filters' as filters_used,
  COUNT(*) as search_count
FROM "ActivityLog"
WHERE action = 'READ'
  AND "endpoint" LIKE '%investor-admin%'
  AND "metadata" IS NOT NULL
  AND "createdAt" >= NOW() - INTERVAL '30 days'
GROUP BY "metadata"->>'filters'
ORDER BY search_count DESC
LIMIT 20;
```

**Insights:**
- Most searched cities
- Most filtered statuses
- Common search terms
- Popular date ranges

---

### **4.2 Search Patterns by User**
**Business Value:** Understand user workflows, identify training opportunities

```sql
-- What each user searches for
SELECT 
  username,
  "metadata"->>'filters' as search_filters,
  COUNT(*) as times_searched
FROM "ActivityLog"
WHERE action = 'READ'
  AND "endpoint" LIKE '%investor-admin%'
  AND "metadata" IS NOT NULL
GROUP BY username, "metadata"->>'filters'
ORDER BY username, times_searched DESC;
```

---

## ⚡ **6. Performance & System Health**

### **5.1 Average Request Duration**
**Business Value:** Monitor system performance, identify slow endpoints

```sql
-- Performance by endpoint
SELECT 
  endpoint,
  AVG(duration) as avg_duration_ms,
  MAX(duration) as max_duration_ms,
  MIN(duration) as min_duration_ms,
  COUNT(*) as request_count
FROM "ActivityLog"
WHERE duration IS NOT NULL
  AND "createdAt" >= NOW() - INTERVAL '7 days'
GROUP BY endpoint
ORDER BY avg_duration_ms DESC;
```

**Insights:**
- Slow endpoints that need optimization
- Performance degradation over time
- Peak load times

---

### **5.2 Error Rate Analysis**
**Business Value:** Identify problematic operations, improve user experience

```sql
-- Error rates by endpoint
SELECT 
  endpoint,
  COUNT(*) as total_requests,
  COUNT(CASE WHEN "statusCode" >= 400 THEN 1 END) as errors,
  ROUND(100.0 * COUNT(CASE WHEN "statusCode" >= 400 THEN 1 END) / COUNT(*), 2) as error_rate_percent
FROM "ActivityLog"
WHERE "createdAt" >= NOW() - INTERVAL '7 days'
GROUP BY endpoint
HAVING COUNT(*) > 10
ORDER BY error_rate_percent DESC;
```

**Insights:**
- Which endpoints fail most often?
- Common error types
- User impact assessment

---

### **5.3 Error Details**
**Business Value:** Debug issues, understand failure patterns

```sql
-- Most common errors
SELECT 
  "errorMessage",
  endpoint,
  COUNT(*) as occurrence_count
FROM "ActivityLog"
WHERE "errorMessage" IS NOT NULL
  AND "createdAt" >= NOW() - INTERVAL '30 days'
GROUP BY "errorMessage", endpoint
ORDER BY occurrence_count DESC
LIMIT 20;
```

---

## 🌍 **7. Geographic & Access Patterns**

### **6.1 Access by Location**
**Business Value:** Understand user distribution, security monitoring

```sql
-- Activity by location
SELECT 
  location,
  COUNT(*) as actions,
  COUNT(DISTINCT "userId") as unique_users,
  COUNT(DISTINCT "ipAddress") as unique_ips
FROM "ActivityLog"
WHERE location IS NOT NULL
  AND "createdAt" >= NOW() - INTERVAL '30 days'
GROUP BY location
ORDER BY actions DESC;
```

**Insights:**
- Where are users accessing from?
- Unusual access patterns (security)
- Remote work patterns

---

### **6.2 Device/Browser Usage**
**Business Value:** Optimize for most-used platforms

```sql
-- User agent analysis
SELECT 
  "userAgent",
  COUNT(*) as usage_count
FROM "ActivityLog"
WHERE "userAgent" IS NOT NULL
  AND "createdAt" >= NOW() - INTERVAL '30 days'
GROUP BY "userAgent"
ORDER BY usage_count DESC
LIMIT 10;
```

---

## 📅 **8. Time-Based Analytics**

### **7.1 Peak Usage Times**
**Business Value:** Plan maintenance windows, optimize resource allocation

```sql
-- Activity by day of week and hour
SELECT 
  TO_CHAR("createdAt", 'Day') as day_of_week,
  EXTRACT(HOUR FROM "createdAt") as hour,
  COUNT(*) as activity_count
FROM "ActivityLog"
WHERE "createdAt" >= NOW() - INTERVAL '30 days'
GROUP BY day_of_week, hour
ORDER BY day_of_week, hour;
```

---

### **7.2 Activity Growth Trends**
**Business Value:** Track business growth, forecast capacity needs

```sql
-- Monthly growth
SELECT 
  TO_CHAR("createdAt", 'YYYY-MM') as month,
  COUNT(*) as total_actions,
  COUNT(DISTINCT "userId") as active_users,
  COUNT(CASE WHEN action = 'CREATE' THEN 1 END) as records_created
FROM "ActivityLog"
WHERE "createdAt" >= NOW() - INTERVAL '12 months'
GROUP BY month
ORDER BY month;
```

---

## 🎯 **9. Action-Specific Insights**

### **8.1 Create vs. Update Ratio**
**Business Value:** Understand workflow balance

```sql
-- Action distribution
SELECT 
  action,
  COUNT(*) as count,
  ROUND(100.0 * COUNT(*) / SUM(COUNT(*)) OVER (), 2) as percentage
FROM "ActivityLog"
WHERE "createdAt" >= NOW() - INTERVAL '30 days'
  AND action IN ('CREATE', 'UPDATE', 'DELETE')
GROUP BY action;
```

**Insights:**
- Are users creating more than updating? (new leads vs. follow-ups)
- Update frequency indicates engagement level

---

### **8.2 Resource Type Activity**
**Business Value:** Understand which entities are most worked with

```sql
-- Activity by resource type
SELECT 
  "resourceType",
  action,
  COUNT(*) as count
FROM "ActivityLog"
WHERE "createdAt" >= NOW() - INTERVAL '30 days'
GROUP BY "resourceType", action
ORDER BY "resourceType", count DESC;
```

---

## 🔐 **10. Security & Compliance**

### **9.1 Failed Access Attempts**
**Business Value:** Security monitoring, identify threats

```sql
-- Failed requests
SELECT 
  username,
  endpoint,
  "statusCode",
  "errorMessage",
  "ipAddress",
  "createdAt"
FROM "ActivityLog"
WHERE "statusCode" >= 400
  AND "createdAt" >= NOW() - INTERVAL '7 days'
ORDER BY "createdAt" DESC;
```

---

### **9.2 User Access Patterns**
**Business Value:** Detect unusual behavior, security audits

```sql
-- Users with unusual activity patterns (summary)
SELECT 
  username,
  COUNT(DISTINCT "ipAddress") as unique_ips,
  COUNT(DISTINCT location) as unique_locations,
  MIN("createdAt") as first_access,
  MAX("createdAt") as last_access
FROM "ActivityLog"
WHERE "createdAt" >= NOW() - INTERVAL '30 days'
GROUP BY username
HAVING COUNT(DISTINCT "ipAddress") > 3  -- Multiple IPs
ORDER BY unique_ips DESC;
```

### **9.3 Detailed IP Addresses and Locations**
**Business Value:** See actual IPs and locations for security audit

```sql
-- Show all distinct IPs and locations per user
SELECT 
  username,
  "ipAddress",
  location,
  COUNT(*) as access_count,
  MIN("createdAt") as first_seen,
  MAX("createdAt") as last_seen
FROM "ActivityLog"
WHERE "createdAt" >= NOW() - INTERVAL '30 days'
  AND "ipAddress" IS NOT NULL
GROUP BY username, "ipAddress", location
ORDER BY username, access_count DESC;
```

### **9.4 IP and Location Details (Array Format)**
**Business Value:** Get all IPs and locations as arrays for each user

```sql
-- Get all IPs and locations as comma-separated lists
SELECT 
  username,
  STRING_AGG(DISTINCT "ipAddress", ', ') as all_ip_addresses,
  STRING_AGG(DISTINCT location, ', ') as all_locations,
  COUNT(DISTINCT "ipAddress") as unique_ip_count,
  COUNT(DISTINCT location) as unique_location_count,
  MIN("createdAt") as first_access,
  MAX("createdAt") as last_access
FROM "ActivityLog"
WHERE "createdAt" >= NOW() - INTERVAL '30 days'
  AND "ipAddress" IS NOT NULL
GROUP BY username
ORDER BY unique_ip_count DESC;
```

---

## 📋 **11. Practical Business Questions You Can Answer**

### **Daily Operations:**
1. ✅ "How many leads did we create today?"
2. ✅ "Who created the most leads this week?"
3. ✅ "Which company is most active?"
4. ✅ "What time of day are we most productive?"

### **Performance Management:**
5. ✅ "Which users need training? (low activity)"
6. ✅ "Who are our top performers?"
7. ✅ "What's the average actions per user per day?"

### **Business Intelligence:**
8. ✅ "Are we growing? (month-over-month trends)"
9. ✅ "What are users searching for most?"
10. ✅ "Which leads get the most attention? (update frequency)"

### **System Health:**
11. ✅ "Are there any slow endpoints?"
12. ✅ "What errors are happening most?"
13. ✅ "When is peak usage time?"

### **Security:**
14. ✅ "Any suspicious access patterns?"
15. ✅ "Who accessed what and when?"
16. ✅ "Any failed login attempts?"

---

## 🚀 **Next Steps: Implementation**

See `ACTIVITY_LOG_ANALYTICS_API.md` for API endpoints that provide these insights programmatically.

---

## 💡 **Pro Tips**

1. **Cache Results:** Some aggregations are expensive - cache daily/weekly stats
2. **Schedule Reports:** Generate weekly/monthly reports automatically
3. **Alerts:** Set up alerts for unusual patterns (errors, security issues)
4. **Dashboards:** Visualize these metrics in a dashboard for stakeholders
5. **Data Retention:** Keep detailed logs for 90 days, aggregate older data

