import { NextResponse } from 'next/server';
import ImageKit from 'imagekit';
import { getAuth } from '@clerk/nextjs/server';
import { pool } from '@/lib/db'; // <-- our MySQL connection

// ImageKit instance
const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
});

// Helper: Clean filename
const slugifyFileName = (name) => {
  return name
    .replace(/\s+/g, '-')
    .replace(/[^a-zA-Z0-9.-]/g, '')
    .toLowerCase();
};

export const POST = async (req) => {
  try {
    const { userId } = getAuth(req);
    const formData = await req.formData();

    const organizer = formData.get('organizer');
    const title = formData.get('title');
    const description = formData.get('description');
    const category = formData.get('category');
    const tagsArray = formData.getAll('tags');
    const venue = formData.get('venue');
    const startDate = formData.get('startDate');
    const endDate = formData.get('endDate');
    const ticketLink = formData.get('ticketLink');

    // Upload images to ImageKit
    const images = [];
    for (let [key, value] of formData.entries()) {
      if (key.startsWith('image') && value instanceof File) {
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

    // 1. Find the user in DB
    const [userRows] = await pool.query(
      'SELECT id, email FROM User WHERE clerkId = ?',
      [userId]
    );

    if (userRows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const user = userRows[0];

    // 2. Insert Event
    const [eventResult] = await pool.query(
      `INSERT INTO Event 
        (creatorId, creatorEmail, adminApproved, organizer, title, description, category, tags, venue, startDateTime, endDateTime, imageUrls, ticketLink) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        user.id,
        user.email,
        0, // adminApproved = false
        organizer,
        title,
        description,
        category,
        tagsArray.join(', '),
        venue,
        new Date(startDate),
        new Date(endDate),
        images.join(', '),
        ticketLink,
      ]
    );

    const eventId = eventResult.insertId;

    // 3. Insert EventRequest
    await pool.query(
      `INSERT INTO EventRequest 
        (eventId, requestedById, requestedByEmail, status) 
       VALUES (?, ?, ?, ?)`,
      [eventId, user.id, user.email, 'PENDING']
    );

    return NextResponse.json(
      {
        success: true,
        event: {
          id: eventId,
          creatorId: user.id,
          creatorEmail: user.email,
          organizer,
          title,
          description,
          category,
          tags: tagsArray,
          venue,
          startDate,
          endDate,
          imageUrls: images,
          ticketLink,
          adminApproved: false,
        },
      },
      { status: 201 }
    );
  } catch (err) {
    console.error('Event create error:', err);
    return NextResponse.json(
      { error: 'Something went wrong', details: err.message },
      { status: 500 }
    );
  }
};
