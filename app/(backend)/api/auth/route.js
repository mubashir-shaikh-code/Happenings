// app/api/auth/route.js
import { NextResponse } from "next/server";
import { verifyWebhook } from "@clerk/nextjs/webhooks";
import prisma from "@/lib/prisma";

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

                const updatePayload = {};
                if (email) updatePayload.email = email;
                if (fullName) updatePayload.fullName = fullName;
                if (role) updatePayload.role = role;

                await prisma.user.upsert({
                    where: { clerkId },
                    update: updatePayload,
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

            case "user.deleted": {
                const clerkId = data.id;
                await prisma.user.deleteMany({ where: { clerkId } });
                break;
            }

            case "session.created": {
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
                break;
        }

        return NextResponse.json({ received: true }, { status: 200 });
    } catch (dbErr) {
        console.error("🔴 Database sync error:", dbErr);
        return NextResponse.json({ error: "Database error" }, { status: 500 });
    }
};
