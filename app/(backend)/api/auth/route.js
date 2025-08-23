// app/api/webhooks/clerk/route.js
import { NextResponse } from "next/server";
import { verifyWebhook } from "@clerk/nextjs/webhooks";
import prisma from "@/lib/prisma";

// Helper: map Clerk public_metadata.role (string) -> Prisma enum value
function mapClerkRoleToEnum(role) {
    if (role === "ADMIN") return "ADMIN";
    if (role === "CREATOR") return "CREATOR";
    return "VIEWER";
}

export const POST = async (req) => {
    let evt;
    try {
        // verifyWebhook will validate signature using CLERK_WEBHOOK_SECRET env
        evt = await verifyWebhook(req);
    } catch (err) {
        console.error("🔴 Webhook signature verification failed:", err);
        return NextResponse.json({ error: "Invalid webhook" }, { status: 400 });
    }

    const { type, data } = evt || {};
    try {
        switch (type) {
            case "user.created": {
                // Use upsert so duplicate errors don't break if user existed
                const clerkId = data.id;
                const email = data.email_addresses?.[0]?.email_address ?? undefined;
                const fullName =
                    data.full_name ??
                    [data.first_name, data.last_name].filter(Boolean).join(" ") ??
                    "Unknown";
                const role = mapClerkRoleToEnum(data.public_metadata?.role);

                await prisma.user.upsert({
                    where: { clerkId },
                    update: {
                        fullName,
                        email,
                        role,
                    },
                    create: {
                        clerkId,
                        fullName,
                        email,
                        role,
                        createdAt: data.created_at ? new Date(data.created_at) : undefined,
                    },
                });
                break;
            }

            case "user.updated": {
                const clerkId = data.id;
                const email = data.email_addresses?.[0]?.email_address ?? undefined;
                const fullName =
                    data.full_name ??
                    [data.first_name, data.last_name].filter(Boolean).join(" ") ??
                    "Unknown";
                const role = mapClerkRoleToEnum(data.public_metadata?.role);

                console.log("user.updated payload:", { clerkId, incomingEmail, fullName, role });

                // build update object only with present fields
                const updatePayload = {};
                if (email) updatePayload.email = email;
                if (fullName) updatePayload.fullName = fullName;
                if (role) updatePayload.role = role;

                // If user exists update, otherwise create (upsert)
                await prisma.user.upsert({
                    where: { clerkId },
                    update: updatePayload,
                    create: {
                        clerkId,
                        fullName: fullName,
                        email: email,
                        role: role,
                        createdAt: data.created_at ? new Date(data.created_at) : undefined,
                    },
                });
                break;
            }

            case "user.deleted": {
                const clerkId = data.id;
                // safe delete: ignore if not found
                await prisma.user.deleteMany({ where: { clerkId } });
                break;
            }

            case "session.created": {
                // update lastSignedIn when a session is created
                // data.user_id is Clerk's user id for this session event
                const clerkId = data.user_id;
                if (clerkId) {
                    await prisma.user.updateMany({
                        where: { clerkId },
                        data: { lastSignedIn: new Date(data.created_at) },
                    });
                }
                break;
            }

            default:
                // ignore other events
                break;
        }

        return NextResponse.json({ received: true }, { status: 200 });
    } catch (dbErr) {
        console.error("🔴 Database sync error:", dbErr);
        return NextResponse.json({ error: "Database error" }, { status: 500 });
    }
};
