"use client"

import { useEffect, useState } from "react"

import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Image from "next/image"
import { HomeHeroContent } from "@lib/data/home-content"

const AUTOPLAY_MS = 6000

const FALLBACK_KICKER = "Buy more, save more"
const FALLBACK_HEADING = "PREMIUM METAL ART FOR ANIME FANS"
const FALLBACK_SUBHEADING =
  "Transform your walls into a modern gallery today. Waterproof, scratch-proof, built to outlast every marathon."

const linkHref = (
  linkType: HomeHeroContent["link_type"],
  linkValue: string | null
) => {
  if (linkType === "none" || !linkValue) {
    return null
  }
  return linkType === "collection"
    ? `/collections/${linkValue}`
    : `/categories/${linkValue}`
}

const Hero = ({ slides }: { slides: HomeHeroContent[] }) => {
  const [activeIndex, setActiveIndex] = useState(0)
  const hasSlides = slides.length > 0

  useEffect(() => {
    if (slides.length < 2) {
      return
    }

    const timer = setInterval(() => {
      setActiveIndex((current) => (current + 1) % slides.length)
    }, AUTOPLAY_MS)

    return () => clearInterval(timer)
  }, [slides.length])

  const slide = hasSlides ? slides[Math.min(activeIndex, slides.length - 1)] : null
  const kicker = slide?.kicker?.trim() || FALLBACK_KICKER
  const heading = slide ? slide.heading : hasSlides ? null : FALLBACK_HEADING
  const subheading = slide ? slide.subheading : hasSlides ? null : FALLBACK_SUBHEADING
  const href = slide ? linkHref(slide.link_type, slide.link_value) : null

  return (
    <div className="relative h-[75vh] min-h-[520px] w-full overflow-hidden bg-metal-black">
      {hasSlides ? (
        slides.map((s, index) => (
          <Image
            key={s.id}
            src={s.image_url}
            alt={s.heading ?? "Hero banner"}
            fill
            priority={index === 0}
            sizes="100vw"
            className={`object-cover object-center transition-opacity duration-1000 ease-in-out ${
              index === activeIndex ? "opacity-100" : "opacity-0"
            }`}
          />
        ))
      ) : (
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_900px_500px_at_78%_30%,rgba(244,196,48,0.10),transparent_60%),linear-gradient(100deg,#050505_0%,#0d0c09_45%,#0a0a0a_100%)]" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-metal-black via-metal-black/50 to-metal-black/10" />

      <div className="absolute inset-0 flex items-center">
        <div className="content-container">
          <div className="ml-auto flex max-w-xl flex-col items-end gap-5 text-right">
            <span className="font-mono-brand text-xs font-bold uppercase tracking-[0.14em] text-metal-gold">
              {kicker}
            </span>
            {heading && (
              <h1
                className="font-display text-5xl leading-[0.98] text-metal-cream small:text-[64px]"
                style={{ textShadow: "0 0 40px rgba(244,196,48,0.12)" }}
              >
                {heading}
              </h1>
            )}
            {subheading && (
              <p className="max-w-[420px] text-base font-medium text-metal-cream/70">
                {subheading}
              </p>
            )}
            {href && (
              <LocalizedClientLink
                href={href}
                className="mt-1 inline-flex items-center gap-2.5 rounded-md bg-metal-gold px-8 py-4 font-mono-brand text-sm font-bold tracking-wide text-metal-black shadow-[0_10px_30px_rgba(244,196,48,0.3)] transition-transform hover:-translate-y-0.5"
              >
                Shop Now
                <svg
                  viewBox="0 0 20 20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-4 w-4"
                >
                  <path d="M4 10h11M11 5l5 5-5 5" />
                </svg>
              </LocalizedClientLink>
            )}
          </div>
        </div>
      </div>

      {slides.length > 1 && (
        <div className="absolute bottom-6 left-1/2 z-10 flex -translate-x-1/2 gap-2">
          {slides.map((s, index) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setActiveIndex(index)}
              aria-label={`Go to slide ${index + 1}`}
              className={`h-1.5 rounded-full transition-all ${
                index === activeIndex
                  ? "w-6 bg-metal-gold"
                  : "w-1.5 bg-metal-cream/40 hover:bg-metal-cream/70"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default Hero
