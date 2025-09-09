// api/creator/manage-events/request-status/route.js
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuth } from '@clerk/nextjs/server';

export async function GET(req) {
    try {
        const { userId } = getAuth(req)

        const user = await prisma.user.findUnique({
            where: {
                clerkId: userId,
            },
            select: {
                id: true,
                email: true,
            },
        });
        if (!user) {
            return NextResponse.json(
                { error: 'User not found in database' },
                { status: 404 }
            );
        }

        const creatorId = user.id;
        const creatorEmail = user.email;

        const requests = await prisma.eventRequest.findMany({
            where: {
                AND: [
                    { requestedById: creatorId },
                    { requestedByEmail: creatorEmail },
                ],
            },
            orderBy: {
                createdAt: 'desc',
            },
            select: {
                id: true,
                status: true,
                createdAt: true,
                event: {
                    select: {
                        id: true,
                        title: true,
                        startDateTime: true,
                        endDateTime: true,
                        organizer: true,
                        venue: true,
                    },
                },
            },
        });

        return NextResponse.json(requests);
    } catch (error) {
        console.error('Error fetching event requests:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}