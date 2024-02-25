'use client'

import { Calendar } from '@/components/ui/calendar'
import { cn } from '@/lib/utils'
import { BentoCard, BentoGrid } from '@/components/magicui/bento-grid'
import Globe from '@/components/magicui/globe'
import Marquee from '@/components/magicui/marquee'
import {
  CalendarIcon,
  CheckCircledIcon,
  GlobeIcon,
  TableIcon,
  CheckIcon,
  Cross2Icon,
} from '@radix-ui/react-icons'
import FeaturePreview from '@/components/feature-preview'

const features = [
  {
    Icon: CheckCircledIcon,
    name: 'Entitlements',
    description: 'Control feature access at the product and customer level.',
    href: 'https://docs.spackle.so/entitlements',
    cta: 'Learn more',
    className: 'col-span-3 lg:col-span-1',
    background: (
      <div className="absolute left-10 top-10 [--duration:20s] [mask-image:linear-gradient(to_top,transparent,#000_15%)]">
        <FeaturePreview />
      </div>
    ),
  },
  {
    Icon: GlobeIcon,
    name: 'Globally distributed',
    description: 'Data is stored at the edge for low latency access.',
    className: 'col-span-3 lg:col-span-2',
    background: (
      <Globe className="top-0 h-[600px] w-[600px] transition-all duration-300 ease-out [mask-image:linear-gradient(to_top,transparent_30%,#000_100%)] group-hover:scale-105 sm:left-40" />
    ),
  },
  {
    Icon: TableIcon,
    name: 'Pricing Tables',
    description: 'Headless pricing tables for public and authenticated views.',
    href: 'https://docs.spackle.so/pricing-tables',
    cta: 'Learn more',
    className: 'col-span-3 lg:col-span-3',
    background: (
      <div className="absolute right-10 top-10 w-[80%] origin-top translate-x-0 transition-all duration-300 ease-out [mask-image:linear-gradient(to_top,transparent_10%,#000_100%)] group-hover:-translate-x-10">
        <div className="flex flex-row gap-2 text-xs">
          <div className="flex flex-1 flex-col gap-y-2 rounded-lg border p-4">
            <div>
              <p className="font-semibold">Starter</p>
              <p>$50/month</p>
            </div>
            <hr />
            <div className="flex flex-col gap-y-1">
              <div className="flex w-full flex-row justify-between">
                <p>Landing Pages</p>
                <Cross2Icon color="red" />
              </div>
              <div className="flex w-full flex-row justify-between">
                <p>Contacts</p>
                100
              </div>
              <div className="flex flex-row justify-between">
                <p>Emails</p>
                500
              </div>
            </div>
          </div>
          <div className="flex flex-1 flex-col gap-y-2 rounded-lg border p-4">
            <div>
              <p className="font-semibold">Standard</p>
              <p>$100/month</p>
            </div>
            <hr />
            <div className="flex flex-col gap-y-1">
              <div className="flex w-full flex-row justify-between">
                <p>Landing Pages</p>
                <CheckIcon color="green" />
              </div>
              <div className="flex w-full flex-row justify-between">
                <p>Contacts</p>
                500
              </div>
              <div className="flex flex-row justify-between">
                <p>Emails</p>
                <p>5,000</p>
              </div>
            </div>
          </div>
          <div className="flex flex-1 flex-col gap-y-2 rounded-lg border p-4">
            <div>
              <p className="font-semibold">Pro</p>
              <p>$250/month</p>
            </div>
            <hr />
            <div className="flex flex-col gap-y-1">
              <div className="flex w-full flex-row justify-between">
                <p>Landing Pages</p>
                <CheckIcon color="green" />
              </div>
              <div className="flex w-full flex-row justify-between">
                <p>Contacts</p>
                <p>∞</p>
              </div>
              <div className="flex flex-row justify-between">
                <p>Emails</p>
                <p>10,000</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    ),
  },
]

export function Bento() {
  return (
    <BentoGrid>
      {features.map((feature, idx) => (
        <BentoCard key={idx} {...feature} />
      ))}
    </BentoGrid>
  )
}
