# 📋 Frontend Integration Guidelines: InvestorAdmin History API

## Overview
This document provides integration guidelines for the InvestorAdmin History API endpoint. Use this to integrate the update history feature into your frontend application.

---

## 🎯 **API Endpoint**

**Endpoint:** `GET /api/admin/investor-admin/:id/history`

**Description:** Retrieves the complete update history for a specific InvestorAdmin lead, including creation record and all subsequent updates.

---

## 🔐 **Authentication & Authorization**

### **Requirements:**
- **Authentication:** Required (JWT token via HttpOnly cookie)
- **Authorization:** Requires READ role permission
- **Company Scoping:** Company users can only access their assigned company's leads

### **Access Control:**
- **SUPER roles** (SUPER_ADMIN, SUPER_VIEWER, SUPER_CREATOR): Can access any lead's history
- **COMPANY roles** (COMPANY_ADMIN, COMPANY_VIEWER, COMPANY_CREATOR): Can only access their company's leads
- **Unauthenticated requests:** Will receive 401 Unauthorized

---

## 📤 **Request Format**

### **HTTP Method:** GET

### **URL Structure:**
```
GET /api/admin/investor-admin/{id}/history
```

### **Path Parameters:**
- `id` (required, integer): The InvestorAdmin record ID

### **Headers:**
- Cookies must be enabled and sent automatically (HttpOnly cookie)
- No additional headers required

### **Query Parameters:**
- None

### **Request Body:**
- Not applicable (GET request)

---

## 📥 **Response Format**

### **Success Response (200 OK):**

**Response Structure:**
```json
{
  "success": true,
  "data": {
    "id": number,
    "fullName": string,
    "totalUpdates": number,
    "history": array
  }
}
```

**Data Fields:**
- `id`: InvestorAdmin record ID
- `fullName`: Lead's full name
- `totalUpdates`: Number of UPDATE actions (excludes creation)
- `history`: Array of all actions (creation + updates)

**History Array Items:**

Each item in the `history` array can be one of two types:

**1. Creation Record:**
- `action`: Always "CREATE"
- `createdAt`: ISO 8601 timestamp when record was created
- `createdByUser`: Object with `id` (string) and `username` (string)
- `changes`: Object containing initial data (fullName, phoneNumber, etc.)

**2. Update Record:**
- `action`: Always "UPDATE"
- `updatedAt`: ISO 8601 timestamp when update occurred
- `updatedByUser`: Object with `id` (string) and `username` (string)
- `userRole`: String representing user's role at time of update
- `changes`: Object containing all fields that were updated in that specific update

**Important Notes:**
- History is sorted chronologically (oldest first)
- `changes` object contains only fields that were sent in that specific update request
- If multiple fields were updated in one request, all will appear in `changes`
- If only notes were updated, `changes` will contain only `notes`
- If only status was updated, `changes` will contain only `leadStatus`

---

## ⚠️ **Error Responses**

### **400 Bad Request:**
**When:** Invalid ID format (non-numeric)
**Response:**
```json
{
  "success": false,
  "error": "Invalid ID format"
}
```

### **401 Unauthorized:**
**When:** Missing or invalid authentication token
**Response:**
```json
{
  "success": false,
  "error": "Missing authentication cookie"
}
```
or
```json
{
  "success": false,
  "error": "Invalid or expired token"
}
```

### **403 Forbidden:**
**When:** User doesn't have access to this lead (company scoping)
**Response:**
```json
{
  "success": false,
  "error": "Access denied to this lead"
}
```

### **404 Not Found:**
**When:** Lead doesn't exist
**Response:**
```json
{
  "success": false,
  "error": "Lead not found"
}
```

---

## 📊 **Data Availability**

### **What Data is Available:**

**Always Available:**
- Creation record (always present)
- All updates tracked by ActivityLog
- User information (who created/updated)
- Timestamps for each action
- All fields that were changed in each update

**What's Included in `changes` Object:**
- Any field that was sent in the update request
- Common fields: `leadStatus`, `notes`, `investmentAmount`, `callingTimes`, `fullName`, `phoneNumber`, `city`, `source`, etc.
- Only fields that were actually updated appear in each `changes` object

**Historical Data:**
- History shows all updates that exist in ActivityLog
- If ActivityLog was tracking before this feature, old updates will appear
- If ActivityLog started tracking recently, only recent updates will appear
- Going forward, all new updates will be tracked and appear in history

---

## 🎨 **UI/UX Recommendations**

### **Display Options:**

**1. Timeline View:**
- Show history as a vertical timeline
- Display creation at the top
- Show updates chronologically below
- Use different icons/styling for CREATE vs UPDATE

