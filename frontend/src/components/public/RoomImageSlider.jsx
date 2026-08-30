import { useState, useRef, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Camera } from 'lucide-react'

// Banques d'images d'hôtels Unsplash haute définition par catégorie
export const ROOM_GALLERIES = {
  STANDARD: [
    'https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=800&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1595576508898-0ad5c879a061?w=800&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&q=80&auto=format&fit=crop',
  ],
  DELUXE: [
    'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1591088398332-8a7791972843?w=800&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=800&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&q=80&auto=format&fit=crop',
  ],
  SUITE: [
    'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=800&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1590490359683-658d3d23f972?w=800&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80&auto=format&fit=crop',
  ],
  FAMILY: [
    'https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?w=800&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=800&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1595576508898-0ad5c879a061?w=800&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=800&q=80&auto=format&fit=crop',
  ],
  PRESIDENTIAL: [
    'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&q=80&auto=format&fit=crop',
  ],
}

/**
 * Récupère une liste de photos pour une chambre donnée
 */
export function getRoomImages(room) {
  if (!room) return ROOM_GALLERIES.STANDARD

  const parseUrls = (value) => {
    if (!value) return []
    if (Array.isArray(value)) {
      return value
        .flatMap((item) => String(item ?? '').split(/\n|,/))
        .map((item) => item.trim())
        .filter(Boolean)
    }

    return String(value)
      .split(/\n|,/) 
      .map((item) => item.trim())
      .filter(Boolean)
  }

  const uploadedImages = [...new Set(
    [...parseUrls(room.image_urls), ...parseUrls(room.image_url)]
      .map((url) => url.trim())
      .filter(Boolean)
  )]

  if (uploadedImages.length > 0) {
    return uploadedImages
  }

  if (room.image_url) {
    return [room.image_url, ...ROOM_GALLERIES.STANDARD.slice(1)]
  }

  const rawType = (room.room_type || room.type || 'STANDARD').toUpperCase()
  let pool = ROOM_GALLERIES.STANDARD

  if (rawType.includes('DELUXE')) pool = ROOM_GALLERIES.DELUXE
  else if (rawType.includes('SUITE') || rawType.includes('VIP')) pool = ROOM_GALLERIES.SUITE
  else if (rawType.includes('FAMIL') || rawType.includes('TRIPLE') || rawType.includes('QUAD')) pool = ROOM_GALLERIES.FAMILY
  else if (rawType.includes('PRESIDENT')) pool = ROOM_GALLERIES.PRESIDENTIAL

  // Décalage déterministe pour que les chambres d'un même type n'aient pas toutes la même image en 1er
  const seedStr = String(room.room_number || room.number || room.room_id || room.id || '1')
  const offset = seedStr.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % pool.length

  return [...pool.slice(offset), ...pool.slice(0, offset)]
}

export default function RoomImageSlider({ room, className = 'h-52' }) {
  const images = getRoomImages(room)
  const [currentIndex, setCurrentIndex] = useState(0)
  const touchStartX = useRef(null)

  useEffect(() => {
    setCurrentIndex((prev) => Math.min(prev, Math.max(images.length - 1, 0)))
  }, [images.length])

  const roomType = room.room_type || room.type || 'Standard'
  const roomNumber = room.room_number || room.number
  const hotelName = room.hotel_name || room.tenant_name

  const handlePrev = (e) => {
    e.stopPropagation()
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1))
  }

  const handleNext = (e) => {
    e.stopPropagation()
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1))
  }

  const handleDotClick = (e, index) => {
    e.stopPropagation()
    setCurrentIndex(index)
  }

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX
  }

  const handleTouchEnd = (e) => {
    if (touchStartX.current === null) return
    const touchEndX = e.changedTouches[0].clientX
    const diff = touchStartX.current - touchEndX
    if (diff > 40) {
      // Swipe gauche -> image suivante
      setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1))
    } else if (diff < -40) {
      // Swipe droite -> image précédente
      setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1))
    }
    touchStartX.current = null
  }

  return (
    <div
      className={`relative w-full overflow-hidden bg-slate-900 select-none group/slider ${className}`}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Image active */}
      <img
        src={images[currentIndex]}
        alt={`Chambre ${roomNumber} - photo ${currentIndex + 1}`}
        className="w-full h-full object-cover transition-all duration-500 group-hover/slider:scale-105"
        loading="lazy"
        onError={(e) => {
          e.target.src = 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=800&q=80&auto=format&fit=crop'
        }}
      />

      {/* Dégradés pour lisibilité du texte */}
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/20 via-transparent to-slate-950/10 pointer-events-none" />

      {/* Flèches de navigation gauche / droite */}
      {images.length > 1 && (
        <>
          <button
            type="button"
            onClick={handlePrev}
            className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-slate-900/70 hover:bg-slate-900 text-white backdrop-blur-md border border-white/20 transition-all opacity-90 sm:opacity-0 group-hover/slider:opacity-100 hover:scale-110 active:scale-95 cursor-pointer z-20 shadow-md"
            aria-label="Photo précédente"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            type="button"
            onClick={handleNext}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-slate-900/70 hover:bg-slate-900 text-white backdrop-blur-md border border-white/20 transition-all opacity-90 sm:opacity-0 group-hover/slider:opacity-100 hover:scale-110 active:scale-95 cursor-pointer z-20 shadow-md"
            aria-label="Photo suivante"
          >
            <ChevronRight size={18} />
          </button>
        </>
      )}

      {/* Compteur de photos */}
      {images.length > 1 && (
        <div className="absolute bottom-3 right-3 z-10 pointer-events-none">
          <span className="px-2 py-0.5 rounded-full bg-black/55 backdrop-blur-md text-white/90 text-[10px] font-bold border border-white/15 flex items-center gap-1 shadow-xs">
            <Camera size={11} />
            {currentIndex + 1} / {images.length}
          </span>
        </div>
      )}

      {/* Points de pagination (Dots) */}
      {images.length > 1 && (
        <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-20">
          {images.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={(e) => handleDotClick(e, idx)}
              className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                currentIndex === idx
                  ? 'w-4 bg-white shadow-xs'
                  : 'w-1.5 bg-white/40 hover:bg-white/70'
              }`}
              aria-label={`Aller à la photo ${idx + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
