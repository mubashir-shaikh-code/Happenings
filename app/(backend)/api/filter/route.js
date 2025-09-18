// api/filter/route.js
import { NextResponse } from "next/server";
import pool from "@/lib/db"; // <-- make sure lib/db.js exists with mysql2 config

// --- Utility functions ---
const parseDate = (dateString) => {
  if (!dateString) return null;
  const date = new Date(dateString);
  return isNaN(date.getTime()) ? null : date;
};

const getDateRange = (timeFilter, startDate, endDate) => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  switch (timeFilter) {
    case "today":
      return [today, new Date(today.getTime() + 86400000)];
    case "tomorrow":
      const tomorrow = new Date(today.getTime() + 86400000);
      return [tomorrow, new Date(tomorrow.getTime() + 86400000)];
    case "thisWeek":
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay());
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 7);
      return [startOfWeek, endOfWeek];
    case "nextWeek":
      const nextWeekStart = new Date(today);
      nextWeekStart.setDate(today.getDate() - today.getDay() + 7);
      const nextWeekEnd = new Date(nextWeekStart);
      nextWeekEnd.setDate(nextWeekStart.getDate() + 7);
      return [nextWeekStart, nextWeekEnd];
    case "thisMonth":
      return [
        new Date(today.getFullYear(), today.getMonth(), 1),
        new Date(today.getFullYear(), today.getMonth() + 1, 1),
      ];
    case "nextMonth":
      return [
        new Date(today.getFullYear(), today.getMonth() + 1, 1),
        new Date(today.getFullYear(), today.getMonth() + 2, 1),
      ];
    case "custom":
      const customStart = parseDate(startDate);
      const customEnd = parseDate(endDate);
      if (customStart && customEnd) {
        customEnd.setDate(customEnd.getDate() + 1); // include end date
        return [customStart, customEnd];
      }
      return null;
    default:
      return null;
  }
};

const buildSQLFilters = ({ category, tags, timeFilter, startDate, endDate, location, search }) => {
  let whereClauses = ["e.adminApproved = 1"];
  let params = [];

  if (category && category !== "anything") {
    whereClauses.push("e.category = ?");
    params.push(category.toUpperCase());
  }

  if (tags && tags.length > 0) {
    const tagConditions = tags.map(() => "e.tags LIKE ?");
    whereClauses.push("(" + tagConditions.join(" OR ") + ")");
    params.push(...tags.map((t) => `%${t}%`));
  }

  if (timeFilter) {
    const range = getDateRange(timeFilter, startDate, endDate);
    if (range) {
      whereClauses.push("e.startDateTime >= ? AND e.startDateTime < ?");
      params.push(range[0], range[1]);
    }
  }

  if (location) {
    whereClauses.push("e.venue LIKE ?");
    params.push(`%${location}%`);
  }

  if (search) {
    whereClauses.push(
      "(e.title LIKE ? OR e.description LIKE ? OR e.organizer LIKE ? OR e.venue LIKE ?)"
    );
    params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
  }

  return { whereSQL: whereClauses.length ? "WHERE " + whereClauses.join(" AND ") : "", params };
};

// --- GET Handler ---
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams.entries());

    // Parse tags
    if (queryParams.tags) {
      try {
        queryParams.tags = JSON.parse(queryParams.tags);
      } catch {
        queryParams.tags = queryParams.tags.split(",").map((t) => t.trim());
      }
    } else {
      queryParams.tags = [];
    }

    const page = parseInt(queryParams.page || "1");
    const limit = parseInt(queryParams.limit || "20");
    const offset = (page - 1) * limit;

    const { whereSQL, params } = buildSQLFilters(queryParams);

    // Query events
    const [events] = await pool.query(
      `SELECT e.*, u.fullName, u.email 
       FROM Event e
       JOIN User u ON e.creatorId = u.id
       ${whereSQL}
       ORDER BY e.startDateTime ASC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    // Count total
    const [[{ totalCount }]] = await pool.query(
      `SELECT COUNT(*) as totalCount FROM Event e ${whereSQL}`,
      params
    );

    const totalPages = Math.ceil(totalCount / limit);

    const transformedEvents = events.map((event) => ({
      ...event,
      tags: event.tags ? event.tags.split(",").map((t) => t.trim()) : [],
      imageUrls: event.imageUrls ? event.imageUrls.split(",").map((u) => u.trim()) : [],
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
          offset,
        },
        filters: queryParams,
      },
    });
  } catch (error) {
    console.error("Error filtering events (GET):", error);
    return NextResponse.json(
      { success: false, error: "Failed to filter events", message: error.message },
      { status: 500 }
    );
  }
}

// --- POST Handler ---
export async function POST(request) {
  try {
    const body = await request.json();

    // Parse tags
    if (body.tags && typeof body.tags === "string") {
      try {
        body.tags = JSON.parse(body.tags);
      } catch {
        body.tags = body.tags.split(",").map((t) => t.trim());
      }
    } else if (!body.tags) {
      body.tags = [];
    }

    const page = parseInt(body.page || "1");
    const limit = parseInt(body.limit || "20");
    const offset = (page - 1) * limit;

    const { whereSQL, params } = buildSQLFilters(body);

    const [events] = await pool.query(
      `SELECT e.*, u.fullName, u.email 
       FROM Event e
       JOIN User u ON e.creatorId = u.id
       ${whereSQL}
       ORDER BY e.startDateTime ASC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    const [[{ totalCount }]] = await pool.query(
      `SELECT COUNT(*) as totalCount FROM Event e ${whereSQL}`,
      params
    );

    const totalPages = Math.ceil(totalCount / limit);

    const transformedEvents = events.map((event) => ({
      ...event,
      tags: event.tags ? event.tags.split(",").map((t) => t.trim()) : [],
      imageUrls: event.imageUrls ? event.imageUrls.split(",").map((u) => u.trim()) : [],
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
          offset,
        },
        appliedFilters: body,
      },
    });
  } catch (error) {
    console.error("Error filtering events (POST):", error);
    return NextResponse.json(
      { success: false, error: "Failed to filter events", message: error.message },
      { status: 500 }
    );
  }
}
