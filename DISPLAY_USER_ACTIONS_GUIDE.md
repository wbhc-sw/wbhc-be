# Display User Actions in Frontend - Implementation Guide

## Overview
You want to show in the frontend who created/updated InvestorAdmin records. Here are 3 approaches:

---

## Option 1: Query ActivityLog (Already Working!)

**Pros:**
- ✅ Already implemented - no code changes needed
- ✅ Full audit trail (see ALL actions, not just create/update)
- ✅ Can see who did what and when

**Cons:**
- ❌ Requires joining tables
- ❌ More complex frontend queries

### Backend API Endpoint

```typescript
// src/routes/activityLog.ts (NEW FILE)
import { Router, Response, NextFunction } from 'express';
import { prisma } from '../services/database';
import { jwtAuth, requireRole, ROLES_THAT_CAN_READ, AuthRequest } from '../middleware/roleAuth';

const router = Router();

// Get activity logs for a specific InvestorAdmin record
router.get('/resource/:resourceType/:resourceId', jwtAuth, requireRole(ROLES_THAT_CAN_READ), 
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { resourceType, resourceId } = req.params;
      
      const logs = await prisma.activityLog.findMany({
        where: {
          resourceType,
          resourceId,
        },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          action: true,
          username: true,
          userRole: true,
          createdAt: true,
          statusCode: true,
        },
      });
      
      res.json({ success: true, data: logs });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
```

### Frontend Query Example

```javascript
// Get activity logs for InvestorAdmin ID 1308
const response = await fetch('/api/admin/activity-logs/resource/InvestorAdmin/1308', {
  credentials: 'include',
});
const { data } = await response.json();

// data = [
//   { action: 'UPDATE', username: 'john_admin', createdAt: '2024-01-15T12:00:00Z' },
//   { action: 'CREATE', username: 'sarah_creator', createdAt: '2024-01-15T10:00:00Z' }
// ]
```

### Display in UI

```jsx
// React example
<div>
  <p>Created by: {logs.find(l => l.action === 'CREATE')?.username}</p>
  <p>Last updated by: {logs[0]?.username}</p>
  
  <h4>Full History:</h4>
  {logs.map(log => (
    <div key={log.id}>
      {log.username} {log.action}d this on {log.createdAt}
    </div>
  ))}
</div>
```

---

## Option 2: Add createdBy/updatedBy Fields (Recommended for Quick Access)

**Pros:**
- ✅ Simple, fast queries
- ✅ Data is directly on the record (no joins needed)
- ✅ Easy to display in tables

**Cons:**
- ❌ Only tracks creator and last updater (not full history)
- ❌ Requires schema changes

### Step 1: Update Prisma Schema

```prisma
model InvestorAdmin {
  id                  Int      @id @unique @default(autoincrement())
  fullName            String
  phoneNumber         String?
  city                String
  source              String   @default("received")
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt
  emailSentToAdmin    Boolean  @default(false)
  emailSentToInvestor Boolean  @default(false)
  notes               String?
  callingTimes        Int?     @default(0)
  leadStatus          String   @default("new")
  originalInvestorId  String?
  investmentAmount    Float?
  calculatedTotal     Float?
  sharesQuantity      Int?
  companyID           Int?
  msgDate             DateTime?
  company             Company? @relation(fields: [companyID], references: [companyID])
  
  // NEW FIELDS
  createdBy           String?  // User ID who created this record
  updatedBy           String?  // User ID who last updated this record
  
  // Relationships
  createdByUser       User?    @relation("InvestorAdminCreatedBy", fields: [createdBy], references: [id], onDelete: SetNull)
  updatedByUser       User?    @relation("InvestorAdminUpdatedBy", fields: [updatedBy], references: [id], onDelete: SetNull)

  @@index([sharesQuantity])
  @@index([createdAt])
  @@index([leadStatus])
  @@index([companyID])
  @@index([createdBy])
  @@index([updatedBy])
}

model User {
  id          String   @id @default(uuid())
  username    String   @unique
  email       String   @unique
  passwordHash String
  role        String   @default("company_viewer")
  companyId   Int?
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  // Relationships
  company     Company? @relation(fields: [companyId], references: [companyID])
  activityLogs ActivityLog[]
  
  // NEW: InvestorAdmin relationships
  investorAdminsCreated   InvestorAdmin[] @relation("InvestorAdminCreatedBy")
  investorAdminsUpdated   InvestorAdmin[] @relation("InvestorAdminUpdatedBy")
  
  @@index([role])
  @@index([companyId])
  @@index([username])
  @@index([email])
}
```

### Step 2: Update Route Handlers

