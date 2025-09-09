'use client'

import React, { useEffect } from 'react'
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
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet'
import { Collapsible, CollapsibleTrigger, CollapsibleContent, } from '@/components/ui/collapsible'
import { SignedIn, UserButton, useUser } from '@clerk/nextjs'
import { Button } from './ui/button'

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
            { name: 'Dashboard', href: '/creator/dashboard', icon: Home },
            {
                name: 'Manage Events',
                icon: Calendar,
                children: [
                    { name: 'Create Event', href: '/creator/manage-events/create-event', icon: PlusSquare },
                    { name: 'Listed Events', href: '/creator/manage-events/listed-events', icon: Users },
                    { name: 'Request Status', href: '/creator/manage-events/request-status', icon: CircleCheckBig },
                ],
            },
            { name: 'Settings', href: '/settings', icon: Settings },
        ],
    },
    ADMIN: {
        title: 'Admin Panel',
        links: [
            { name: 'Dashboard', href: '/admin/dashboard', icon: Home },
            {
                name: 'Manage Events',
                icon: Calendar,
                children: [
                    { name: 'Create Event', href: '/admin/manage-events/create-event', icon: PlusSquare },
                    { name: 'Listed Events', href: '/admin/manage-events/listed-events', icon: Users },
                    { name: 'Pending Request', href: '/admin/manage-events/pending-request', icon: CircleCheckBig },
                ],
            },
            { name: 'Settings', href: '/admin/settings', icon: Settings },
        ],
    },
}

