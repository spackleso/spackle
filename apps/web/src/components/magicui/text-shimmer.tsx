import { cn } from '@/lib/utils'
import { CSSProperties, FC, ReactNode } from 'react'

interface TextShimmerProps {
  children: ReactNode
  className?: string
  shimmerWidth?: number
}

const TextShimmer: FC<TextShimmerProps> = ({
  children,
  className,
  shimmerWidth = 100,
}) => {
  return (
    <p
      style={
        {
          '--shimmer-width': `${shimmerWidth}px`,
        } as CSSProperties
      }
      className={cn(
        'mx-auto max-w-md text-slate-600/50 dark:text-slate-300/50',

        // Shimmer effect
        'animate-shimmer bg-clip-text bg-no-repeat [background-position:0_0] [background-size:var(--shimmer-width)_100%] [transition:background-position_1s_cubic-bezier(.6,.6,0,1)_infinite]',

        // Shimmer gradient
        'bg-gradient-to-r from-slate-100 via-black/80 via-50% to-slate-100 dark:from-slate-900 dark:via-white/80 dark:to-slate-900',

        className,
      )}
    >
      {children}
    </p>
  )
}

export default TextShimmer
