// app/api/admin/pending-requests/route.js
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req) {
    try {
        const pending = await prisma.eventRequest.findMany({
            where: { status: 'PENDING' },
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                requestedByEmail: true,
                requestedById: true,
                status: true,
                createdAt: true,
                event: {
                    select: {
                        id: true,
                        title: true,
                        description: true,
                        startDateTime: true,
                        endDateTime: true,
                        venue: true,
                        adminApproved: true,
                    },
                },
            },
        });
        return NextResponse.json(pending);
    } catch (error) {
        console.error('GET /admin/pending-requests error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function PATCH(req) {
    try {
        const body = await req.json();
        const { id, status } = body;

        // Validate required fields
        if (!id || !status) {
            return NextResponse.json(
                { error: 'EventRequest ID and status are required' },
                { status: 400 }
            );
        }

        const eventRequest = await prisma.eventRequest.findUnique({
            where: { id: id },
            select: {
                id: true,
                status: true,
                requestedById: true,
                event: true
            }
        });

        if (!eventRequest) {
            return NextResponse.json(
                { error: 'Event request not found' },
                { status: 404 }
            );
        }

        if (eventRequest.status !== 'PENDING') {
            return NextResponse.json(
                { error: 'Event request has already been processed' },
                { status: 400 }
            );
        }

        const result = await prisma.$transaction(async (tx) => {
            const updatedRequest = await tx.eventRequest.update({
                where: { id: id },
                data: { status: status },
            });

            if (status === 'ACCEPTED') {
                await tx.event.update({
                    where: { id: eventRequest.event.id },
                    data: { adminApproved: true },
                });
            }

            return updatedRequest;
        });

        if (status === 'ACCEPTED') {
            await prisma.user.update({
                where: { id: eventRequest.requestedById },
                data: { role: 'CREATOR' },
            });
        }

        return NextResponse.json({
            message: `Event request ${status.toLowerCase()} successfully`,
            eventRequestId: result.id,
            newStatus: result.status,
        });

    } catch (error) {
        console.error('PATCH /admin/pending-requests error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}