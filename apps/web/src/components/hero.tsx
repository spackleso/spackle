'use client'

import { Button } from '@/components/tailwindui/button'
import { motion } from 'framer-motion'

export function Hero() {
  return (
    <div className="mx-auto flex flex-col gap-y-10 text-center sm:px-6">
      <motion.div
        initial={{ opacity: 0, y: -25 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut', delay: 0 }}
      >
        <h1 className="font-display mx-auto text-4xl font-medium tracking-tight text-slate-900 dark:text-white sm:text-5xl">
          Spackle makes billing effortless
        </h1>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: -25 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut', delay: 0.1 }}
      >
        <p className="mx-auto max-w-xl text-xl leading-tight tracking-tight text-slate-600 dark:text-slate-400 sm:text-2xl">
          Meet the new billing abstraction loved by <br />
          engineering and sales, startups and enterprises.
        </p>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: -25 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut', delay: 0.2 }}
        className="flex w-full flex-row items-center justify-center gap-4"
      >
        <Button href="/signup" color="violet">
          Get Started
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
