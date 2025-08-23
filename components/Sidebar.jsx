'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import clsx from 'clsx'
import {
    Menu,
    Home,
    Calendar,
    User,
    Settings,
    PlusSquare,
    Users,
    ChevronLeft,
    ChevronRight,
    UserStar,
    ChevronDown,
    CircleCheckBig,
} from 'lucide-react'

import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet'

import {
    Collapsible,
    CollapsibleTrigger,
    CollapsibleContent,
} from '@/components/ui/collapsible'

const roleMenus = {
    VIEWER: {
        title: 'Viewer Dashboard',
        links: [
            { name: 'Dashboard', href: '/', icon: Home },
            { name: 'Events', href: '/events', icon: Calendar },
            { name: 'Profile', href: '/profile', icon: User },
        ],
    },
    CREATOR: {
        title: 'Event Creator',
        links: [
            { name: 'Dashboard', href: '/', icon: Home },
            { name: 'My Events', href: '/events/my', icon: Calendar },
            { name: 'Create Event', href: '/events/create', icon: PlusSquare },
            { name: 'Settings', href: '/settings', icon: Settings },
        ],
    },
    ADMIN: {
        title: 'Admin Panel',
        links: [
            { name: 'Dashboard', href: '/admin/dashboard', icon: Home },
            {
                name: 'Manage Events',
                href: '/admin/events',
                icon: Calendar,
                children: [
                    { name: 'Create Event', href: '/admin/create-event', icon: PlusSquare },
                    { name: 'List Events', href: '/admin/listed-events', icon: Users },
                    { name: 'Approve Request', href: '/admin/approve-request', icon: CircleCheckBig },
                ],
            },
            { name: 'Settings', href: '/settings', icon: Settings },
        ],
    },
}

