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
      className="inline-block rounded-lg py-1 px-2 text-sm text-slate-700 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-100 dark:bg-slate-900 hover:dark:bg-slate-800"
    >
      {children}
    </Link>
  )
}
