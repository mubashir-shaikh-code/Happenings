import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");

    if (!query) {
      return NextResponse.json(
        { success: false, error: "Query parameter 'q' is required" },
        { status: 400 }
      );
    }

    const offset = (page - 1) * limit;

    // Dynamic WHERE clause
    const whereClause = `
      WHERE adminApproved = 1
      AND (
        title LIKE ? OR
        organizer LIKE ? OR
        description LIKE ? OR
        venue LIKE ? OR
        tags LIKE ?
      )
    `;

    const params = Array(5).fill(`%${query}%`);

    // Fetch paginated events
    const [events] = await pool.query(
      `SELECT * FROM Event ${whereClause} ORDER BY startDateTime ASC LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    // Transform tags and imageUrls
    const transformedEvents = events.map((event) => ({
      ...event,
      tags: event.tags ? event.tags.split(",").map((t) => t.trim()) : [],
      imageUrls: event.imageUrls ? event.imageUrls.split(",").map((u) => u.trim()) : [],
    }));

    // Count total matching events
    const [[{ count }]] = await pool.query(
      `SELECT COUNT(*) as count FROM Event ${whereClause}`,
      params
    );

    const totalPages = Math.ceil(count / limit);

    return NextResponse.json({
      success: true,
      data: {
        pagination: {
          currentPage: page,
          totalPages,
          matchedEvents: count,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1,
          limit,
        },
        events: transformedEvents,
      },
    });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error", message: error.message },
      { status: 500 }
    );
  }
}
