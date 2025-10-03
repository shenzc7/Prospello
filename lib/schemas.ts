import { z } from 'zod'
import { InitiativeStatus, ObjectiveStatus } from '@prisma/client'

// Base schemas for form validation
export const objectiveFormSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  cycle: z.string().min(1, 'Cycle is required'),
  startAt: z.string().refine((date) => !isNaN(Date.parse(date)), 'Invalid start date'),
  endAt: z.string().refine((date) => !isNaN(Date.parse(date)), 'Invalid end date'),
  parentObjectiveId: z.string().optional(),
  keyResults: z.array(z.object({
    title: z.string().min(1, 'KR title is required'),
    weight: z.number().int().min(0).max(100),
    target: z.number().positive('Target must be greater than 0'),
    current: z.number().min(0, 'Current value must be non-negative'),
    unit: z.string().optional(),
  })).min(1, 'At least 1 Key Result is required').max(5, 'Maximum 5 Key Results allowed'),
}).refine((data) => {
  const startDate = new Date(data.startAt)
  const endDate = new Date(data.endAt)
  return startDate < endDate
}, {
  message: 'Start date must be before end date',
  path: ['startAt'],
}).refine((data) => {
  const totalWeight = data.keyResults.reduce((sum, kr) => sum + kr.weight, 0)
  return totalWeight === 100
}, {
  message: 'Key Result weights must sum to 100',
  path: ['keyResults'],
})

export const keyResultFormSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  weight: z.number().int().min(0).max(100),
  target: z.number().positive('Target must be greater than 0'),
  current: z.number().min(0, 'Current value must be non-negative'),
  unit: z.string().optional(),
})

export const initiativeFormSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  status: z.nativeEnum(InitiativeStatus),
})

// API request/response schemas
export const createObjectiveRequestSchema = objectiveFormSchema

export const updateObjectiveRequestSchema = z.object({
  title: z.string().min(1, 'Title is required').optional(),
  description: z.string().optional(),
  cycle: z.string().min(1, 'Cycle is required').optional(),
  startAt: z.string().refine((date) => !isNaN(Date.parse(date)), 'Invalid start date').optional(),
  endAt: z.string().refine((date) => !isNaN(Date.parse(date)), 'Invalid end date').optional(),
  parentObjectiveId: z.string().optional(),
  keyResults: z.array(z.object({
    title: z.string().min(1, 'KR title is required'),
    weight: z.number().int().min(0).max(100),
    target: z.number().positive('Target must be greater than 0'),
    current: z.number().min(0, 'Current value must be non-negative'),
    unit: z.string().optional(),
  })).min(1, 'At least 1 Key Result is required').max(5, 'Maximum 5 Key Results allowed').optional(),
}).refine((data) => {
  // Only validate dates if both are provided
  if (data.startAt && data.endAt) {
    const startDate = new Date(data.startAt)
    const endDate = new Date(data.endAt)
    return startDate < endDate
  }
  return true
}, {
  message: 'Start date must be before end date',
  path: ['startAt'],
}).refine((data) => {
  // Only validate weights if keyResults are provided
  if (data.keyResults) {
    const totalWeight = data.keyResults.reduce((sum, kr) => sum + kr.weight, 0)
    return totalWeight === 100
  }
  return true
}, {
  message: 'Key Result weights must sum to 100',
  path: ['keyResults'],
})

export const updateObjectiveStatusSchema = z.object({
  status: z.nativeEnum(ObjectiveStatus),
})

export const createKeyResultRequestSchema = z.object({
  objectiveId: z.string(),
  keyResults: z.array(keyResultFormSchema).min(1).max(5),
}).refine((data) => {
  const totalWeight = data.keyResults.reduce((sum, kr) => sum + kr.weight, 0)
  return totalWeight === 100
}, {
  message: 'Key Result weights must sum to 100',
  path: ['keyResults'],
})

export const updateKeyResultRequestSchema = keyResultFormSchema.partial()

export const createInitiativeRequestSchema = z.object({
  keyResultId: z.string(),
  title: z.string().min(1, 'Title is required'),
  status: z.nativeEnum(InitiativeStatus),
})

export const updateInitiativeRequestSchema = z.object({
  title: z.string().min(1, 'Title is required').optional(),
  status: z.nativeEnum(InitiativeStatus).optional(),
}).refine((data) => Object.keys(data).length > 0, {
  message: 'At least one field must be provided for update',
})

export const createCheckInRequestSchema = z.object({
  keyResultId: z.string(),
  value: z.number().min(0, 'Value must be non-negative'),
  status: z.enum(['GREEN', 'YELLOW', 'RED']),
  comment: z.string().optional(),
  weekStart: z.string().refine((date) => !isNaN(Date.parse(date)), 'Invalid week start date').optional(),
})

export const listCheckInsQuerySchema = z.object({
  keyResultId: z.string().optional(),
  from: z.string().refine((date) => !isNaN(Date.parse(date)), 'Invalid from date').optional(),
  to: z.string().refine((date) => !isNaN(Date.parse(date)), 'Invalid to date').optional(),
  userId: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(50),
  offset: z.coerce.number().min(0).default(0),
})

// Query parameter schemas
export const listObjectivesQuerySchema = z.object({
  search: z.string().optional(),
  cycle: z.string().optional(),
  ownerId: z.string().optional(),
  teamId: z.string().optional(),
  fiscalQuarter: z.coerce.number().int().min(1).max(4).optional(),
  status: z.nativeEnum(ObjectiveStatus).optional(),
  limit: z.coerce.number().min(1).max(100).default(50),
  offset: z.coerce.number().min(0).default(0),
})

// API Error types
export interface ApiError {
  error: string
  code?: string
  details?: any
}

export interface ValidationError extends ApiError {
  error: 'Validation Error'
  details: z.ZodError['issues']
}

// User API schemas
export const listUsersQuerySchema = z.object({
  search: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(50),
  offset: z.coerce.number().min(0).default(0),
})

export const updateUserRoleSchema = z.object({
  role: z.enum(['ADMIN', 'MANAGER', 'EMPLOYEE']),
})

// Type exports
export type ObjectiveFormData = z.infer<typeof objectiveFormSchema>
export type KeyResultFormData = z.infer<typeof keyResultFormSchema>
export type InitiativeFormData = z.infer<typeof initiativeFormSchema>
export type CreateObjectiveRequest = z.infer<typeof createObjectiveRequestSchema>
export type UpdateObjectiveRequest = z.infer<typeof updateObjectiveRequestSchema>
export type UpdateObjectiveStatusRequest = z.infer<typeof updateObjectiveStatusSchema>
export type CreateKeyResultRequest = z.infer<typeof createKeyResultRequestSchema>
export type UpdateKeyResultRequest = z.infer<typeof updateKeyResultRequestSchema>
export type CreateInitiativeRequest = z.infer<typeof createInitiativeRequestSchema>
export type UpdateInitiativeRequest = z.infer<typeof updateInitiativeRequestSchema>
export type CreateCheckInRequest = z.infer<typeof createCheckInRequestSchema>
export type ListCheckInsQuery = z.infer<typeof listCheckInsQuerySchema>
export type ListObjectivesQuery = z.infer<typeof listObjectivesQuerySchema>
export type ListUsersQuery = z.infer<typeof listUsersQuerySchema>
export type UpdateUserRoleRequest = z.infer<typeof updateUserRoleSchema>
