import clsx from 'clsx'

export function Container({ className, ...props }: any) {
  return (
    <div
      className={clsx('mx-auto max-w-3xl px-4 sm:px-6 lg:px-8', className)}
      {...props}
    />
  )
}
