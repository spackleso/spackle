import clsx from 'clsx'

import { Icon } from '@/components/Icon'

const styles = {
  note: {
    container:
      'bg-sky-50 dark:bg-slate-800/60 dark:ring-1 dark:ring-slate-300/10',
    title: 'text-sky-900 dark:text-sky-400',
    body: 'text-sky-800 [--tw-prose-background:theme(colors.sky.50)] prose-a:text-sky-900 prose-code:text-sky-900 dark:text-slate-300 dark:prose-code:text-slate-300',
  },
  warning: {
    container:
      'bg-amber-50 dark:bg-slate-800/60 dark:ring-1 dark:ring-slate-300/10',
    title: 'text-amber-900 dark:text-amber-500',
    body: 'text-amber-800 [--tw-prose-underline:theme(colors.amber.400)] [--tw-prose-background:theme(colors.amber.50)] prose-a:text-amber-900 prose-code:text-amber-900 dark:text-slate-300 dark:[--tw-prose-underline:theme(colors.sky.700)] dark:prose-code:text-slate-300',
  },
}

const icons = {
  note: (props: any) => <Icon icon="lightbulb" {...props} />,
  warning: (props: any) => <Icon icon="warning" color="amber" {...props} />,
}

export function Callout({ type = 'note', title, children }: any) {
  let IconComponent = icons[type as keyof typeof icons]

  return (
    <div
      className={clsx(
        'my-8 flex rounded-3xl p-6',
        styles[type as 'note' | 'warning'].container,
      )}
    >
      <IconComponent className="h-8 w-8 flex-none" />
      <div className="ml-4 flex-auto">
        <p
          className={clsx(
            'm-0 font-display text-xl',
            styles[type as 'note' | 'warning'].title,
          )}
        >
          {title}
        </p>
        <div
          className={clsx(
            'prose mt-2.5',
            styles[type as 'note' | 'warning'].body,
          )}
        >
          {children}
        </div>
      </div>
    </div>
  )
}
