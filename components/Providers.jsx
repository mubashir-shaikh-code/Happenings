// components/Providers.jsx
'use client'

import {
  ClerkProvider,
  SignedIn,
  SignedOut,
  SignInButton,
  UserButton
} from '@clerk/nextjs'
import Link from 'next/link'
import { Button } from './ui/button'
import { usePathname } from 'next/navigation'

export default function Providers({ children }) {
  const pathname = usePathname()

  const hideHeaderRoutes = ['/admin', '/creator-dashboard']
  const shouldHideHeader = hideHeaderRoutes.some(route =>
    pathname === route || pathname.startsWith(`${route}/`)
  )

  return (
    <ClerkProvider>
      {!shouldHideHeader && (

        <header className="bg-gray-200 flex justify-between items-center p-4 gap-4 h-16">
          <div>
            <Link href='/'><h2 className='text-xl font-semibold'>Happenings</h2></Link>
          </div>
          <div className='flex items-center space-x-2'>
            <Link href='/create-event'><Button>Become a Creator</Button></Link>
            <SignedOut>
              <SignInButton>
                <button className="bg-green-600 text-white rounded-full font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 cursor-pointer">
                  SignIn/SignUp
                </button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <UserButton />
            </SignedIn>
          </div>
        </header>
      )}
      {children}
    </ClerkProvider >
  )
}
