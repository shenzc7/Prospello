import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { Role } from '@prisma/client'

import { authOptions } from '@/lib/auth'
import { createErrorResponse, createSuccessResponse, errors } from '@/lib/apiError'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return createErrorResponse(errors.unauthorized())

    const role = session.user.role as Role
    if (role === Role.EMPLOYEE) {
      return createErrorResponse(errors.forbidden('Exports are limited to managers and admins.'))
    }

    const body = await req.json().catch(() => ({} as { format?: string; scope?: string }))
    const format = (body.format || 'pdf').toLowerCase()
    const scope = (body.scope || 'company').toLowerCase()

    const exportId = crypto.randomUUID()
    const etaSeconds = 15

    return createSuccessResponse(
      {
        export: {
          id: exportId,
          format,
          scope,
          status: 'queued',
          etaSeconds,
          requestedBy: session.user.email,
        },
      },
      202
    )
  } catch (err) {
    console.error('POST /api/export failed', err)
    return createErrorResponse(err)
  }
}
