import { NextResponse } from 'next/server'
import { verifyWebhook } from '@clerk/nextjs/webhooks'
import prisma from '@/lib/prisma'

export const POST = async (req) => {
    let evt
    try {
        evt = await verifyWebhook(req)
    } catch (err) {
        console.error('🔴 Webhook signature verification failed:', err)
        return NextResponse.json({ error: 'Invalid webhook' }, { status: 400 })
    }

    const { type, data } = evt

    try {
        switch (type) {
            case 'user.created': {
                const email = data.email_addresses?.[0]?.email_address
                const fullName = data.full_name ?? [data.first_name, data.last_name].filter(Boolean).join(' ')
                await prisma.user.create({
                    data: {
                        clerkId: data.id,
                        fullName,
                        email,
                        createdAt: new Date(data.created_at),
                    },
                })
                break
            }

            case 'user.deleted':
                await prisma.user.delete({
                    where: { clerkId: data.id },
                })
                break

            case 'session.created':
                await prisma.user.update({
                    where: { clerkId: data.user_id },
                    data: {
                        lastSignedIn: new Date(data.created_at),
                    },
                })
                break

            default:
                // ignore other events
                break
        }

        return NextResponse.json({ received: true }, { status: 200 })
    } catch (dbErr) {
        console.error('🔴 Database sync error:', dbErr)
        return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }
}