```typescript
// src/routes/investorAdmin.ts - CREATE endpoint
router.post('/', jwtAuth, requireRole(ROLES_THAT_CAN_CREATE), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    
    // ... existing validation code ...
    
    const lead = await prisma.investorAdmin.create({ 
      data: {
        ...parsed,
        createdBy: user.userId,  // ← ADD THIS
        updatedBy: user.userId,  // ← ADD THIS
      }
    });
    
    res.status(201).json({ success: true, data: lead });
  } catch (err: any) {
    // ... error handling ...
  }
});

// UPDATE endpoint
router.put('/:id', jwtAuth, requireRole(ROLES_THAT_CAN_UPDATE), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const { id } = req.params;
    
    // ... existing validation code ...
    
    const lead = await prisma.investorAdmin.update({ 
      where: { id: numericId }, 
      data: {
        ...parsed,
        updatedBy: user.userId,  // ← ADD THIS
      }
    });
    
    res.status(200).json({ success: true, data: lead });
  } catch (err: any) {
    // ... error handling ...
  }
});
```

### Step 3: Update GET Endpoint to Include User Info

```typescript
// GET /api/admin/investor-admin
router.get('/', jwtAuth, requireRole(ROLES_THAT_CAN_READ), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    // ... existing code ...
    
    const leads = await prisma.investorAdmin.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limitNum,
      include: {
        company: {
          select: {
            name: true
          }
        },
        // ADD THESE:
        createdByUser: {
          select: {
            id: true,
            username: true,
            email: true,
          }
        },
        updatedByUser: {
          select: {
            id: true,
            username: true,
            email: true,
          }
        }
      }
    });
    
    res.status(200).json({ success: true, data: leads });
  } catch (error) {
    next(error);
  }
});
```

### Frontend Display

```jsx
// In your table component
<table>
  <thead>
    <tr>
      <th>Name</th>
      <th>Phone</th>
      <th>Created By</th>
      <th>Last Updated By</th>
    </tr>
  </thead>
  <tbody>
    {leads.map(lead => (
      <tr key={lead.id}>
        <td>{lead.fullName}</td>
        <td>{lead.phoneNumber}</td>
        <td>{lead.createdByUser?.username || 'Unknown'}</td>
        <td>{lead.updatedByUser?.username || 'Unknown'}</td>
      </tr>
    ))}
  </tbody>
</table>
```

---

## Option 3: Hybrid Approach (BEST - Combines Both) ⭐

Use **createdBy/updatedBy** for quick access + **ActivityLog** for full audit trail.

### Benefits
- ✅ Fast queries (createdBy/updatedBy on record)
- ✅ Full audit trail (ActivityLog)
- ✅ Best of both worlds

### When to Use Each

**Use createdBy/updatedBy for:**
- Displaying in tables/lists
- Quick "who created this" queries
- Filtering by creator
- Simple UI needs

**Use ActivityLog for:**
- Full audit trail (all actions)
- Compliance/security reviews
- Detailed activity reports
- "Who did what when" analysis

### Frontend Example

```javascript
// Quick display in table (from InvestorAdmin record)
<td>{lead.createdByUser?.username}</td>

// Detailed audit trail (from ActivityLog)
<button onClick={() => fetchActivityLog(lead.id)}>
  View Full History
</button>

// Modal showing full history
<Modal>
  <h3>Activity History for {lead.fullName}</h3>
  {activityLogs.map(log => (
    <div>
      <strong>{log.username}</strong> {log.action}d this 
      on {log.createdAt}
    </div>
  ))}
</Modal>
```

---

## Quick Start: Implement Option 2 (Recommended)

### 1. Update Schema

```bash
# Add createdBy/updatedBy fields to prisma/schema.prisma
# (See Option 2 above for schema changes)
```

### 2. Run Migration

```bash
npx prisma migrate dev --name add_created_by_updated_by
npx prisma generate
```

### 3. Update Routes

Add `createdBy` and `updatedBy` to POST and PUT handlers (see code above).

### 4. Frontend Query

```javascript
const response = await fetch('/api/admin/investor-admin', {
  credentials: 'include',
});
const { data } = await response.json();

// Each lead now has:
// - createdByUser: { username: 'john_admin' }
// - updatedByUser: { username: 'sarah_admin' }
```

---

## Summary

| Approach | Complexity | Performance | Audit Trail | Recommendation |
|----------|-----------|-------------|-------------|----------------|
| **Option 1** (ActivityLog only) | Medium | Slower | Full | Good for audit-focused apps |
| **Option 2** (createdBy/updatedBy) | Low | Fast | Limited | ⭐ **Best for most cases** |
| **Option 3** (Hybrid) | Medium | Fast | Full | Best for enterprise apps |

---

## My Recommendation

**Start with Option 2** (createdBy/updatedBy) because:
1. Simple to implement
2. Fast queries
3. Easy to display in UI
4. You already have ActivityLog for full audit trail if needed

Later, you can add Option 1 (ActivityLog queries) for detailed history views when needed!

Would you like me to implement Option 2 for you?

