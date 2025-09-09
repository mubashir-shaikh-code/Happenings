// api/filter/route.js
import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

const parseDate = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? null : date;
};

const getDateRange = (timeFilter, startDate, endDate) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    switch (timeFilter) {
        case 'today':
            return {
                gte: today,
                lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
            };

        case 'tomorrow':
            const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
            return {
                gte: tomorrow,
                lt: new Date(tomorrow.getTime() + 24 * 60 * 60 * 1000)
            };

        case 'thisWeek':
            const startOfWeek = new Date(today);
            startOfWeek.setDate(today.getDate() - today.getDay());
            const endOfWeek = new Date(startOfWeek);
            endOfWeek.setDate(startOfWeek.getDate() + 7);
            return { gte: startOfWeek, lt: endOfWeek };

        case 'nextWeek':
            const nextWeekStart = new Date(today);
            nextWeekStart.setDate(today.getDate() - today.getDay() + 7);
            const nextWeekEnd = new Date(nextWeekStart);
            nextWeekEnd.setDate(nextWeekStart.getDate() + 7);
            return { gte: nextWeekStart, lt: nextWeekEnd };

        case 'thisMonth':
            const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
            const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
            return { gte: startOfMonth, lt: endOfMonth };

        case 'nextMonth':
            const nextMonthStart = new Date(today.getFullYear(), today.getMonth() + 1, 1);
            const nextMonthEnd = new Date(today.getFullYear(), today.getMonth() + 2, 1);
            return { gte: nextMonthStart, lt: nextMonthEnd };

        case 'custom':
            const customStart = parseDate(startDate);
            const customEnd = parseDate(endDate);
            const range = {};

            if (customStart) {
                range.gte = customStart;
            }
            if (customEnd) {
                // Add one day to include events on the end date
                const endDateTime = new Date(customEnd);
                endDateTime.setDate(endDateTime.getDate() + 1);
                range.lt = endDateTime;
            }

            return Object.keys(range).length > 0 ? range : null;

        case 'anytime':
        default:
            return null;
    }
};

const buildTagFilter = (tags) => {
    if (!tags || tags.length === 0) return null;
    return {
        OR: tags.map(tag => ({
            tags: {
                contains: tag
            }
        }))
    };
};

const buildEventFilters = (queryParams) => {
    const {
        category,
        tags,
        timeFilter,
        startDate,
        endDate,
        location,
        search,
        page = '1',
        limit = '20'
    } = queryParams;

    const filters = {
        adminApproved: true
    };

    if (category && category !== 'anything') {
        filters.category = category.toUpperCase();
    }

    if (tags) {
        const tagsArray = Array.isArray(tags) ? tags : [tags];
        const tagFilter = buildTagFilter(tagsArray);
        if (tagFilter) {
            filters.AND = filters.AND || [];
            filters.AND.push(tagFilter);
        }
    }

    const dateRange = getDateRange(timeFilter, startDate, endDate);
    if (dateRange) {
        filters.startDateTime = dateRange;
    }

    if (location && location.trim()) {
        filters.venue = {
            contains: location.trim()
        };
    }

    if (search && search.trim()) {
        const searchTerm = search.trim();
        filters.AND = filters.AND || [];
        filters.AND.push({
            OR: [
                { title: { contains: searchTerm } },
                { description: { contains: searchTerm } },
                { organizer: { contains: searchTerm } },
                { venue: { contains: searchTerm } }
            ]
        });
    }

    return { filters, page: parseInt(page), limit: parseInt(limit) };
};

export async function GET(request) {
    try {
        debugger;
        const { searchParams } = new URL(request.url);
        const queryParams = Object.fromEntries(searchParams.entries());

        if (queryParams.tags && typeof queryParams.tags === 'string') {
            try {
                queryParams.tags = JSON.parse(queryParams.tags);
            } catch (e) {
                queryParams.tags = queryParams.tags.split(',').map(tag => tag.trim());
            }
        }

        const { filters, page, limit } = buildEventFilters(queryParams);

        const offset = (page - 1) * limit;

        const [events, totalCount] = await Promise.all([
            prisma.event.findMany({
                where: filters,
                include: {
                    creator: {
                        select: {
                            id: true,
                            fullName: true,
                            email: true,
                        }
                    }
                },
                orderBy: {
                    startDateTime: 'asc'
                },
                skip: offset,
                take: limit
            }),
            prisma.event.count({
                where: filters
            })
        ]);

        const totalPages = Math.ceil(totalCount / limit);
        const hasNextPage = page < totalPages;
        const hasPrevPage = page > 1;

        const transformedEvents = events.map(event => ({
            ...event,
            tags: event.tags ? event.tags.split(',').map(tag => tag.trim()) : [],
            imageUrls: event.imageUrls ? event.imageUrls.split(',').map(url => url.trim()) : []
        }));

        return NextResponse.json({
            success: true,
            data: {
                events: transformedEvents,
                pagination: {
                    currentPage: page,
                    totalPages,
                    totalCount,
                    limit,
                    hasNextPage,
                    hasPrevPage,
                    offset
                },
                filters: queryParams
            }
        });

    } catch (error) {
        console.error('Error filtering events:', error);

        return NextResponse.json(
            {
                success: false,
                error: 'Failed to filter events',
                message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
            },
            { status: 500 }
        );
    }
}

export async function POST(request) {
    try {
        const body = await request.json();
        if (body.tags && typeof body.tags === 'string') {
            try {
                body.tags = JSON.parse(body.tags);
            } catch {
                body.tags = String(body.tags).split(',').map(t => t.trim()).filter(Boolean);
            }
        }
        const { filters, page, limit } = buildEventFilters(body);
        const where = filters;
        const offset = (page - 1) * limit;

        const [events, totalCount] = await Promise.all([
            prisma.event.findMany({
                where,
                include: {
                    creator: {
                        select: {
                            id: true,
                            fullName: true,
                            email: true
                        }
                    }
                },
                orderBy: {
                    startDateTime: 'asc'
                },
                skip: offset,
                take: limit
            }),
            prisma.event.count({
                where
            })
        ]);

        const totalPages = Math.ceil(totalCount / limit);
        const transformedEvents = events.map(event => ({
            ...event,
            tags: event.tags ? event.tags.split(',').map(tag => tag.trim()) : [],
            imageUrls: event.imageUrls ? event.imageUrls.split(',').map(url => url.trim()) : []
        }));

        return NextResponse.json({
            success: true,
            data: {
                events: transformedEvents,
                pagination: {
                    currentPage: page,
                    totalPages,
                    totalCount,
                    limit,
                    hasNextPage: page < totalPages,
                    hasPrevPage: page > 1,
                    offset
                },
                appliedFilters: body
            }
        });

    } catch (error) {
        console.error('Error filtering events:', error);

        return NextResponse.json(
            {
                success: false,
                error: 'Failed to filter events',
                message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
            },
            { status: 500 }
        );
    }
}