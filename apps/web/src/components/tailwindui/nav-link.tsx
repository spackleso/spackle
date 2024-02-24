import Link from 'next/link'
import { ReactNode } from 'react'

export function NavLink({
  href,
  children,
}: {
  href: string
  children: ReactNode
}) {
  return (
    <Link
      href={href}
      className="flex flex-row items-center gap-1 text-sm font-semibold hover:text-slate-900 dark:hover:text-slate-100"
    >
      {children}
    </Link>
  )
}
