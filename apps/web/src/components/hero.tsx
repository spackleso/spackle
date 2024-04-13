'use client'

import { Button } from '@/components/tailwindui/button'
import { motion } from 'framer-motion'
import TextShimmer from '@/components/magicui/text-shimmer'
import { ArrowRightIcon } from 'lucide-react'
import { GitHubLogoIcon } from '@radix-ui/react-icons'
import Link from 'next/link'
import { cn } from '@/lib/utils'

export function Hero() {
  return (
    <div className="mx-auto flex flex-col gap-y-10 text-center sm:px-6">
      <motion.div
        initial={{ opacity: 0, y: -25 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut', delay: 0 }}
      >
        <div className="z-10 flex items-center justify-center">
          <Link href="https://www.github.com/spackleso/spackle">
            <div
              className={cn(
                'group rounded-full border border-black/5 bg-slate-100 text-base text-white transition-all ease-in hover:cursor-pointer hover:bg-slate-200 dark:border-white/5 dark:bg-slate-900 dark:hover:bg-slate-800',
              )}
            >
              <TextShimmer className="inline-flex items-center justify-center px-4 py-1">
                <GitHubLogoIcon className="mr-3" /> Star on GitHub
                <ArrowRightIcon className="size-3 ml-2 transition-transform duration-300 ease-in-out group-hover:translate-x-0.5" />
              </TextShimmer>
            </div>
          </Link>
        </div>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: -25 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut', delay: 0.1 }}
      >
        <h1 className="font-display mx-auto text-4xl font-medium tracking-tight text-slate-900 dark:text-white sm:text-5xl">
          Like Feature Flags,
          <br />
          But for Billing.
        </h1>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: -25 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut', delay: 0.2 }}
      >
        <p className="mx-auto max-w-xl text-lg leading-tight tracking-tight text-slate-600 dark:text-slate-400 md:text-2xl">
          Unlock iterative pricing, enterprise sales, and engineering
          productivity with Spackle entitlements.
        </p>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: -25 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut', delay: 0.3 }}
        className="flex w-full flex-row items-center justify-center gap-4"
      >
        <Button href="/signup" color="violet">
          Start For Free
        </Button>
        <Button
          href="https://savvycal.com/bolderresearch/spackle"
          color="transparent"
        >
          Schedule a Demo →
        </Button>
      </motion.div>
    </div>
  )
}
