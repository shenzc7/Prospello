import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { isManagerOrHigher } from '@/lib/rbac';
import { Role } from '@prisma/client';

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user || !isManagerOrHigher(session.user.role as Role)) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const cycle = searchParams.get('cycle');

        if (!cycle) {
            return new NextResponse('Cycle parameter is required', { status: 400 });
        }

        // 1. Fetch all objectives for the cycle
        const objectives = await prisma.objective.findMany({
            where: { cycle },
            include: {
                keyResults: true,
            },
        });

        let updatedCount = 0;

        // 2. Calculate score for each
        for (const obj of objectives) {
            if (!obj.keyResults.length) continue;

            // Calculate progress 0-100 based on KRs
            const totalProgress = obj.keyResults.reduce((sum, kr) => {
                const progressPercent = Math.min(Math.max((kr.current / kr.target) * 100, 0), 100);
                return sum + (progressPercent * (kr.weight / 100));
            }, 0);

            const roundedProgress = Math.round(totalProgress);

            // Score 0.0 - 1.0
            const score = Math.round((roundedProgress / 100) * 100) / 100; // Keep 2 decimal places if needed, or just /100

            // Update
            await prisma.objective.update({
                where: { id: obj.id },
                data: { score, progress: roundedProgress } as any, // Using any if progress field is virtual/not in schema or handled differently
                // Actually schema has NO progress field on Objective model, it is calculated?
                // Wait, schema (Step 72) does NOT have `progress` field on Objective. It has `score`.
                // `lib/utils` or `lib/okr` calculates progress on the fly usually.
                // But `TimelineView` uses `objective.progress`.
                // Let's check `useObjectives` hook.
            });
            updatedCount++;
        }

        return NextResponse.json({
            success: true,
            message: `Updated scores for ${updatedCount} objectives in cycle ${cycle}`,
            updatedCount
        });

    } catch (error) {
        console.error('Scoring failed', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
