import Link from 'next/link'
import clsx from 'clsx'

const baseStyles: { [key: string]: any } = {
  solid:
    'group inline-flex items-center justify-center rounded-full py-2 px-4 text-sm font-semibold focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2',
  outline:
    'group inline-flex ring-1 items-center justify-center rounded-full py-2 px-4 text-sm focus:outline-none',
}

const variantStyles: { [key: string]: any } = {
  solid: {
    slate:
      'bg-slate-900 text-white hover:bg-slate-700 hover:text-slate-100 active:bg-slate-800 active:text-slate-300 focus-visible:outline-slate-900',
    blue: 'bg-blue-600 text-white hover:text-slate-100 hover:bg-blue-500 active:bg-blue-800 active:text-blue-100 focus-visible:outline-blue-600',
    white:
      'bg-white text-slate-900 hover:bg-blue-50 active:bg-blue-200 active:text-slate-600 focus-visible:outline-white',
    violet:
      'bg-violet-600 text-white hover:bg-violet-500 active:bg-violet-800 active:text-violet-100 focus-visible:outline-violet-600',
    transparent:
      'bg-transparent dark:text-white hover:bg-slate-100 hover:text-slate-800 dark:hover:bg-slate-800 active:bg-slate-200 active:text-slate-600 focus-visible:outline-slate-900',
  },
  outline: {
    slate:
      'ring-slate-200 text-slate-700 hover:text-slate-900 hover:ring-slate-300 active:bg-slate-100 active:text-slate-600 focus-visible:outline-blue-600 focus-visible:ring-slate-300',
    white:
      'ring-slate-700 text-white hover:ring-slate-500 active:ring-slate-700 active:text-slate-400 focus-visible:outline-white',
    violet:
      'ring-violet-600 text-violet-600 hover:ring-violet-500 active:ring-violet-800 active:text-violet-100 focus-visible:outline-violet-600',
    transparent:
      'ring-transparent dark:text-slate-700 hover:ring-slate-300 active:ring-slate-200 active:text-slate-600 focus-visible:outline-slate-900',
  },
}

export function Button({
  variant = 'solid',
  color = 'slate',
  href,
  className,
  children,
  ...props
}: any) {
  className = clsx(
    baseStyles[variant],
    variantStyles[variant][color],
    className,
  )

  return href ? (
    <Link href={href} className={className} {...props}>
      {children}
    </Link>
  ) : (
    <button className={className} {...props} />
  )
}
