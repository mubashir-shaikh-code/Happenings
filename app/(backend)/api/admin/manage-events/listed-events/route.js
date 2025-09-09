// api/admin/manage-events/listed-events/route.js
import prisma from "@/lib/prisma";

export const GET = async () => {
    try {
        const events = await prisma.event.findMany({
            where: {
                creatorEmail: "uzairtariq102@gmail.com",
            },
            orderBy: {
                request: {
                    createdAt: "desc",
                },
            },
        });

        return new Response(JSON.stringify(events), { status: 200 });
    } catch (error) {
        console.error("Error fetching listed events:", error);
        return new Response(JSON.stringify({ error: "Failed to fetch events" }), {
            status: 500,
        });
    }
};

export const PATCH = async (request) => {
    try {

        const body = await request.json();
        const { eventId, title, organizer, startDateTime, endDateTime, venue } = body;

        // Validate required fields
        if (!eventId || !title || !organizer || !startDateTime || !endDateTime || !venue) {
            return new Response(JSON.stringify({ error: "Missing required fields" }), {
                status: 400,
            });
        }

        // Validate date format and logic
        const startDate = new Date(startDateTime);
        const endDate = new Date(endDateTime);

        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
            return new Response(JSON.stringify({ error: "Invalid date format" }), {
                status: 400,
            });
        }

        // Check if event exists and user has permission to edit
        const existingEvent = await prisma.event.findUnique({
            where: { id: eventId },
            select: {
                id: true,
            }
        });

        if (!existingEvent) {
            return new Response(JSON.stringify({ error: "Event not found" }), {
                status: 404,
            });
        }
        // Update event
        const updatedEvent = await prisma.event.update({
            where: { id: eventId },
            data: {
                title: title,
                organizer: organizer,
                startDateTime: startDate,
                endDateTime: endDate,
                venue: venue,
            },
        });

        return new Response(JSON.stringify({
            success: true,
            message: "Event updated successfully",
            event: updatedEvent
        }), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
            }
        });

    } catch (error) {
        console.error("Error updating event:", error);
        return new Response(JSON.stringify({ error: "Internal server error" }), {
            status: 500,
        });
    }
};

export const DELETE = async (request) => {
    try {
        const body = await request.json();
        const { eventId } = body;

        const existingEvent = await prisma.event.findUnique({
            where: { id: eventId },
            select: { id: true },
        });

        await prisma.event.delete({
            where: { id: eventId },
        });

        return new Response(
            JSON.stringify({
                success: true,
                message: "Event deleted successfully",
            }),
            { status: 200, headers: { "Content-Type": "application/json" } }
        );
    } catch (error) {
        console.error("Error deleting event:", error);
        return new Response(
            JSON.stringify({ error: "Internal server error" }),
            { status: 500, headers: { "Content-Type": "application/json" } }
        );
    }
};