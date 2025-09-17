import { NextResponse } from 'next/server';
import prisma from "@/lib/prisma";
import { Category } from '@prisma/client';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const query = searchParams.get('q');
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '10');

        if (!query) {
            return NextResponse.json(
                { error: 'Query parameter q is required' },
                { status: 400 }
            );
        }

        const CATEGORIES = Object.values(Category)
        const normalizedTo = query.toUpperCase()

        const offset = (page - 1) * limit;
        const whereConditions = {
            adminApproved: true,
        };

        if (CATEGORIES.includes(normalizedTo)) {
            whereConditions.category = normalizedTo;
        } else {
            whereConditions.OR = [
                { title: { contains: query } },
                { organizer: { contains: query } },
                { description: { contains: query } },
                { venue: { contains: query } },
                { tags: { contains: query } },
            ];
        }

        const [events, matchedEvents] = await Promise.all([
            prisma.event.findMany({
                where: whereConditions,
                orderBy: {
                    startDateTime: 'asc',
                },
                skip: offset,
                take: limit,
            }),
            prisma.event.count({
                where: whereConditions,
            }),
        ]);

        const totalPages = Math.ceil(matchedEvents / limit);
        const hasNextPage = page < totalPages;
        const hasPreviousPage = page > 1;

        return NextResponse.json({
            success: true,
            data: {
                pagination: {
                    currentPage: page,
                    totalPages,
                    matchedEvents,
                    hasNextPage,
                    hasPreviousPage,
                    limit,
                },
                events,
            },
        });

    } catch (error) {
        console.error('Search error:', error);
        return NextResponse.json(
            {
                success: false,
                error: 'Internal server error',
                message: 'Failed to search events'
            },
            { status: 500 }
        );
    }
}