# Investor Admin API - Pagination & Filters

## Endpoint
`GET /api/admin/investor-admin`

## Query Parameters

### Pagination
- `page` (optional, default: 1) - Page number (minimum: 1)
- `limit` (optional, default: 20) - Items per page (minimum: 1, maximum: 100)

### Filters
- `search` (optional) - Search in fullName and phoneNumber (case-insensitive)
- `status` (optional) - Filter by leadStatus (exact match, use "all" to ignore)
- `city` (optional) - Filter by city (exact match, use "all" to ignore)
- `source` (optional) - Filter by source (exact match, use "all" to ignore)
- `companyID` (optional) - Filter by company ID (exact match, use "all" to ignore, super roles only)

## Response Format

```json
{
  "success": true,
  "data": [...], // Array of leads
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8,
    "hasNextPage": true,
    "hasPreviousPage": false
  }
}
```

## Example Requests

```
GET /api/admin/investor-admin?page=1&limit=20
GET /api/admin/investor-admin?status=new&city=Riyadh&page=2
GET /api/admin/investor-admin?search=john&source=website&page=1&limit=50
```

## Notes
- All filters can be combined
- Filters respect role-based access control
- Company roles are automatically scoped to their company
- Use "all" value to ignore specific filters

