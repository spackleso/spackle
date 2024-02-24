'use client'

import Image from 'next/image'
import { BorderBeam } from '@/components/magicui/border-beam'

const Screenshot = () => {
  return (
    <div className="relative rounded-lg">
      <Image
        src="/screenshot.png"
        alt="Spackle Screenshot"
        width={3024 / 2}
        height={1888 / 2}
      />
      <BorderBeam duration={8} size={300} />
      <BorderBeam duration={8} size={300} delay={2} />
      <BorderBeam duration={8} size={300} delay={4} />
      <BorderBeam duration={8} size={300} delay={6} />
      <div className="absolute left-0 top-0 h-full w-full bg-gradient-to-b from-transparent to-black/100"></div>
    </div>
  )
}

export default Screenshot
