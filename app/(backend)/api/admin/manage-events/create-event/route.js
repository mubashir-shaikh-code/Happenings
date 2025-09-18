import { NextResponse } from "next/server";
import ImageKit from "imagekit";
import { getAuth } from "@clerk/nextjs/server";
import pool from "@/lib/db"; // our MySQL connection

// ImageKit setup
const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
});

// Helper to clean file names
const slugifyFileName = (name) => {
  return name
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9.-]/g, "")
    .toLowerCase();
};

export const POST = async (req) => {
  try {
    const { userId } = getAuth(req);
    const formData = await req.formData();

    const organizer = formData.get("organizer");
    const title = formData.get("title");
    const description = formData.get("description");
    const category = formData.get("category");
    const tagsArray = formData.getAll("tags");
    const venue = formData.get("venue");
    const startDate = formData.get("startDate");
    const endDate = formData.get("endDate");
    const ticketLink = formData.get("ticketLink");

    // Upload images to ImageKit
    const images = [];
    for (let [key, value] of formData.entries()) {
      if (key.startsWith("image") && value instanceof File) {
        try {
          const arrayBuffer = await value.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          const safeFileName = slugifyFileName(value.name);

          const uploadResponse = await imagekit.upload({
            file: buffer,
            fileName: safeFileName,
          });

          images.push(uploadResponse.url);
        } catch (uploadErr) {
          console.error(`❌ Failed to upload ${value.name}:`, uploadErr);
        }
      }
    }

    // 1️⃣ Get user from DB using clerkId
    const [users] = await pool.query(
      "SELECT * FROM users WHERE clerkId = ? LIMIT 1",
      [userId]
    );
    const user = users[0];

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // 2️⃣ Insert event into DB
    const [result] = await pool.query(
      `INSERT INTO events 
        (creatorId, creatorEmail, adminApproved, organizer, title, description, category, tags, venue, startDateTime, endDateTime, imageUrls, ticketLink) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        user.id,
        user.email,
        false,
        organizer,
        title,
        description,
        category,
        tagsArray.join(", "),
        venue,
        new Date(startDate),
        new Date(endDate),
        images.join(", "),
        ticketLink,
      ]
    );

    return NextResponse.json(
      { success: true, eventId: result.insertId },
      { status: 201 }
    );
  } catch (err) {
    console.error("Event create error:", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
};
