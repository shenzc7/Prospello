import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { isAdmin } from '@/lib/rbac'
import { createSuccessResponse, createErrorResponse, errors } from '@/lib/apiError'
import { clearAndSeedDatabase } from '@/lib/seed-util'
import { Role } from '@prisma/client'

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user) {
            return createErrorResponse(errors.unauthorized())
        }

        if (!isAdmin(session.user.role as Role)) {
            return createErrorResponse(errors.forbidden('Only administrators can reset the database'))
        }

        // Perform the reset and seed
        await clearAndSeedDatabase()

        return createSuccessResponse({
            message: 'Database reset and re-seeded successfully with high-quality data'
        })
    } catch (error) {
        console.error('Error resetting database:', error)
        return createErrorResponse(error, {
            operation: 'resetDatabase',
            userId: (await getServerSession(authOptions))?.user?.id,
        })
    }
}
