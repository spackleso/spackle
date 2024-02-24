import { BentoDemo } from '@/components/bento'
import { BorderBeam } from '@/components/magicui/border-beam'
import Screenshot from '@/components/screenshot'
import { Hero } from '@/components/tailwindui/hero'
import Image from 'next/image'

export default function Home() {
  return (
    <>
      <main className="mt-24 flex flex-grow flex-col items-center justify-center gap-y-32 px-4">
        <div className="flex max-w-4xl items-center">
          <Hero />
        </div>

        <div className="mx-2 max-w-6xl">
          <Screenshot />
        </div>

        <div className="mx-auto flex max-w-4xl flex-row items-center gap-2">
          <BentoDemo />
        </div>
      </main>
    </>
  )
}
