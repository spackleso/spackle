import { BentoDemo } from '@/components/bento'
import { BorderBeam } from '@/components/magicui/border-beam'
import { Hero } from '@/components/tailwindui/hero'
import Image from 'next/image'

export default function Home() {
  return (
    <>
      <main className="mt-12 flex flex-grow flex-col items-center justify-center gap-y-32 py-24">
        <div className="max-w-4xl">
          <Hero />
        </div>

        <div className="relative mx-3 max-w-6xl rounded-lg">
          <Image
            src="/screenshot.png"
            alt="Spackle Screenshot"
            width={3024 / 2}
            height={1888 / 2}
          />
          <BorderBeam />
        </div>

        <div className="flex max-w-4xl flex-row items-center gap-2">
          <BentoDemo />
        </div>
      </main>
    </>
  )
}
