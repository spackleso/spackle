import { BentoDemo } from '@/components/bento'
import { Hero } from '@/components/tailwindui/hero'

export default function Home() {
  return (
    <>
      <main className="mt-12 flex flex-grow flex-col items-center justify-center gap-y-32 py-24">
        <div className="max-w-4xl">
          <Hero />
        </div>

        <div className="flex max-w-4xl flex-row items-center gap-2">
          <BentoDemo />
        </div>
      </main>
    </>
  )
}