export default function Sidebar({ role = 'VIEWER' }) {
    const [open, setOpen] = useState(false) // mobile
    const [collapsed, setCollapsed] = useState(false) // desktop collapse
    const [openMenu, setOpenMenu] = useState(null) // submenu name (null = closed)
    const { title, links } = roleMenus[role] || roleMenus.VIEWER
    const pathname = usePathname()

    return (
        <>
            {/* Mobile Sheet trigger */}
            <div className="sm:hidden">
                <Sheet open={open} onOpenChange={setOpen}>
                    <SheetTrigger asChild>
                        <button aria-label="Open menu">
                            <Menu size={35} className="cursor-pointer" />
                        </button>
                    </SheetTrigger>

                    <SheetContent side="left" className="p-0 w-64">
                        <div className="h-full flex flex-col bg-white dark:bg-gray-900">
                            <SheetHeader className="p-4 font-bold text-lg border-b">
                                <div className="flex items-center space-x-2">
                                    <UserStar size={20} />
                                    <SheetTitle>{title}</SheetTitle>
                                </div>
                            </SheetHeader>

                            <SheetDescription className="flex-1 p-4 space-y-2">
                                {links.map((link) => {
                                    const Icon = link.icon
                                    return (
                                        <div key={link.href}>
                                            <Link
                                                href={link.href}
                                                className="flex items-center gap-3 px-3 py-2 rounded-md bg-gray-50 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                                                onClick={() => setOpen(false)}
                                            >
                                                <Icon size={20} />
                                                <span>{link.name}</span>
                                            </Link>

                                            {link.children && (
                                                <div className="pl-6 mt-2 space-y-1">
                                                    {link.children.map((child) => {
                                                        const ChildIcon = child.icon
                                                        return (
                                                            <Link
                                                                key={child.href}
                                                                href={child.href}
                                                                className="flex items-center gap-2 px-3 py-2 rounded-md bg-gray-50 hover:bg-gray-100 dark:hover:bg-gray-800 transition text-sm"
                                                                onClick={() => setOpen(false)}
                                                            >
                                                                <ChildIcon size={16} />
                                                                <span>{child.name}</span>
                                                            </Link>
                                                        )
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    )
                                })}
                            </SheetDescription>
                        </div>
                    </SheetContent>
                </Sheet>
            </div>

            {/* Desktop persistent sidebar */}
            <aside
                className={clsx(
                    'hidden sm:flex flex-col h-screen border-r bg-white dark:bg-gray-900 transition-width duration-300',
                    collapsed ? 'w-16' : 'w-64'
                )}
            >
                <div
                    className={clsx(
                        'flex items-center border-b',
                        collapsed ? 'py-4 justify-evenly' : 'p-4 justify-between'
                    )}
                >
                    <div className="flex items-center gap-2">
                        <UserStar size={20} />
                        <span className={clsx(collapsed ? 'hidden' : 'block font-semibold')}>{title}</span>
                    </div>

                    <button
                        onClick={() => setCollapsed((c) => !c)}
                        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                        className="p-1 border cursor-pointer rounded hover:bg-gray-100 dark:hover:bg-gray-800"
                    >
                        {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
                    </button>
                </div>

                <nav className={clsx('flex-1 space-y-2 overflow-y-auto', collapsed ? 'p-2' : 'p-4')}>
                    {links.map((link) => {
                        const Icon = link.icon
                        const hasChildren = !!link.children
                        const isOpen = openMenu === link.name // submenu open state
                        const childActive = hasChildren && link.children.some((c) => pathname === c.href)
                        const selfActive = pathname === link.href
                        const parentActive = selfActive || (!isOpen && childActive)

                        if (!hasChildren) {
                            return (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    title={collapsed ? link.name : undefined}
                                    className={clsx(
                                        'flex items-center w-full gap-3 py-2 px-2 rounded-lg transition-colors',
                                        collapsed && 'justify-center',
                                        selfActive ? 'bg-gray-100 dark:bg-gray-800' : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                                    )}
                                >
                                    <Icon size={20} />
                                    <span className={clsx(collapsed ? 'hidden' : 'block')}>{link.name}</span>
                                </Link>
                            )
                        }

                        // has children -> Collapsible
                        return (
                            <div key={link.href}>
                                <Collapsible open={isOpen} onOpenChange={() => setOpenMenu(isOpen ? null : link.name)}>
                                    <CollapsibleTrigger asChild>
                                        <div
                                            role="button"
                                            tabIndex={0}
                                            className={clsx(
                                                'flex items-center justify-between gap-3 w-full rounded-lg transition-colors cursor-pointer px-2 py-2',
                                                collapsed && 'justify-center',
                                                parentActive ? 'bg-gray-100 dark:bg-gray-800 ' : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                                            )}
                                        >
                                            <div className="flex items-center gap-3">
                                                <Icon size={20} />
                                                <span className={clsx(collapsed ? 'hidden' : 'block')}>{link.name}</span>
                                            </div>

                                            <div className={clsx(collapsed ? 'hidden' : '')}>
                                                <ChevronDown size={16} className={clsx(isOpen ? 'rotate-180' : '', 'transition-transform')} />
                                            </div>
                                        </div>
                                    </CollapsibleTrigger>

                                    <CollapsibleContent>
                                        <div className={clsx('space-y-1', collapsed ? '' : 'pl-8')}>
                                            {link.children.map((child) => {
                                                const ChildIcon = child.icon
                                                const childActiveLocal = pathname === child.href
                                                return (
                                                    <Link
                                                        key={child.href}
                                                        href={child.href}
                                                        title={collapsed ? child.name : undefined}
                                                        className={clsx(
                                                            'flex items-center w-full gap-2 py-2 px-2 rounded-lg transition-colors text-sm',
                                                            collapsed && 'justify-center',
                                                            childActiveLocal ? 'bg-gray-100 dark:bg-gray-700' : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                                                        )}
                                                    >
                                                        <ChildIcon size={16} />
                                                        <span className={clsx(collapsed ? 'hidden' : '')}>{child.name}</span>
                                                    </Link>
                                                )
                                            })}
                                        </div>
                                    </CollapsibleContent>
                                </Collapsible>
                            </div>
                        )
                    })}
                </nav>
            </aside>
        </>
    )
}