export default function Sidebar({ role = 'VIEWER' }) {
    const [open, setOpen] = useState(false)
    const [collapsed, setCollapsed] = useState(true)
    const [openMenu, setOpenMenu] = useState(null)
    const { title, links } = roleMenus[role] || roleMenus.VIEWER
    const pathname = usePathname()
    const { user } = useUser()

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= 1024) {
                setCollapsed(false)
            } else {
                setCollapsed(true)
            }
        }
        handleResize()

        window.addEventListener("resize", handleResize)
        return () => window.removeEventListener("resize", handleResize)
    }, [])

    useEffect(() => {
        const activeSimpleLink = links.find(link => !link.children && pathname === link.href)
        if (activeSimpleLink) {
            setOpenMenu(null)
        } else {
            const activeParent = links.find(link =>
                link.children && link.children.some(child => pathname === child.href)
            )
            if (activeParent) {
                setOpenMenu(activeParent.name)
            }
        }
    }, [pathname, links])

    return (
        <>
            <div className="md:hidden">
                <Sheet open={open} onOpenChange={setOpen}>
                    <nav className='fixed top-0 left-0 right-0 z-[100] border-b bg-gray-200 flex justify-between items-center py-3 px-4 shadow-sm'>
                        <div className='flex items-center gap-2'>
                            <SheetTrigger asChild>
                                <Button aria-label="Open menu">
                                    <Menu size={30} className="cursor-pointer" />
                                </Button>
                            </SheetTrigger>
                            <span className="text-lg font-serif">
                                {user?.fullName}
                            </span>
                        </div>
                        <div className='flex items-center'>
                            <SignedIn>
                                <UserButton />
                            </SignedIn>
                        </div>
                    </nav>

                    <SheetContent side="left" className="p-0 w-64 z-[110]">
                        <div className="h-full flex flex-col bg-white dark:bg-gray-900">
                            <SheetHeader className="p-4 font-bold text-lg border-b">
                                <Link href="/admin">
                                    <div className="flex items-center space-x-2 cursor-pointer">
                                        <UserStar size={20} />
                                        <SheetTitle>{title}</SheetTitle>
                                    </div>
                                </Link>
                            </SheetHeader>

                            <div className="flex-1 p-4 space-y-2 overflow-y-auto">
                                <nav className="space-y-2">
                                    {links.map((link) => {
                                        const Icon = link.icon
                                        const hasChildren = !!link.children
                                        const isOpen = openMenu === link.name
                                        const childActive = hasChildren && link.children.some((c) => pathname === c.href)
                                        const selfActive = pathname === link.href
                                        const parentActive = selfActive || (!isOpen && childActive)

                                        if (!hasChildren) {
                                            return (
                                                <Link
                                                    key={link.href || link.name}
                                                    href={link.href}
                                                    onClick={() => setOpen(false)}
                                                    className={clsx(
                                                        'flex items-center gap-3 px-3 py-2 rounded-md transition-colors',
                                                        selfActive ? 'bg-gray-100 dark:bg-gray-800' : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                                                    )}
                                                >
                                                    <Icon size={20} />
                                                    <span>{link.name}</span>
                                                </Link>
                                            )
                                        }

                                        return (
                                            <div key={link.href || link.name}>
                                                <Collapsible open={isOpen} onOpenChange={() => setOpenMenu(isOpen ? null : link.name)}>
                                                    <CollapsibleTrigger asChild>
                                                        <div
                                                            role="button"
                                                            tabIndex={0}
                                                            className={clsx(
                                                                'flex items-center justify-between w-full rounded-md transition-colors cursor-pointer px-3 py-2 mb-1',
                                                                parentActive ? 'bg-gray-100 dark:bg-gray-800' : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                                                            )}
                                                            onClick={() => setOpenMenu(isOpen ? null : link.name)}
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                <Icon size={20} />
                                                                <span>{link.name}</span>
                                                            </div>

                                                            <ChevronDown
                                                                size={16}
                                                                className={clsx('transition-transform', isOpen ? 'rotate-180' : '')}
                                                            />
                                                        </div>
                                                    </CollapsibleTrigger>

                                                    <CollapsibleContent>
                                                        <div className="pl-6 mt-2 space-y-1">
                                                            {link.children.map((child) => {
                                                                const ChildIcon = child.icon
                                                                const childActive = pathname === child.href
                                                                return (
                                                                    <Link
                                                                        key={child.href || child.name}
                                                                        href={child.href}
                                                                        onClick={() => {
                                                                            setOpen(false)
                                                                            setOpenMenu(null)
                                                                        }}
                                                                        className={clsx(
                                                                            'flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors',
                                                                            childActive ? 'bg-gray-100 dark:bg-gray-700' : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                                                                        )}
                                                                    >
                                                                        <ChildIcon size={16} />
                                                                        <span>{child.name}</span>
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
                            </div>
                        </div>
                    </SheetContent>
                </Sheet >
            </div>

            <aside
                className={
                    clsx(
                        'hidden md:flex flex-col h-screen border-r bg-white dark:bg-gray-900 transition-width duration-300',
                        collapsed ? 'w-16' : 'w-64'
                    )
                }
            >
                <div
                    className={clsx(
                        'flex items-center border-b',
                        collapsed ? 'py-4 justify-evenly' : 'p-4 justify-between'
                    )}
                >
                    <Link href='/admin'>
                        <div className="flex items-center gap-2">
                            <UserStar size={20} />
                            <span className={clsx(collapsed ? 'hidden' : 'block font-semibold')}>{title}</span>
                        </div>
                    </Link>

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
                        const isOpen = openMenu === link.name
                        const childActive = hasChildren && link.children.some((c) => pathname === c.href)
                        const selfActive = pathname === link.href
                        const parentActive = selfActive || (!isOpen && childActive)

                        if (!hasChildren) {
                            return (
                                <Link
                                    key={link.href || link.name}
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

                        return (
                            <div key={link.href || link.name}>
                                <Collapsible open={isOpen} onOpenChange={() => setOpenMenu(isOpen ? null : link.name)}>
                                    <CollapsibleTrigger asChild>
                                        <div
                                            role="button"
                                            tabIndex={0}
                                            className={clsx(
                                                'flex items-center justify-between w-full rounded-lg transition-colors cursor-pointer px-2 py-2 mb-1',
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
                                                        key={child.href || child.name}
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
