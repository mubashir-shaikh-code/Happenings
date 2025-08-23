// app/api/create-event/route.js
import { getAuth } from '@clerk/nextjs/server'
import prisma from '@/lib/prisma'
import { NextResponse } from 'next/server'
import ImageKit from 'imagekit'

// ✅ ImageKit instance top-level
const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
})

// ✅ Helper: Clean filename for URL-friendly format
const slugifyFileName = (name) => {
  return name
    .replace(/\s+/g, '-')            // spaces → hyphens
    .replace(/[^a-zA-Z0-9.-]/g, '')  // remove special chars
    .toLowerCase()
}

export const POST = async (req) => {
  try {
    const { userId } = getAuth(req)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await req.formData()

    const organizer = formData.get('organizer')
    const title = formData.get('title')
    const description = formData.get('description')
    const category = formData.get('category')
    const tagsArray = formData.getAll('tags') // checkbox values array
    const venue = formData.get('venue')
    const startDate = formData.get('startDate')
    const endDate = formData.get('endDate')
    const ticketLink = formData.get('ticketLink')

    // ✅ Upload images to ImageKit
    const images = []
    for (let [key, value] of formData.entries()) {
      if (key.startsWith('image') && value instanceof File) {
        try {
          const arrayBuffer = await value.arrayBuffer()
          const buffer = Buffer.from(arrayBuffer)

          const safeFileName = slugifyFileName(value.name)

          const uploadResponse = await imagekit.upload({
            file: buffer,
            fileName: safeFileName,
          })

          images.push(uploadResponse.url)
        } catch (uploadErr) {
          console.error(`❌ Failed to upload ${value.name}:`, uploadErr)
        }
      }
    }

    // ✅ Find user by Clerk ID
    const user = await prisma.user.findUnique({
      where: { clerkId: userId }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // ✅ Create Event
    const event = await prisma.event.create({
      data: {
        creatorId: user.id,
        creatorEmail: user.email,
        adminApproved: false,
        organizer,
        title,
        description,
        category,
        tags: tagsArray.join(','), // store as "tag1, tag2"
        venue,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        imageUrls: images.join(','), // store as "url1,url2"
        ticketLink,
      }
    })

    return NextResponse.json({ success: true, event }, { status: 201 })
  } catch (err) {
    console.error('Event create error:', err)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
