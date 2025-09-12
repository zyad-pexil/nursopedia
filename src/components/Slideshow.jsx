import { useEffect, useState } from 'react'

// Simple slideshow that rotates through 5 images every 5 seconds
import img1 from '@/assets/1.webp'
import img2 from '@/assets/2.webp'
import img3 from '@/assets/3.webp'
import img4 from '@/assets/4.webp'
import img5 from '@/assets/5.webp'

const images = [img1, img2, img3, img4, img5]

export default function Slideshow() {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % images.length)
    }, 5000) // 5 seconds
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="w-full mb-8">
      <div className="relative w-full h-56 sm:h-72 md:h-80 lg:h-96 overflow-hidden rounded-xl shadow-md bg-white">
        {images.map((src, i) => (
          <img
            key={i}
            src={src}
            alt={`slide-${i + 1}`}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${
              i === index ? 'opacity-100' : 'opacity-0'
            }`}
            loading={i === 0 ? 'eager' : 'lazy'}
          />
        ))}
      </div>
    </div>
  )
}