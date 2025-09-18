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
        { error: "Query parameter q is required" },
        { status: 400 }
      );
    }

    const offset = (page - 1) * limit;

    // Build WHERE clause dynamically
    let whereClause = "WHERE adminApproved = 1";
    let params = [];

    if (query) {
      whereClause += ` AND (
        title LIKE ? OR
        organizer LIKE ? OR
        description LIKE ? OR
        venue LIKE ? OR
        tags LIKE ?
      )`;
      params = Array(5).fill(`%${query}%`);
    }

    // Query events with pagination
    const [events] = await pool.query(
      `SELECT * FROM Event
       ${whereClause}
       ORDER BY startDateTime ASC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

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
        events,
      },
    });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
