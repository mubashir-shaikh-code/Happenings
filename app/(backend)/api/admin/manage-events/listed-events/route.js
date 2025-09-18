import pool from "@/lib/db";

// GET all events for a specific creator
export const GET = async () => {
  try {
    const [events] = await pool.query(
      "SELECT * FROM events WHERE creatorEmail = ? ORDER BY createdAt DESC",
      ["uzairtariq102@gmail.com"]
    );

    return new Response(JSON.stringify(events), { status: 200 });
  } catch (error) {
    console.error("Error fetching listed events:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch events" }), {
      status: 500,
    });
  }
};

// PATCH update an event
export const PATCH = async (request) => {
  try {
    const body = await request.json();
    const { eventId, title, organizer, startDateTime, endDateTime, venue } =
      body;

    // Validate required fields
    if (!eventId || !title || !organizer || !startDateTime || !endDateTime || !venue) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
      });
    }

    // Validate date format
    const startDate = new Date(startDateTime);
    const endDate = new Date(endDateTime);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return new Response(JSON.stringify({ error: "Invalid date format" }), {
        status: 400,
      });
    }

    // Check if event exists
    const [existing] = await pool.query(
      "SELECT id FROM events WHERE id = ?",
      [eventId]
    );

    if (existing.length === 0) {
      return new Response(JSON.stringify({ error: "Event not found" }), {
        status: 404,
      });
    }

    // Update event
    await pool.query(
      `UPDATE events 
       SET title = ?, organizer = ?, startDateTime = ?, endDateTime = ?, venue = ?
       WHERE id = ?`,
      [title, organizer, startDate, endDate, venue, eventId]
    );

    return new Response(
      JSON.stringify({
        success: true,
        message: "Event updated successfully",
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error updating event:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
    });
  }
};

// DELETE an event
export const DELETE = async (request) => {
  try {
    const body = await request.json();
    const { eventId } = body;

    if (!eventId) {
      return new Response(JSON.stringify({ error: "Event ID required" }), {
        status: 400,
      });
    }

    // Check if event exists
    const [existing] = await pool.query(
      "SELECT id FROM events WHERE id = ?",
      [eventId]
    );

    if (existing.length === 0) {
      return new Response(JSON.stringify({ error: "Event not found" }), {
        status: 404,
      });
    }

    // Delete event
    await pool.query("DELETE FROM events WHERE id = ?", [eventId]);

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
