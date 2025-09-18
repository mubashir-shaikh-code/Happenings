// app/api/auth/route.js
import { NextResponse } from "next/server";
import { verifyWebhook } from "@clerk/nextjs/webhooks";
import pool from "@/lib/db";

// Map Clerk role to DB enum/values
function mapClerkRoleToEnum(role) {
  if (role === "ADMIN") return "ADMIN";
  if (role === "CREATOR") return "CREATOR";
  return "VIEWER";
}

export const POST = async (req) => {
  let evt;
  try {
    evt = await verifyWebhook(req);
  } catch (err) {
    console.error("🔴 Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid webhook" }, { status: 400 });
  }

  const { type, data } = evt || {};

  try {
    switch (type) {
      case "user.created": {
        const clerkId = data.id;
        const email = data.email_addresses?.[0]?.email_address ?? null;
        const fullName =
          data.full_name ??
          [data.first_name, data.last_name].filter(Boolean).join(" ") ??
          "Unknown";
        const role = mapClerkRoleToEnum(data.public_metadata?.role);
        const createdAt = data.created_at ? new Date(data.created_at) : new Date();

        // Upsert user (replace if exists)
        await pool.query(
          `INSERT INTO User (clerkId, fullName, email, role, createdAt)
           VALUES (?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE fullName = VALUES(fullName), email = VALUES(email), role = VALUES(role)`,
          [clerkId, fullName, email, role, createdAt]
        );
        break;
      }

      case "user.updated": {
        const clerkId = data.id;
        const email = data.email_addresses?.[0]?.email_address ?? null;
        const fullName =
          data.full_name ??
          [data.first_name, data.last_name].filter(Boolean).join(" ") ??
          "Unknown";
        const role = mapClerkRoleToEnum(data.public_metadata?.role);
        const createdAt = data.created_at ? new Date(data.created_at) : new Date();

        await pool.query(
          `INSERT INTO User (clerkId, fullName, email, role, createdAt)
           VALUES (?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE fullName = VALUES(fullName), email = VALUES(email), role = VALUES(role)`,
          [clerkId, fullName, email, role, createdAt]
        );
        break;
      }

      case "user.deleted": {
        const clerkId = data.id;
        await pool.query(`DELETE FROM User WHERE clerkId = ?`, [clerkId]);
        break;
      }

      case "session.created": {
        const clerkId = data.user_id;
        if (clerkId) {
          await pool.query(
            `UPDATE User SET lastSignedIn = ? WHERE clerkId = ?`,
            [new Date(data.created_at), clerkId]
          );
        }
        break;
      }

      default:
        break;
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (dbErr) {
    console.error("🔴 Database sync error:", dbErr);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
};
