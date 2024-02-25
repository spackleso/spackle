import { Bento } from '@/components/bento'
import Screenshot from '@/components/screenshot'
import { Hero } from '@/components/tailwindui/hero'
import CodeExample from '@/components/code-example'
import GridPattern from '@/components/magicui/grid-pattern'
import RadialGradient from '@/components/magicui/radial-gradient'
import FeaturePreview from '@/components/feature-preview'
import Workflows from '@/components/workflows'
import { cn } from '@/lib/utils'

export default function Home() {
  return (
    <>
      <main className="mt-40 flex flex-grow flex-col items-center justify-center gap-y-48 px-4">
        <div className="flex max-w-4xl items-center">
          <Hero />
        </div>

        <div className="mx-2 max-w-6xl">
          <Screenshot />
        </div>

        <div className="relative w-full py-72">
          <div className="mx-auto flex max-w-4xl flex-col items-center gap-8">
            <div className="flex flex-col gap-4 text-center">
              <p className="font-display mx-auto text-4xl font-medium tracking-tight text-slate-900 dark:text-white sm:text-5xl">
                Seamless integration
              </p>
              <p className="mx-auto max-w-2xl text-xl leading-tight tracking-tight text-slate-600 dark:text-slate-400 sm:text-2xl">
                Integrate with Stripe Billing in 3 lines of code. <br />
                Billing logic doesn&apos;t need to be complex.
              </p>
            </div>

            <div className="flex w-full flex-col items-center justify-center gap-8 sm:flex-row">
              <div className="text-center text-lg font-semibold text-white">
                <ul className="flex flex-col gap-y-2">
                  <li>No webhooks</li>
                  <li>No database tables</li>
                  <li>No code complexity</li>
                </ul>
              </div>
              <div className="border-1 flex max-w-md overflow-x-auto rounded-lg border border-slate-600 bg-black p-8 sm:max-w-full">
                <CodeExample />
              </div>
            </div>
          </div>

          <GridPattern
            width={32}
            height={32}
            x={-1}
            y={-1}
            className={cn(
              '[mask-image:radial-gradient(ellipse_at_center,transparent_0%,white_50%,transparent_80%)] ',
            )}
          />
        </div>

        <div className="mx-auto flex flex-col gap-8">
          <Workflows />
        </div>

        <div className="mx-auto flex max-w-4xl flex-col items-center gap-8">
          <p className="font-display mx-auto text-4xl font-medium tracking-tight text-slate-900 dark:text-white sm:text-5xl">
            Features
          </p>
          <p className="mx-auto max-w-4xl text-center text-xl leading-tight tracking-tight text-slate-600 dark:text-slate-400 sm:text-2xl">
            Spackle contains a collection of billing primitives that keeps
            complexity out of your codebase. Focus on your product, not billing.
          </p>
          <Bento />
        </div>
      </main>
    </>
  )
}
