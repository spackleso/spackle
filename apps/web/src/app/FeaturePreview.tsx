'use client'

import Toggle from '@/app/Toggle'
import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'

const CountUp = dynamic(() => import('react-countup'), {
  loading: () => <span>100</span>,
})

export default function FeaturePreview() {
  const [start, setStart] = useState(250)
  const [end, setEnd] = useState(100)
  const [enabled, setEnabled] = useState(false)

  useEffect(() => {
    const interval = setInterval(() => {
      setEnabled(!enabled)
      setStart(end)
      setEnd(start)
    }, 3000)

    return () => clearInterval(interval)
  }, [enabled, start, end, setEnabled, setStart, setEnd])

  return (
    <div className="mt-8 h-full rounded-lg bg-slate-50 p-16 shadow-xl dark:bg-black/30 md:mt-0">
      <div>
        <p className="flex flex-row text-xl font-semibold text-slate-600 dark:text-slate-500">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="mr-1 h-7 w-7"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z"
            />
          </svg>
          ACME Corp.
        </p>
        <p className="text-sm font-semibold text-slate-600 dark:text-slate-500">
          $500/month
        </p>
      </div>
      <div className="mt-6 flex flex-row space-x-8 font-semibold text-slate-600 dark:text-slate-500">
        <p>Landing Pages</p>
        <Toggle enabled={enabled} setEnabled={setEnabled} />
      </div>
      <div className="mt-4 flex w-full flex-row space-x-8 font-semibold text-slate-600 dark:text-slate-500">
        <p className="w-full whitespace-nowrap">Contact Limit</p>
        <p className="w-full text-right font-extrabold">
          <CountUp start={start} end={end} duration={0.5}>
            {({ countUpRef }) => <span ref={countUpRef} />}
          </CountUp>
        </p>
      </div>
    </div>
  )
}
