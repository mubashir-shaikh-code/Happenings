'use client'

import Sidebar from "@/components/Sidebar";
import { usePathname } from "next/navigation";

export default function AdminLayout({ children }) {
    const pathname = usePathname()
    const isLoginPage = pathname === "/admin"

    return (
        <div className="admin-root" style={{ display: 'flex', minHeight: '100vh' }}>
            {!isLoginPage && (
                <aside>
                    <Sidebar role="ADMIN" />
                </aside>
            )}

            <main style={{ flex: 1, padding: '1.25rem' }}>
                {children}
            </main>
        </div>
    )
}