**2. Table View:**
- Columns: Date/Time, User, Action, Changes
- Sortable by date
- Expandable rows to show full changes object

**3. Summary View:**
- Show totalUpdates count
- Show last updated by and when
- Link to full history modal/page

### **Change Display:**
- Show which fields changed in each update
- Highlight changed values
- Show before/after if needed (requires comparing with previous state)
- Display notes updates prominently
- Show status changes with visual indicators

### **User Information:**
- Display username for each action
- Show user role if relevant
- Consider showing user avatar/initials if available

---

## 🔄 **Integration Flow**

### **Step 1: Authentication**
- Ensure user is logged in
- Cookie authentication is automatic (no manual token handling)

### **Step 2: Get Lead ID**
- User selects/clicks on a lead
- Extract the lead `id` from the lead data

### **Step 3: Fetch History**
- Make GET request to `/api/admin/investor-admin/{id}/history`
- Handle loading state
- Handle errors appropriately

### **Step 4: Display History**
- Parse the history array
- Display in chosen format (timeline, table, etc.)
- Show creation record first
- Show updates in chronological order

---

## 💡 **Best Practices**

### **Performance:**
- Fetch history only when user requests it (lazy loading)
- Don't fetch history for all leads in a list
- Consider caching history for recently viewed leads
- Show loading indicator while fetching

### **Error Handling:**
- Handle 404 gracefully (lead doesn't exist)
- Handle 403 gracefully (access denied - show appropriate message)
- Handle 401 by redirecting to login
- Show user-friendly error messages

### **Data Handling:**
- The `changes` object structure may vary (different fields per update)
- Check if fields exist before displaying
- Handle null/undefined values gracefully
- Format timestamps for user's locale/timezone

### **User Experience:**
- Show "No updates yet" if totalUpdates is 0
- Indicate if history is incomplete (if ActivityLog wasn't tracking from the beginning)
- Allow users to refresh history
- Consider real-time updates if lead is being edited

---

## 🔍 **Understanding the Data**

### **History Array Structure:**
- First item is always the creation record
- Subsequent items are updates in chronological order
- Each update is independent (shows what was changed in that specific request)

### **Changes Object:**
- Contains only fields that were sent in that update
- If user updated only notes, `changes` will have only `notes`
- If user updated multiple fields, `changes` will have all of them
- Field names match the schema (camelCase: `leadStatus`, `investmentAmount`, etc.)

### **User Information:**
- `createdByUser` / `updatedByUser` contains user ID and username
- `userRole` shows the role at the time of update (may have changed since)
- User information may be null if user was deleted

---

## 📱 **Use Cases**

### **1. Lead Detail Page:**
- Show history in a dedicated "History" tab
- Display full timeline of all changes
- Allow filtering by action type

### **2. Quick History Preview:**
- Show last 3 updates in a summary card
- Link to full history page
- Show "Last updated by X on Y"

### **3. Audit Trail:**
- Display complete audit trail for compliance
- Export history if needed
- Show who changed what and when

### **4. Change Tracking:**
- Highlight recent changes
- Show what changed between updates
- Visual diff if needed

---

## 🚨 **Important Considerations**

### **Data Completeness:**
- History depends on ActivityLog tracking
- Older updates may not be available if ActivityLog wasn't tracking
- All new updates will be tracked going forward

### **Performance:**
- History can be large for frequently updated leads
- Consider pagination if history becomes very long
- Current implementation returns all history (no pagination)

### **Real-time Updates:**
- History doesn't update automatically
- Refresh history after making updates
- Consider polling or WebSocket if real-time is needed

### **Field Mapping:**
- Field names in `changes` match the API schema
- Use the same field names for display labels
- Handle new fields gracefully (schema may evolve)

---

## ✅ **Integration Checklist**

- [ ] Implement authentication check before fetching history
- [ ] Handle all error responses (400, 401, 403, 404)
- [ ] Display loading state while fetching
- [ ] Parse and display history array correctly
- [ ] Handle empty history (no updates yet)
- [ ] Format timestamps appropriately
- [ ] Display user information (username)
- [ ] Show changes object fields
- [ ] Handle varying `changes` structure
- [ ] Test with leads that have many updates
- [ ] Test with newly created leads (only creation record)
- [ ] Test company scoping (company users can't see other companies)
- [ ] Test error scenarios

---

## 📞 **Support & Questions**

For technical questions or issues:
- Check the main API documentation
- Review error messages for specific guidance
- Verify authentication and permissions
- Ensure lead ID is valid and accessible

---

*This endpoint provides complete audit trail functionality for InvestorAdmin leads, enabling full transparency and accountability in lead management.*

