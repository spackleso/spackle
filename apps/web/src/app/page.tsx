import Screenshot from '@/components/screenshot'
import { Hero } from '@/components/hero'
import CodeExample from '@/components/code-example'
import GridPattern from '@/components/magicui/grid-pattern'
import Workflows from '@/components/workflows'
import { cn } from '@/lib/utils'
import { Beam } from '@/components/beam'
import DotPattern from '@/components/magicui/dot-pattern'
import { GitHubLogoIcon } from '@radix-ui/react-icons'
import { ChevronRight } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'

export default function Home() {
  return (
    <>
      <main className="mt-16 flex flex-grow flex-col items-center justify-center gap-y-24 px-4">
        <div className="flex flex-col gap-y-24 items-center justify-center">
          <Hero />
          <div className="mx-auto max-w-6xl">
            <Screenshot />
          </div>
        </div>
        <div className="mx-auto flex flex-col gap-8 text-center justify-center items-center w-full">
          <p className="font-display mx-auto text-4xl font-medium tracking-tight text-slate-900 dark:text-white sm:text-5xl">
            Don&apos;t let billing code
            <br /> slow you down
          </p>
          <p className="mx-auto max-w-2xl text-lg leading-tight tracking-tight text-slate-600 dark:text-slate-400 md:text-2xl">
            Spackle decouples your billing code from your application so you can
            focus on delivering and capturing value.
          </p>
          <div className="flex w-full my-8 justify-center">
            <Beam />
          </div>
        </div>
        <div className="relative w-full py-64">
          <div className="mx-auto flex max-w-4xl flex-col items-center gap-8">
            <div className="flex flex-col gap-4 text-center">
              <p className="font-display mx-auto text-4xl font-medium tracking-tight text-slate-900 dark:text-white sm:text-5xl">
                Seamless integration
              </p>
              <p className="mx-auto max-w-2xl text-lg leading-tight tracking-tight text-slate-600 dark:text-slate-400 md:text-2xl">
                Replace your entire billing implementation
                <br />
                with just 3 lines of code
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
              <div className="border-1 flex max-w-xs overflow-x-auto rounded-lg border border-slate-600 bg-black p-8 sm:max-w-full">
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

        <div className="relative w-full flex flex-col gap-4 py-10 justify-center items-center">
          <GitHubLogoIcon className="mx-auto w-12 h-12 text-black dark:text-white" />
          <div className="flex flex-col gap-2">
            <p className="font-display mx-auto text-4xl font-medium tracking-tight text-slate-900 dark:text-white sm:text-5xl">
              Open source
            </p>
            <p className="mt-2 text-center">
              Spackle is open source. If you find it useful, please consider
              starring the project on GitHub.
            </p>
          </div>
          <a
            href="https://github.com/spackleso/spackle"
            className={cn(
              buttonVariants({
                size: 'lg',
                variant: 'outline',
              }),
              'group rounded-[2rem] px-6',
            )}
          >
            Star on GitHub
            <ChevronRight className="ml-1 size-4 transition-all duration-300 ease-out group-hover:translate-x-1" />
          </a>
          <DotPattern
            width={20}
            height={20}
            cx={1}
            cy={1}
            cr={1}
            className={cn(
              '[mask-image:linear-gradient(to_bottom_right,white,white_2%,transparent)] ',
            )}
          />
        </div>
      </main>
    </>
  )
}
