import { ReactNode } from 'react'
import { Button } from './button'

export function NavLink({
  href,
  children,
}: {
  href: string
  children: ReactNode
}) {
  return (
    <Button href={href} color="transparent" className="text-xs">
      {children}
    </Button>
  )
}
