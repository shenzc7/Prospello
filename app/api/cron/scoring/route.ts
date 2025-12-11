import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { isManagerOrHigher } from '@/lib/rbac';
import { ObjectiveStatus, ProgressType, Role } from '@prisma/client';
import { calculateTrafficLightStatus } from '@/lib/utils';

export async function POST(req: NextRequest) {
    const started = Date.now();
    try {
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

        const { searchParams } = new URL(req.url);
        const cycle = searchParams.get('cycle');
        const orgId = searchParams.get('orgId') || session?.user?.orgId;
        if (!orgId) {
            return new NextResponse('Missing orgId for scoring run', { status: 400 });
        }

        // 1. Fetch all objectives for the cycle
        const objectives = await prisma.objective.findMany({
            where: {
                ...(cycle ? { cycle } : {}),
                owner: { orgId },
            },
            include: {
                keyResults: true,
            },
        });

        let updatedCount = 0;

        // 2. Calculate score for each
        for (const obj of objectives) {
            if (!obj.keyResults.length && obj.progressType === ProgressType.AUTOMATIC) continue;

            // Calculate progress 0-100 based on KRs unless manual
            let roundedProgress = obj.progress
            if (obj.progressType === ProgressType.AUTOMATIC) {
                const totalProgress = obj.keyResults.reduce((sum, kr) => {
                    const progressPercent = Math.min(Math.max((kr.current / kr.target) * 100, 0), 100);
                    return sum + (progressPercent * (kr.weight / 100));
                }, 0);
                roundedProgress = Math.round(totalProgress);
            }

            const score = Math.round((roundedProgress / 100) * 100) / 100;
            let status: ObjectiveStatus | undefined = obj.status
            const light = calculateTrafficLightStatus(roundedProgress)
            if (light === 'green') status = ObjectiveStatus.IN_PROGRESS
            if (light === 'yellow') status = ObjectiveStatus.AT_RISK
            if (light === 'red') status = ObjectiveStatus.AT_RISK
            if (roundedProgress >= 95) status = ObjectiveStatus.DONE

            await prisma.objective.update({
                where: { id: obj.id },
                data: { score, progress: roundedProgress, status },
            });
            updatedCount++;
        }

        const ms = Date.now() - started;
        console.log('cron:scoring complete', { orgId, cycle, updatedCount, ms });

        return NextResponse.json({
            success: true,
            message: `Updated scores for ${updatedCount} objectives${cycle ? ` in cycle ${cycle}` : ''}`,
            updatedCount,
            ms,
        });

    } catch (error) {
        console.error('Scoring failed', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
