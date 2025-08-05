// app/(backend)/api/auth/clerk-webhooks/route.js
import { verifyWebhook } from '@clerk/nextjs/webhooks'
import prisma from '@/lib/prisma'
import { NextResponse } from 'next/server'

export const POST = async (req) => {
    try {
        // 1. Clerk webhook verify
        const evt = await verifyWebhook(req)
        const { type, data } = evt

        // 2. Handle different event types
        switch (type) {
            case 'user.created': {
                const { id: clerkId, email_addresses, first_name, last_name, created_at } = data
                const email = email_addresses?.[0]?.email_address || ''
                const fullName = [first_name, last_name].filter(Boolean).join(' ')
                await prisma.user.create({
                    data: {
                        clerkId,
                        email,
                        fullName,
                        createdAt: new Date(created_at),
                    }
                })
                console.log(`User ${clerkId} created`)
                break
            }

            case 'session.created': {
                const { user_id: clerkId, last_active_at } = data
                await prisma.user.update({
                    where: { clerkId },
                    data: { lastSignedIn: new Date(last_active_at) }
                })
                console.log(`User ${clerkId} lastSignedIn updated`)
                break
            }

            case 'user.updated': {
                const { id: clerkId, email_addresses, first_name, last_name } = data
                const email = email_addresses?.[0]?.email_address || ''
                const fullName = [first_name, last_name].filter(Boolean).join(' ')
                await prisma.user.upsert({
                    where: { clerkId },
                    create: {
                        clerkId,
                        email,
                        fullName,
                        createdAt: new Date(data.created_at || Date.now()),
                    },
                    update: {
                        email,
                        fullName,
                    }
                })
                console.log(`User ${clerkId} updated`)
                break
            }

            case 'user.deleted': {
                const { id: clerkId } = data
                await prisma.user.delete({ where: { clerkId } })
                console.log(`User ${clerkId} deleted`)
                break
            }

            default:
                console.log(`Unhandled event type ${type}`)
        }

        return NextResponse.json('Webhook processed ✅', { status: 200 })
    } catch (err) {
        console.error('❌ Webhook error:', err)
        return NextResponse.json(
            { error: 'Webhook handler failed', message: err.message },
            { status: 400 }
        )
    }
}
