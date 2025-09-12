import { useEffect, useState } from 'react'

import img1 from '@/assets/1.webp'
import img2 from '@/assets/2.webp'
import img3 from '@/assets/3.webp'
import img4 from '@/assets/4.webp'
import img5 from '@/assets/5.webp'

const images = [img1, img2, img3, img4, img5]

export default function BackgroundSlideshow() {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % images.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="fixed inset-0 -z-10">
      {/* Current background image */}
      <div
        className="absolute inset-0 bg-cover bg-center transition-opacity duration-700"
        style={{ backgroundImage: `url(${images[index]})` }}
      />
      {/* Subtle overlay for readability */}
      <div className="absolute inset-0 bg-black/30" />
    </div>
  )
}