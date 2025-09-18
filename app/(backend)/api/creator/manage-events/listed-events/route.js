import pool from "@/lib/db";

// ✅ GET: Fetch listed events
export const GET = async () => {
  try {
    const [events] = await pool.query(
      `SELECT e.*
       FROM Event e
       JOIN EventRequest r ON e.id = r.eventId
       WHERE e.adminApproved = 1
       ORDER BY r.createdAt DESC`
    );

    return new Response(JSON.stringify(events), { status: 200 });
  } catch (error) {
    console.error("Error fetching listed events:", error);
    return new Response(
      JSON.stringify({ error: "Failed to fetch events" }),
      { status: 500 }
    );
  }
};

// ✅ PATCH: Update an event
export const PATCH = async (request) => {
  try {
    const body = await request.json();
    const { eventId, title, organizer, startDateTime, endDateTime, venue } = body;

    if (!eventId || !title || !organizer || !startDateTime || !endDateTime || !venue) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
      });
    }

    const startDate = new Date(startDateTime);
    const endDate = new Date(endDateTime);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return new Response(JSON.stringify({ error: "Invalid date format" }), {
        status: 400,
      });
    }

    // Check if event exists
    const [existingEvent] = await pool.query(
      "SELECT id FROM Event WHERE id = ?",
      [eventId]
    );

    if (existingEvent.length === 0) {
      return new Response(JSON.stringify({ error: "Event not found" }), {
        status: 404,
      });
    }

    // Update event
    await pool.query(
      `UPDATE Event 
       SET title = ?, organizer = ?, startDateTime = ?, endDateTime = ?, venue = ?
       WHERE id = ?`,
      [title, organizer, startDate, endDate, venue, eventId]
    );

    const [updatedEvent] = await pool.query("SELECT * FROM Event WHERE id = ?", [
      eventId,
    ]);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Event updated successfully",
        event: updatedEvent[0],
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error updating event:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
    });
  }
};

// ✅ DELETE: Delete an event
export const DELETE = async (request) => {
  try {
    const body = await request.json();
    const { eventId } = body;

    // Check if event exists
    const [existingEvent] = await pool.query(
      "SELECT id FROM Event WHERE id = ?",
      [eventId]
    );

    if (existingEvent.length === 0) {
      return new Response(JSON.stringify({ error: "Event not found" }), {
        status: 404,
      });
    }

    await pool.query("DELETE FROM Event WHERE id = ?", [eventId]);

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
