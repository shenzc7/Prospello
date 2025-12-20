import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const userCount = await prisma.user.count();
    console.log(`User count: ${userCount}`);
    if (userCount > 0) {
        const users = await prisma.user.findMany({ take: 5 });
        console.log('Sample users:', users.map(u => u.email));
    }
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
