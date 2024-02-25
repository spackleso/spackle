import {
  CloudArrowUpIcon,
  LockClosedIcon,
  ServerIcon,
  ArrowPathIcon,
  BuildingOffice2Icon,
  SparklesIcon,
} from '@heroicons/react/20/solid'
import Image from 'next/image'

// <li>Iterative Pricing</li>
// <li>Enterprise Sales</li>
// <li>One-Off Experiences</li>

const features = [
  {
    name: 'Iterative Pricing.',
    description:
      "Your product is not the same as when you launched, your pricing shouldn't be either. Spackle allows you to iterate on your pricing like you do your product.",
    icon: ArrowPathIcon,
  },
  {
    name: 'Enterprise Sales.',
    description:
      'Closing enterprise deals is difficult enough. Spackle makes implementation simple. No engineering required.',
    icon: BuildingOffice2Icon,
  },
  {
    name: 'One-Off Experiences.',
    description:
      'Certain customers require a unique experience. Instead of cluttering your codebase with if statements, Spackle allows you to craft the perfect experience without code.',
    icon: SparklesIcon,
  },
]

export default function Workflows() {
  return (
    <div className="overflow-hidden py-24 text-white sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto grid max-w-2xl grid-cols-1 gap-x-8 gap-y-16 sm:gap-y-20 lg:mx-0 lg:max-w-none lg:grid-cols-2">
          <div className="lg:ml-auto lg:pl-4 lg:pt-4">
            <div className="lg:max-w-lg">
              <h2 className="font-semibold leading-7 text-violet-600">
                Better Recurring Billing
              </h2>
              <p className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
                Unlock new billing workflows
              </p>
              <p className="mt-6 text-lg leading-8 text-slate-400">
                Spackle untangles the complexity of billing from your codebase.
                This allows you to stay nimble, iterate quickly, and close more
                deals.
              </p>
              <dl className="mt-10 max-w-xl space-y-8 text-base leading-7 text-slate-400 lg:max-w-none">
                {features.map((feature) => (
                  <div key={feature.name} className="relative pl-9">
                    <dt className="inline font-semibold">
                      <feature.icon
                        className="absolute left-1 top-1 h-5 w-5 text-violet-600"
                        aria-hidden="true"
                      />
                      {feature.name}
                    </dt>{' '}
                    <dd className="inline">{feature.description}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
          <div className="flex items-center justify-center lg:order-first lg:items-start lg:justify-end">
            <Image
              src="/screenshot-closeup.png"
              alt="Spackle screenshot cropped"
              className="w-[36rem] max-w-none rounded-xl shadow-xl ring-1 ring-gray-400/10 sm:w-[36rem]"
              width={2432}
              height={1442}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
