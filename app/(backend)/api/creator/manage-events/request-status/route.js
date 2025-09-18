// app/api/creator/manage-events/request-status/route.js
import { NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { pool } from '@/lib/db'; // ✅ make sure you have db.js that exports pool

export async function GET(req) {
    try {
        // ✅ Get logged-in Clerk user
        const { userId } = getAuth(req);

        if (!userId) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized: No user ID found' },
                { status: 401 }
            );
        }

        // ✅ Fetch user from DB
        const [userRows] = await pool.query(
            `SELECT id, email FROM User WHERE clerkId = ? LIMIT 1`,
            [userId]
        );

        if (userRows.length === 0) {
            return NextResponse.json(
                { success: false, error: 'User not found in database' },
                { status: 404 }
            );
        }

        const { id: creatorId, email: creatorEmail } = userRows[0];

        // ✅ Fetch event requests for this creator
        const [requests] = await pool.query(
            `
            SELECT 
                er.id, 
                er.status, 
                er.createdAt,
                e.id AS eventId,
                e.title,
                e.startDateTime,
                e.endDateTime,
                e.organizer,
                e.venue
            FROM EventRequest er
            JOIN Event e ON er.eventId = e.id
            WHERE er.requestedById = ? AND er.requestedByEmail = ?
            ORDER BY er.createdAt DESC
            `,
            [creatorId, creatorEmail]
        );

        return NextResponse.json({
            success: true,
            count: requests.length,
            requests,
        });

    } catch (error) {
        console.error('🔴 Error fetching event requests:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
