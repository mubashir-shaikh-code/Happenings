import { NextResponse } from "next/server";
import pool from "@/lib/db";

// GET all pending requests
export async function GET() {
  try {
    const [pending] = await pool.query(
      `SELECT er.id, er.requestedByEmail, er.requestedById, er.status, er.createdAt,
              e.id AS eventId, e.title, e.description, e.startDateTime, e.endDateTime, e.venue, e.adminApproved
       FROM event_requests er
       JOIN events e ON er.eventId = e.id
       WHERE er.status = 'PENDING'
       ORDER BY er.createdAt DESC`
    );

    // format to match Prisma-style nested object
    const formatted = pending.map((row) => ({
      id: row.id,
      requestedByEmail: row.requestedByEmail,
      requestedById: row.requestedById,
      status: row.status,
      createdAt: row.createdAt,
      event: {
        id: row.eventId,
        title: row.title,
        description: row.description,
        startDateTime: row.startDateTime,
        endDateTime: row.endDateTime,
        venue: row.venue,
        adminApproved: row.adminApproved,
      },
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    console.error("GET /admin/pending-requests error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH approve/reject request
export async function PATCH(req) {
  const conn = await pool.getConnection();
  try {
    const body = await req.json();
    const { id, status } = body;

    // Validate required fields
    if (!id || !status) {
      return NextResponse.json(
        { error: "EventRequest ID and status are required" },
        { status: 400 }
      );
    }

    // Check if event request exists
    const [requests] = await conn.query(
      `SELECT er.id, er.status, er.requestedById, e.id AS eventId
       FROM event_requests er
       JOIN events e ON er.eventId = e.id
       WHERE er.id = ?`,
      [id]
    );

    const eventRequest = requests[0];

    if (!eventRequest) {
      return NextResponse.json(
        { error: "Event request not found" },
        { status: 404 }
      );
    }

    if (eventRequest.status !== "PENDING") {
      return NextResponse.json(
        { error: "Event request has already been processed" },
        { status: 400 }
      );
    }

    // Start transaction
    await conn.beginTransaction();

    // Update request status
    await conn.query(
      "UPDATE event_requests SET status = ? WHERE id = ?",
      [status, id]
    );

    // If accepted → approve event + promote user
    if (status === "ACCEPTED") {
      await conn.query(
        "UPDATE events SET adminApproved = true WHERE id = ?",
        [eventRequest.eventId]
      );

      await conn.query(
        "UPDATE users SET role = 'CREATOR' WHERE id = ?",
        [eventRequest.requestedById]
      );
    }

    await conn.commit();

    return NextResponse.json({
      message: `Event request ${status.toLowerCase()} successfully`,
      eventRequestId: id,
      newStatus: status,
    });
  } catch (error) {
    await conn.rollback();
    console.error("PATCH /admin/pending-requests error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  } finally {
    conn.release();
  }
}
