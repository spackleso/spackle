import { buttonVariants } from '@/components/ui/button'
import { UserAuthForm } from '@/components/user-auth-form'
import { cn } from '@/lib/utils'
import { ChevronLeft } from 'lucide-react'
import { Metadata } from 'next'
import Link from 'next/link'
import { Logo } from '@/components/logo'

export const metadata: Metadata = {
  title: 'Sign Up | Spackle',
  description: 'Sign Up for Spackle',
}

export default function SignUpPage() {
  return (
    <div className="container flex h-screen w-screen flex-col items-center justify-center">
      <Link
        href="/"
        className={cn(
          buttonVariants({ variant: 'ghost' }),
          'absolute left-4 top-4 md:left-8 md:top-8',
        )}
      >
        <>
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back
        </>
      </Link>
      <div className="mx-auto flex w-full flex-col justify-center gap-6 sm:w-[350px]">
        <div className="flex flex-col gap-2 items-center text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            Welcome to Spackle
          </h1>
          <p className="text-sm text-muted-foreground">
            Sign up for an account
          </p>
        </div>
        <UserAuthForm />
      </div>
    </div>
  )
}
