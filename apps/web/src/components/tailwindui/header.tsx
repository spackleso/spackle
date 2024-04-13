'use client'

import Link from 'next/link'

import { Container } from '@/components/tailwindui/container'
import { Logo } from '@/components/logo'
import { NavLink } from '@/components/tailwindui/nav-link'
import { ArrowTopRightOnSquareIcon } from '@heroicons/react/20/solid'
import { comfortaa } from '@/lib/font'

export function Header() {
  return (
    <header className="fixed z-[100] w-full flex-none border-b border-slate-800 py-1 backdrop-blur-3xl">
      <Container className="mx-16 max-w-full">
        <nav className="relative z-50 flex justify-between">
          <div className="flex items-center md:gap-x-12">
            <Link href="/" aria-label="Home" className="flex items-center">
              <Logo className="h-12 w-auto cursor-pointer" />
              <h1
                className={`${comfortaa.className} pr-4 font-bold lowercase text-slate-900 dark:text-white`}
              >
                Spackle
              </h1>
            </Link>
            <div className="hidden md:flex md:gap-x-6"></div>
          </div>
          <div className="flex items-center gap-x-5">
            <NavLink href="/pricing">Pricing</NavLink>
            <NavLink href="/posts">Blog</NavLink>
            <NavLink href="https://docs.spackle.so">
              <span>Docs</span>
              <ArrowTopRightOnSquareIcon className="h-4 w-4" />
            </NavLink>
          </div>
        </nav>
      </Container>
    </header>
  )
}
