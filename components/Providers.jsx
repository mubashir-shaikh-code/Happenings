'use client'

// import { useRouter } from 'next/navigation'
import {
  ClerkProvider,
  SignedIn,
  SignedOut,
  SignInButton,
  UserButton
} from '@clerk/nextjs'
// import { HeroUIProvider } from '@heroui/react'

export default function Providers({ children }) {
//   const router = useRouter()

  return (
    <ClerkProvider>
      {/* <HeroUIProvider
        navigate={router.push}
        useHref={(href) => href}
      > */}
        <header className="flex justify-end items-center p-4 gap-4 h-16">
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
        </header>
        {children}
      {/* </HeroUIProvider> */}
    </ClerkProvider>
  )
}
