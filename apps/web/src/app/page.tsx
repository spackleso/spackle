import { BentoDemo } from '@/components/bento'
import { Hero } from '@/components/tailwindui/hero'

export default function Home() {
  return (
    <>
      <main className="flex flex-grow flex-col items-center justify-center gap-y-24">
        <Hero />

        <div className="flex max-w-4xl flex-row items-center gap-2">
          <BentoDemo />
        </div>
      </main>
    </>
  )
}
