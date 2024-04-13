'use client'

import { cn } from '@/lib/utils'
import { AnimatedBeam } from '@/components/magicui/animated-beam'
import React, { forwardRef, useRef } from 'react'
import { Logo } from './logo'
import { BillingIcon, CustomerIcon, PaymentIcon } from './stripe'
import { ServerIcon } from 'lucide-react'

const Circle = forwardRef<
  HTMLDivElement,
  { className?: string; children?: React.ReactNode }
>(({ className, children }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        'z-10 flex h-12 w-12 items-center justify-center rounded-full border-2 border-border bg-slate-900 p-3 shadow-[0_0_20px_-12px_rgba(0,0,0,0.8)]',
        className,
      )}
    >
      {children}
    </div>
  )
})

Circle.displayName = 'Circle'

export function Beam() {
  const containerRef = useRef<HTMLDivElement>(null)
  const div1Ref = useRef<HTMLDivElement>(null)
  const div2Ref = useRef<HTMLDivElement>(null)
  const div3Ref = useRef<HTMLDivElement>(null)
  const div4Ref = useRef<HTMLDivElement>(null)
  const div5Ref = useRef<HTMLDivElement>(null)

  return (
    <div
      className="relative flex w-full max-w-[680px] items-center justify-center overflow-hidden rounded-lg border bg-background py-10 px-16 md:shadow-2xl"
      ref={containerRef}
    >
      <div className="flex h-full w-full flex-row items-stretch justify-between gap-10">
        <div className="flex flex-col justify-center gap-8">
          <div className="flex flex-col items-center gap-2">
            <Circle ref={div1Ref}>
              <CustomerIcon />
            </Circle>
            <p className="text-xs text-slate-200">Customers</p>
          </div>
          <div className="flex flex-col items-center gap-2">
            <Circle ref={div2Ref}>
              <BillingIcon />
            </Circle>
            <p className="text-xs text-slate-200">Subscriptions</p>
          </div>
          <div className="flex flex-col items-center gap-2">
            <Circle ref={div3Ref}>
              <PaymentIcon />
            </Circle>
            <p className="text-xs text-slate-200">Payments</p>
          </div>
        </div>
        <div className="flex flex-col justify-center">
          <Circle ref={div4Ref} className="h-16 w-16">
            <Logo />
          </Circle>
        </div>
        <div className="flex flex-col justify-center mt-4">
          <div className="flex flex-col items-center gap-2">
            <Circle ref={div5Ref}>
              <ServerIcon />
            </Circle>
            <p className="text-xs text-slate-200">Your App</p>
          </div>
        </div>
      </div>

      <AnimatedBeam
        containerRef={containerRef}
        fromRef={div1Ref}
        toRef={div4Ref}
      />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={div2Ref}
        toRef={div4Ref}
      />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={div3Ref}
        toRef={div4Ref}
      />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={div4Ref}
        toRef={div5Ref}
      />
    </div>
  )
}
