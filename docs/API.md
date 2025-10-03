# Prospello API Documentation

## Overview

This document describes the REST API endpoints for the Prospello OKR management system. All API endpoints require authentication via NextAuth.js session cookies.

## Base URL

```
https://your-domain.com/api
```

## Authentication

All endpoints require a valid session. Include session cookies in your requests.

## Response Format

All API responses follow this format:

```typescript
{
  ok: boolean,
  data?: any,        // Success response data
  error?: {
    code: string,    // Error code (VALIDATION_ERROR, UNAUTHORIZED, etc.)
    msg: string,     // Human-readable error message
    details?: any    // Additional error details (validation errors, etc.)
  }
}
```

## Error Codes

- `VALIDATION_ERROR` (400) - Request validation failed
- `UNAUTHORIZED` (401) - Authentication required
- `FORBIDDEN` (403) - Insufficient permissions
- `NOT_FOUND` (404) - Resource not found
- `INTERNAL_ERROR` (500) - Server error
- `RATE_LIMIT_EXCEEDED` (429) - Too many requests

## Endpoints

### Objectives

#### GET /api/objectives

List objectives with filtering and pagination.

**Query Parameters:**
- `search` (string) - Search in title and description
- `cycle` (string) - Filter by cycle
- `ownerId` (string) - Filter by owner ID
- `teamId` (string) - Filter by team ID
- `fiscalQuarter` (number) - Filter by fiscal quarter (1-4)
- `status` (ObjectiveStatus) - Filter by status
- `limit` (number) - Number of results (default: 50)
- `offset` (number) - Pagination offset (default: 0)

**Response:**
```typescript
{
  ok: true,
  data: {
    objectives: Array<ObjectiveWithProgress>,
    pagination: {
      total: number,
      limit: number,
      offset: number,
      hasMore: boolean
    }
  }
}
```

#### POST /api/objectives

Create a new objective.

**Request Body:**
```typescript
{
  title: string,
  description?: string,
  cycle: string,
  startAt: string,      // ISO date string
  endAt: string,        // ISO date string
  parentObjectiveId?: string,
  keyResults: Array<{
    title: string,
    weight: number,     // 0-100
    target: number,     // > 0
    current: number,    // >= 0
    unit?: string
  }>
}
```

**Validation Rules:**
- Key result weights must sum to 100
- Start date must be before end date
- Parent objective must be in the same cycle (if provided)
- Maximum 5 key results per objective

#### GET /api/objectives/[id]

Get a specific objective by ID.

**Response:**
```typescript
{
  ok: true,
  data: {
    objective: ObjectiveWithProgress & {
      keyResults: Array<KeyResultWithProgress & {
        initiatives: Array<Initiative>
      }>
    }
  }
}
```

#### PATCH /api/objectives/[id]

Update an objective.

**Request Body:** Same as POST but all fields optional

#### DELETE /api/objectives/[id]

Delete an objective and all its key results.

#### GET /api/objectives/[id]/tree

Get objective hierarchy tree.

#### PATCH /api/objectives/[id]/status

Update objective status.

**Request Body:**
```typescript
{
  status: ObjectiveStatus
}
```

### Key Results

#### GET /api/objectives/[id]/key-results

Get key results for an objective.

#### POST /api/objectives/[id]/key-results

Create key results for an objective.

**Request Body:**
```typescript
{
  keyResults: Array<{
    title: string,
    weight: number,
    target: number,
    current: number,
    unit?: string
  }>
}
```

#### PATCH /api/key-results/[id]

Update a key result.

#### DELETE /api/key-results/[id]

Delete a key result.

#### GET /api/key-results/[id]/initiatives

Get initiatives for a key result.

#### POST /api/key-results/[id]/initiatives

Create an initiative for a key result.

**Request Body:**
```typescript
{
  title: string,
  notes?: string,
  status?: InitiativeStatus
}
```

### Initiatives

#### PATCH /api/initiatives/[id]

Update an initiative.

**Request Body:**
```typescript
{
  title?: string,
  notes?: string,
  status?: InitiativeStatus
}
```

#### DELETE /api/initiatives/[id]

Delete an initiative.

### Check-ins

#### GET /api/check-ins

Get check-in history for the current user.

**Query Parameters:**
- `keyResultId` (string) - Filter by key result
- `limit` (number) - Number of results
- `offset` (number) - Pagination offset

**Response:**
```typescript
{
  ok: true,
  data: {
    checkIns: Array<CheckIn>,
    pagination: {
      total: number,
      limit: number,
      offset: number,
      hasMore: boolean
    }
  }
}
```

#### POST /api/check-ins

Create a check-in for a key result.

**Request Body:**
```typescript
{
  keyResultId: string,
  value: number,        // 0-100
  status: CheckInStatus,
  comment?: string
}
```

**Validation Rules:**
- Value must be between 0-100
- Status must be GREEN, YELLOW, or RED
- User can only check in once per week per key result

### Users (Admin Only)

#### GET /api/admin/users

List all users (admin/manager only).

**Query Parameters:**
- `limit`, `offset` - Pagination

#### PATCH /api/admin/users/[id]

Update user role (admin only).

**Request Body:**
```typescript
{
  role: Role // ADMIN, MANAGER, or EMPLOYEE
}
```

## Data Types

### ObjectiveStatus
- `NOT_STARTED`
- `IN_PROGRESS`
- `AT_RISK`
- `DONE`

### CheckInStatus
- `GREEN`
- `YELLOW`
- `RED`

### InitiativeStatus
- `TODO`
- `DOING`
- `DONE`

### Role
- `ADMIN`
- `MANAGER`
- `EMPLOYEE`

## Progress Calculation

Objective progress is calculated as:
```
Σ((KR.current / KR.target * 100) * (KR.weight / 100))
```

Rounded to the nearest integer.

## Rate Limiting

- 100 requests per minute per IP
- 1000 requests per hour per user

## Examples

### Create Objective with Key Results

```bash
curl -X POST /api/objectives \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Improve User Experience",
    "description": "Enhance the overall user experience across all platforms",
    "cycle": "Q1-2024",
    "startAt": "2024-01-01",
    "endAt": "2024-03-31",
    "keyResults": [
      {
        "title": "Reduce page load time by 50%",
        "weight": 40,
        "target": 2.0,
        "current": 0,
        "unit": "seconds"
      },
      {
        "title": "Increase user satisfaction score",
        "weight": 60,
        "target": 4.5,
        "current": 3.8,
        "unit": "/5"
      }
    ]
  }'
```

### Get Objectives with Filtering

```bash
curl "/api/objectives?cycle=Q1-2024&status=IN_PROGRESS&limit=20"
```

### Create Check-in

```bash
curl -X POST /api/check-ins \
  -H "Content-Type: application/json" \
  -d '{
    "keyResultId": "kr_123",
    "value": 75,
    "status": "GREEN",
    "comment": "Good progress this week!"
  }'
```
