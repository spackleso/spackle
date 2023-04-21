'use client'

import { Fragment } from 'react'
import Link from 'next/link'
import { Popover, Transition } from '@headlessui/react'
import clsx from 'clsx'

import { Container } from '@/app/Container'
import { Logo } from '@/app/Logo'
import { NavLink } from '@/app/NavLink'
import { ArrowTopRightOnSquareIcon } from '@heroicons/react/20/solid'
import { ThemeSelector } from '@/app/ThemeSelector'
import { comfortaa } from '@/app/font'

function MobileNavLink({ href, children }: any) {
  return (
    <Popover.Button as={Link} href={href} className="block w-full p-2">
      {children}
    </Popover.Button>
  )
}

function MobileNavIcon({ open }: any) {
  return (
    <svg
      aria-hidden="true"
      className="h-3.5 w-3.5 overflow-visible stroke-slate-700"
      fill="none"
      strokeWidth={2}
      strokeLinecap="round"
    >
      <path
        d="M0 1H14M0 7H14M0 13H14"
        className={clsx(
          'origin-center transition',
          open && 'scale-90 opacity-0',
        )}
      />
      <path
        d="M2 2L12 12M12 2L2 12"
        className={clsx(
          'origin-center transition',
          !open && 'scale-90 opacity-0',
        )}
      />
    </svg>
  )
}

function MobileNavigation() {
  return (
    <Popover>
      <Popover.Button
        className="relative z-10 flex h-8 w-8 items-center justify-center [&:not(:focus-visible)]:focus:outline-none"
        aria-label="Toggle Navigation"
      >
        {({ open }) => <MobileNavIcon open={open} />}
      </Popover.Button>
      <Transition.Root>
        <Transition.Child
          as={Fragment}
          enter="duration-150 ease-out"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="duration-150 ease-in"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <Popover.Overlay className="fixed inset-0 bg-slate-300/50" />
        </Transition.Child>
      </Transition.Root>
    </Popover>
  )
}

export function Header() {
  return (
    <header className="flex-none py-10">
      <Container>
        <nav className="relative z-50 flex justify-between">
          <div className="flex items-center md:gap-x-12">
            <Link href="#" aria-label="Home" className="flex items-center">
              <Logo className="h-16 w-auto cursor-pointer" />
              <h1
                className={`${comfortaa.className} font-bold lowercase text-slate-900 dark:text-white`}
              >
                Spackle
              </h1>
            </Link>
            <div className="hidden md:flex md:gap-x-6"></div>
          </div>
          <div className="flex items-center gap-x-1 md:gap-x-2">
            <div className="-mr-1 md:hidden">
              <MobileNavigation />
            </div>
            <ThemeSelector className="relative z-10" />
            <NavLink href="https://docs.spackle.so">
              <span className="flex flex-row items-center gap-1">
                <span>Docs</span>
                <ArrowTopRightOnSquareIcon className="h-4 w-4" />
              </span>
            </NavLink>
          </div>
        </nav>
      </Container>
    </header>
  )
}
