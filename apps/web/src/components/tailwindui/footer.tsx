import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { LinkedInLogoIcon, TwitterLogoIcon } from '@radix-ui/react-icons'
import { ChevronRight, HeartHandshake } from 'lucide-react'
import { Logo } from '../logo'

const footerNavs = [
  {
    label: 'Product',
    items: [
      {
        href: '/pricing',
        name: 'Pricing',
      },
      {
        href: 'mailto:support@spackle.so',
        name: 'Support',
      },
    ],
  },
  {
    label: 'Company',
    items: [
      {
        href: '/posts',
        name: 'Blog',
      },
      {
        href: 'mailto:support@spackle.so',
        name: 'Contact',
      },
    ],
  },
  {
    label: 'Resources',
    items: [
      {
        href: 'https://docs.spackle.so',
        name: 'Documentation',
      },
    ],
  },
  {
    label: 'Legal',
    items: [
      {
        href: '/privacy',
        name: 'Privacy Policy',
      },
    ],
  },
]

const footerSocials = [
  {
    href: 'https://twitter.com/spackleso',
    name: 'Twitter',
    icon: <TwitterLogoIcon className="size-4" />,
  },
]

export function Footer() {
  return (
    <footer className="border-t">
      <div className="mx-auto w-full max-w-screen-xl px-4">
        <div className="gap-4 p-4 py-16 sm:pb-16 md:flex md:justify-between">
          <div className="mb-12 flex flex-col gap-4">
            <a href="/" className="flex items-center gap-2">
              <Logo className="h-12 w-auto cursor-pointer" />{' '}
              <span className="self-center whitespace-nowrap text-2xl font-semibold dark:text-white">
                Spackle
              </span>
            </a>
            <div className="max-w-sm">
              <div className="z-10 mt-4 flex w-full flex-col items-start text-left">
                <h1 className="text-3xl font-bold lg:text-2xl">
                  Get started today.
                </h1>
                <p className="mt-2">
                  Free to get started. No credit card required.
                </p>
                <a
                  href="/signup"
                  className={cn(
                    buttonVariants({
                      size: 'lg',
                      variant: 'default',
                    }),
                    'group mt-4 w-full rounded-[2rem] px-6',
                  )}
                >
                  Start For Free
                  <ChevronRight className="ml-1 size-4 transition-all duration-300 ease-out group-hover:translate-x-1" />
                </a>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-4 sm:gap-6">
            {footerNavs.map((nav) => (
              <div key={nav.label}>
                <h2 className="mb-6 text-sm font-semibold uppercase text-gray-900 dark:text-white">
                  {nav.label}
                </h2>
                <ul className="grid gap-2">
                  {nav.items.map((item) => (
                    <li key={item.name}>
                      <a
                        href={item.href}
                        className="group inline-flex cursor-pointer items-center justify-start gap-1 text-gray-400 duration-200 hover:text-gray-600 hover:opacity-90 dark:text-gray-400 dark:hover:text-gray-200"
                      >
                        {item.name}
                        <ChevronRight className="h-4 w-4 translate-x-0 transform opacity-0 transition-all duration-300 ease-out group-hover:translate-x-1 group-hover:opacity-100" />
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-2 border-t py-4 sm:flex sm:flex-row sm:items-center sm:justify-between">
          <div className="flex space-x-5 sm:mt-0 sm:justify-center">
            {footerSocials.map((social) => (
              <a
                key={social.name}
                href={social.href}
                className="fill-gray-500 text-gray-500 hover:fill-gray-900 hover:text-gray-900 dark:hover:fill-gray-600 dark:hover:text-gray-600"
              >
                {social.icon}
                <span className="sr-only">{social.name}</span>
              </a>
            ))}
          </div>
          <span className="text-sm text-gray-500 dark:text-gray-400 sm:text-center">
            Copyright © {new Date().getFullYear()}{' '}
            <a href="https://bolderresearch.com" className="cursor-pointer">
              Bolder Research, LLC
            </a>
            . All Rights Reserved.
          </span>
        </div>
      </div>
    </footer>
  )
}
