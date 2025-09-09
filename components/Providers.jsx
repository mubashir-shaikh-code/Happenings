// components/Providers.jsx
'use client'

import {
  ClerkProvider,
  SignedIn,
  SignedOut,
  SignInButton,
  UserButton,
  useAuth
} from '@clerk/nextjs'
import Link from 'next/link'
import { Button } from './ui/button'
import { usePathname } from 'next/navigation'
import { Toaster } from './ui/sonner'

function HeaderContent() {
  const pathname = usePathname()
  const { sessionClaims } = useAuth()

  const hideHeaderRoutes = ['/admin', '/creator']
  const shouldHideHeader = hideHeaderRoutes.some(route =>
    pathname === route || pathname.startsWith(`${route}/`)
  )

  const roleClaim = sessionClaims?.metadata?.role;
  const isAdmin = !!roleClaim && String(roleClaim).toUpperCase() === "ADMIN";

  if (shouldHideHeader) {
    return null;
  }

  return (
    <header className="flex justify-between items-center sticky top-0 bg-white z-[100] p-4 gap-4 h-16 border-b">
      <div>
        <Link href='/'><h2 className='text-xl font-serif'>Happenings</h2></Link>
      </div>
      <div className='flex items-center space-x-2'>
        <SignedOut>
          <SignInButton>
            <Button>
              SignIn
            </Button>
          </SignInButton>
        </SignedOut>
        <SignedIn>
          {!isAdmin && (
            <Link href='/creator/manage-events/create-event'>
              <Button variant="ghost">Become a Creator</Button>
            </Link>
          )}
          <UserButton />
        </SignedIn>
      </div>
    </header>
  )
}

export default function Providers({ children }) {
  return (
    <ClerkProvider>
      <HeaderContent />
      {children}
      <Toaster />
    </ClerkProvider>
  )
}