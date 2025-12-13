import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { isManagerOrHigher } from '@/lib/rbac';
import { Role } from '@prisma/client';
import { runScoringJob } from '@/lib/jobs';
import { prisma } from '@/lib/prisma';

// Vercel Cron uses GET requests with Authorization header
export async function GET(req: NextRequest) {
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return new NextResponse('Unauthorized', { status: 401 });
    }
    return handleCronJob(req, true);
}

export async function POST(req: NextRequest) {
    const cronSecret = process.env.CRON_SECRET;
    const providedSecret = req.headers.get('x-cron-secret');
    const isCronCall = cronSecret && providedSecret === cronSecret;
    const session = isCronCall ? null : await getServerSession(authOptions);
    const hasRole = session?.user && isManagerOrHigher(session.user.role as Role);
    
    if (!isCronCall && !hasRole) {
        return new NextResponse('Unauthorized', { status: 401 });
    }
    if (session && !session.user?.orgId) {
        return new NextResponse('Organization not set for user', { status: 403 });
    }
    
    return handleCronJob(req, isCronCall, session?.user?.orgId);
}

async function handleCronJob(req: NextRequest, isCronCall: boolean, sessionOrgId?: string | null) {
    const started = Date.now();
    try {
        const { searchParams } = new URL(req.url);
        const cycle = searchParams.get('cycle');
        const orgIdParam = searchParams.get('orgId');
        
        // Handle "all" orgs for Vercel Cron
        if (isCronCall && orgIdParam === 'all') {
            const orgs = await prisma.organization.findMany({ select: { id: true } });
            let totalUpdated = 0;
            
            for (const org of orgs) {
                const { updatedCount } = await runScoringJob(org.id, cycle || undefined);
                totalUpdated += updatedCount;
            }
            
            const ms = Date.now() - started;
            console.log('cron:scoring complete (all orgs)', { orgCount: orgs.length, totalUpdated, ms });
            return NextResponse.json({
                success: true,
                message: `Updated scores for ${totalUpdated} objectives across ${orgs.length} organizations`,
                updatedCount: totalUpdated,
                orgCount: orgs.length,
                ms,
            });
        }
        
        // Single org execution
        const orgId = sessionOrgId || orgIdParam;
        if (!orgId) {
            return new NextResponse('Missing orgId for scoring run', { status: 400 });
        }

        const { updatedCount, ms: jobMs } = await runScoringJob(orgId, cycle || undefined);

        const ms = Date.now() - started;
        console.log('cron:scoring complete', { orgId, cycle, updatedCount, ms, jobMs });

        return NextResponse.json({
            success: true,
            message: `Updated scores for ${updatedCount} objectives${cycle ? ` in cycle ${cycle}` : ''}`,
            updatedCount,
            ms,
        });

    } catch (error) {
        console.error('cron/scoring failed', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
