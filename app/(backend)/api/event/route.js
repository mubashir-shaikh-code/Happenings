// app/api/event/route.js
import { auth } from '@clerk/nextjs/server' // Clerk Auth
import prisma from '@/lib/prisma' // Your Prisma client
import { NextResponse } from 'next/server'

export const POST = async (req) => {
  try {
    
    const { userId } = auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const {
      organizer,
      title,
      description,
      category,
      tags,      // Array: ["music", "tech"]
      venue,
      startDate,
      endDate,
      imageUrls, // Array: ["url1", "url2"]
      ticketLink
    } = await req.json()

    // Get User by Clerk ID
    const user = await prisma.user.findUnique({
      where: { clerkId: userId }
    })

    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    // Create Event
    const event = await prisma.event.create({
      data: {
        organizer,
        title,
        description,
        category,
        tags: tags.join(','),
        venue,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        imageUrls: imageUrls.join(','), // Store as comma-separated
        ticketLink,
        creatorId: user.id // Reference to User.id
      }
    })

    return NextResponse.json({ success: true, event }, { status: 201 })
  } catch (err) {
    console.error('Event create error:', err)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
