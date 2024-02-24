'use client'

import Image from 'next/image'
import { useRef, useState } from 'react'
import { BorderBeam } from '@/components/magicui/border-beam'
import { motion, useMotionValueEvent, useScroll } from 'framer-motion'

const Screenshot = () => {
  const ref = useRef(null)
  const [opacity, setOpacity] = useState(0.2)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['2 2', '0.6 0.6'],
    axis: 'y',
  })

  useMotionValueEvent(scrollYProgress, 'change', (latest) => {
    setOpacity(Math.min(latest + 0.2))
  })

  return (
    <div ref={ref} className="relative rounded-lg">
      <motion.div style={{ opacity }}>
        <Image
          src="/screenshot.png"
          alt="Spackle Screenshot"
          width={3024 / 2}
          height={1888 / 2}
        />
      </motion.div>
      <BorderBeam duration={8} size={300} />
      <BorderBeam duration={8} size={300} delay={2} />
      <BorderBeam duration={8} size={300} delay={4} />
      <BorderBeam duration={8} size={300} delay={6} />
    </div>
  )
}

export default Screenshot
