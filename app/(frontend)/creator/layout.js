'use client'

import Sidebar from "@/components/Sidebar";
import { SignedIn, UserButton, useUser } from "@clerk/nextjs";

export default function CreatorLayout({ children }) {
    const { user } = useUser()

    return (
        <div className="min-h-screen flex">
            <aside className="hidden md:block sticky top-0 h-screen overflow-y-auto flex-shrink-0">
                <Sidebar role="CREATOR" />
            </aside>

            <div className="md:hidden">
                <Sidebar role="CREATOR" />
            </div>

            <main className="flex-1 flex flex-col min-w-0">
                <nav className="hidden sm:flex sticky top-0 z-10 py-4 px-4 bg-white border-b justify-between items-center">
                    <div>
                        <span className="text-lg font-serif">
                            Welcome! {user?.fullName}
                        </span>
                    </div>
                    <div className="flex items-center">
                        <SignedIn>
                            <UserButton />
                        </SignedIn>
                    </div>
                </nav>

                <div className="flex-1 overflow-y-auto p-4 pt-20 sm:pt-4">
                    {children}
                </div>
            </main>
        </div>
    )
}